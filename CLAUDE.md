# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Next.js dev server at http://localhost:3000
npm run build      # production build (also the gate that catches data/schema mismatches)
npm run start      # serve the production build
npm run lint       # next lint (ESLint 9 + eslint-config-next)
npm run typecheck  # tsc --noEmit
```

Python data scripts — use `python3` (not `python`). All are run from the repo root and depend on `pyyaml`; scripts that hit CourtListener also need `requests`:

```bash
python3 scripts/build_docket_yaml.py        # dockets/*.tsv  → data/dockets/*-entries.yaml (DESTRUCTIVE)
python3 scripts/build_study_guide.py        # 02-anki-deck.csv → data/study-guide.mdx (idempotent)
COURTLISTENER_TOKEN=xxx python3 scripts/sync_dockets.py [--dry-run] [--court ndcal|dccir|ca9]
COURTLISTENER_TOKEN=xxx python3 scripts/check_recap.py  [--court ndcal|dccir|ca9]
COURTLISTENER_TOKEN=xxx python3 scripts/fetch_pdfs.py   [--court ndcal|dccir|ca9]
```

`build_docket_yaml.py` overwrites existing YAMLs — do not re-run once manual `notes:` have been added. Hand-merge new TSV rows instead. `sync_dockets.py` only appends (never overwrites) and is what runs in production.

## Architecture

**File-driven Next.js 15 (App Router) + MDX site.** No CMS, no database. Every fact rendered is loaded from `data/*.yaml` or MDX at build time via `lib/data.ts`. Pages don't hardcode lists — they call a `loadX()` function.

### Data flow

1. `data/case-meta.yaml` is the top-level source of truth: case name, status summary, the three docket records (with CourtListener IDs).
2. Each docket has its own entry file at `data/dockets/{ndcal,dccir,ca9}-entries.yaml`. The three docket IDs (`ndcal`, `dccir`, `ca9`) are a closed enum used across `lib/data.ts`, the cron handlers, and the Python scripts — adding a fourth docket means touching all three.
3. `lib/data.ts` is the single YAML loader. It uses `yaml.JSON_SCHEMA` deliberately so ISO date strings like `2026-05-23` stay as strings instead of being auto-cast to JS `Date` (which breaks formatting). Reuse `readYaml<T>` rather than calling `js-yaml` directly.
4. `data/dockets/recap-status.json` is a sidecar that drives the "PDF not in RECAP" badge on docket pages. Produced by `scripts/check_recap.py` and refreshed by `scripts/sync_dockets.py`. `recapStatusFor()` looks up entries by `<court>-<entry>`, `<court>-doc:<docnum>`, and description-prefix hash, in that order. Optional — the site degrades gracefully if missing.

### Routes and content

The long-form case explainer is MDX at `components/CaseExplainer.mdx`, rendered inline on the home page (`app/page.tsx`) inside a two-column grid alongside the sticky `WhatsNextRail`. Data-driven pages — `/timeline`, `/dockets`, `/dockets/[id]`, `/parties`, `/law`, `/issues/[slug]`, `/press`, `/study-guide`, `/glossary`, `/documents`, `/updates`, `/about` — are `.tsx` and read from `data/`.

Two consolidated routes hold the bulk of the substance:

- **`/law`** — Holdings, Claims, Issues as one page with `#holdings`, `#claims`, `#issues` anchors. Per-issue detail pages still live at `/issues/[slug]` for deep-linking.
- **`/press`** — Commentary and News with `#commentary`, `#news` anchors.

`data/study-guide.mdx` is **generated** by `scripts/build_study_guide.py` from `02-anki-deck.csv`. Edit the CSV (or the script's section grouping), not the MDX.

Inline case-name and statute citations are auto-linked via `lib/citations.ts` + `<Prose linkify>` (Cornell LII for SCOTUS, eCFR for CFR, CourtListener search URLs for circuit cases). Add a new authority by adding a key to `AUTHORITIES`; longest-key wins so case names with subphrases sort correctly.

Path alias `@/*` resolves to the repo root, so imports look like `@/lib/data` and `@/components/SiteNav`.

### How the site updates

**Primary path — GitHub Actions daily sync.** `.github/workflows/sync-dockets.yml` runs `scripts/sync_dockets.py` at 11:00 UTC, classifies new CourtListener entries with the same heuristic as `build_docket_yaml.py`, appends only `medium`/`high` importance rows under a clearly-marked `# Auto-appended ...` divider in each `data/dockets/*-entries.yaml`, refreshes the recap-status sidecar, and pushes straight to `main`. Vercel auto-deploys on push. The workflow uses the built-in `GITHUB_TOKEN` for write access and requires only one repo secret: `COURTLISTENER_TOKEN`. Adding entries on a PR-review flow instead of straight to main means changing the final `git push` step to open a PR.

**Secondary path (parked) — Vercel cron monitors.** `app/api/cron/recap-poll/route.ts` and `news-poll/route.ts` exist but are not scheduled. `vercel.json` is intentionally minimal; the parked cron schedule lives in `vercel.cron.example.json` (Vercel's `vercel.json` schema rejects unknown properties, so the example can't sit inside it commented out). Both handlers fail closed via `app/api/cron/_shared.ts` — they require `CRON_SECRET` (Bearer auth) before doing anything.

Critical constraint: **Vercel's serverless filesystem is read-only at runtime.** Those Vercel monitors cannot write to `data/*.yaml`; they would open GitHub issues (`lib/github.ts`) and email a digest (`lib/email.ts`) instead. The GitHub Actions sync is preferred precisely because it can write to the repo directly. Don't refactor the Vercel handlers to "just write to the data files" — that pattern only works in the Actions runner, not in serverless functions.

Env vars the Vercel monitor layer would need: `CRON_SECRET`, `COURTLISTENER_TOKEN`, `GITHUB_TOKEN`, `GITHUB_REPO`, and one of `RESEND_API_KEY` / `POSTMARK_TOKEN`.

## Editorial conventions

- Every fact on the site must be traceable to a `data/` file. If you find yourself hardcoding a date, party name, or status in a component, move it to YAML and load it.
- Dates are ISO strings (`YYYY-MM-DD`), kept as strings end-to-end.
- `data/news.yaml` entries default to `approved: false` (hidden); promotion to the live site is a manual flip.
- Substantive site changes get an entry in `data/updates.yaml` (the `/updates` changelog).
- `data/glossary.yaml` defines the terms used elsewhere on the site; first-mention links in `components/CaseExplainer.mdx` and other prose point at `/glossary#<slug>`. New jargon → new glossary entry → first-mention link.
- Page-level container is `max-w-page` (84rem); reading-prose pages constrain themselves further with `max-w-prose` (68ch). Don't widen `max-w-prose` for readability reasons.
