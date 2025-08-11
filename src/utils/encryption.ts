// Simple encryption utility for storing sensitive data
// In production, you should use a more robust encryption library

const ENCRYPTION_KEY = 'your-secret-key-here'; // In production, use environment variable

/**
 * Simple encryption function
 * Note: This is a basic implementation. In production, use a proper encryption library
 */
export function encrypt(text: string): string {
  try {
    // Simple XOR encryption (for demo purposes)
    // In production, use a proper encryption library like crypto-js or node:crypto
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result); // Base64 encode
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Simple decryption function
 * Note: This is a basic implementation. In production, use a proper encryption library
 */
export function decrypt(encryptedText: string): string {
  try {
    // Decode from base64
    const decoded = atob(encryptedText);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash a string (one-way encryption)
 */
export function hash(text: string): string {
  let hash = 0;
  if (text.length === 0) return hash.toString();
  
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Validate if a string looks like an email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate if a string looks like a password
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6; // Basic validation
} 