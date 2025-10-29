import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    
    console.log('Initializing database tables...');

    // Create skills_knowledge table
    const { error: skillsError } = await supabase
      .from('skills_knowledge')
      .select('id')
      .limit(1);

    if (skillsError && skillsError.code === 'PGRST205') {
      console.log('Creating skills_knowledge table...');
      // Table doesn't exist, we need to create it via SQL
      // For now, we'll just log this and ask user to run migrations manually
      return NextResponse.json({
        success: false,
        error: 'Database tables not created yet. Please run migrations manually in Supabase Dashboard.',
        instructions: [
          '1. Go to Supabase Dashboard',
          '2. Navigate to SQL Editor',
          '3. Run the migration from supabase/migrations/000_smart_parsing_system.sql',
          '4. Then run this endpoint again'
        ]
      });
    }

    // Initialize skills data
    const skillsData = [
      {
        skill_name: 'JavaScript',
        category: 'programming',
        subcategory: 'frontend',
        aliases: ['JS', 'ECMAScript', 'Node.js'],
        related_skills: ['TypeScript', 'React', 'Vue', 'Angular', 'Node.js'],
        industry_usage: { 'web_development': 0.95, 'mobile_development': 0.7, 'data_science': 0.3 },
        experience_levels: ['junior', 'middle', 'senior', 'lead']
      },
      {
        skill_name: 'Python',
        category: 'programming',
        subcategory: 'backend',
        aliases: ['Python3', 'Py'],
        related_skills: ['Django', 'Flask', 'FastAPI', 'Pandas', 'NumPy', 'Machine Learning'],
        industry_usage: { 'web_development': 0.8, 'data_science': 0.95, 'ai_ml': 0.9, 'automation': 0.7 },
        experience_levels: ['junior', 'middle', 'senior', 'lead']
      },
      {
        skill_name: 'React',
        category: 'framework',
        subcategory: 'frontend',
        aliases: ['React.js', 'ReactJS'],
        related_skills: ['JavaScript', 'TypeScript', 'Redux', 'Next.js', 'JSX'],
        industry_usage: { 'web_development': 0.9, 'mobile_development': 0.6 },
        experience_levels: ['junior', 'middle', 'senior', 'lead']
      }
    ];

    // Clear existing data
    await supabase.from('skills_knowledge').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert skills data
    const { data, error } = await supabase
      .from('skills_knowledge')
      .insert(skillsData);

    if (error) {
      console.error('Error inserting skills:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to insert skills data',
        details: error.message
      });
    }

    console.log(`Successfully initialized ${skillsData.length} skills`);

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      skillsCount: skillsData.length
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createAdminClient();
    
    // Check if tables exist
    const { data: skills, error: skillsError } = await supabase
      .from('skills_knowledge')
      .select('id')
      .limit(1);

    const { data: summaries, error: summariesError } = await supabase
      .from('resume_summaries')
      .select('id')
      .limit(1);

    return NextResponse.json({
      success: true,
      tables: {
        skills_knowledge: !skillsError,
        resume_summaries: !summariesError
      },
      skillsCount: skills?.length || 0
    });

  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
