const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const router = express.Router();

// GET - Récupérer les tarifs d'une organisation
router.get('/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    let tarifs = await prisma.tarif.findUnique({ where: { organizationId } });
    if (!tarifs) {
      // Valeurs par défaut
      tarifs = {
        prixBase: 2000,
        prixKm: 500,
        locationJournalier: 13500,
        commissionChauffeur: 20,
        adyVarotraActif: true,
        courseNormalActif: true,
        locationActif: true,
      };
    }
    res.json(tarifs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT - Mettre à jour les tarifs (fleet/coop admin)
router.put('/:organizationId', authMiddleware, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { prixBase, prixKm, locationJournalier, commissionChauffeur, adyVarotraActif, courseNormalActif, locationActif } = req.body;
    
    const tarif = await prisma.tarif.upsert({
      where: { organizationId },
      update: { prixBase, prixKm, locationJournalier, commissionChauffeur, adyVarotraActif, courseNormalActif, locationActif },
      create: { organizationId, prixBase: prixBase || 2000, prixKm: prixKm || 500, locationJournalier: locationJournalier || 13500, commissionChauffeur: commissionChauffeur || 20 },
    });
    
    res.json(tarif);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
