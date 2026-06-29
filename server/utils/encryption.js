// Encryption utilities using libsodium-wrappers
// Provides key generation, message encryption/decryption for end‑to‑end encryption

const sodium = require('libsodium-wrappers');
const crypto = require('crypto');

// Ensure libsodium is initialized before any operation
const ready = sodium.ready;

const ALGORITHM = 'aes-256-gcm';

// Derive a 32-byte key from the JWT_SECRET environment variable.
// JWT_SECRET must always be set — the server should never operate with a
// predictable/hardcoded key, which would be a critical CWE-321 vulnerability.
const getEncryptionKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured. Encryption cannot proceed without a secret key.');
  }
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

/**
 * Generate a public/private key pair.
 * Returns an object { publicKey: string, privateKey: string } where keys are base64‑encoded.
 */
async function generateKeyPair() {
  await ready;
  const keyPair = sodium.crypto_box_keypair();
  return {
    publicKey: Buffer.from(keyPair.publicKey).toString('base64'),
    privateKey: Buffer.from(keyPair.privateKey).toString('base64'),
  };
}

/**
 * Encrypt a message for a recipient using their public key.
 * @param {string} recipientPublicKeyBase64 - base64 encoded public key of the recipient
 * @param {string|Buffer} message - plaintext message
 * @returns {Promise<string>} - base64 encoded ciphertext
 */
async function encryptMessage(recipientPublicKeyBase64, message) {
  await ready;
  const recipientPublicKey = Buffer.from(recipientPublicKeyBase64, 'base64');
  const msgBuf = Buffer.isBuffer(message) ? message : Buffer.from(message);
  const ciphertext = sodium.crypto_box_seal(msgBuf, recipientPublicKey);
  return Buffer.from(ciphertext).toString('base64');
}

/**
 * Decrypt a ciphertext using the receiver's private key.
 * @param {string} privateKeyBase64 - base64 encoded private key
 * @param {string} ciphertextBase64 - base64 encoded ciphertext
 * @returns {Promise<string>} - decrypted plaintext string
 */
async function decryptMessage(privateKeyBase64, ciphertextBase64) {
  await ready;
  const privateKey = Buffer.from(privateKeyBase64, 'base64');
  const ciphertext = Buffer.from(ciphertextBase64, 'base64');
  const decrypted = sodium.crypto_box_seal_open(ciphertext, privateKey);
  return Buffer.from(decrypted).toString('utf-8');
}

module.exports = {
  generateKeyPair,
  encryptMessage,
  decryptMessage,
  encrypt,
  decrypt,
};
