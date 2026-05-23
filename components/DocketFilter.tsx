'use client';

import { useMemo, useState } from 'react';
import type { DocketEntry, RecapStatus } from '@/lib/data';
import { DocketEntryRow } from './DocketEntryRow';

export type EntryWithStatus = DocketEntry & { recap?: RecapStatus | null };

const ALL_IMPORTANCES: DocketEntry['importance'][] = ['high', 'medium', 'low'];

export function DocketFilter({
  entries,
  court,
}: {
  entries: EntryWithStatus[];
  court: string;
}) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState<Set<DocketEntry['importance']>>(
    new Set(['high', 'medium', 'low']),
  );
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const counts = useMemo(() => {
    const c: Record<DocketEntry['importance'], number> = { high: 0, medium: 0, low: 0 };
    for (const e of entries) c[e.importance]++;
    return c;
  }, [entries]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (!active.has(e.importance)) return false;
      if (from && e.date < from) return false;
      if (to && e.date > to) return false;
      if (needle && !`${e.entry} ${e.description} ${e.notes ?? ''}`.toLowerCase().includes(needle))
        return false;
      return true;
    });
  }, [entries, q, active, from, to]);

  function toggle(k: DocketEntry['importance']) {
    const next = new Set(active);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    if (next.size === 0) next.add(k); // never empty
    setActive(next);
  }

  function reset() {
    setQ('');
    setActive(new Set(ALL_IMPORTANCES));
    setFrom('');
    setTo('');
  }

  const showingAll =
    !q && !from && !to && active.size === ALL_IMPORTANCES.length;

  return (
    <div>
      <div className="ui mb-6 grid gap-3 sm:grid-cols-[1fr,auto,auto] sm:items-end">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted block mb-1">
            Search descriptions
          </span>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. amicus, opposition, Hegseth…"
            className="w-full border border-rule rounded-sm px-3 py-2 bg-white focus:outline-none focus:border-ink"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted block mb-1">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-rule rounded-sm px-3 py-2 bg-white focus:outline-none focus:border-ink"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted block mb-1">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-rule rounded-sm px-3 py-2 bg-white focus:outline-none focus:border-ink"
          />
        </label>
      </div>

      <div className="ui flex flex-wrap items-center gap-2 mb-6 text-sm">
        <span className="text-xs uppercase tracking-widest text-muted mr-1">Importance</span>
        {ALL_IMPORTANCES.map((k) => (
          <button
            key={k}
            type="button"
            className="chip"
            data-active={active.has(k)}
            onClick={() => toggle(k)}
          >
            {k} <span className="opacity-60 ml-1">{counts[k]}</span>
          </button>
        ))}
        {!showingAll ? (
          <button
            type="button"
            onClick={reset}
            className="ml-2 text-xs text-muted underline decoration-rule hover:decoration-accent"
          >
            Reset
          </button>
        ) : null}
        <span className="ml-auto text-xs text-muted">
          Showing {filtered.length} of {entries.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted py-12 text-center">No entries match.</p>
      ) : (
        <ul className="border-t border-rule">
          {filtered.map((e, i) => (
            <DocketEntryRow key={`${e.entry}-${i}`} entry={e} court={court} recap={e.recap} />
          ))}
        </ul>
      )}
    </div>
  );
}
