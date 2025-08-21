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
      // Ensure it's not too long for LinkedIn (max 200 chars)
      if (encryptedData.length > 200) {
        console.log('Decrypted data is too long, truncating to first 200 characters');
        return encryptedData.substring(0, 200);
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
      if (encryptedData.length > 200) {
        console.log('Plain text data is too long, truncating to first 200 characters');
        return encryptedData.substring(0, 200);
      }
      return encryptedData; // Return as-is if it's not JSON
    }

    // Check if it has the expected structure
    if (!data.encrypted || !data.iv || !data.authTag) {
      console.log('Data does not have expected encryption structure, returning as-is');
      if (encryptedData.length > 200) {
        console.log('Data is too long, truncating to first 200 characters');
        return encryptedData.substring(0, 200);
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
    
    // Ensure the decrypted password is not too long for LinkedIn
    if (decrypted.length > 200) {
      console.log('Decrypted password is too long, truncating to first 200 characters');
      decrypted = decrypted.substring(0, 200);
    }
    
    console.log(`Decrypted password length: ${decrypted.length} characters`);
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting data:', error);
    console.log('Returning original data as fallback');
    // If decryption fails, try to return a reasonable length string
    if (encryptedData && typeof encryptedData === 'string') {
      if (encryptedData.length > 200) {
        console.log('Fallback data is too long, truncating to first 200 characters');
        return encryptedData.substring(0, 200);
      }
      return encryptedData;
    }
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
