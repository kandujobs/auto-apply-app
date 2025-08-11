const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xipjxcktpzanmhfrkbrm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODA0MywiZXhwIjoyMDY2Njk0MDQzfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Add description column to linkedin_fetched_jobs
    console.log('📝 Adding description column to linkedin_fetched_jobs...');
    const { error: descError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE linkedin_fetched_jobs ADD COLUMN IF NOT EXISTS description TEXT;'
    });
    
    if (descError) {
      console.error('❌ Error adding description column:', descError);
    } else {
      console.log('✅ Description column added successfully');
    }
    
    // Create job_swipes table
    console.log('📝 Creating job_swipes table...');
    const { error: swipesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS job_swipes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          job_id TEXT NOT NULL,
          swipe_direction TEXT NOT NULL CHECK (swipe_direction IN ('left', 'right', 'saved')),
          swiped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, job_id)
        );
      `
    });
    
    if (swipesError) {
      console.error('❌ Error creating job_swipes table:', swipesError);
    } else {
      console.log('✅ job_swipes table created successfully');
    }
    
    // Create indexes
    console.log('📝 Creating indexes...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_job_swipes_user_id ON job_swipes(user_id);
        CREATE INDEX IF NOT EXISTS idx_job_swipes_job_id ON job_swipes(job_id);
        CREATE INDEX IF NOT EXISTS idx_job_swipes_swiped_at ON job_swipes(swiped_at);
      `
    });
    
    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
    } else {
      console.log('✅ Indexes created successfully');
    }
    
    // Enable RLS
    console.log('📝 Enabling Row Level Security...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE job_swipes ENABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
    } else {
      console.log('✅ RLS enabled successfully');
    }
    
    console.log('✅ All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running migrations:', error);
  }
}

runMigrations(); 