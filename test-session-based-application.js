import fetch from 'node-fetch';

// Test the session-based application system
async function testSessionBasedApplication() {
  console.log('🧪 Testing session-based application system...');
  
  const baseUrl = 'http://localhost:3001';
  const testUserId = 'test-user-id';
  
  try {
    // Test 1: Check session status (should be inactive)
    console.log('\n1. Checking initial session status...');
    const statusResponse = await fetch(`${baseUrl}/api/session/status/${testUserId}`);
    const statusData = await statusResponse.json();
    console.log('Session status:', statusData);
    
    if (statusData.sessionActive) {
      console.log('❌ Session should be inactive initially');
      return;
    }
    console.log('✅ Session is correctly inactive initially');
    
    // Test 2: Try to start session without credentials (should fail)
    console.log('\n2. Testing session start without credentials...');
    const startResponse = await fetch(`${baseUrl}/api/session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId: testUserId,
        linkedInCredentials: {
          email: 'test@example.com',
          password: 'testpassword'
        }
      }),
    });
    const startData = await startResponse.json();
    console.log('Start session response:', startData);
    
    // Test 3: Try to apply to job without active session (should fail)
    console.log('\n3. Testing job application without active session...');
    const applyResponse = await fetch(`${baseUrl}/api/apply-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId: testUserId,
        jobId: 'test-job-id',
        jobUrl: 'https://www.linkedin.com/jobs/view/test-job-id/'
      }),
    });
    const applyData = await applyResponse.json();
    console.log('Apply job response:', applyData);
    
    if (applyData.success) {
      console.log('❌ Job application should fail without active session');
      return;
    }
    console.log('✅ Job application correctly fails without active session');
    
    // Test 4: End session (should succeed even if no session exists)
    console.log('\n4. Testing session end...');
    const endResponse = await fetch(`${baseUrl}/api/session/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: testUserId }),
    });
    const endData = await endResponse.json();
    console.log('End session response:', endData);
    
    if (endData.success) {
      console.log('✅ Session end works correctly');
    } else {
      console.log('❌ Session end failed:', endData.error);
    }
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📝 Note: To test with real credentials, you need to:');
    console.log('1. Add LinkedIn credentials to the database');
    console.log('2. Start the backend server');
    console.log('3. Run the frontend application');
    console.log('4. Click "Start Session" in the UI');
    console.log('5. Complete any security checkpoints manually');
    console.log('6. Try applying to jobs');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSessionBasedApplication().catch(console.error); 