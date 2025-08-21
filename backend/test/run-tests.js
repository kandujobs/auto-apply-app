#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Running Backend Tests\n');

// Run encryption tests
console.log('🔐 Running Encryption Tests...\n');
const encryptionTest = spawn('node', ['test/encryption.test.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

encryptionTest.on('close', (code) => {
  console.log(`\n🔐 Encryption tests completed with code ${code}\n`);
  
  if (code === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
});

encryptionTest.on('error', (error) => {
  console.error('❌ Error running encryption tests:', error);
  process.exit(1);
});
