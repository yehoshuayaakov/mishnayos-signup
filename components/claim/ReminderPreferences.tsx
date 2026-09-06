"use client";

import { Callout } from "@/components/ds/Callout";
import { Checkbox } from "@/components/ds/Checkbox";
import { Radio, RadioGroup } from "@/components/ds/RadioGroup";
import { TextField } from "@/components/ds/TextField";
import type { ClaimFieldErrors } from "@/lib/claim-validation";
import type { Cadence, ReminderLocale } from "@/lib/reminders";
import type { ReminderForm } from "./types";

export function ReminderPreferences({
  value,
  onChange,
  hasDeadline,
  voiceAvailable,
  fieldErrors,
  isDisabled,
}: {
  value: ReminderForm;
  onChange: (next: ReminderForm) => void;
  hasDeadline: boolean;
  voiceAvailable: boolean;
  fieldErrors: ClaimFieldErrors;
  isDisabled: boolean;
}) {
  const dailyVoiceWarning = value.cadence === "daily" && value.sendVoice;

  return (
    <section
      aria-label="הגדרות תזכורות"
      className="flex flex-col gap-4 rounded-[12px] border border-[var(--border)] bg-[#f7f8fa] p-3"
    >
      <RadioGroup
        label="מתי להזכיר?"
        value={value.cadence}
        onChange={(cadence) => onChange({ ...value, cadence: cadence as Cadence })}
        isDisabled={isDisabled}
      >
        <Radio value="daily">כל יום</Radio>
        <Radio value="weekly">פעם בשבוע</Radio>
        {hasDeadline && (
          <Radio value="week_before">שבוע לפני הסיום</Radio>
        )}
      </RadioGroup>

      <TextField
        label="כתובת אימייל (חובה)"
        type="email"
        value={value.email}
        onChange={(email) => onChange({ ...value, email, sendEmail: true })}
        description="לכאן יישלחו התזכורות והקישור לניהולן."
        isRequired
        isInvalid={Boolean(fieldErrors.email)}
        errorMessage={fieldErrors.email}
        isDisabled={isDisabled}
      />

      {voiceAvailable && (
        <div className="flex flex-col gap-3">
          <Checkbox
            isSelected={value.sendVoice}
            onChange={(sendVoice) => onChange({ ...value, sendVoice })}
            isDisabled={isDisabled}
          >
            הוספת תזכורת בשיחה טלפונית
          </Checkbox>
          {value.sendVoice && (
            <TextField
              label="מספר טלפון"
              type="tel"
              value={value.phone}
              onChange={(phone) => onChange({ ...value, phone })}
              placeholder="+972 50 000 0000"
              description="יש להזין מספר עם קידומת מדינה."
              isRequired
              isInvalid={Boolean(fieldErrors.phone)}
              errorMessage={fieldErrors.phone}
              isDisabled={isDisabled}
            />
          )}
        </div>
      )}

      {dailyVoiceWarning && (
        <Callout tone="warn" title="שיחה יומית אינה מומלצת">
          לשימוש יומי עדיף לבחור אימייל. שיחה מתאימה יותר לתזכורת שבועית או לתזכורת
          שלפני מועד הסיום.
        </Callout>
      )}

      <RadioGroup
        label="שפת התזכורת"
        value={value.locale}
        onChange={(locale) => onChange({ ...value, locale: locale as ReminderLocale })}
        isDisabled={isDisabled}
      >
        <Radio value="he">עברית</Radio>
        <Radio value="en">English</Radio>
      </RadioGroup>
    </section>
  );
}
