-- Улучшение отслеживания файлов в базе данных
-- Добавляем поля для полной прослеживаемости между бакетом и БД

-- Добавляем поля в таблицу resumes для лучшего отслеживания
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_hash TEXT;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS processing_error TEXT;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS processing_steps JSONB;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_metadata JSONB;

-- Создаем индекс для быстрого поиска по хешу файла
CREATE INDEX IF NOT EXISTS idx_resumes_file_hash ON resumes(file_hash);

-- Создаем индекс для поиска по статусу обработки
CREATE INDEX IF NOT EXISTS idx_resumes_processing_status ON resumes(processing_status);

-- Обновляем существующие записи
UPDATE resumes 
SET processing_status = 'completed',
    processing_completed_at = updated_at
WHERE status = 'active' AND processing_status IS NULL;

-- Создаем функцию для обновления статуса обработки
CREATE OR REPLACE FUNCTION update_processing_status(
    resume_id UUID,
    status TEXT,
    step_name TEXT DEFAULT NULL,
    error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE resumes 
    SET 
        processing_status = status,
        processing_started_at = CASE 
            WHEN status = 'processing' AND processing_started_at IS NULL 
            THEN NOW() 
            ELSE processing_started_at 
        END,
        processing_completed_at = CASE 
            WHEN status IN ('completed', 'failed') 
            THEN NOW() 
            ELSE processing_completed_at 
        END,
        processing_error = CASE 
            WHEN status = 'failed' 
            THEN error_message 
            ELSE processing_error 
        END,
        processing_steps = CASE 
            WHEN step_name IS NOT NULL 
            THEN COALESCE(processing_steps, '[]'::jsonb) || jsonb_build_object(
                'step', step_name,
                'timestamp', NOW(),
                'status', status
            )
            ELSE processing_steps 
        END,
        updated_at = NOW()
    WHERE id = resume_id;
END;
$$ LANGUAGE plpgsql;

-- Создаем функцию для получения статистики обработки
CREATE OR REPLACE FUNCTION get_processing_stats()
RETURNS TABLE(
    total_files BIGINT,
    pending_files BIGINT,
    processing_files BIGINT,
    completed_files BIGINT,
    failed_files BIGINT,
    avg_processing_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_files,
        COUNT(*) FILTER (WHERE processing_status = 'pending') as pending_files,
        COUNT(*) FILTER (WHERE processing_status = 'processing') as processing_files,
        COUNT(*) FILTER (WHERE processing_status = 'completed') as completed_files,
        COUNT(*) FILTER (WHERE processing_status = 'failed') as failed_files,
        AVG(processing_completed_at - processing_started_at) as avg_processing_time
    FROM resumes
    WHERE processing_started_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Создаем представление для мониторинга файлов
CREATE OR REPLACE VIEW file_processing_monitor AS
SELECT 
    r.id,
    r.file_name,
    r.file_size,
    r.mime_type,
    r.processing_status,
    r.processing_started_at,
    r.processing_completed_at,
    r.processing_error,
    r.file_hash,
    r.file_url,
    r.created_at,
    r.updated_at,
    CASE 
        WHEN r.processing_completed_at IS NOT NULL AND r.processing_started_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (r.processing_completed_at - r.processing_started_at))
        ELSE NULL
    END as processing_duration_seconds,
    rs.full_name,
    rs.current_position,
    rs.experience_years
FROM resumes r
LEFT JOIN resume_summaries rs ON r.id = rs.resume_id
ORDER BY r.created_at DESC;
