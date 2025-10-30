import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }
  const envVars = {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? "Set" : "Not set",
    JINA_API_KEY: process.env.JINA_API_KEY ? "Set" : "Not set", 
    SUPABASE_URL: process.env.SUPABASE_URL ? "Set" : "Not set",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "Set" : "Not set",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set",
  };

  return NextResponse.json(envVars);
}
