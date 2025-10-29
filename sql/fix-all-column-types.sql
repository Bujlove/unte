-- Fix all column type issues in the database
-- This script addresses the languages column type mismatch

-- First, let's check what we have
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'resumes' AND column_name = 'languages';

-- Check resume_summaries table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'resume_summaries' AND column_name IN ('languages', 'skills');

-- Fix languages column in resumes table
-- Change from JSONB to TEXT[] to match the code expectations

-- First, create a temporary column
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS languages_temp TEXT[];

-- Convert JSONB data to TEXT[] in the temporary column
UPDATE resumes 
SET languages_temp = CASE 
    WHEN languages IS NULL THEN NULL
    WHEN jsonb_typeof(languages) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements_text(languages))
    ELSE ARRAY[]::TEXT[]
END;

-- Drop the old column and rename the new one
ALTER TABLE resumes DROP COLUMN IF EXISTS languages;
ALTER TABLE resumes RENAME COLUMN languages_temp TO languages;

-- Fix skills column in resume_summaries table if it exists
-- Make sure it's TEXT[] type
ALTER TABLE resume_summaries 
ALTER COLUMN skills TYPE TEXT[] USING 
    CASE 
        WHEN skills IS NULL THEN NULL
        WHEN jsonb_typeof(skills) = 'array' THEN 
            ARRAY(SELECT jsonb_array_elements_text(skills))
        ELSE ARRAY[]::TEXT[]
    END;

-- Fix languages column in resume_summaries table if it exists
-- Make sure it's TEXT[] type
ALTER TABLE resume_summaries 
ALTER COLUMN languages TYPE TEXT[] USING 
    CASE 
        WHEN languages IS NULL THEN NULL
        WHEN jsonb_typeof(languages) = 'array' THEN 
            ARRAY(SELECT jsonb_array_elements_text(languages))
        ELSE ARRAY[]::TEXT[]
    END;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'resumes' AND column_name = 'languages';

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'resume_summaries' AND column_name IN ('languages', 'skills');
