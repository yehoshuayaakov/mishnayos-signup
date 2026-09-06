import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  if (!token || token.length < 32) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("reminders")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("manage_token", token)
      .is("unsubscribed_at", null)
      .select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data?.length) {
      const { data: existing } = await supabase
        .from("reminders")
        .select("id, unsubscribed_at")
        .eq("manage_token", token)
        .maybeSingle();
      if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
