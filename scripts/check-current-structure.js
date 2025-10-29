const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCurrentStructure() {
  try {
    console.log('🔍 Проверяем текущую структуру таблиц...')
    
    // Проверить структуру resume_summaries
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'resume_summaries')
      .order('ordinal_position')

    if (columnsError) {
      console.error('❌ Ошибка при проверке колонок:', columnsError)
      return
    }

    console.log('📋 Структура таблицы resume_summaries:')
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
    })

    // Проверить существующие данные
    const { data: existingData, error: dataError } = await supabase
      .from('resume_summaries')
      .select('*')
      .limit(1)

    if (dataError) {
      console.log('⚠️ Ошибка при получении данных:', dataError.message)
    } else if (existingData && existingData.length > 0) {
      console.log('📊 Пример существующих данных:')
      console.log(JSON.stringify(existingData[0], null, 2))
    } else {
      console.log('📊 Таблица пуста')
    }

    // Проверить структуру resumes
    const { data: resumeColumns, error: resumeColumnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'resumes')
      .in('column_name', ['parsed_data', 'skills', 'languages'])
      .order('ordinal_position')

    if (resumeColumnsError) {
      console.error('❌ Ошибка при проверке колонок resumes:', resumeColumnsError)
    } else {
      console.log('📋 Ключевые колонки таблицы resumes:')
      resumeColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`)
      })
    }

  } catch (error) {
    console.error('❌ Ошибка проверки структуры:', error)
  }
}

checkCurrentStructure()
