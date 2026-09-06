"use client";

import type { CSSProperties } from "react";
import { Button } from "@/components/ds/Button";
import { Callout } from "@/components/ds/Callout";
import { Modal } from "@/components/ds/Modal";
import { TextField } from "@/components/ds/TextField";

export function EditClaimDialog({
  isOpen,
  onOpenChange,
  tractateName,
  name,
  onNameChange,
  submitting,
  style,
  onRename,
  onRelease,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tractateName: string;
  name: string;
  onNameChange: (value: string) => void;
  submitting: boolean;
  style?: CSSProperties;
  onRename: () => void;
  onRelease: () => void;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={`עריכת מסכת ${tractateName}`}
      subtitle="ניתן לערוך או לשחרר במשך 15 דקות לאחר הרישום"
      style={style}
    >
      {({ close }) => (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onRename();
          }}
        >
          <TextField
            label="השם שלכם"
            value={name}
            onChange={onNameChange}
            maxLength={60}
            isDisabled={submitting}
            autoFocus
          />

          <Callout>
            שחרור מחזיר את המסכת לרשימה הפתוחה. השם החדש יופיע מיד על הלוח.
          </Callout>

          <div className="sticky bottom-0 z-10 -mx-5 flex flex-wrap justify-between gap-2 border-t border-[var(--border)] bg-white px-5 py-4 sm:-mx-6 sm:px-6">
            <div className="flex flex-wrap gap-2">
              <Button variant="confirm" type="submit" isDisabled={submitting || !name.trim()}>
                {submitting ? "שומר…" : "שמירה"}
              </Button>
              <Button
                variant="danger"
                type="button"
                isDisabled={submitting}
                onPress={onRelease}
              >
                שחרור
              </Button>
            </div>
            <Button variant="cancel" type="button" isDisabled={submitting} onPress={close}>
              ביטול
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
