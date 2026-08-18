const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');

const router = express.Router();

const GLOBAL_ROLES = ['SUPER_ADMIN', 'ADMIN'];

const VALID_TYPES = [
  'COURSE_REQUEST',
  'TAXI_RESERVATION',
  'PASSENGER_RESERVATION',
  'DELIVERY_REQUEST',
  'CARGO_RESERVATION',
  'CAR_RENTAL',
  'CONTACT',
];

const VALID_STATUTS = ['NEW', 'IN_PROGRESS', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'];

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

// GET /api/actions - Liste des actions de l'organisation
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
    
    if (req.query.statut) {
      where.statut = req.query.statut;
    }
    
    if (req.query.type) {
      where.type = req.query.type;
    }
    
    const actions = await prisma.leadAction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    
    res.json(actions);
  } catch (error) {
    console.error('GET /actions:', error);
    res.status(500).json({ error: 'Erreur récupération actions' });
  }
});

// POST /api/actions - Créer une action (depuis le dashboard)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, clientNom, clientTel, details } = req.body;
    
    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Type invalide' });
    }
    
    if (!clientNom || !clientTel) {
      return res.status(400).json({ error: 'Nom et téléphone requis' });
    }
    
    let orgId;
    if (GLOBAL_ROLES.includes(req.user.role)) {
      orgId = req.body.organizationId;
      if (!orgId) return res.status(400).json({ error: 'organizationId requis' });
    } else {
      orgId = await getUserOrganizationId(req);
      if (!orgId) return res.status(403).json({ error: 'Organisation introuvable' });
    }
    
    const action = await prisma.leadAction.create({
      data: {
        organizationId: orgId,
        type,
        clientNom: String(clientNom).trim(),
        clientTel: String(clientTel).trim(),
        details: details || {},
        statut: 'NEW',
      },
    });
    
    res.status(201).json(action);
  } catch (error) {
    console.error('POST /actions:', error);
    res.status(500).json({ error: 'Erreur création action' });
  }
});

// GET /api/actions/:id - Détail d'une action
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const action = await prisma.leadAction.findUnique({
      where: { id: req.params.id },
    });
    
    if (!action) return res.status(404).json({ error: 'Action introuvable' });
    
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const orgId = await getUserOrganizationId(req);
      if (action.organizationId !== orgId) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }
    
    res.json(action);
  } catch (error) {
    console.error('GET /actions/:id:', error);
    res.status(500).json({ error: 'Erreur récupération action' });
  }
});

// PATCH /api/actions/:id - Mettre à jour le statut
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { statut } = req.body;
    
    if (!statut || !VALID_STATUTS.includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    
    const action = await prisma.leadAction.findUnique({
      where: { id: req.params.id },
    });
    
    if (!action) return res.status(404).json({ error: 'Action introuvable' });
    
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const orgId = await getUserOrganizationId(req);
      if (action.organizationId !== orgId) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }
    
    const updated = await prisma.leadAction.update({
      where: { id: req.params.id },
      data: { statut },
    });
    
    res.json(updated);
  } catch (error) {
    console.error('PATCH /actions/:id:', error);
    res.status(500).json({ error: 'Erreur modification action' });
  }
});

module.exports = router;
