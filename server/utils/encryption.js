// Encryption utilities using libsodium-wrappers
// Provides key generation, message encryption/decryption for end‑to‑end encryption

const sodium = require('libsodium-wrappers');

// Ensure libsodium is initialized before any operation
const ready = sodium.ready;

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
};
