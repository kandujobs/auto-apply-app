const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xipjxcktpzanmhfrkbrm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTgwNDMsImV4cCI6MjA2NjY5NDA0M30.i7rLdAIQ4hc9r95MeDlCyORELOEg4jDbKDMTooYsnzo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testJobSwipes() {
  try {
    console.log('🧪 Testing job_swipes table...');
    
    // Test if we can query the table
    const { data, error } = await supabase
      .from('job_swipes')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ job_swipes table error:', error.message);
      console.log('💡 The table might not exist yet. This is expected for new installations.');
    } else {
      console.log('✅ job_swipes table exists and is accessible');
      console.log('📊 Current records:', data?.length || 0);
    }
    
    // Test if we can insert a record
    const testData = {
      user_id: 'test-user-id',
      job_id: 'test-job-id',
      swipe_direction: 'left',
      swiped_at: new Date().toISOString()
    };
    
    console.log('🧪 Testing insert...');
    const { data: insertData, error: insertError } = await supabase
      .from('job_swipes')
      .insert([testData])
      .select();
    
    if (insertError) {
      console.log('❌ Insert error:', insertError.message);
      console.log('💡 This might be because the table doesn\'t exist or RLS is blocking the insert');
    } else {
      console.log('✅ Insert successful');
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('job_swipes')
        .delete()
        .eq('user_id', 'test-user-id');
      
      if (deleteError) {
        console.log('⚠️ Could not clean up test data:', deleteError.message);
      } else {
        console.log('✅ Test data cleaned up');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testJobSwipes(); 