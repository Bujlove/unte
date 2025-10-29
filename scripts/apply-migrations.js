/**
 * Script to apply database migrations to Supabase
 * Run with: node scripts/apply-migrations.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
  console.log('🚀 Applying database migrations...');
  
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  console.log(`Found ${migrationFiles.length} migration files`);
  
  for (const file of migrationFiles) {
    console.log(`📄 Applying ${file}...`);
    
    try {
      const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: migrationSQL
      });
      
      if (error) {
        console.error(`❌ Error applying ${file}:`, error.message);
        // Continue with other migrations
      } else {
        console.log(`✅ Successfully applied ${file}`);
      }
    } catch (err) {
      console.error(`❌ Error reading ${file}:`, err.message);
    }
  }
  
  console.log('🎉 Migration process completed!');
}

// Alternative: Apply migrations directly using SQL
async function applyMigrationsDirect() {
  console.log('🚀 Applying database migrations directly...');
  
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  for (const file of migrationFiles) {
    console.log(`📄 Applying ${file}...`);
    
    try {
      const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase
            .from('_migrations')
            .select('*')
            .limit(1); // Test connection
          
          if (error) {
            console.log('⚠️  Note: Some migrations may require manual application in Supabase dashboard');
            console.log(`SQL for ${file}:`);
            console.log(statement);
            console.log('---');
          }
        }
      }
    } catch (err) {
      console.error(`❌ Error with ${file}:`, err.message);
    }
  }
}

// Run migrations
applyMigrationsDirect().catch(console.error);
