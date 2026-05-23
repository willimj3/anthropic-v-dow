/**
 * Daily RECAP poll. Disabled by default — uncomment the entry in vercel.json
 * to schedule.
 *
 * What this handler does:
 *   1. For each docket, ask CourtListener for entries since the last run.
 *   2. Classify each new entry's importance using simple regex heuristics
 *      (mirroring scripts/build_docket_yaml.py).
 *   3. Open a GitHub issue per high-importance entry (label: new-filing).
 *   4. Send a single plain-text digest email summarizing everything seen.
 *
 * What it does NOT do:
 *   - Mutate data/dockets/*.yaml. The Vercel serverless filesystem is
 *     read-only at runtime; the maintainer commits the new entries by hand
 *     after reviewing the GitHub issue. The `.last-poll.json` cursor is
 *     committed manually for the same reason.
 *   - Auto-summarize filings. The spec deliberately keeps a human in the loop.
 */

import { NextResponse } from 'next/server';
import { CourtListener } from '@/lib/courtlistener';
import { sendEmail } from '@/lib/email';
import { openIssue } from '@/lib/github';
import { loadCaseMeta } from '@/lib/data';
import { requireCronAuth, requireEnv } from '../_shared';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HIGH = [
  /\bopinion\b/i,
  /\border granting\b/i,
  /\border denying\b/i,
  /\bjudgment\b/i,
  /\bpreliminary injunction\b/i,
  /\btemporary restraining order\b/i,
  /\bmotion for summary judgment\b/i,
  /\bcross[- ]motion\b/i,
  /\bnotice of appeal\b/i,
  /\bpetition for\b/i,
  /\bsupplemental brief\b/i,
  /\boral argument\b/i,
  /\bper curiam order\b/i,
  /\bmandamus\b/i,
];

const EXCLUDE = [
  /order on motion for pro hac vice/i,
  /order setting/i,
  /clerk.s notice/i,
];

function isHigh(description: string): boolean {
  for (const r of EXCLUDE) if (r.test(description)) return false;
  return HIGH.some((r) => r.test(description));
}

export async function GET(req: Request) {
  const guard = requireCronAuth(req);
  if (guard) return guard;

  const { missing } = requireEnv('COURTLISTENER_TOKEN');
  if (missing.length) {
    return NextResponse.json({ ok: false, error: `missing env: ${missing.join(', ')}` }, { status: 503 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const cl = new CourtListener(process.env.COURTLISTENER_TOKEN!);
  const meta = loadCaseMeta();

  const findings: Array<{ docket: string; entries: Array<{ entry: number | null; date: string; description: string; high: boolean }> }> = [];
  const issuesOpened: Array<{ docket: string; url: string }> = [];

  for (const d of meta.dockets) {
    let entries;
    try {
      entries = await cl.entriesSince(d.courtlistener_id, since);
    } catch (err) {
      await openIssue(
        `[monitor-failure] RECAP poll failed for ${d.court}`,
        `Error fetching ${d.courtlistener_url} since ${since}:\n\n\`\`\`\n${(err as Error).message}\n\`\`\``,
        ['monitor-failure'],
      );
      continue;
    }

    const summarized = entries.map((e) => ({
      entry: e.entry_number,
      date: e.date_filed ?? '',
      description: e.description ?? '',
      high: isHigh(e.description ?? ''),
    }));
    findings.push({ docket: d.court, entries: summarized });

    for (const e of summarized.filter((x) => x.high)) {
      const body = [
        `New high-importance entry on ${d.court} (${d.case_no}).`,
        ``,
        `**Entry:** ${e.entry ?? '—'}`,
        `**Date:** ${e.date}`,
        `**Description:** ${e.description}`,
        ``,
        `CourtListener: ${d.courtlistener_url}`,
        ``,
        `Reviewer checklist:`,
        `- [ ] Confirm importance flag in data/dockets/${d.id}-entries.yaml`,
        `- [ ] Add to data/timeline.yaml if milestone`,
        `- [ ] Update data/case-meta.yaml status_summary if posture shifted`,
        `- [ ] Add to data/holdings.yaml if ruling`,
      ].join('\n');
      const result = await openIssue(`[new-filing] ${d.court}: ${e.description.slice(0, 120)}`, body, ['new-filing']);
      if ('url' in result) issuesOpened.push({ docket: d.court, url: result.url });
    }
  }

  // Compose plain-text digest.
  const lines: string[] = [];
  lines.push(`Anthropic v. DoW — RECAP digest`);
  lines.push(`Since: ${since}`);
  lines.push(``);
  for (const f of findings) {
    lines.push(`-- ${f.docket} --`);
    if (f.entries.length === 0) {
      lines.push(`  (no new entries)`);
    } else {
      for (const e of f.entries) {
        const flag = e.high ? '*' : ' ';
        lines.push(`  ${flag} ${e.date}  #${e.entry ?? '—'}  ${e.description.slice(0, 200)}`);
      }
    }
    lines.push(``);
  }
  if (issuesOpened.length) {
    lines.push(`GitHub issues opened:`);
    for (const i of issuesOpened) lines.push(`  - ${i.url}`);
  }

  const digest = lines.join('\n');

  const emailResult = await sendEmail({
    to: ['mark.j.williams@vanderbilt.edu'],
    from: 'monitor@anthropic-v-dow.org',
    subject: `[Anthropic v. DoW] RECAP digest ${since.slice(0, 10)}`,
    text: digest,
  });

  return NextResponse.json({
    ok: true,
    since,
    docketsChecked: findings.length,
    newEntries: findings.reduce((acc, f) => acc + f.entries.length, 0),
    highImportance: findings.reduce((acc, f) => acc + f.entries.filter((e) => e.high).length, 0),
    issuesOpened: issuesOpened.length,
    email: emailResult,
  });
}
