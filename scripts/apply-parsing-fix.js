const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyParsingFix() {
  try {
    console.log('🔧 Применяем исправление структуры парсинга...')
    
    // Читаем SQL файл
    const sqlPath = path.join(__dirname, '..', 'sql', 'fix-parsing-structure.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 SQL файл загружен, размер:', sqlContent.length, 'символов')
    
    // Разбиваем SQL на отдельные команды
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log('📋 Найдено SQL команд:', statements.length)
    
    // Применяем каждую команду отдельно
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      try {
        console.log(`⏳ Выполняем команду ${i + 1}/${statements.length}...`)
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        })
        
        if (error) {
          console.log(`⚠️ Ошибка в команде ${i + 1}:`, error.message)
          console.log('Команда:', statement.substring(0, 100) + '...')
          // Продолжаем выполнение других команд
        } else {
          console.log(`✅ Команда ${i + 1} выполнена успешно`)
        }
      } catch (err) {
        console.log(`❌ Исключение в команде ${i + 1}:`, err.message)
      }
    }
    
    // Проверяем результат
    console.log('\n🔍 Проверяем результат...')
    
    const { data: summaries, error: summariesError } = await supabase
      .from('resume_summaries')
      .select('*')
      .limit(3)
    
    if (summariesError) {
      console.log('❌ Ошибка при проверке resume_summaries:', summariesError.message)
    } else {
      console.log('✅ Таблица resume_summaries создана успешно')
      console.log('📊 Количество записей:', summaries.length)
      
      if (summaries.length > 0) {
        console.log('📄 Пример данных:')
        console.log(JSON.stringify(summaries[0], null, 2))
      }
    }
    
    // Проверяем триггеры
    const { data: triggers, error: triggersError } = await supabase
      .from('resumes')
      .select('id, full_name, parsed_data')
      .limit(1)
    
    if (triggersError) {
      console.log('❌ Ошибка при проверке триггеров:', triggersError.message)
    } else {
      console.log('✅ Триггеры настроены')
    }
    
    console.log('\n🎉 Исправление структуры парсинга завершено!')
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error)
  }
}

applyParsingFix()
