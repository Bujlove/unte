import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    
    // Check resume_summaries table structure
    const { data: summaries, error: summariesError } = await supabase
      .from('resume_summaries')
      .select('*')
      .limit(1);

    if (summariesError) {
      return NextResponse.json({
        success: false,
        error: 'Error checking resume_summaries table',
        details: summariesError.message
      });
    }

    // Check resumes table structure
    const { data: resumes, error: resumesError } = await supabase
      .from('resumes')
      .select('*')
      .limit(1);

    if (resumesError) {
      return NextResponse.json({
        success: false,
        error: 'Error checking resumes table',
        details: resumesError.message
      });
    }

    return NextResponse.json({
      success: true,
      tables: {
        resume_summaries: {
          exists: true,
          sampleColumns: summaries && summaries.length > 0 ? Object.keys(summaries[0]) : [],
          error: null
        },
        resumes: {
          exists: true,
          sampleColumns: resumes && resumes.length > 0 ? Object.keys(resumes[0]) : [],
          error: null
        }
      }
    });

  } catch (error) {
    console.error('Table structure check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
