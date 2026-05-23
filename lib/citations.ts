/**
 * Lookup table mapping case names and statutes/regs to canonical URLs.
 * Used by linkify() to auto-link citations in prose blocks.
 *
 * Edit this file to add or correct authorities. Keys are matched as
 * case-insensitive whole phrases inside text, longest first.
 *
 * Conventions:
 *  - SCOTUS opinions  → Cornell LII /supremecourt/text/{vol}/{page}
 *  - Lower-court cases → CourtListener search URL (a real opinion link would
 *    require the cluster id; the search URL is a safe fallback)
 *  - U.S. Code        → law.cornell.edu/uscode/text/{title}/{section}
 *  - C.F.R.           → ecfr.gov current title page
 *  - Constitution     → law.cornell.edu/constitution
 */

export interface Authority {
  url: string;
  kind: 'opinion' | 'statute' | 'regulation' | 'constitution' | 'article';
}

export const AUTHORITIES: Record<string, Authority> = {
  // ---- SCOTUS opinions (Cornell LII) ----
  'Mathews v. Eldridge': {
    url: 'https://www.law.cornell.edu/supremecourt/text/424/319',
    kind: 'opinion',
  },
  'Webster v. Doe': {
    url: 'https://www.law.cornell.edu/supremecourt/text/486/592',
    kind: 'opinion',
  },
  'Hartman v. Moore': {
    url: 'https://www.law.cornell.edu/supremecourt/text/547/250',
    kind: 'opinion',
  },
  'Snyder v. Phelps': {
    url: 'https://www.law.cornell.edu/supremecourt/text/562/443',
    kind: 'opinion',
  },
  'Department of Commerce v. New York': {
    url: 'https://www.law.cornell.edu/supremecourt/text/18-966',
    kind: 'opinion',
  },
  "Dep't of Commerce v. New York": {
    url: 'https://www.law.cornell.edu/supremecourt/text/18-966',
    kind: 'opinion',
  },
  'Greene v. McElroy': {
    url: 'https://www.law.cornell.edu/supremecourt/text/360/474',
    kind: 'opinion',
  },
  'Larson v. Domestic & Foreign Commerce Corp.': {
    url: 'https://www.law.cornell.edu/supremecourt/text/337/682',
    kind: 'opinion',
  },
  'American School of Magnetic Healing v. McAnnulty': {
    url: 'https://www.law.cornell.edu/supremecourt/text/187/94',
    kind: 'opinion',
  },
  'Trump v. Hawaii': {
    url: 'https://www.law.cornell.edu/supremecourt/text/17-965',
    kind: 'opinion',
  },
  'Franklin v. Massachusetts': {
    url: 'https://www.law.cornell.edu/supremecourt/text/505/788',
    kind: 'opinion',
  },
  'NRA v. Vullo': {
    url: 'https://www.law.cornell.edu/supremecourt/text/22-842',
    kind: 'opinion',
  },
  'National Rifle Association of America v. Vullo': {
    url: 'https://www.law.cornell.edu/supremecourt/text/22-842',
    kind: 'opinion',
  },
  'Selective Service System v. Minnesota PIRG': {
    url: 'https://www.law.cornell.edu/supremecourt/text/468/841',
    kind: 'opinion',
  },
  'Nixon v. Administrator': {
    url: 'https://www.law.cornell.edu/supremecourt/text/433/425',
    kind: 'opinion',
  },
  'Nixon v. Administrator of General Services': {
    url: 'https://www.law.cornell.edu/supremecourt/text/433/425',
    kind: 'opinion',
  },
  "Motor Vehicle Mfrs. Ass'n v. State Farm": {
    url: 'https://www.law.cornell.edu/supremecourt/text/463/29',
    kind: 'opinion',
  },
  'State Farm': {
    url: 'https://www.law.cornell.edu/supremecourt/text/463/29',
    kind: 'opinion',
  },
  'Johnson v. Couturier': {
    url: 'https://www.courtlistener.com/?q=johnson+v.+couturier+9th+circuit&type=o',
    kind: 'opinion',
  },

  // ---- Circuit court opinions (CourtListener search) ----
  "Arizona Students' Ass'n v. Arizona Bd. of Regents": {
    url: 'https://www.courtlistener.com/?q=%22arizona+students+association%22+%22board+of+regents%22&type=o&court=ca9',
    kind: 'opinion',
  },
  "Ariz. Students' Ass'n": {
    url: 'https://www.courtlistener.com/?q=%22arizona+students+association%22+%22board+of+regents%22&type=o&court=ca9',
    kind: 'opinion',
  },
  'AFGE v. Trump': {
    url: 'https://www.courtlistener.com/?q=%22american+federation+of+government+employees%22+v.+trump&type=o&court=ca9',
    kind: 'opinion',
  },
  'Trifax Corp. v. District of Columbia': {
    url: 'https://www.courtlistener.com/?q=trifax+corp+district+of+columbia&type=o&court=cadc',
    kind: 'opinion',
  },
  "Old Dominion Dairy Prods. v. Sec'y of Defense": {
    url: 'https://www.courtlistener.com/?q=%22old+dominion+dairy%22&type=o&court=cadc',
    kind: 'opinion',
  },
  'Old Dominion Dairy': {
    url: 'https://www.courtlistener.com/?q=%22old+dominion+dairy%22&type=o&court=cadc',
    kind: 'opinion',
  },
  'Luokung Technology Corp. v. DoD': {
    url: 'https://www.courtlistener.com/?q=luokung+technology&type=o&court=dcd',
    kind: 'opinion',
  },
  'Xiaomi Corp. v. DoD': {
    url: 'https://www.courtlistener.com/?q=xiaomi+corp+department+of+defense&type=o&court=dcd',
    kind: 'opinion',
  },

  // ---- Statutes (Cornell LII) ----
  '10 U.S.C. § 3252': {
    url: 'https://www.law.cornell.edu/uscode/text/10/3252',
    kind: 'statute',
  },
  '41 U.S.C. § 4713': {
    url: 'https://www.law.cornell.edu/uscode/text/41/4713',
    kind: 'statute',
  },
  '41 U.S.C. § 1327': {
    url: 'https://www.law.cornell.edu/uscode/text/41/1327',
    kind: 'statute',
  },
  '5 U.S.C. § 705': {
    url: 'https://www.law.cornell.edu/uscode/text/5/705',
    kind: 'statute',
  },
  '5 U.S.C. § 706': {
    url: 'https://www.law.cornell.edu/uscode/text/5/706',
    kind: 'statute',
  },
  '§ 3252': {
    url: 'https://www.law.cornell.edu/uscode/text/10/3252',
    kind: 'statute',
  },
  '§ 4713': {
    url: 'https://www.law.cornell.edu/uscode/text/41/4713',
    kind: 'statute',
  },
  'FASCSA': {
    url: 'https://www.law.cornell.edu/uscode/text/41/4713',
    kind: 'statute',
  },

  // ---- Regulations (eCFR) ----
  '48 C.F.R. § 239.7304': {
    url: 'https://www.ecfr.gov/current/title-48/chapter-2/subchapter-E/part-239#239.7304',
    kind: 'regulation',
  },
  '48 C.F.R. § 9.402': {
    url: 'https://www.ecfr.gov/current/title-48/chapter-1/subchapter-G/part-9#9.402',
    kind: 'regulation',
  },
  'FAR 9.402': {
    url: 'https://www.ecfr.gov/current/title-48/chapter-1/subchapter-G/part-9#9.402',
    kind: 'regulation',
  },
  'Fed. R. Civ. P. 65': {
    url: 'https://www.law.cornell.edu/rules/frcp/rule_65',
    kind: 'regulation',
  },

  // ---- Doctrines / frameworks (link to most-cited articulation) ----
  'Pickering': {
    url: 'https://www.law.cornell.edu/supremecourt/text/391/563',
    kind: 'opinion',
  },
  'Garcetti': {
    url: 'https://www.law.cornell.edu/supremecourt/text/547/410',
    kind: 'opinion',
  },
};

// Pre-sort keys longest-first so that "Department of Commerce v. New York"
// matches before "Department of Commerce".
const SORTED_KEYS = Object.keys(AUTHORITIES).sort((a, b) => b.length - a.length);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build one combined regex that matches any known authority phrase. Word
 * boundaries: require that the match is not preceded by another word char.
 * (Many authority strings contain non-word characters — periods, apostrophes —
 * so a single `\b` on each side isn't reliable.)
 */
const COMBINED = new RegExp(
  `(?<![A-Za-z0-9])(${SORTED_KEYS.map(escapeRegex).join('|')})`,
  'g',
);

/**
 * Walk a string of plain text and return an array of strings interleaved with
 * { url, label, key } tokens for matched authorities. Caller renders the
 * tokens as <a> elements.
 */
export type LinkifyToken = string | { url: string; label: string; key: string };

export function tokenizeAuthorities(text: string): LinkifyToken[] {
  const out: LinkifyToken[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(COMBINED)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) out.push(text.slice(lastIndex, idx));
    const phrase = match[1];
    const auth = AUTHORITIES[phrase] ?? AUTHORITIES[Object.keys(AUTHORITIES).find((k) => k.toLowerCase() === phrase.toLowerCase()) ?? ''];
    if (auth) {
      out.push({ url: auth.url, label: phrase, key: phrase });
    } else {
      out.push(phrase);
    }
    lastIndex = idx + phrase.length;
  }
  if (lastIndex < text.length) out.push(text.slice(lastIndex));
  return out;
}
