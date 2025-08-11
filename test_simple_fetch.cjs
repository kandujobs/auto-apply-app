const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xipjxcktpzanmhfrkbrm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTgwNDMsImV4cCI6MjA2NjY5NDA0M30.i7rLdAIQ4hc9r95MeDlCyORELOEg4jDbKDMTooYsnzo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleFetch() {
  try {
    console.log('🧪 Testing simple job fetch...');
    
    // Test user ID
    const testUserId = 'd02765f1-e13e-46d9-b5cb-6dcf099bf8cc';
    
    // Simple query - just get all jobs for the user
    const { data: jobs, error } = await supabase
      .from('linkedin_fetched_jobs')
      .select('*')
      .eq('user_id', testUserId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log('❌ Error fetching jobs:', error.message);
      console.log('Error details:', error);
    } else {
      console.log('✅ Successfully fetched jobs!');
      console.log(`📊 Found ${jobs?.length || 0} jobs`);
      
      if (jobs && jobs.length > 0) {
        console.log('📋 Sample job:');
        const sampleJob = jobs[0];
        console.log(`  - Title: ${sampleJob.job_title}`);
        console.log(`  - Company: ${sampleJob.company_name}`);
        console.log(`  - Location: ${sampleJob.location}`);
        console.log(`  - Description length: ${sampleJob.description?.length || 0}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSimpleFetch(); 