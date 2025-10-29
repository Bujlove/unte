import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { extractTextFromFile } from "@/lib/storage/file-parser";
import { detectFileType, extractSimpleData, calculateSimpleQualityScore } from "@/lib/simple-parser";

export async function POST(request: NextRequest) {
  try {
    const { resumeId } = await request.json();
    
    if (!resumeId) {
      return NextResponse.json({ error: "Resume ID is required" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    
    // Get resume data
    const { data: resume, error: fetchError } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", resumeId)
      .single();

    if (fetchError || !resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    if (resume.status !== "processing") {
      return NextResponse.json({ error: "Resume is not in processing state" }, { status: 400 });
    }

    // Download file from storage
    const fileName = resume.file_url?.split('/').pop();
    if (!fileName) {
      return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("resumes")
      .download(fileName);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
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
      return NextResponse.json({ error: "Failed to extract text from file" }, { status: 500 });
    }

    if (!text || text.length < 50) {
      return NextResponse.json({ error: "File appears to be empty or corrupted" }, { status: 400 });
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
      return NextResponse.json({ error: "Failed to update resume" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Resume processed successfully",
      data: {
        resumeId,
        extractedData,
        qualityScore,
        fileType
      }
    });

  } catch (error) {
    console.error("Resume processing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process resume" },
      { status: 500 }
    );
  }
}
