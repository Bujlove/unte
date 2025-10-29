-- Исправление функции update_processing_status
-- Убираем неоднозначность в ссылке на колонку status

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
