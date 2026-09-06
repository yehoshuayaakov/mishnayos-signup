"use client";

import { useState } from "react";
import { Banner } from "@/components/ds/Banner";
import { Button } from "@/components/ds/Button";
import { Surface } from "@/components/ds/Surface";

const COPY = {
  he: {
    title: "ניהול תזכורות",
    for: "עבור מסכת",
    niftar: "לעילוי נשמת",
    cadence: {
      daily: "תזכורת יומית",
      weekly: "תזכורת שבועית",
      week_before: "תזכורת שבוע לפני הדדליין",
    } as Record<string, string>,
    email: "אימייל",
    voice: "שיחה טלפונית",
    stopped: "התזכורות בוטלו.",
    stop: "ביטול תזכורות",
    error: "אירעה שגיאה. נסו שוב.",
  },
  en: {
    title: "Manage reminders",
    for: "For tractate",
    niftar: "In memory of",
    cadence: {
      daily: "Daily reminder",
      weekly: "Weekly reminder",
      week_before: "Reminder one week before the deadline",
    } as Record<string, string>,
    email: "Email",
    voice: "Phone call",
    stopped: "Reminders have been turned off.",
    stop: "Unsubscribe",
    error: "Something went wrong. Please try again.",
  },
};

export default function ManageClient({
  token,
  locale,
  tractateName,
  niftar,
  cadence,
  sendEmail,
  sendVoice,
  unsubscribed,
}: {
  token: string;
  locale: "he" | "en";
  tractateName: string;
  niftar: string;
  cadence: string;
  sendEmail: boolean;
  sendVoice: boolean;
  unsubscribed: boolean;
}) {
  const t = COPY[locale];
  const [done, setDone] = useState(unsubscribed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function unsubscribe() {
    if (busy || done) return;
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(`/api/reminders/${token}`, { method: "POST" });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const channels = [sendEmail ? t.email : null, sendVoice ? t.voice : null].filter(Boolean);

  return (
    <main
      className="mx-auto max-w-[620px] px-4 py-12 sm:py-20"
      dir={locale === "he" ? "rtl" : "ltr"}
    >
      <Surface className="p-6 sm:p-8">
        <span className="mb-4 block h-1 w-10 rounded-full bg-[var(--gold)]" />
        <h1 className="mb-4 text-2xl font-bold text-[var(--navy-900)]">{t.title}</h1>
        <p>
          {t.for} <strong>{tractateName}</strong>
        </p>
        <p className="mt-1 text-[var(--muted)]">
          {t.niftar} {niftar}
        </p>
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[#f7f8fa] px-4 py-3">
          <p className="font-semibold text-[var(--navy-800)]">{t.cadence[cadence] ?? cadence}</p>
          {channels.length > 0 && (
            <p className="mt-1 text-sm text-[var(--muted)]">{channels.join(" · ")}</p>
          )}
        </div>
        {done ? (
          <Banner tone="success" className="mt-5 mb-0">
            {t.stopped}
          </Banner>
        ) : (
          <Button
            type="button"
            variant="danger"
            size="lg"
            className="mt-5"
            isDisabled={busy}
            onPress={unsubscribe}
            data-testid="unsubscribe-btn"
          >
            {t.stop}
          </Button>
        )}
        {error && (
          <Banner tone="error" className="mt-4 mb-0">
            {t.error}
          </Banner>
        )}
      </Surface>
    </main>
  );
}
