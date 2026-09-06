import { NextRequest, NextResponse } from "next/server";
import { organizerLoginSchema } from "@/lib/admin-validation";
import { createAuthServerClient } from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = organizerLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  try {
    const supabase = await createAuthServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("organizer magic-link request failed", error.message);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "login_unavailable" }, { status: 503 });
  }
}
