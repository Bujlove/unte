import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['resumes', 'resume_summaries'])

    if (tablesError) {
      return Response.json({ error: 'Failed to check tables', details: tablesError }, { status: 500 })
    }

    // Check column types
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'resume_summaries')
      .in('column_name', ['languages', 'skills'])

    if (columnsError) {
      return Response.json({ error: 'Failed to check columns', details: columnsError }, { status: 500 })
    }

    // Test simple insert
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
      return Response.json({ 
        error: 'Failed to insert test data', 
        details: insertError,
        tables: tables,
        columns: columns
      }, { status: 500 })
    }

    return Response.json({ 
      success: true,
      message: 'Database test successful',
      tables: tables,
      columns: columns,
      insertResult: insertData
    })

  } catch (error) {
    return Response.json({ 
      error: 'Database test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
