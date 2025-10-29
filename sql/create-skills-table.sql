-- Create skills_knowledge table
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_skills_knowledge_category ON skills_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_skills_knowledge_skill_name ON skills_knowledge(skill_name);

-- Enable RLS
ALTER TABLE skills_knowledge ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Skills knowledge is publicly readable" ON skills_knowledge
    FOR SELECT USING (true);

-- Create policy for admin access
CREATE POLICY "Admin can manage skills knowledge" ON skills_knowledge
    FOR ALL USING (auth.role() = 'service_role');
