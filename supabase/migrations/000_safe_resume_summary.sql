-- Safe resume_summaries table with IF NOT EXISTS checks
-- This migration can be run multiple times safely

-- Create resume_summaries table for quick access to resume data
CREATE TABLE IF NOT EXISTS resume_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    current_position TEXT,
    current_company TEXT,
    experience_years INTEGER,
    education_level TEXT,
    skills TEXT[],
    languages TEXT[],
    salary_expectation TEXT,
    availability TEXT,
    work_type TEXT[],
    summary TEXT,
    key_achievements TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_resume_summaries_full_name ON resume_summaries (full_name);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_email ON resume_summaries (email);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_phone ON resume_summaries (phone);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_location ON resume_summaries (location);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_current_position ON resume_summaries (current_position);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_experience_years ON resume_summaries (experience_years);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_skills ON resume_summaries USING GIN (skills);

-- Enable RLS
ALTER TABLE resume_summaries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read resume summaries" ON resume_summaries;
DROP POLICY IF EXISTS "Anyone can insert resume summaries" ON resume_summaries;
DROP POLICY IF EXISTS "Anyone can update resume summaries" ON resume_summaries;
DROP POLICY IF EXISTS "Anyone can delete resume summaries" ON resume_summaries;

-- RLS policies for resume_summaries (anonymous access)
CREATE POLICY "Anyone can read resume summaries" ON resume_summaries
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert resume summaries" ON resume_summaries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update resume summaries" ON resume_summaries
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete resume summaries" ON resume_summaries
    FOR DELETE USING (true);

-- Function to create resume summary from parsed data
CREATE OR REPLACE FUNCTION create_resume_summary_from_parsed_data()
RETURNS TRIGGER AS $$
DECLARE
    v_parsed_data JSONB;
    v_skills TEXT[];
    v_languages TEXT[];
    v_current_experience JSONB;
    v_key_achievements TEXT[];
    v_work_type TEXT[];
    v_full_name TEXT;
    v_email TEXT;
    v_phone TEXT;
    v_location TEXT;
    v_current_position TEXT;
    v_current_company TEXT;
    v_experience_years INTEGER;
    v_education_level TEXT;
    v_summary TEXT;
BEGIN
    v_parsed_data := NEW.parsed_data;

    -- Extracting data from parsed_data
    v_full_name := v_parsed_data->'personal'->>'fullName';
    v_email := v_parsed_data->'personal'->>'email';
    v_phone := v_parsed_data->'personal'->>'phone';
    v_location := v_parsed_data->'personal'->>'location';

    -- Skills
    SELECT ARRAY_AGG(DISTINCT s) INTO v_skills
    FROM (
        SELECT JSONB_ARRAY_ELEMENTS_TEXT(v_parsed_data->'professional'->'skills'->'hard') AS s
        UNION ALL
        SELECT JSONB_ARRAY_ELEMENTS_TEXT(v_parsed_data->'professional'->'skills'->'soft') AS s
        UNION ALL
        SELECT JSONB_ARRAY_ELEMENTS_TEXT(v_parsed_data->'professional'->'skills'->'tools') AS s
    ) AS all_skills;

    -- Languages
    SELECT ARRAY_AGG(CONCAT(lang->>'language', ' (', lang->>'level', ')')) INTO v_languages
    FROM JSONB_ARRAY_ELEMENTS(v_parsed_data->'languages') AS lang;

    -- Current experience
    SELECT item INTO v_current_experience
    FROM JSONB_ARRAY_ELEMENTS(v_parsed_data->'experience') AS item
    WHERE item->>'endDate' IS NULL OR item->>'endDate' = ''
    LIMIT 1;

    IF v_current_experience IS NULL AND JSONB_ARRAY_LENGTH(v_parsed_data->'experience') > 0 THEN
        v_current_experience := JSONB_ARRAY_GET(v_parsed_data->'experience', 0);
    END IF;

    v_current_position := v_current_experience->>'position';
    v_current_company := v_current_experience->>'company';
    v_experience_years := (v_parsed_data->'professional'->>'totalExperience')::INTEGER;
    v_summary := v_parsed_data->'professional'->>'summary';

    -- Education level
    v_education_level := v_parsed_data->'education'->0->>'degree';

    -- Key achievements
    SELECT ARRAY_AGG(item) INTO v_key_achievements
    FROM (
        SELECT JSONB_ARRAY_ELEMENTS_TEXT(exp->'achievements') AS item
        FROM JSONB_ARRAY_ELEMENTS(v_parsed_data->'experience') AS exp
    ) AS all_achievements
    LIMIT 5;

    -- Work type (basic logic)
    v_work_type := '{}';
    IF v_location ILIKE '%remote%' OR v_summary ILIKE '%remote%' THEN
        v_work_type := ARRAY_APPEND(v_work_type, 'remote');
    END IF;
    IF v_summary ILIKE '%office%' OR v_summary ILIKE '%офис%' THEN
        v_work_type := ARRAY_APPEND(v_work_type, 'office');
    END IF;
    IF ARRAY_LENGTH(v_work_type, 1) IS NULL THEN
        v_work_type := ARRAY_APPEND(v_work_type, 'hybrid');
    END IF;

    INSERT INTO resume_summaries (
        resume_id, full_name, email, phone, location,
        current_position, current_company, experience_years, education_level,
        skills, languages, salary_expectation, availability, work_type, summary, key_achievements
    ) VALUES (
        NEW.id, v_full_name, v_email, v_phone, v_location,
        v_current_position, v_current_company, v_experience_years, v_education_level,
        v_skills, v_languages, NULL, 'immediately', v_work_type, v_summary, v_key_achievements
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update resume summary from parsed data
CREATE OR REPLACE FUNCTION update_resume_summary_from_parsed_data()
RETURNS TRIGGER AS $$
DECLARE
    v_parsed_data JSONB;
    v_skills TEXT[];
    v_languages TEXT[];
    v_current_experience JSONB;
    v_key_achievements TEXT[];
    v_work_type TEXT[];
    v_full_name TEXT;
    v_email TEXT;
    v_phone TEXT;
    v_location TEXT;
    v_current_position TEXT;
    v_current_company TEXT;
    v_experience_years INTEGER;
    v_education_level TEXT;
    v_summary TEXT;
BEGIN
    v_parsed_data := NEW.parsed_data;

    -- Extracting data from parsed_data
    v_full_name := v_parsed_data->'personal'->>'fullName';
    v_email := v_parsed_data->'personal'->>'email';
    v_phone := v_parsed_data->'personal'->>'phone';
    v_location := v_parsed_data->'personal'->>'location';

    -- Skills
    SELECT ARRAY_AGG(DISTINCT s) INTO v_skills
    FROM (
        SELECT JSONB_ARRAY_ELEMENTS_TEXT(v_parsed_data->'professional'->'skills'->'hard') AS s
        UNION ALL
        SELECT JSONB_ARRAY_ELEMENTS_TEXT(v_parsed_data->'professional'->'skills'->'soft') AS s
        UNION ALL
        SELECT JSONB_ARRAY_ELEMENTS_TEXT(v_parsed_data->'professional'->'skills'->'tools') AS s
    ) AS all_skills;

    -- Languages
    SELECT ARRAY_AGG(CONCAT(lang->>'language', ' (', lang->>'level', ')')) INTO v_languages
    FROM JSONB_ARRAY_ELEMENTS(v_parsed_data->'languages') AS lang;

    -- Current experience
    SELECT item INTO v_current_experience
    FROM JSONB_ARRAY_ELEMENTS(v_parsed_data->'experience') AS item
    WHERE item->>'endDate' IS NULL OR item->>'endDate' = ''
    LIMIT 1;

    IF v_current_experience IS NULL AND JSONB_ARRAY_LENGTH(v_parsed_data->'experience') > 0 THEN
        v_current_experience := JSONB_ARRAY_GET(v_parsed_data->'experience', 0);
    END IF;

    v_current_position := v_current_experience->>'position';
    v_current_company := v_current_experience->>'company';
    v_experience_years := (v_parsed_data->'professional'->>'totalExperience')::INTEGER;
    v_summary := v_parsed_data->'professional'->>'summary';

    -- Education level
    v_education_level := v_parsed_data->'education'->0->>'degree';

    -- Key achievements
    SELECT ARRAY_AGG(item) INTO v_key_achievements
    FROM (
        SELECT JSONB_ARRAY_ELEMENTS_TEXT(exp->'achievements') AS item
        FROM JSONB_ARRAY_ELEMENTS(v_parsed_data->'experience') AS exp
    ) AS all_achievements
    LIMIT 5;

    -- Work type (basic logic)
    v_work_type := '{}';
    IF v_location ILIKE '%remote%' OR v_summary ILIKE '%remote%' THEN
        v_work_type := ARRAY_APPEND(v_work_type, 'remote');
    END IF;
    IF v_summary ILIKE '%office%' OR v_summary ILIKE '%офис%' THEN
        v_work_type := ARRAY_APPEND(v_work_type, 'office');
    END IF;
    IF ARRAY_LENGTH(v_work_type, 1) IS NULL THEN
        v_work_type := ARRAY_APPEND(v_work_type, 'hybrid');
    END IF;

    UPDATE resume_summaries
    SET
        full_name = v_full_name,
        email = v_email,
        phone = v_phone,
        location = v_location,
        current_position = v_current_position,
        current_company = v_current_company,
        experience_years = v_experience_years,
        education_level = v_education_level,
        skills = v_skills,
        languages = v_languages,
        salary_expectation = NULL,
        availability = 'immediately',
        work_type = v_work_type,
        summary = v_summary,
        key_achievements = v_key_achievements,
        updated_at = NOW()
    WHERE resume_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trg_create_resume_summary ON resumes;
DROP TRIGGER IF EXISTS trg_update_resume_summary ON resumes;

-- Create triggers
CREATE TRIGGER trg_create_resume_summary
    AFTER INSERT ON resumes
    FOR EACH ROW EXECUTE FUNCTION create_resume_summary_from_parsed_data();

CREATE TRIGGER trg_update_resume_summary
    AFTER UPDATE ON resumes
    FOR EACH ROW EXECUTE FUNCTION update_resume_summary_from_parsed_data();
