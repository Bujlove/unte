-- Smart Parsing System Migration
-- Creates intelligent resume parsing and knowledge base

-- 1. Skills Knowledge Base
CREATE TABLE IF NOT EXISTS skills_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL, -- 'programming', 'design', 'management', 'languages', etc.
    subcategory TEXT, -- 'frontend', 'backend', 'mobile', etc.
    aliases TEXT[], -- alternative names for the skill
    related_skills TEXT[], -- skills that often appear together
    industry_usage JSONB, -- how often used in different industries
    experience_levels TEXT[], -- 'junior', 'middle', 'senior', 'lead'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enhanced Resume Processing
CREATE TABLE IF NOT EXISTS resume_processing_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    processing_stage TEXT NOT NULL, -- 'uploaded', 'parsing', 'ai_analysis', 'completed', 'failed'
    stage_details JSONB, -- detailed information about the stage
    ai_confidence DECIMAL(3,2), -- 0.00 to 1.00
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Market Intelligence
CREATE TABLE IF NOT EXISTS market_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name TEXT NOT NULL,
    market_demand DECIMAL(3,2), -- 0.00 to 1.00
    average_salary_min INTEGER,
    average_salary_max INTEGER,
    trend_direction TEXT, -- 'rising', 'stable', 'declining'
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_source TEXT -- 'resume_analysis', 'job_postings', 'external_api'
);

-- 4. AI Learning Data
CREATE TABLE IF NOT EXISTS ai_learning_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type TEXT NOT NULL, -- 'resume_pattern', 'skill_combination', 'search_query', 'user_feedback'
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    learning_source TEXT, -- 'deepseek', 'jina', 'user_interaction'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enhanced Resume Summaries (replace existing)
DROP TABLE IF EXISTS resume_summaries;
CREATE TABLE resume_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    quick_id TEXT UNIQUE, -- human-readable ID like "RES-2024-001"
    
    -- Basic Info
    full_name TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    
    -- Professional Info
    current_position TEXT,
    current_company TEXT,
    experience_years INTEGER,
    education_level TEXT,
    
    -- Skills Analysis
    primary_skills TEXT[], -- top 5-10 most important skills
    secondary_skills TEXT[], -- additional skills
    skill_categories JSONB, -- skills grouped by category
    skill_levels JSONB, -- estimated skill levels
    
    -- Market Intelligence
    market_value DECIMAL(3,2), -- 0.00 to 1.00
    rarity_score DECIMAL(3,2), -- how rare this skill combination is
    demand_score DECIMAL(3,2), -- current market demand
    
    -- AI Analysis
    ai_summary TEXT, -- AI-generated summary
    ai_insights JSONB, -- additional AI insights
    confidence_score DECIMAL(3,2),
    
    -- Metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Search Intelligence
CREATE TABLE IF NOT EXISTS search_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_query TEXT NOT NULL,
    search_context JSONB, -- additional context about the search
    results_returned INTEGER,
    user_interaction JSONB, -- which results were clicked, saved, etc.
    search_success_score DECIMAL(3,2), -- based on user feedback
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_skills_knowledge_category ON skills_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_skills_knowledge_skill_name ON skills_knowledge(skill_name);
CREATE INDEX IF NOT EXISTS idx_resume_processing_log_resume_id ON resume_processing_log(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_processing_log_stage ON resume_processing_log(processing_stage);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_quick_id ON resume_summaries(quick_id);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_primary_skills ON resume_summaries USING GIN(primary_skills);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_market_value ON resume_summaries(market_value);
CREATE INDEX IF NOT EXISTS idx_market_insights_skill_name ON market_insights(skill_name);
CREATE INDEX IF NOT EXISTS idx_market_insights_demand ON market_insights(market_demand);

-- Functions for smart processing
CREATE OR REPLACE FUNCTION generate_quick_id()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    quick_id TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(quick_id FROM 9) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM resume_summaries
    WHERE quick_id LIKE 'RES-' || year_part || '-%';
    
    quick_id := 'RES-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
    RETURN quick_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update market insights
CREATE OR REPLACE FUNCTION update_market_insights()
RETURNS TRIGGER AS $$
BEGIN
    -- Update market insights based on new resume data
    -- This will be called when new resumes are processed
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update market insights
CREATE TRIGGER trigger_update_market_insights
    AFTER INSERT OR UPDATE ON resume_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_market_insights();

-- RLS Policies
ALTER TABLE skills_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_processing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_intelligence ENABLE ROW LEVEL SECURITY;

-- Public read access for skills knowledge
CREATE POLICY "Skills knowledge is publicly readable" ON skills_knowledge
    FOR SELECT USING (true);

-- Admin access for processing logs
CREATE POLICY "Admin can manage processing logs" ON resume_processing_log
    FOR ALL USING (auth.role() = 'service_role');

-- Public read access for market insights
CREATE POLICY "Market insights are publicly readable" ON market_insights
    FOR SELECT USING (true);

-- Admin access for AI learning data
CREATE POLICY "Admin can manage AI learning data" ON ai_learning_data
    FOR ALL USING (auth.role() = 'service_role');

-- Resume summaries follow same pattern as resumes
CREATE POLICY "Resume summaries are publicly readable" ON resume_summaries
    FOR SELECT USING (true);

CREATE POLICY "Admin can manage resume summaries" ON resume_summaries
    FOR ALL USING (auth.role() = 'service_role');

-- Search intelligence - users can only see their own
CREATE POLICY "Users can manage their own search intelligence" ON search_intelligence
    FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');
