-- Fix resume_summaries table structure

-- Add missing columns to resume_summaries
ALTER TABLE resume_summaries 
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS languages JSONB,
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2);

-- Update the table structure to match the expected schema
ALTER TABLE resume_summaries 
ALTER COLUMN primary_skills SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN secondary_skills SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN skill_categories SET DEFAULT '{}'::JSONB,
ALTER COLUMN skill_levels SET DEFAULT '{}'::JSONB,
ALTER COLUMN market_value SET DEFAULT 0.5,
ALTER COLUMN rarity_score SET DEFAULT 0.5,
ALTER COLUMN demand_score SET DEFAULT 0.5,
ALTER COLUMN ai_summary SET DEFAULT '',
ALTER COLUMN ai_insights SET DEFAULT '{}'::JSONB,
ALTER COLUMN confidence_score SET DEFAULT 0.5;
