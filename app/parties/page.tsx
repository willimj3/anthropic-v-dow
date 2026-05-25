import { loadParties, briefsForAmicus } from '@/lib/data';
import { PageHeading } from '@/components/PageHeading';
import { shortDate, courtLabel, clEntryUrl } from '@/lib/format';

export const metadata = { title: 'Parties' };

const SIDE_LABEL: Record<string, string> = {
  petitioner: 'For petitioner',
  respondent: 'For respondent',
  neither: 'In favor of neither',
};

function formatSize(bytes?: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PartiesPage() {
  const p = loadParties();

  return (
    <div>
      <PageHeading
        title="Parties"
        lede="The plaintiff, the eighteen named federal defendants, and the amici who filed in support (and opposition) — with direct links to every amicus brief on CourtListener."
      />

      <nav className="ui text-sm flex flex-wrap gap-x-5 gap-y-1 mb-12 pb-3 border-b border-rule">
        <span className="text-xs uppercase tracking-widest text-muted">Jump to</span>
        <a href="#plaintiff">Plaintiff</a>
        <a href="#defendants">Defendants</a>
        <a href="#counsel">Government counsel</a>
        <a href="#amici">Amici</a>
      </nav>

      <section id="plaintiff" className="scroll-mt-24 mb-12 max-w-prose">
        <h2 className="text-2xl border-b border-rule pb-2 mb-6 mt-0">Plaintiff</h2>
        <p>
          <strong>{p.plaintiff.name}</strong> — {p.plaintiff.type}
          {p.plaintiff.state_of_incorporation
            ? `, incorporated in ${p.plaintiff.state_of_incorporation}`
            : null}
          {p.plaintiff.hq ? `, headquartered in ${p.plaintiff.hq}` : null}.
        </p>
        <h3>Counsel</h3>
        <ul className="list-disc pl-5 space-y-1">
          {p.plaintiff.counsel?.map((c) => (
            <li key={c.lead}>
              <strong>{c.lead}</strong> — {c.firm}. <span className="text-muted">{c.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="defendants" className="scroll-mt-24 mb-12">
        <h2 className="text-2xl border-b border-rule pb-2 mb-6">Defendants</h2>
        <p className="text-muted max-w-prose">
          Eighteen named agencies and officials; the order names all "Defendant Agencies" plus
          Secretary Hegseth and the Executive Office of the President.
        </p>
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-4">
          {p.defendants.map((d) => (
            <li key={d.name} className="border-b border-rule pb-3">
              <p className="font-semibold">{d.name}</p>
              {d.official ? <p className="text-sm text-muted">{d.official}</p> : null}
              {d.type ? (
                <p className="ui text-xs uppercase tracking-widest text-muted mt-1">{d.type}</p>
              ) : null}
              {d.role ? <p className="text-sm mt-1">{d.role}</p> : null}
            </li>
          ))}
        </ul>
      </section>

      <section id="counsel" className="scroll-mt-24 mb-12 max-w-prose">
        <h2 className="text-2xl border-b border-rule pb-2 mb-6">Counsel for the government</h2>
        <p>
          <strong>Trial (N.D. Cal.):</strong> {p.counsel_for_defendants.trial.firm}.{' '}
          {p.counsel_for_defendants.trial.attorneys.join(', ')}.
        </p>
        <p>
          <strong>Appellate (D.C. Cir., 9th Cir.):</strong>{' '}
          {p.counsel_for_defendants.appellate.firm}.{' '}
          {p.counsel_for_defendants.appellate.attorneys.join(', ')}.
        </p>
        {p.counsel_for_defendants.appellate.notes ? (
          <p className="text-muted">{p.counsel_for_defendants.appellate.notes}</p>
        ) : null}
      </section>

      <section id="amici" className="scroll-mt-24">
        <h2 className="text-2xl border-b border-rule pb-2 mb-6">Amici</h2>
        <p className="text-muted max-w-prose mb-6">
          Briefs filed across the N.D. Cal. and D.C. Cir. proceedings. Each entry links directly
          to the relevant CourtListener docket entry where you can download the PDF; many briefs
          are also mirrored locally under <code>source-docs/</code>. Only one amicus has filed in
          support of the government — Joel Thayer of the America First Policy Institute, in the
          D.C. Cir.
        </p>
        <ul className="space-y-8">
          {p.amici.map((a) => {
            const briefs = briefsForAmicus(a);
            return (
              <li key={a.name} className="border-b border-rule pb-6">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                  <p className="font-semibold text-base m-0">{a.name}</p>
                  <span className="badge">{SIDE_LABEL[a.side] ?? a.side}</span>
                  <span className="ui text-xs uppercase tracking-widest text-muted">
                    {a.in.map((c) => courtLabel(c)).join(' · ')}
                  </span>
                </div>
                {a.notes ? (
                  <p className="text-sm text-muted mt-1 mb-3">{a.notes}</p>
                ) : null}
                {briefs.length === 0 ? (
                  <p className="ui text-xs text-muted mt-2">
                    No filing matched on the docket yet.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2 list-none p-0">
                    {briefs.map((b, i) => {
                      const url = clEntryUrl(b.court, b.entry, b.recap?.document_number ?? undefined);
                      return (
                        <li
                          key={`${b.court}-${b.date}-${i}`}
                          className="text-sm leading-snug grid grid-cols-[5rem,4.5rem,1fr] gap-x-3"
                        >
                          <span className="ui text-xs uppercase tracking-widest text-muted whitespace-nowrap pt-0.5">
                            {courtLabel(b.court)}
                          </span>
                          <span className="ui text-muted whitespace-nowrap tabular-nums pt-0.5">
                            {shortDate(b.date)}
                          </span>
                          <span>
                            {url ? (
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                {b.description}
                              </a>
                            ) : (
                              b.description
                            )}
                            {b.recap?.available ? (
                              <span className="ui text-xs text-muted ml-2">
                                {b.recap.page_count ? `${b.recap.page_count} pp` : null}
                                {b.recap.file_size ? ` · ${formatSize(b.recap.file_size)}` : null}
                              </span>
                            ) : b.recap ? (
                              <span className="ui badge border-amber-400 text-amber-700 ml-2">
                                PDF not in RECAP
                              </span>
                            ) : null}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
