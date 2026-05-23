import Link from 'next/link';
import { longDate } from '@/lib/format';

export function SiteFooter({ lastUpdated }: { lastUpdated: string }) {
  return (
    <footer className="ui border-t border-rule mt-20">
      <div className="mx-auto max-w-page px-6 lg:px-10 py-8 text-sm text-muted flex flex-col gap-2 sm:flex-row sm:justify-between">
        <div>
          Last updated <span className="text-ink">{longDate(lastUpdated)}</span>.
          Maintained by the Vanderbilt AI Law Lab.
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/about" className="nav-link">About</Link>
          <Link href="/updates" className="nav-link">Updates</Link>
          <a
            href="https://www.courtlistener.com/docket/72379655/anthropic-pbc-v-us-department-of-war/"
            className="nav-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            CourtListener
          </a>
        </div>
      </div>
    </footer>
  );
}
