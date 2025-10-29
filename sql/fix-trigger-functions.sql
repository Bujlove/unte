-- Fix trigger functions to handle TEXT[] columns correctly

-- Drop and recreate the update_resume_summary function
DROP FUNCTION IF EXISTS update_resume_summary();

CREATE OR REPLACE FUNCTION update_resume_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update resume_summaries table with proper type casting
    UPDATE resume_summaries SET
        full_name = COALESCE((NEW.parsed_data->>'fullName')::TEXT, ''),
        email = COALESCE((NEW.parsed_data->>'email')::TEXT, ''),
        phone = COALESCE((NEW.parsed_data->>'phone')::TEXT, ''),
        location = COALESCE((NEW.parsed_data->>'location')::TEXT, ''),
        current_position = COALESCE((NEW.parsed_data->>'lastPosition')::TEXT, ''),
        current_company = COALESCE((NEW.parsed_data->>'lastCompany')::TEXT, ''),
        experience_years = COALESCE((NEW.parsed_data->>'experienceYears')::INTEGER, 0),
        education_level = COALESCE((NEW.parsed_data->>'educationLevel')::TEXT, ''),
        skills = CASE 
            WHEN NEW.parsed_data->>'skills' IS NOT NULL THEN
                ARRAY(SELECT jsonb_array_elements_text(NEW.parsed_data->'skills'))
            ELSE ARRAY[]::TEXT[]
        END,
        languages = CASE 
            WHEN NEW.parsed_data->>'languages' IS NOT NULL THEN
                ARRAY(SELECT jsonb_array_elements_text(NEW.parsed_data->'languages'))
            ELSE ARRAY[]::TEXT[]
        END,
        summary = COALESCE((NEW.parsed_data->>'summary')::TEXT, ''),
        updated_at = NOW()
    WHERE resume_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the create_resume_summary function
DROP FUNCTION IF EXISTS create_resume_summary();

CREATE OR REPLACE FUNCTION create_resume_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into resume_summaries table with proper type casting
    INSERT INTO resume_summaries (
        resume_id, quick_id, full_name, email, phone, location,
        current_position, current_company, experience_years, education_level,
        skills, languages, summary, created_at, updated_at
    ) VALUES (
        NEW.id,
        COALESCE((NEW.parsed_data->>'quickId')::TEXT, ''),
        COALESCE((NEW.parsed_data->>'fullName')::TEXT, ''),
        COALESCE((NEW.parsed_data->>'email')::TEXT, ''),
        COALESCE((NEW.parsed_data->>'phone')::TEXT, ''),
        COALESCE((NEW.parsed_data->>'location')::TEXT, ''),
        COALESCE((NEW.parsed_data->>'lastPosition')::TEXT, ''),
        COALESCE((NEW.parsed_data->>'lastCompany')::TEXT, ''),
        COALESCE((NEW.parsed_data->>'experienceYears')::INTEGER, 0),
        COALESCE((NEW.parsed_data->>'educationLevel')::TEXT, ''),
        CASE 
            WHEN NEW.parsed_data->>'skills' IS NOT NULL THEN
                ARRAY(SELECT jsonb_array_elements_text(NEW.parsed_data->'skills'))
            ELSE ARRAY[]::TEXT[]
        END,
        CASE 
            WHEN NEW.parsed_data->>'languages' IS NOT NULL THEN
                ARRAY(SELECT jsonb_array_elements_text(NEW.parsed_data->'languages'))
            ELSE ARRAY[]::TEXT[]
        END,
        COALESCE((NEW.parsed_data->>'summary')::TEXT, ''),
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-enable the triggers
DROP TRIGGER IF EXISTS trg_create_resume_summary ON resumes;
CREATE TRIGGER trg_create_resume_summary
    AFTER INSERT ON resumes
    FOR EACH ROW
    EXECUTE FUNCTION create_resume_summary();

DROP TRIGGER IF EXISTS trg_update_resume_summary ON resumes;
CREATE TRIGGER trg_update_resume_summary
    AFTER UPDATE ON resumes
    FOR EACH ROW
    EXECUTE FUNCTION update_resume_summary();
