const crypto = require('crypto');

// Get encryption key from environment or use a secure default
const getEncryptionKey = () => {
  return process.env.ENCRYPTION_KEY || 'your-secret-key-here-32-chars-long';
};

/**
 * Derive a key from the master encryption key using PBKDF2
 */
async function deriveKey(password) {
  const salt = Buffer.from('linkedin-credentials-salt-v2', 'utf8');
  
  // Use the modern async crypto API
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    Buffer.from(password, 'utf8'),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 200000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-CBC', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Secure encryption function using AES-256-CBC
 * Returns a JSON string with version, IV, and encrypted data
 */
async function encrypt(text) {
  try {
    const key = await deriveKey(getEncryptionKey());
    const iv = crypto.randomBytes(16); // Use 16 bytes for AES
    
    // Use the modern async crypto API
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      key,
      Buffer.from(text, 'utf8')
    );
    
    // Create encrypted object with version and metadata
    const encryptedObject = {
      version: 'v2',
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted)),
      timestamp: Date.now()
    };
    
    // Convert to base64 for storage
    return Buffer.from(JSON.stringify(encryptedObject)).toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Secure decryption function using AES-256-CBC
 * Supports both new v2 format and legacy XOR format
 */
async function decrypt(encryptedText) {
  try {
    // First, try to parse as JSON (new v2 format)
    try {
      const encryptedObject = JSON.parse(Buffer.from(encryptedText, 'base64').toString());
      
      if (encryptedObject.version === 'v2') {
        return await decryptV2(encryptedObject);
      }
    } catch (parseError) {
      // If JSON parsing fails, try legacy XOR decryption
      return decryptLegacy(encryptedText);
    }
    
    // If we get here, it's an unknown format
    throw new Error('Unknown encryption format');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Decrypt v2 format (AES-256-CBC)
 */
async function decryptV2(encryptedObject) {
  try {
    const key = await deriveKey(getEncryptionKey());
    
    // Convert arrays back to Buffer
    const iv = Buffer.from(encryptedObject.iv);
    const encrypted = Buffer.from(encryptedObject.data);
    
    // Use the modern async crypto API
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      key,
      encrypted
    );
    
    return Buffer.from(decrypted).toString('utf8');
  } catch (error) {
    console.error('V2 decryption error:', error);
    throw new Error('Failed to decrypt v2 data');
  }
}

/**
 * Decrypt legacy XOR format (for backward compatibility)
 */
function decryptLegacy(encryptedText) {
  try {
    const ENCRYPTION_KEY = getEncryptionKey();
    
    // Decode from base64
    const decoded = Buffer.from(encryptedText, 'base64').toString();
    let result = '';
    
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    
    // The legacy method stored base64-encoded passwords, so decode it
    try {
      return Buffer.from(result, 'base64').toString('utf8');
    } catch {
      // If base64 decode fails, return the raw result
      return result;
    }
  } catch (error) {
    console.error('Legacy decryption error:', error);
    throw new Error('Failed to decrypt legacy data');
  }
}

/**
 * Check if encrypted data is in legacy format
 */
function isLegacyFormat(encryptedText) {
  try {
    JSON.parse(Buffer.from(encryptedText, 'base64').toString());
    return false; // It's v2 format
  } catch {
    return true; // It's legacy format
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

/**
 * Hash a string (one-way encryption) - improved implementation
 */
function hash(text) {
  try {
    return crypto.createHash('sha256').update(text).digest('hex');
  } catch (error) {
    console.error('Hashing error:', error);
    throw new Error('Failed to hash data');
  }
}

module.exports = {
  encrypt,
  decrypt,
  decryptV2,
  decryptLegacy,
  isLegacyFormat,
  migrateLegacyCredentials,
  hash
};
