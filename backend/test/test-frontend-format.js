const crypto = require('crypto');

console.log('🔍 Testing Frontend Encryption Format\n');

// Simulate the frontend encryption format
function simulateFrontendEncryption(text) {
  // This is what the frontend does:
  // 1. Uses Web Crypto API with AES-CBC
  // 2. Creates a JSON object with version, iv, data, timestamp
  // 3. Base64 encodes the JSON string
  
  const mockEncryptedObject = {
    version: 'v2',
    iv: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], // 16 bytes
    data: [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115], // encrypted data
    timestamp: Date.now()
  };
  
  const jsonString = JSON.stringify(mockEncryptedObject);
  const base64String = Buffer.from(jsonString).toString('base64');
  
  return base64String;
}

// Test what the frontend format looks like
const testPassword = 'myPassword123!';
const frontendFormat = simulateFrontendEncryption(testPassword);

console.log('Frontend encryption format:');
console.log('Input password:', testPassword);
console.log('Frontend encrypted (base64):', frontendFormat);
console.log('Frontend encrypted length:', frontendFormat.length);

// Decode the base64 to see the JSON structure
try {
  const decoded = Buffer.from(frontendFormat, 'base64').toString();
  console.log('Decoded JSON:', decoded);
  console.log('JSON length:', decoded.length);
  
  const parsed = JSON.parse(decoded);
  console.log('Parsed object:', parsed);
  console.log('Version:', parsed.version);
  console.log('IV length:', parsed.iv.length);
  console.log('Data length:', parsed.data.length);
  
} catch (error) {
  console.error('Error decoding frontend format:', error);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test what happens when our backend tries to decrypt this
const { decrypt } = require('../src/utils/encryption');

async function testBackendDecryption() {
  console.log('Testing backend decryption of frontend format...');
  
  try {
    const result = await decrypt(frontendFormat);
    console.log('Backend decryption result:', result);
  } catch (error) {
    console.log('Backend decryption failed:', error.message);
  }
}

testBackendDecryption();
