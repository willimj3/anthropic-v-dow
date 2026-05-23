/**
 * Daily news/commentary RSS poll. Disabled by default.
 *
 * Pulls items from the configured feeds in data/alerts-config.yaml, scores
 * relevance ("anthropic" + one of the relevance terms), and emails a plain-text
 * digest of new candidates. Like the RECAP poll, this handler does not mutate
 * data/news.yaml directly — the maintainer commits curated additions after
 * reviewing the digest.
 *
 * On Mondays, the digest is labeled "weekly summary" and includes all items
 * the poll has seen in the prior seven days.
 */

import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { fetchFeed, isRelevant, FeedItem } from '@/lib/rss';
import { sendEmail } from '@/lib/email';
import { requireCronAuth } from '../_shared';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface AlertsConfig {
  recipients: string[];
  email_format: string;
  sources: { rss: string[] };
  relevance_terms: string[];
}

export async function GET(req: Request) {
  const guard = requireCronAuth(req);
  if (guard) return guard;

  const cfg = yaml.load(
    fs.readFileSync(path.join(process.cwd(), 'data', 'alerts-config.yaml'), 'utf8'),
  ) as AlertsConfig;

  const isMonday = new Date().getUTCDay() === 1;
  const lookbackHours = isMonday ? 24 * 7 : 24;
  const since = Date.now() - lookbackHours * 60 * 60 * 1000;

  const collected: FeedItem[] = [];
  const failed: Array<{ url: string; error: string }> = [];

  for (const url of cfg.sources.rss) {
    try {
      const items = await fetchFeed(url);
      for (const it of items) {
        if (Date.parse(it.isoDate) < since) continue;
        if (!isRelevant(it, cfg.relevance_terms)) continue;
        collected.push(it);
      }
    } catch (err) {
      failed.push({ url, error: (err as Error).message });
    }
  }

  // De-dupe by URL.
  const seen = new Set<string>();
  const unique = collected.filter((c) => {
    if (seen.has(c.link)) return false;
    seen.add(c.link);
    return true;
  });

  // Build plain-text digest.
  const lines: string[] = [];
  lines.push(`Anthropic v. DoW — ${isMonday ? 'weekly' : 'daily'} news digest`);
  lines.push(`Window: last ${lookbackHours}h`);
  lines.push(``);
  if (unique.length === 0) {
    lines.push(`No relevant items.`);
  } else {
    for (const it of unique.sort((a, b) => (a.isoDate < b.isoDate ? 1 : -1))) {
      lines.push(`- ${it.isoDate.slice(0, 10)}  ${it.source}`);
      lines.push(`  ${it.title}`);
      lines.push(`  ${it.link}`);
      lines.push(``);
    }
  }
  if (failed.length) {
    lines.push(`Feeds that failed:`);
    for (const f of failed) lines.push(`  - ${f.url}: ${f.error}`);
  }
  lines.push(``);
  lines.push(`To promote an item to the public /news page, add it to data/news.yaml`);
  lines.push(`with approved: true and a one-sentence summary.`);

  const emailResult = await sendEmail({
    to: cfg.recipients,
    from: 'monitor@anthropic-v-dow.org',
    subject: `[Anthropic v. DoW] ${isMonday ? 'Weekly' : 'Daily'} news digest`,
    text: lines.join('\n'),
  });

  return NextResponse.json({
    ok: true,
    weekly: isMonday,
    feedsTried: cfg.sources.rss.length,
    feedsFailed: failed.length,
    candidates: unique.length,
    email: emailResult,
  });
}
