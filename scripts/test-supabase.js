/**
 * Script to test Supabase connection
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key (first 20 chars):', supabaseServiceKey?.substring(0, 20) + '...');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    console.log('🧪 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('resumes')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Connection successful!');
    console.log('📊 Sample data:', data);
    
    // Test table structure
    console.log('🔍 Testing table structure...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('resumes')
      .select('*')
      .limit(0);
    
    if (tableError) {
      console.error('❌ Table structure error:', tableError.message);
    } else {
      console.log('✅ Table structure OK');
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testConnection();
