# Claude Code Starter Prompt

Paste the prompt below into Claude Code, after opening this project folder as the working directory.

The prompt is self-contained — Claude Code will read the seed files and build the site against the spec. If it asks questions about anything in §12 of the spec (domain name, license, voice, email digest format), answer them; otherwise let it proceed.

---

## The prompt

```
Read the following files in this directory before doing anything else:

  00-README.md
  01-CASE-SUMMARY.md
  04-SITE-SPEC-FOR-CLAUDE-CODE.md
  02-anki-deck.csv
  source-docs/01-complaint.txt
  source-docs/134-pi-opinion.txt
  dockets/ndcal-entries-full.tsv
  dockets/dccir-entries.tsv
  dockets/ninth-cir-entries.tsv
  05-docket-alerts.md

Build the explainer site described in 04-SITE-SPEC-FOR-CLAUDE-CODE.md. Use the
materials I've listed as seed content — they are authoritative for facts about
the case. Where the spec calls for structured data (YAML/JSON), generate the
initial files from the seed material; where it calls for long-form prose
(/case, /study-guide), generate it from the case summary and the Anki deck.

Specific requirements:

1. Scaffold the Next.js (App Router, TypeScript, Tailwind) project at the root
   of this directory. Use a pnpm workspace if helpful; otherwise npm.
2. Populate every file in /data/ before stubbing routes. The site should be
   readable on first build, not empty templates.
3. Build the monitor cron jobs in /app/api/cron/ but keep them disabled
   (commented schedule in vercel.json) until I've reviewed them and added the
   Resend/Postmark API key.
4. Do NOT deploy to Vercel automatically. Stop after passing local `pnpm dev`
   and acceptance criteria §10 of the spec.
5. When you have a decision to make on anything in §12 of the spec (domain,
   license, editorial voice, email format), ask me. Otherwise proceed.
6. Download the underlying PDFs from CourtListener for the docket entries
   marked "high importance" in the spec's importance schema and put them in
   source-docs/. URLs are in the docket TSVs — use the CourtListener
   /docket/{id}/{entry}/ pattern.
7. Do not auto-summarize new docket entries or news items with AI. The pipeline
   should surface items for me to review, not pre-write content. See §11 of
   the spec.

When you finish, write a short SUMMARY.md at the project root listing:
- What you built
- What you skipped or stubbed
- What needs my decision before launch
- The commands I should run to start the dev server and to deploy

If anything in the spec is unclear, ask before guessing.
```

---

## After Claude Code finishes

1. Run `pnpm dev` (or `npm run dev`) locally and click through every route.
2. Review the auto-generated data files in `/data/`. Edit anything that looks off.
3. Add API keys to Vercel environment variables (`COURTLISTENER_TOKEN`, plus whichever email service you pick).
4. Connect the repo to Vercel and push to `main`.
5. Once you've reviewed the cron jobs, enable them in `vercel.json` and redeploy.

If Claude Code goes sideways or you want me to course-correct anything, reopen this Cowork session and tell me what's happening.
