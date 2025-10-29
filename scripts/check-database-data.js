require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseData() {
  console.log('🔍 Checking database data...');
  
  try {
    // Check resumes table
    const { data: resumes, error: resumesError } = await supabase
      .from('resumes')
      .select('id, full_name, email, skills, quality_score, created_at')
      .limit(5);
    
    if (resumesError) {
      console.log('❌ Error fetching resumes:', resumesError.message);
    } else {
      console.log('📊 Resumes in database:', resumes.length);
      resumes.forEach((resume, index) => {
        console.log(`  ${index + 1}. ${resume.full_name} (${resume.email}) - Quality: ${resume.quality_score}`);
        console.log(`     Skills: ${resume.skills ? resume.skills.join(', ') : 'None'}`);
        console.log(`     Created: ${resume.created_at}`);
      });
    }
    
    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, subscription_type')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ Error fetching profiles:', profilesError.message);
    } else {
      console.log('👥 Profiles in database:', profiles.length);
      profiles.forEach((profile, index) => {
        console.log(`  ${index + 1}. ${profile.full_name} (${profile.email}) - ${profile.subscription_type}`);
      });
    }
    
  } catch (err) {
    console.error(`❌ Error checking database: ${err.message}`);
  }
}

checkDatabaseData().catch(console.error);
