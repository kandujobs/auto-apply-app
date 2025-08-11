import fetch from 'node-fetch';

async function testJobFetchWithUUID() {
  console.log('Testing job fetching system with proper UUID...');
  
  // Use a proper UUID format for testing
  const testUserId = 'd02765f1-e13e-46d9-b5cb-6dcf099bf8cc'; // This is a valid UUID format
  
  try {
    console.log('Sending job search request with UUID:', testUserId);
    
    const response = await fetch('http://localhost:3001/api/fetch-jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
      }),
    });

    const result = await response.json();
    console.log('Job search result:', result);
    
    if (result.success) {
      console.log('✅ Job fetching is working!');
    } else {
      console.log('❌ Job fetching failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error testing job fetch:', error);
  }
}

testJobFetchWithUUID(); 