-- AddForeignKey
-- Note : cette migration a été appliquée manuellement via Supabase SQL Editor
-- (problème FAI sur le port 5432) avant d'être committée.
-- Vérifiée le 2026-09-14 : contrainte 'Versement_driverId_fkey' présente sur Supabase.
ALTER TABLE "Versement"
ADD CONSTRAINT "Versement_driverId_fkey"
FOREIGN KEY ("driverId")
REFERENCES "Driver"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
