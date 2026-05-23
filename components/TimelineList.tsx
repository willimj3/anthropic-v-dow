import type { TimelineEvent } from '@/lib/data';
import { longDate, monthKey, monthYear } from '@/lib/format';

const KIND_LABEL: Record<TimelineEvent['kind'], string> = {
  background: 'Background',
  dispute: 'Dispute',
  'government-action': 'Government action',
  litigation: 'Litigation',
  ruling: 'Ruling',
  commentary: 'Commentary',
};

const KIND_COLOR: Record<TimelineEvent['kind'], string> = {
  background: 'border-stone-300 text-stone-600',
  dispute: 'border-amber-400 text-amber-700',
  'government-action': 'border-rose-400 text-rose-700',
  litigation: 'border-sky-400 text-sky-700',
  ruling: 'border-emerald-500 text-emerald-700',
  commentary: 'border-violet-400 text-violet-700',
};

export function TimelineList({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort((a, b) => (a.date < b.date ? -1 : 1));

  const grouped = new Map<string, TimelineEvent[]>();
  for (const ev of sorted) {
    const key = monthKey(ev.date);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(ev);
  }

  const months = Array.from(grouped.keys()).sort();

  return (
    <ol className="relative">
      {months.map((mk) => {
        const items = grouped.get(mk)!;
        return (
          <li key={mk} className="mb-10">
            <h2 className="ui sticky top-16 z-10 -mx-2 px-2 py-1 bg-paper/95 backdrop-blur text-sm uppercase tracking-widest text-muted mb-4 border-b border-rule">
              {monthYear(items[0].date)}
            </h2>
            <ul className="space-y-6">
              {items.map((ev, idx) => (
                <li key={`${ev.date}-${idx}`} className="grid sm:grid-cols-[7.5rem,1fr] gap-x-6">
                  <div className="ui text-sm text-muted whitespace-nowrap pt-0.5">
                    {longDate(ev.date)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2 mb-1">
                      <span className={`badge ${KIND_COLOR[ev.kind] ?? ''}`}>
                        {KIND_LABEL[ev.kind] ?? ev.kind}
                      </span>
                      <h3 className="text-base font-semibold m-0">{ev.title}</h3>
                    </div>
                    {ev.detail ? (
                      <p className="text-muted text-[0.95rem] mt-1 leading-snug">{ev.detail}</p>
                    ) : null}
                    {ev.citation ? (
                      <p className="ui text-xs text-muted mt-1">{ev.citation}</p>
                    ) : null}
                    {ev.source_url ? (
                      <p className="text-sm mt-1">
                        <a href={ev.source_url} target="_blank" rel="noopener noreferrer">
                          Source ↗
                        </a>
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
