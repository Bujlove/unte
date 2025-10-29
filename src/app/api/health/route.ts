import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const checks = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: false,
      api: true,
    },
  };

  try {
    // Check database connection
    const supabase = await createAdminClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);

    checks.services.database = !error;

    if (!checks.services.database) {
      checks.status = "unhealthy";
    }
  } catch (error) {
    checks.status = "unhealthy";
    checks.services.database = false;
  }

  const statusCode = checks.status === "healthy" ? 200 : 503;

  return NextResponse.json(checks, { status: statusCode });
}

