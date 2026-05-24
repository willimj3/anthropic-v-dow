import type { DocketEntry, RecapStatus } from '@/lib/data';
import { shortDate, clEntryUrl } from '@/lib/format';

const IMPORTANCE_BADGE: Record<DocketEntry['importance'], string> = {
  high: 'border-emerald-500 text-emerald-700',
  medium: 'border-stone-400 text-stone-600',
  low: 'border-stone-200 text-stone-400',
};

const IMPORTANCE_ROW: Record<DocketEntry['importance'], string> = {
  high: '',
  medium: '',
  low: 'text-muted/80',
};

export function DocketEntryRow({
  entry,
  court,
  recap,
}: {
  entry: DocketEntry;
  court: string;
  recap?: RecapStatus | null;
}) {
  const entryUrl = clEntryUrl(court, entry.entry, recap?.document_number ?? undefined);

  return (
    <li
      data-importance={entry.importance}
      className={`border-b border-rule py-5 grid grid-cols-[6rem,7rem,1fr] gap-x-5 items-start ${IMPORTANCE_ROW[entry.importance]}`}
    >
      <div className="ui text-sm text-muted tabular-nums">
        {entryUrl ? (
          <a href={entryUrl} target="_blank" rel="noopener noreferrer" className="no-underline hover:underline">
            {entry.entry}
          </a>
        ) : (
          entry.entry ?? '—'
        )}
      </div>
      <div className="ui text-sm text-muted whitespace-nowrap">
        {shortDate(entry.date)}
      </div>
      <div>
        <div className="flex flex-wrap items-baseline gap-2 mb-1">
          <span className={`badge ${IMPORTANCE_BADGE[entry.importance]}`}>
            {entry.importance}
          </span>
          {recap && !recap.available ? (
            <span
              className="badge border-amber-400 text-amber-700"
              title="CourtListener does not yet have the PDF of this filing in RECAP"
            >
              PDF not in RECAP
            </span>
          ) : null}
          {recap?.available && recap.page_count ? (
            <span className="badge" title="PDF available in RECAP">
              {recap.page_count} pp
            </span>
          ) : null}
        </div>
        <p className="leading-snug">
          {entryUrl ? (
            <a href={entryUrl} target="_blank" rel="noopener noreferrer">
              {entry.description}
            </a>
          ) : (
            entry.description
          )}
        </p>
        {entry.notes ? (
          <p className="text-muted text-sm mt-2 italic">{entry.notes}</p>
        ) : null}
        {entry.documents?.length ? (
          <ul className="ui text-sm text-muted mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {entry.documents.map((doc, i) => (
              <li key={`${doc.title}-${i}`}>
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    {doc.title} ↗
                  </a>
                ) : (
                  doc.title
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}
