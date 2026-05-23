import Link from 'next/link';
import { loadGlossary } from '@/lib/data';
import type { GlossaryCategory, GlossaryEntry } from '@/lib/data';
import { PageHeading } from '@/components/PageHeading';
import { Prose } from '@/components/Prose';

export const metadata = {
  title: 'Glossary',
  description:
    'Plain-language definitions of the statutes, doctrines, and case-specific terms used elsewhere on this site.',
};

const CATEGORY_ORDER: { key: GlossaryCategory; label: string }[] = [
  { key: 'case-term', label: 'Case-specific terms' },
  { key: 'statute', label: 'Statutes' },
  { key: 'regulation', label: 'Regulations' },
  { key: 'doctrine', label: 'Doctrines & frameworks' },
  { key: 'procedural', label: 'Procedural concepts' },
  { key: 'entity', label: 'Agencies & entities' },
  { key: 'govcon', label: 'Government contracting' },
];

export default function GlossaryPage() {
  const entries = loadGlossary();
  const alpha = [...entries].sort((a, b) =>
    stripSymbols(a.term).localeCompare(stripSymbols(b.term)),
  );
  const bySlug = new Map(entries.map((e) => [e.slug, e]));
  const byCategory = new Map<GlossaryCategory, GlossaryEntry[]>();
  for (const e of entries) {
    const list = byCategory.get(e.category) ?? [];
    list.push(e);
    byCategory.set(e.category, list);
  }

  return (
    <div>
      <PageHeading
        title="Glossary"
        lede="Plain-language definitions of the statutes, doctrines, and case-specific terms used elsewhere on this site. Link to any entry directly by its anchor (e.g. /glossary#fascsa)."
      />

      <section className="mb-12 max-w-prose">
        <h2 className="text-base m-0 mb-2 ui uppercase tracking-widest text-xs text-muted">
          By category
        </h2>
        {CATEGORY_ORDER.map(({ key, label }) => {
          const list = byCategory.get(key);
          if (!list) return null;
          return (
            <div key={key} className="mb-3">
              <p className="ui text-sm text-muted mb-1">{label}</p>
              <ul className="ui text-sm flex flex-wrap gap-x-3 gap-y-1 list-none p-0">
                {list
                  .sort((a, b) => stripSymbols(a.term).localeCompare(stripSymbols(b.term)))
                  .map((e) => (
                    <li key={e.slug}>
                      <a href={`#${e.slug}`}>{e.term}</a>
                    </li>
                  ))}
              </ul>
            </div>
          );
        })}
      </section>

      <hr />

      <section className="max-w-prose space-y-10 mt-10">
        {alpha.map((e) => (
          <article key={e.slug} id={e.slug} className="scroll-mt-24">
            <p className="ui text-xs uppercase tracking-widest text-muted mb-1">
              {categoryLabel(e.category)}
            </p>
            <h2 className="mt-0">
              <a href={`#${e.slug}`} className="no-underline hover:underline">
                {e.term}
              </a>
            </h2>
            {e.aliases?.length ? (
              <p className="ui text-sm text-muted mt-1">
                Also: {e.aliases.join(' · ')}
              </p>
            ) : null}
            <Prose text={e.definition} linkify />
            {e.see_also?.length ? (
              <p className="ui text-sm text-muted mt-3">
                See also:{' '}
                {e.see_also
                  .map((slug) => bySlug.get(slug))
                  .filter(Boolean)
                  .map((target, i, arr) => (
                    <span key={target!.slug}>
                      <a href={`#${target!.slug}`}>{target!.term}</a>
                      {i < arr.length - 1 ? ', ' : ''}
                    </span>
                  ))}
              </p>
            ) : null}
          </article>
        ))}
      </section>

      <p className="mt-12 text-sm text-muted">
        <Link href="/">← Overview & full explainer</Link>
      </p>
    </div>
  );
}

function categoryLabel(c: GlossaryCategory): string {
  return (
    CATEGORY_ORDER.find((x) => x.key === c)?.label ?? c
  );
}

function stripSymbols(s: string): string {
  // For alpha-sorting, treat "§ 3252" as "3252", "(FASCSA)" as "FASCSA".
  return s.replace(/[§(),.\s]+/g, '').toLowerCase();
}
