require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://xipjxcktpzanmhfrkbrm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODA0MywiZXhwIjoyMDY2Njk0MDQzfQ.Dm73I66zlS1RXYcde6QHdTQt32ARu00K9pXeFuIruJE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testTable() {
  try {
    console.log('🔍 Testing additional questions table...');
    
    // Try to insert a test record
    const { data, error } = await supabase
      .from('user_additional_questions')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
        question_text: 'Test question',
        question_type: 'text',
        answer: 'Test answer',
        job_id: 'test-job-id',
        job_title: 'Test Job',
        company_name: 'Test Company'
      });

    if (error) {
      if (error.code === '42P01') {
        console.log('❌ Table does not exist. Please create it manually in Supabase dashboard.');
        console.log('📄 SQL to run in Supabase SQL editor:');
        console.log(`
-- Table for storing user answers to additional questions from LinkedIn applications
CREATE TABLE IF NOT EXISTS user_additional_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL, -- 'text', 'textarea', 'select'
    answer TEXT NOT NULL,
    job_id TEXT, -- LinkedIn job ID
    job_title TEXT,
    company_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_additional_questions_user_id ON user_additional_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_additional_questions_question_text ON user_additional_questions(question_text);
CREATE INDEX IF NOT EXISTS idx_user_additional_questions_job_id ON user_additional_questions(job_id);

-- Enable RLS
ALTER TABLE user_additional_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own additional questions" ON user_additional_questions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own additional questions" ON user_additional_questions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own additional questions" ON user_additional_questions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own additional questions" ON user_additional_questions
    FOR DELETE USING (auth.uid() = user_id);
        `);
      } else {
        console.log('❌ Error testing table:', error);
      }
    } else {
      console.log('✅ Table exists and is working!');
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('user_additional_questions')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        console.log('⚠️ Could not clean up test data:', deleteError);
      } else {
        console.log('✅ Test data cleaned up');
      }
    }
    
  } catch (error) {
    console.error('❌ Error in testTable:', error);
  }
}

testTable().then(() => {
  console.log('🏁 Test completed');
}).catch(error => {
  console.error('❌ Test failed:', error);
}); 