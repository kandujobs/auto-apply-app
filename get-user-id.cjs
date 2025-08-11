require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://xipjxcktpzanmhfrkbrm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODA0MywiZXhwIjoyMDY2Njk0MDQzfQ.Dm73I66zlS1RXYcde6QHdTQt32ARu00K9pXeFuIruJE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getUserId() {
  try {
    console.log('🔍 Getting user ID from database...');
    
    // Get a user from the profiles table
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return null;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('❌ No profiles found in database');
      return null;
    }
    
    console.log('📋 Found profiles:');
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ID: ${profile.id}, Email: ${profile.email}`);
    });
    
    // Return the first user ID
    const userId = profiles[0].id;
    console.log(`✅ Using user ID: ${userId}`);
    return userId;
    
  } catch (error) {
    console.error('❌ Error in getUserId:', error);
    return null;
  }
}

// Run the function
getUserId().then(userId => {
  if (userId) {
    console.log(`\n🎯 Ready to test with user ID: ${userId}`);
    console.log(`💡 Run: node auto-apply/dist/index.js easy-apply-worker ${userId}`);
  } else {
    console.log('❌ Could not get user ID');
  }
}); 