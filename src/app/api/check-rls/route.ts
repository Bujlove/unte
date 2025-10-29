import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createAdminClient();
    
    // Check if RLS is enabled on resumes table
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('check_rls_enabled', { table_name: 'resumes' });
    
    if (rlsError) {
      // If the function doesn't exist, try a different approach
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'resumes');
      
      if (policiesError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Could not check RLS status',
          details: { rlsError, policiesError }
        });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'RLS policies for resumes table',
        policies: policies || []
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'RLS status checked',
      rlsEnabled: rlsData 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
