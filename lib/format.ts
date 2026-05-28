import { format, parseISO } from 'date-fns';

/** Long form: "March 26, 2026". */
export function longDate(iso: string): string {
  try {
    return format(parseISO(iso), 'MMMM d, yyyy');
  } catch {
    return iso;
  }
}

/** Short form: "Mar 26, 2026". */
export function shortDate(iso: string): string {
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return iso;
  }
}

/** Month-year for grouping ("March 2026"). */
export function monthYear(iso: string): string {
  try {
    return format(parseISO(iso), 'MMMM yyyy');
  } catch {
    return iso;
  }
}

/** YYYY-MM key for stable sorting. */
export function monthKey(iso: string): string {
  try {
    return format(parseISO(iso), 'yyyy-MM');
  } catch {
    return iso.slice(0, 7);
  }
}

export function courtLabel(id: string): string {
  switch (id) {
    case 'ndcal':
      return 'N.D. Cal.';
    case 'dccir':
      return 'D.C. Cir.';
    case 'ca9':
      return '9th Cir.';
    default:
      return id;
  }
}

const CASE_SLUGS: Record<string, string> = {
  ndcal: 'anthropic-pbc-v-us-department-of-war',
  dccir: 'anthropic-pbc-v-united-states-department-of-war',
  ca9: 'anthropic-pbc-v-united-states-department-of-war-et-al',
};

const DOCKET_CL_IDS: Record<string, number> = {
  ndcal: 72379655,
  dccir: 72380208,
  ca9: 73136734,
};

/** Root CourtListener URL for the docket (no entry segment). */
export function clDocketUrl(court: string): string | null {
  const docketId = DOCKET_CL_IDS[court];
  const slug = CASE_SLUGS[court];
  if (!docketId || !slug) return null;
  return `https://www.courtlistener.com/docket/${docketId}/${slug}/`;
}

/**
 * CourtListener URL for a specific docket entry. For trial-court dockets
 * (ndcal), CL accepts the bare entry number. For appellate dockets, the URL
 * path component is the full document_number (with leading zeros), which only
 * works if we have it from the recap-status sidecar — otherwise fall back to
 * the docket root.
 *
 * The dccir TSV's "Entry" column is a scrape ID that does NOT correspond to
 * any CL URL segment, so it must never be used as the path component.
 */
export function clEntryUrl(
  court: string,
  entryNumber: string | number | null | undefined,
  documentNumber?: string | null,
): string | null {
  const docketId = DOCKET_CL_IDS[court];
  const slug = CASE_SLUGS[court];
  if (!docketId || !slug) return null;

  const isTrial = court === 'ndcal';
  let pathComponent: string | null = null;
  if (documentNumber) {
    pathComponent = documentNumber;
  } else if (isTrial && entryNumber && entryNumber !== '-') {
    pathComponent = String(entryNumber);
  }

  if (!pathComponent) {
    return clDocketUrl(court);
  }
  return `https://www.courtlistener.com/docket/${docketId}/${pathComponent}/${slug}/`;
}
