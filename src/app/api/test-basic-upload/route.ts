import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { extractTextFromFile, validateFileType, validateFileSize } from '@/lib/storage/file-parser';

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

    console.log(`Basic upload test: ${file.name}, type: ${file.type}, size: ${file.size}`);

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
        error: 'Unsupported file type'
      }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Save file to storage
    const fileExt = file.name.split('.').pop() || 'bin';
    const fileName = `basic-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
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
        error: 'Failed to upload file',
        details: uploadError.message
      });
    }

    // Create resume record (minimal)
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
        error: 'Failed to save resume record',
        details: resumeError.message
      });
    }

    // Extract text
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(fileName);

    if (downloadError || !fileData) {
      return NextResponse.json({
        success: false,
        error: 'Failed to download file for processing'
      });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text
    const text = await extractTextFromFile(buffer, file.type, file.name);

    // Update resume with basic data (minimal)
    const { error: updateError } = await supabase
      .from('resumes')
      .update({
        full_name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', resume.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update resume',
        details: updateError.message
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Basic upload successful',
      resumeId: resume.id,
      fileName: file.name,
      textLength: text.length,
      textPreview: text.substring(0, 200) + '...',
      fileUrl: uploadData.path
    });

  } catch (error) {
    console.error('Basic upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
