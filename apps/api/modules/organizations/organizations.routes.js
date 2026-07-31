const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../../middleware/auth');
const prisma = new PrismaClient();

// GET toutes les organisations (publique pour le driver)
router.get('/', async (req, res) => {
  try {
    const organizations = await prisma.organization.findMany();
    res.json(organizations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET une organisation par ID
router.get('/:id', async (req, res) => {
  try {
    const organization = await prisma.organization.findUnique({ where: { id: req.params.id } });
    if (!organization) return res.status(404).json({ error: 'Organisation introuvable' });
    res.json(organization);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Landing page flotte
router.get('/fleet/:slug', async (req, res) => {
  try {
    const fleet = await prisma.organization.findFirst({
      where: { slug: req.params.slug, type: 'FLEET_MANAGER', status: 'active' },
      include: { user: { select: { name: true, email: true } }, vehicles: { where: { status: 'active' }, take: 6 }, drivers: { where: { status: 'active' }, take: 6 }, _count: { select: { vehicles: true, drivers: true } } }
    });
    if (!fleet) return res.status(404).json({ error: 'Flotte introuvable' });
    res.json(fleet);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Landing page coop
router.get('/coop/:slug', async (req, res) => {
  try {
    const coop = await prisma.organization.findFirst({
      where: { slug: req.params.slug, type: 'COOPERATIVE', status: 'active' },
      include: { user: { select: { name: true, email: true } }, vehicles: { where: { status: 'active' }, take: 6 }, drivers: { where: { status: 'active' }, take: 6 }, _count: { select: { vehicles: true, drivers: true } } }
    });
    if (!coop) return res.status(404).json({ error: 'Coopérative introuvable' });
    res.json(coop);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// DELETE une organisation (super-admin uniquement)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est super-admin
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Réservé aux super-administrateurs' });
    }
    await prisma.organization.delete({ where: { id: req.params.id } });
    res.json({ ok: true, message: 'Organisation supprimée' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
