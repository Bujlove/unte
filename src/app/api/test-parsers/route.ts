import { NextRequest, NextResponse } from 'next/server';
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
    
    console.log(`Testing parsers for file: ${file.name}, type: ${file.type}, size: ${file.size}`);
    
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
    
    // Extract text
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromFile(buffer, file.type, file.name);
    
    return NextResponse.json({
      success: true,
      result: {
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        textLength: text.length,
        textPreview: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
        extractionMethod: getExtractionMethod(file.type, file.name)
      }
    });
    
  } catch (error) {
    console.error('Parser test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getExtractionMethod(mimeType: string, fileName?: string): string {
  if (mimeType === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf')) {
    return 'PDF.js + pdf-parse fallback';
  }
  if (mimeType.includes('wordprocessingml') || fileName?.toLowerCase().endsWith('.docx')) {
    return 'Mammoth.js';
  }
  if (mimeType === 'application/msword' || fileName?.toLowerCase().endsWith('.doc')) {
    return 'Enhanced binary text extraction';
  }
  if (mimeType.startsWith('text/') || fileName?.toLowerCase().endsWith('.txt')) {
    return 'Multi-encoding text extraction';
  }
  return 'Unknown';
}
