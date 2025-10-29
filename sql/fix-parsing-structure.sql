-- Исправление структуры парсинга резюме
-- Эта миграция исправляет проблемы с парсингом и структурой таблиц

-- 1. Сначала очистим и пересоздадим таблицу resume_summaries с правильной структурой
DROP TABLE IF EXISTS resume_summaries CASCADE;

CREATE TABLE resume_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    quick_id TEXT UNIQUE NOT NULL,
    
    -- Basic Info
    full_name TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    
    -- Professional Info
    current_position TEXT,
    current_company TEXT,
    last_position TEXT,
    last_company TEXT,
    experience_years INTEGER DEFAULT 0,
    education_level TEXT,
    
    -- Skills Analysis
    primary_skills TEXT[] DEFAULT '{}',
    secondary_skills TEXT[] DEFAULT '{}',
    skills TEXT[] DEFAULT '{}',
    
    -- Additional Info
    languages TEXT[] DEFAULT '{}',
    summary TEXT,
    ai_summary TEXT,
    
    -- Quality and Metadata
    quality_score NUMERIC DEFAULT 0,
    confidence_score NUMERIC DEFAULT 0,
    upload_token TEXT,
    consent_given BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_resume_summaries_resume_id ON resume_summaries(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_quick_id ON resume_summaries(quick_id);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_full_name ON resume_summaries(full_name);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_email ON resume_summaries(email);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_phone ON resume_summaries(phone);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_location ON resume_summaries(location);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_current_position ON resume_summaries(current_position);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_experience_years ON resume_summaries(experience_years);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_skills ON resume_summaries USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_languages ON resume_summaries USING GIN(languages);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_quality_score ON resume_summaries(quality_score);

-- 3. Включаем RLS
ALTER TABLE resume_summaries ENABLE ROW LEVEL SECURITY;

-- 4. Создаем политики RLS
DROP POLICY IF EXISTS "Anyone can read resume summaries" ON resume_summaries;
DROP POLICY IF EXISTS "Anyone can insert resume summaries" ON resume_summaries;
DROP POLICY IF EXISTS "Anyone can update resume summaries" ON resume_summaries;
DROP POLICY IF EXISTS "Anyone can delete resume summaries" ON resume_summaries;

CREATE POLICY "Anyone can read resume summaries" ON resume_summaries
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert resume summaries" ON resume_summaries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update resume summaries" ON resume_summaries
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete resume summaries" ON resume_summaries
    FOR DELETE USING (true);

-- 5. Создаем функцию для извлечения данных из старой структуры parsed_data
CREATE OR REPLACE FUNCTION extract_resume_data_from_old_format(parsed_data JSONB)
RETURNS TABLE (
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
    summary TEXT,
    quality_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY SELECT
        -- Извлекаем из extracted_data (старый формат)
        COALESCE(
            parsed_data->'extracted_data'->>'fullName',
            parsed_data->>'fullName'
        )::TEXT as full_name,
        
        COALESCE(
            parsed_data->'extracted_data'->>'email',
            parsed_data->>'email'
        )::TEXT as email,
        
        COALESCE(
            parsed_data->'extracted_data'->>'phone',
            parsed_data->>'phone'
        )::TEXT as phone,
        
        COALESCE(
            parsed_data->'extracted_data'->>'location',
            parsed_data->>'location'
        )::TEXT as location,
        
        COALESCE(
            parsed_data->'extracted_data'->>'lastPosition',
            parsed_data->>'lastPosition'
        )::TEXT as current_position,
        
        COALESCE(
            parsed_data->'extracted_data'->>'lastCompany',
            parsed_data->>'lastCompany'
        )::TEXT as current_company,
        
        COALESCE(
            (parsed_data->'extracted_data'->>'experienceYears')::INTEGER,
            (parsed_data->>'experienceYears')::INTEGER,
            0
        ) as experience_years,
        
        COALESCE(
            parsed_data->'extracted_data'->>'educationLevel',
            parsed_data->>'educationLevel'
        )::TEXT as education_level,
        
        COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(parsed_data->'extracted_data'->'skills')),
            ARRAY(SELECT jsonb_array_elements_text(parsed_data->'skills')),
            '{}'::TEXT[]
        ) as skills,
        
        COALESCE(
            ARRAY(
                SELECT CONCAT(lang->>'language', ' (', lang->>'level', ')')
                FROM jsonb_array_elements(parsed_data->'extracted_data'->'languages') as lang
            ),
            ARRAY(
                SELECT CONCAT(lang->>'language', ' (', lang->>'level', ')')
                FROM jsonb_array_elements(parsed_data->'languages') as lang
            ),
            '{}'::TEXT[]
        ) as languages,
        
        COALESCE(
            parsed_data->'extracted_data'->>'summary',
            parsed_data->>'summary'
        )::TEXT as summary,
        
        COALESCE(
            (parsed_data->'extracted_data'->>'qualityScore')::NUMERIC,
            (parsed_data->>'qualityScore')::NUMERIC,
            0
        ) as quality_score;
END;
$$ LANGUAGE plpgsql;

-- 6. Создаем функцию для создания сводки резюме
CREATE OR REPLACE FUNCTION create_resume_summary_from_parsed_data()
RETURNS TRIGGER AS $$
DECLARE
    extracted_data RECORD;
    v_primary_skills TEXT[];
    v_secondary_skills TEXT[];
    v_all_skills TEXT[];
    v_quick_id TEXT;
BEGIN
    -- Извлекаем данные из parsed_data
    SELECT * INTO extracted_data
    FROM extract_resume_data_from_old_format(NEW.parsed_data);
    
    -- Получаем все навыки
    v_all_skills := extracted_data.skills;
    
    -- Разделяем на основные (топ-5) и дополнительные
    v_primary_skills := v_all_skills[1:5];
    v_secondary_skills := v_all_skills[6:array_length(v_all_skills, 1)];
    
    -- Генерируем уникальный quick_id
    v_quick_id := 'RES-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
    
    -- Вставляем в resume_summaries
    INSERT INTO resume_summaries (
        resume_id, quick_id, full_name, email, phone, location,
        current_position, current_company, last_position, last_company,
        experience_years, education_level, primary_skills, secondary_skills,
        skills, languages, summary, ai_summary, quality_score, confidence_score,
        upload_token, consent_given, expires_at
    ) VALUES (
        NEW.id, v_quick_id, extracted_data.full_name, extracted_data.email,
        extracted_data.phone, extracted_data.location, extracted_data.current_position,
        extracted_data.current_company, extracted_data.current_position, extracted_data.current_company,
        extracted_data.experience_years, extracted_data.education_level,
        v_primary_skills, v_secondary_skills, v_all_skills, extracted_data.languages,
        extracted_data.summary, extracted_data.summary, extracted_data.quality_score,
        0.95, NEW.upload_token, NEW.consent_given, NEW.expires_at
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Создаем триггер для автоматического создания сводок
DROP TRIGGER IF EXISTS trg_create_resume_summary ON resumes;
CREATE TRIGGER trg_create_resume_summary
    AFTER INSERT ON resumes
    FOR EACH ROW EXECUTE FUNCTION create_resume_summary_from_parsed_data();

-- 8. Создаем триггер для обновления сводок
CREATE OR REPLACE FUNCTION update_resume_summary_from_parsed_data()
RETURNS TRIGGER AS $$
DECLARE
    extracted_data RECORD;
    v_primary_skills TEXT[];
    v_secondary_skills TEXT[];
    v_all_skills TEXT[];
BEGIN
    -- Извлекаем данные из parsed_data
    SELECT * INTO extracted_data
    FROM extract_resume_data_from_old_format(NEW.parsed_data);
    
    -- Получаем все навыки
    v_all_skills := extracted_data.skills;
    
    -- Разделяем на основные (топ-5) и дополнительные
    v_primary_skills := v_all_skills[1:5];
    v_secondary_skills := v_all_skills[6:array_length(v_all_skills, 1)];
    
    -- Обновляем resume_summaries
    UPDATE resume_summaries SET
        full_name = extracted_data.full_name,
        email = extracted_data.email,
        phone = extracted_data.phone,
        location = extracted_data.location,
        current_position = extracted_data.current_position,
        current_company = extracted_data.current_company,
        last_position = extracted_data.current_position,
        last_company = extracted_data.current_company,
        experience_years = extracted_data.experience_years,
        education_level = extracted_data.education_level,
        primary_skills = v_primary_skills,
        secondary_skills = v_secondary_skills,
        skills = v_all_skills,
        languages = extracted_data.languages,
        summary = extracted_data.summary,
        ai_summary = extracted_data.summary,
        quality_score = extracted_data.quality_score,
        updated_at = NOW()
    WHERE resume_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_resume_summary ON resumes;
CREATE TRIGGER trg_update_resume_summary
    AFTER UPDATE ON resumes
    FOR EACH ROW EXECUTE FUNCTION update_resume_summary_from_parsed_data();

-- 9. Создаем триггер для updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_resume_summaries_updated_at ON resume_summaries;
CREATE TRIGGER update_resume_summaries_updated_at
    BEFORE UPDATE ON resume_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Мигрируем существующие данные
INSERT INTO resume_summaries (
    resume_id, quick_id, full_name, email, phone, location,
    current_position, current_company, last_position, last_company,
    experience_years, education_level, primary_skills, secondary_skills,
    skills, languages, summary, ai_summary, quality_score, confidence_score,
    upload_token, consent_given, expires_at
)
SELECT 
    r.id as resume_id,
    'RES-' || EXTRACT(EPOCH FROM r.created_at)::BIGINT || '-' || SUBSTRING(r.id::TEXT, 1, 8) as quick_id,
    ed.full_name, ed.email, ed.phone, ed.location,
    ed.current_position, ed.current_company, ed.current_position, ed.current_company,
    ed.experience_years, ed.education_level,
    ed.skills[1:5] as primary_skills,
    ed.skills[6:array_length(ed.skills, 1)] as secondary_skills,
    ed.skills, ed.languages, ed.summary, ed.summary as ai_summary,
    ed.quality_score, 0.95 as confidence_score,
    r.upload_token, r.consent_given, r.expires_at
FROM resumes r
CROSS JOIN LATERAL extract_resume_data_from_old_format(r.parsed_data) as ed
WHERE r.parsed_data IS NOT NULL;

-- 11. Добавляем комментарии к таблице
COMMENT ON TABLE resume_summaries IS 'Краткие сводки резюме для быстрого поиска и отображения';
COMMENT ON COLUMN resume_summaries.primary_skills IS 'Основные навыки (топ-5)';
COMMENT ON COLUMN resume_summaries.secondary_skills IS 'Дополнительные навыки';
COMMENT ON COLUMN resume_summaries.quick_id IS 'Человекочитаемый ID для быстрого доступа';
COMMENT ON COLUMN resume_summaries.confidence_score IS 'Уровень уверенности AI в парсинге (0-1)';
