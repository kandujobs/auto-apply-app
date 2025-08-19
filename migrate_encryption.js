const { createClient } = require('@supabase/supabase-js');
const { isLegacyFormat, migrateLegacyCredentials } = require('./backend/encryption');

// Supabase configuration
const supabaseUrl = 'https://xipjxcktpzanmhfrkbrm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODA0MywiZXhwIjoyMDY2Njk0MDQzfQ.Dm73I66zlS1RXYcde6QHdTQt32ARu00K9pXeFuIruJE';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Migration script to upgrade LinkedIn credentials from legacy XOR encryption to AES-256-GCM
 */
async function migrateEncryption() {
  try {
    console.log('🔐 Starting encryption migration...');
    
    // Fetch all LinkedIn credentials
    const { data: credentials, error } = await supabase
      .from('linkedin_credentials')
      .select('id, email, password_encrypted, created_at');
    
    if (error) {
      console.error('❌ Error fetching credentials:', error);
      return;
    }
    
    if (!credentials || credentials.length === 0) {
      console.log('✅ No credentials found to migrate');
      return;
    }
    
    console.log(`📊 Found ${credentials.length} credentials to check`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const credential of credentials) {
      try {
        console.log(`\n🔍 Processing credential for: ${credential.email}`);
        
        // Check if this credential is using legacy encryption
        if (isLegacyFormat(credential.password_encrypted)) {
          console.log(`  ⚠️  Legacy format detected, migrating...`);
          
          // Migrate to new format
          const newEncryptedPassword = await migrateLegacyCredentials(credential.password_encrypted);
          
          // Update in database
          const { error: updateError } = await supabase
            .from('linkedin_credentials')
            .update({ 
              password_encrypted: newEncryptedPassword,
              updated_at: new Date().toISOString()
            })
            .eq('id', credential.id);
          
          if (updateError) {
            console.error(`  ❌ Failed to update credential:`, updateError);
            errorCount++;
          } else {
            console.log(`  ✅ Successfully migrated credential`);
            migratedCount++;
          }
        } else {
          console.log(`  ✅ Already using new encryption format`);
          skippedCount++;
        }
      } catch (credentialError) {
        console.error(`  ❌ Error processing credential:`, credentialError);
        errorCount++;
      }
    }
    
    // Summary
    console.log('\n📈 Migration Summary:');
    console.log(`  ✅ Migrated: ${migratedCount} credentials`);
    console.log(`  ⏭️  Skipped: ${skippedCount} credentials (already new format)`);
    console.log(`  ❌ Errors: ${errorCount} credentials`);
    console.log(`  📊 Total: ${credentials.length} credentials processed`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

/**
 * Verify migration by testing decryption of a few credentials
 */
async function verifyMigration() {
  try {
    console.log('\n🔍 Verifying migration...');
    
    // Fetch a few credentials to test
    const { data: credentials, error } = await supabase
      .from('linkedin_credentials')
      .select('id, email, password_encrypted')
      .limit(3);
    
    if (error || !credentials || credentials.length === 0) {
      console.log('❌ No credentials found for verification');
      return;
    }
    
    const { decrypt } = require('./backend/encryption');
    
    for (const credential of credentials) {
      try {
        console.log(`\n🔍 Testing decryption for: ${credential.email}`);
        
        // Try to decrypt
        const decryptedPassword = decrypt(credential.password_encrypted);
        
        if (decryptedPassword && decryptedPassword.length > 0) {
          console.log(`  ✅ Decryption successful (password length: ${decryptedPassword.length})`);
        } else {
          console.log(`  ❌ Decryption failed - empty result`);
        }
      } catch (decryptError) {
        console.error(`  ❌ Decryption error:`, decryptError.message);
      }
    }
    
    console.log('\n✅ Verification completed');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  console.log('🚀 LinkedIn Credentials Encryption Migration');
  console.log('=============================================\n');
  
  // Check if we should run verification only
  const args = process.argv.slice(2);
  const verifyOnly = args.includes('--verify');
  
  if (verifyOnly) {
    verifyMigration();
  } else {
    migrateEncryption().then(() => {
      // Run verification after migration
      return verifyMigration();
    });
  }
}

module.exports = {
  migrateEncryption,
  verifyMigration
};
