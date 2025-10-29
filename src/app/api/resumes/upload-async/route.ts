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
    
    // Import processing functions directly
    const { createAdminClient } = await import("@/lib/supabase/server");
    const { extractTextFromFile } = await import("@/lib/storage/file-parser");
    const { detectFileType, extractSimpleData, calculateSimpleQualityScore } = await import("@/lib/simple-parser");

    const supabase = await createAdminClient();
    
    // Get resume data
    const { data: resume, error: fetchError } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", resumeId)
      .single();

    if (fetchError || !resume) {
      throw new Error("Resume not found");
    }

    if (resume.status !== "processing") {
      throw new Error("Resume is not in processing state");
    }

    // Download file from storage
    const fileName = resume.file_url?.split('/').pop();
    if (!fileName) {
      throw new Error("File not found in storage");
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("resumes")
      .download(fileName);

    if (downloadError || !fileData) {
      throw new Error("Failed to download file");
    }

    // Convert to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 1: Detect file type
    const fileType = detectFileType(resume.file_name, resume.mime_type);
    console.log(`Detected file type: ${fileType}`);

    // Step 2: Extract text based on file type
    let text: string;
    try {
      text = await extractTextFromFile(buffer, resume.mime_type, resume.file_name);
    } catch (error) {
      console.error("Text extraction failed:", error);
      throw new Error("Failed to extract text from file");
    }

    if (!text || text.length < 50) {
      throw new Error("File appears to be empty or corrupted");
    }

    // Step 3: Extract key data using simple parser
    const extractedData = extractSimpleData(text);
    console.log("Extracted data:", extractedData);

    // Step 4: Calculate quality score
    const qualityScore = calculateSimpleQualityScore(extractedData);

    // Step 5: Update resume with extracted data
    const { error: updateError } = await supabase
      .from("resumes")
      .update({
        full_name: extractedData.fullName,
        email: extractedData.email,
        phone: extractedData.phone,
        location: extractedData.location,
        last_position: extractedData.position,
        last_company: extractedData.company,
        experience_years: extractedData.experience,
        education_level: extractedData.education,
        skills: extractedData.skills.length > 0 ? extractedData.skills : null,
        quality_score: qualityScore,
        status: "active",
        updated_at: new Date().toISOString(),
        // Store raw text for future AI processing if needed
        parsed_data: {
          raw_text: text,
          file_type: fileType,
          extracted_data: extractedData,
          extraction_method: "simple_regex"
        }
      })
      .eq("id", resumeId);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw updateError;
    }

    console.log(`Resume ${resumeId} processed successfully`);

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
