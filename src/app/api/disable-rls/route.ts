import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createAdminClient();
    
    // Disable RLS on resumes table
    const { error } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE resumes DISABLE ROW LEVEL SECURITY;' 
      });
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'RLS disabled on resumes table' 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
