// Test script for job fetching functionality
import fetch from 'node-fetch';

async function testJobFetch() {
  try {
    console.log('Testing job fetching system...');
    
    const testData = {
      jobTitle: 'Software Engineer',
      location: 'San Francisco, CA',
      maxResults: 5,
      linkedInCredentials: {
        email: 'test@example.com',
        password: 'testpassword'
      }
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
    }
    
  } catch (error) {
    console.error('Error testing job fetch:', error);
  }
}

testJobFetch(); 