import { NextRequest, NextResponse } from "next/server";
import { generateEmbeddingWithJina } from "@/lib/jina/client";

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Jina API...');
    
    const testText = "React TypeScript Frontend Developer";
    
    console.log('📄 Test text:', testText);
    console.log('🔑 Jina API Key:', process.env.JINA_API_KEY ? 'Set' : 'Not set');
    
    const embedding = await generateEmbeddingWithJina(testText);
    
    console.log('✅ Jina API working!');
    console.log('📊 Embedding length:', embedding.length);
    console.log('📊 First 5 values:', embedding.slice(0, 5));
    
    return NextResponse.json({
      success: true,
      message: 'Jina API is working!',
      data: {
        text: testText,
        embeddingLength: embedding.length,
        firstValues: embedding.slice(0, 5),
        lastValues: embedding.slice(-5)
      }
    });
    
  } catch (error) {
    console.error('❌ Jina API test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
