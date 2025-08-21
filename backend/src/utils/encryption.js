const crypto = require('crypto');

// Encryption key (should be in environment variables in production)
// Generate a proper 32-byte key for AES-256
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const ALGORITHM = 'aes-256-gcm';

// Function to decrypt data
async function decrypt(encryptedData) {
  try {
    // Handle case where data might already be decrypted
    if (!encryptedData) {
      console.log('No encrypted data provided');
      return null;
    }

    // If the data is already a string (not encrypted), return it
    if (typeof encryptedData === 'string' && !encryptedData.includes('"encrypted"')) {
      console.log('Data appears to be already decrypted');
      // Check if this looks like a reasonable password
      if (encryptedData.length > 50) {
        console.log(`⚠️ WARNING: Decrypted data is ${encryptedData.length} characters long - this is probably not a real password!`);
        console.log(`Data preview: ${encryptedData.substring(0, 100)}...`);
        // Don't truncate - this indicates a problem with the data format
        throw new Error(`Decrypted data is too long (${encryptedData.length} chars) - likely wrong format`);
      }
      return encryptedData;
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(encryptedData);
    } catch (parseError) {
      console.log('Data is not valid JSON, treating as plain text');
      // If it's not JSON, it might be plain text password
      if (encryptedData.length > 50) {
        console.log(`⚠️ WARNING: Plain text data is ${encryptedData.length} characters long - this is probably not a real password!`);
        throw new Error(`Plain text data is too long (${encryptedData.length} chars) - likely wrong format`);
      }
      return encryptedData; // Return as-is if it's not JSON
    }

    // Check if it has the expected structure
    if (!data.encrypted || !data.iv || !data.authTag) {
      console.log('Data does not have expected encryption structure, returning as-is');
      if (encryptedData.length > 50) {
        console.log(`⚠️ WARNING: Data without encryption structure is ${encryptedData.length} characters long - this is probably not a real password!`);
        throw new Error(`Data without encryption structure is too long (${encryptedData.length} chars) - likely wrong format`);
      }
      return encryptedData;
    }

    // Extract the encrypted text, IV, and auth tag
    const encryptedText = data.encrypted;
    const iv = Buffer.from(data.iv, 'hex');
    const authTag = Buffer.from(data.authTag, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Check if the decrypted result looks like a reasonable password
    if (decrypted.length > 50) {
      console.log(`⚠️ WARNING: Decrypted result is ${decrypted.length} characters long - this is probably not a real password!`);
      console.log(`Decrypted preview: ${decrypted.substring(0, 100)}...`);
      throw new Error(`Decrypted result is too long (${decrypted.length} chars) - likely wrong encryption format`);
    }
    
    console.log(`Decrypted password length: ${decrypted.length} characters`);
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting data:', error);
    console.log('Returning null instead of corrupted data');
    return null;
  }
}

// Function to encrypt data
async function encrypt(text) {
  try {
    if (!text) {
      return null;
    }

    // Generate a random IV
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    
    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    // Return encrypted data
    return JSON.stringify({
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    });
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
}

module.exports = {
  decrypt,
  encrypt
};
