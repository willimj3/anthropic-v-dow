# Build Spec: Anthropic v. Department of War — Explainer Site & Tracker

**For:** A coding agent (e.g., Claude Code) tasked with building a live explainer/tracker site for the Anthropic v. Department of War litigation.
**From:** Mark Williams (Vanderbilt Law / Vanderbilt AI Law Lab)
**Goal:** A maintainable, low-overhead, file-driven static site that explains the case, hosts a study guide, and updates as the litigation moves — with monitoring layered on top so the site never goes stale silently.

---

## 1. What you are building

A static site (Next.js + MDX, deployed on Vercel) that:

1. Explains the *Anthropic PBC v. U.S. Department of War* litigation across all three dockets to a reader who knows law but not this case.
2. Hosts a structured study guide (the issues, the doctrine, the open questions) tied to the underlying documents.
3. Is **driven by structured data files in the repo**, so updates are made by editing YAML/JSON or MDX and committing, never by touching templates.
4. Has a **monitoring layer** that polls CourtListener's RECAP API and a news RSS aggregator daily, opens GitHub issues when something new appears, and emails a digest.

The site should look more like a focused, edited explainer (think *SCOTUSblog* on a single case, or *Just Security*'s litigation trackers) than a dashboard. Quiet typography, plenty of whitespace, no novelty.

---

## 2. Tech stack and deployment

- **Framework:** Next.js 14+ (App Router) with TypeScript.
- **Content:** MDX for prose pages; YAML/JSON for structured data (timeline, parties, filings, claims, holdings).
- **Styling:** Tailwind CSS, with a serif body font (e.g., Source Serif Pro or Charter) and a system sans for UI chrome. Single accent color only.
- **Hosting:** Vercel (free tier, hobby plan). Serverless functions for the monitor jobs.
- **Repo:** GitHub. Use Vercel's GitHub integration for previews + production deploys on push to `main`.
- **Why this stack:** Mark is a non-developer who wants to update content by editing files. Next.js + MDX gives readable file-based content. Vercel gives free hosting + serverless cron without infra overhead. Tailwind keeps styling consistent without a design system to maintain.

**Hosting recommendation rationale:** GitHub Pages was the alternative; ruled out because it can't run the scheduled monitor jobs. Vercel's free tier handles both static hosting and the cron/serverless layer the alerting needs.

---

## 3. Information architecture

Routes:

```
/                          — Overview (1-page snapshot: where we are today)
/case                      — Full case explainer (the long read)
/timeline                  — Chronological timeline (data-driven)
/dockets                   — All three dockets at a glance
/dockets/[id]              — Individual docket detail
/parties                   — Plaintiff, defendants (all 18 agencies + officials), amici
/claims                    — The five counts; status of each
/issues                    — The doctrinal issues, with brief explainers
/issues/[slug]             — Per-issue page (e.g., /issues/first-amendment-retaliation)
/holdings                  — What courts have decided so far
/commentary                — Annotated bibliography of legal commentary
/news                      — Latest news, auto-aggregated, manually curated
/study-guide               — Study guide built for law students / lawyers learning the case
/documents                 — Index of source documents (links to CourtListener + local copies)
/updates                   — Reverse-chrono changelog of site updates
/about                     — Who, why, methodology, how to suggest a correction
```

Every page that is data-driven (`/timeline`, `/dockets`, `/parties`, `/claims`, `/news`) reads from a single source-of-truth file in `/data/`. No hardcoded lists in components.

---

## 4. Data model

Create a `/data/` directory at the repo root with these files. **Every fact on the site should be traceable to one of these files.**

### 4.1 `data/case-meta.yaml`

Top-level metadata about the dispute. One file, edited rarely.

```yaml
case_name: Anthropic PBC v. U.S. Department of War
short_name: Anthropic v. DoW
plaintiff: Anthropic PBC
filed: 2026-03-09
status_summary: |
  PI in force in N.D. Cal.; 9th Cir. appeal stayed pending D.C. Cir. decision
  after May 19, 2026 oral argument.
last_updated: 2026-05-23
dockets:
  - id: ndcal
    court: N.D. Cal.
    judge: Rita F. Lin
    case_no: 3:26-cv-01996-RFL
    courtlistener_id: 72379655
    courtlistener_url: https://www.courtlistener.com/docket/72379655/anthropic-pbc-v-us-department-of-war/
    status: PI granted; cross-MSJ scheduled
  - id: dccir
    court: D.C. Cir.
    case_no: 26-1049
    courtlistener_id: 72380208
    courtlistener_url: https://www.courtlistener.com/docket/72380208/anthropic-pbc-v-united-states-department-of-war/
    status: Oral argument 5/19/2026; supp. briefs due 6/4/2026
  - id: ca9
    court: 9th Cir.
    case_no: 26-2011
    courtlistener_id: 73136734
    courtlistener_url: https://www.courtlistener.com/docket/73136734/anthropic-pbc-v-united-states-department-of-war-et-al/
    status: Stayed 4/27/2026 pending D.C. Cir.
```

### 4.2 `data/timeline.yaml`

A flat list of events, each with a date, short description, kind, and links. The `/timeline` page renders this as a vertical timeline grouped by month.

```yaml
- date: 2025-09-05
  kind: background
  title: Department of Defense renamed Department of War
  detail: Exec. Order No. 14347, 90 Fed. Reg. 43893
  citation: 90 Fed. Reg. 43893

- date: 2026-02-24
  kind: dispute
  title: Hegseth issues 5pm Feb. 27 deadline to Anthropic
  detail: At meeting with Amodei/Heck, threatens both supply-chain risk designation
    and Defense Production Act invocation if Anthropic does not accept "all lawful use."

- date: 2026-02-27
  kind: government-action
  title: Presidential Directive
  detail: Trump posts on Truth Social directing all federal agencies to cease use of Anthropic technology
  source_url: https://truthsocial.com/@realDonaldTrump/posts/116144552969293195

# ... etc.
```

Use kinds: `background`, `dispute`, `government-action`, `litigation`, `ruling`, `commentary`. The site uses these to color-code.

### 4.3 `data/dockets/ndcal-entries.yaml` (and one per docket)

The full docket sheet. Auto-populated from CourtListener and manually annotated.

```yaml
- entry: 1
  date: 2026-03-09
  description: Complaint for Declaratory and Injunctive Relief
  documents:
    - title: Complaint
      url: https://www.courtlistener.com/docket/72379655/1/anthropic-pbc-v-us-department-of-war/
      local_path: source-docs/01-complaint.pdf
  importance: high
  notes: |
    Five counts: APA (§ 3252), APA (Hegseth Directive), Due Process,
    First Amendment retaliation, ultra vires (Presidential Directive).

- entry: 6
  date: 2026-03-09
  description: Motion for TRO, PI, and § 705 stay
  importance: high
  notes: Anthropic's primary substantive filing.

# ...
```

Each `documents[]` entry should have a stable URL (CourtListener) and an optional `local_path` for documents the maintainer has copies of locally.

### 4.4 `data/parties.yaml`

```yaml
plaintiff:
  name: Anthropic PBC
  type: Public benefit corporation
  state_of_incorporation: Delaware
  hq: San Francisco, CA
  counsel:
    - firm: Wilmer Cutler Pickering Hale and Dorr LLP
      lead: Michael J. Mongan
      role: Lead trial counsel (N.D. Cal.)
    - firm: Wilmer Cutler Pickering Hale and Dorr LLP
      lead: Kelly P. Dunbar
      role: Lead appellate counsel (D.C. Cir.)

defendants:
  - name: U.S. Department of War
    type: Federal agency
    official: Pete Hegseth (Secretary)
    role: Principal defendant; issued the Hegseth Directive and Supply Chain Designation
  # ... 17 other agencies and officials

amici:
  - name: Microsoft Corporation
    side: petitioner
    in: [ndcal, dccir]
  - name: Foundation for Individual Rights and Expression
    side: petitioner
    in: [ndcal, dccir]
  # ... etc.
  - name: Joel Thayer (America First Policy Institute)
    side: respondent
    in: [dccir]
```

### 4.5 `data/claims.yaml`

Each count from the complaint, with its current status.

```yaml
- count: I
  short: APA § 3252 — Supply Chain Designation
  full: APA challenges to the 10 U.S.C. § 3252 Supply Chain Designation as in
    excess of authority, contrary to law, and arbitrary and capricious.
  defendants: [Hegseth, Department of War]
  status: PI granted; final adjudication on summary judgment
  status_color: green
```

### 4.6 `data/issues.yaml`

The doctrinal issues with one-paragraph explainers. Each issue maps to a route `/issues/[slug]`.

```yaml
- slug: first-amendment-retaliation
  title: First Amendment retaliation
  doctrinal_framework: |
    Ariz. Students' Ass'n v. Ariz. Bd. of Regents three-prong test;
    Hartman v. Moore burden-shifting; NRA v. Vullo (2024) on government
    leverage of contracting power against disfavored speakers.
  status_at_pi: |
    Judge Lin found likelihood of success. Defendants did not dispute prong 2;
    prongs 1 and 3 supported by Trump/Hegseth's own contemporaneous statements
    and the Michael Memo's express reliance on Anthropic's press posture.
  open_questions: |
    Whether the Ninth Circuit applies the Pickering framework instead;
    whether retaliation analysis applies differently when the government
    acts as procurer rather than regulator.
```

### 4.7 `data/holdings.yaml`

Court orders and what they held, in chronological order.

### 4.8 `data/commentary.yaml`

The annotated bibliography of legal commentary and news. Each entry has author(s), publication, date, URL, summary, and a tag indicating whether it's `analysis`, `news`, or `brief`.

### 4.9 `data/study-guide.mdx`

Long-form MDX. Built from the Anki deck (`02-anki-deck.csv`) — a script reads the CSV and generates a study-guide page grouped by tag.

---

## 5. Pages — content specs

### 5.1 `/` Overview

Above the fold: case name, one-sentence status, last-updated date.

Below: three cards (one per docket) with court, case number, judge/panel, current status, link to docket page.

Below that: a "What's next" panel reading from a `data/whats-next.yaml` of upcoming dates (e.g., "June 4, 2026 — D.C. Cir. supplemental briefs due").

Footer: link to the full case explainer and the study guide.

### 5.2 `/case` Full case explainer

Long-form MDX page. Source content from `01-CASE-SUMMARY.md`. Should read like a Lawfare or *Just Security* article — well-edited prose, not bullet lists. Section anchors for: Background, The Three Challenged Actions, The Complaint, The PI Ruling, The D.C. Circuit Case, The Stayed 9th Circuit Appeal, Commentary Landscape, What to Watch.

### 5.3 `/timeline`

Vertical timeline, generated from `data/timeline.yaml`, grouped by month with sticky month headers. Each event card shows date, title, detail, source link if any. Color-coded by `kind`. Filter chips at top: All / Background / Dispute / Government Action / Litigation / Ruling / Commentary.

### 5.4 `/dockets` and `/dockets/[id]`

`/dockets` shows the three dockets as cards with current status.

`/dockets/[id]` shows the full docket sheet: filter by date range, importance, party, free-text search. Each entry expands to show document links (CourtListener + any local PDF). "High importance" entries (PI motion, opposition, reply, PI order, key briefs) are flagged.

### 5.5 `/issues/[slug]`

Per-issue deep dive. Pulls from `data/issues.yaml`. Each page should include: doctrinal framework with key cited authorities, the specific facts that engage the issue here, the court's analysis (with quotes), what's left open, links to relevant commentary.

### 5.6 `/study-guide`

Auto-generated from `02-anki-deck.csv`. Groups cards by tag, renders Q/A pairs as expandable disclosure widgets. Includes a link at top to download the CSV for Anki import.

### 5.7 `/news` and `/commentary`

`/commentary` is curated — manual entries in `data/commentary.yaml`.
`/news` is semi-automated — the monitor job appends to `data/news.yaml`; entries below a relevance threshold are saved but hidden until manually approved (a `approved: true` field). This prevents the page from getting filled with spam or off-topic Anthropic stories.

### 5.8 `/updates`

A changelog page. Generated from Git commit history filtered to commits whose message starts with `update:` or from a `data/updates.yaml` file. Each entry: date, what changed, link to the relevant page.

---

## 6. The monitoring layer

This is the part that keeps the site fresh. Implement as Vercel scheduled functions ("cron jobs").

### 6.1 CourtListener RECAP monitor (`/api/cron/recap-poll`)

**Schedule:** Daily at 6:00 a.m. Central Time.

**What it does:**
1. For each docket ID in `data/case-meta.yaml`, call CourtListener's API for docket entries dated since the last successful run (track via `data/.last-poll.json`).
2. For each new entry, build a structured record: entry number, date, description, recap_document IDs.
3. Append to the corresponding `data/dockets/[id]-entries.yaml`.
4. For "high signal" entries (orders, opinions, oppositions, replies, motions for PI/MSJ, notices of appeal), open a GitHub issue tagged `new-filing` with the entry details and a checklist (annotate importance, summarize, link from timeline if relevant).
5. Send a daily digest email via Resend or Postmark.

**Authentication:** CourtListener requires a free API token. Store as `COURTLISTENER_TOKEN` in Vercel env vars.

**Failure mode:** if the API fails, the script must (a) not corrupt `data/.last-poll.json`; (b) open a GitHub issue tagged `monitor-failure`.

### 6.2 News & commentary RSS monitor (`/api/cron/news-poll`)

**Schedule:** Daily at 7:00 a.m. Central Time.

**Sources:**
- Lawfare main feed (filter: posts containing "Anthropic" or "Department of War" or "supply chain risk")
- Just Security main feed (same filter)
- Volokh Conspiracy / Reason (same filter)
- Google News RSS for queries: `"Anthropic" "Department of War"` and `"Anthropic" "Hegseth" "supply chain"`
- SCOTUSblog (in case of cert filings down the line)

**What it does:**
1. Pull new items since last run.
2. Score for relevance: must mention both "Anthropic" and one of {"Department of War", "Hegseth", "supply chain", "FASCSA", "Judge Lin"}.
3. Items above threshold are added to `data/news.yaml` with `approved: false`.
4. Once a week (Mondays), email a summary of unapproved items so Mark can promote interesting ones to approved.

### 6.3 Configuration

Put all alert configuration in `data/alerts-config.yaml`:

```yaml
recipients:
  - mark.j.williams@vanderbilt.edu
sources:
  rss:
    - https://www.lawfaremedia.org/feed
    - https://www.justsecurity.org/feed/
    - # ...
high_signal_descriptions:
  - regex: '(?i)\b(opinion|order)\b'
  - regex: '(?i)preliminary injunction'
  - regex: '(?i)motion for summary judgment'
  - regex: '(?i)petition for'
  - regex: '(?i)notice of appeal'
```

---

## 7. Repository layout

```
/
├─ README.md                    (this file, slightly trimmed)
├─ next.config.js
├─ package.json
├─ tailwind.config.ts
├─ tsconfig.json
├─ app/                         (Next.js App Router)
│  ├─ layout.tsx
│  ├─ page.tsx                  (/)
│  ├─ case/page.tsx
│  ├─ timeline/page.tsx
│  ├─ dockets/page.tsx
│  ├─ dockets/[id]/page.tsx
│  ├─ parties/page.tsx
│  ├─ claims/page.tsx
│  ├─ issues/page.tsx
│  ├─ issues/[slug]/page.tsx
│  ├─ holdings/page.tsx
│  ├─ commentary/page.tsx
│  ├─ news/page.tsx
│  ├─ study-guide/page.tsx
│  ├─ documents/page.tsx
│  ├─ updates/page.tsx
│  ├─ about/page.tsx
│  └─ api/
│     └─ cron/
│        ├─ recap-poll/route.ts
│        └─ news-poll/route.ts
├─ components/                  (shared React components)
├─ lib/                         (data loaders, RSS parser, CL client)
├─ data/                        (all content)
│  ├─ case-meta.yaml
│  ├─ timeline.yaml
│  ├─ parties.yaml
│  ├─ claims.yaml
│  ├─ issues.yaml
│  ├─ holdings.yaml
│  ├─ commentary.yaml
│  ├─ news.yaml
│  ├─ whats-next.yaml
│  ├─ alerts-config.yaml
│  ├─ study-guide.mdx
│  ├─ updates.yaml
│  ├─ dockets/
│  │  ├─ ndcal-entries.yaml
│  │  ├─ dccir-entries.yaml
│  │  └─ ca9-entries.yaml
│  └─ .last-poll.json           (state for the monitor)
├─ source-docs/                 (local PDF mirror — gitignored if large)
├─ content/                     (long-form MDX articles, including /case)
└─ vercel.json                  (cron schedule config)
```

---

## 8. Migration from the existing files

Mark already has these in the project folder:

- `01-CASE-SUMMARY.md` — use as the source for `/case` (the long explainer). Convert to MDX, split into sections corresponding to the route's anchor headers.
- `02-anki-deck.csv` — read this at build time to generate `/study-guide`.
- `source-docs/01-complaint.txt`, `source-docs/134-pi-opinion.txt` — already extracted text. Add the actual PDFs (download from CourtListener URLs in `data/dockets/`) into `source-docs/`.

The build should fail loudly if any of these files are missing.

---

## 9. Editorial workflow (for Mark)

The point of the file-driven design is that updates do not require touching code. Mark's editing workflow:

1. **A new docket entry posts.** GitHub Action opens an issue. Mark reads it, decides if it matters, and either dismisses or:
   - Adds a manual note in `data/dockets/[id]-entries.yaml`
   - Updates `data/timeline.yaml` if it's a milestone
   - Updates `data/case-meta.yaml` → `status_summary` if posture has shifted
2. **A court rules.** Mark adds an entry to `data/holdings.yaml`, updates the relevant `data/issues.yaml` entry's `status_at_pi`/`current_status` field, updates `data/case-meta.yaml`, drafts a short paragraph in `data/updates.yaml`.
3. **New commentary appears.** Either the monitor catches it (review the auto-added entry) or Mark adds manually to `data/commentary.yaml`.
4. **Anki deck needs refreshing.** Mark edits `02-anki-deck.csv` directly. Site rebuild automatically refreshes the study guide.

All commits push to `main`, Vercel auto-deploys.

---

## 10. Acceptance criteria for the coding agent

The agent should consider the build complete when:

1. All routes listed in §3 render without errors.
2. All data files in §4 are populated from the seed materials (case summary, complaint, PI order, docket entries, Anki deck) Mark has provided.
3. The CourtListener monitor successfully polls all three dockets, writes a sample entry, and opens a GitHub issue for a simulated high-signal filing. Daily cron schedule confirmed in Vercel dashboard.
4. The news monitor pulls from the configured RSS feeds and appends a relevant item to `data/news.yaml` with `approved: false`.
5. The study guide page renders all ~50 cards from the CSV, grouped by tag, with stable/volatile flags visible.
6. The site passes a Lighthouse accessibility audit at 95+.
7. README explains the editorial workflow plainly for a non-developer.

---

## 11. Things to deliberately NOT build

- No user accounts, comments, or social features.
- No on-site search at v1 (browser Ctrl-F is fine; revisit if the site grows).
- No analytics beyond Vercel's built-in.
- No automatic AI summarization of new filings — too much risk of subtly wrong summaries on a litigation tracker. Human in the loop for every promoted update.
- No "live tracker" / WebSocket gimmicks. The PACER feed updates daily at most; a static build per push is fine.

---

## 12. Open design choices for Mark

A short menu where the agent should ask before deciding:

1. **Domain name.** `anthropic-v-dow.org`? Subdomain under a Vanderbilt AI Law Lab site? Vercel default subdomain to start, custom later?
2. **License.** CC-BY 4.0 for the prose? MIT for the code? Public domain?
3. **Editorial voice.** First person ("I, Mark Williams, maintain this site...") or institutional ("The Vanderbilt AI Law Lab maintains this site...")?
4. **Email digest tone.** Plain text vs. styled HTML?

---

*Mark, hand this file to Claude Code along with `01-CASE-SUMMARY.md`, `02-anki-deck.csv`, and the `source-docs/` directory. Tell it: "Build the site described in `04-SITE-SPEC-FOR-CLAUDE-CODE.md` from the seed materials in this folder." It should be able to scaffold the whole thing.*
