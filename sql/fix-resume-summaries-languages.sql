-- Fix languages column in resume_summaries table
-- Change from JSONB to TEXT[] to match the code expectations

-- First, let's check the current structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'resume_summaries' AND column_name = 'languages';

-- Create a temporary column
ALTER TABLE resume_summaries ADD COLUMN IF NOT EXISTS languages_temp TEXT[];

-- Convert JSONB data to TEXT[] in the temporary column
UPDATE resume_summaries 
SET languages_temp = CASE 
    WHEN languages IS NULL THEN NULL
    WHEN jsonb_typeof(languages) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements_text(languages))
    ELSE ARRAY[]::TEXT[]
END;

-- Drop the old column and rename the new one
ALTER TABLE resume_summaries DROP COLUMN IF EXISTS languages;
ALTER TABLE resume_summaries RENAME COLUMN languages_temp TO languages;

-- Also fix skills column if it has the same issue
ALTER TABLE resume_summaries ADD COLUMN IF NOT EXISTS skills_temp TEXT[];

UPDATE resume_summaries 
SET skills_temp = CASE 
    WHEN skills IS NULL THEN NULL
    WHEN jsonb_typeof(skills) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements_text(skills))
    ELSE ARRAY[]::TEXT[]
END;

ALTER TABLE resume_summaries DROP COLUMN IF EXISTS skills;
ALTER TABLE resume_summaries RENAME COLUMN skills_temp TO skills;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'resume_summaries' AND column_name IN ('languages', 'skills');
