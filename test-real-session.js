import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// Test the session-based application system with real user data
async function testRealSession() {
  console.log('🧪 Testing session-based application system with real user data...');
  
  const baseUrl = 'http://localhost:3001';
  
  // Initialize Supabase client
  const supabase = createClient(
    'https://xipjxcktpzanmhfrkbrm.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODA0MywiZXhwIjoyMDY2Njk0MDQzfQ.Dm73I66zlS1RXYcde6QHdTQt32ARu00K9pXeFuIruJE'
  );
  
  try {
    // Get first available user
    console.log('\n1. Getting first available user...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);
    
    if (profileError || !profiles || profiles.length === 0) {
      console.log('❌ No user profiles found');
      return;
    }
    
    const userId = profiles[0].id;
    console.log(`✅ Found user: ${profiles[0].email} (${userId})`);
    
    // Check if user has LinkedIn credentials
    console.log('\n2. Checking LinkedIn credentials...');
    const { data: credentials, error: credError } = await supabase
      .from('linkedin_credentials')
      .select('email, is_active')
      .eq('id', userId)
      .eq('is_active', true)
      .single();
    
    if (credError || !credentials) {
      console.log('❌ No active LinkedIn credentials found for this user');
      console.log('💡 Please add LinkedIn credentials to the database first');
      return;
    }
    
    console.log(`✅ Found LinkedIn credentials for: ${credentials.email}`);
    
    // Test session status
    console.log('\n3. Checking session status...');
    const statusResponse = await fetch(`${baseUrl}/api/session/status/${userId}`);
    const statusData = await statusResponse.json();
    console.log('Session status:', statusData);
    
    if (statusData.sessionActive) {
      console.log('⚠️ Session already active, ending it first...');
      const endResponse = await fetch(`${baseUrl}/api/session/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      const endData = await endResponse.json();
      console.log('End session response:', endData);
    }
    
    // Test session start
    console.log('\n4. Testing session start...');
    const startResponse = await fetch(`${baseUrl}/api/session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    const startData = await startResponse.json();
    console.log('Start session response:', startData);
    
    if (startData.success) {
      console.log('✅ Session started successfully!');
      console.log('🌐 Browser should now be opening and logging into LinkedIn...');
      console.log('📝 Complete any security checkpoints manually in the browser');
      console.log('🔄 Browser will stay open for job applications');
    } else {
      console.log('❌ Session start failed:', startData.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRealSession().catch(console.error); 