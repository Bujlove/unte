-- Essential tables for smart parsing system

-- 1. Skills Knowledge Base
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

-- 2. Resume Processing Log
CREATE TABLE IF NOT EXISTS resume_processing_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    processing_stage TEXT NOT NULL,
    stage_details JSONB,
    ai_confidence DECIMAL(3,2),
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Market Insights
CREATE TABLE IF NOT EXISTS market_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name TEXT NOT NULL,
    market_demand DECIMAL(3,2),
    average_salary_min INTEGER,
    average_salary_max INTEGER,
    trend_direction TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_source TEXT
);

-- 4. AI Learning Data
CREATE TABLE IF NOT EXISTS ai_learning_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type TEXT NOT NULL,
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    learning_source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Search Intelligence
CREATE TABLE IF NOT EXISTS search_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_query TEXT NOT NULL,
    search_context JSONB,
    results_returned INTEGER,
    user_interaction JSONB,
    search_success_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_skills_knowledge_category ON skills_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_skills_knowledge_skill_name ON skills_knowledge(skill_name);
CREATE INDEX IF NOT EXISTS idx_resume_processing_log_resume_id ON resume_processing_log(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_processing_log_stage ON resume_processing_log(processing_stage);
CREATE INDEX IF NOT EXISTS idx_market_insights_skill_name ON market_insights(skill_name);
CREATE INDEX IF NOT EXISTS idx_market_insights_demand ON market_insights(market_demand);

-- RLS Policies
ALTER TABLE skills_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_processing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_data ENABLE ROW LEVEL SECURITY;
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

-- Search intelligence - users can only see their own
CREATE POLICY "Users can manage their own search intelligence" ON search_intelligence
    FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');
