// Test script using the working credentials from the auto-apply logs
import fetch from 'node-fetch';

async function testWithWorkingCredentials() {
  try {
    console.log('Testing job fetching with working credentials...');
    
    // Use the credentials that were working in the auto-apply logs
    const workingCredentials = {
      email: 'stewarthubert8@gmail.com',
      password: 'your-actual-linkedin-password' // Replace with the real password that was working
    };
    
    const testData = {
      jobTitle: 'Software Engineer',
      location: 'San Francisco, CA',
      maxResults: 3,
      linkedInCredentials: workingCredentials
    };

    console.log('Sending job search request...');
    const response = await fetch('http://localhost:3001/api/job-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    console.log('Job search result:', result);
    
    if (result.success) {
      console.log(`✅ Job fetching is working! Found ${result.count} jobs`);
      result.jobs.forEach((job, index) => {
        console.log(`Job ${index + 1}: ${job.title} at ${job.company}`);
        console.log(`  Location: ${job.location}`);
        console.log(`  Easy Apply: ${job.easyApply ? 'Yes' : 'No'}`);
        console.log(`  URL: ${job.url}`);
        console.log('---');
      });
    } else {
      console.log('❌ Job fetching failed:', result.error);
      
      // If it's a login error, let's try with a different approach
      if (result.error.includes('Failed to login to LinkedIn')) {
        console.log('\n🔧 Trying alternative approach...');
        console.log('The auto-apply system was working with these credentials.');
        console.log('The issue might be with the job search process itself.');
        console.log('Please check the backend logs for more details.');
      }
    }
    
  } catch (error) {
    console.error('Error testing job fetch:', error);
  }
}

// Instructions for testing
console.log('📋 Instructions:');
console.log('1. Replace "your-actual-linkedin-password" with the real password');
console.log('2. The email "stewarthubert8@gmail.com" was working in the auto-apply logs');
console.log('3. Run this script to test job fetching');
console.log('');

testWithWorkingCredentials(); 