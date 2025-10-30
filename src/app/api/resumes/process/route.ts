import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { extractTextFromFile } from "@/lib/storage/file-parser";
import { parseResumeTextWithRetry as parseWithDeepseek, calculateQualityScore, extractSkills, createResumeSummary } from "@/lib/deepseek/parser";
import { normalizeSkills } from "@/lib/search/normalize";
import { parseResumeTextWithJinaAndRetry } from "@/lib/jina/parser";
import { parseResumeWithOpenAI } from "@/lib/openai/parser";
import { embeddingToVector } from "@/lib/jina/embeddings";
import { generateEmbedding } from "@/lib/embeddings/index";

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

    // Extract text based on file type
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

    // Normalize text (basic)
    const normalized = text
      .replace(/[\u0000-\u001F]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // AI parsing: DeepSeek → fallback OpenAI → fallback Jina
    let parsed;
    try {
      parsed = await parseWithDeepseek(normalized);
    } catch (e) {
      try {
        parsed = await parseResumeWithOpenAI(normalized);
      } catch (e2) {
        parsed = await parseResumeTextWithJinaAndRetry(normalized);
      }
    }

    const qualityScore = calculateQualityScore(parsed);
    const skills = extractSkills(parsed);
    const normalizedSkills = await normalizeSkills(skills || undefined);
    const embedding = await generateEmbedding(JSON.stringify({
      personal: parsed.personal,
      professional: parsed.professional,
      skills: skills || [],
    }));
    const summaryEmbedding = await generateEmbedding(`${parsed.personal.fullName || ''} ${parsed.professional.title || ''} ${(skills||[]).slice(0,10).join(' ')}`);

    // Clean parsed_data
    const cleanParsedData = {
      ...parsed,
      experience: parsed.experience && parsed.experience.length > 0 ? parsed.experience : null,
      education: parsed.education && parsed.education.length > 0 ? parsed.education : null,
      languages: parsed.languages && parsed.languages.length > 0 ? JSON.stringify(parsed.languages) : null,
      additional: {
        ...parsed.additional,
        certifications: parsed.additional.certifications && parsed.additional.certifications.length > 0 ? parsed.additional.certifications : null,
        publications: parsed.additional.publications && parsed.additional.publications.length > 0 ? parsed.additional.publications : null,
        projects: parsed.additional.projects && parsed.additional.projects.length > 0 ? parsed.additional.projects : null,
      },
      professional: {
        ...parsed.professional,
        skills: {
          ...parsed.professional.skills,
          soft: parsed.professional.skills.soft && parsed.professional.skills.soft.length > 0 ? parsed.professional.skills.soft : null,
          tools: parsed.professional.skills.tools && parsed.professional.skills.tools.length > 0 ? parsed.professional.skills.tools : null,
        }
      }
    } as any;

    // Update resume with AI data
    const { error: updateError } = await supabase
      .from("resumes")
      .update({
        full_name: parsed.personal.fullName,
        email: parsed.personal.email,
        phone: parsed.personal.phone,
        location: parsed.personal.location,
        parsed_data: cleanParsedData,
        skills: skills && skills.length > 0 ? skills : null,
        normalized_skills: normalizedSkills,
        experience_years: parsed.professional.totalExperience,
        last_position: parsed.experience?.[0]?.position || null,
        last_company: parsed.experience?.[0]?.company || null,
        education_level: parsed.education?.[0]?.degree || null,
        languages: parsed.languages && parsed.languages.length > 0 ? JSON.stringify(parsed.languages) : null,
        embedding: embeddingToVector(embedding),
        summary_embedding: embeddingToVector(summaryEmbedding),
        status: "active",
        processing_status: "completed",
        processing_completed_at: new Date().toISOString(),
        quality_score: qualityScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resumeId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json({ error: "Failed to update resume" }, { status: 500 });
    }

    // Create/Update summary
    const summaryData = createResumeSummary(parsed);
    const { error: sumErr } = await supabase
      .from("resume_summaries")
      .insert({
        resume_id: resumeId,
        quick_id: `RES-${Date.now()}-${resumeId.substring(0,8)}`,
        upload_token: resume.upload_token,
        ...summaryData,
        normalized_skills: normalizedSkills,
      });

    return NextResponse.json({ success: true, message: "Resume processed successfully", resumeId });

  } catch (error) {
    console.error("Resume processing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process resume" },
      { status: 500 }
    );
  }
}
