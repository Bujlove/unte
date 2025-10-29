const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigrations() {
  try {
    console.log('Applying database migrations...');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '000_smart_parsing_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration SQL...');
    
    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('Migration error:', error);
      
      // Try executing directly
      console.log('Trying direct SQL execution...');
      const { error: directError } = await supabase
        .from('_migrations')
        .select('*')
        .limit(1);
      
      if (directError) {
        console.log('Direct execution failed, trying individual statements...');
        
        // Split SQL into individual statements
        const statements = migrationSQL
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
          try {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            const { error: stmtError } = await supabase.rpc('exec_sql', {
              sql: statement
            });
            
            if (stmtError) {
              console.log(`Statement failed: ${stmtError.message}`);
            } else {
              console.log('Statement executed successfully');
            }
          } catch (err) {
            console.log(`Statement error: ${err.message}`);
          }
        }
      }
    } else {
      console.log('Migration executed successfully');
    }

    // Verify tables exist
    console.log('Verifying tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.error('Error checking tables:', tablesError);
    } else {
      console.log('Available tables:', tables?.map(t => t.table_name));
    }

  } catch (error) {
    console.error('Error applying migrations:', error);
  }
}

applyMigrations();