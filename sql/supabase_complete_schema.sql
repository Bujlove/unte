-- =============================================
-- UNTE AI RECRUITING SERVICE - ПОЛНАЯ СХЕМА БД
-- Версия: 1.2.0
-- Дата: 29 октября 2025
-- =============================================

-- ВНИМАНИЕ: Этот файл предназначен для выполнения в Supabase SQL Editor
-- Выполните весь скрипт целиком для создания полной схемы базы данных

-- =============================================
-- 1. ОСНОВНЫЕ ТАБЛИЦЫ
-- =============================================

-- Таблица профилей пользователей
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'applicant' CHECK (role IN ('applicant', 'recruiter', 'admin')),
    subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'basic', 'premium', 'enterprise')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица команд (для будущего использования)
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица резюме (основная)
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_url TEXT,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    parsed_data JSONB,
    experience_years INTEGER DEFAULT 0,
    last_position TEXT,
    last_company TEXT,
    education_level TEXT,
    salary_expectation NUMERIC,
    embedding VECTOR(1536),
    summary_embedding VECTOR(1536),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    quality_score NUMERIC DEFAULT 0,
    upload_token TEXT UNIQUE,
    consent_given BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Поля для отслеживания прогресса обработки
    file_hash TEXT,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    processing_error TEXT,
    processing_steps JSONB DEFAULT '[]'::jsonb,
    file_metadata JSONB DEFAULT '{}'::jsonb,
    content_type TEXT,
    
    -- Поля для совместимости
    skills TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    processing_log JSONB DEFAULT '[]'::jsonb,
    error_details TEXT
);

-- Таблица резюме-сводок (для быстрого поиска)
CREATE TABLE IF NOT EXISTS resume_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    quick_id TEXT UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    current_position TEXT,
    current_company TEXT,
    last_position TEXT,
    last_company TEXT,
    experience_years INTEGER DEFAULT 0,
    education_level TEXT,
    primary_skills TEXT[] DEFAULT '{}',
    secondary_skills TEXT[] DEFAULT '{}',
    skill_categories TEXT[] DEFAULT '{}',
    skill_levels JSONB DEFAULT '{}'::jsonb,
    skills TEXT[] DEFAULT '{}',
    market_value NUMERIC,
    rarity_score NUMERIC,
    demand_score NUMERIC,
    ai_summary TEXT,
    ai_insights JSONB DEFAULT '{}'::jsonb,
    confidence_score NUMERIC DEFAULT 0,
    summary TEXT,
    salary_expectation NUMERIC,
    quality_score NUMERIC DEFAULT 0,
    upload_token TEXT,
    consent_given BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    languages TEXT[] DEFAULT '{}'
);

-- Таблица поисковых запросов
CREATE TABLE IF NOT EXISTS searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    filters JSONB DEFAULT '{}'::jsonb,
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица результатов поиска
CREATE TABLE IF NOT EXISTS search_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_id UUID REFERENCES searches(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    relevance_score NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица избранных кандидатов
CREATE TABLE IF NOT EXISTS saved_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, resume_id)
);

-- Таблица платежей
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'RUB',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT,
    payment_id TEXT,
    subscription_type TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица аудита
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. ДОПОЛНИТЕЛЬНЫЕ ТАБЛИЦЫ ДЛЯ AI СИСТЕМЫ
-- =============================================

-- Таблица знаний о навыках
CREATE TABLE IF NOT EXISTS skills_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    subcategory TEXT,
    description TEXT,
    market_demand NUMERIC DEFAULT 0,
    average_salary NUMERIC,
    related_skills TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица логов обработки резюме
CREATE TABLE IF NOT EXISTS resume_processing_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    step_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
    processing_time_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица рыночной аналитики
CREATE TABLE IF NOT EXISTS market_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name TEXT NOT NULL,
    demand_trend NUMERIC,
    salary_trend NUMERIC,
    market_activity NUMERIC,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица данных для обучения AI
CREATE TABLE IF NOT EXISTS ai_learning_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type TEXT NOT NULL,
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    confidence_score NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица интеллекта поиска
CREATE TABLE IF NOT EXISTS search_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_pattern TEXT NOT NULL,
    successful_results JSONB DEFAULT '{}'::jsonb,
    user_feedback JSONB DEFAULT '{}'::jsonb,
    success_rate NUMERIC DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =============================================

-- Индексы для таблицы resumes
CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(status);
CREATE INDEX IF NOT EXISTS idx_resumes_processing_status ON resumes(processing_status);
CREATE INDEX IF NOT EXISTS idx_resumes_file_hash ON resumes(file_hash);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON resumes(created_at);
CREATE INDEX IF NOT EXISTS idx_resumes_email ON resumes(email);
CREATE INDEX IF NOT EXISTS idx_resumes_phone ON resumes(phone);
CREATE INDEX IF NOT EXISTS idx_resumes_full_name ON resumes(full_name);
CREATE INDEX IF NOT EXISTS idx_resumes_skills ON resumes USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_resumes_languages ON resumes USING GIN(languages);
CREATE INDEX IF NOT EXISTS idx_resumes_embedding ON resumes USING ivfflat (embedding vector_cosine_ops);

-- Индексы для таблицы resume_summaries
CREATE INDEX IF NOT EXISTS idx_resume_summaries_resume_id ON resume_summaries(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_quick_id ON resume_summaries(quick_id);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_full_name ON resume_summaries(full_name);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_email ON resume_summaries(email);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_phone ON resume_summaries(phone);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_skills ON resume_summaries USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_resume_summaries_languages ON resume_summaries USING GIN(languages);

-- Индексы для таблицы searches
CREATE INDEX IF NOT EXISTS idx_searches_user_id ON searches(user_id);
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at);

-- Индексы для таблицы search_results
CREATE INDEX IF NOT EXISTS idx_search_results_search_id ON search_results(search_id);
CREATE INDEX IF NOT EXISTS idx_search_results_resume_id ON search_results(resume_id);
CREATE INDEX IF NOT EXISTS idx_search_results_relevance ON search_results(relevance_score);

-- Индексы для таблицы saved_candidates
CREATE INDEX IF NOT EXISTS idx_saved_candidates_user_id ON saved_candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_candidates_resume_id ON saved_candidates(resume_id);

-- Индексы для таблицы payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Индексы для таблицы audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =============================================
-- 4. ФУНКЦИИ
-- =============================================

-- Функция обновления статуса обработки
CREATE OR REPLACE FUNCTION update_processing_status(
    p_resume_id UUID,
    p_status TEXT,
    p_step TEXT,
    p_error_details TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.resumes
    SET
        processing_status = p_status,
        processing_log = COALESCE(processing_log, '[]')::jsonb || jsonb_build_object(
            'timestamp', NOW(),
            'step', p_step,
            'status', p_status,
            'error', p_error_details
        ),
        error_details = p_error_details,
        processing_completed_at = CASE
            WHEN p_status = 'completed' OR p_status = 'failed' THEN NOW()
            ELSE processing_completed_at
        END,
        processing_started_at = CASE
            WHEN processing_status IS NULL AND p_status = 'processing' THEN NOW()
            ELSE processing_started_at
        END
    WHERE id = p_resume_id;
END;
$$;

-- Функция получения статистики обработки
CREATE OR REPLACE FUNCTION get_processing_stats()
RETURNS TABLE (
    total_files INTEGER,
    pending_files INTEGER,
    processing_files INTEGER,
    completed_files INTEGER,
    failed_files INTEGER,
    avg_processing_time NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_files,
        COUNT(*) FILTER (WHERE processing_status = 'pending')::INTEGER as pending_files,
        COUNT(*) FILTER (WHERE processing_status = 'processing')::INTEGER as processing_files,
        COUNT(*) FILTER (WHERE processing_status = 'completed')::INTEGER as completed_files,
        COUNT(*) FILTER (WHERE processing_status = 'failed')::INTEGER as failed_files,
        COALESCE(AVG(EXTRACT(EPOCH FROM (processing_completed_at - processing_started_at))), 0) as avg_processing_time
    FROM resumes;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. ПРЕДСТАВЛЕНИЯ
-- =============================================

-- Представление для мониторинга обработки файлов
CREATE OR REPLACE VIEW file_processing_monitor AS
SELECT 
    r.id,
    r.file_name,
    r.processing_status,
    r.processing_started_at,
    r.processing_completed_at,
    r.processing_error,
    r.file_size,
    r.mime_type,
    r.created_at,
    CASE 
        WHEN r.processing_completed_at IS NOT NULL AND r.processing_started_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (r.processing_completed_at - r.processing_started_at))
        ELSE NULL
    END as processing_time_seconds
FROM resumes r
ORDER BY r.created_at DESC;

-- =============================================
-- 6. RLS ПОЛИТИКИ БЕЗОПАСНОСТИ
-- =============================================

-- Включаем RLS для всех таблиц
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Политики для profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Политики для resumes
CREATE POLICY "Anyone can insert resumes" ON resumes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Recruiters can view all resumes" ON resumes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('recruiter', 'admin')
        )
    );

-- Политики для resume_summaries
CREATE POLICY "Anyone can insert resume summaries" ON resume_summaries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Recruiters can view all resume summaries" ON resume_summaries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('recruiter', 'admin')
        )
    );

-- Политики для searches
CREATE POLICY "Users can manage own searches" ON searches
    FOR ALL USING (auth.uid() = user_id);

-- Политики для search_results
CREATE POLICY "Users can view own search results" ON search_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM searches 
            WHERE id = search_results.search_id 
            AND user_id = auth.uid()
        )
    );

-- Политики для saved_candidates
CREATE POLICY "Users can manage own saved candidates" ON saved_candidates
    FOR ALL USING (auth.uid() = user_id);

-- Политики для payments
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- Политики для audit_logs
CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- =============================================
-- 7. ТРИГГЕРЫ
-- =============================================

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применяем триггер ко всем таблицам
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON resumes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resume_summaries_updated_at BEFORE UPDATE ON resume_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_searches_updated_at BEFORE UPDATE ON searches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 8. НАЧАЛЬНЫЕ ДАННЫЕ
-- =============================================

-- Вставляем базовые навыки
INSERT INTO skills_knowledge (skill_name, category, subcategory, description, market_demand) VALUES
('JavaScript', 'Programming', 'Frontend', 'JavaScript programming language', 0.9),
('TypeScript', 'Programming', 'Frontend', 'TypeScript programming language', 0.8),
('React', 'Framework', 'Frontend', 'React JavaScript framework', 0.9),
('Vue.js', 'Framework', 'Frontend', 'Vue.js JavaScript framework', 0.7),
('Angular', 'Framework', 'Frontend', 'Angular JavaScript framework', 0.6),
('Node.js', 'Runtime', 'Backend', 'Node.js JavaScript runtime', 0.8),
('Python', 'Programming', 'Backend', 'Python programming language', 0.9),
('Java', 'Programming', 'Backend', 'Java programming language', 0.8),
('C#', 'Programming', 'Backend', 'C# programming language', 0.7),
('Go', 'Programming', 'Backend', 'Go programming language', 0.6),
('PHP', 'Programming', 'Backend', 'PHP programming language', 0.6),
('Ruby', 'Programming', 'Backend', 'Ruby programming language', 0.5),
('SQL', 'Database', 'Backend', 'SQL database language', 0.9),
('PostgreSQL', 'Database', 'Backend', 'PostgreSQL database', 0.8),
('MySQL', 'Database', 'Backend', 'MySQL database', 0.7),
('MongoDB', 'Database', 'Backend', 'MongoDB NoSQL database', 0.6),
('Redis', 'Database', 'Backend', 'Redis in-memory database', 0.6),
('Docker', 'DevOps', 'Infrastructure', 'Docker containerization', 0.8),
('Kubernetes', 'DevOps', 'Infrastructure', 'Kubernetes orchestration', 0.7),
('AWS', 'Cloud', 'Infrastructure', 'Amazon Web Services', 0.8),
('Azure', 'Cloud', 'Infrastructure', 'Microsoft Azure', 0.6),
('GCP', 'Cloud', 'Infrastructure', 'Google Cloud Platform', 0.5),
('Git', 'Version Control', 'Tools', 'Git version control', 0.9),
('Linux', 'Operating System', 'System', 'Linux operating system', 0.7),
('Windows', 'Operating System', 'System', 'Windows operating system', 0.6),
('macOS', 'Operating System', 'System', 'macOS operating system', 0.5),
('HTML', 'Markup', 'Frontend', 'HTML markup language', 0.9),
('CSS', 'Styling', 'Frontend', 'CSS styling language', 0.9),
('SASS', 'Styling', 'Frontend', 'SASS CSS preprocessor', 0.6),
('LESS', 'Styling', 'Frontend', 'LESS CSS preprocessor', 0.4),
('Webpack', 'Build Tool', 'Frontend', 'Webpack module bundler', 0.6),
('Vite', 'Build Tool', 'Frontend', 'Vite build tool', 0.5),
('Babel', 'Build Tool', 'Frontend', 'Babel JavaScript compiler', 0.5),
('Jest', 'Testing', 'Frontend', 'Jest testing framework', 0.7),
('Cypress', 'Testing', 'Frontend', 'Cypress testing framework', 0.5),
('Selenium', 'Testing', 'Frontend', 'Selenium testing framework', 0.4),
('GraphQL', 'API', 'Backend', 'GraphQL query language', 0.6),
('REST', 'API', 'Backend', 'REST API design', 0.9),
('gRPC', 'API', 'Backend', 'gRPC API framework', 0.4),
('Microservices', 'Architecture', 'Backend', 'Microservices architecture', 0.7),
('Monolith', 'Architecture', 'Backend', 'Monolithic architecture', 0.5),
('Agile', 'Methodology', 'Management', 'Agile development methodology', 0.8),
('Scrum', 'Methodology', 'Management', 'Scrum development methodology', 0.7),
('Kanban', 'Methodology', 'Management', 'Kanban development methodology', 0.5),
('CI/CD', 'DevOps', 'Infrastructure', 'Continuous Integration/Deployment', 0.8),
('Jenkins', 'DevOps', 'Infrastructure', 'Jenkins CI/CD tool', 0.6),
('GitLab CI', 'DevOps', 'Infrastructure', 'GitLab CI/CD tool', 0.5),
('GitHub Actions', 'DevOps', 'Infrastructure', 'GitHub Actions CI/CD', 0.6),
('Terraform', 'DevOps', 'Infrastructure', 'Terraform infrastructure as code', 0.5),
('Ansible', 'DevOps', 'Infrastructure', 'Ansible automation tool', 0.4)
ON CONFLICT (skill_name) DO NOTHING;

-- =============================================
-- 9. КОММЕНТАРИИ К ТАБЛИЦАМ
-- =============================================

COMMENT ON TABLE profiles IS 'Профили пользователей системы';
COMMENT ON TABLE resumes IS 'Резюме соискателей с полной информацией';
COMMENT ON TABLE resume_summaries IS 'Краткие сводки резюме для быстрого поиска';
COMMENT ON TABLE searches IS 'Поисковые запросы рекрутеров';
COMMENT ON TABLE search_results IS 'Результаты поиска по резюме';
COMMENT ON TABLE saved_candidates IS 'Избранные кандидаты';
COMMENT ON TABLE payments IS 'Платежи и подписки';
COMMENT ON TABLE audit_logs IS 'Журнал аудита действий пользователей';
COMMENT ON TABLE skills_knowledge IS 'База знаний о навыках и их рыночной ценности';
COMMENT ON TABLE resume_processing_log IS 'Логи обработки резюме';
COMMENT ON TABLE market_insights IS 'Рыночная аналитика по навыкам';
COMMENT ON TABLE ai_learning_data IS 'Данные для обучения AI';
COMMENT ON TABLE search_intelligence IS 'Интеллект поиска и рекомендаций';

-- =============================================
-- ГОТОВО! СХЕМА БАЗЫ ДАННЫХ СОЗДАНА
-- =============================================

-- Проверка создания таблиц
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
