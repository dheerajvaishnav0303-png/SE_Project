import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

const keyBuffer = Buffer.from(env.ENCRYPTION_KEY, 'hex');

/**
 * Encrypts a string using AES-256-GCM.
 * Output format: base64(IV [12 bytes] + AuthTag [16 bytes] + Ciphertext)
 * @param {string} plaintext 
 * @returns {string} Base64 encoded payload
 */
export function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') {
    return plaintext;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Pack: IV (12) + Tag (16) + Ciphertext
  const packed = Buffer.concat([iv, authTag, encrypted]);
  return packed.toString('base64');
}

/**
 * Decrypts an AES-256-GCM encrypted base64 payload.
 * @param {string} packedBase64 
 * @returns {string} Original plaintext
 */
export function decrypt(packedBase64) {
  if (packedBase64 === null || packedBase64 === undefined || packedBase64 === '') {
    return packedBase64;
  }

  const packedBuffer = Buffer.from(packedBase64, 'base64');

  if (packedBuffer.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted payload: buffer too short.');
  }

  const iv = packedBuffer.subarray(0, IV_LENGTH);
  const authTag = packedBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = packedBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Generates an HMAC-SHA256 blind index hash for search queries on encrypted fields.
 * @param {string} text 
 * @returns {string} Hex hash
 */
export function hashBlindIndex(text) {
  if (!text) return text;
  return crypto.createHmac('sha256', keyBuffer).update(String(text).trim().toUpperCase()).digest('hex');
}

