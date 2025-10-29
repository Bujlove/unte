-- Temporarily disable triggers to stop the errors
-- This will prevent the functions from running until we fix the column types

-- First drop the triggers
DROP TRIGGER IF EXISTS trg_create_resume_summary ON resumes;
DROP TRIGGER IF EXISTS trg_update_resume_summary ON resumes;

-- Also drop the functions to prevent any calls
DROP FUNCTION IF EXISTS create_resume_summary() CASCADE;
DROP FUNCTION IF EXISTS update_resume_summary() CASCADE;

-- Check current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'resume_summaries' AND column_name IN ('languages', 'skills');
