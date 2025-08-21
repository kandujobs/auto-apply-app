# Backend Tests

This folder contains comprehensive tests for the backend functionality.

## Test Files

### `encryption.test.js`
Comprehensive encryption/decryption tests including:
- Basic encryption/decryption functionality
- Long password handling (LinkedIn 200 char limit)
- Special characters
- Already decrypted data
- Invalid JSON handling
- Null/undefined data
- Empty strings
- Database-like data simulation
- Round trip testing with truncation

### `simple-encryption.test.js`
Simple encryption test without external dependencies:
- Basic functionality
- Long password handling
- Plain text data handling

### `session-manager.test.js`
Session manager integration tests (requires Jest):
- Credential decryption in session context
- Long password handling
- Special character handling

### `run-tests.js`
Test runner script to execute all tests.

## Running Tests

### Run all tests:
```bash
cd backend
node test/run-tests.js
```

### Run specific tests:
```bash
cd backend
node test/encryption.test.js
node test/simple-encryption.test.js
```

### Run simple test (recommended for quick check):
```bash
cd backend
node test/simple-encryption.test.js
```

## Test Coverage

The tests cover:
- ✅ Encryption/decryption functionality
- ✅ Password length validation (LinkedIn compliance)
- ✅ Error handling for malformed data
- ✅ Edge cases (null, undefined, empty strings)
- ✅ Special character handling
- ✅ Integration with session manager

## Expected Results

All tests should pass with:
- ✅ Encryption/decryption working correctly
- ✅ Passwords truncated to 200 characters max
- ✅ Proper error handling for edge cases
- ✅ No crashes or unhandled exceptions
