import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase-auth";

export async function POST(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    await supabase.auth.signOut();
  } catch {
    // Logout remains idempotent when the auth provider is unavailable.
  }
  return NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
}
