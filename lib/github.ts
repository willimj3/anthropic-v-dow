/**
 * Minimal GitHub REST helpers for the monitor. The Vercel serverless filesystem
 * is read-only at runtime, so the monitor cannot mutate this repo's data/*.yaml
 * files directly. Instead it opens issues that the maintainer reviews and
 * either commits manually or via a GitHub Action.
 *
 * Env vars required:
 *   GITHUB_TOKEN  — a fine-grained PAT with `issues: write` on this repo.
 *   GITHUB_REPO   — "owner/name", e.g. "vanderbilt-ai-law-lab/anthropic-v-dow".
 */

const GH_BASE = 'https://api.github.com';

function ghEnv(): { token: string; repo: string } | null {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) return null;
  return { token, repo };
}

export async function openIssue(
  title: string,
  body: string,
  labels: string[] = [],
): Promise<{ url: string } | { skipped: true; reason: string }> {
  const env = ghEnv();
  if (!env) {
    return { skipped: true, reason: 'GITHUB_TOKEN or GITHUB_REPO missing — issue not created' };
  }
  const res = await fetch(`${GH_BASE}/repos/${env.repo}/issues`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ title, body, labels }),
  });
  if (!res.ok) {
    throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { html_url: string };
  return { url: json.html_url };
}
