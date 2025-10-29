import { NextRequest, NextResponse } from 'next/server';
import { extractTextWithTika, isTikaAvailable } from '@/lib/tika-parser';

export async function GET() {
  try {
    console.log('Testing Tika availability...');
    
    const available = await isTikaAvailable();
    
    return NextResponse.json({
      success: true,
      tikaAvailable: available,
      message: available 
        ? 'Tika server is available and ready' 
        : 'Tika server is not available'
    });
    
  } catch (error) {
    console.error('Tika test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tikaAvailable: false
    }, { status: 500 });
  }
}

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
    
    console.log(`Testing Tika extraction for file: ${file.name}, type: ${file.type}`);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await extractTextWithTika(buffer, file.type);
    
    return NextResponse.json({
      success: true,
      result: {
        success: result.success,
        textLength: result.text?.length || 0,
        textPreview: result.text?.substring(0, 200) + '...' || '',
        metadata: result.metadata,
        error: result.error
      }
    });
    
  } catch (error) {
    console.error('Tika extraction test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
