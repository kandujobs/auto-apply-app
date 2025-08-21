const crypto = require('crypto');

// Encryption key (should be in environment variables in production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-here-32-chars-long';

/**
 * Check if encrypted data is in legacy format
 */
function isLegacyFormat(encryptedText) {
  try {
    // Try to parse as JSON (new format)
    JSON.parse(Buffer.from(encryptedText, 'base64').toString());
    return false; // It's new format
  } catch {
    return true; // It's legacy format
  }
}

/**
 * Decrypt legacy XOR format
 */
function decryptLegacy(encryptedText) {
  try {
    // Decode from base64
    const decoded = Buffer.from(encryptedText, 'base64').toString();
    let result = '';
    
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    
    return result;
  } catch (error) {
    console.error('Legacy decryption error:', error);
    throw new Error('Failed to decrypt legacy data');
  }
}

/**
 * Encrypt using new AES-256-GCM format
 */
async function encrypt(text) {
  try {
    if (!text) {
      return null;
    }

    // Generate a random IV
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    
    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    // Return encrypted data
    const encryptedObject = {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
    
    return Buffer.from(JSON.stringify(encryptedObject)).toString('base64');
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt using new AES-256-GCM format
 */
async function decrypt(encryptedText) {
  try {
    if (!encryptedText) {
      return null;
    }

    // Check if it's legacy format
    if (isLegacyFormat(encryptedText)) {
      console.log('Detected legacy format, using legacy decryption');
      return decryptLegacy(encryptedText);
    }

    // Parse the encrypted data
    const data = JSON.parse(Buffer.from(encryptedText, 'base64').toString());
    
    // Extract the encrypted text, IV, and auth tag
    const encryptedText_hex = data.encrypted;
    const iv = Buffer.from(data.iv, 'hex');
    const authTag = Buffer.from(data.authTag, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    let decrypted = decipher.update(encryptedText_hex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Migrate legacy encrypted data to new format
 */
async function migrateLegacyCredentials(encryptedText) {
  try {
    // Decrypt using legacy method
    const decrypted = decryptLegacy(encryptedText);
    
    // Re-encrypt using new method
    return await encrypt(decrypted);
  } catch (error) {
    console.error('Migration error:', error);
    throw new Error('Failed to migrate credentials');
  }
}

module.exports = {
  encrypt,
  decrypt,
  isLegacyFormat,
  migrateLegacyCredentials
};
