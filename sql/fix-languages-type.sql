-- Fix languages column type in resumes table
-- Change from JSONB to TEXT[] to match the code expectations

-- First, create a temporary column
ALTER TABLE resumes ADD COLUMN languages_temp TEXT[];

-- Convert JSONB data to TEXT[] in the temporary column
UPDATE resumes 
SET languages_temp = CASE 
    WHEN languages IS NULL THEN NULL
    WHEN jsonb_typeof(languages) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements_text(languages))
    ELSE ARRAY[]::TEXT[]
END;

-- Drop the old column and rename the new one
ALTER TABLE resumes DROP COLUMN languages;
ALTER TABLE resumes RENAME COLUMN languages_temp TO languages;
