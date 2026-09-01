const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');

const router = express.Router();

const PRIVILEGED_ROLES = ['SUPER_ADMIN', 'ADMIN'];

async function canAccessOrganization(req, organizationId) {
  if (PRIVILEGED_ROLES.includes(req.user.role)) {
    return true;
  }

  if (!organizationId) return false;

  if (req.user.organizationId) {
    return req.user.organizationId === organizationId;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      driver: { select: { organizationId: true } },
    },
  });

  return user?.driver?.organizationId === organizationId;
}

// GET /api/drivers/:id/dossier
router.get('/:id/dossier', authMiddleware, requirePermission('drivers.read'), async (req, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        organizationId: true,
        driverCode: true,
      },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Chauffeur introuvable' });
    }

    if (!(await canAccessOrganization(req, driver.organizationId))) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const dossier = await prisma.driverDossier.findUnique({
      where: { driverId: driver.id },
    });

    res.json(dossier || null);
  } catch (error) {
    console.error('GET /drivers/:id/dossier:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/drivers/:id/dossier
router.put('/:id/dossier', authMiddleware, requirePermission('drivers.manage'), async (req, res) => {
  try {
    if (req.user.role === 'DRIVER') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      select: { id: true, organizationId: true },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Chauffeur introuvable' });
    }

    if (!(await canAccessOrganization(req, driver.organizationId))) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const {
      cin,
      cinDateDelivrance,
      cinLieuDelivrance,
      permisNumero,
      permisCategorie,
      permisDateDelivrance,
      permisDateExpiration,
      permisLieuDelivrance,
      permisStatut,
      adresse,
      certificatResidenceNum,
      certificatResidenceDate,
      dateEmbauche,
      photo,
      heurePrisePoste,
      heureFinService,
    } = req.body;

    const dossier = await prisma.driverDossier.upsert({
      where: { driverId: driver.id },
      update: {
        cin: cin ?? null,
        cinDateDelivrance: cinDateDelivrance ?? null,
        cinLieuDelivrance: cinLieuDelivrance ?? null,
        permisNumero: permisNumero ?? null,
        permisCategorie: permisCategorie ?? null,
        permisDateDelivrance: permisDateDelivrance ?? null,
        permisDateExpiration: permisDateExpiration ?? null,
        permisLieuDelivrance: permisLieuDelivrance ?? null,
        permisStatut: permisStatut ?? 'en_attente',
        adresse: adresse ?? null,
        certificatResidenceNum: certificatResidenceNum ?? null,
        certificatResidenceDate: certificatResidenceDate ?? null,
        dateEmbauche: dateEmbauche ?? null,
        photo: photo ?? null,
        heurePrisePoste: heurePrisePoste ?? '07:00',
        heureFinService: heureFinService ?? '19:00',
      },
      create: {
        driverId: driver.id,
        cin: cin ?? null,
        cinDateDelivrance: cinDateDelivrance ?? null,
        cinLieuDelivrance: cinLieuDelivrance ?? null,
        permisNumero: permisNumero ?? null,
        permisCategorie: permisCategorie ?? null,
        permisDateDelivrance: permisDateDelivrance ?? null,
        permisDateExpiration: permisDateExpiration ?? null,
        permisLieuDelivrance: permisLieuDelivrance ?? null,
        permisStatut: permisStatut ?? 'en_attente',
        adresse: adresse ?? null,
        certificatResidenceNum: certificatResidenceNum ?? null,
        certificatResidenceDate: certificatResidenceDate ?? null,
        dateEmbauche: dateEmbauche ?? null,
        photo: photo ?? null,
        heurePrisePoste: heurePrisePoste ?? '07:00',
        heureFinService: heureFinService ?? '19:00',
      },
    });

    res.json(dossier);
  } catch (error) {
    console.error('PUT /drivers/:id/dossier:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
