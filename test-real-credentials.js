// Test script using real LinkedIn credentials from the database
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration (you'll need to add your actual URL and key)
const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your actual URL
const supabaseKey = 'your-anon-key'; // Replace with your actual key

const supabase = createClient(supabaseUrl, supabaseKey);

async function getRealCredentials() {
  try {
    // Get the current user (you might need to authenticate first)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('No authenticated user found');
      return null;
    }

    // Fetch credentials from database
    const { data, error } = await supabase
      .from('linkedin_credentials')
      .select('*')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.log('No LinkedIn credentials found:', error.message);
      return null;
    }

    // For testing, we'll use the email directly (password is encrypted)
    console.log('Found LinkedIn credentials for:', data.email);
    return {
      email: data.email,
      password: 'your-actual-password' // You'll need to provide this manually for testing
    };
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return null;
  }
}

async function testJobFetchWithRealCredentials() {
  try {
    console.log('Testing job fetching with real credentials...');
    
    // For now, let's use the credentials we know work from the logs
    const realCredentials = {
      email: 'stewarthubert8@gmail.com',
      password: 'your-actual-password' // Replace with the actual password
    };
    
    const testData = {
      jobTitle: 'Software Engineer',
      location: 'San Francisco, CA',
      maxResults: 5,
      linkedInCredentials: realCredentials
    };

    console.log('Sending job search request with real credentials...');
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

// For manual testing, you can provide the actual password
async function testWithManualCredentials() {
  try {
    console.log('Testing with manual credentials...');
    
    // Replace these with the actual credentials from your LinkedIn account
    const manualCredentials = {
      email: 'stewarthubert8@gmail.com',
      password: 'your-actual-linkedin-password' // Replace this with the real password
    };
    
    const testData = {
      jobTitle: 'Software Engineer',
      location: 'San Francisco, CA',
      maxResults: 5,
      linkedInCredentials: manualCredentials
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

// Run the test
testWithManualCredentials(); 