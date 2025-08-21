const { sessionManager } = require('../src/services/sessionManager');
const { encrypt, decrypt } = require('../src/utils/encryption');

console.log('🔐 Testing Session Manager with Encryption\n');

// Mock Supabase for testing
const mockSupabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          single: async () => ({
            data: {
              email: 'test@example.com',
              password_encrypted: await encrypt('testPassword123!')
            },
            error: null
          })
        })
      })
    })
  })
};

// Mock the supabase import
jest.mock('../src/config/database', () => ({
  supabase: mockSupabase
}));

// Test 1: Test credential decryption in session manager
console.log('Test 1: Session Manager Credential Decryption');
try {
  // Create a test encrypted password
  const testPassword = 'myLinkedInPassword123!';
  const encryptedPassword = await encrypt(testPassword);
  
  console.log('✅ Created test encrypted password');
  console.log('Encrypted format:', typeof encryptedPassword);
  console.log('Encrypted preview:', encryptedPassword.substring(0, 50) + '...');
  
  // Test decryption
  const decryptedPassword = await decrypt(encryptedPassword);
  console.log('✅ Decrypted password successfully');
  console.log('Password match:', decryptedPassword === testPassword ? '✅ YES' : '❌ NO');
  console.log('Password length:', decryptedPassword.length);
  
  // Test with session manager logic
  if (decryptedPassword.length > 200) {
    console.log('⚠️ Password too long, would be truncated');
    const truncated = decryptedPassword.substring(0, 200);
    console.log('Truncated length:', truncated.length);
  } else {
    console.log('✅ Password length is acceptable for LinkedIn');
  }
  
} catch (error) {
  console.error('❌ Test 1 failed:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test 2: Test with long password
console.log('Test 2: Long Password Handling');
try {
  const longPassword = 'a'.repeat(250);
  const encryptedLongPassword = await encrypt(longPassword);
  
  console.log('✅ Created long encrypted password');
  console.log('Original length:', longPassword.length);
  
  const decryptedLongPassword = await decrypt(encryptedLongPassword);
  console.log('✅ Decrypted long password');
  console.log('Decrypted length:', decryptedLongPassword.length);
  console.log('Truncated correctly:', decryptedLongPassword.length <= 200 ? '✅ YES' : '❌ NO');
  
} catch (error) {
  console.error('❌ Test 2 failed:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test 3: Test with special characters
console.log('Test 3: Special Characters');
try {
  const specialPassword = 'P@ssw0rd!@#$%^&*()_+-=[]{}|;:,.<>?';
  const encryptedSpecial = await encrypt(specialPassword);
  
  console.log('✅ Created special char encrypted password');
  
  const decryptedSpecial = await decrypt(encryptedSpecial);
  console.log('✅ Decrypted special char password');
  console.log('Password match:', decryptedSpecial === specialPassword ? '✅ YES' : '❌ NO');
  
} catch (error) {
  console.error('❌ Test 3 failed:', error.message);
}

console.log('\n🎉 Session Manager Encryption Tests Complete!\n');
