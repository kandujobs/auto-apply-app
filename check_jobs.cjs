const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xipjxcktpzanmhfrkbrm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTgwNDMsImV4cCI6MjA2NjY5NDA0M30.i7rLdAIQ4hc9r95MeDlCyORELOEg4jDbKDMTooYsnzo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobs() {
  try {
    console.log('🔍 Checking all jobs in database...');
    
    // Check all jobs regardless of user
    const { data: allJobs, error } = await supabase
      .from('linkedin_fetched_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.log('❌ Error fetching all jobs:', error.message);
      return;
    }
    
    console.log(`📊 Total jobs in database: ${allJobs?.length || 0}`);
    
    if (allJobs && allJobs.length > 0) {
      console.log('📋 Recent jobs:');
      allJobs.slice(0, 3).forEach((job, index) => {
        console.log(`  ${index + 1}. ${job.job_title} at ${job.company_name}`);
        console.log(`     User: ${job.user_id}`);
        console.log(`     Created: ${job.created_at}`);
        console.log(`     Active: ${job.is_active}`);
        console.log('');
      });
    }
    
    // Check specific user
    const testUserId = 'd02765f1-e13e-46d9-b5cb-6dcf099bf8cc';
    const { data: userJobs, error: userError } = await supabase
      .from('linkedin_fetched_jobs')
      .select('*')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false });
    
    if (userError) {
      console.log('❌ Error fetching user jobs:', userError.message);
    } else {
      console.log(`📊 Jobs for user ${testUserId}: ${userJobs?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkJobs(); 