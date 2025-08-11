// Test script to verify pagination system is working
const { createClient } = require('@supabase/supabase-js');

// You'll need to add your Supabase URL and anon key here
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPaginationSystem() {
  console.log('🧪 Testing pagination system...\n');

  try {
    // Test 1: Check if we can get pagination state
    console.log('1. Testing getJobPaginationState...');
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.log('❌ No authenticated user found');
      return;
    }

    const userId = userData.user.id;
    console.log('✅ User authenticated:', userId);

    // Test 2: Get total jobs
    const { data: totalJobs, error: totalError } = await supabase
      .from('linkedin_fetched_jobs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (totalError) {
      console.log('❌ Error getting total jobs:', totalError);
    } else {
      console.log('✅ Total jobs available:', totalJobs?.length || 0);
    }

    // Test 3: Get viewed jobs
    const { data: viewedJobs, error: viewedError } = await supabase
      .from('job_swipes')
      .select('job_id', { count: 'exact' })
      .eq('user_id', userId);

    if (viewedError) {
      console.log('❌ Error getting viewed jobs:', viewedError);
    } else {
      console.log('✅ Jobs viewed (swiped):', viewedJobs?.length || 0);
    }

    // Test 4: Calculate remaining jobs
    const total = totalJobs?.length || 0;
    const viewed = viewedJobs?.length || 0;
    const remaining = total - viewed;
    const shouldRefetch = remaining <= 5 && total > 0;

    console.log('\n📊 Pagination Summary:');
    console.log(`   Total jobs: ${total}`);
    console.log(`   Viewed jobs: ${viewed}`);
    console.log(`   Remaining jobs: ${remaining}`);
    console.log(`   Should refetch: ${shouldRefetch}`);

    // Test 5: Check if backend is accessible
    console.log('\n2. Testing backend connectivity...');
    try {
      const response = await fetch('http://localhost:3001/api/fetch-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
        }),
      });

      if (response.ok) {
        console.log('✅ Backend is accessible');
      } else {
        console.log('❌ Backend returned error:', response.status);
      }
    } catch (error) {
      console.log('❌ Backend not accessible:', error.message);
    }

    console.log('\n✅ Pagination system test completed!');

  } catch (error) {
    console.error('❌ Error testing pagination system:', error);
  }
}

// Run the test
testPaginationSystem(); 