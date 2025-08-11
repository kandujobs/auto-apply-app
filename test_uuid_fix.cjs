const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xipjxcktpzanmhfrkbrm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTgwNDMsImV4cCI6MjA2NjY5NDA0M30.i7rLdAIQ4hc9r95MeDlCyORELOEg4jDbKDMTooYsnzo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUUIDFix() {
  try {
    console.log('🧪 Testing UUID query fix...');
    
    // Test user ID
    const testUserId = 'd02765f1-e13e-46d9-b5cb-6dcf099bf8cc';
    
    // First, get some viewed job IDs
    const { data: viewedJobs, error: viewedError } = await supabase
      .from('job_swipes')
      .select('job_id')
      .eq('user_id', testUserId)
      .limit(3);
    
    if (viewedError) {
      console.log('❌ Error getting viewed jobs:', viewedError.message);
      return;
    }
    
    console.log('✅ Successfully got viewed jobs:', viewedJobs?.length || 0);
    
    if (viewedJobs && viewedJobs.length > 0) {
      const viewedJobIds = viewedJobs.map(job => job.job_id);
      console.log('📋 Viewed job IDs:', viewedJobIds);
      
      // Test the new query method
      const { data: jobs, error: jobsError } = await supabase
        .from('linkedin_fetched_jobs')
        .select('*')
        .eq('user_id', testUserId)
        .eq('is_active', true)
        .not('id', 'in', viewedJobIds)
        .limit(5);
      
      if (jobsError) {
        console.log('❌ Error with new query method:', jobsError.message);
      } else {
        console.log('✅ New query method works! Found', jobs?.length || 0, 'jobs');
      }
    } else {
      console.log('ℹ️ No viewed jobs found, testing basic query...');
      
      const { data: jobs, error: jobsError } = await supabase
        .from('linkedin_fetched_jobs')
        .select('*')
        .eq('user_id', testUserId)
        .eq('is_active', true)
        .limit(5);
      
      if (jobsError) {
        console.log('❌ Error with basic query:', jobsError.message);
      } else {
        console.log('✅ Basic query works! Found', jobs?.length || 0, 'jobs');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUUIDFix(); 