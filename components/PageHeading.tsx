export function PageHeading({
  eyebrow,
  title,
  lede,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="mb-10 max-w-prose">
      {eyebrow ? (
        <p className="ui text-xs uppercase tracking-widest text-muted mb-2">{eyebrow}</p>
      ) : null}
      <h1>{title}</h1>
      {lede ? <p className="text-muted mt-3 text-lg">{lede}</p> : null}
    </header>
  );
}
