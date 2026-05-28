'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { WhatsNextEntry } from '@/lib/data';
import { longDate, shortDate, courtLabel } from '@/lib/format';

/** Viewer-local calendar date as YYYY-MM-DD. */
function localTodayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Whole calendar days from one ISO date to another. Negative if `to` is past. */
function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T00:00:00`).getTime();
  const to = new Date(`${toISO}T00:00:00`).getTime();
  return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

/**
 * The "What's next" sidebar shown alongside the home-page case explainer.
 * Renders a large countdown card for the very next deadline plus a compact
 * list of the subsequent ones. Sticky on lg+ viewports; stacks below the
 * explainer on smaller screens.
 *
 * The countdown is relative to *now*, so it must be computed against the
 * viewer's clock — not the build/deploy time. We seed state with the server's
 * `serverToday` so the first client render matches the SSR markup (no
 * hydration mismatch), then switch to the viewer's local date after mount.
 */
export function WhatsNextRail({
  entries,
  serverToday,
}: {
  entries: WhatsNextEntry[];
  serverToday: string;
}) {
  const [today, setToday] = useState(serverToday);
  useEffect(() => {
    setToday(localTodayISO());
  }, []);

  const upcoming = entries
    .filter((e) => e.date >= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  if (upcoming.length === 0) return null;

  const next = upcoming[0];
  const rest = upcoming.slice(1, 6);
  const nextDays = daysBetween(today, next.date);

  function relativeShort(days: number): string {
    if (days === 0) return 'today';
    if (days === 1) return 'tomorrow';
    if (days < 0) return `${Math.abs(days)} days ago`;
    return `in ${days} days`;
  }

  return (
    <aside className="ui mt-16 lg:mt-0 lg:sticky lg:top-24 lg:self-start">
      <p className="text-xs uppercase tracking-widest text-muted mb-5 pb-2 border-b border-rule">
        What's next
      </p>

      <div className="mb-8">
        <p
          className={`font-serif text-3xl leading-none mb-3 ${
            nextDays >= 0 && nextDays <= 14 ? 'text-accent' : 'text-ink'
          }`}
        >
          {relativeShort(nextDays)}
        </p>
        <p className="text-sm text-muted mb-3">{longDate(next.date)}</p>
        {next.court ? (
          <p className="text-xs uppercase tracking-widest text-muted mb-2">
            {courtLabel(next.court)}
          </p>
        ) : null}
        <p className="text-sm leading-relaxed mb-2">{next.title}</p>
        {next.detail ? (
          <p className="text-xs text-muted leading-relaxed mb-3">{next.detail}</p>
        ) : null}
        {next.source ? (
          <p className="text-xs leading-snug">
            {next.source.url ? (
              <a href={next.source.url} target="_blank" rel="noopener noreferrer">
                {next.source.label} ↗
              </a>
            ) : (
              <span className="text-muted">{next.source.label}</span>
            )}
          </p>
        ) : null}
      </div>

      {rest.length > 0 ? (
        <ul className="space-y-6 border-t border-rule pt-6">
          {rest.map((e, i) => (
            <li key={i} className="text-sm leading-snug">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-muted whitespace-nowrap tabular-nums">
                  {shortDate(e.date)}
                </span>
                {e.court ? (
                  <span className="text-xs uppercase tracking-widest text-muted">
                    {courtLabel(e.court)}
                  </span>
                ) : null}
              </div>
              <p className="leading-snug mb-1">{e.title}</p>
              {e.source ? (
                <p className="text-xs leading-snug">
                  {e.source.url ? (
                    <a href={e.source.url} target="_blank" rel="noopener noreferrer">
                      {e.source.label} ↗
                    </a>
                  ) : (
                    <span className="text-muted">{e.source.label}</span>
                  )}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-8 pt-5 border-t border-rule text-sm">
        <Link href="/timeline" className="nav-link">
          Full timeline →
        </Link>
      </p>
    </aside>
  );
}
