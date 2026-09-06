"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClaimDialog, type ReminderForm } from "@/components/claim/ClaimDialog";
import { EditClaimDialog } from "@/components/claim/EditClaimDialog";
import { Banner } from "@/components/ds/Banner";
import { Button } from "@/components/ds/Button";
import type { Campaign } from "@/lib/campaign";
import {
  claimFieldErrors,
  claimFormSchema,
  type ClaimFieldErrors,
} from "@/lib/claim-validation";
import { progressFillStyle } from "@/lib/progress";
import type { Cadence, ReminderLocale } from "@/lib/reminders";
import { themeStyle } from "@/lib/themes";

type Tractate = {
  id: number;
  seder: string;
  name: string;
  chapters: number;
  claimed_by: string | null;
  can_edit: boolean;
  edit_until: string | null;
};

const SEDER_ORDER = ["זרעים", "מועד", "נשים", "נזיקין", "קדשים", "טהרות"];
const FALLBACK_PHOTO = "/candle.png";
const CLAIM_ERRORS: Record<string, string> = {
  invalid_name: "נא למלא שם.",
  invalid_cadence: "נא לבחור תדירות לתזכורות.",
  email_required: "נא למלא כתובת אימייל.",
  phone_required: "נא למלא מספר טלפון.",
  invalid_email: "כתובת האימייל אינה תקינה.",
  invalid_phone: "מספר הטלפון אינו תקין. השתמשו בקידומת בינלאומית, למשל ‎+972…",
  deadline_required: "אין דדליין לחלוקה זו, לכן לא ניתן לבחור תזכורת שבוע לפני.",
  voice_unavailable: "שיחות טלפוניות אינן זמינות כרגע. ניתן לבחור תזכורת באימייל.",
  reminders_unavailable: "התזכורות אינן זמינות כרגע.",
};

function splitCampaignInstructions(instructions: string) {
  const marker = "לשאלות או לתיקונים:";
  const raw = instructions.trim();
  const idx = raw.indexOf(marker);
  if (idx === -1) return { lead: raw, support: "" };
  return {
    lead: raw.slice(0, idx).replace(/[.\s]+$/u, "").trim(),
    support: raw.slice(idx).trim(),
  };
}

function emptyReminder(): ReminderForm {
  return {
    want: false,
    cadence: "weekly" as Cadence,
    sendEmail: true,
    sendVoice: false,
    locale: "he" as ReminderLocale,
    email: "",
    phone: "",
  };
}

export default function CampaignClient({
  campaign,
  remindersAvailable,
  voiceAvailable,
}: {
  campaign: Campaign;
  remindersAvailable: boolean;
  voiceAvailable: boolean;
}) {
  const slug = campaign.slug;
  const hasDeadline = Boolean(campaign.deadline_at);
  const { lead: instructionLead, support: supportLine } = splitCampaignInstructions(
    campaign.instructions
  );
  const theme = themeStyle(campaign.theme);
  const [tractates, setTractates] = useState<Tractate[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [reminder, setReminder] = useState(emptyReminder);
  const [submitting, setSubmitting] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ClaimFieldErrors>({});
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string; href?: string } | null>(
    null
  );
  const [photoSrc, setPhotoSrc] = useState(campaign.photo_url || FALLBACK_PHOTO);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${slug}/state`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setTractates(json.tractates);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, [slug]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);

  function closeForms() {
    setClaimingId(null);
    setEditingId(null);
    setNameInput("");
    setReminder(emptyReminder());
    setClaimError(null);
    setFieldErrors({});
  }

  function clearFieldError(field: keyof ClaimFieldErrors) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  const claiming = tractates?.find((t) => t.id === claimingId) ?? null;
  const editing = tractates?.find((t) => t.id === editingId) ?? null;

  async function submitClaim() {
    if (!claiming || submitting) return;
    const validation = claimFormSchema.safeParse({
      name: nameInput,
      reminders: remindersAvailable && reminder.want,
      email: reminder.email,
      sendVoice: remindersAvailable && voiceAvailable && reminder.sendVoice,
      phone: reminder.phone,
    });
    if (!validation.success) {
      setFieldErrors(claimFieldErrors(validation.error));
      setClaimError(null);
      return;
    }
    const name = validation.data.name;
    setSubmitting(true);
    setMessage(null);
    setClaimError(null);
    setFieldErrors({});
    try {
      const payload: Record<string, unknown> = { id: claiming.id, name };
      if (remindersAvailable && reminder.want) {
        payload.reminders = true;
        payload.cadence = reminder.cadence;
        payload.sendEmail = true;
        payload.sendVoice = voiceAvailable && reminder.sendVoice;
        payload.locale = reminder.locale;
        payload.email = reminder.email;
        payload.phone = reminder.phone;
      }
      const res = await fetch(`/api/campaigns/${slug}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        let manageUrl = "";
        try {
          const json = await res.json();
          if (typeof json.manageUrl === "string") manageUrl = json.manageUrl;
        } catch {
          /* ignore */
        }
        if (reminder.want && manageUrl) {
          setMessage({
            kind: "ok",
            text: "תודה רבה! המסכת נרשמה על שמכם. נשלח אימייל עם קישור לניהול התזכורות. שמרו גם את הקישור כאן:",
            href: manageUrl,
          });
        } else {
          setMessage({
            kind: "ok",
            text: "תודה רבה! המסכת נרשמה על שמכם. תזכו למצוות!",
          });
        }
        closeForms();
      } else if (res.status === 409) {
        setMessage({
          kind: "err",
          text: "המסכת הזו נתפסה זה עתה על ידי מישהו אחר. נא לבחור מסכת אחרת.",
        });
        closeForms();
      } else {
        let code = "";
        try {
          const json = await res.json();
          code = typeof json.error === "string" ? json.error : "";
        } catch {
          /* ignore */
        }
        if (code === "invalid_name") {
          setFieldErrors({ name: CLAIM_ERRORS[code] });
        } else if (code === "email_required" || code === "invalid_email") {
          setFieldErrors({ email: CLAIM_ERRORS[code] });
        } else if (code === "phone_required" || code === "invalid_phone") {
          setFieldErrors({ phone: CLAIM_ERRORS[code] });
        } else {
          setClaimError(CLAIM_ERRORS[code] ?? "אירעה שגיאה. נסו שוב בעוד רגע.");
        }
      }
    } catch {
      setClaimError("אירעה שגיאה. בדקו את החיבור לאינטרנט ונסו שוב.");
    } finally {
      setSubmitting(false);
      load();
    }
  }

  async function submitEdit(id: number, action: "rename" | "release") {
    if (submitting) return;
    const name = nameInput.trim();
    if (action === "rename" && !name) return;

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/campaigns/${slug}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, name }),
      });
      if (res.ok) {
        setMessage({
          kind: "ok",
          text: action === "release" ? "המסכת שוחררה וזמינה שוב." : "השם עודכן בהצלחה.",
        });
        closeForms();
      } else if (res.status === 403) {
        closeForms();
        setMessage({ kind: "err", text: "חלון העריכה של 15 הדקות הסתיים." });
      } else {
        setMessage({ kind: "err", text: "אירעה שגיאה. נסו שוב." });
      }
    } catch {
      setMessage({ kind: "err", text: "אירעה שגיאה. בדקו את החיבור לאינטרנט ונסו שוב." });
    } finally {
      setSubmitting(false);
      load();
    }
  }

  const bySeder = useMemo(() => {
    const groups = new Map<string, Tractate[]>();
    for (const seder of SEDER_ORDER) groups.set(seder, []);
    for (const t of tractates ?? []) {
      if (!groups.has(t.seder)) groups.set(t.seder, []);
      groups.get(t.seder)!.push(t);
    }
    return groups;
  }, [tractates]);

  const total = tractates?.length ?? 0;
  const claimed = tractates?.filter((t) => t.claimed_by).length ?? 0;
  const pct = total ? Math.round((claimed / total) * 100) : 0;

  return (
    <div className="campaign-root" style={theme}>
      <div className="hero">
        <div className="hero-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoSrc}
            alt=""
            aria-label="photo of the niftar"
            className="hero-photo"
            onError={() => {
              if (photoSrc !== FALLBACK_PHOTO) setPhotoSrc(FALLBACK_PHOTO);
            }}
          />
          <h1>{campaign.in_memory_of}</h1>
          {campaign.subtitle && <p className="hero-subtitle">{campaign.subtitle}</p>}
          {instructionLead && <p className="hero-instructions">{instructionLead}</p>}
          {campaign.deadline && <p className="hero-deadline">{campaign.deadline}</p>}
          {supportLine && <p className="hero-support">{supportLine}</p>}
        </div>
      </div>

      <main className="campaign-container">
        {total > 0 && (
          <section className="progress-card">
            <div className="progress-row">
              <span>
                נלקחו <strong>{claimed}</strong> מתוך <strong>{total}</strong> מסכתות
              </span>
              <span className="progress-pct">{pct}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={progressFillStyle(pct)} />
            </div>
          </section>
        )}

        {message && (
          <Banner
            tone={message.kind === "ok" ? "success" : "error"}
            href={message.href}
            hrefLabel="ניהול תזכורות"
          >
            {message.text}
          </Banner>
        )}

        {loadError && tractates === null && (
          <Banner tone="error">לא ניתן לטעון את הנתונים. נסו לרענן את הדף.</Banner>
        )}
        {tractates === null && !loadError && <div className="loading">טוען…</div>}

        {tractates !== null &&
          SEDER_ORDER.filter((s) => (bySeder.get(s) ?? []).length > 0).map((seder) => {
            const items = bySeder.get(seder)!;
            const taken = items.filter((t) => t.claimed_by).length;
            return (
              <section key={seder} className="seder-card">
                <div className="seder-head">
                  <h2>סדר {seder}</h2>
                  <span className="seder-count">
                    {taken}/{items.length}
                  </span>
                </div>
                <ul className="tractate-list">
                  {items.map((t) => (
                    <li
                      key={t.id}
                      className={t.claimed_by ? "row row-taken" : "row"}
                    >
                      <div className="t-info">
                        <span className="t-name">{t.name}</span>
                        <span className="t-chapters">{t.chapters} פרקים</span>
                      </div>
                      <div className="t-status">
                        {t.claimed_by ? (
                          <div className="taken-wrap">
                            <span className="chip-taken">
                              <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                                <path
                                  d="M3 8.5 6.2 11.7 13 4.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              {t.claimed_by}
                            </span>
                            {t.can_edit &&
                              t.edit_until &&
                              Date.parse(t.edit_until) > now && (
                                <Button
                                  variant="ghost"
                                  onPress={() => {
                                    setEditingId(t.id);
                                    setClaimingId(null);
                                    setNameInput(t.claimed_by ?? "");
                                    setReminder(emptyReminder());
                                    setMessage(null);
                                  }}
                                >
                                  עריכה
                                </Button>
                              )}
                          </div>
                        ) : (
                          <Button
                            variant="primary"
                            onPress={() => {
                              setClaimingId(t.id);
                              setEditingId(null);
                              setNameInput("");
                              setReminder(emptyReminder());
                              setClaimError(null);
                              setFieldErrors({});
                              setMessage(null);
                            }}
                          >
                            לקבלת המסכת
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

        <footer className="footer">תהא נשמתו צרורה בצרור החיים</footer>
      </main>

      <ClaimDialog
        isOpen={claiming !== null}
        onOpenChange={(open) => {
          if (!open) closeForms();
        }}
        tractateName={claiming?.name ?? ""}
        chapters={claiming?.chapters ?? 0}
        hasDeadline={hasDeadline}
        remindersAvailable={remindersAvailable}
        voiceAvailable={voiceAvailable}
        name={nameInput}
        onNameChange={(name) => {
          setNameInput(name);
          clearFieldError("name");
        }}
        reminder={reminder}
        onReminderChange={(next) => {
          if (next.email !== reminder.email) clearFieldError("email");
          if (next.phone !== reminder.phone) clearFieldError("phone");
          setReminder(next);
        }}
        fieldErrors={fieldErrors}
        submitting={submitting}
        error={claimError}
        style={theme}
        onSubmit={submitClaim}
      />

      <EditClaimDialog
        isOpen={editing !== null}
        onOpenChange={(open) => {
          if (!open) closeForms();
        }}
        tractateName={editing?.name ?? ""}
        name={nameInput}
        onNameChange={setNameInput}
        submitting={submitting}
        style={theme}
        onRename={() => {
          if (editing) submitEdit(editing.id, "rename");
        }}
        onRelease={() => {
          if (editing) submitEdit(editing.id, "release");
        }}
      />
    </div>
  );
}
