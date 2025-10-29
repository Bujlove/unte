-- Final fix for column types in resume_summaries table
-- This will convert JSONB columns to TEXT[] arrays

-- First, let's see what we have
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'resume_summaries' AND column_name IN ('languages', 'skills');

-- Fix languages column - check if it's already TEXT[] or needs conversion
DO $$
BEGIN
    -- Check if languages column is already TEXT[]
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'resume_summaries' 
        AND column_name = 'languages' 
        AND data_type = 'ARRAY'
    ) THEN
        -- Column is already TEXT[], no need to convert
        RAISE NOTICE 'Languages column is already TEXT[], skipping conversion';
    ELSE
        -- Column is JSONB, need to convert
        ALTER TABLE resume_summaries ADD COLUMN IF NOT EXISTS languages_temp TEXT[];
        
        UPDATE resume_summaries 
        SET languages_temp = CASE 
            WHEN languages IS NULL THEN NULL
            WHEN jsonb_typeof(languages) = 'array' THEN 
                ARRAY(SELECT jsonb_array_elements_text(languages))
            ELSE ARRAY[]::TEXT[]
        END;
        
        ALTER TABLE resume_summaries DROP COLUMN IF EXISTS languages;
        ALTER TABLE resume_summaries RENAME COLUMN languages_temp TO languages;
        
        RAISE NOTICE 'Languages column converted from JSONB to TEXT[]';
    END IF;
END $$;

-- Fix skills column - check if it's already TEXT[] or needs conversion
DO $$
BEGIN
    -- Check if skills column is already TEXT[]
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'resume_summaries' 
        AND column_name = 'skills' 
        AND data_type = 'ARRAY'
    ) THEN
        -- Column is already TEXT[], no need to convert
        RAISE NOTICE 'Skills column is already TEXT[], skipping conversion';
    ELSE
        -- Column is JSONB, need to convert
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
        
        RAISE NOTICE 'Skills column converted from JSONB to TEXT[]';
    END IF;
END $$;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'resume_summaries' AND column_name IN ('languages', 'skills');
