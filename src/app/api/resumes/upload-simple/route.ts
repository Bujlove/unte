import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateFileSize, validateFileType, extractTextFromFile } from "@/lib/storage/file-parser";
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

    // Generate unique upload token
    const uploadToken = nanoid(32);

    // Upload file to Supabase Storage
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

    // Create simple resume record without AI parsing
    const { data: resume, error: insertError } = await supabase
      .from("resumes")
      .insert({
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        status: "active",
        upload_token: uploadToken,
        consent_given: consentGiven,
        // Simple extracted data without AI parsing
        full_name: null,
        email: null,
        phone: null,
        location: null,
        parsed_data: {
          personal: {
            fullName: null,
            email: null,
            phone: null,
            location: null,
            birthDate: null,
            photo: null
          },
          professional: {
            title: null,
            summary: null,
            totalExperience: 0,
            skills: {
              hard: [],
              soft: [],
              tools: []
            }
          },
          experience: [],
          education: [],
          languages: [],
          additional: {
            certifications: [],
            publications: [],
            projects: []
          }
        },
        skills: null,
        experience_years: 0,
        last_position: null,
        last_company: null,
        education_level: null,
        languages: null,
        embedding: new Array(768).fill(0),
        summary_embedding: new Array(768).fill(0),
        quality_score: 50, // Default score
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return NextResponse.json({ error: "Failed to save resume" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      resumeId: resume.id,
      uploadToken,
      message: "Resume uploaded successfully (without AI parsing)",
      summary: {
        fullName: "Not parsed",
        position: "Not parsed",
        company: "Not parsed",
        experience: 0,
        skills: [],
        location: "Not parsed"
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
