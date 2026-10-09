// ============================================================
// lib/idempotency-crypto.js
// Phase 2.6.1.c — Chiffrement AES-256-GCM des reponses
// rejouables stockees dans IdempotencyKey.response.
//
// Format de sortie : base64( IV(12) || authTag(16) || ciphertext )
//
// Cle : IDEMPOTENCY_ENCRYPTION_KEY (32 bytes hex, soit 64 chars).
// Aucun fallback en production : si la cle est absente ou invalide,
// encrypt() et decrypt() levent une erreur explicite.
// ============================================================

const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;
const KEY_HEX_LENGTH = KEY_BYTES * 2;

// ------------------------------------------------------------
// Chargement de la cle
// ------------------------------------------------------------

function loadKey() {
  const hex = process.env.IDEMPOTENCY_ENCRYPTION_KEY;

  if (typeof hex !== 'string' || hex.length !== KEY_HEX_LENGTH) {
    throw new Error(
      'IDEMPOTENCY_ENCRYPTION_KEY absente ou invalide ' +
        '(attendu : ' +
        KEY_HEX_LENGTH +
        ' caracteres hexadecimaux)'
    );
  }

  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error(
      'IDEMPOTENCY_ENCRYPTION_KEY invalide (caracteres non hexadecimaux)'
    );
  }

  return Buffer.from(hex, 'hex');
}

// ------------------------------------------------------------
// encrypt(plaintext: string): string  (base64)
// ------------------------------------------------------------

function encrypt(plaintext) {
  if (typeof plaintext !== 'string') {
    throw new TypeError('encrypt: plaintext doit etre une chaine');
  }

  const key = loadKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  const payload = Buffer.concat([iv, authTag, ciphertext]);
  return payload.toString('base64');
}

// ------------------------------------------------------------
// decrypt(ciphertextB64: string): string
// ------------------------------------------------------------

function decrypt(ciphertextB64) {
  if (typeof ciphertextB64 !== 'string' || ciphertextB64.length === 0) {
    throw new TypeError('decrypt: ciphertext doit etre une chaine non vide');
  }

  const key = loadKey();
  const payload = Buffer.from(ciphertextB64, 'base64');

  if (payload.length < IV_BYTES + TAG_BYTES) {
    throw new Error('decrypt: payload trop court');
  }

  const iv = payload.subarray(0, IV_BYTES);
  const authTag = payload.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = payload.subarray(IV_BYTES + TAG_BYTES);

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString('utf8');
}

module.exports = {
  encrypt,
  decrypt,
};
