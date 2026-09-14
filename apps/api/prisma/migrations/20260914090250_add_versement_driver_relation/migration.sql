-- AddForeignKey
ALTER TABLE "Versement"
ADD CONSTRAINT "Versement_driverId_fkey"
FOREIGN KEY ("driverId")
REFERENCES "Driver"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
