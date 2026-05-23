import type { SourceLink } from '@/lib/data';

const KIND_LABEL: Record<NonNullable<SourceLink['kind']>, string> = {
  opinion: 'Opinion',
  filing: 'Filing',
  authority: 'Authority',
  article: 'Commentary',
  order: 'Order',
  amicus: 'Amicus',
};

export function SourceList({ sources, heading = 'Sources' }: { sources?: SourceLink[]; heading?: string }) {
  if (!sources || sources.length === 0) return null;

  return (
    <section className="mt-8 pt-5 border-t border-rule">
      <h3 className="ui text-xs uppercase tracking-widest text-muted mb-3 m-0">
        {heading}
      </h3>
      <ol className="ui text-sm space-y-2 list-none p-0">
        {sources.map((s, i) => (
          <li key={i} className="flex gap-2 leading-snug">
            <span className="text-muted tabular-nums w-6 shrink-0">{i + 1}.</span>
            <span>
              {s.kind ? (
                <span className="badge mr-2 align-baseline">{KIND_LABEL[s.kind]}</span>
              ) : null}
              {s.url ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              ) : (
                <span>{s.label}</span>
              )}
              {s.cite && !s.url ? <span className="text-muted"> · {s.cite}</span> : null}
              {s.cite && s.url ? <span className="text-muted"> · {s.cite}</span> : null}
              {s.local_path ? (
                <span className="text-muted"> · <code className="text-xs">{s.local_path}</code></span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
