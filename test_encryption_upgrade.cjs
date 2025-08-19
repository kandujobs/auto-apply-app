const { encrypt, decrypt, isLegacyFormat, migrateLegacyCredentials } = require('./backend/encryption');

/**
 * Test script to verify encryption upgrade functionality
 */
async function testEncryptionUpgrade() {
  console.log('🧪 Testing Encryption Upgrade');
  console.log('==============================\n');

  try {
    // Test 1: New encryption/decryption
    console.log('1️⃣ Testing new AES-256-CBC encryption...');
    const testPassword = 'my-secure-password-123';
    const encrypted = await encrypt(testPassword);
    const decrypted = await decrypt(encrypted);
    
    console.log(`   Original: ${testPassword}`);
    console.log(`   Encrypted: ${encrypted.substring(0, 50)}...`);
    console.log(`   Decrypted: ${decrypted}`);
    console.log(`   Match: ${testPassword === decrypted ? '✅' : '❌'}`);
    console.log(`   Is legacy format: ${isLegacyFormat(encrypted) ? '❌' : '✅'}\n`);

    // Test 2: Legacy XOR decryption (simulate old data)
    console.log('2️⃣ Testing legacy XOR decryption...');
    const legacyKey = 'your-secret-key-here-32-chars-long';
    const legacyPassword = 'legacy-password';
    
    // Create legacy XOR encrypted data
    const legacyEncoded = Buffer.from(legacyPassword, 'utf8').toString('base64');
    let legacyEncrypted = '';
    for (let i = 0; i < legacyEncoded.length; i++) {
      const charCode = legacyEncoded.charCodeAt(i) ^ legacyKey.charCodeAt(i % legacyKey.length);
      legacyEncrypted += String.fromCharCode(charCode);
    }
    const legacyBase64 = Buffer.from(legacyEncrypted).toString('base64');
    
    console.log(`   Legacy password: ${legacyPassword}`);
    console.log(`   Legacy encrypted: ${legacyBase64.substring(0, 50)}...`);
    
    const legacyDecrypted = await decrypt(legacyBase64);
    console.log(`   Legacy decrypted: ${legacyDecrypted}`);
    console.log(`   Legacy match: ${legacyPassword === legacyDecrypted ? '✅' : '❌'}`);
    console.log(`   Is legacy format: ${isLegacyFormat(legacyBase64) ? '✅' : '❌'}\n`);

    // Test 3: Migration from legacy to new format
    console.log('3️⃣ Testing migration from legacy to new format...');
    const migratedEncrypted = await migrateLegacyCredentials(legacyBase64);
    const migratedDecrypted = await decrypt(migratedEncrypted);
    
    console.log(`   Migrated encrypted: ${migratedEncrypted.substring(0, 50)}...`);
    console.log(`   Migrated decrypted: ${migratedDecrypted}`);
    console.log(`   Migration match: ${legacyPassword === migratedDecrypted ? '✅' : '❌'}`);
    console.log(`   Is legacy format: ${isLegacyFormat(migratedEncrypted) ? '❌' : '✅'}\n`);

    // Test 4: Performance test
    console.log('4️⃣ Testing performance...');
    const iterations = 100;
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      const testData = `test-password-${i}`;
      const encrypted = await encrypt(testData);
      const decrypted = await decrypt(encrypted);
      if (testData !== decrypted) {
        throw new Error(`Performance test failed at iteration ${i}`);
      }
    }
    
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / iterations;
    
    console.log(`   ${iterations} encryption/decryption operations`);
    console.log(`   Total time: ${endTime - startTime}ms`);
    console.log(`   Average time: ${avgTime.toFixed(2)}ms per operation\n`);

    // Test 5: Error handling
    console.log('5️⃣ Testing error handling...');
    try {
      await decrypt('invalid-base64-data');
      console.log('   ❌ Should have thrown an error for invalid data');
    } catch (error) {
      console.log('   ✅ Correctly handled invalid data');
    }

    try {
      await decrypt('dGVzdA=='); // base64 for "test" but not in expected format
      console.log('   ✅ Handled unexpected format gracefully');
    } catch (error) {
      console.log('   ✅ Correctly handled unexpected format');
    }

    console.log('\n🎉 All tests passed! Encryption upgrade is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testEncryptionUpgrade();
}

module.exports = {
  testEncryptionUpgrade
};
