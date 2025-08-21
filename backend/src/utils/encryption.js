const crypto = require('crypto');

// Encryption key (should be in environment variables in production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-here-make-it-32-chars-long';
const ALGORITHM = 'aes-256-gcm';

// Function to decrypt data
async function decrypt(encryptedData) {
  try {
    // Parse the encrypted data
    const data = JSON.parse(encryptedData);
    
    // Extract the encrypted text, IV, and auth tag
    const encryptedText = data.encrypted;
    const iv = Buffer.from(data.iv, 'hex');
    const authTag = Buffer.from(data.authTag, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Function to encrypt data
async function encrypt(text) {
  try {
    // Create cipher
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    
    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get IV and auth tag
    const iv = cipher.getAuthTag();
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
