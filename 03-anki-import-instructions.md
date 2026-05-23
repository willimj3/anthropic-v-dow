# Anki Import Instructions

The deck is in `02-anki-deck.csv`. It uses the **Basic (front/back)** note type with a third column for tags.

## Import into Anki

1. Open Anki → File → Import
2. Select `02-anki-deck.csv`
3. In the import dialog:
   - **Note Type:** Basic
   - **Deck:** Create a new deck called "Anthropic v. Department of War" (or pick an existing one)
   - **Field separator:** Comma
   - **Allow HTML in fields:** off
   - **Field 1 → Front, Field 2 → Back, Field 3 → Tags**
   - Tick **"First field is unique"** (off if you re-import after edits)
4. Click Import. You should see ~50 cards imported.

## About the tags

Each card carries one stability tag and one or more topic tags:

- `stable` — facts unlikely to change (statutory text, doctrinal rules, settled procedural history). Safe to keep long-term.
- `volatile` — facts about live procedural posture, panel composition, schedules, and pending rulings. **Re-check before relying on these after July 1, 2026.**

Topic tags include `anthropic-dow`, `doctrine`, `first-amendment`, `due-process`, `apa`, `pretext`, `procurement`, `commentary`, etc. — use these to study a single doctrinal area at a time.

## Retiring volatile cards as the case develops

When the D.C. Circuit rules (expected summer 2026), the 9th Circuit rules, or the N.D. Cal. summary-judgment hearing on July 30 produces a new order:

1. Browse → search `tag:volatile`
2. Suspend or delete cards whose facts have changed
3. Generate replacement cards from the updated record (the site spec in `04-SITE-SPEC-FOR-CLAUDE-CODE.md` includes a workflow for Claude Code to refresh the deck)

## Caveats

- A few cards rely on specific dates and panel compositions; double-check these against the live docket before quoting them.
- The Anki deck is a study aid, not a citation source. For any quoted holding or statutory text, verify against the source documents in `source-docs/` before relying on it in academic work.
