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
    processResumeAsync(resume.id, buffer, file.type, file.name).catch(async error => {
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
async function processResumeAsync(resumeId: string, buffer: Buffer, mimeType: string, fileName: string) {
  try {
    console.log(`Starting async processing for resume ${resumeId}`);
    
    // Import processing functions
    const { extractTextFromFile } = await import("@/lib/storage/file-parser");
    const { parseResumeTextWithJinaAndRetry } = await import("@/lib/jina/parser");
    const { calculateQualityScore, extractSkills, createResumeSummary } = await import("@/lib/deepseek/parser");
    const { generateResumeEmbedding, generateSummaryEmbedding, embeddingToVector } = await import("@/lib/jina/embeddings");
    const { createAdminClient } = await import("@/lib/supabase/server");

    // Extract text from file
    const text = await extractTextFromFile(buffer, mimeType, fileName);

    if (!text || text.length < 100) {
      throw new Error("File appears to be empty or too short");
    }

    // Parse resume with AI
    console.log("Starting resume parsing...");
    const parsedData = await parseResumeTextWithJinaAndRetry(text);
    console.log("Resume parsed successfully");

    // Generate embeddings
    const embedding = await generateResumeEmbedding(parsedData);
    const summaryEmbedding = await generateSummaryEmbedding(parsedData);

    // Calculate quality score
    const qualityScore = calculateQualityScore(parsedData);

    // Extract skills array
    const skillsArray = extractSkills(parsedData);

    // Clean parsed_data - keep null for empty arrays to match database schema
    const cleanParsedData = {
      ...parsedData,
      experience: parsedData.experience && parsedData.experience.length > 0 ? parsedData.experience : null,
      education: parsedData.education && parsedData.education.length > 0 ? parsedData.education : null,
      languages: parsedData.languages && parsedData.languages.length > 0 ? JSON.stringify(parsedData.languages) : null,
      additional: {
        ...parsedData.additional,
        certifications: parsedData.additional.certifications && parsedData.additional.certifications.length > 0 ? parsedData.additional.certifications : null,
        publications: parsedData.additional.publications && parsedData.additional.publications.length > 0 ? parsedData.additional.publications : null,
        projects: parsedData.additional.projects && parsedData.additional.projects.length > 0 ? parsedData.additional.projects : null,
      },
      professional: {
        ...parsedData.professional,
        skills: {
          ...parsedData.professional.skills,
          soft: parsedData.professional.skills.soft && parsedData.professional.skills.soft.length > 0 ? parsedData.professional.skills.soft : null,
          tools: parsedData.professional.skills.tools && parsedData.professional.skills.tools.length > 0 ? parsedData.professional.skills.tools : null,
        }
      }
    };

    // Update resume with parsed data
    const supabase = await createAdminClient();
    const { error: updateError } = await supabase
      .from("resumes")
      .update({
        full_name: parsedData.personal.fullName,
        email: parsedData.personal.email,
        phone: parsedData.personal.phone,
        location: parsedData.personal.location,
        parsed_data: cleanParsedData as any,
        skills: skillsArray && skillsArray.length > 0 ? skillsArray : null,
        experience_years: parsedData.professional.totalExperience,
        last_position: parsedData.experience?.[0]?.position || null,
        last_company: parsedData.experience?.[0]?.company || null,
        education_level: parsedData.education?.[0]?.degree || null,
        languages: parsedData.languages && parsedData.languages.length > 0 ? JSON.stringify(parsedData.languages) : null,
        embedding: embeddingToVector(embedding),
        summary_embedding: embeddingToVector(summaryEmbedding),
        status: "active",
        quality_score: qualityScore,
      })
      .eq("id", resumeId);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw updateError;
    }

    // Create summary data for quick access
    console.log("Creating resume summary...");
    const summaryData = createResumeSummary(parsedData);
    
    // Insert summary into resume_summaries table
    const { error: summaryError } = await supabase
      .from("resume_summaries")
      .insert({
        resume_id: resumeId,
        ...summaryData
      });

    if (summaryError) {
      console.error("Summary insert error:", summaryError);
      // Don't fail the whole process for summary error
    } else {
      console.log("Resume summary created successfully");
    }

    console.log(`Resume ${resumeId} processed successfully`);

  } catch (error) {
    console.error(`Async processing failed for resume ${resumeId}:`, error);
    
    // Update status to failed
    try {
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
