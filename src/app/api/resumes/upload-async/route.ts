import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateFileSize, validateFileType } from "@/lib/storage/file-parser";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const consentGiven = formData.get("consent") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!consentGiven) {
      return NextResponse.json(
        { error: "Consent for data processing is required" },
        { status: 400 }
      );
    }

    // Validate file
    if (!validateFileSize(file.size)) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    if (!validateFileType(file.type, file.name)) {
      return NextResponse.json(
        { error: "Invalid file type. Supported formats: PDF, DOCX, DOC, TXT" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique upload token
    const uploadToken = nanoid(32);

    // Upload file to Supabase Storage immediately
    const supabase = await createAdminClient();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}-${sanitizedFileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    const fileUrl = supabase.storage.from("resumes").getPublicUrl(fileName).data.publicUrl;

    // Create initial resume record with "processing" status
    const { data: resume, error: insertError } = await supabase
      .from("resumes")
      .insert({
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        status: "processing",
        upload_token: uploadToken,
        consent_given: consentGiven,
        // Set minimal data, will be updated after processing
        full_name: null,
        email: null,
        phone: null,
        location: null,
        parsed_data: null,
        skills: null,
        experience_years: null,
        last_position: null,
        last_company: null,
        education_level: null,
        languages: null,
        embedding: null,
        summary_embedding: null,
        quality_score: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return NextResponse.json({ error: "Failed to save resume" }, { status: 500 });
    }

    // Start async processing (don't await)
    processResumeSimple(resume.id).catch(async error => {
      console.error("Async processing error:", error);
      // Update status to failed
      try {
        await supabase
          .from("resumes")
          .update({ status: "failed" })
          .eq("id", resume.id);
      } catch (updateError) {
        console.error("Failed to update status to failed:", updateError);
      }
    });

    // Return immediate response
    return NextResponse.json({
      success: true,
      resumeId: resume.id,
      uploadToken,
      message: "Resume uploaded successfully. Processing in progress...",
      status: "processing"
    });

  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process resume" },
      { status: 500 }
    );
  }
}

/**
 * Process resume asynchronously
 */
async function processResumeSimple(resumeId: string) {
  try {
    console.log(`Starting simple processing for resume ${resumeId}`);
    
    // Call the processing endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/resumes/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resumeId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Processing failed');
    }

    const result = await response.json();
    console.log(`Resume ${resumeId} processed successfully:`, result.data);

  } catch (error) {
    console.error(`Simple processing failed for resume ${resumeId}:`, error);
    
    // Update status to failed
    try {
      const { createAdminClient } = await import("@/lib/supabase/server");
      const supabase = await createAdminClient();
      await supabase
        .from("resumes")
        .update({ status: "failed" })
        .eq("id", resumeId);
    } catch (updateError) {
      console.error("Failed to update status to failed:", updateError);
    }
  }
}
