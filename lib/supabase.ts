import { createClient } from "@supabase/supabase-js";

// Server-side only. The service role key must never be exposed to the browser,
// which is why all database access goes through API routes.
export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable"
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
