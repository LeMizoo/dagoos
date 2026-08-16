BEGIN;

-- =========================================================
-- MESSAGE : colonnes manquantes
-- =========================================================

ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "reply" TEXT,
  ADD COLUMN IF NOT EXISTS "repliedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "repliedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "replied" BOOLEAN NOT NULL DEFAULT false;


-- =========================================================
-- PROPRIETAIRE
-- =========================================================

CREATE TABLE IF NOT EXISTS "Proprietaire" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "cin" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "nif" TEXT,
  "stat" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Proprietaire_pkey" PRIMARY KEY ("id")
);


-- =========================================================
-- MAINTENANCE
-- =========================================================

CREATE TABLE IF NOT EXISTS "Maintenance" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT,
  "km" INTEGER NOT NULL,
  "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "nextKm" INTEGER,
  "prestataire" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);


-- =========================================================
-- ASSURANCE
-- =========================================================

CREATE TABLE IF NOT EXISTS "Assurance" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "compagnie" TEXT,
  "police" TEXT,
  "debut" TIMESTAMP(3) NOT NULL,
  "fin" TIMESTAMP(3) NOT NULL,
  "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Assurance_pkey" PRIMARY KEY ("id")
);


-- =========================================================
-- VIGNETTE
-- =========================================================

CREATE TABLE IF NOT EXISTS "Vignette" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "annee" INTEGER NOT NULL,
  "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "datePaiement" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'en_attente',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Vignette_pkey" PRIMARY KEY ("id")
);


-- =========================================================
-- SOCIETE
-- =========================================================

CREATE TABLE IF NOT EXISTS "Societe" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "activite" TEXT NOT NULL DEFAULT 'Transport',
  "adresse" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Societe_pkey" PRIMARY KEY ("id")
);


-- =========================================================
-- CONTRAT
-- =========================================================

CREATE TABLE IF NOT EXISTS "Contrat" (
  "id" TEXT NOT NULL,
  "societeId" TEXT NOT NULL,
  "client" TEXT NOT NULL,
  "dateDebut" TEXT NOT NULL,
  "dateFin" TEXT NOT NULL,
  "montant" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "statut" TEXT NOT NULL DEFAULT 'actif',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Contrat_pkey" PRIMARY KEY ("id")
);


-- =========================================================
-- LIVRAISON
-- =========================================================

CREATE TABLE IF NOT EXISTS "Livraison" (
  "id" TEXT NOT NULL,
  "societeId" TEXT NOT NULL,
  "driverId" TEXT,
  "vehicleId" TEXT,
  "type" TEXT NOT NULL DEFAULT 'colis',
  "description" TEXT,
  "adresseDepart" TEXT,
  "adresseArrivee" TEXT,
  "prix" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "statut" TEXT NOT NULL DEFAULT 'en_attente',
  "preuve" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Livraison_pkey" PRIMARY KEY ("id")
);


-- =========================================================
-- COURSE
-- =========================================================

CREATE TABLE IF NOT EXISTS "Course" (
  "id" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'NORMALE',
  "distanceKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);


-- =========================================================
-- TRIP
-- =========================================================

CREATE TABLE IF NOT EXISTS "Trip" (
  "id" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "startAt" TIMESTAMP(3),
  "endAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);


-- =========================================================
-- PAYMENT
-- =========================================================

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "method" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);


-- =========================================================
-- VERSEMENT
-- =========================================================

CREATE TABLE IF NOT EXISTS "Versement" (
  "id" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "periode" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'en_attente',
  "dateVersement" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Versement_pkey" PRIMARY KEY ("id")
);


-- =========================================================
-- TARIF
-- =========================================================

CREATE TABLE IF NOT EXISTS "Tarif" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "prixBase" DOUBLE PRECISION NOT NULL DEFAULT 2000,
  "prixKm" DOUBLE PRECISION NOT NULL DEFAULT 500,
  "locationJournalier" DOUBLE PRECISION NOT NULL DEFAULT 13500,
  "commissionChauffeur" INTEGER NOT NULL DEFAULT 20,
  "adyVarotraActif" BOOLEAN NOT NULL DEFAULT true,
  "courseNormalActif" BOOLEAN NOT NULL DEFAULT true,
  "locationActif" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Tarif_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Tarif_organizationId_key"
  ON "Tarif"("organizationId");


-- =========================================================
-- LANDING CONTENT
-- =========================================================

CREATE TABLE IF NOT EXISTS "LandingContent" (
  "id" TEXT NOT NULL,
  "section" TEXT NOT NULL,
  "title" TEXT,
  "subtitle" TEXT,
  "body" TEXT,
  "imageUrl" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "LandingContent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LandingContent_section_key"
  ON "LandingContent"("section");


-- =========================================================
-- INDEX / CONTRAINTES
-- =========================================================

CREATE INDEX IF NOT EXISTS "Maintenance_vehicleId_idx"
  ON "Maintenance"("vehicleId");

CREATE INDEX IF NOT EXISTS "Assurance_vehicleId_idx"
  ON "Assurance"("vehicleId");

CREATE INDEX IF NOT EXISTS "Vignette_vehicleId_idx"
  ON "Vignette"("vehicleId");

CREATE INDEX IF NOT EXISTS "Societe_organizationId_idx"
  ON "Societe"("organizationId");

CREATE INDEX IF NOT EXISTS "Contrat_societeId_idx"
  ON "Contrat"("societeId");

CREATE INDEX IF NOT EXISTS "Livraison_societeId_idx"
  ON "Livraison"("societeId");

CREATE INDEX IF NOT EXISTS "Course_driverId_idx"
  ON "Course"("driverId");

CREATE INDEX IF NOT EXISTS "Course_vehicleId_idx"
  ON "Course"("vehicleId");

CREATE INDEX IF NOT EXISTS "Trip_driverId_idx"
  ON "Trip"("driverId");

CREATE INDEX IF NOT EXISTS "Trip_vehicleId_idx"
  ON "Trip"("vehicleId");

CREATE INDEX IF NOT EXISTS "Payment_tripId_idx"
  ON "Payment"("tripId");

CREATE INDEX IF NOT EXISTS "Versement_driverId_idx"
  ON "Versement"("driverId");


-- =========================================================
-- FOREIGN KEYS
-- =========================================================

ALTER TABLE "Maintenance"
  ADD CONSTRAINT "Maintenance_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Assurance"
  ADD CONSTRAINT "Assurance_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Vignette"
  ADD CONSTRAINT "Vignette_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Vehicle"
  ADD CONSTRAINT "Vehicle_proprietaireId_fkey"
  FOREIGN KEY ("proprietaireId") REFERENCES "Proprietaire"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Societe"
  ADD CONSTRAINT "Societe_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Contrat"
  ADD CONSTRAINT "Contrat_societeId_fkey"
  FOREIGN KEY ("societeId") REFERENCES "Societe"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Livraison"
  ADD CONSTRAINT "Livraison_societeId_fkey"
  FOREIGN KEY ("societeId") REFERENCES "Societe"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Course"
  ADD CONSTRAINT "Course_driverId_fkey"
  FOREIGN KEY ("driverId") REFERENCES "Driver"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Course"
  ADD CONSTRAINT "Course_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Trip"
  ADD CONSTRAINT "Trip_driverId_fkey"
  FOREIGN KEY ("driverId") REFERENCES "Driver"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Trip"
  ADD CONSTRAINT "Trip_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "Trip"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Versement"
  ADD CONSTRAINT "Versement_driverId_fkey"
  FOREIGN KEY ("driverId") REFERENCES "Driver"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;


-- =========================================================
-- FOREIGN KEYS COMPLEMENTAIRES
-- =========================================================

ALTER TABLE "Livraison"
  ADD CONSTRAINT "Livraison_driverId_fkey"
  FOREIGN KEY ("driverId") REFERENCES "Driver"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Livraison"
  ADD CONSTRAINT "Livraison_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Tarif"
  ADD CONSTRAINT "Tarif_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;


COMMIT;
