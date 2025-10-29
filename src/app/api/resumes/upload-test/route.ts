import { NextRequest, NextResponse } from "next/server";
import { validateFileSize, validateFileType, extractTextFromFile } from "@/lib/storage/file-parser";
import { parseResumeTextWithRetry, calculateQualityScore, extractSkills, createResumeSummary } from "@/lib/deepseek/parser";
import { generateResumeEmbedding, generateSummaryEmbedding, embeddingToVector } from "@/lib/jina/embeddings";
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
        { error: "Invalid file type. Supported: PDF, DOCX, DOC, TXT" },
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

    // Parse resume with AI (with retry logic)
    console.log("Starting resume parsing...");
    const parsedData = await parseResumeTextWithRetry(text);
    console.log("Resume parsed successfully");

    // Generate embeddings (with fallback)
    console.log("Generating embeddings...");
    const embedding = await generateResumeEmbedding(parsedData);
    const summaryEmbedding = await generateSummaryEmbedding(parsedData);
    console.log("Embeddings generated successfully");

    // Calculate quality score
    const qualityScore = calculateQualityScore(parsedData);

    // Extract skills array
    const skillsArray = extractSkills(parsedData);

    // Generate unique upload token for future updates
    const uploadToken = nanoid(32);

    // Create summary data for quick access
    console.log("Creating resume summary...");
    const summaryData = createResumeSummary(parsedData);

    // Simulate successful upload without database
    const resumeId = nanoid(32);

    return NextResponse.json({
      success: true,
      resumeId,
      uploadToken,
      message: "Resume uploaded and processed successfully (test mode)",
      summary: {
        fullName: summaryData.full_name,
        position: summaryData.current_position,
        company: summaryData.current_company,
        experience: summaryData.experience_years,
        skills: summaryData.skills?.slice(0, 5) || [],
        location: summaryData.location
      },
      parsedData: {
        personal: parsedData.personal,
        professional: parsedData.professional,
        qualityScore,
        skills: skillsArray,
        embeddingLength: embedding.length,
        summaryEmbeddingLength: summaryEmbedding.length
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
