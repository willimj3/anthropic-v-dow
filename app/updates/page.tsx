import { loadUpdates } from '@/lib/data';
import { PageHeading } from '@/components/PageHeading';
import { longDate } from '@/lib/format';

export const metadata = { title: 'Updates' };

export default function UpdatesPage() {
  const updates = [...loadUpdates()].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <div>
      <PageHeading
        title="Site updates"
        lede="Reverse-chronological changelog. Substantive corrections, new sections, and notable additions only — not routine docket sync."
      />
      <ul className="space-y-6 max-w-prose">
        {updates.map((u, i) => (
          <li key={i} className="border-b border-rule pb-4">
            <p className="ui text-xs uppercase tracking-widest text-muted mb-1">
              {longDate(u.date)}
            </p>
            <h2 className="text-base mt-0">{u.title}</h2>
            <p className="text-muted">{u.detail}</p>
            {u.pages?.length ? (
              <p className="ui text-xs text-muted mt-1">Pages touched: {u.pages.join(', ')}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
