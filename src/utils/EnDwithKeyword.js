import crypto from 'crypto';

/**
 * Encrypts data using AES-256-CBC with a user-provided keyword
 * 
 * @param {string} data - The plaintext to encrypt
 * @param {string} keyword - User's personal keyword/phrase for key derivation
 * @returns {string} - Base64 encoded encrypted string (iv:encryptedData)
 */
function encryptWithKeyword(data, keyword) {
  try {
    // Generate a secure key from the user's keyword using PBKDF2
    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(keyword, salt, 100000, 32, 'sha512');
    
    // Create initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Return salt, iv, and encrypted data as a single string
    return Buffer.concat([
      salt,
      iv, 
      Buffer.from(encrypted, 'base64')
    ]).toString('base64');
  } catch (error) {
    console.error('Encryption failed:', error.message);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data using AES-256-CBC with a user-provided keyword
 * 
 * @param {string} encryptedData - The base64 encoded encrypted string
 * @param {string} keyword - User's personal keyword/phrase for key derivation
 * @returns {string} - Original plaintext
 */
function decryptWithKeyword(encryptedData, keyword) {
  try {
    // Decode the base64 string
    const buffer = Buffer.from(encryptedData, 'base64');
    
    // Extract salt, iv and encrypted data
    const salt = buffer.subarray(0, 16);
    const iv = buffer.subarray(16, 32);
    const encrypted = buffer.subarray(32).toString('base64');
    
    // Derive key from keyword and salt
    const key = crypto.pbkdf2Sync(keyword, salt, 100000, 32, 'sha512');
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    throw new Error('Failed to decrypt data - invalid key or corrupted data');
  }
}

export {
  encryptWithKeyword,
  decryptWithKeyword
}