-- Создание таблицы для быстрого доступа к данным резюме
CREATE TABLE IF NOT EXISTS resume_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    current_position TEXT,
    current_company TEXT,
    experience_years INTEGER DEFAULT 0,
    education_level TEXT,
    skills TEXT[], -- Массив навыков
    languages TEXT[], -- Массив языков
    salary_expectation TEXT,
    availability TEXT, -- Готовность к работе
    work_type TEXT[], -- Тип работы: remote, office, hybrid
    summary TEXT, -- Краткое резюме
    key_achievements TEXT[], -- Ключевые достижения
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_resume_summaries_resume_id ON resume_summaries(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_skills ON resume_summaries USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_location ON resume_summaries(location);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_experience ON resume_summaries(experience_years);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_position ON resume_summaries(current_position);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_work_type ON resume_summaries USING GIN(work_type);

-- RLS политики
ALTER TABLE resume_summaries ENABLE ROW LEVEL SECURITY;

-- Политика для чтения - все авторизованные пользователи могут читать
CREATE POLICY "Anyone can read resume summaries" ON resume_summaries
    FOR SELECT USING (true);

-- Политика для вставки - только авторизованные пользователи
CREATE POLICY "Authenticated users can insert resume summaries" ON resume_summaries
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Политика для обновления - только владелец резюме
CREATE POLICY "Users can update their resume summaries" ON resume_summaries
    FOR UPDATE USING (
        resume_id IN (
            SELECT id FROM resumes WHERE user_id = auth.uid()
        )
    );

-- Политика для удаления - только владелец резюме
CREATE POLICY "Users can delete their resume summaries" ON resume_summaries
    FOR DELETE USING (
        resume_id IN (
            SELECT id FROM resumes WHERE user_id = auth.uid()
        )
    );

-- Функция для автоматического создания summary при создании резюме
CREATE OR REPLACE FUNCTION create_resume_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Создаем запись в resume_summaries при создании резюме
    INSERT INTO resume_summaries (resume_id, full_name, email, phone, location, current_position, current_company, experience_years, education_level, skills, languages, summary)
    VALUES (
        NEW.id,
        COALESCE((NEW.parsed_data->>'fullName')::TEXT, ''),
        COALESCE((NEW.parsed_data->>'email')::TEXT, ''),
        COALESCE((NEW.parsed_data->>'phone')::TEXT, ''),
        COALESCE((NEW.parsed_data->>'location')::TEXT, ''),
        COALESCE((NEW.parsed_data->>'lastPosition')::TEXT, ''),
        COALESCE((NEW.parsed_data->>'lastCompany')::TEXT, ''),
        COALESCE((NEW.parsed_data->>'experienceYears')::INTEGER, 0),
        COALESCE((NEW.parsed_data->>'educationLevel')::TEXT, ''),
        COALESCE((NEW.parsed_data->>'skills')::TEXT[], '{}'),
        COALESCE((NEW.parsed_data->>'languages')::TEXT[], '{}'),
        COALESCE((NEW.parsed_data->>'summary')::TEXT, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического создания summary
CREATE TRIGGER trigger_create_resume_summary
    AFTER INSERT ON resumes
    FOR EACH ROW
    EXECUTE FUNCTION create_resume_summary();

-- Функция для обновления summary при обновлении резюме
CREATE OR REPLACE FUNCTION update_resume_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем запись в resume_summaries при обновлении резюме
    UPDATE resume_summaries SET
        full_name = COALESCE((NEW.parsed_data->>'fullName')::TEXT, ''),
        email = COALESCE((NEW.parsed_data->>'email')::TEXT, ''),
        phone = COALESCE((NEW.parsed_data->>'phone')::TEXT, ''),
        location = COALESCE((NEW.parsed_data->>'location')::TEXT, ''),
        current_position = COALESCE((NEW.parsed_data->>'lastPosition')::TEXT, ''),
        current_company = COALESCE((NEW.parsed_data->>'lastCompany')::TEXT, ''),
        experience_years = COALESCE((NEW.parsed_data->>'experienceYears')::INTEGER, 0),
        education_level = COALESCE((NEW.parsed_data->>'educationLevel')::TEXT, ''),
        skills = COALESCE((NEW.parsed_data->>'skills')::TEXT[], '{}'),
        languages = COALESCE((NEW.parsed_data->>'languages')::TEXT[], '{}'),
        summary = COALESCE((NEW.parsed_data->>'summary')::TEXT, ''),
        updated_at = NOW()
    WHERE resume_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для обновления summary
CREATE TRIGGER trigger_update_resume_summary
    AFTER UPDATE ON resumes
    FOR EACH ROW
    EXECUTE FUNCTION update_resume_summary();
