import { Resend } from "resend";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export function reminderFromAddress(): string | null {
  return process.env.RESEND_FROM?.trim() || null;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: true; id?: string } | { ok: false; retryable: boolean; error: string }> {
  const resend = getResend();
  const from = reminderFromAddress();
  if (!resend || !from) {
    return { ok: false, retryable: false, error: "email_not_configured" };
  }
  const { data, error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
  if (error) {
    const status = (error as { statusCode?: number }).statusCode;
    const retryable = status === undefined || status >= 500;
    return { ok: false, retryable, error: error.message };
  }
  return { ok: true, id: data?.id };
}
