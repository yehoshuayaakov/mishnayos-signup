import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  let body: { id?: unknown; name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const id = body.id;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!Number.isInteger(id) || name.length === 0 || name.length > 60) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const supabase = getSupabase();
  // The .is("claimed_by", null) filter makes this atomic: if two people try
  // to claim the same tractate at once, only one update matches.
  const { data, error } = await supabase
    .from("tractates")
    .update({ claimed_by: name, claimed_at: new Date().toISOString() })
    .eq("id", id as number)
    .is("claimed_by", null)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "already_claimed" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
