import Parser from 'rss-parser';

export interface FeedItem {
  source: string;
  title: string;
  link: string;
  isoDate: string;
  contentSnippet: string;
}

const parser = new Parser({
  timeout: 15_000,
  headers: { 'User-Agent': 'anthropic-v-dow-monitor (vanderbilt-ai-law-lab)' },
});

export async function fetchFeed(url: string): Promise<FeedItem[]> {
  const feed = await parser.parseURL(url);
  const sourceName = feed.title ?? url;
  return (feed.items ?? []).map((it) => ({
    source: sourceName,
    title: it.title ?? '(untitled)',
    link: it.link ?? '',
    isoDate: it.isoDate ?? new Date().toISOString(),
    contentSnippet: it.contentSnippet ?? '',
  }));
}

/** Returns true iff the item mentions "anthropic" AND any relevance term. */
export function isRelevant(item: FeedItem, terms: string[]): boolean {
  const hay = `${item.title} ${item.contentSnippet}`.toLowerCase();
  if (!hay.includes('anthropic')) return false;
  return terms.some((t) => hay.includes(t.toLowerCase()));
}
