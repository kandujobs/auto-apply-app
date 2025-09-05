const crypto = require('crypto');

// Encryption key (should be in environment variables in production)
// Generate a proper 32-byte key for AES-256
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-here-32-chars-long';
const ALGORITHM = 'aes-256-gcm';

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

// Function to decrypt data
async function decrypt(encryptedData) {
  try {
    // Handle case where data might already be decrypted
    if (!encryptedData) {
      console.log('No encrypted data provided');
      return null;
    }

    // Check if this looks like base64 encoded data (frontend format)
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
        // Don't truncate - this indicates a problem with the data format
        throw new Error(`Decrypted data is too long (${encryptedData.length} chars) - likely wrong format`);
      }
      return encryptedData;
    }

    // Try to parse as JSON (backend format)
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

    // Check if it has the expected structure (backend format)
    if (!data.encrypted || !data.iv || !data.authTag) {
      console.log('Data does not have expected encryption structure, returning as-is');
      if (encryptedData.length > 50) {
        console.log(`⚠️ WARNING: Data without encryption structure is ${encryptedData.length} characters long - this is probably not a real password!`);
        throw new Error(`Data without encryption structure is too long (${encryptedData.length} chars) - likely wrong format`);
      }
      return encryptedData;
    }

    // Extract the encrypted text, IV, and auth tag (backend format)
    const encryptedText = data.encrypted;
    const iv = Buffer.from(data.iv, 'hex');
    const authTag = Buffer.from(data.authTag, 'hex');
    
    // Create decipher - use the key directly as a buffer (not hex)
    const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'utf8');
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
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

// Function to encrypt data (backend format)
async function encrypt(text) {
  try {
    if (!text) {
      return null;
    }

    // Generate a random IV
    const iv = crypto.randomBytes(16);
    
    // Create cipher - use the key directly as a buffer (not hex)
    const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'utf8');
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
    
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
