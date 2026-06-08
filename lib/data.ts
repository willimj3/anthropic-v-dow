import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = path.join(process.cwd(), 'data');

// JSON_SCHEMA keeps ISO date strings as strings (the default schema would
// auto-cast 2026-05-23 to a JS Date, which breaks downstream rendering).
function readYaml<T>(rel: string): T {
  const full = path.join(ROOT, rel);
  const raw = fs.readFileSync(full, 'utf8');
  return yaml.load(raw, { schema: yaml.JSON_SCHEMA }) as T;
}

// ---------- types ----------

export type DocketStatus = 'green' | 'amber' | 'gray' | 'red';
export type Importance = 'high' | 'medium' | 'low';

export interface DocketMeta {
  id: 'ndcal' | 'dccir' | 'ca9';
  court: string;
  judge?: string;
  panel?: string;
  case_no: string;
  courtlistener_id: number;
  courtlistener_url: string;
  status: string;
  status_color: DocketStatus;
}

export interface CaseMeta {
  case_name: string;
  short_name: string;
  plaintiff: string;
  filed: string;
  status_summary: string;
  last_updated: string;
  dockets: DocketMeta[];
}

export interface TimelineEvent {
  date: string;
  kind: 'background' | 'dispute' | 'government-action' | 'litigation' | 'ruling' | 'commentary';
  title: string;
  detail?: string;
  citation?: string;
  source_url?: string;
}

export interface WhatsNextEntry {
  date: string;
  court?: 'ndcal' | 'dccir' | 'ca9';
  title: string;
  detail?: string;
  source?: {
    label: string;
    url?: string;
    local?: string;
  };
}

export interface Counsel {
  firm: string;
  lead: string;
  role: string;
}

export interface Party {
  name: string;
  type?: string;
  official?: string;
  role?: string;
  state_of_incorporation?: string;
  hq?: string;
  counsel?: Counsel[];
}

export interface Amicus {
  name: string;
  side: 'petitioner' | 'respondent' | 'neither';
  in: string[];
  notes?: string;
  /**
   * Case-insensitive substrings used to match docket-entry descriptions to
   * this amicus (in addition to "amicus" in the description). If omitted,
   * the amicus's `name` is used as a single match term — works for
   * unambiguous names but fails when the amicus is one of several listed on
   * a single joint brief.
   */
  match?: string[];
}

export interface Parties {
  plaintiff: Party;
  defendants: Party[];
  counsel_for_defendants: {
    trial: { firm: string; attorneys: string[] };
    appellate: { firm: string; attorneys: string[]; notes?: string };
  };
  amici: Amicus[];
}

export interface Claim {
  count: string;
  short: string;
  full: string;
  defendants: string[];
  status_at_pi: string;
  status: string;
  status_color: DocketStatus;
}

export interface SourceLink {
  label: string;
  url?: string;        // external URL (CourtListener, Lawfare, etc.)
  cite?: string;       // legal citation when no URL exists
  local_path?: string; // mirrored file under source-docs/
  kind?: 'opinion' | 'filing' | 'authority' | 'article' | 'order' | 'amicus';
}

export interface Issue {
  slug: string;
  title: string;
  doctrinal_framework: string;
  status_at_pi: string;
  open_questions: string;
  related_holdings?: string[];          // dates of /holdings entries
  related_claims?: string[];            // count IDs (e.g., "IV")
  sources?: SourceLink[];
}

export interface HoldingTheory {
  issue: string;          // human-readable
  issue_slug?: string;    // links to /issues/[slug]
  result: string;
}

export interface Holding {
  date: string;
  court: 'ndcal' | 'dccir' | 'ca9';
  judge?: string;
  panel?: string;
  caption: string;
  docket_entries?: number[];
  bottom_line: string;
  theories?: HoldingTheory[];
  key_quotes?: { quote: string; page?: string }[];
  local_doc?: string;
  courtlistener_url?: string;
  sources?: SourceLink[];
}

export type GlossaryCategory =
  | 'statute'
  | 'regulation'
  | 'procedural'
  | 'doctrine'
  | 'entity'
  | 'govcon'
  | 'case-term';

export interface GlossaryEntry {
  term: string;
  slug: string;
  category: GlossaryCategory;
  aliases?: string[];
  definition: string;
  see_also?: string[];
}

export interface CommentaryItem {
  title: string;
  authors?: string[];
  publication: string;
  date: string;
  tag: 'analysis' | 'news' | 'brief';
  url?: string;
  summary: string;
  sources?: SourceLink[];   // additional cited material
}

export interface NewsItem {
  title: string;
  source: string;
  date: string;
  url: string;
  approved: boolean;
  summary?: string;
}

export interface UpdateEntry {
  date: string;
  title: string;
  detail: string;
  pages?: string[];
}

export interface DocketDocument {
  title: string;
  url?: string;
  local_path?: string;
}

export interface DocketEntry {
  entry: string | null;
  date: string;
  description: string;
  importance: Importance;
  notes?: string;
  documents?: DocketDocument[];
}

// ---------- loaders ----------

export function loadCaseMeta(): CaseMeta {
  const meta = readYaml<CaseMeta>('case-meta.yaml');
  // Derive "last updated" from the freshest dated fact actually on the site,
  // so it can't drift from the data the way the hand-maintained field did.
  // When a sync appends a new docket entry, this advances on its own.
  return { ...meta, last_updated: latestActivityDate(meta.last_updated) };
}

/**
 * Max date across all docket entries plus the updates changelog. ISO date
 * strings sort lexicographically, so the last element is the most recent. The
 * stored case-meta value is included as a floor, so this never regresses or
 * returns empty.
 */
function latestActivityDate(stored: string): string {
  const dates: string[] = [stored];
  const all = loadAllDocketEntries();
  for (const court of ['ndcal', 'dccir', 'ca9'] as const) {
    for (const e of all[court]) if (e?.date) dates.push(e.date);
  }
  for (const u of loadUpdates()) if (u?.date) dates.push(u.date);
  return dates.filter(Boolean).sort().at(-1) ?? stored;
}

export function loadTimeline(): TimelineEvent[] {
  return readYaml<TimelineEvent[]>('timeline.yaml');
}

export function loadWhatsNext(): WhatsNextEntry[] {
  return readYaml<WhatsNextEntry[]>('whats-next.yaml');
}

export function loadParties(): Parties {
  return readYaml<Parties>('parties.yaml');
}

export function loadClaims(): Claim[] {
  return readYaml<Claim[]>('claims.yaml');
}

export function loadIssues(): Issue[] {
  return readYaml<Issue[]>('issues.yaml');
}

export function loadHoldings(): Holding[] {
  return readYaml<Holding[]>('holdings.yaml');
}

export function loadCommentary(): CommentaryItem[] {
  return readYaml<CommentaryItem[]>('commentary.yaml');
}

export function loadNews(): NewsItem[] {
  return readYaml<NewsItem[]>('news.yaml');
}

export function loadUpdates(): UpdateEntry[] {
  return readYaml<UpdateEntry[]>('updates.yaml');
}

export function loadGlossary(): GlossaryEntry[] {
  return readYaml<GlossaryEntry[]>('glossary.yaml');
}

// ---------- amicus brief discovery ----------

export interface AmicusBrief {
  court: 'ndcal' | 'dccir' | 'ca9';
  date: string;
  entry: string | null;
  description: string;
  recap?: RecapStatus | null;
}

/**
 * Scan all three dockets for entries whose description mentions both
 * "amicus" and the amicus's name (or one of its `match` aliases). Dedupes
 * by (court, date) so a "motion to file" plus a separately-docketed "lodged
 * brief" only count once.
 */
export function briefsForAmicus(amicus: Amicus): AmicusBrief[] {
  const terms = (amicus.match && amicus.match.length > 0 ? amicus.match : [amicus.name])
    .map((t) => t.toLowerCase());

  const all = loadAllDocketEntries();
  const found: AmicusBrief[] = [];
  const seen = new Set<string>();

  for (const court of ['ndcal', 'dccir', 'ca9'] as const) {
    for (const entry of all[court]) {
      const desc = (entry.description || '').toLowerCase();
      if (!desc.includes('amicus')) continue;
      const hit = terms.some((t) => desc.includes(t));
      if (!hit) continue;
      const dedupeKey = `${court}-${entry.date}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      found.push({
        court,
        date: entry.date,
        entry: entry.entry,
        description: entry.description,
        recap: recapStatusFor(court, entry),
      });
    }
  }

  found.sort((a, b) => (a.date < b.date ? -1 : 1));
  return found;
}

export function loadDocketEntries(id: 'ndcal' | 'dccir' | 'ca9'): DocketEntry[] {
  return readYaml<DocketEntry[]>(`dockets/${id}-entries.yaml`);
}

export function loadAllDocketEntries(): Record<'ndcal' | 'dccir' | 'ca9', DocketEntry[]> {
  return {
    ndcal: loadDocketEntries('ndcal'),
    dccir: loadDocketEntries('dccir'),
    ca9: loadDocketEntries('ca9'),
  };
}

export interface RecapStatus {
  available: boolean;
  is_available_flag?: boolean;
  filepath_local?: boolean;
  document_number?: string | null;
  page_count?: number | null;
  file_size?: number | null;
  reason?: string;
}

let _recapStatus: Record<string, RecapStatus> | null = null;
let _recapStatusMissing = false;

export function loadRecapStatus(): Record<string, RecapStatus> {
  if (_recapStatus || _recapStatusMissing) return _recapStatus ?? {};
  const full = path.join(ROOT, 'dockets', 'recap-status.json');
  if (!fs.existsSync(full)) {
    _recapStatusMissing = true;
    return {};
  }
  _recapStatus = JSON.parse(fs.readFileSync(full, 'utf8')) as Record<string, RecapStatus>;
  return _recapStatus;
}

/** Normalize a description to the same shape used in recap-status keys. */
function descKey(text: string): string {
  return (text || '')
    .replace(/\s+/g, ' ')
    .replace(/\[\d+(?:-\d+)?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .slice(0, 80);
}

export function recapStatusFor(
  court: string,
  entry: { entry: string | null; description: string },
): RecapStatus | null {
  const all = loadRecapStatus();
  const keys: string[] = [];
  if (entry.entry) {
    // Coerce: an all-digits docket/document number can arrive as a YAML number
    // (e.g. an unquoted leading-zero appellate doc id), and calling string
    // methods on it would crash the static build.
    const id = String(entry.entry);
    keys.push(`${court}-${id}`);
    keys.push(`${court}-doc:${id}`);
    keys.push(`${court}-doc:${id.replace(/^0+/, '') || '0'}`);
  }
  const d = descKey(entry.description);
  if (d) keys.push(`${court}-d:${d}`);
  for (const k of keys) {
    if (all[k]) return all[k];
  }
  return null;
}
