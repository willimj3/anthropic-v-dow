import Link from 'next/link';
import { PageHeading } from '@/components/PageHeading';

export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <div className="prose-page">
      <PageHeading
        title="About this site"
        lede="A focused explainer and live tracker for one piece of litigation, maintained by the Vanderbilt AI Law Lab."
      />

      <section>
        <h2>What this site is</h2>
        <p>
          An explainer and litigation tracker for <em>Anthropic PBC v. U.S. Department of War</em>,
          a single underlying dispute litigated in three federal forums:
        </p>
        <ul className="list-disc pl-5">
          <li>The merits action in the Northern District of California (3:26-cv-01996-RFL).</li>
          <li>A parallel petition for review in the D.C. Circuit (26-1049), targeting the FASCSA letter.</li>
          <li>The government's interlocutory appeal of the preliminary injunction in the Ninth Circuit (26-2011), currently stayed.</li>
        </ul>
        <p>
          The site is intended for readers who know law but not this case. It does not take a
          litigation position. Where the editor's view is necessary — for example, in weighting
          which docket entries are "high importance" — that judgment is flagged and traceable to
          the underlying data files in this repository.
        </p>
      </section>

      <section>
        <h2>Methodology</h2>
        <p>
          Every fact on the site lives in a YAML or MDX file under <code>data/</code> or{' '}
          <code>content/</code>. The build process reads those files; there is no database. The
          long-form explainer on the <Link href="/">overview page</Link> traces directly to a memo synthesized
          from the complaint and Judge Lin's PI opinion. The study guide at{' '}
          <Link href="/study-guide">/study-guide</Link> is generated from the underlying Anki deck. The
          doctrinal substance lives at <Link href="/law">/law</Link>; press coverage and commentary at{' '}
          <Link href="/press">/press</Link>.
        </p>
        <p>
          Docket entries are mirrored from CourtListener's RECAP archive. The importance flag on
          each entry is heuristic and is reviewed and adjusted manually. No filing is
          auto-summarized by AI — humans write every annotation that appears on the site.
        </p>
      </section>

      <section>
        <h2>Updates and corrections</h2>
        <p>
          The site updates as the litigation moves. A change log is at{' '}
          <Link href="/updates">/updates</Link>. CourtListener docket alerts are active on all three
          dockets, and a daily monitor surfaces new filings for editorial review.
        </p>
        <p>
          To suggest a correction, open an issue on the project's GitHub repository or email{' '}
          <a href="mailto:mark.j.williams@vanderbilt.edu">mark.j.williams@vanderbilt.edu</a>.
        </p>
      </section>

      <section>
        <h2>Use and license</h2>
        <p>
          Prose on this site is licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC&nbsp;BY&nbsp;4.0</a>.
          Code is MIT-licensed. Government filings reproduced here are public-domain works of the
          federal government; third-party amicus briefs and commentary excerpts are reproduced
          under fair use.
        </p>
      </section>
    </div>
  );
}
