import Link from 'next/link';
import {
  loadHoldings,
  loadClaims,
  loadIssues,
} from '@/lib/data';
import { PageHeading } from '@/components/PageHeading';
import { SourceList } from '@/components/SourceList';
import { Prose } from '@/components/Prose';
import { StatusDot } from '@/components/StatusDot';
import { longDate, courtLabel } from '@/lib/format';

export const metadata = {
  title: 'Law',
  description:
    "The doctrinal substance of the case: what's been held, what's been pleaded, and the legal issues in play.",
};

function firstParagraph(text: string): string {
  const para = text.split(/\n\s*\n/)[0] ?? '';
  return para.replace(/\s+/g, ' ').trim();
}

export default function LawPage() {
  const holdings = [...loadHoldings()].sort((a, b) => (a.date < b.date ? 1 : -1));
  const claims = loadClaims();
  const issues = loadIssues();

  function issuesForCount(count: string) {
    return issues.filter((i) => i.related_claims?.includes(count));
  }
  function holdingsForCount(count: string) {
    return holdings.filter((h) =>
      h.theories?.some((t) =>
        issues.some(
          (i) => i.related_claims?.includes(count) && t.issue_slug === i.slug,
        ),
      ),
    );
  }

  return (
    <div>
      <PageHeading
        title="Law"
        lede="What courts have decided, what Anthropic has pleaded, and the doctrinal questions the case puts in play. The per-issue detail pages live under /issues/[slug] for deep-linking."
      />

      <nav className="ui text-sm flex flex-wrap gap-x-5 gap-y-1 mb-12 pb-3 border-b border-rule">
        <span className="text-xs uppercase tracking-widest text-muted">Jump to</span>
        <a href="#holdings">Holdings</a>
        <a href="#claims">Claims</a>
        <a href="#issues">Issues</a>
      </nav>

      <section id="holdings" className="scroll-mt-24 mb-20">
        <h2 className="text-2xl border-b border-rule pb-2 mb-6 mt-0">Holdings</h2>
        <p className="text-muted max-w-prose mb-6">
          Court rulings in this matter so far, reverse-chronological.
        </p>
        <div className="space-y-16">
          {holdings.map((h, i) => (
            <article key={i} className="max-w-prose border-b border-rule pb-12">
              <p className="ui text-xs uppercase tracking-widest text-muted mb-2">
                {courtLabel(h.court)} · {longDate(h.date)}
              </p>
              <h3 className="mt-0">{h.caption}</h3>
              <p className="ui text-sm text-muted">
                {h.judge ? <>Judge {h.judge}</> : null}
                {h.panel ? <>Panel: {h.panel}</> : null}
                {h.docket_entries?.length ? (
                  <> · Dkt. {h.docket_entries.join(', ')}</>
                ) : null}
              </p>
              <div className="mt-4">
                <Prose text={h.bottom_line} linkify />
              </div>

              {h.theories?.length ? (
                <>
                  <h4>Theories</h4>
                  <ul className="list-disc pl-5 marker:text-muted">
                    {h.theories.map((t, j) => (
                      <li key={j}>
                        {t.issue_slug ? (
                          <Link href={`/issues/${t.issue_slug}`}>{t.issue}</Link>
                        ) : (
                          <strong>{t.issue}</strong>
                        )}{' '}
                        — {t.result}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {h.key_quotes?.length ? (
                <>
                  <h4>Key quotes</h4>
                  {h.key_quotes.map((q, j) => (
                    <blockquote key={j} className="not-italic">
                      <p>"{q.quote.replace(/\s+/g, ' ').trim()}"</p>
                      {q.page ? <p className="ui text-xs text-muted">at {q.page}</p> : null}
                    </blockquote>
                  ))}
                </>
              ) : null}

              <SourceList sources={h.sources} heading="Filings & sources" />
            </article>
          ))}
        </div>
      </section>

      <section id="claims" className="scroll-mt-24 mb-20">
        <h2 className="text-2xl border-b border-rule pb-2 mb-6">Claims</h2>
        <p className="text-muted max-w-prose mb-6">
          The five counts in Anthropic's complaint, with status at PI and current status.
        </p>
        <ol className="space-y-10 max-w-prose">
          {claims.map((c) => {
            const relIssues = issuesForCount(c.count);
            const relHoldings = holdingsForCount(c.count);
            return (
              <li key={c.count} className="border-b border-rule pb-8">
                <p className="ui text-xs uppercase tracking-widest text-muted mb-1 flex items-center gap-2">
                  <StatusDot color={c.status_color} />
                  Count {c.count}
                </p>
                <h3 className="mt-0">{c.short}</h3>
                <Prose text={c.full} linkify />
                <dl className="ui text-sm grid grid-cols-[8rem,1fr] gap-x-4 gap-y-2 mt-4">
                  <dt className="text-muted">Defendants</dt>
                  <dd>{c.defendants.join(', ')}</dd>
                  <dt className="text-muted">At PI</dt>
                  <dd>{c.status_at_pi}</dd>
                  <dt className="text-muted">Now</dt>
                  <dd>{c.status}</dd>
                </dl>

                {(relIssues.length > 0 || relHoldings.length > 0) && (
                  <div className="mt-4 pt-3 border-t border-rule">
                    <p className="ui text-xs uppercase tracking-widest text-muted mb-2 m-0">
                      On this count
                    </p>
                    <ul className="ui text-sm space-y-1 list-none p-0">
                      {relIssues.map((i) => (
                        <li key={`i-${i.slug}`} className="flex gap-2">
                          <span className="badge">Issue</span>
                          <Link href={`/issues/${i.slug}`}>{i.title}</Link>
                        </li>
                      ))}
                      {relHoldings.map((h) => (
                        <li key={`h-${h.date}`} className="flex gap-2">
                          <span className="badge">Holding</span>
                          <a href="#holdings">{h.caption}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section id="issues" className="scroll-mt-24">
        <h2 className="text-2xl border-b border-rule pb-2 mb-6">Issues</h2>
        <p className="text-muted max-w-prose mb-6">
          One-paragraph orientation for each doctrinal question the case puts in play; click
          through for the full per-issue treatment.
        </p>
        <ul className="space-y-6 max-w-prose">
          {issues.map((i) => (
            <li key={i.slug} className="border-b border-rule pb-6">
              <h3 className="mt-0">
                <Link href={`/issues/${i.slug}`}>{i.title}</Link>
              </h3>
              <p className="text-muted text-sm">{firstParagraph(i.doctrinal_framework)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
