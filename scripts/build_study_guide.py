"""Generate data/study-guide.mdx from 02-anki-deck.csv.

Run from the project root:

    python3 scripts/build_study_guide.py

Idempotent — re-run any time the Anki CSV changes.
"""

from __future__ import annotations

import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "02-anki-deck.csv"
OUT_PATH = ROOT / "data" / "study-guide.mdx"

# Group cards by the second tag (after "stable"/"volatile") for thematic sections.
# Hand-curated section order; anything else goes under "Other".
SECTION_ORDER = [
    ("case-id", "Case identifiers"),
    ("procedural", "Procedural posture"),
    ("background", "Background"),
    ("facts", "Facts"),
    ("people", "People"),
    ("statutes", "Statutes"),
    ("regulations", "Regulations"),
    ("doctrine", "Doctrine"),
    ("first-amendment", "First Amendment"),
    ("due-process", "Due process"),
    ("apa", "APA / arbitrary-and-capricious"),
    ("pretext", "Pretext"),
    ("procurement", "Procurement law"),
    ("constitutional-theory", "Constitutional theory"),
    ("analog-cases", "Analogous cases"),
    ("ruling", "The PI ruling"),
    ("schedule", "Case schedule"),
    ("open-issues", "Open issues"),
    ("status", "Current status"),
    ("commentary", "Commentary"),
    ("watch", "What to watch"),
    ("scholars", "Scholars and commentators"),
    ("reaction", "Reactions"),
]

SECTION_LOOKUP = {key: title for key, title in SECTION_ORDER}


def primary_section(tags: list[str]) -> str:
    """Pick the most informative tag for sectioning."""
    # Skip "stable" / "volatile" / "anthropic-dow" — they aren't section tags.
    skip = {"stable", "volatile", "anthropic-dow"}
    for tag in tags:
        if tag in skip:
            continue
        if tag in SECTION_LOOKUP:
            return tag
    return "other"


def escape_mdx(text: str) -> str:
    """Minimal MDX escaping — preserve angle brackets that look like generics."""
    # Replace stand-alone HTML-ish tag patterns with backslash escape; keep §.
    text = text.replace("\r", "")
    return text


def main() -> None:
    if not CSV_PATH.exists():
        print(f"missing {CSV_PATH}", file=sys.stderr)
        sys.exit(1)

    grouped: dict[str, list[tuple[str, str, list[str]]]] = defaultdict(list)
    total = 0
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            front = (row.get("Front") or "").strip()
            back = (row.get("Back") or "").strip()
            tags_field = (row.get("Tags") or "").strip()
            tags = [t for t in re.split(r"\s+", tags_field) if t]
            if not front or not back:
                continue
            section = primary_section(tags)
            grouped[section].append((front, back, tags))
            total += 1

    lines: list[str] = []
    lines.append("---")
    lines.append('title: "Study guide"')
    lines.append('description: "Question-and-answer review of every doctrinal and factual point in the case, grouped by theme."')
    lines.append("---")
    lines.append("")
    lines.append("# Study guide")
    lines.append("")
    lines.append(
        f"Generated from the [Anki deck](/02-anki-deck.csv) maintained alongside this site "
        f"({total} cards). Each card carries a `stable` or `volatile` flag — volatile cards are "
        f"the ones most likely to change as the litigation moves."
    )
    lines.append("")
    lines.append(
        "Edit the underlying `02-anki-deck.csv` and re-run "
        "`python3 scripts/build_study_guide.py` to refresh this page."
    )
    lines.append("")

    rendered_sections = set()
    for key, title in SECTION_ORDER:
        cards = grouped.get(key)
        if not cards:
            continue
        rendered_sections.add(key)
        lines.append(f"## {title}")
        lines.append("")
        for front, back, tags in cards:
            flag = "volatile" if "volatile" in tags else "stable"
            lines.append('<details className="study-card">')
            lines.append(f'  <summary><span className="badge">{flag}</span> {escape_mdx(front)}</summary>')
            lines.append("")
            lines.append(f"  {escape_mdx(back)}")
            lines.append("")
            lines.append("</details>")
            lines.append("")
        lines.append("")

    other = [k for k in grouped if k not in rendered_sections]
    if other:
        lines.append("## Other")
        lines.append("")
        for key in other:
            for front, back, tags in grouped[key]:
                flag = "volatile" if "volatile" in tags else "stable"
                lines.append("<details>")
                lines.append(f'  <summary><span className="badge">{flag}</span> {escape_mdx(front)}</summary>')
                lines.append("")
                lines.append(f"  {escape_mdx(back)}")
                lines.append("")
                lines.append("</details>")
                lines.append("")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT_PATH} ({total} cards across {len(rendered_sections) + (1 if other else 0)} sections)")


if __name__ == "__main__":
    main()
