require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://xipjxcktpzanmhfrkbrm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODA0MywiZXhwIjoyMDY2Njk0MDQzfQ.Dm73I66zlS1RXYcde6QHdTQt32ARu00K9pXeFuIruJE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Starting additional questions table migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create_user_additional_questions_table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL content:');
    console.log(sqlContent);
    
    // Execute the SQL
    console.log('🔧 Executing SQL migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      
      // Try alternative approach using direct SQL execution
      console.log('🔄 Trying alternative approach...');
      
      // Split the SQL into individual statements
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`🔧 Executing: ${statement.substring(0, 100)}...`);
          try {
            const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
            if (stmtError) {
              console.log(`⚠️ Statement failed (continuing): ${stmtError.message}`);
            }
          } catch (stmtError) {
            console.log(`⚠️ Statement error (continuing): ${stmtError.message}`);
          }
        }
      }
    } else {
      console.log('✅ Migration completed successfully');
    }
    
    // Verify the table was created
    console.log('🔍 Verifying table creation...');
    const { data: tables, error: listError } = await supabase
      .from('user_additional_questions')
      .select('*')
      .limit(1);
    
    if (listError) {
      console.log('❌ Table verification failed:', listError);
    } else {
      console.log('✅ Table verification successful');
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

runMigration().then(() => {
  console.log('🏁 Migration process completed');
}).catch(error => {
  console.error('❌ Migration process failed:', error);
}); 