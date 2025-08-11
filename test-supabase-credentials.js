// Test script that pulls real LinkedIn credentials from Supabase
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'https://xipjxcktpzanmhfrkbrm.supabase.co'; // Replace with your actual URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTgwNDMsImV4cCI6MjA2NjY5NDA0M30.i7rLdAIQ4hc9r95MeDlCyORELOEg4jDbKDMTooYsnzo'; // Replace with your actual key

const supabase = createClient(supabaseUrl, supabaseKey);

async function getCredentialsFromSupabase() {
  try {
    console.log('Fetching LinkedIn credentials from Supabase...');
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('❌ No authenticated user found');
      console.log('Please make sure you are logged into the app first');
      return null;
    }

    console.log('✅ User authenticated:', user.email);

    // Fetch LinkedIn credentials from database
    const { data, error } = await supabase
      .from('linkedin_credentials')
      .select('*')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.log('❌ No LinkedIn credentials found:', error.message);
      console.log('Please save your LinkedIn credentials in the Auto-Apply screen first');
      return null;
    }

    console.log('✅ Found LinkedIn credentials for:', data.email);
    console.log('📅 Last used:', data.last_used);
    
    // Note: The password is encrypted in the database
    // For testing, you'll need to provide the actual password
    return {
      email: data.email,
      password: 'your-actual-password' // You'll need to replace this with the real password
    };
  } catch (error) {
    console.error('❌ Error fetching credentials:', error);
    return null;
  }
}

async function testJobFetchWithSupabaseCredentials() {
  try {
    console.log('🔍 Testing job fetching with Supabase credentials...');
    
    // Get credentials from Supabase
    const credentials = await getCredentialsFromSupabase();
    if (!credentials) {
      console.log('❌ Could not get credentials from Supabase');
      console.log('💡 Make sure you:');
      console.log('   1. Are logged into the app');
      console.log('   2. Have saved LinkedIn credentials in the Auto-Apply screen');
      console.log('   3. Replace "your-actual-password" with the real password');
      return;
    }

    // For now, let's use the email we know works
    // You'll need to provide the actual password
    const testCredentials = {
      email: credentials.email,
      password: 'your-actual-linkedin-password' // Replace this with the real password
    };
    
    const testData = {
      jobTitle: 'Software Engineer',
      location: 'San Francisco, CA',
      maxResults: 5,
      linkedInCredentials: testCredentials
    };

    console.log('📤 Sending job search request...');
    console.log('📧 Using email:', testCredentials.email);
    
    const response = await fetch('http://localhost:3001/api/job-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    console.log('📥 Job search result:', result);
    
    if (result.success) {
      console.log(`✅ Job fetching is working! Found ${result.count} jobs`);
      result.jobs.forEach((job, index) => {
        console.log(`\n💼 Job ${index + 1}:`);
        console.log(`   Title: ${job.title}`);
        console.log(`   Company: ${job.company}`);
        console.log(`   Location: ${job.location}`);
        console.log(`   Easy Apply: ${job.easyApply ? '✅ Yes' : '❌ No'}`);
        console.log(`   URL: ${job.url}`);
        if (job.salary) {
          console.log(`   Salary: ${job.salary}`);
        }
      });
    } else {
      console.log('❌ Job fetching failed:', result.error);
      
      if (result.error.includes('Failed to login to LinkedIn')) {
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Make sure the password is correct');
        console.log('   2. Check if LinkedIn requires 2FA');
        console.log('   3. Verify the account is not locked');
        console.log('   4. Try logging into LinkedIn manually first');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing job fetch:', error);
  }
}

// Instructions for the user
console.log('🚀 LinkedIn Job Fetching Test');
console.log('=============================');
console.log('');
console.log('📋 Before running this test:');
console.log('   1. Make sure you are logged into the app');
console.log('   2. Save your LinkedIn credentials in the Auto-Apply screen');
console.log('   3. Replace "your-actual-linkedin-password" with your real password');
console.log('   4. Make sure the backend server is running (npm start in backend/)');
console.log('');

// Run the test
testJobFetchWithSupabaseCredentials(); 