require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://xipjxcktpzanmhfrkbrm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODA0MywiZXhwIjoyMDY2Njk0MDQzfQ.Dm73I66zlS1RXYcde6QHdTQt32ARu00K9pXeFuIruJE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestJobApplication() {
  try {
    console.log('🧪 Adding test job application to queue...');
    
    const userId = '726cdb5e-ae34-4b8c-ab14-d0e613b2aecd';
    const jobId = 'test-job-' + Date.now();
    const jobUrl = 'https://www.linkedin.com/jobs/view/4272814944/';
    
    // Add a test job application to the queue
    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        user_id: userId,
        job_id: jobId,
        title: 'Test Software Engineer Position',
        company: 'Test Company',
        status: 'applied',
        raw_job: {
          url: jobUrl,
          title: 'Test Software Engineer Position',
          company: 'Test Company'
        }
      });
    
    if (error) {
      console.error('❌ Error adding test job application:', error);
      return;
    }
    
    console.log('✅ Test job application added to database');
    console.log(`📋 Job ID: ${jobId}`);
    console.log(`🔗 Job URL: ${jobUrl}`);
    console.log(`👤 User ID: ${userId}`);
    
    console.log('\n🎯 Now the improved worker should pick up this job automatically!');
    console.log('💡 Check the worker logs to see if it processes this job.');
    
  } catch (error) {
    console.error('❌ Error in addTestJobApplication:', error);
  }
}

// Run the function
addTestJobApplication(); 