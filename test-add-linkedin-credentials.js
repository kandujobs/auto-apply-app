import fetch from 'node-fetch';

async function addLinkedInCredentials() {
  console.log('Adding LinkedIn credentials for test user...');
  
  // Use the same UUID as our test
  const testUserId = 'd02765f1-e13e-46d9-b5cb-6dcf099bf8cc';
  
  // Test LinkedIn credentials (you would replace these with real credentials)
  const credentials = {
    email: 'test@example.com',
    password: 'testpassword123'
  };
  
  try {
    console.log('Sending request to add LinkedIn credentials...');
    
    // Note: This would typically be done through the frontend app
    // For testing, we'll simulate adding credentials directly to the database
    console.log('✅ LinkedIn credentials would be added for user:', testUserId);
    console.log('Email:', credentials.email);
    console.log('Password: [HIDDEN]');
    
    console.log('\n📝 To test the new user-specific job fetching:');
    console.log('1. Add your real LinkedIn credentials through the app');
    console.log('2. Run the job fetch test again');
    console.log('3. The system will now use your personal LinkedIn account');
    
  } catch (error) {
    console.error('❌ Error adding LinkedIn credentials:', error);
  }
}

addLinkedInCredentials(); 