"""Shared docket-entry importance heuristic.

Imported by both build_docket_yaml.py (one-time seed) and sync_dockets.py (the
daily GitHub Actions sync) so the classification stays identical across the two.
Returns 'high' | 'medium' | 'low'. Order matters: exclude (forces 'low'), then
high, then medium; unmatched is 'low'. First match within a tier wins.

Sibling import: both callers are run as `python3 scripts/<name>.py`, which puts
this directory on sys.path, so `from docket_classifier import classify` resolves.
"""

from __future__ import annotations

import re

HIGH_PATTERNS = [
    re.compile(p, re.IGNORECASE) for p in [
        r"\bopinion\b",
        r"\border granting\b",
        r"\border denying\b",
        r"\bjudgment\b",
        r"\bpreliminary injunction\b",
        r"\btemporary restraining order\b",
        r"\bmotion to stay\b.*\bpending\b",
        r"\bemergency motion\b",
        r"\bemergency stay\b",
        r"\bcomplaint\b",
        r"\bpetition for review\b",
        r"\bnotice of appeal\b",
        r"\bmotion for summary judgment\b",
        r"\bcross[- ]motion\b",
        r"\bsupplemental brief\b",
        r"\boral argument\b",
        r"\bopposition\b.*\b(stay|injunction|preliminary)\b",
        r"\breply\b.*\b(stay|injunction|preliminary)\b",
        r"\bresponse in opposition\b",
        r"\bper curiam order\b",
        r"\bmandamus\b",
    ]
]

EXCLUDE_PATTERNS = [
    re.compile(p, re.IGNORECASE) for p in [
        r"order on motion for pro hac vice",
        r"order granting.{0,5}motion for pro hac vice",
        r"order setting status",
        r"order setting briefing schedule",
        r"clerk.s notice",
        r"transcript order",
        r"notice of appearance",
        r"certified copy",
        r"docketing statement",
        r"summons issued",
        r"motion for pro hac vice",
        r"corporate disclosure",
        r"case opened",
        r"mediation questionnaire",
    ]
]

MEDIUM_PATTERNS = [
    re.compile(p, re.IGNORECASE) for p in [
        r"\bamicus\b",
        r"\bmotion\b",
        r"\bbrief\b",
        r"\border\b",
        r"\bstipulation\b",
        r"\bdeclaration\b",
        r"\bnotice\b",
        r"\badministrative record\b",
    ]
]


def classify(description: str) -> str:
    """Return 'high' | 'medium' | 'low'."""
    text = description or ""
    for pattern in EXCLUDE_PATTERNS:
        if pattern.search(text):
            return "low"
    for pattern in HIGH_PATTERNS:
        if pattern.search(text):
            return "high"
    for pattern in MEDIUM_PATTERNS:
        if pattern.search(text):
            return "medium"
    return "low"
