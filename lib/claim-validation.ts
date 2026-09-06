import { z } from "zod";
import { normalizePhone, reminderEmailSchema } from "@/lib/reminders";

export const claimantNameSchema = z
  .string()
  .trim()
  .min(1, "נא למלא שם.")
  .max(60, "השם יכול להכיל עד 60 תווים.");

export const claimFormSchema = z
  .object({
    name: claimantNameSchema,
    reminders: z.boolean(),
    email: z.string(),
    sendVoice: z.boolean(),
    phone: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.reminders) return;

    const email = reminderEmailSchema.safeParse(data.email);
    if (!email.success) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: email.error.issues[0]?.message ?? "כתובת האימייל אינה תקינה.",
      });
    }

    if (data.sendVoice && !normalizePhone(data.phone)) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: data.phone.trim()
          ? "מספר הטלפון אינו תקין. השתמשו בקידומת בינלאומית, למשל ‎+972…"
          : "נא למלא מספר טלפון.",
      });
    }
  });

export type ClaimFieldErrors = Partial<Record<"name" | "email" | "phone", string>>;

export function claimFieldErrors(error: z.ZodError): ClaimFieldErrors {
  const errors: ClaimFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if ((field === "name" || field === "email" || field === "phone") && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
