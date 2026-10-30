import test from 'node:test';
import assert from 'node:assert/strict';

// Set minimal env required for tests
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.MONGO_URI = 'mongodb://localhost:27017/ips_test';
process.env.JWT_ACCESS_SECRET = 'test_jwt_access_secret_institutional_grade_32chars_min!';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_institutional_grade_32chars_min!';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

import { encrypt, decrypt, hashBlindIndex } from '../../src/utils/crypto.js';
import { hashToken, generateRefreshTokenString } from '../../src/utils/tokenHelper.js';
import { registerSchema, loginSchema, twoFactorVerifySchema } from '../../src/validators/authValidators.js';

test('AES-256-GCM: encrypts and decrypts sensitive PII with round-trip integrity', () => {
  const pan = 'ABCDE1234F';
  const encrypted = encrypt(pan);

  assert.notEqual(encrypted, pan);
  assert.match(encrypted, /^[A-Za-z0-9+/=]+$/); // Valid Base64

  const decrypted = decrypt(encrypted);
  assert.equal(decrypted, pan);
});

test('AES-256-GCM: handles empty or null values gracefully', () => {
  assert.equal(encrypt(null), null);
  assert.equal(encrypt(undefined), undefined);
  assert.equal(encrypt(''), '');
  assert.equal(decrypt(null), null);
  assert.equal(decrypt(undefined), undefined);
  assert.equal(decrypt(''), '');
});

test('Blind Index: generates deterministic HMAC-SHA256 hashes', () => {
  const pan1 = 'ABCDE1234F';
  const pan2 = 'abcde1234f '; // Case & whitespace insensitive
  assert.equal(hashBlindIndex(pan1), hashBlindIndex(pan2));
});

test('Token Helper: generates cryptographically random strings and hashes', () => {
  const token1 = generateRefreshTokenString();
  const token2 = generateRefreshTokenString();
  assert.notEqual(token1, token2);

  const hash1 = hashToken(token1);
  const hash2 = hashToken(token1);
  assert.equal(hash1, hash2); // Deterministic hash
});

test('Zod Auth Validators: enforces institutional password complexity', () => {
  // Invalid passwords
  assert.throws(() => registerSchema.parse({
    email: 'investor@ips-wealth.com',
    password: 'weak',
    firstName: 'Rahul',
    lastName: 'Sharma'
  }));

  assert.throws(() => registerSchema.parse({
    email: 'investor@ips-wealth.com',
    password: 'NoSpecialOrNumbers',
    firstName: 'Rahul',
    lastName: 'Sharma'
  }));

  // Valid registration
  const valid = registerSchema.parse({
    email: 'investor@ips-wealth.com',
    password: 'SecurePassword123!',
    firstName: 'Rahul',
    lastName: 'Sharma'
  });
  assert.equal(valid.email, 'investor@ips-wealth.com');
  assert.equal(valid.firstName, 'Rahul');
});

test('Zod Auth Validators: validates 6-digit TOTP codes', () => {
  assert.throws(() => twoFactorVerifySchema.parse({ totpCode: '123' }));
  assert.throws(() => twoFactorVerifySchema.parse({ totpCode: 'abcdef' }));

  const valid = twoFactorVerifySchema.parse({ totpCode: '123456' });
  assert.equal(valid.totpCode, '123456');
});

