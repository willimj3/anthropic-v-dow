import { loadAllDocketEntries, loadCaseMeta } from '@/lib/data';
import { PageHeading } from '@/components/PageHeading';
import { shortDate, courtLabel } from '@/lib/format';

export const metadata = { title: 'Documents' };

export default function DocumentsPage() {
  const meta = loadCaseMeta();
  const all = loadAllDocketEntries();

  type Row = {
    court: 'ndcal' | 'dccir' | 'ca9';
    entry: string | null;
    date: string;
    description: string;
  };

  const highRows: Row[] = (['ndcal', 'dccir', 'ca9'] as const).flatMap((court) =>
    all[court]
      .filter((e) => e.importance === 'high')
      .map((e) => ({
        court,
        entry: e.entry,
        date: e.date,
        description: e.description,
      })),
  );

  highRows.sort((a, b) => (a.date < b.date ? -1 : 1));

  return (
    <div>
      <PageHeading
        title="Documents"
        lede="High-importance filings across all three dockets, plus local source documents mirrored in this repository."
      />

      <section className="mb-12">
        <h2>High-importance filings</h2>
        <p className="text-muted max-w-prose">
          Filings flagged "high" by the importance heuristic. Each row links to the underlying
          CourtListener docket entry; full RECAP PDF links live on the per-docket pages.
        </p>
        <ul className="mt-4 border-t border-rule">
          {highRows.map((r, i) => {
            const docket = meta.dockets.find((d) => d.id === r.court)!;
            return (
              <li
                key={i}
                className="border-b border-rule py-3 grid grid-cols-[1fr] sm:grid-cols-[8rem,5rem,8rem,minmax(0,1fr)] gap-x-8 gap-y-0.5 items-baseline"
              >
                <span className="ui text-xs uppercase tracking-widest text-muted">
                  {courtLabel(r.court)}
                </span>
                <span className="ui text-sm text-muted tabular-nums">{r.entry ?? '—'}</span>
                <span className="ui text-sm text-muted whitespace-nowrap">{shortDate(r.date)}</span>
                <a href={docket.courtlistener_url} target="_blank" rel="noopener noreferrer">
                  {r.description}
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="max-w-prose">
        <h2>Local source documents</h2>
        <p>
          Plain-text extracts mirrored in this repository for reference:
        </p>
        <ul className="list-disc pl-5">
          <li>
            <code>source-docs/01-complaint.txt</code> — text of the original complaint (Dkt. 1,
            N.D. Cal.)
          </li>
          <li>
            <code>source-docs/134-pi-opinion.txt</code> — text of Judge Lin's PI opinion
            (Dkt. 134, N.D. Cal.)
          </li>
        </ul>
        <p className="text-muted">
          The PDFs themselves are not committed to git; they can be regenerated from the
          CourtListener URLs above. See <code>scripts/fetch_pdfs.py</code> (TBD) for a
          maintainer-friendly batch download.
        </p>
      </section>
    </div>
  );
}
