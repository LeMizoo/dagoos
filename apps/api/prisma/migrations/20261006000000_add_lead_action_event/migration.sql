-- ============================================================
-- 2.4.2 — TIMELINE PASSAGER
-- Migration : add_lead_action_event
--
-- Crée la table LeadActionEvent (journal d'événements métier
-- append-only du cycle de vie d'une LeadAction).
--
-- ATTENTION : Cette migration doit être appliquée MANUELLEMENT sur
--             Supabase via le SQL Editor, puis committée dans le
--             dépôt (pratique en vigueur dans le projet, cf.
--             migrations 20260914 et 20260921).
--
-- Aucune donnée existante n'est modifiée.
-- Aucune colonne existante n'est altérée.
-- ============================================================

-- 1. Table
CREATE TABLE "LeadActionEvent" (
  "id"           TEXT         NOT NULL,
  "leadActionId" TEXT         NOT NULL,
  "type"         TEXT         NOT NULL,
  "actor"        TEXT         NOT NULL,
  "occurredAt"   TIMESTAMP(3) NOT NULL,
  "recordedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "payload"      JSONB,
  "partial"      BOOLEAN      NOT NULL DEFAULT false,

  CONSTRAINT "LeadActionEvent_pkey" PRIMARY KEY ("id")
);

-- 2. Index composite pour la lecture de la Timeline
--    (filtre par leadActionId + tri par occurredAt)
CREATE INDEX "LeadActionEvent_leadActionId_occurredAt_idx"
  ON "LeadActionEvent" ("leadActionId", "occurredAt");

-- 3. Index composite pour filtrage futur par type
CREATE INDEX "LeadActionEvent_leadActionId_type_idx"
  ON "LeadActionEvent" ("leadActionId", "type");

-- 4. Clé étrangère vers LeadAction (cascade)
ALTER TABLE "LeadActionEvent"
  ADD CONSTRAINT "LeadActionEvent_leadActionId_fkey"
  FOREIGN KEY ("leadActionId")
  REFERENCES "LeadAction"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
