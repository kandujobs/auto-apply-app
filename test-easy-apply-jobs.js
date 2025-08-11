// Test script for Easy Apply job fetching
import fetch from 'node-fetch';

async function testEasyApplyJobs() {
  try {
    console.log('🚀 Testing Easy Apply job fetching...');
    
    const testData = {
      searchTerm: 'Software Engineer',
      location: 'San Francisco, CA',
      userId: 'test-user-123',
      linkedInCredentials: {
        email: 'stuarthubert8@gmail.com',
        password: 'Playwright1!' // Replace with real password
      }
    };

    console.log('📤 Sending Easy Apply jobs request...');
    console.log('🔍 Search term:', testData.searchTerm);
    console.log('📍 Location:', testData.location);
    console.log('👤 User ID:', testData.userId);
    
    const response = await fetch('http://localhost:3001/api/easy-apply-jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    console.log('📥 Easy Apply jobs result:', result);
    
    if (result.success) {
      console.log(`✅ Easy Apply job fetching is working! Found ${result.count} jobs`);
      result.jobs.forEach((job, index) => {
        console.log(`\n💼 Easy Apply Job ${index + 1}:`);
        console.log(`   Title: ${job.title}`);
        console.log(`   Company: ${job.company}`);
        console.log(`   Location: ${job.location}`);
        console.log(`   URL: ${job.url}`);
        console.log(`   Posted: ${job.postedAt}`);
        console.log(`   Easy Apply: ${job.easyApply ? '✅ Yes' : '❌ No'}`);
        if (job.salary) {
          console.log(`   Salary: ${job.salary}`);
        }
        if (job.applicants) {
          console.log(`   Applicants: ${job.applicants}`);
        }
      });
    } else {
      console.log('❌ Easy Apply job fetching failed:', result.error);
      
      if (result.error.includes('Failed to login to LinkedIn')) {
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Make sure the password is correct');
        console.log('   2. Check if LinkedIn requires 2FA');
        console.log('   3. Verify the account is not locked');
        console.log('   4. Try logging into LinkedIn manually first');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing Easy Apply job fetch:', error);
  }
}

// Instructions for the user
console.log('🚀 LinkedIn Easy Apply Job Fetching Test');
console.log('========================================');
console.log('');
console.log('📋 Before running this test:');
console.log('   1. Make sure you are logged into the app');
console.log('   2. Save your LinkedIn credentials in the Auto-Apply screen');
console.log('   3. Replace "your-actual-password" with your real password');
console.log('   4. Make sure the backend server is running (npm start in backend/)');
console.log('');

// Run the test
testEasyApplyJobs(); 