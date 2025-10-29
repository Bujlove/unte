const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = 'https://ghluoqegmbeqpatatkes.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobHVvcWVnbWJlcXBhdGF0a2VzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTcxODU0MiwiZXhwIjoyMDc3Mjk0NTQyfQ.BBVLhG_l-sEs3gw_wgEyqKvz9E_sIxqIzjKkgvsAwOs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function executeSQL() {
  try {
    console.log('🔧 Executing SQL to fix database...')
    
    // First, let's disable triggers
    console.log('1. Disabling triggers...')
    const { error: triggerError } = await supabase.rpc('exec', {
      sql: `
        DROP TRIGGER IF EXISTS trg_create_resume_summary ON resumes;
        DROP TRIGGER IF EXISTS trg_update_resume_summary ON resumes;
        DROP FUNCTION IF EXISTS create_resume_summary() CASCADE;
        DROP FUNCTION IF EXISTS update_resume_summary() CASCADE;
      `
    })
    
    if (triggerError) {
      console.error('❌ Error disabling triggers:', triggerError)
    } else {
      console.log('✅ Triggers disabled')
    }

    // Check current column types
    console.log('2. Checking column types...')
    const { data: columns, error: columnsError } = await supabase.rpc('exec', {
      sql: `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'resume_summaries' 
        AND column_name IN ('languages', 'skills');
      `
    })
    
    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError)
    } else {
      console.log('📋 Current columns:', columns)
    }

    // Fix languages column
    console.log('3. Fixing languages column...')
    const { error: languagesError } = await supabase.rpc('exec', {
      sql: `
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'resume_summaries' 
            AND column_name = 'languages' 
            AND data_type = 'ARRAY'
          ) THEN
            RAISE NOTICE 'Languages column is already TEXT[], skipping conversion';
          ELSE
            ALTER TABLE resume_summaries ADD COLUMN IF NOT EXISTS languages_temp TEXT[];
            
            UPDATE resume_summaries 
            SET languages_temp = CASE 
              WHEN languages IS NULL THEN NULL
              WHEN jsonb_typeof(languages) = 'array' THEN 
                ARRAY(SELECT jsonb_array_elements_text(languages))
              ELSE ARRAY[]::TEXT[]
            END;
            
            ALTER TABLE resume_summaries DROP COLUMN IF EXISTS languages;
            ALTER TABLE resume_summaries RENAME COLUMN languages_temp TO languages;
            
            RAISE NOTICE 'Languages column converted from JSONB to TEXT[]';
          END IF;
        END $$;
      `
    })
    
    if (languagesError) {
      console.error('❌ Error fixing languages column:', languagesError)
    } else {
      console.log('✅ Languages column fixed')
    }

    // Fix skills column
    console.log('4. Fixing skills column...')
    const { error: skillsError } = await supabase.rpc('exec', {
      sql: `
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'resume_summaries' 
            AND column_name = 'skills' 
            AND data_type = 'ARRAY'
          ) THEN
            RAISE NOTICE 'Skills column is already TEXT[], skipping conversion';
          ELSE
            ALTER TABLE resume_summaries ADD COLUMN IF NOT EXISTS skills_temp TEXT[];
            
            UPDATE resume_summaries 
            SET skills_temp = CASE 
              WHEN skills IS NULL THEN NULL
              WHEN jsonb_typeof(skills) = 'array' THEN 
                ARRAY(SELECT jsonb_array_elements_text(skills))
              ELSE ARRAY[]::TEXT[]
            END;
            
            ALTER TABLE resume_summaries DROP COLUMN IF EXISTS skills;
            ALTER TABLE resume_summaries RENAME COLUMN skills_temp TO skills;
            
            RAISE NOTICE 'Skills column converted from JSONB to TEXT[]';
          END IF;
        END $$;
      `
    })
    
    if (skillsError) {
      console.error('❌ Error fixing skills column:', skillsError)
    } else {
      console.log('✅ Skills column fixed')
    }

    // Test insert
    console.log('5. Testing insert...')
    const { data: insertData, error: insertError } = await supabase
      .from('resume_summaries')
      .insert({
        full_name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        current_position: 'Test Position',
        experience_years: 5,
        skills: ['JavaScript', 'TypeScript'],
        languages: ['English', 'Russian'],
        summary: 'Test summary'
      })
      .select()

    if (insertError) {
      console.error('❌ Insert test failed:', insertError)
    } else {
      console.log('✅ Insert test successful:', insertData)
    }

  } catch (error) {
    console.error('❌ SQL execution failed:', error)
  }
}

executeSQL()
