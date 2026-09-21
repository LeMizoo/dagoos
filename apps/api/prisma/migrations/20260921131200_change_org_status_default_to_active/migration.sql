-- Change le défaut du statut d'organisation de 'pending' à 'active'
--
-- Note : cette migration a été appliquée manuellement via Supabase SQL Editor
-- avant d'être committée. La modification du défaut n'a d'effet que sur les
-- futures insertions, pas sur les lignes existantes.
--
-- Le code applicatif force désormais explicitement status = 'active'
-- lors de la création via /auth/register, ce qui rend le défaut de la base
-- non bloquant en pratique.
ALTER TABLE "Organization"
  ALTER COLUMN "status" SET DEFAULT 'active';
