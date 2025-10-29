import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateFileSize, validateFileType, extractTextFromFile } from "@/lib/storage/file-parser";
import { parseResumeTextWithJinaAndRetry } from "@/lib/jina/parser";
import { calculateQualityScore, extractSkills, createResumeSummary } from "@/lib/deepseek/parser";
import { generateResumeEmbedding, generateSummaryEmbedding, embeddingToVector } from "@/lib/jina/embeddings";
import { generateToken } from "@/lib/utils";
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

    // Extract text from file
    const text = await extractTextFromFile(buffer, file.type, file.name);

    if (!text || text.length < 100) {
      return NextResponse.json(
        { error: "File appears to be empty or too short" },
        { status: 400 }
      );
    }

    // Parse resume with Jina AI (with retry logic)
    console.log("Starting resume parsing with Jina AI...");
    const parsedData = await parseResumeTextWithJinaAndRetry(text);
    console.log("Resume parsed successfully with Jina AI");
    console.log("Parsed data skills:", parsedData.professional.skills);
    console.log("Parsed data languages:", parsedData.languages);

    // Check for duplicates
    const supabase = await createAdminClient();
    
    if (parsedData.personal.email || parsedData.personal.phone) {
      const { data: existingResume } = await supabase.rpc("check_duplicate_resume", {
        check_email: parsedData.personal.email,
        check_phone: parsedData.personal.phone,
      });

      if (existingResume && existingResume.length > 0) {
        // Return existing resume info with update token
        return NextResponse.json({
          success: true,
          isUpdate: true,
          resumeId: existingResume[0].id,
          uploadToken: existingResume[0].upload_token,
          message: "Resume already exists. You can update it using the provided link.",
        });
      }
    }

    // Generate embeddings
    const embedding = await generateResumeEmbedding(parsedData);
    const summaryEmbedding = await generateSummaryEmbedding(parsedData);

    // Calculate quality score
    const qualityScore = calculateQualityScore(parsedData);

    // Extract skills array
    const skillsArray = extractSkills(parsedData);

    // Generate unique upload token for future updates
    const uploadToken = nanoid(32);

    // Upload file to Supabase Storage
    // Sanitize filename to avoid storage errors
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
      // Continue anyway - file storage is not critical
    }

    const fileUrl = uploadData
      ? supabase.storage.from("resumes").getPublicUrl(fileName).data.publicUrl
      : null;

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

    // Insert resume into database
    const resumeData = {
      file_url: fileUrl,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
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
      upload_token: uploadToken,
      consent_given: consentGiven,
    };
    
    console.log("Resume data prepared for database insert");
    
    const { data: resume, error: insertError } = await supabase
      .from("resumes")
      .insert(resumeData)
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return NextResponse.json({ error: "Failed to save resume" }, { status: 500 });
    }

    // Create summary data for quick access
    console.log("Creating resume summary...");
    const summaryData = createResumeSummary(parsedData);
    
    // Generate unique quick_id
    const quickId = `RES-${Date.now()}-${resume.id.substring(0, 8)}`;
    
    // Insert summary into resume_summaries table with new structure
    const { error: summaryError } = await supabase
      .from("resume_summaries")
      .insert({
        resume_id: resume.id,
        quick_id: quickId,
        upload_token: uploadToken,
        ...summaryData
      });

    if (summaryError) {
      console.error("Summary insert error:", summaryError);
      // Don't fail the whole process for summary error
    } else {
      console.log("Resume summary created successfully");
    }

    return NextResponse.json({
      success: true,
      resumeId: resume.id,
      uploadToken,
      message: "Resume uploaded and processed successfully",
      summary: {
        fullName: summaryData.full_name,
        position: summaryData.current_position,
        company: summaryData.current_company,
        experience: summaryData.experience_years,
        skills: summaryData.skills?.slice(0, 5) || [], // Top 5 skills
        location: summaryData.location
      }
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process resume" },
      { status: 500 }
    );
  }
}

