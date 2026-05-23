import { notFound } from 'next/navigation';
import Link from 'next/link';
import { loadCaseMeta, loadDocketEntries, recapStatusFor } from '@/lib/data';
import { DocketFilter, type EntryWithStatus } from '@/components/DocketFilter';
import { DocketEntryRow } from '@/components/DocketEntryRow';
import { PageHeading } from '@/components/PageHeading';
import { StatusDot } from '@/components/StatusDot';

const VALID_IDS = ['ndcal', 'dccir', 'ca9'] as const;
type DocketId = (typeof VALID_IDS)[number];

export function generateStaticParams() {
  return VALID_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!VALID_IDS.includes(id as DocketId)) return {};
  const meta = loadCaseMeta();
  const docket = meta.dockets.find((d) => d.id === id);
  return docket ? { title: `${docket.court} — ${docket.case_no}` } : {};
}

export default async function DocketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!VALID_IDS.includes(id as DocketId)) notFound();

  const meta = loadCaseMeta();
  const docket = meta.dockets.find((d) => d.id === id);
  if (!docket) notFound();

  const entries = loadDocketEntries(id as DocketId);
  const enriched: EntryWithStatus[] = entries.map((e) => ({
    ...e,
    recap: recapStatusFor(id, e),
  }));
  const sorted = [...enriched].sort((a, b) => (a.date < b.date ? 1 : -1));
  const highEntries = sorted.filter((e) => e.importance === 'high');
  const unavailableCount = enriched.filter((e) => e.recap && !e.recap.available).length;

  return (
    <div>
      <p className="ui text-xs uppercase tracking-widest text-muted mb-2 flex items-center gap-2">
        <StatusDot color={docket.status_color} />
        {docket.court}
      </p>
      <PageHeading title={docket.case_no} lede={docket.status} />

      <dl className="ui text-sm grid sm:grid-cols-[8rem,1fr] gap-x-4 gap-y-1 mb-10 max-w-prose">
        {docket.judge ? (
          <>
            <dt className="text-muted">Judge</dt>
            <dd>{docket.judge}</dd>
          </>
        ) : null}
        {docket.panel ? (
          <>
            <dt className="text-muted">Panel</dt>
            <dd>{docket.panel}</dd>
          </>
        ) : null}
        <dt className="text-muted">CourtListener</dt>
        <dd>
          <a href={docket.courtlistener_url} target="_blank" rel="noopener noreferrer">
            Docket {docket.courtlistener_id} ↗
          </a>
        </dd>
        <dt className="text-muted">Entries</dt>
        <dd>
          {entries.length} ({highEntries.length} high-importance
          {unavailableCount > 0 ? `, ${unavailableCount} without PDF in RECAP yet` : ''})
        </dd>
      </dl>

      {highEntries.length > 0 ? (
        <section className="mb-14">
          <h2 className="ui text-xs uppercase tracking-widest text-muted mb-3 border-b border-rule pb-2">
            High-importance entries
          </h2>
          <ul className="border-t border-rule">
            {highEntries.map((e, i) => (
              <DocketEntryRow key={`${e.entry}-hi-${i}`} entry={e} court={id} recap={e.recap} />
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="ui text-xs uppercase tracking-widest text-muted mb-4 border-b border-rule pb-2">
          Full docket
        </h2>
        <DocketFilter entries={sorted} court={id} />
      </section>

      <p className="mt-12 text-sm text-muted">
        <Link href="/dockets">← All dockets</Link>
      </p>
    </div>
  );
}
