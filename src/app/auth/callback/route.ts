import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to the specified path or dashboard
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
    
    console.error("Auth error:", error);
  }

  // Redirect to an error page if something went wrong
  return NextResponse.redirect(new URL("/login?error=auth_failed", requestUrl.origin));
}

