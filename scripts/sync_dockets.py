"""Pull new docket entries from CourtListener and append them to the
data/dockets/*-entries.yaml files. Run by .github/workflows/sync-dockets.yml.

Appends every new entry, regardless of importance. Each row still gets an
`importance` label ('high' | 'medium' | 'low') from docket_classifier so the
docket page's importance filter can sort them — but nothing is dropped.
(Earlier versions dropped `low` rows such as notices of appearance, pro hac
vice, and clerk's notices; we now pull everything *that carries a docket entry
number*.) Two things are skipped: a genuinely empty RSS phantom row (no
description and no attached documents), and — on the trial-court docket
(ndcal) — rows CourtListener exposes with no entry number at all. Those
null-entry-number rows are utility/RSS artifacts (case assignment, clerk's
notices, consolidated "Motion Hearing AND Order on ..." restatements) that
merely duplicate the numbered entries; the curated docket tracks numbered
entries only.

When CourtListener hasn't populated an entry's `description` yet (common for
same-day filings), the text is taken from the attached documents instead, so
the entry still classifies and renders correctly rather than coming in blank.

Also refreshes data/dockets/recap-status.json so the docket pages can show the
"PDF not in RECAP" indicator on new rows.

Does not touch entries that already exist (matched by entry_number for the
trial court, by document number then description for appellate). De-duping by
entry_number alone on ndcal means distinct filings that share a description —
several "Pro Hac Vice" motions, say — are never collapsed, which the older
description-fallback path got wrong. Preserves manual `notes:` annotations on
existing entries — only appends, never rewrites in-place.

Env: COURTLISTENER_TOKEN required.

Run locally:
    COURTLISTENER_TOKEN=xxx python3 scripts/sync_dockets.py
    COURTLISTENER_TOKEN=xxx python3 scripts/sync_dockets.py --dry-run
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from datetime import date
from pathlib import Path

try:
    import yaml
    import requests
except ImportError as e:
    print(f"missing dep: {e} (pip install pyyaml requests)", file=sys.stderr)
    sys.exit(1)

from docket_classifier import classify  # shared with build_docket_yaml.py


class QuotedStr(str):
    """A string that always serializes single-quoted.

    Appellate document numbers can have leading zeros (e.g. ``01208856734``).
    PyYAML doesn't treat those as numbers and so writes them unquoted, but the
    site's JS YAML loader *does* read an unquoted leading-zero token as a
    number — which then crashes the static build when it calls a string method
    on the `entry` field. Forcing quotes keeps the value a string everywhere.
    """


def _represent_quoted(dumper: "yaml.Dumper", data: QuotedStr):
    return dumper.represent_scalar("tag:yaml.org,2002:str", str(data), style="'")


yaml.add_representer(QuotedStr, _represent_quoted, Dumper=yaml.SafeDumper)

ROOT = Path(__file__).resolve().parent.parent
DATA_DOCKETS = ROOT / "data" / "dockets"

DOCKET_IDS = {
    "ndcal": 72379655,
    "dccir": 72380208,
    "ca9": 73136734,
}
CL_API = "https://www.courtlistener.com/api/rest/v4"


def auth_headers() -> dict[str, str]:
    tok = os.environ.get("COURTLISTENER_TOKEN")
    if not tok:
        print("COURTLISTENER_TOKEN required", file=sys.stderr)
        sys.exit(1)
    return {
        "Accept": "application/json",
        "Authorization": f"Token {tok}",
        "User-Agent": "anthropic-v-dow-sync (vanderbilt-ai-law-lab)",
    }


def get_with_backoff(url: str, max_attempts: int = 5) -> dict | None:
    delay = 1.5
    for attempt in range(1, max_attempts + 1):
        r = requests.get(url, headers=auth_headers(), timeout=30)
        if r.status_code == 429:
            wait = float(r.headers.get("Retry-After") or delay)
            print(f"    429 — sleep {wait:.0f}s ({attempt}/{max_attempts})", file=sys.stderr)
            time.sleep(wait)
            delay *= 2
            continue
        if not r.ok:
            print(f"    HTTP {r.status_code}: {r.text[:200]}", file=sys.stderr)
            return None
        return r.json()
    return None


def iter_entries(docket_id: int):
    url = f"{CL_API}/docket-entries/?docket={docket_id}&order_by=date_filed&page_size=50"
    while url:
        data = get_with_backoff(url)
        if not data:
            return
        for e in data.get("results", []):
            yield e
        url = data.get("next")
        if url:
            time.sleep(0.6)


def desc_key(text: str) -> str:
    s = re.sub(r"\s+", " ", (text or "")).strip().lower()
    s = re.sub(r"\[\d+(?:-\d+)?\]", "", s)
    return re.sub(r"\s+", " ", s).strip()[:80]


def short_description(text: str, width: int = 220) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= width:
        return text
    return text[: width - 1].rstrip() + "…"


def load_existing(court: str) -> list[dict]:
    path = DATA_DOCKETS / f"{court}-entries.yaml"
    if not path.exists():
        return []
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or []
    return data


def already_present(
    entry: dict,
    court: str,
    existing_ens: set[str],
    existing_docs: set[str],
    existing_descs: set[str],
) -> bool:
    """Is this CourtListener entry already in the YAML?

    Trial court (ndcal): match by entry number only. It is stable and unique,
    so two genuinely distinct filings that happen to share a description (e.g.
    several same-day "Pro Hac Vice" motions) are never collapsed.

    Appellate (dccir, ca9): match by document number, then — using the
    *effective* description so freshly-filed rows whose text lives on the
    attached document still match — by description key.
    """
    if court == "ndcal":
        en = entry.get("entry_number")
        return en is not None and str(en) in existing_ens
    for d in entry.get("recap_documents") or []:
        dn = d.get("document_number")
        if dn and (dn in existing_docs or (dn.lstrip("0") or "0") in existing_docs):
            return True
    dk = desc_key(effective_description(entry))
    return bool(dk) and dk in existing_descs


def effective_description(entry: dict) -> str:
    """Entry-level description, or a fallback built from the attached documents.

    Freshly-filed entries (and RSS-sourced rows) often arrive with an empty
    `description` while the meaningful text sits on `recap_documents`. Reading
    only the entry field would mislabel them `low` and — under the old
    medium/high filter — silently drop them (e.g. a Notice of Filing the
    certified administrative-record index would vanish from the tracker).
    """
    desc = re.sub(r"\s+", " ", (entry.get("description") or "")).strip()
    if desc:
        return desc
    parts: list[str] = []
    for d in entry.get("recap_documents") or []:
        t = (d.get("description") or "").strip()
        if t and t.lower() not in ("main document", "document"):
            parts.append(t)
    return " — ".join(dict.fromkeys(parts))  # de-dupe, preserve order


def build_new_row(entry: dict, court: str, importance: str) -> dict:
    """Build a YAML row mirroring the schema in data/dockets/*-entries.yaml."""
    docs = entry.get("recap_documents") or []
    chosen = next((d for d in docs if d.get("is_available")), docs[0] if docs else None)
    if court == "ndcal":
        entry_id = (
            str(entry.get("entry_number"))
            if entry.get("entry_number") is not None
            else (chosen.get("document_number") if chosen else None)
        )
    else:
        entry_id = chosen.get("document_number") if chosen else None
    row: dict = {
        # QuotedStr so leading-zero document numbers never serialize unquoted
        # (an unquoted 01208856734 is read back as a number and breaks the build).
        "entry": QuotedStr(entry_id) if entry_id is not None else None,
        "date": entry.get("date_filed"),
        "description": short_description(effective_description(entry)),
        "importance": importance,
    }
    document_titles = [
        {"title": (d.get("description") or "").strip() or "Document"}
        for d in docs
        if d.get("description")
    ]
    if document_titles:
        row["documents"] = document_titles
    return row


def append_yaml(court: str, new_rows: list[dict]) -> None:
    path = DATA_DOCKETS / f"{court}-entries.yaml"
    existing_text = path.read_text(encoding="utf-8") if path.exists() else ""
    # Find a clean place to append: end of file, ensure a trailing newline.
    if existing_text and not existing_text.endswith("\n"):
        existing_text += "\n"
    if not existing_text.endswith("# Auto-appended below by scripts/sync_dockets.py.\n"):
        existing_text += (
            f"\n# --- Auto-appended below by scripts/sync_dockets.py "
            f"on {date.today().isoformat()} ---\n"
        )
    yaml_dump = yaml.safe_dump(
        new_rows,
        sort_keys=False,
        allow_unicode=True,
        width=200,
        default_flow_style=False,
    )
    path.write_text(existing_text + yaml_dump, encoding="utf-8")


# --- recap-status sidecar refresh (mirror check_recap.py logic) ---

def status_from_entry(entry: dict) -> dict:
    docs = entry.get("recap_documents") or []
    if not docs:
        return {"available": False, "reason": "no recap_documents"}
    chosen = next((d for d in docs if d.get("is_available")), docs[0])
    return {
        "available": bool(chosen.get("is_available")) and bool(chosen.get("filepath_local")),
        "is_available_flag": bool(chosen.get("is_available")),
        "filepath_local": bool(chosen.get("filepath_local")),
        "document_number": chosen.get("document_number"),
        "page_count": chosen.get("page_count"),
        "file_size": chosen.get("file_size"),
    }


def keys_for_entry(entry: dict, court: str) -> list[str]:
    keys: list[str] = []
    if court in ("ndcal", "ca9"):
        en = entry.get("entry_number")
        if en is not None:
            keys.append(f"{court}-{en}")
    for d in entry.get("recap_documents") or []:
        dn = d.get("document_number")
        if dn:
            keys.append(f"{court}-doc:{dn.lstrip('0') or '0'}")
            keys.append(f"{court}-doc:{dn}")
    dk = desc_key(entry.get("description") or "")
    if dk:
        keys.append(f"{court}-d:{dk}")
    return keys


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="Print what would be appended, don't write.")
    ap.add_argument("--court", choices=list(DOCKET_IDS))
    args = ap.parse_args()

    courts = [args.court] if args.court else list(DOCKET_IDS)
    sidecar: dict[str, dict] = {}
    sidecar_path = DATA_DOCKETS / "recap-status.json"
    if sidecar_path.exists():
        sidecar = json.loads(sidecar_path.read_text(encoding="utf-8"))

    total_added = 0
    for court in courts:
        existing = load_existing(court)
        existing_ens = {str(e.get("entry")) for e in existing if e.get("entry") not in (None, "")}
        existing_docs: set[str] = set()
        for e in existing:
            v = e.get("entry")
            if v not in (None, ""):
                s = str(v)
                existing_docs.update({s, s.lstrip("0") or "0"})
        existing_descs = {desc_key(e.get("description") or "") for e in existing if e.get("description")}
        existing_descs.discard("")

        new_rows: list[dict] = []
        scanned = 0
        for entry in iter_entries(DOCKET_IDS[court]):
            scanned += 1
            # Update sidecar for every entry, new or existing.
            status = status_from_entry(entry)
            for k in keys_for_entry(entry, court):
                if k in sidecar and sidecar[k].get("available") and not status["available"]:
                    continue
                sidecar[k] = status

            if already_present(entry, court, existing_ens, existing_docs, existing_descs):
                continue
            # Trial-court docket tracks numbered entries only. CourtListener
            # also exposes null-entry-number utility/RSS rows (case assignment,
            # clerk's notices, consolidated "Motion Hearing AND Order on ..."
            # restatements); those duplicate the numbered entries and, lacking
            # a stable id, used to be re-appended on every run. Skip them.
            if court == "ndcal" and entry.get("entry_number") is None:
                continue
            docs = entry.get("recap_documents") or []
            desc = effective_description(entry)
            # Skip only genuine RSS phantoms: no text and nothing attached.
            if not desc and not any((d.get("description") or "").strip() for d in docs):
                continue
            # Pull everything else — low-importance rows (notices, pro hac vice,
            # clerk's notices) are kept and labeled, not dropped.
            importance = classify(desc)
            new_rows.append(build_new_row(entry, court, importance))

        print(f"== {court}: {scanned} scanned, {len(new_rows)} new {','.join(sorted({r['importance'] for r in new_rows}))} to append")
        for r in new_rows:
            print(f"    + {r['date']}  #{r['entry']}  [{r['importance']}]  {r['description'][:100]}")
        if new_rows and not args.dry_run:
            append_yaml(court, new_rows)
            total_added += len(new_rows)

    if not args.dry_run:
        sidecar_path.write_text(json.dumps(sidecar, indent=2, sort_keys=True), encoding="utf-8")

    print(f"\nDone. {total_added} entries appended across all dockets.")


if __name__ == "__main__":
    main()
