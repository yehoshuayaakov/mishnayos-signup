export function isEmailRemindersEnabled() {
  return (
    process.env.ENABLE_EMAIL_REMINDERS === "true" &&
    Boolean(process.env.RESEND_API_KEY?.trim()) &&
    Boolean(process.env.RESEND_FROM?.trim())
  );
}
