import { NextRequest, NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase-auth";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext?.startsWith("/admin") ? requestedNext : "/admin";

  if (code) {
    try {
      const supabase = await createAuthServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, url.origin));
    } catch {
      // Fall through to the explicit login error.
    }
  }

  return NextResponse.redirect(new URL("/admin/login?error=invalid_link", url.origin));
}
