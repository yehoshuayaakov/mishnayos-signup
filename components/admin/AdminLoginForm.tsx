"use client";

import { FormEvent, useState } from "react";
import { Banner } from "@/components/ds/Banner";
import { Button } from "@/components/ds/Button";
import { Surface } from "@/components/ds/Surface";
import { TextField } from "@/components/ds/TextField";
import { organizerLoginSchema } from "@/lib/admin-validation";

export function AdminLoginForm({ invalidLink = false }: { invalidLink?: boolean }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(
    invalidLink ? "הקישור אינו תקין או שפג תוקפו." : null
  );
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = organizerLoginSchema.safeParse({ email });
    if (!parsed.success) {
      setError("נא להזין כתובת אימייל תקינה.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) throw new Error();
      setSent(true);
    } catch {
      setError("לא ניתן לשלוח קישור כרגע. נסו שוב מאוחר יותר.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Surface className="w-full max-w-md p-5 sm:p-7">
      <h1 className="text-2xl font-bold text-[var(--navy-800)]">כניסת מנהלי חלוקה</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        נשלח קישור כניסה חד-פעמי לכתובת שהוזמנה מראש.
      </p>
      <div className="mt-4 space-y-3">
        {sent && (
          <Banner tone="success">
            אם הכתובת מורשית, קישור כניסה נשלח אליה. אפשר לסגור את החלון הזה.
          </Banner>
        )}
        {error && <Banner tone="error">{error}</Banner>}
      </div>
      {!sent && (
        <form className="mt-5 space-y-5" onSubmit={submit} noValidate>
          <TextField
            label="כתובת אימייל"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            isDisabled={submitting}
            isRequired
          />
          <Button type="submit" size="lg" className="w-full" isDisabled={submitting}>
            {submitting ? "שולח…" : "שליחת קישור כניסה"}
          </Button>
        </form>
      )}
    </Surface>
  );
}
