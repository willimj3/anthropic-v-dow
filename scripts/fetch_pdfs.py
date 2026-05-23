"""Fetch high-importance PDFs from CourtListener into source-docs/.

For each docket entry in data/dockets/*-entries.yaml flagged `importance: high`,
this script:

  1. For trial-court dockets (ndcal): queries CourtListener's docket-entries
     endpoint by entry_number, then downloads the linked recap_document PDF.
  2. For appellate dockets (dccir, ca9): the "Entry" column in the TSV holds
     the recap_document ID directly — fetch the recap-document endpoint and
     download from filepath_local.

The PDF download URL is rewritten from `www.courtlistener.com/recap/...` to
`storage.courtlistener.com/recap/...`, which is publicly accessible (the www
host is CloudFront-gated and returns 403 even with auth).

Usage:

    # Anonymous (often blocked by CL — docket-entries returns 401)
    python3 scripts/fetch_pdfs.py

    # Authenticated (recommended — get a free token at
    # https://www.courtlistener.com/help/api/rest/#permissions)
    COURTLISTENER_TOKEN=xxxx python3 scripts/fetch_pdfs.py

    # Limit to one docket
    python3 scripts/fetch_pdfs.py --court ndcal

Idempotent. PDFs are .gitignored.
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

try:
    import yaml
except ImportError:
    print("PyYAML required: pip3 install pyyaml", file=sys.stderr)
    sys.exit(1)

try:
    import requests
except ImportError:
    print("requests required: pip3 install requests", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "source-docs"
SOURCE_DIR.mkdir(parents=True, exist_ok=True)

DOCKET_IDS = {
    "ndcal": 72379655,
    "dccir": 72380208,
    "ca9": 73136734,
}
TRIAL_COURTS = {"ndcal"}  # use entry_number lookup
APPELLATE_COURTS = {"dccir", "ca9"}  # use recap-document direct lookup

CL_API = "https://www.courtlistener.com/api/rest/v4"

HEADERS_BASE = {
    "Accept": "application/json",
    "User-Agent": "anthropic-v-dow-fetch (vanderbilt-ai-law-lab)",
}


def auth_headers() -> dict[str, str]:
    h = dict(HEADERS_BASE)
    tok = os.environ.get("COURTLISTENER_TOKEN")
    if tok:
        h["Authorization"] = f"Token {tok}"
    return h


def load_high_entries(court: str) -> list[dict]:
    path = ROOT / "data" / "dockets" / f"{court}-entries.yaml"
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    return [
        e for e in data
        if (e.get("importance") == "high")
        and e.get("entry")
        and e["entry"] != "-"
    ]


def get_with_backoff(url: str, *, params: dict | None = None, max_attempts: int = 5) -> requests.Response | None:
    """GET with exponential backoff on 429."""
    delay = 1.5
    for attempt in range(1, max_attempts + 1):
        r = requests.get(url, headers=auth_headers(), params=params, timeout=30)
        if r.status_code == 429:
            wait = float(r.headers.get("Retry-After") or delay)
            print(f"    429 — sleeping {wait:.0f}s (attempt {attempt}/{max_attempts})")
            time.sleep(wait)
            delay *= 2
            continue
        return r
    return None


def rewrite_to_storage(url: str) -> str:
    """The www host gates downloads with CloudFront; storage host is public.

    `filepath_local` from the CourtListener API is typically a path like
    `recap/gov.uscourts.cand.465515/gov.uscourts.cand.465515.1.0_5.pdf` —
    no scheme, no host. Prepend the storage host directly.
    """
    if url.startswith("http://") or url.startswith("https://"):
        return url.replace(
            "https://www.courtlistener.com/recap/",
            "https://storage.courtlistener.com/recap/",
            1,
        )
    return "https://storage.courtlistener.com/" + url.lstrip("/")


def download(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 0:
        return True
    # PDFs on the storage subdomain are public — do NOT send our token there.
    r = requests.get(url, headers={"User-Agent": HEADERS_BASE["User-Agent"]}, timeout=120, stream=True)
    if not r.ok:
        print(f"    failed {url} -> HTTP {r.status_code}", file=sys.stderr)
        return False
    with dest.open("wb") as f:
        for chunk in r.iter_content(64 * 1024):
            if chunk:
                f.write(chunk)
    return True


def fetch_trial_entry(docket_id: int, entry_number: str) -> dict | None:
    params = {"docket": str(docket_id), "entry_number": str(entry_number)}
    r = get_with_backoff(f"{CL_API}/docket-entries/", params=params)
    if not r or not r.ok:
        code = r.status_code if r else "no response"
        print(f"    entry {entry_number}: HTTP {code}", file=sys.stderr)
        return None
    results = r.json().get("results") or []
    return results[0] if results else None


def iter_docket_entries(docket_id: int):
    """Yield docket-entry records for a docket, following pagination."""
    url = f"{CL_API}/docket-entries/?docket={docket_id}&order_by=date_filed&page_size=50"
    while url:
        r = get_with_backoff(url)
        if not r or not r.ok:
            code = r.status_code if r else "no response"
            print(f"    list docket {docket_id}: HTTP {code}", file=sys.stderr)
            return
        data = r.json()
        for entry in data.get("results", []):
            yield entry
        url = data.get("next")
        if url:
            time.sleep(1.0)


def pick_main_doc(docs: list[dict]) -> dict | None:
    available = [d for d in docs if d.get("is_available")]
    pool = available or docs
    if not pool:
        return None
    pool.sort(key=lambda d: (d.get("attachment_number") or 0, d.get("document_number") or ""))
    return pool[0]


def process_trial(court: str) -> None:
    docket_id = DOCKET_IDS[court]
    entries = load_high_entries(court)
    print(f"\n== {court} ({len(entries)} high-importance entries) ==")
    for e in entries:
        entry_no = e["entry"]
        rec = fetch_trial_entry(docket_id, entry_no)
        time.sleep(0.8)
        if not rec:
            print(f"  #{entry_no}: lookup failed")
            continue
        docs = rec.get("recap_documents") or []
        chosen = pick_main_doc(docs)
        if not chosen:
            print(f"  #{entry_no}: no recap_documents")
            continue
        local = chosen.get("filepath_local")
        if not local:
            print(f"  #{entry_no}: doc {chosen.get('id')} not yet ingested in RECAP (filepath_local empty)")
            continue
        url = rewrite_to_storage(local)
        out = SOURCE_DIR / f"{court}-{entry_no}.pdf"
        if download(url, out):
            size = out.stat().st_size
            print(f"  #{entry_no}: {out.name} ({size:,} bytes)")


def process_appellate(court: str) -> None:
    """Appellate dockets (dccir, ca9): the TSV "Entry" column doesn't map
    cleanly to CourtListener IDs, so iterate every docket entry and download
    whatever has a filepath_local.
    """
    docket_id = DOCKET_IDS[court]
    print(f"\n== {court} (iterating all entries on docket {docket_id}) ==")
    downloaded = 0
    skipped = 0
    for entry in iter_docket_entries(docket_id):
        docs = entry.get("recap_documents") or []
        for doc in docs:
            local = doc.get("filepath_local")
            if not local:
                skipped += 1
                continue
            doc_num = doc.get("document_number") or doc.get("id")
            url = rewrite_to_storage(local)
            out = SOURCE_DIR / f"{court}-{doc_num}.pdf"
            if download(url, out):
                downloaded += 1
                size = out.stat().st_size
                desc = (entry.get("description") or "")[:80]
                print(f"  {out.name} ({size:,} bytes) — {desc}")
            time.sleep(0.5)
    print(f"  total: {downloaded} downloaded, {skipped} not in RECAP")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--court", choices=list(DOCKET_IDS), help="Only this court")
    args = ap.parse_args()

    courts = [args.court] if args.court else list(DOCKET_IDS)
    for court in courts:
        if court in TRIAL_COURTS:
            process_trial(court)
        else:
            process_appellate(court)


if __name__ == "__main__":
    main()
