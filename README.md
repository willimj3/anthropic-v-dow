# anthropic-v-dow

Explainer and tracker site for *Anthropic PBC v. U.S. Department of War* —
N.D. Cal. 3:26-cv-01996-RFL, D.C. Cir. 26-1049, 9th Cir. 26-2011.

Built and maintained by the Vanderbilt AI Law Lab. The site is file-driven:
every fact lives in YAML or MDX under `/data/` and `/content/`. Updates are
made by editing those files and committing.

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

Requires Node 20+.

---

## Editorial workflow

The site has no admin UI. Everything is committed text.

| Change | Where to edit |
|---|---|
| New docket entry | `data/dockets/<court>-entries.yaml` |
| New milestone (PI granted, decision issued, etc.) | `data/timeline.yaml` |
| Status shift in the dispute | `data/case-meta.yaml` → `status_summary` |
| Court ruling | `data/holdings.yaml` (+ relevant `data/issues.yaml` entry) |
| New commentary worth highlighting | `data/commentary.yaml` |
| News item promoted from auto-queue | flip `approved: true` in `data/news.yaml` |
| New section in the long-form explainer | `content/case/*.mdx` |
| Site-level changelog entry | `data/updates.yaml` |
| Anki deck refresh | edit `02-anki-deck.csv` |

After editing, commit and push to `main`. Vercel deploys on push.

---

## Repository layout

```
/
├─ app/                         Next.js App Router routes
│  └─ api/cron/                 Monitor cron handlers (disabled until reviewed)
├─ components/                  Shared React components
├─ content/                     Long-form MDX (the /case explainer)
├─ data/                        All structured content
│  ├─ case-meta.yaml            Top-level metadata
│  ├─ timeline.yaml             Vertical-timeline events
│  ├─ parties.yaml              Plaintiff, defendants, amici
│  ├─ claims.yaml               The five counts + status
│  ├─ issues.yaml               Doctrinal issues
│  ├─ holdings.yaml             What courts have decided
│  ├─ commentary.yaml           Annotated bibliography
│  ├─ news.yaml                 Auto-aggregated + curated
│  ├─ whats-next.yaml           Upcoming dates
│  ├─ alerts-config.yaml        Monitor configuration
│  ├─ updates.yaml              Site changelog
│  └─ dockets/                  Per-docket entry lists
├─ lib/                         YAML loaders, MDX helpers, monitor clients
├─ source-docs/                 Local mirror of complaint, PI opinion, etc.
├─ dockets/                     Raw RECAP TSVs (input to data/ population)
└─ public/                      Static assets
```

---

## Monitoring layer (disabled by default)

Two Vercel cron handlers exist but are **not active**. To enable:

1. Add `COURTLISTENER_TOKEN` (free from courtlistener.com) and an email
   provider key (`RESEND_API_KEY` *or* `POSTMARK_TOKEN`) to Vercel env vars.
2. Uncomment the `crons` array in `vercel.json`.
3. Push to `main`.

Both handlers refuse to run without the required env vars; they will not
silently no-op. See `lib/courtlistener.ts` and `lib/rss.ts`.

The monitors **do not auto-summarize** new filings — they only surface items
for human review. See `spec §11`.

---

## License

- **Code** — MIT. See `LICENSE-CODE`.
- **Prose** — CC-BY 4.0. See `LICENSE-CONTENT`.
- Reproduced court filings are public-domain government works or are mirrored
  under fair use.

---

## Sources

- `01-CASE-SUMMARY.md` — analytical memo across all three dockets
- `02-anki-deck.csv` — 54-card study deck (downloadable Anki import)
- `source-docs/01-complaint.txt`, `source-docs/134-pi-opinion.txt`
- `dockets/*.tsv` — RECAP docket sheets

CourtListener docket IDs: 72379655 (N.D. Cal.), 72380208 (D.C. Cir.),
73136734 (9th Cir.).
