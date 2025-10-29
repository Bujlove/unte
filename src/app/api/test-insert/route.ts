import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createAdminClient();
    
    // Try to insert a simple resume record
    const { data, error } = await supabase
      .from('resumes')
      .insert({
        file_name: 'test.txt',
        file_size: 100,
        mime_type: 'text/plain',
        status: 'active',
        consent_given: true,
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
      message: 'Test insert successful',
      data: data 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
