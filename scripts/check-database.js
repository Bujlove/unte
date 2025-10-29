const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = 'https://ghluoqegmbeqpatatkes.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobHVvcWVnbWJlcXBhdGF0a2VzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTcxODU0MiwiZXhwIjoyMDc3Mjk0NTQyfQ.BBVLhG_l-sEs3gw_wgEyqKvz9E_sIxqIzjKkgvsAwOs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  try {
    console.log('🔍 Checking database structure...')
    
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['resumes', 'resume_summaries'])

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError)
      return
    }

    console.log('📋 Tables found:', tables)

    // Check column types for resume_summaries
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'resume_summaries')
      .in('column_name', ['languages', 'skills'])

    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError)
      return
    }

    console.log('🔧 Column types:', columns)

    // Test simple insert to see what error we get
    console.log('🧪 Testing insert...')
    const testData = {
      full_name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      current_position: 'Test Position',
      experience_years: 5,
      skills: ['JavaScript', 'TypeScript'],
      languages: ['English', 'Russian'],
      summary: 'Test summary'
    }

    const { data: insertData, error: insertError } = await supabase
      .from('resume_summaries')
      .insert(testData)
      .select()

    if (insertError) {
      console.error('❌ Insert error:', insertError)
    } else {
      console.log('✅ Insert successful:', insertData)
    }

  } catch (error) {
    console.error('❌ Database check failed:', error)
  }
}

checkDatabase()
