const { decrypt, encrypt } = require('../src/utils/encryption');

console.log('🔍 Debugging Database Credential Format\n');

// Test different possible formats that might be in the database
const testCases = [
  {
    name: 'Plain text password (what we expect)',
    data: 'myPassword123!'
  },
  {
    name: 'Old encryption format (might be in DB)',
    data: '{"encrypted":"oldformat","iv":"oldiv","authTag":"oldtag"}'
  },
  {
    name: 'Just the encrypted string (no JSON)',
    data: 'justsomeencryptedstring'
  },
  {
    name: 'Base64 encoded data',
    data: 'bXlQYXNzd29yZDEyMyE=' // base64 of 'myPassword123!'
  },
  {
    name: 'Very long string (what we saw in logs)',
    data: 'a'.repeat(500)
  },
  {
    name: 'JSON with extra data',
    data: '{"encrypted":"data","iv":"iv","authTag":"tag","extra":"stuff"}'
  }
];

async function debugFormats() {
  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${testCase.name}`);
    console.log(`Input: ${testCase.data.substring(0, 50)}${testCase.data.length > 50 ? '...' : ''}`);
    console.log(`Length: ${testCase.data.length} characters`);
    
    try {
      const result = await decrypt(testCase.data);
      console.log(`✅ Decryption result: ${result ? result.substring(0, 50) : 'null'}${result && result.length > 50 ? '...' : ''}`);
      console.log(`Result length: ${result ? result.length : 0} characters`);
      console.log(`Is reasonable password: ${result && result.length > 0 && result.length <= 50 ? '✅ YES' : '❌ NO'}`);
    } catch (error) {
      console.log(`❌ Decryption failed: ${error.message}`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('🎯 Analysis:');
  console.log('- If result length > 50, it\'s probably not a real password');
  console.log('- If result contains JSON structure, it\'s encrypted data');
  console.log('- If result is very long, it\'s likely the wrong format');
  console.log('- Real LinkedIn passwords should be 8-50 characters');
}

debugFormats().catch(console.error);
