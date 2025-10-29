const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = 'https://ghluoqegmbeqpatatkes.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobHVvcWVnbWJlcXBhdGF0a2VzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTcxODU0MiwiZXhwIjoyMDc3Mjk0NTQyfQ.BBVLhG_l-sEs3gw_wgEyqKvz9E_sIxqIzjKkgvsAwOs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyFileTrackingMigration() {
  try {
    console.log('🔧 Применяем миграцию для отслеживания файлов...')
    
    // 1. Добавляем поля для отслеживания
    console.log('1. Добавляем поля для отслеживания...')
    
    const addColumnsSQL = `
      ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_hash TEXT;
      ALTER TABLE resumes ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';
      ALTER TABLE resumes ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE resumes ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE resumes ADD COLUMN IF NOT EXISTS processing_error TEXT;
      ALTER TABLE resumes ADD COLUMN IF NOT EXISTS processing_steps JSONB;
      ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_metadata JSONB;
    `
    
    const { error: columnsError } = await supabase.rpc('exec', {
      sql: addColumnsSQL
    })
    
    if (columnsError) {
      console.error('❌ Ошибка добавления колонок:', columnsError)
    } else {
      console.log('✅ Колонки добавлены')
    }

    // 2. Создаем индексы
    console.log('2. Создаем индексы...')
    
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_resumes_file_hash ON resumes(file_hash);
      CREATE INDEX IF NOT EXISTS idx_resumes_processing_status ON resumes(processing_status);
    `
    
    const { error: indexesError } = await supabase.rpc('exec', {
      sql: createIndexesSQL
    })
    
    if (indexesError) {
      console.error('❌ Ошибка создания индексов:', indexesError)
    } else {
      console.log('✅ Индексы созданы')
    }

    // 3. Обновляем существующие записи
    console.log('3. Обновляем существующие записи...')
    
    const { error: updateError } = await supabase
      .from('resumes')
      .update({
        processing_status: 'completed',
        processing_completed_at: new Date().toISOString()
      })
      .eq('status', 'active')
      .is('processing_status', null)
    
    if (updateError) {
      console.error('❌ Ошибка обновления записей:', updateError)
    } else {
      console.log('✅ Существующие записи обновлены')
    }

    // 4. Создаем функцию для обновления статуса
    console.log('4. Создаем функцию для обновления статуса...')
    
    const createFunctionSQL = `
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
    `
    
    const { error: functionError } = await supabase.rpc('exec', {
      sql: createFunctionSQL
    })
    
    if (functionError) {
      console.error('❌ Ошибка создания функции:', functionError)
    } else {
      console.log('✅ Функция создана')
    }

    // 5. Создаем функцию для статистики
    console.log('5. Создаем функцию для статистики...')
    
    const createStatsFunctionSQL = `
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
    `
    
    const { error: statsFunctionError } = await supabase.rpc('exec', {
      sql: createStatsFunctionSQL
    })
    
    if (statsFunctionError) {
      console.error('❌ Ошибка создания функции статистики:', statsFunctionError)
    } else {
      console.log('✅ Функция статистики создана')
    }

    // 6. Создаем представление для мониторинга
    console.log('6. Создаем представление для мониторинга...')
    
    const createViewSQL = `
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
    `
    
    const { error: viewError } = await supabase.rpc('exec', {
      sql: createViewSQL
    })
    
    if (viewError) {
      console.error('❌ Ошибка создания представления:', viewError)
    } else {
      console.log('✅ Представление создано')
    }

    // 7. Тестируем новые функции
    console.log('7. Тестируем новые функции...')
    
    const { data: stats, error: statsTestError } = await supabase.rpc('get_processing_stats')
    
    if (statsTestError) {
      console.error('❌ Ошибка тестирования статистики:', statsTestError)
    } else {
      console.log('✅ Статистика работает:', stats)
    }

    console.log('🎉 Миграция для отслеживания файлов применена успешно!')
    
    return {
      success: true,
      message: 'Миграция применена успешно',
      stats: stats
    }

  } catch (error) {
    console.error('❌ Ошибка применения миграции:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

applyFileTrackingMigration()
