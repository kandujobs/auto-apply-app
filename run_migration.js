const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xipjxcktpzanmhfrkbrm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODA0MywiZXhwIjoyMDY2Njk0MDQzfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'; // Use service role key for migrations

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🔄 Running migration to add description column...');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE linkedin_fetched_jobs ADD COLUMN IF NOT EXISTS description TEXT;'
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
    } else {
      console.log('✅ Migration completed successfully!');
    }
  } catch (error) {
    console.error('❌ Error running migration:', error);
  }
}

runMigration(); 