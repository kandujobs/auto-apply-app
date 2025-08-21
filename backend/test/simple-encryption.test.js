const { decrypt, encrypt } = require('../src/utils/encryption');

console.log('🔐 Simple Encryption/Decryption Test\n');

async function runTests() {
  // Test 1: Basic functionality
  console.log('Test 1: Basic encryption/decryption');
  try {
    const password = 'myPassword123!';
    const encrypted = await encrypt(password);
    const decrypted = await decrypt(encrypted);
    
    console.log('✅ Encryption/decryption successful');
    console.log('Password match:', decrypted === password ? '✅ YES' : '❌ NO');
    console.log('Password length:', decrypted.length);
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  console.log('\n' + '-'.repeat(30) + '\n');

  // Test 2: Long password
  console.log('Test 2: Long password handling');
  try {
    const longPassword = 'a'.repeat(300);
    const encrypted = await encrypt(longPassword);
    const decrypted = await decrypt(encrypted);
    
    console.log('✅ Long password handled');
    console.log('Original length:', longPassword.length);
    console.log('Decrypted length:', decrypted.length);
    console.log('Truncated correctly:', decrypted.length <= 200 ? '✅ YES' : '❌ NO');
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }

  console.log('\n' + '-'.repeat(30) + '\n');

  // Test 3: Already decrypted data
  console.log('Test 3: Already decrypted data');
  try {
    const result = await decrypt('plaintextpassword');
    console.log('✅ Handled plain text:', result);
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }

  console.log('\n🎉 Simple tests complete!\n');
}

runTests().catch(console.error);
