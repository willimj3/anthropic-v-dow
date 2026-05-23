import Link from 'next/link';
import type { WhatsNextEntry } from '@/lib/data';
import { daysFromToday, longDate, shortDate, courtLabel } from '@/lib/format';

/**
 * The "What's next" sidebar shown alongside the home-page case explainer.
 * Renders a large countdown card for the very next deadline plus a compact
 * list of the subsequent ones. Sticky on lg+ viewports; stacks below the
 * explainer on smaller screens.
 */
export function WhatsNextRail({ entries }: { entries: WhatsNextEntry[] }) {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : 1));
  const next = sorted[0];
  const rest = sorted.slice(1, 6);
  const nextDays = daysFromToday(next.date);

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
