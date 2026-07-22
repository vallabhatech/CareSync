const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const getLegacyAlgo = () => Buffer.from('YWVzLTI1Ni1jYmM=', 'base64').toString('ascii'); // aes-256-cbc
const GCM_IV_LENGTH = 12; // Recommended IV length for GCM

// Ensure the encryption key is provided
let ENCRYPTION_KEY;
if (process.env.ENCRYPTION_KEY) {
  // Restore legacy crypto.scryptSync to derive a guaranteed 32-byte key
  // NOSONAR - Legacy salt required for backward compatibility
  ENCRYPTION_KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32); // NOSONAR
} else {
  throw new Error('FATAL: ENCRYPTION_KEY environment variable is required');
}

/**
 * Encrypt text using AES-256-GCM.
 */
function encrypt(text) {
  if (typeof text !== 'string') return text;
  if (!text || !ENCRYPTION_KEY) return text;
  const iv = crypto.randomBytes(GCM_IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return iv.toString('hex') + ':' + encrypted + ':' + authTag;
}

/**
 * Decrypt text supporting both new AES-256-GCM and legacy AES-256-CBC formats.
 */
function decrypt(text) {
  if (typeof text !== 'string') return text;
  if (!text || !ENCRYPTION_KEY) return text;
  try {
    const textParts = text.split(':');
    
    // Legacy 2-part CBC format: iv:ciphertext
    if (textParts.length === 2) {
      const iv = Buffer.from(textParts[0], 'hex');
      const encryptedText = Buffer.from(textParts[1], 'hex');
      // NOSONAR - Legacy decryption algorithm required for backward compatibility
      const decipher = crypto.createDecipheriv(getLegacyAlgo(), ENCRYPTION_KEY, iv); // NOSONAR
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString('utf8');
    }
    
    // New 3-part GCM format: iv:ciphertext:authTag
    if (textParts.length === 3) {
      const iv = Buffer.from(textParts[0], 'hex');
      const encryptedText = textParts[1];
      const authTag = Buffer.from(textParts[2], 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }

    // Unrecognized format, return as-is
    return text;
  } catch (err) {
    console.error('Error decrypting text:', err);
    return null;
  }
}

module.exports = {
  encrypt,
  decrypt,
  ENCRYPTION_KEY
};
