import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateFileSize, validateFileType } from "@/lib/storage/file-parser";
import { generateToken } from "@/lib/utils";
import { nanoid } from "nanoid";
import { logger } from "@/lib/utils/logger";

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

    const supabase = await createAdminClient();

    // Generate unique upload token for future updates
    const uploadToken = nanoid(32);

    // Upload file to Supabase Storage
    // Sanitize filename to avoid storage errors
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}-${sanitizedFileName}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      logger.warn("Storage upload error:", uploadError);
      // Continue anyway - file storage is not critical
    }

    const fileUrl = uploadData
      ? supabase.storage.from("resumes").getPublicUrl(fileName).data.publicUrl
      : null;

    // Insert minimal record for async processing
    const { data: resume, error: insertError } = await supabase
      .from("resumes")
      .insert({
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        status: "processing",
        processing_status: "processing",
        upload_token: uploadToken,
        consent_given: consentGiven,
      })
      .select()
      .single();

    if (insertError) {
      logger.error("Database insert error:", insertError);
      return NextResponse.json({ error: "Failed to save resume" }, { status: 500 });
    }

    // Trigger background processing (fire-and-forget)
    try {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/resumes/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: resume.id }),
      }).catch(() => {});
    } catch {}

    return NextResponse.json({
      success: true,
      resumeId: resume.id,
      uploadToken,
      message: "Файл принят. Обработка запущена.",
    });
  } catch (error) {
    logger.error("Resume upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process resume" },
      { status: 500 }
    );
  }
}

