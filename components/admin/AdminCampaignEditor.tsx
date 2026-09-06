"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Banner } from "@/components/ds/Banner";
import { Button } from "@/components/ds/Button";
import { Select } from "@/components/ds/Select";
import { Surface } from "@/components/ds/Surface";
import { TextArea } from "@/components/ds/TextArea";
import { TextField } from "@/components/ds/TextField";
import {
  adminCampaignSchema,
  type AdminCampaignInput,
} from "@/lib/admin-validation";
import { THEME_NAMES } from "@/lib/themes";

type AdminTractate = {
  id: number;
  seder: string;
  name: string;
  chapters: number;
  claimed_by: string | null;
};

const THEME_LABELS: Record<(typeof THEME_NAMES)[number], string> = {
  navy: "כחול כהה",
  forest: "ירוק יער",
  burgundy: "בורדו",
  slate: "אפור צפחה",
};

export function AdminCampaignEditor({
  campaignId,
  slug,
  initialCampaign,
  initialTractates,
}: {
  campaignId: number;
  slug: string;
  initialCampaign: AdminCampaignInput;
  initialTractates: AdminTractate[];
}) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [tractates, setTractates] = useState(initialTractates);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [claimantName, setClaimantName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(
    null
  );

  function update<K extends keyof AdminCampaignInput>(key: K, value: AdminCampaignInput[K]) {
    setCampaign((current) => ({ ...current, [key]: value }));
  }

  async function saveCampaign(event: FormEvent) {
    event.preventDefault();
    const parsed = adminCampaignSchema.safeParse(campaign);
    if (!parsed.success) {
      setMessage({ tone: "error", text: "יש לתקן את השדות המסומנים ולנסות שוב." });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) throw new Error();
      setCampaign(parsed.data);
      setMessage({ tone: "success", text: "פרטי החלוקה נשמרו." });
    } catch {
      setMessage({ tone: "error", text: "לא ניתן לשמור כרגע. נסו שוב." });
    } finally {
      setSubmitting(false);
    }
  }

  async function updateTractate(id: number, action: "rename" | "release") {
    if (submitting) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/admin/campaigns/${campaignId}/tractates/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            action === "rename" ? { action, name: claimantName } : { action }
          ),
        }
      );
      if (!response.ok) throw new Error();
      setTractates((current) =>
        current.map((tractate) =>
          tractate.id === id
            ? {
                ...tractate,
                claimed_by: action === "rename" ? claimantName.trim() : null,
              }
            : tractate
        )
      );
      setEditingId(null);
      setClaimantName("");
      setMessage({
        tone: "success",
        text: action === "rename" ? "שם הלומד עודכן." : "המסכת שוחררה.",
      });
    } catch {
      setMessage({ tone: "error", text: "לא ניתן לעדכן את המסכת כרגע." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link className="text-sm font-semibold text-[var(--navy-600)] underline" href="/admin">
            חזרה לכל החלוקות
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-[var(--navy-800)]">{campaign.title}</h1>
        </div>
        <Link
          href={`/${slug}`}
          target="_blank"
          className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--navy-700)]"
        >
          צפייה בלוח
        </Link>
      </header>

      {message && <Banner tone={message.tone}>{message.text}</Banner>}

      <Surface className="p-4 sm:p-6">
        <h2 className="text-lg font-bold text-[var(--navy-800)]">פרטי החלוקה</h2>
        <form className="mt-5 space-y-5" onSubmit={saveCampaign} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="כותרת"
              value={campaign.title}
              onChange={(value) => update("title", value)}
              maxLength={120}
              isRequired
              isDisabled={submitting}
            />
            <TextField
              label="לעילוי נשמת"
              value={campaign.in_memory_of}
              onChange={(value) => update("in_memory_of", value)}
              maxLength={180}
              isRequired
              isDisabled={submitting}
            />
            <TextField
              label="כותרת משנה"
              value={campaign.subtitle}
              onChange={(value) => update("subtitle", value)}
              maxLength={180}
              isDisabled={submitting}
            />
            <TextField
              label="מועד סיום מוצג"
              value={campaign.deadline}
              onChange={(value) => update("deadline", value)}
              maxLength={180}
              isDisabled={submitting}
            />
            <TextField
              label="כתובת תמונה"
              value={campaign.photo_url}
              onChange={(value) => update("photo_url", value)}
              maxLength={500}
              description="כתובת HTTPS או נתיב פנימי, למשל ‎/photo.jpg"
              isDisabled={submitting}
            />
            <Select
              label="ערכת צבעים"
              options={THEME_NAMES.map((theme) => ({
                id: theme,
                label: THEME_LABELS[theme],
              }))}
              selectedKey={campaign.theme}
              onSelectionChange={(key) =>
                update("theme", String(key) as AdminCampaignInput["theme"])
              }
              isDisabled={submitting}
            />
          </div>
          <TextArea
            label="הוראות ללומדים"
            value={campaign.instructions}
            onChange={(value) => update("instructions", value)}
            maxLength={600}
            isDisabled={submitting}
          />
          <div className="flex justify-end">
            <Button type="submit" size="lg" isDisabled={submitting}>
              {submitting ? "שומר…" : "שמירת פרטים"}
            </Button>
          </div>
        </form>
      </Surface>

      <Surface className="overflow-hidden">
        <div className="border-b border-[var(--border)] px-4 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-[var(--navy-800)]">מסכתות ולומדים</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            פרטי תזכורות וכתובות קשר אינם מוצגים כאן.
          </p>
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {tractates.map((tractate) => (
            <li
              key={tractate.id}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div>
                <p className="font-bold text-[var(--navy-800)]">{tractate.name}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {tractate.seder} · {tractate.chapters} פרקים
                </p>
              </div>
              {tractate.claimed_by ? (
                editingId === tractate.id ? (
                  <form
                    className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[360px]"
                    onSubmit={(event) => {
                      event.preventDefault();
                      updateTractate(tractate.id, "rename");
                    }}
                  >
                    <TextField
                      label="שם הלומד"
                      value={claimantName}
                      onChange={setClaimantName}
                      maxLength={60}
                      isRequired
                      isDisabled={submitting}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <Button type="submit" variant="confirm" isDisabled={submitting}>
                        שמירה
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="danger"
                          isDisabled={submitting}
                          onPress={() => updateTractate(tractate.id, "release")}
                        >
                          שחרור
                        </Button>
                        <Button
                          type="button"
                          variant="cancel"
                          isDisabled={submitting}
                          onPress={() => setEditingId(null)}
                        >
                          ביטול
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className="text-sm font-semibold">{tractate.claimed_by}</span>
                    <Button
                      variant="ghost"
                      onPress={() => {
                        setEditingId(tractate.id);
                        setClaimantName(tractate.claimed_by ?? "");
                      }}
                    >
                      עריכה
                    </Button>
                  </div>
                )
              ) : (
                <span className="text-sm text-[var(--muted)]">פנויה</span>
              )}
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}
