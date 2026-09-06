import type { Cadence, ReminderLocale } from "@/lib/reminders";

export type ReminderForm = {
  want: boolean;
  cadence: Cadence;
  sendEmail: boolean;
  sendVoice: boolean;
  locale: ReminderLocale;
  email: string;
  phone: string;
};
