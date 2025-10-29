import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createAdminClient();
    
    // Create a simple embedding vector (768 dimensions as expected by Jina)
    const testEmbedding = new Array(768).fill(0.1);
    
    // Try to insert a resume with embedding
    const { data, error } = await supabase
      .from('resumes')
      .insert({
        file_name: 'test-embedding.txt',
        file_size: 100,
        mime_type: 'text/plain',
        status: 'active',
        consent_given: true,
        embedding: testEmbedding,
        summary_embedding: testEmbedding,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error,
        code: error.code
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test embedding insert successful',
      data: data 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
