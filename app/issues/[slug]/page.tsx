import { notFound } from 'next/navigation';
import Link from 'next/link';
import { loadIssues, loadHoldings, loadClaims } from '@/lib/data';
import { PageHeading } from '@/components/PageHeading';
import { SourceList } from '@/components/SourceList';
import { Prose } from '@/components/Prose';
import { longDate, courtLabel } from '@/lib/format';

export function generateStaticParams() {
  return loadIssues().map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const issue = loadIssues().find((i) => i.slug === slug);
  return issue
    ? {
        title: issue.title,
        description: issue.doctrinal_framework.replace(/\s+/g, ' ').slice(0, 180),
      }
    : {};
}

export default async function IssuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const issue = loadIssues().find((i) => i.slug === slug);
  if (!issue) notFound();

  const holdings = loadHoldings();
  const claims = loadClaims();

  const relatedHoldings = (issue.related_holdings ?? [])
    .map((d) => holdings.find((h) => h.date === d))
    .filter(Boolean);
  const relatedClaims = (issue.related_claims ?? [])
    .map((c) => claims.find((cl) => cl.count === c))
    .filter(Boolean);

  return (
    <div className="prose-page">
      <p className="ui text-xs uppercase tracking-widest text-muted mb-2">Issue</p>
      <PageHeading title={issue.title} />

      <section>
        <h2>Doctrinal framework</h2>
        <Prose text={issue.doctrinal_framework} linkify />
      </section>

      <section>
        <h2>Status after the PI</h2>
        <Prose text={issue.status_at_pi} linkify />
      </section>

      <section>
        <h2>Open questions</h2>
        <Prose text={issue.open_questions} linkify />
      </section>

      {(relatedHoldings.length > 0 || relatedClaims.length > 0) && (
        <section className="mt-10 pt-5 border-t border-rule">
          <h3 className="ui text-xs uppercase tracking-widest text-muted mb-3 m-0">
            Related on this site
          </h3>
          <ul className="ui text-sm space-y-2 list-none p-0">
            {relatedHoldings.map((h) => (
              <li key={h!.date} className="flex gap-2">
                <span className="badge">Holding</span>
                <Link href="/law#holdings" className="leading-snug">
                  {courtLabel(h!.court)} · {longDate(h!.date)} — {h!.caption}
                </Link>
              </li>
            ))}
            {relatedClaims.map((c) => (
              <li key={c!.count} className="flex gap-2">
                <span className="badge">Claim</span>
                <Link href="/law#claims" className="leading-snug">
                  Count {c!.count} — {c!.short}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <SourceList sources={issue.sources} heading="Sources & authority" />

      <p className="mt-12 text-sm text-muted">
        <Link href="/law#issues">← All issues</Link>
      </p>
    </div>
  );
}
