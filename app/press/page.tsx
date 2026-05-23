import { loadCommentary, loadNews } from '@/lib/data';
import { PageHeading } from '@/components/PageHeading';
import { Prose } from '@/components/Prose';
import { SourceList } from '@/components/SourceList';
import { longDate } from '@/lib/format';

export const metadata = {
  title: 'Press',
  description:
    'Curated commentary and auto-aggregated news coverage of Anthropic v. Department of War.',
};

const COMMENTARY_TAG_LABEL: Record<string, string> = {
  analysis: 'Analysis',
  news: 'News',
  brief: 'Amicus brief',
};

export default function PressPage() {
  const commentary = [...loadCommentary()].sort((a, b) => (a.date < b.date ? 1 : -1));
  const news = loadNews()
    .filter((n) => n.approved)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div>
      <PageHeading
        title="Press"
        lede="Curated commentary and approved news coverage. Items below the relevance threshold are stored in data/news.yaml but hidden until manually approved."
      />

      <nav className="ui text-sm flex flex-wrap gap-x-5 gap-y-1 mb-12 pb-3 border-b border-rule">
        <span className="text-xs uppercase tracking-widest text-muted">Jump to</span>
        <a href="#commentary">Commentary</a>
        <a href="#news">News</a>
      </nav>

      <section id="commentary" className="scroll-mt-24 mb-20">
        <h2 className="text-2xl border-b border-rule pb-2 mb-6 mt-0">Commentary</h2>
        <p className="text-muted max-w-prose mb-6">
          Annotated bibliography of analytical writing and major amicus briefs.
        </p>
        <ul className="space-y-6 max-w-prose">
          {commentary.map((c, i) => (
            <li key={i} className="border-b border-rule pb-6">
              <p className="ui text-xs uppercase tracking-widest text-muted mb-1">
                {COMMENTARY_TAG_LABEL[c.tag] ?? c.tag} · {c.publication} · {longDate(c.date)}
              </p>
              <h3 className="mt-0 text-lg">
                {c.url ? (
                  <a href={c.url} target="_blank" rel="noopener noreferrer">
                    {c.title}
                  </a>
                ) : (
                  c.title
                )}
              </h3>
              {c.authors?.length ? (
                <p className="text-sm text-muted">{c.authors.join(', ')}</p>
              ) : null}
              <div className="mt-2">
                <Prose text={c.summary} linkify />
              </div>
              <SourceList sources={c.sources} heading="Also cited" />
            </li>
          ))}
        </ul>
      </section>

      <section id="news" className="scroll-mt-24">
        <h2 className="text-2xl border-b border-rule pb-2 mb-6">News</h2>
        <p className="text-muted max-w-prose mb-6">
          Press coverage promoted from the auto-aggregator.
        </p>
        {news.length === 0 ? (
          <p className="text-muted">No approved news items yet.</p>
        ) : (
          <ul className="space-y-6 max-w-prose">
            {news.map((n, i) => (
              <li key={i} className="border-b border-rule pb-4">
                <p className="ui text-xs uppercase tracking-widest text-muted mb-1">
                  {n.source} · {longDate(n.date)}
                </p>
                <h3 className="mt-0 text-lg">
                  <a href={n.url} target="_blank" rel="noopener noreferrer">{n.title}</a>
                </h3>
                {n.summary ? <p className="text-muted mt-1">{n.summary}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
