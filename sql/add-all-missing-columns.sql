-- Add ALL missing columns to resume_summaries table

-- Add all missing columns that might be referenced
ALTER TABLE resume_summaries 
ADD COLUMN IF NOT EXISTS salary_expectation INTEGER,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS education_level TEXT,
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS upload_token TEXT,
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS languages JSONB,
ADD COLUMN IF NOT EXISTS current_company TEXT,
ADD COLUMN IF NOT EXISTS last_position TEXT,
ADD COLUMN IF NOT EXISTS last_company TEXT,
ADD COLUMN IF NOT EXISTS experience_years INTEGER,
ADD COLUMN IF NOT EXISTS current_position TEXT,
ADD COLUMN IF NOT EXISTS primary_skills TEXT[],
ADD COLUMN IF NOT EXISTS secondary_skills TEXT[],
ADD COLUMN IF NOT EXISTS skill_categories JSONB,
ADD COLUMN IF NOT EXISTS skill_levels JSONB,
ADD COLUMN IF NOT EXISTS market_value DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS rarity_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS demand_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_insights JSONB,
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2);

-- Set default values for existing records
UPDATE resume_summaries 
SET 
  salary_expectation = 0,
  location = '',
  education_level = 'high_school',
  quality_score = 0.5,
  consent_given = false,
  summary = '',
  skills = ARRAY[]::TEXT[],
  languages = '{}'::JSONB,
  current_company = '',
  last_position = '',
  last_company = '',
  experience_years = 0,
  current_position = '',
  primary_skills = ARRAY[]::TEXT[],
  secondary_skills = ARRAY[]::TEXT[],
  skill_categories = '{}'::JSONB,
  skill_levels = '{}'::JSONB,
  market_value = 0.5,
  rarity_score = 0.5,
  demand_score = 0.5,
  ai_summary = '',
  ai_insights = '{}'::JSONB,
  confidence_score = 0.5
WHERE summary IS NULL;
