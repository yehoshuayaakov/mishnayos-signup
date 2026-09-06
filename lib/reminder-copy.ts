import type { ReminderLocale } from "@/lib/reminders";

export function tractateLabel(locale: ReminderLocale, nameHe: string, nameEn: string): string {
  return locale === "en" && nameEn ? nameEn : nameHe;
}

export function confirmationCopy(opts: {
  locale: ReminderLocale;
  name: string;
  tractate: string;
  niftar: string;
  manageUrl: string;
}): { subject: string; text: string; html: string } {
  if (opts.locale === "en") {
    const subject = `You're signed up for ${opts.tractate}`;
    const text = `Thank you, ${opts.name}. You took ${opts.tractate} in memory of ${opts.niftar}.\n\nManage or unsubscribe from reminders:\n${opts.manageUrl}`;
    const html = `<p>Thank you, ${esc(opts.name)}.</p><p>You took <strong>${esc(opts.tractate)}</strong> in memory of ${esc(opts.niftar)}.</p><p><a href="${esc(opts.manageUrl)}">Manage or unsubscribe from reminders</a></p>`;
    return { subject, text, html };
  }
  const subject = `נרשמתם למסכת ${opts.tractate}`;
  const text = `תודה, ${opts.name}. קיבלתם על עצמכם את מסכת ${opts.tractate} לעילוי נשמת ${opts.niftar}.\n\nניהול או ביטול תזכורות:\n${opts.manageUrl}`;
  const html = `<div dir="rtl"><p>תודה, ${esc(opts.name)}.</p><p>קיבלתם על עצמכם את מסכת <strong>${esc(opts.tractate)}</strong> לעילוי נשמת ${esc(opts.niftar)}.</p><p><a href="${esc(opts.manageUrl)}">ניהול או ביטול תזכורות</a></p></div>`;
  return { subject, text, html };
}

export function reminderEmailCopy(opts: {
  locale: ReminderLocale;
  name: string;
  tractate: string;
  niftar: string;
  deadline: string;
  manageUrl: string;
}): { subject: string; text: string; html: string } {
  const deadlineLine = opts.deadline
    ? opts.locale === "en"
      ? `\nDeadline: ${opts.deadline}`
      : `\n${opts.deadline}`
    : "";
  if (opts.locale === "en") {
    const subject = `Reminder: ${opts.tractate}`;
    const text = `Hello ${opts.name}. This is a reminder that you took ${opts.tractate} in memory of ${opts.niftar}.${deadlineLine}\n\nUnsubscribe:\n${opts.manageUrl}`;
    const html = `<p>Hello ${esc(opts.name)}.</p><p>This is a reminder that you took <strong>${esc(opts.tractate)}</strong> in memory of ${esc(opts.niftar)}.</p>${opts.deadline ? `<p>${esc(opts.deadline)}</p>` : ""}<p><a href="${esc(opts.manageUrl)}">Unsubscribe</a></p>`;
    return { subject, text, html };
  }
  const subject = `תזכורת: מסכת ${opts.tractate}`;
  const text = `שלום ${opts.name}. תזכורת מחלוקת המשניות: קיבלתם על עצמכם את מסכת ${opts.tractate} לעילוי נשמת ${opts.niftar}.${deadlineLine}\n\nביטול תזכורות:\n${opts.manageUrl}`;
  const html = `<div dir="rtl"><p>שלום ${esc(opts.name)}.</p><p>תזכורת מחלוקת המשניות: קיבלתם על עצמכם את מסכת <strong>${esc(opts.tractate)}</strong> לעילוי נשמת ${esc(opts.niftar)}.</p>${opts.deadline ? `<p>${esc(opts.deadline)}</p>` : ""}<p><a href="${esc(opts.manageUrl)}">ביטול תזכורות</a></p></div>`;
  return { subject, text, html };
}

export function voiceScript(opts: {
  locale: ReminderLocale;
  tractate: string;
  niftar: string;
}): string {
  if (opts.locale === "en") {
    return `Hello. This is a reminder from the Mishnayos signup. You took ${opts.tractate} in memory of ${opts.niftar}. Thank you.`;
  }
  return `שלום. תזכורת מחלוקת המשניות. קיבלתם על עצמכם את מסכת ${opts.tractate} לעילוי נשמת ${opts.niftar}. תזכו למצוות.`;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
