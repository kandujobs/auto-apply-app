const crypto = require('crypto');

// Encryption key (should be in environment variables in production)
// Generate a proper 32-byte key for AES-256
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-here-32-chars-long';
const ALGORITHM = 'aes-256-cbc';

// Function to derive key using PBKDF2 (matching frontend)
async function deriveKey(password) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      'linkedin-credentials-salt-v2',
      200000, // iterations
      32, // key length
      'sha256',
      (err, key) => {
        if (err) reject(err);
        else resolve(key);
      }
    );
  });
}

// Function to decrypt legacy XOR format
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

// Function to decrypt data - matches frontend v2 format
async function decrypt(encryptedData) {
  try {
    // Handle case where data might already be decrypted
    if (!encryptedData) {
      console.log('No encrypted data provided');
      return null;
    }

    // Check if this looks like base64 encoded data (frontend v2 format)
    if (typeof encryptedData === 'string' && encryptedData.length > 50) {
      try {
        // Try to decode as base64 first
        const decoded = Buffer.from(encryptedData, 'base64').toString();
        const parsed = JSON.parse(decoded);
        
        // Check if it's the frontend v2 format
        if (parsed.version === 'v2' && parsed.iv && parsed.data) {
          console.log('Detected frontend v2 format, decrypting...');
          return await decryptFrontendV2(parsed);
        }
      } catch (parseError) {
        // Not base64 or not JSON, continue with other checks
        console.log('Not frontend v2 format, checking other formats...');
      }
    }

    // Check if it's legacy format (XOR encryption)
    try {
      const legacyResult = decryptLegacy(encryptedData);
      console.log('Detected legacy format, decrypted successfully');
      return legacyResult;
    } catch (legacyError) {
      console.log('Not legacy format, checking other formats...');
    }

    // If the data is already a string (not encrypted), return it
    if (typeof encryptedData === 'string' && !encryptedData.includes('"encrypted"')) {
      console.log('Data appears to be already decrypted');
      // Check if this looks like a reasonable password
      if (encryptedData.length > 50) {
        console.log(`⚠️ WARNING: Decrypted data is ${encryptedData.length} characters long - this is probably not a real password!`);
        console.log(`Data preview: ${encryptedData.substring(0, 100)}...`);
        throw new Error(`Decrypted data is too long (${encryptedData.length} chars) - likely wrong format`);
      }
      return encryptedData;
    }

    // If we get here, it's an unknown format
    console.log('Unknown encryption format');
    return null;
  } catch (error) {
    console.error('Error decrypting data:', error);
    console.log('Returning null instead of corrupted data');
    return null;
  }
}

// Function to decrypt frontend v2 format (AES-CBC)
async function decryptFrontendV2(encryptedObject) {
  try {
    // Derive key using PBKDF2 (matching frontend)
    const key = await deriveKey(ENCRYPTION_KEY);
    
    // Convert arrays back to Buffer
    const iv = Buffer.from(encryptedObject.iv);
    const encrypted = Buffer.from(encryptedObject.data);
    
    // Create decipher for AES-CBC
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    // Convert back to string
    const result = decrypted.toString('utf8');
    
    // Check if the decrypted result looks like a reasonable password
    if (result.length > 50) {
      console.log(`⚠️ WARNING: Frontend decrypted result is ${result.length} characters long - this is probably not a real password!`);
      throw new Error(`Frontend decrypted result is too long (${result.length} chars) - likely wrong encryption format`);
    }
    
    console.log(`Frontend decrypted password length: ${result.length} characters`);
    
    return result;
  } catch (error) {
    console.error('Error decrypting frontend v2 format:', error);
    throw error;
  }
}

// Function to encrypt data (matches frontend v2 format)
async function encrypt(text) {
  try {
    if (!text) {
      return null;
    }

    // Derive key using PBKDF2 (matching frontend)
    const key = await deriveKey(ENCRYPTION_KEY);
    
    // Generate a random IV (16 bytes for AES-CBC)
    const iv = crypto.randomBytes(16);
    
    // Create cipher for AES-CBC
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Create encrypted object with version and metadata (matching frontend)
    const encryptedObject = {
      version: 'v2',
      iv: Array.from(iv),
      data: Array.from(encrypted),
      timestamp: Date.now()
    };
    
    // Convert to base64 for storage (matching frontend)
    return Buffer.from(JSON.stringify(encryptedObject)).toString('base64');
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
}

module.exports = {
  decrypt,
  encrypt
};
