const BASE = 'https://www.courtlistener.com/api/rest/v4';

export interface RecapEntry {
  id: number;
  docket: number;
  entry_number: number | null;
  date_filed: string | null;
  description: string;
  recap_documents: Array<{
    id: number;
    document_number: string | null;
    description: string;
    filepath_local: string | null;
    is_available: boolean;
  }>;
}

export class CourtListener {
  private token: string;

  constructor(token: string) {
    if (!token) throw new Error('COURTLISTENER_TOKEN missing');
    this.token = token;
  }

  private headers(): HeadersInit {
    return {
      Authorization: `Token ${this.token}`,
      Accept: 'application/json',
      'User-Agent': 'anthropic-v-dow-monitor (vanderbilt-ai-law-lab)',
    };
  }

  /** List docket entries since the given ISO timestamp. */
  async entriesSince(docketId: number, sinceISO: string): Promise<RecapEntry[]> {
    const url = new URL(`${BASE}/docket-entries/`);
    url.searchParams.set('docket', String(docketId));
    url.searchParams.set('date_filed__gte', sinceISO.slice(0, 10));
    url.searchParams.set('order_by', 'date_filed');

    const out: RecapEntry[] = [];
    let next: string | null = url.toString();

    while (next) {
      const res = await fetch(next, { headers: this.headers() });
      if (!res.ok) {
        throw new Error(`CourtListener ${res.status}: ${await res.text()}`);
      }
      const json = (await res.json()) as { results: RecapEntry[]; next: string | null };
      out.push(...json.results);
      next = json.next;
    }
    return out;
  }
}
