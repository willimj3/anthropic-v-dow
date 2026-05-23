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

Python data scripts — use `python3` (not `python`). All are run from the repo root and depend on `pyyaml`; the RECAP scripts also need `requests`:

```bash
python3 scripts/build_docket_yaml.py        # dockets/*.tsv  → data/dockets/*-entries.yaml (DESTRUCTIVE — see warning in file header)
python3 scripts/build_study_guide.py        # 02-anki-deck.csv → data/study-guide.mdx (idempotent)
COURTLISTENER_TOKEN=xxx python3 scripts/check_recap.py [--court ndcal|dccir|ca9]
COURTLISTENER_TOKEN=xxx python3 scripts/fetch_pdfs.py [--court ndcal|dccir|ca9]
```

`build_docket_yaml.py` overwrites existing YAMLs — do not re-run once manual `notes:` have been added to `data/dockets/*-entries.yaml`. Hand-merge new TSV rows instead.

## Architecture

**File-driven Next.js 15 (App Router) + MDX site.** There is no CMS and no database. Every fact rendered on the site is loaded from `data/*.yaml` or MDX at build/request time via `lib/data.ts`. Pages do not hardcode lists — they call a `loadX()` function.

### Data flow

1. `data/case-meta.yaml` is the top-level source of truth: case name, status summary, and the three docket records (with CourtListener IDs).
2. Each docket has its own entry file at `data/dockets/{ndcal,dccir,ca9}-entries.yaml`. The three docket IDs (`ndcal`, `dccir`, `ca9`) are a closed enum used across `lib/data.ts`, the cron handlers, and the Python scripts — adding a fourth docket means touching all three.
3. `lib/data.ts` is the single YAML loader. It uses `yaml.JSON_SCHEMA` deliberately so ISO date strings like `2026-05-23` stay as strings instead of being auto-cast to JS `Date` (which breaks formatting). Reuse the existing `readYaml<T>` helper rather than calling `js-yaml` directly.
4. `data/dockets/recap-status.json` is a sidecar produced by `scripts/check_recap.py`. `recapStatusFor()` in `lib/data.ts` looks up entries by `<court>-<entry>` keys, with description-based fallbacks; the file is optional and the site degrades gracefully if missing.

### Routes and content

Routes live under `app/`. The long-form case explainer is MDX at `components/CaseExplainer.mdx`, rendered inline on the home page (`app/page.tsx`). Data-driven pages (`/timeline`, `/dockets`, `/parties`, `/law`, `/issues/[slug]`, `/press`, `/study-guide`, `/glossary`, `/documents`, `/updates`, `/about`) are `.tsx` and read from `data/`. The doctrinal substance is consolidated under `/law` (with `#holdings`, `#claims`, `#issues` anchors); press coverage and commentary under `/press` (`#commentary`, `#news`). Per-issue detail pages survive at `/issues/[slug]` for deep-linking.

`data/study-guide.mdx` is **generated** by `scripts/build_study_guide.py` from `02-anki-deck.csv`. Edit the CSV (or the script's section grouping), not the MDX directly.

Path alias `@/*` resolves to the repo root (see `tsconfig.json`), so imports look like `@/lib/data` and `@/components/SiteNav`.

### Monitoring layer (disabled by default)

Two cron routes exist at `app/api/cron/recap-poll/route.ts` and `app/api/cron/news-poll/route.ts`. The Vercel cron schedule in `vercel.json` is intentionally parked under `_disabled_crons` until env vars are configured. Both handlers fail closed via `app/api/cron/_shared.ts` — they require `CRON_SECRET` (Bearer auth) and the cron's own required env vars before doing anything. They never silently no-op.

Critical constraint: **Vercel's serverless filesystem is read-only at runtime.** The monitors cannot write to `data/*.yaml`. Instead they open GitHub issues (`lib/github.ts`) for the maintainer to review and commit. Do not refactor them to "just write to the data files" — that pattern only works locally.

Env vars the monitor layer reads: `CRON_SECRET`, `COURTLISTENER_TOKEN`, `GITHUB_TOKEN`, `GITHUB_REPO`, and one of `RESEND_API_KEY` / `POSTMARK_TOKEN`.

## Editorial conventions

- Every fact on the site must be traceable to a `data/` file. If you find yourself hardcoding a date, party name, or status in a component, move it to YAML and load it.
- Dates are ISO strings (`YYYY-MM-DD`), kept as strings end-to-end.
- `data/news.yaml` entries default to `approved: false` (hidden) when added by the monitor; promotion to the live site is a manual flip.
- Substantive site changes get an entry in `data/updates.yaml` (the `/updates` changelog).
