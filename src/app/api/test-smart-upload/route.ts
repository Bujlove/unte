import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

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

    console.log(`Test smart upload: ${file.name}, type: ${file.type}, size: ${file.size}`);

    const supabase = await createAdminClient();

    // Step 1: Save file to storage
    const fileExt = file.name.split('.').pop() || 'bin';
    const fileName = `test-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
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
        error: 'Failed to save resume record',
        details: resumeError.message
      });
    }

    // Step 3: Test text extraction
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

    // Import and test text extraction
    const { extractTextFromFile } = await import('@/lib/storage/file-parser');
    const text = await extractTextFromFile(buffer, file.type, file.name);

    // Step 4: Update resume with extracted text
    const { error: updateError } = await supabase
      .from('resumes')
      .update({
        full_name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        status: 'active',
        updated_at: new Date().toISOString(),
        parsed_data: {
          test_mode: true,
          extracted_text: text.substring(0, 500),
          text_length: text.length,
          file_type: file.type
        }
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
      message: 'Test upload successful',
      resumeId: resume.id,
      fileName: file.name,
      textLength: text.length,
      textPreview: text.substring(0, 200) + '...',
      fileUrl: uploadData.path
    });

  } catch (error) {
    console.error('Test upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
