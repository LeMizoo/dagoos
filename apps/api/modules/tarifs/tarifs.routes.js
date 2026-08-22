const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');
const router = express.Router();

// GET - Récupérer les tarifs d'une organisation
router.get('/:organizationId', authMiddleware, requirePermission('tarifs.read'), async (req, res) => {
  try {
    const { organizationId } = req.params;
    let tarifs = await prisma.tarif.findUnique({ where: { organizationId } });
    if (!tarifs) {
      // Valeurs par défaut
      // Valeurs par défaut centralisées (à déplacer dans une table de config)
      const DEFAULT_TARIFS = {
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
router.put('/:organizationId', authMiddleware, requirePermission('tarifs.manage'), async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { prixBase, prixKm, locationJournalier, commissionChauffeur, adyVarotraActif, courseNormalActif, locationActif } = req.body;
    
    const tarif = await prisma.tarif.upsert({
      where: { organizationId },
      update: { prixBase, prixKm, locationJournalier, commissionChauffeur, adyVarotraActif, courseNormalActif, locationActif },
      create: { organizationId, prixBase: prixBase || 2000, prixKm: prixKm || 500, locationJournalier: locationJournalier || DEFAULT_TARIFS.locationJournalier || 13500, commissionChauffeur: commissionChauffeur || DEFAULT_TARIFS.commissionChauffeur || 20 },
    });
    
    res.json(tarif);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
