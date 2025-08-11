// Test script to check LinkedIn credentials loading
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xipjxcktpzanmhfrkbrm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTgwNDMsImV4cCI6MjA2NjY5NDA0M30.i7rLdAIQ4hc9r95MeDlCyORELOEg4jDbKDMTooYsnzo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCredentialsLoading() {
  try {
    console.log('🔍 Testing LinkedIn credentials loading...');
    
    // First, let's see all LinkedIn credentials in the database
    const { data: allLinkedInCreds, error: allCredsError } = await supabase
      .from('linkedin_credentials')
      .select('id, email, is_active');
    
    if (allCredsError) {
      console.log('❌ Error fetching all credentials:', allCredsError);
      return;
    }
    
    console.log('📋 All LinkedIn credentials in database:');
    allLinkedInCreds.forEach(cred => {
      console.log(`  - ${cred.id}: ${cred.email} (active: ${cred.is_active})`);
    });
    
    // Test with the specific user that's trying to connect
    const testUserId = 'd02765f1-e13e-46d9-b5cb-6dcf099bf8cc'; // maximehu@buffalo.edu
    console.log(`\n🔍 Testing credentials for user: ${testUserId}`);
    
    // Check what credentials exist for this user
    const { data: allCreds, error: credError } = await supabase
      .from('linkedin_credentials')
      .select('id, email, is_active')
      .eq('id', testUserId);
    
    if (credError) {
      console.log('❌ Error checking credentials:', credError);
      return;
    }
    
    console.log(`📋 Credentials for user ${testUserId}:`);
    allCreds.forEach(cred => {
      console.log(`  - ${cred.email} (active: ${cred.is_active})`);
    });
    
    // Test the specific query that the backend uses
    const { data: activeCreds, error: activeError } = await supabase
      .from('linkedin_credentials')
      .select('email, password_encrypted')
      .eq('id', testUserId)
      .eq('is_active', true)
      .single();
    
    if (activeError) {
      console.log('❌ Error fetching active credentials:', activeError);
    } else if (activeCreds) {
      console.log('✅ Found active credentials:', activeCreds.email);
    } else {
      console.log('❌ No active credentials found');
    }
    
    // Also test what the user's profile looks like
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', testUserId)
      .single();
    
    if (profileError) {
      console.log('❌ Error fetching profile:', profileError);
    } else if (profile) {
      console.log('✅ Found user profile:', profile.email);
    } else {
      console.log('❌ No user profile found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCredentialsLoading(); 