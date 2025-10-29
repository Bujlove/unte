const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function analyzeParsedData() {
  try {
    console.log('🔍 Анализируем структуру parsed_data...')
    
    const { data: resumes, error } = await supabase
      .from('resumes')
      .select('id, full_name, parsed_data, skills, languages, experience_years, last_position, last_company')
      .limit(3)

    if (error) {
      console.error('❌ Ошибка:', error)
      return
    }

    resumes.forEach((resume, index) => {
      console.log(`\n📄 Резюме ${index + 1}:`)
      console.log('ID:', resume.id)
      console.log('Full Name:', resume.full_name)
      console.log('Skills:', resume.skills)
      console.log('Languages:', resume.languages)
      console.log('Experience Years:', resume.experience_years)
      console.log('Last Position:', resume.last_position)
      console.log('Last Company:', resume.last_company)
      
      if (resume.parsed_data) {
        console.log('Parsed Data Structure:')
        console.log(JSON.stringify(resume.parsed_data, null, 2))
      }
    })

    // Проверим структуру resume_summaries
    const { data: summaries, error: summariesError } = await supabase
      .from('resume_summaries')
      .select('*')
      .limit(1)

    if (summariesError) {
      console.log('\n❌ Ошибка при получении resume_summaries:', summariesError.message)
    } else if (summaries && summaries.length > 0) {
      console.log('\n📊 Структура resume_summaries:')
      console.log(JSON.stringify(summaries[0], null, 2))
    } else {
      console.log('\n📊 Таблица resume_summaries пуста')
    }

  } catch (error) {
    console.error('❌ Ошибка анализа:', error)
  }
}

analyzeParsedData()
