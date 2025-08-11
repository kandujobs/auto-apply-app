// Test script to check if the database migration worked
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS
const supabaseUrl = 'https://xipjxcktpzanmhfrkbrm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODA0MywiZXhwIjoyMDY2Njk0MDQzfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'; // Replace with actual service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMigration() {
  try {
    console.log('🔍 Checking if database migration worked...');
    
    // Try to select from job_swipes table to see the structure
    const { data, error } = await supabase
      .from('job_swipes')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accessing job_swipes table:', error.message);
      return;
    }
    
    console.log('✅ Successfully accessed job_swipes table');
    
    if (data && data.length > 0) {
      const sampleRecord = data[0];
      console.log('📋 Sample record keys:', Object.keys(sampleRecord));
      
      // Check for new columns
      const newColumns = [
        'application_processed',
        'application_success', 
        'application_error',
        'application_processed_at'
      ];
      
      console.log('\n🔍 Checking for new columns:');
      newColumns.forEach(column => {
        const exists = column in sampleRecord;
        console.log(`  ${column}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
      });
      
      // Check if all new columns exist
      const allExist = newColumns.every(column => column in sampleRecord);
      console.log(`\n${allExist ? '✅ MIGRATION SUCCESSFUL' : '❌ MIGRATION FAILED'}`);
      
    } else {
      console.log('📝 No records in job_swipes table, checking table structure...');
      
      // Try to insert a test record to see the structure
      const testRecord = {
        user_id: 'd02765f1-e13e-46d9-b5cb-6dcf099bf8cc', // Use a valid UUID
        job_id: 'd02765f1-e13e-46d9-b5cb-6dcf099bf8cc', // Use a valid UUID
        swipe_direction: 'right',
        swiped_at: new Date().toISOString()
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('job_swipes')
        .insert(testRecord)
        .select();
      
      if (insertError) {
        console.log('❌ Error inserting test record:', insertError.message);
        return;
      }
      
      console.log('✅ Successfully inserted test record');
      console.log('📋 Record structure:', Object.keys(insertData[0]));
      
      // Check for new columns
      const newColumns = [
        'application_processed',
        'application_success', 
        'application_error',
        'application_processed_at'
      ];
      
      console.log('\n🔍 Checking for new columns:');
      newColumns.forEach(column => {
        const exists = column in insertData[0];
        console.log(`  ${column}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
      });
      
      // Clean up test record
      await supabase
        .from('job_swipes')
        .delete()
        .eq('user_id', 'd02765f1-e13e-46d9-b5cb-6dcf099bf8cc');
      
      console.log('🧹 Cleaned up test record');
    }
    
  } catch (error) {
    console.error('❌ Error checking migration:', error);
  }
}

checkMigration(); 