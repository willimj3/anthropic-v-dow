/**
 * Plain-text email sender. Supports Resend or Postmark, whichever is
 * configured. Falls back to a logged no-op if neither key is present.
 *
 * Env vars (set exactly one):
 *   RESEND_API_KEY  — https://resend.com
 *   POSTMARK_TOKEN  — https://postmarkapp.com (server token)
 *
 * Email format is plain text per the maintainer's preference (alerts-config.yaml).
 */

export interface SendArgs {
  to: string[];
  from: string;
  subject: string;
  text: string;
}

export async function sendEmail(args: SendArgs): Promise<{ sent: boolean; provider: string; note?: string }> {
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(args, process.env.RESEND_API_KEY);
  }
  if (process.env.POSTMARK_TOKEN) {
    return sendViaPostmark(args, process.env.POSTMARK_TOKEN);
  }
  return {
    sent: false,
    provider: 'none',
    note: 'No email provider configured (set RESEND_API_KEY or POSTMARK_TOKEN). Digest computed but not sent.',
  };
}

async function sendViaResend(args: SendArgs, apiKey: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: args.from,
      to: args.to,
      subject: args.subject,
      text: args.text,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return { sent: true, provider: 'resend' as const };
}

async function sendViaPostmark(args: SendArgs, token: string) {
  const res = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': token,
    },
    body: JSON.stringify({
      From: args.from,
      To: args.to.join(', '),
      Subject: args.subject,
      TextBody: args.text,
      MessageStream: 'outbound',
    }),
  });
  if (!res.ok) throw new Error(`Postmark ${res.status}: ${await res.text()}`);
  return { sent: true, provider: 'postmark' as const };
}
