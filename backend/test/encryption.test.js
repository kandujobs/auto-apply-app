const { decrypt, encrypt } = require('../src/utils/encryption');

// Test data
const testPassword = 'myTestPassword123!';
const longPassword = 'a'.repeat(300); // 300 character password
const specialCharsPassword = 'P@ssw0rd!@#$%^&*()_+-=[]{}|;:,.<>?';

console.log('🔐 Testing Encryption/Decryption System\n');

async function runAllTests() {
  // Test 1: Basic encryption/decryption
  console.log('Test 1: Basic encryption/decryption');
  try {
    const encrypted = await encrypt(testPassword);
    console.log('✅ Encryption successful');
    console.log('Encrypted format:', typeof encrypted);
    console.log('Encrypted preview:', encrypted.substring(0, 50) + '...');
    
    const decrypted = await decrypt(encrypted);
    console.log('✅ Decryption successful');
    console.log('Decrypted password:', decrypted);
    console.log('Password match:', decrypted === testPassword ? '✅ YES' : '❌ NO');
    console.log('Password length:', decrypted.length);
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Long password handling
  console.log('Test 2: Long password handling');
  try {
    const encrypted = await encrypt(longPassword);
    console.log('✅ Long password encryption successful');
    
    const decrypted = await decrypt(encrypted);
    console.log('✅ Long password decryption successful');
    console.log('Original length:', longPassword.length);
    console.log('Decrypted length:', decrypted.length);
    console.log('Truncated correctly:', decrypted.length <= 200 ? '✅ YES' : '❌ NO');
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Special characters
  console.log('Test 3: Special characters');
  try {
    const encrypted = await encrypt(specialCharsPassword);
    console.log('✅ Special chars encryption successful');
    
    const decrypted = await decrypt(encrypted);
    console.log('✅ Special chars decryption successful');
    console.log('Password match:', decrypted === specialCharsPassword ? '✅ YES' : '❌ NO');
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Already decrypted data
  console.log('Test 4: Already decrypted data');
  try {
    const result = await decrypt(testPassword);
    console.log('✅ Handled already decrypted data');
    console.log('Result:', result);
    console.log('Length:', result.length);
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 5: Invalid JSON
  console.log('Test 5: Invalid JSON data');
  try {
    const result = await decrypt('invalid-json-data');
    console.log('✅ Handled invalid JSON');
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Test 5 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 6: Null/undefined data
  console.log('Test 6: Null/undefined data');
  try {
    const result1 = await decrypt(null);
    const result2 = await decrypt(undefined);
    console.log('✅ Handled null:', result1);
    console.log('✅ Handled undefined:', result2);
  } catch (error) {
    console.error('❌ Test 6 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 7: Empty string
  console.log('Test 7: Empty string');
  try {
    const result = await decrypt('');
    console.log('✅ Handled empty string:', result);
  } catch (error) {
    console.error('❌ Test 7 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 8: Simulate real database data
  console.log('Test 8: Simulate real database data');
  try {
    // Simulate what might be in the database
    const dbData = '{"encrypted":"someencrypteddata","iv":"someiv","authTag":"someauth"}';
    const result = await decrypt(dbData);
    console.log('✅ Handled database-like data');
    console.log('Result type:', typeof result);
    console.log('Result length:', result ? result.length : 0);
  } catch (error) {
    console.error('❌ Test 8 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 9: Encrypt null/undefined
  console.log('Test 9: Encrypt null/undefined');
  try {
    const result1 = await encrypt(null);
    const result2 = await encrypt(undefined);
    console.log('✅ Encrypt null:', result1);
    console.log('✅ Encrypt undefined:', result2);
  } catch (error) {
    console.error('❌ Test 9 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 10: Round trip with truncation
  console.log('Test 10: Round trip with truncation');
  try {
    const original = 'a'.repeat(250); // 250 chars
    const encrypted = await encrypt(original);
    const decrypted = await decrypt(encrypted);
    console.log('Original length:', original.length);
    console.log('Decrypted length:', decrypted.length);
    console.log('Truncated correctly:', decrypted.length <= 200 ? '✅ YES' : '❌ NO');
    console.log('First 10 chars match:', original.substring(0, 10) === decrypted.substring(0, 10) ? '✅ YES' : '❌ NO');
  } catch (error) {
    console.error('❌ Test 10 failed:', error.message);
  }

  console.log('\n🎉 Encryption/Decryption Tests Complete!\n');
}

runAllTests().catch(console.error);
