import * as crypto from 'crypto';

// Get encryption key from environment or use a secure default
const getEncryptionKey = (): string => {
  return process.env.ENCRYPTION_KEY || 'your-secret-key-here-32-chars-long';
};

/**
 * Derive a key from the master encryption key using PBKDF2
 */
async function deriveKey(password: string): Promise<CryptoKey> {
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
 * Secure decryption function using AES-256-CBC
 * Supports both new v2 format and legacy XOR format
 */
export async function decrypt(encryptedText: string): Promise<string> {
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
async function decryptV2(encryptedObject: any): Promise<string> {
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
function decryptLegacy(encryptedText: string): string {
  try {
    const ENCRYPTION_KEY = getEncryptionKey();
    
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
 * Check if encrypted data is in legacy format
 */
export function isLegacyFormat(encryptedText: string): boolean {
  try {
    JSON.parse(Buffer.from(encryptedText, 'base64').toString());
    return false; // It's v2 format
  } catch {
    return true; // It's legacy format
  }
}

/**
 * Hash a string (one-way encryption) - improved implementation
 */
export function hash(text: string): string {
  try {
    return crypto.createHash('sha256').update(text).digest('hex');
  } catch (error) {
    console.error('Hashing error:', error);
    throw new Error('Failed to hash data');
  }
}
