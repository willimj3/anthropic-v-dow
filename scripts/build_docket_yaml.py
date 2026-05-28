"""Generate data/dockets/<court>-entries.yaml from dockets/*.tsv.

Run from the project root:

    python3 scripts/build_docket_yaml.py

Re-running overwrites the YAML files. Once you start adding manual notes to
data/dockets/*-entries.yaml, do not re-run — instead, append new entries by
hand or merge selectively.
"""

from __future__ import annotations

import csv
import re
import sys
import textwrap
from pathlib import Path

try:
    import yaml  # PyYAML
except ImportError:
    print("PyYAML is required. Install with: pip3 install pyyaml", file=sys.stderr)
    sys.exit(1)

from docket_classifier import classify  # shared with sync_dockets.py

ROOT = Path(__file__).resolve().parent.parent
DOCKETS_TSV = ROOT / "dockets"
DOCKETS_YAML = ROOT / "data" / "dockets"

# CourtListener docket IDs (mirror data/case-meta.yaml)
DOCKET_IDS = {
    "ndcal": 72379655,
    "dccir": 72380208,
    "ca9": 73136734,
}


def parse_documents(field: str | None) -> list[dict[str, str]]:
    if not field:
        return []
    titles = [t.strip() for t in field.split("||") if t.strip()]
    return [{"title": t} for t in titles]


def short_description(text: str, *, width: int = 220) -> str:
    """Trim docket descriptions for the YAML; full text preserved in the source TSV."""
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= width:
        return text
    return text[: width - 1].rstrip() + "…"


def build_entries(tsv_path: Path, court: str) -> list[dict]:
    rows: list[dict] = []
    with tsv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            entry = (row.get("Entry") or "").strip()
            date = (row.get("Date") or "").strip()
            description = (row.get("Description") or "").strip()
            documents_field = row.get("Documents")
            if not description and not entry:
                continue

            importance = classify(description)
            record: dict = {
                "entry": entry or None,
                "date": date or None,
                "description": short_description(description),
                "importance": importance,
            }
            if documents_field:
                docs = parse_documents(documents_field)
                if docs:
                    record["documents"] = docs
            rows.append(record)
    return rows


def yaml_header(court: str, source: str) -> str:
    cl_url = f"https://www.courtlistener.com/docket/{DOCKET_IDS[court]}/"
    return textwrap.dedent(f"""\
        # Auto-generated from {source}.
        # Source of truth for descriptions: the underlying TSV in /dockets/.
        # Add manual notes by appending `notes:` keys to individual entries;
        # do not re-run scripts/build_docket_yaml.py after annotating, or your
        # notes will be overwritten.
        #
        # Importance heuristic: 'high' | 'medium' | 'low'. Reviewer should
        # promote/demote as needed.
        #
        # CourtListener docket: {cl_url}
        """)


def main() -> None:
    DOCKETS_YAML.mkdir(parents=True, exist_ok=True)

    sources = {
        "ndcal": DOCKETS_TSV / "ndcal-entries-full.tsv",
        "dccir": DOCKETS_TSV / "dccir-entries.tsv",
        "ca9": DOCKETS_TSV / "ninth-cir-entries.tsv",
    }

    for court, tsv_path in sources.items():
        if not tsv_path.exists():
            print(f"missing {tsv_path}", file=sys.stderr)
            sys.exit(1)
        entries = build_entries(tsv_path, court)
        out = DOCKETS_YAML / f"{court}-entries.yaml"
        with out.open("w", encoding="utf-8") as f:
            f.write(yaml_header(court, tsv_path.name))
            yaml.safe_dump(
                entries,
                f,
                sort_keys=False,
                allow_unicode=True,
                width=200,
                default_flow_style=False,
            )
        high = sum(1 for e in entries if e["importance"] == "high")
        med = sum(1 for e in entries if e["importance"] == "medium")
        low = sum(1 for e in entries if e["importance"] == "low")
        print(f"{court}: {len(entries)} entries -> {out.name}  (high={high}, med={med}, low={low})")


if __name__ == "__main__":
    main()
