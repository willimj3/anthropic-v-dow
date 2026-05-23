import Link from 'next/link';
import { loadCaseMeta, loadWhatsNext } from '@/lib/data';
import { DocketCard } from '@/components/DocketCard';
import { WhatsNextRail } from '@/components/WhatsNextRail';
import { longDate } from '@/lib/format';
import CaseExplainer from '@/components/CaseExplainer.mdx';

export default function HomePage() {
  const meta = loadCaseMeta();
  const upcoming = loadWhatsNext().filter((e) => e.date >= new Date().toISOString().slice(0, 10));

  return (
    <div className="space-y-16">
      <section className="max-w-prose">
        <p className="ui text-xs uppercase tracking-widest text-muted mb-2">
          Filed {longDate(meta.filed)} · Last updated {longDate(meta.last_updated)}
        </p>
        <h1>{meta.case_name}</h1>
        <p className="text-muted mt-4 text-lg whitespace-pre-line">{meta.status_summary}</p>
        <p className="mt-6">
          <Link href="#the-case-in-full">Read the full explainer ↓</Link>
          <span className="text-muted mx-3">·</span>
          <Link href="/study-guide">Study guide →</Link>
        </p>
      </section>

      <section>
        <h2 className="ui text-xs uppercase tracking-widest text-muted mb-4 border-b border-rule pb-2">
          The three dockets
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {meta.dockets.map((d) => (
            <DocketCard key={d.id} docket={d} />
          ))}
        </div>
      </section>

      <hr className="border-rule" />

      <div
        id="the-case-in-full"
        className="lg:grid lg:grid-cols-[minmax(0,1fr),16rem] lg:gap-12 scroll-mt-24"
      >
        <article
          className="prose prose-stone max-w-prose
                     prose-headings:font-serif prose-headings:scroll-mt-24
                     prose-h2:text-2xl prose-h2:border-b prose-h2:border-rule prose-h2:pb-2
                     prose-h2:mt-0 prose-h3:mt-10
                     prose-p:leading-relaxed
                     prose-a:text-accent prose-a:decoration-rule hover:prose-a:decoration-accent
                     prose-hr:border-rule
                     prose-blockquote:border-rule prose-blockquote:not-italic prose-blockquote:text-muted"
        >
          <CaseExplainer />
        </article>
        <WhatsNextRail entries={upcoming} />
      </div>

      <section className="max-w-prose">
        <h2 className="ui text-xs uppercase tracking-widest text-muted mb-4 border-b border-rule pb-2">
          About this site
        </h2>
        <p>
          This site explains the <em>Anthropic PBC v. U.S. Department of War</em> litigation
          across all three federal forums it occupies: the Northern District of California (the
          merits action), the D.C. Circuit (a parallel FASCSA petition), and the Ninth Circuit
          (the government's stayed interlocutory appeal). It is maintained by the Vanderbilt AI
          Law Lab and is updated as the litigation moves.
        </p>
        <p>
          The site is file-driven. Every fact lives in a YAML or MDX file in this repository, and
          updates are made by editing those files. See{' '}
          <Link href="/about">About</Link> for methodology and how to suggest a correction.
        </p>
      </section>
    </div>
  );
}
