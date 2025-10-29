import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    
    console.log('Creating skills_knowledge table...');

    // Check if table already exists
    const { data: existing, error: checkError } = await supabase
      .from('skills_knowledge')
      .select('id')
      .limit(1);

    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: 'Table already exists',
        tableExists: true
      });
    }

    // Table doesn't exist, we need to create it
    // Since we can't execute raw SQL through Supabase API,
    // we'll provide instructions for manual creation
    return NextResponse.json({
      success: false,
      message: 'Table needs to be created manually',
      instructions: [
        '1. Go to Supabase Dashboard',
        '2. Navigate to SQL Editor',
        '3. Run the SQL from sql/create-skills-table.sql',
        '4. Then run /api/init-database to populate data'
      ],
      sql: `
CREATE TABLE IF NOT EXISTS skills_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    subcategory TEXT,
    aliases TEXT[],
    related_skills TEXT[],
    industry_usage JSONB,
    experience_levels TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skills_knowledge_category ON skills_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_skills_knowledge_skill_name ON skills_knowledge(skill_name);

ALTER TABLE skills_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skills knowledge is publicly readable" ON skills_knowledge
    FOR SELECT USING (true);

CREATE POLICY "Admin can manage skills knowledge" ON skills_knowledge
    FOR ALL USING (auth.role() = 'service_role');
      `
    });

  } catch (error) {
    console.error('Create table error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
