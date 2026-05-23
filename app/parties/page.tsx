import { loadParties } from '@/lib/data';
import { PageHeading } from '@/components/PageHeading';

export const metadata = { title: 'Parties' };

export default function PartiesPage() {
  const p = loadParties();

  return (
    <div>
      <PageHeading
        title="Parties"
        lede="The plaintiff, the eighteen named federal defendants, and the amici who filed in support (and opposition)."
      />

      <section className="mb-12 max-w-prose">
        <h2>Plaintiff</h2>
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

      <section className="mb-12">
        <h2>Defendants</h2>
        <p className="text-muted max-w-prose">
          Eighteen named agencies and officials; the order names all "Defendant Agencies" plus
          Secretary Hegseth and the Executive Office of the President.
        </p>
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-4">
          {p.defendants.map((d) => (
            <li key={d.name} className="border-b border-rule pb-3">
              <p className="font-semibold">{d.name}</p>
              {d.official ? <p className="text-sm text-muted">{d.official}</p> : null}
              {d.type ? <p className="ui text-xs uppercase tracking-widest text-muted mt-1">{d.type}</p> : null}
              {d.role ? <p className="text-sm mt-1">{d.role}</p> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12 max-w-prose">
        <h2>Counsel for the government</h2>
        <p>
          <strong>Trial (N.D. Cal.):</strong> {p.counsel_for_defendants.trial.firm}.{' '}
          {p.counsel_for_defendants.trial.attorneys.join(', ')}.
        </p>
        <p>
          <strong>Appellate (D.C. Cir., 9th Cir.):</strong> {p.counsel_for_defendants.appellate.firm}.{' '}
          {p.counsel_for_defendants.appellate.attorneys.join(', ')}.
        </p>
        {p.counsel_for_defendants.appellate.notes ? (
          <p className="text-muted">{p.counsel_for_defendants.appellate.notes}</p>
        ) : null}
      </section>

      <section>
        <h2>Amici</h2>
        <p className="text-muted max-w-prose">
          Briefs filed across the N.D. Cal. and D.C. Cir. proceedings. Only one amicus has filed
          in support of the government — Joel Thayer of the America First Policy Institute, in
          the D.C. Cir.
        </p>
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-4">
          {p.amici.map((a) => (
            <li key={a.name} className="border-b border-rule pb-3">
              <p className="font-semibold">{a.name}</p>
              <p className="ui text-xs uppercase tracking-widest text-muted mt-1">
                {a.side === 'petitioner'
                  ? 'For petitioner'
                  : a.side === 'respondent'
                    ? 'For respondent'
                    : 'In favor of neither'}{' '}
                · {a.in.map((c) => (c === 'ndcal' ? 'N.D. Cal.' : c === 'dccir' ? 'D.C. Cir.' : c)).join(', ')}
              </p>
              {a.notes ? <p className="text-sm text-muted mt-1">{a.notes}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
