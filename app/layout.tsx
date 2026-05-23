import type { Metadata } from 'next';
import './globals.css';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { loadCaseMeta } from '@/lib/data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const SITE_NAME = 'Anthropic v. Department of War';
const SITE_DESC =
  'An explainer and litigation tracker for Anthropic PBC v. U.S. Department of War, covering the parallel proceedings in N.D. Cal., the D.C. Circuit, and the Ninth Circuit.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Explainer & Tracker`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESC,
  authors: [{ name: 'Vanderbilt AI Law Lab' }],
  robots: { index: true, follow: true },
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    title: `${SITE_NAME} — Explainer & Tracker`,
    description: SITE_DESC,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Explainer & Tracker`,
    description: SITE_DESC,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const meta = loadCaseMeta();

  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="ui sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-paper focus:px-3 focus:py-2 focus:border focus:border-rule"
        >
          Skip to content
        </a>
        <SiteNav />
        <main id="main" className="mx-auto max-w-page px-6 lg:px-10 py-10">
          {children}
        </main>
        <SiteFooter lastUpdated={meta.last_updated} />
      </body>
    </html>
  );
}
