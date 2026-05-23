"""Query CourtListener for which docket entries have RECAP PDFs available.

Writes a sidecar file `data/dockets/recap-status.json` keyed by
"<court>-<entry>" → { available: bool, document_number, page_count, file_size }.

The site reads this at build time to badge "PDF not yet in RECAP" on the
docket pages. Re-run any time; the file is regenerated from scratch.

Requires COURTLISTENER_TOKEN.

Usage:
    COURTLISTENER_TOKEN=xxxx python3 scripts/check_recap.py
    COURTLISTENER_TOKEN=xxxx python3 scripts/check_recap.py --court ndcal
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    print("requests required: pip3 install requests", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / "data" / "dockets" / "recap-status.json"

DOCKET_IDS = {
    "ndcal": 72379655,
    "dccir": 72380208,
    "ca9": 73136734,
}
CL_API = "https://www.courtlistener.com/api/rest/v4"


def auth_headers() -> dict[str, str]:
    h = {
        "Accept": "application/json",
        "User-Agent": "anthropic-v-dow-monitor (vanderbilt-ai-law-lab)",
    }
    tok = os.environ.get("COURTLISTENER_TOKEN")
    if tok:
        h["Authorization"] = f"Token {tok}"
    return h


def get_with_backoff(url: str, params: dict | None = None, max_attempts: int = 5) -> requests.Response | None:
    delay = 1.5
    for attempt in range(1, max_attempts + 1):
        r = requests.get(url, headers=auth_headers(), params=params, timeout=30)
        if r.status_code == 429:
            wait = float(r.headers.get("Retry-After") or delay)
            print(f"  429 — sleep {wait:.0f}s (attempt {attempt}/{max_attempts})", file=sys.stderr)
            time.sleep(wait)
            delay *= 2
            continue
        return r
    return None


def iter_entries(docket_id: int):
    url = f"{CL_API}/docket-entries/?docket={docket_id}&order_by=date_filed&page_size=50"
    while url:
        r = get_with_backoff(url)
        if not r or not r.ok:
            print(f"  list docket {docket_id}: HTTP {r.status_code if r else 'no response'}", file=sys.stderr)
            return
        data = r.json()
        for e in data.get("results", []):
            yield e
        url = data.get("next")
        if url:
            time.sleep(0.6)


def _desc_key(text: str) -> str:
    """Normalize a description to a short key for fuzzy match."""
    import re
    s = re.sub(r"\s+", " ", (text or "")).strip().lower()
    s = re.sub(r"\[\d+(?:-\d+)?\]", "", s)  # strip CL bracketed IDs like [2162687]
    s = re.sub(r"\s+", " ", s).strip()
    return s[:80]


def keys_for_entry(entry: dict, court: str) -> list[str]:
    """Return all the lookup keys we should index this entry under."""
    keys: list[str] = []
    if court == "ndcal" or court == "ca9":
        en = entry.get("entry_number")
        if en is not None:
            keys.append(f"{court}-{en}")
    docs = entry.get("recap_documents") or []
    for d in docs:
        dn = d.get("document_number")
        if dn:
            keys.append(f"{court}-doc:{dn.lstrip('0') or '0'}")
            keys.append(f"{court}-doc:{dn}")  # also the full leading-zero form
    desc = _desc_key(entry.get("description") or "")
    if desc:
        keys.append(f"{court}-d:{desc}")
    return keys


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


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--court", choices=list(DOCKET_IDS))
    args = ap.parse_args()

    courts = [args.court] if args.court else list(DOCKET_IDS)
    out: dict[str, dict] = {}
    existing: dict[str, dict] = {}
    if OUT_PATH.exists():
        existing = json.loads(OUT_PATH.read_text(encoding="utf-8"))

    # Preserve other-court entries from the existing file when --court is given.
    if args.court:
        for k, v in existing.items():
            if not k.startswith(f"{args.court}-"):
                out[k] = v

    for court in courts:
        print(f"\n== {court} ==")
        count = 0
        avail = 0
        for entry in iter_entries(DOCKET_IDS[court]):
            status = status_from_entry(entry)
            keys = keys_for_entry(entry, court)
            for k in keys:
                # Don't downgrade an existing 'available' to 'unavailable' due
                # to a later, less-favored docket entry with the same desc.
                if k in out and out[k].get("available") and not status["available"]:
                    continue
                out[k] = status
            count += 1
            if status["available"]:
                avail += 1
        print(f"  {court}: {count} entries, {avail} with available PDF")

    OUT_PATH.write_text(json.dumps(out, indent=2, sort_keys=True), encoding="utf-8")
    print(f"\nWrote {OUT_PATH} ({len(out)} entries)")


if __name__ == "__main__":
    main()
