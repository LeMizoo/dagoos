-- ============================================================
-- 2.6.1 — IDEMPOTENCE DES MUTATIONS PUBLIQUES
-- Migration : add_idempotency_key
--
-- Cree la table IdempotencyKey pour stocker les reponses
-- rejouables des POST publics (/public/actions et
-- /public/reservations/batch).
--
-- ATTENTION : Cette migration doit etre appliquee MANUELLEMENT
--             sur Supabase via le SQL Editor, puis commitee dans
--             le depot (pratique en vigueur dans le projet,
--             cf. migrations 20260914, 20260921, 20261006).
--
-- Aucune donnee existante n'est modifiee.
-- Aucune colonne existante n'est alteree.
-- ============================================================

CREATE TABLE "IdempotencyKey" (
  "key"         TEXT         NOT NULL,
  "endpoint"    TEXT         NOT NULL,
  "requestHash" TEXT         NOT NULL,
  "status"      TEXT         NOT NULL DEFAULT 'PENDING',
  "statusCode"  INTEGER,
  "response"    TEXT,
  "error"       TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "expiresAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "IdempotencyKey_expiresAt_idx"
  ON "IdempotencyKey" ("expiresAt");

CREATE INDEX "IdempotencyKey_status_createdAt_idx"
  ON "IdempotencyKey" ("status", "createdAt");
