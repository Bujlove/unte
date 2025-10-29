-- Add missing columns to resume_summaries table

-- Add salary_expectation column
ALTER TABLE resume_summaries 
ADD COLUMN IF NOT EXISTS salary_expectation INTEGER;

-- Add other missing columns that might be needed
ALTER TABLE resume_summaries 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS education_level TEXT,
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS upload_token TEXT,
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Set default values for existing records
UPDATE resume_summaries 
SET 
  salary_expectation = 0,
  location = '',
  education_level = 'high_school',
  quality_score = 0.5,
  consent_given = false
WHERE salary_expectation IS NULL;
