const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStructureSimple() {
  try {
    console.log('🔍 Проверяем структуру через простые запросы...')
    
    // Попробуем получить данные из resume_summaries
    const { data: summaries, error: summariesError } = await supabase
      .from('resume_summaries')
      .select('*')
      .limit(1)

    if (summariesError) {
      console.log('❌ Ошибка при получении данных из resume_summaries:', summariesError.message)
      
      // Попробуем создать таблицу
      console.log('🔧 Пытаемся создать таблицу resume_summaries...')
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS resume_summaries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
            full_name TEXT,
            email TEXT,
            phone TEXT,
            location TEXT,
            current_position TEXT,
            current_company TEXT,
            experience_years INTEGER DEFAULT 0,
            education_level TEXT,
            skills TEXT[] DEFAULT '{}',
            languages TEXT[] DEFAULT '{}',
            summary TEXT,
            quality_score NUMERIC DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      })
      
      if (createError) {
        console.log('❌ Ошибка создания таблицы:', createError.message)
      } else {
        console.log('✅ Таблица resume_summaries создана')
      }
    } else {
      console.log('✅ Таблица resume_summaries существует')
      if (summaries && summaries.length > 0) {
        console.log('📊 Пример данных:')
        console.log(JSON.stringify(summaries[0], null, 2))
      }
    }

    // Проверим таблицу resumes
    const { data: resumes, error: resumesError } = await supabase
      .from('resumes')
      .select('id, full_name, parsed_data, skills, languages')
      .limit(1)

    if (resumesError) {
      console.log('❌ Ошибка при получении данных из resumes:', resumesError.message)
    } else {
      console.log('✅ Таблица resumes существует')
      if (resumes && resumes.length > 0) {
        console.log('📊 Пример данных из resumes:')
        const resume = resumes[0]
        console.log('ID:', resume.id)
        console.log('Full Name:', resume.full_name)
        console.log('Skills:', resume.skills)
        console.log('Languages:', resume.languages)
        console.log('Parsed Data Keys:', resume.parsed_data ? Object.keys(resume.parsed_data) : 'null')
      }
    }

  } catch (error) {
    console.error('❌ Общая ошибка:', error)
  }
}

checkStructureSimple()
