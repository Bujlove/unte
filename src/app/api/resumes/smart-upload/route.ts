import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { extractTextFromFile, validateFileType, validateFileSize } from '@/lib/storage/file-parser';
import { SmartResumeParser } from '@/lib/smart-parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    console.log(`Smart upload: ${file.name}, type: ${file.type}, size: ${file.size}`);

    // Validate file
    if (!validateFileSize(file.size)) {
      return NextResponse.json({
        success: false,
        error: 'File too large (max 10MB)'
      }, { status: 400 });
    }

    if (!validateFileType(file.type, file.name)) {
      return NextResponse.json({
        success: false,
        error: 'Unsupported file type. Supported: PDF, DOCX, DOC, TXT'
      }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Step 1: Save file to storage
    const fileExt = file.name.split('.').pop() || 'bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({
        success: false,
        error: 'Failed to upload file'
      }, { status: 500 });
    }

    // Step 2: Create resume record
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .insert({
        file_name: file.name,
        file_url: uploadData.path,
        mime_type: file.type,
        file_size: file.size,
        status: 'processing',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (resumeError) {
      console.error('Database insert error:', resumeError);
      return NextResponse.json({
        success: false,
        error: 'Failed to save resume record'
      }, { status: 500 });
    }

    // Step 3: Start smart processing asynchronously
    processResumeSmart(resume.id, fileName, file.type, file.name);

    // Step 4: Return immediate response
    return NextResponse.json({
      success: true,
      message: 'Resume accepted - processing. To update, just upload another.',
      resumeId: resume.id,
      status: 'processing',
      quickId: 'Generating...'
    });

  } catch (error) {
    console.error('Smart upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Process resume with smart AI parsing
 */
async function processResumeSmart(resumeId: string, fileName: string, mimeType: string, originalName: string) {
  try {
    console.log(`Starting smart processing for resume ${resumeId}`);
    
    const supabase = await createAdminClient();
    
    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(fileName);

    if (downloadError || !fileData) {
      throw new Error('Failed to download file');
    }

    // Convert to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text
    const text = await extractTextFromFile(buffer, mimeType, originalName);
    
    if (!text || text.length < 50) {
      throw new Error('No meaningful data extracted');
    }

    // Smart parsing with AI
    const parser = new SmartResumeParser();
    const result = await parser.parseResume(resumeId, text);

    // Update resume with smart parsing results
    const { error: updateError } = await supabase
      .from('resumes')
      .update({
        full_name: result.basicInfo.fullName,
        email: result.basicInfo.email,
        phone: result.basicInfo.phone,
        location: result.basicInfo.location,
        last_position: result.professionalInfo.currentPosition,
        last_company: result.professionalInfo.currentCompany,
        experience_years: result.professionalInfo.experienceYears,
        education_level: result.professionalInfo.educationLevel,
        skills: result.skillsAnalysis.primarySkills,
        status: 'active',
        updated_at: new Date().toISOString(),
        parsed_data: {
          smart_parsing: true,
          quick_id: result.quickId,
          basic_info: result.basicInfo,
          professional_info: result.professionalInfo,
          skills_analysis: result.skillsAnalysis,
          market_intelligence: result.marketIntelligence,
          ai_insights: result.aiInsights,
          processing_log: result.processingLog
        }
      })
      .eq('id', resumeId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    // Create resume summary
    const { error: summaryError } = await supabase
      .from('resume_summaries')
      .insert({
        resume_id: resumeId,
        quick_id: result.quickId,
        full_name: result.basicInfo.fullName,
        email: result.basicInfo.email,
        phone: result.basicInfo.phone,
        location: result.basicInfo.location,
        current_position: result.professionalInfo.currentPosition,
        current_company: result.professionalInfo.currentCompany,
        experience_years: result.professionalInfo.experienceYears,
        education_level: result.professionalInfo.educationLevel,
        primary_skills: result.skillsAnalysis.primarySkills,
        secondary_skills: result.skillsAnalysis.secondarySkills,
        skill_categories: result.skillsAnalysis.skillCategories,
        skill_levels: result.skillsAnalysis.skillLevels,
        market_value: result.marketIntelligence.marketValue,
        rarity_score: result.marketIntelligence.rarityScore,
        demand_score: result.marketIntelligence.demandScore,
        ai_summary: result.aiInsights.summary,
        ai_insights: result.aiInsights.insights,
        confidence_score: result.aiInsights.confidenceScore
      });

    if (summaryError) {
      console.error('Summary creation error:', summaryError);
      // Don't throw - resume is still processed
    }

    console.log(`Smart processing completed for resume ${resumeId}, quick ID: ${result.quickId}`);

  } catch (error) {
    console.error(`Smart processing failed for resume ${resumeId}:`, error);
    
    // Update status to failed
    try {
      const supabase = await createAdminClient();
      await supabase
        .from('resumes')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', resumeId);
    } catch (updateError) {
      console.error('Failed to update status to failed:', updateError);
    }
  }
}
