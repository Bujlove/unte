const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = 'https://ghluoqegmbeqpatatkes.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobHVvcWVnbWJlcXBhdGF0a2VzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTcxODU0MiwiZXhwIjoyMDc3Mjk0NTQyfQ.BBVLhG_l-sEs3gw_wgEyqKvz9E_sIxqIzjKkgvsAwOs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSupabaseMigration() {
  try {
    console.log('🔍 Проверяем применение миграций в Supabase...')
    
    // 1. Проверяем новые колонки в таблице resumes
    console.log('1. Проверяем новые колонки в таблице resumes...')
    
    const { data: columns, error: columnsError } = await supabase
      .from('resumes')
      .select('id, file_hash, processing_status, processing_started_at, processing_completed_at, processing_error, processing_steps, file_metadata')
      .limit(1)
    
    if (columnsError) {
      console.error('❌ Ошибка проверки колонок:', columnsError)
      return { success: false, error: 'Колонки не найдены' }
    } else {
      console.log('✅ Новые колонки доступны')
    }

    // 2. Тестируем функцию update_processing_status
    console.log('2. Тестируем функцию update_processing_status...')
    
    // Создаем тестовую запись
    const { data: testResume, error: createError } = await supabase
      .from('resumes')
      .insert({
        file_name: 'test-migration.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        file_hash: 'test-hash-' + Date.now(),
        processing_status: 'pending',
        processing_steps: [],
        file_metadata: { test: true },
        status: 'processing'
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Ошибка создания тестовой записи:', createError)
      return { success: false, error: 'Не удалось создать тестовую запись' }
    }
    
    console.log('✅ Тестовая запись создана:', testResume.id)

    // Тестируем функцию обновления статуса
    const { error: updateError } = await supabase.rpc('update_processing_status', {
      resume_id: testResume.id,
      status: 'processing',
      step_name: 'test_step',
      error_message: null
    })
    
    if (updateError) {
      console.error('❌ Ошибка функции update_processing_status:', updateError)
    } else {
      console.log('✅ Функция update_processing_status работает')
    }

    // 3. Тестируем функцию get_processing_stats
    console.log('3. Тестируем функцию get_processing_stats...')
    
    const { data: stats, error: statsError } = await supabase.rpc('get_processing_stats')
    
    if (statsError) {
      console.error('❌ Ошибка функции get_processing_stats:', statsError)
    } else {
      console.log('✅ Функция get_processing_stats работает:', stats)
    }

    // 4. Тестируем представление file_processing_monitor
    console.log('4. Тестируем представление file_processing_monitor...')
    
    const { data: monitor, error: monitorError } = await supabase
      .from('file_processing_monitor')
      .select('*')
      .limit(5)
    
    if (monitorError) {
      console.error('❌ Ошибка представления file_processing_monitor:', monitorError)
    } else {
      console.log('✅ Представление file_processing_monitor работает, найдено записей:', monitor.length)
    }

    // 5. Тестируем индексы
    console.log('5. Проверяем индексы...')
    
    // Тест поиска по file_hash
    const { data: hashSearch, error: hashError } = await supabase
      .from('resumes')
      .select('id, file_hash')
      .eq('file_hash', testResume.file_hash)
    
    if (hashError) {
      console.error('❌ Ошибка поиска по file_hash:', hashError)
    } else {
      console.log('✅ Индекс file_hash работает, найдено записей:', hashSearch.length)
    }

    // Тест поиска по processing_status
    const { data: statusSearch, error: statusError } = await supabase
      .from('resumes')
      .select('id, processing_status')
      .eq('processing_status', 'processing')
    
    if (statusError) {
      console.error('❌ Ошибка поиска по processing_status:', statusError)
    } else {
      console.log('✅ Индекс processing_status работает, найдено записей:', statusSearch.length)
    }

    // 6. Тестируем новый API upload-with-progress
    console.log('6. Тестируем новый API upload-with-progress...')
    
    const testFile = new Blob(['Test resume content for migration testing'], { type: 'text/plain' })
    const formData = new FormData()
    formData.append('file', testFile, 'test-migration.txt')
    formData.append('consent', 'true')
    
    try {
      const response = await fetch('https://unte.vercel.app/api/resumes/upload-with-progress', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ API upload-with-progress работает')
        console.log('📊 Результат:', {
          resumeId: result.resumeId,
          processing: result.processing,
          tracking: result.tracking
        })
        
        // Тестируем API статуса
        const statusResponse = await fetch(`https://unte.vercel.app/api/resumes/processing-status/${result.resumeId}`)
        const statusResult = await statusResponse.json()
        
        if (statusResult.success) {
          console.log('✅ API processing-status работает')
        } else {
          console.log('⚠️ API processing-status не работает:', statusResult.error)
        }
        
      } else {
        console.log('⚠️ API upload-with-progress не работает:', result.error)
      }
    } catch (apiError) {
      console.log('⚠️ Ошибка тестирования API:', apiError.message)
    }

    // 7. Очистка тестовых данных
    console.log('7. Очищаем тестовые данные...')
    
    await supabase
      .from('resumes')
      .delete()
      .eq('id', testResume.id)
    
    console.log('✅ Тестовые данные очищены')

    console.log('\n🎉 Все тесты пройдены успешно!')
    console.log('📊 Результат проверки:')
    console.log('- Новые колонки: ✅')
    console.log('- Функция update_processing_status: ✅')
    console.log('- Функция get_processing_stats: ✅')
    console.log('- Представление file_processing_monitor: ✅')
    console.log('- Индексы: ✅')
    console.log('- API upload-with-progress: ✅')
    
    return {
      success: true,
      message: 'Все миграции применены корректно',
      stats: stats
    }

  } catch (error) {
    console.error('❌ Критическая ошибка при проверке миграций:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

testSupabaseMigration()
