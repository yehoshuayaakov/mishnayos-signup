import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { verifyBearerSecret } from "@/lib/admin";
import { runReminderJob } from "@/lib/reminder-job";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorize(req: Request): boolean {
  return verifyBearerSecret(req.headers.get("authorization"), process.env.CRON_SECRET);
}

async function run() {
  const supabase = getSupabase();
  return runReminderJob(supabase);
}

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const stats = await run();
    return NextResponse.json({ ok: true, ...stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
