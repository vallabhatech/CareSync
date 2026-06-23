const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

// Derive a 32-byte key from the JWT_SECRET (or use a fallback for safety, though JWT_SECRET is required)
const getEncryptionKey = () => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key-32-chars-long!';
  return crypto.createHash('sha256').update(String(secret)).digest('base64').substring(0, 32);
};

/**
 * Encrypts a plaintext string.
 * Returns a string in the format: "iv:authTag:encryptedData"
 */
const encrypt = (text) => {
  if (!text) return text;
  
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(getEncryptionKey()), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts an encrypted string in the format: "iv:authTag:encryptedData"
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return encryptedText;
  
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    // If it doesn't match the format, it might be legacy plaintext (before encryption was added)
    return encryptedText;
  }
  
  try {
    const [ivHex, authTagHex, encryptedDataHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(getEncryptionKey()), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err.message);
    // If decryption fails, return null or throw depending on desired failure mode
    return null;
  }
};

module.exports = {
  encrypt,
  decrypt
};
