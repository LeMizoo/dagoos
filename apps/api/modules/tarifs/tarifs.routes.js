const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');
const router = express.Router();

// Valeurs par défaut centralisées
const DEFAULT_TARIFS = {
  prixBase: 2000,
  prixKm: 500,
  locationJournalier: 13500,
  commissionChauffeur: 20,
  adyVarotraActif: true,
  courseNormalActif: true,
  locationActif: true,
};

// GET - Récupérer les tarifs d'une organisation
router.get('/:organizationId', authMiddleware, requirePermission('tarifs.read'), async (req, res) => {
  try {
    const { organizationId } = req.params;
    let tarifs = await prisma.tarif.findUnique({ where: { organizationId } });
    if (!tarifs) {
      return res.json(DEFAULT_TARIFS);
    }
    res.json(tarifs);
  } catch (e) { 
    console.error('GET tarifs:', e);
    res.status(500).json({ error: e.message }); 
  }
});

// PUT - Mettre à jour les tarifs (fleet/coop admin)
router.put('/:organizationId', authMiddleware, requirePermission('tarifs.manage'), async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { 
      prixBase, prixKm, locationJournalier, commissionChauffeur, 
      adyVarotraActif, courseNormalActif, locationActif,
      vehiculeTarifs, mobileMoney 
    } = req.body;
    
    const tarif = await prisma.tarif.upsert({
      where: { organizationId },
      update: { 
        prixBase: prixBase ?? undefined,
        prixKm: prixKm ?? undefined,
        locationJournalier: locationJournalier ?? undefined,
        commissionChauffeur: commissionChauffeur ?? undefined,
        adyVarotraActif: adyVarotraActif ?? undefined,
        courseNormalActif: courseNormalActif ?? undefined,
        locationActif: locationActif ?? undefined,
      },
      create: { 
        organizationId, 
        prixBase: prixBase || DEFAULT_TARIFS.prixBase, 
        prixKm: prixKm || DEFAULT_TARIFS.prixKm, 
        locationJournalier: locationJournalier || DEFAULT_TARIFS.locationJournalier, 
        commissionChauffeur: commissionChauffeur || DEFAULT_TARIFS.commissionChauffeur,
        adyVarotraActif: adyVarotraActif ?? DEFAULT_TARIFS.adyVarotraActif,
        courseNormalActif: courseNormalActif ?? DEFAULT_TARIFS.courseNormalActif,
        locationActif: locationActif ?? DEFAULT_TARIFS.locationActif,
      },
    });
    
    res.json(tarif);
  } catch (e) { 
    console.error('PUT tarifs:', e);
    res.status(500).json({ error: e.message }); 
  }
});

module.exports = router;
