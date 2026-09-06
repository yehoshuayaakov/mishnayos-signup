"use client";

import type { CSSProperties } from "react";
import { Button } from "@/components/ds/Button";
import { Callout } from "@/components/ds/Callout";
import { Modal } from "@/components/ds/Modal";
import { Switch } from "@/components/ds/Switch";
import { TextField } from "@/components/ds/TextField";
import type { ClaimFieldErrors } from "@/lib/claim-validation";
import { ReminderPreferences } from "./ReminderPreferences";
import type { ReminderForm } from "./types";

export type { ReminderForm } from "./types";

export function ClaimDialog({
  isOpen,
  onOpenChange,
  tractateName,
  chapters,
  hasDeadline,
  remindersAvailable,
  voiceAvailable,
  name,
  onNameChange,
  reminder,
  onReminderChange,
  submitting,
  error,
  fieldErrors,
  style,
  onSubmit,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tractateName: string;
  chapters: number;
  hasDeadline: boolean;
  remindersAvailable: boolean;
  voiceAvailable: boolean;
  name: string;
  onNameChange: (value: string) => void;
  reminder: ReminderForm;
  onReminderChange: (next: ReminderForm) => void;
  submitting: boolean;
  error: string | null;
  fieldErrors: ClaimFieldErrors;
  style?: CSSProperties;
  onSubmit: () => void;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={`קבלת מסכת ${tractateName}`}
      subtitle={`${chapters} פרקים · השלימו את הפרטים כדי לקבל את המסכת`}
      style={style}
    >
      {({ close }) => (
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <TextField
            label="השם שלכם (חובה)"
            value={name}
            onChange={onNameChange}
            maxLength={60}
            isRequired
            isInvalid={Boolean(fieldErrors.name)}
            errorMessage={fieldErrors.name}
            isDisabled={submitting}
            autoFocus
          />

          <Callout title="חשוב לדעת">
            לאחר קבלת המסכת ניתן לערוך את השם או לשחרר את הרישום במשך 15 דקות. לאחר
            מכן יש לפנות למארגני החלוקה.
          </Callout>

          {remindersAvailable && (
            <>
              <Switch
                isSelected={reminder.want}
                onChange={(want) => onReminderChange({ ...reminder, want })}
                isDisabled={submitting}
                description={
                  voiceAvailable
                    ? "אימייל, ובמידת הצורך גם שיחה טלפונית, בתדירות שתבחרו."
                    : "תזכורת באימייל, בתדירות שתבחרו."
                }
              >
                קבלת תזכורות
              </Switch>

              {reminder.want && (
                <ReminderPreferences
                  value={reminder}
                  onChange={onReminderChange}
                  hasDeadline={hasDeadline}
                  voiceAvailable={voiceAvailable}
                  fieldErrors={fieldErrors}
                  isDisabled={submitting}
                />
              )}
            </>
          )}

          {error && <Callout tone="warn">{error}</Callout>}

          <div className="sticky bottom-0 z-10 -mx-5 flex flex-wrap justify-between gap-2 border-t border-[var(--border)] bg-white px-5 py-4 sm:-mx-6 sm:px-6">
            <Button
              variant="confirm"
              type="submit"
              isDisabled={submitting}
            >
              {submitting ? "שומר…" : "קבלת המסכת"}
            </Button>
            <Button variant="cancel" type="button" isDisabled={submitting} onPress={close}>
              ביטול
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
