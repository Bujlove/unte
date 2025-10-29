-- Drop and recreate resume_summaries table with correct structure

-- Drop existing table and dependencies
DROP TRIGGER IF EXISTS trg_create_resume_summary ON resumes;
DROP TRIGGER IF EXISTS trg_update_resume_summary ON resumes;
DROP TABLE IF EXISTS resume_summaries CASCADE;

-- Create resume_summaries table with all required columns
CREATE TABLE resume_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    quick_id TEXT UNIQUE,
    
    -- Basic Info
    full_name TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    
    -- Professional Info
    current_position TEXT,
    current_company TEXT,
    last_position TEXT,
    last_company TEXT,
    experience_years INTEGER,
    education_level TEXT,
    
    -- Skills Analysis
    primary_skills TEXT[],
    secondary_skills TEXT[],
    skill_categories JSONB,
    skill_levels JSONB,
    skills TEXT[],
    
    -- Market Intelligence
    market_value DECIMAL(3,2),
    rarity_score DECIMAL(3,2),
    demand_score DECIMAL(3,2),
    
    -- AI Analysis
    ai_summary TEXT,
    ai_insights JSONB,
    confidence_score DECIMAL(3,2),
    summary TEXT,
    
    -- Additional fields
    languages JSONB,
    salary_expectation INTEGER,
    quality_score DECIMAL(3,2),
    upload_token TEXT,
    consent_given BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resume_summaries_resume_id ON resume_summaries(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_quick_id ON resume_summaries(quick_id);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_primary_skills ON resume_summaries USING GIN(primary_skills);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_market_value ON resume_summaries(market_value);

-- Enable RLS
ALTER TABLE resume_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Resume summaries are publicly readable" ON resume_summaries
    FOR SELECT USING (true);

CREATE POLICY "Admin can manage resume summaries" ON resume_summaries
    FOR ALL USING (auth.role() = 'service_role');
