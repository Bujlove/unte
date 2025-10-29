import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resumeId = params.id;
    
    if (!resumeId) {
      return NextResponse.json({ error: "Resume ID is required" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    
    const { data: resume, error } = await supabase
      .from("resumes")
      .select(`
        id,
        status,
        full_name,
        email,
        phone,
        location,
        experience_years,
        last_position,
        last_company,
        education_level,
        quality_score,
        created_at,
        updated_at
      `)
      .eq("id", resumeId)
      .single();

    if (error) {
      console.error("Database query error:", error);
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      resume: {
        id: resume.id,
        status: resume.status,
        fullName: resume.full_name,
        email: resume.email,
        phone: resume.phone,
        location: resume.location,
        experienceYears: resume.experience_years,
        lastPosition: resume.last_position,
        lastCompany: resume.last_company,
        educationLevel: resume.education_level,
        qualityScore: resume.quality_score,
        createdAt: resume.created_at,
        updatedAt: resume.updated_at
      }
    });

  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check status" },
      { status: 500 }
    );
  }
}
