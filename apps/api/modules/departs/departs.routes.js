const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');

const router = express.Router();

const GLOBAL_ROLES = ['SUPER_ADMIN', 'ADMIN'];

async function getUserOrganizationId(req) {
  if (req.user.organizationId) return req.user.organizationId;
  
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { driver: { select: { organizationId: true } } },
  });
  
  if (user?.driver?.organizationId) return user.driver.organizationId;
  
  const org = await prisma.organization.findFirst({
    where: { email: req.user.email },
    select: { id: true },
  });
  
  return org?.id || null;
}

// GET /api/departs - Liste des départs de l'organisation
router.get('/', authMiddleware, async (req, res) => {
  try {
    const where = {};
    
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const orgId = await getUserOrganizationId(req);
      if (!orgId) return res.status(403).json({ error: 'Organisation introuvable' });
      where.organizationId = orgId;
    } else if (req.query.organizationId) {
      where.organizationId = req.query.organizationId;
    }
    
    const departs = await prisma.depart.findMany({
      where,
      include: {
        vehicle: { select: { id: true, plate: true, model: true } },
        reservations: { select: { id: true, place: true, passagerNom: true, statut: true } },
      },
      orderBy: { date: 'asc' },
    });
    
    res.json(departs);
  } catch (error) {
    console.error('GET /departs:', error);
    res.status(500).json({ error: 'Erreur récupération départs' });
  }
});

// POST /api/departs - Créer un départ
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { pointDepart, destination, date, heure, prix, vehiculeId, placesTotal } = req.body;
    
    if (!pointDepart || !destination || !date || !heure || !prix) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    
    let orgId;
    if (GLOBAL_ROLES.includes(req.user.role)) {
      orgId = req.body.organizationId;
      if (!orgId) return res.status(400).json({ error: 'organizationId requis' });
    } else {
      orgId = await getUserOrganizationId(req);
      if (!orgId) return res.status(403).json({ error: 'Organisation introuvable' });
    }
    
    const depart = await prisma.depart.create({
      data: {
        organizationId: orgId,
        pointDepart: String(pointDepart).trim(),
        destination: String(destination).trim(),
        date: new Date(date),
        heure: String(heure).trim(),
        prix: Number(prix),
        vehiculeId: vehiculeId || null,
        placesTotal: Number(placesTotal || 1),
        statut: 'PUBLISHED',
      },
      include: {
        vehicle: { select: { id: true, plate: true, model: true } },
      },
    });
    
    res.status(201).json(depart);
  } catch (error) {
    console.error('POST /departs:', error);
    res.status(500).json({ error: 'Erreur création départ' });
  }
});

// GET /api/departs/:id - Détail d'un départ
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const depart = await prisma.depart.findUnique({
      where: { id: req.params.id },
      include: {
        vehicle: true,
        reservations: true,
      },
    });
    
    if (!depart) return res.status(404).json({ error: 'Départ introuvable' });
    
    // Vérifier l'isolation
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const orgId = await getUserOrganizationId(req);
      if (depart.organizationId !== orgId) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }
    
    res.json(depart);
  } catch (error) {
    console.error('GET /departs/:id:', error);
    res.status(500).json({ error: 'Erreur récupération départ' });
  }
});

// PUT /api/departs/:id - Modifier un départ
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const depart = await prisma.depart.findUnique({ where: { id: req.params.id } });
    if (!depart) return res.status(404).json({ error: 'Départ introuvable' });
    
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const orgId = await getUserOrganizationId(req);
      if (depart.organizationId !== orgId) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }
    
    const { pointDepart, destination, date, heure, prix, vehiculeId, placesTotal, statut } = req.body;
    
    const updated = await prisma.depart.update({
      where: { id: req.params.id },
      data: {
        ...(pointDepart && { pointDepart: String(pointDepart).trim() }),
        ...(destination && { destination: String(destination).trim() }),
        ...(date && { date: new Date(date) }),
        ...(heure && { heure: String(heure).trim() }),
        ...(prix !== undefined && { prix: Number(prix) }),
        ...(vehiculeId !== undefined && { vehiculeId: vehiculeId || null }),
        ...(placesTotal !== undefined && { placesTotal: Number(placesTotal) }),
        ...(statut && { statut: String(statut) }),
      },
    });
    
    res.json(updated);
  } catch (error) {
    console.error('PUT /departs/:id:', error);
    res.status(500).json({ error: 'Erreur modification départ' });
  }
});

// DELETE /api/departs/:id - Supprimer un départ
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const depart = await prisma.depart.findUnique({ where: { id: req.params.id } });
    if (!depart) return res.status(404).json({ error: 'Départ introuvable' });
    
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const orgId = await getUserOrganizationId(req);
      if (depart.organizationId !== orgId) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }
    
    await prisma.depart.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error) {
    console.error('DELETE /departs/:id:', error);
    res.status(500).json({ error: 'Erreur suppression départ' });
  }
});

module.exports = router;
