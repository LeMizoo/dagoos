// ============================================================
// lib/idempotency.js
// Phase 2.6.1.c — Logique metier d'idempotence des mutations
// publiques (POST /public/actions, POST /public/reservations/batch).
//
// Ce module ne branche AUCUN endpoint. Il expose des helpers
// utilises par les routes (commits suivants).
//
// Modele associe : IdempotencyKey (schema Prisma, commit 1).
// ============================================================

const crypto = require('crypto');
const prisma = require('./prisma');
const { encrypt, decrypt } = require('./idempotency-crypto');

// ------------------------------------------------------------
// Constantes
// ------------------------------------------------------------

const TTL_MS = 24 * 60 * 60 * 1000;              // 24h
const PENDING_GRACE_MS = 5 * 60 * 1000;          // 5 min
const WAIT_TIMEOUT_MS = 2000;                    // 2 s max d'attente active
const WAIT_STEP_MS = 200;                        // 200 ms entre 2 checks

// ------------------------------------------------------------
// Endpoints couverts (whitelist)
// ------------------------------------------------------------

const SUPPORTED_ENDPOINTS = new Set([
  '/public/actions',
  '/public/reservations/batch',
]);

// ------------------------------------------------------------
// Utilitaires
// ------------------------------------------------------------

function isSupportedEndpoint(endpoint) {
  return SUPPORTED_ENDPOINTS.has(endpoint);
}

function now() {
  return new Date();
}

function computeExpiresAt() {
  return new Date(Date.now() + TTL_MS);
}

function canonicalize(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return '[' + value.map(canonicalize).join(',') + ']';
  }

  const keys = Object.keys(value).sort();
  const parts = keys.map(
    (k) => JSON.stringify(k) + ':' + canonicalize(value[k])
  );
  return '{' + parts.join(',') + '}';
}

function hashPayload(payload) {
  const canonical = canonicalize(payload === undefined ? null : payload);
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ------------------------------------------------------------
// Purge opportuniste
//
// Supprime :
//   - COMPLETED / FAILED expirees (cycle normal) ;
//   - PENDING orphelins (createdAt < now - PENDING_GRACE_MS).
//
// Appelable a chaque nouvelle acquisition (cout negligeable).
// ------------------------------------------------------------

async function purgeExpired() {
  const nowDate = now();
  const pendingThreshold = new Date(nowDate.getTime() - PENDING_GRACE_MS);

  try {
    await prisma.idempotencyKey.deleteMany({
      where: {
        OR: [
          {
            status: { in: ['COMPLETED', 'FAILED'] },
            expiresAt: { lt: nowDate },
          },
          {
            status: 'PENDING',
            createdAt: { lt: pendingThreshold },
          },
        ],
      },
    });
  } catch (err) {
    // La purge ne doit jamais faire echouer la requete metier.
    console.warn('[idempotency] purgeExpired a echoue:', err && err.message);
  }
}

// ------------------------------------------------------------
// Acquisition atomique d'une cle
//
// Retourne :
//   { outcome: 'ACQUIRED' }                 -> on a la cle, traiter
//   { outcome: 'REPLAY', record }           -> cle COMPLETED/FAILED, rejouer
//   { outcome: 'HASH_MISMATCH', record }    -> meme cle, payload different
//   { outcome: 'PENDING_BUSY', record }     -> cle PENDING, en cours
// ------------------------------------------------------------

async function acquireKey({ key, endpoint, requestHash }) {
  if (!key || typeof key !== 'string') {
    throw new Error('idempotency: cle requise');
  }
  if (!isSupportedEndpoint(endpoint)) {
    throw new Error('idempotency: endpoint non supporte: ' + endpoint);
  }
  if (!requestHash) {
    throw new Error('idempotency: requestHash requis');
  }

  // Purge opportuniste (best effort, ne bloque jamais)
  await purgeExpired();

  // 1. Tentative d'insertion (verrou concurrentiel via PK unique)
  try {
    await prisma.idempotencyKey.create({
      data: {
        key,
        endpoint,
        requestHash,
        status: 'PENDING',
        expiresAt: computeExpiresAt(),
      },
    });

    return { outcome: 'ACQUIRED' };
  } catch (err) {
    if (!err || err.code !== 'P2002') {
      throw err;
    }
  }

  // 2. Cle deja presente -> lire l'etat courant
  const existing = await prisma.idempotencyKey.findUnique({
    where: { key },
  });

  if (!existing) {
    // Course tres improbable : cle supprimee entre create et findUnique.
    // On relance une acquisition propre (une seule fois).
    await prisma.idempotencyKey.create({
      data: {
        key,
        endpoint,
        requestHash,
        status: 'PENDING',
        expiresAt: computeExpiresAt(),
      },
    });
    return { outcome: 'ACQUIRED' };
  }

  if (existing.endpoint !== endpoint) {
    // Meme cle, endpoint different -> conflit
    return { outcome: 'HASH_MISMATCH', record: existing };
  }

  if (existing.requestHash !== requestHash) {
    return { outcome: 'HASH_MISMATCH', record: existing };
  }

  if (existing.status === 'PENDING') {
    return { outcome: 'PENDING_BUSY', record: existing };
  }

  // COMPLETED ou FAILED : rejouer
  return { outcome: 'REPLAY', record: existing };
}

// ------------------------------------------------------------
// Attente active sur une cle PENDING
//
// Retourne :
//   { outcome: 'COMPLETED', record }   -> transition detectee
//   { outcome: 'FAILED', record }      -> transition detectee
//   { outcome: 'TIMEOUT', record }     -> toujours PENDING apres 2s
// ------------------------------------------------------------

async function waitForCompletion(key) {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await sleep(WAIT_STEP_MS);

    const record = await prisma.idempotencyKey.findUnique({
      where: { key },
    });

    if (!record) {
      return { outcome: 'TIMEOUT', record: null };
    }

    if (record.status === 'COMPLETED') {
      return { outcome: 'COMPLETED', record };
    }

    if (record.status === 'FAILED') {
      return { outcome: 'FAILED', record };
    }
  }

  const record = await prisma.idempotencyKey.findUnique({
    where: { key },
  });
  return { outcome: 'TIMEOUT', record };
}

// ------------------------------------------------------------
// Finalisation d'une cle (a appeler DANS une transaction metier)
//
// `tx` est le client transactionnel Prisma (obligatoire).
//   - success: true  -> status COMPLETED, response chiffree
//   - success: false -> status FAILED, error (code controle)
//
// Le caller garantit que `tx` est bien issu de prisma.$transaction.
// ------------------------------------------------------------

async function finalizeSuccess(tx, { key, statusCode, response }) {
  if (!tx) {
    throw new Error('idempotency: finalizeSuccess requiert un tx Prisma');
  }

  const body = response === undefined ? null : response;
  const serialized = JSON.stringify(body);
  const encrypted = encrypt(serialized);

  await tx.idempotencyKey.update({
    where: { key },
    data: {
      status: 'COMPLETED',
      statusCode,
      response: encrypted,
      error: null,
      completedAt: new Date(),
    },
  });
}

async function finalizeFailure(tx, { key, statusCode, error }) {
  if (!tx) {
    throw new Error('idempotency: finalizeFailure requiert un tx Prisma');
  }

  // error = code controle uniquement (ex. 'PLACE_CONFLICT').
  const controlled =
    typeof error === 'string' && error.length > 0 && error.length <= 64
      ? error
      : 'ERROR';

  await tx.idempotencyKey.update({
    where: { key },
    data: {
      status: 'FAILED',
      statusCode,
      response: null,
      error: controlled,
      completedAt: new Date(),
    },
  });
}

// ------------------------------------------------------------
// Rehydratation d'une reponse enregistree
//
// Retourne { statusCode, body, error } a renvoyer au client.
// `decrypt` peut lever : on ne renvoie alors qu'un code controle.
// ------------------------------------------------------------

function rehydrate(record) {
  const statusCode = record.statusCode || 500;

  if (record.status === 'FAILED') {
    return { statusCode, body: null, error: record.error || 'ERROR' };
  }

  try {
    const decrypted = decrypt(record.response);
    return { statusCode, body: JSON.parse(decrypted), error: null };
  } catch (err) {
    console.warn('[idempotency] rehydrate a echoue:', err && err.message);
    return { statusCode: 500, body: null, error: 'DECRYPT_FAILED' };
  }
}

module.exports = {
  SUPPORTED_ENDPOINTS,
  isSupportedEndpoint,
  hashPayload,
  computeExpiresAt,
  purgeExpired,
  acquireKey,
  waitForCompletion,
  finalizeSuccess,
  finalizeFailure,
  rehydrate,
};
