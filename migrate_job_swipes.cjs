const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xipjxcktpzanmhfrkbrm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTgwNDMsImV4cCI6MjA2NjY5NDA0M30.i7rLdAIQ4hc9r95MeDlCyORELOEg4jDbKDMTooYsnzo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateJobSwipes() {
  console.log('🔄 Starting job_swipes table migration...');
  
  try {
    // Add job_title column
    console.log('📝 Adding job_title column...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE job_swipes ADD COLUMN IF NOT EXISTS job_title TEXT;'
    });
    
    if (error1) {
      console.error('❌ Error adding job_title column:', error1);
    } else {
      console.log('✅ Added job_title column');
    }

    // Add company column
    console.log('📝 Adding company column...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE job_swipes ADD COLUMN IF NOT EXISTS company TEXT;'
    });
    
    if (error2) {
      console.error('❌ Error adding company column:', error2);
    } else {
      console.log('✅ Added company column');
    }

    // Create indexes
    console.log('📝 Creating indexes...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_job_swipes_job_title ON job_swipes(job_title); CREATE INDEX IF NOT EXISTS idx_job_swipes_company ON job_swipes(company);'
    });
    
    if (error3) {
      console.error('❌ Error creating indexes:', error3);
    } else {
      console.log('✅ Created indexes');
    }

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateJobSwipes(); 