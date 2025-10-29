/**
 * Script to apply a single migration to Supabase
 * Run with: node scripts/apply-single-migration.js <migration-file>
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

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

async function applySingleMigration(migrationFile) {
  console.log(`🚀 Applying migration: ${migrationFile}`);
  
  try {
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`📄 Executing: ${statement.substring(0, 100)}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', {
            sql: statement
          });
          
          if (error) {
            console.error(`❌ Error executing statement:`, error.message);
            console.log(`Statement: ${statement}`);
          } else {
            console.log(`✅ Statement executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Error executing statement:`, err.message);
          console.log(`Statement: ${statement}`);
        }
      }
    }
    
    console.log('🎉 Migration completed!');
  } catch (err) {
    console.error(`❌ Error reading migration file:`, err.message);
  }
}

// Get migration file from command line arguments
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Please provide a migration file path');
  console.log('Usage: node scripts/apply-single-migration.js <migration-file>');
  process.exit(1);
}

if (!fs.existsSync(migrationFile)) {
  console.error(`❌ Migration file not found: ${migrationFile}`);
  process.exit(1);
}

applySingleMigration(migrationFile).catch(console.error);
