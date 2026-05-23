import Link from 'next/link';

const NAV = [
  { href: '/', label: 'Overview' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/dockets', label: 'Dockets' },
  { href: '/law', label: 'Law' },
  { href: '/press', label: 'Press' },
  { href: '/study-guide', label: 'Study guide' },
  { href: '/glossary', label: 'Glossary' },
  { href: '/documents', label: 'Documents' },
];

export function SiteNav() {
  return (
    <header className="border-b border-rule bg-paper/95 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-page px-6 lg:px-10 py-3 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <Link
          href="/"
          className="ui font-semibold text-ink no-underline tracking-tight whitespace-nowrap"
        >
          Anthropic <span className="text-muted font-normal">v.</span> DoW
        </Link>
        <nav className="ui flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
