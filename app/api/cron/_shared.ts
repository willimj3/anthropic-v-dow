import { NextResponse } from 'next/server';

/**
 * Vercel sets a CRON_SECRET request header when invoking cron paths via its
 * scheduler — we require it before doing anything substantive. This prevents
 * an unauthenticated GET from triggering the monitor in production.
 */
export function requireCronAuth(req: Request): NextResponse | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET not set on server' },
      { status: 503 },
    );
  }
  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  return null;
}

export function requireEnv(...names: string[]): { missing: string[] } {
  return { missing: names.filter((n) => !process.env[n]) };
}
