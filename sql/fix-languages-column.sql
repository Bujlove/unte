-- Fix languages column type in resumes table
-- Change from JSONB to TEXT[] to match the expected format

-- First, let's check what's in the languages column
-- If it's empty or contains simple text arrays, we can convert it

-- Update existing data to convert JSONB to TEXT[]
UPDATE resumes 
SET languages = CASE 
    WHEN languages IS NULL THEN NULL
    WHEN jsonb_typeof(languages) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements_text(languages))
    ELSE NULL
END
WHERE languages IS NOT NULL;

-- If the column is still JSONB, we need to alter it
-- But first let's check if we can work with the current data
