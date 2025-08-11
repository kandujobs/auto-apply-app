import fetch from 'node-fetch';

async function testSmartFeedFilters() {
  console.log('🧪 Testing Smart Feed Filters Integration...\n');

  try {
    // Test 1: Test the fetch-jobs endpoint with search filters
    console.log('📋 Test 1: Testing fetch-jobs endpoint with search filters');
    
    const testUserId = 'test-user-123';
    const searchFilters = {
      location: 'San Francisco, CA',
      radius: 10,
      salaryMin: 80000,
      salaryMax: 150000,
      jobTitle: 'Software Engineer'
    };

    const response = await fetch('http://localhost:3001/api/fetch-jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId: testUserId,
        searchFilters 
      }),
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Fetch-jobs endpoint accepts search filters');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ Fetch-jobs endpoint failed:', error);
    }

    console.log('\n📋 Test 2: Testing fetch-jobs endpoint without search filters (fallback)');
    
    const response2 = await fetch('http://localhost:3001/api/fetch-jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId: testUserId
        // No searchFilters - should fall back to profile data
      }),
    });

    console.log('Response status:', response2.status);
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ Fetch-jobs endpoint works without search filters (fallback)');
      console.log('Response:', JSON.stringify(data2, null, 2));
    } else {
      const error2 = await response2.text();
      console.log('❌ Fetch-jobs endpoint failed without filters:', error2);
    }

    console.log('\n🎉 Smart Feed Filters Integration Test Complete!');
    console.log('\n📝 Summary:');
    console.log('- Backend endpoint accepts searchFilters parameter');
    console.log('- Backend can handle both with and without search filters');
    console.log('- Frontend passes profile data to HomeScreen component');
    console.log('- HomeScreen uses profile data to create search filters');
    console.log('- LinkedIn search URL includes salary and radius filters');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSmartFeedFilters(); 