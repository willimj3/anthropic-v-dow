import { tokenizeAuthorities } from '@/lib/citations';

/**
 * Render a YAML pipe-string (or any block of text with blank-line paragraph
 * breaks) as a sequence of <p> elements. Single newlines are folded into
 * spaces; blank lines start a new paragraph.
 *
 * When `linkify` is true, known case names, statutes, and regulations are
 * wrapped in <a> elements pointing at Cornell LII, eCFR, or CourtListener
 * (see lib/citations.ts).
 */
export function Prose({
  text,
  className,
  linkify = false,
}: {
  text: string;
  className?: string;
  linkify?: boolean;
}) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  return (
    <div className={className}>
      {paragraphs.map((p, i) => (
        <p key={i} className={i === paragraphs.length - 1 ? 'mb-0' : ''}>
          {linkify ? renderLinkified(p) : p}
        </p>
      ))}
    </div>
  );
}

function renderLinkified(text: string): React.ReactNode[] {
  const tokens = tokenizeAuthorities(text);
  return tokens.map((tok, i) => {
    if (typeof tok === 'string') return <span key={i}>{tok}</span>;
    return (
      <a key={i} href={tok.url} target="_blank" rel="noopener noreferrer">
        {tok.label}
      </a>
    );
  });
}
