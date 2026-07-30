const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Routes existantes
router.get('/', async (req, res) => {
  try {
    const organizations = await prisma.organization.findMany();
    res.json(organizations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organization = await prisma.organization.findUnique({
      where: { id }
    });
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.json(organization);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🚛 Route pour les landing pages des flottes
router.get('/fleet/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    console.log('🔍 Recherche flotte:', slug);
    
    const fleet = await prisma.organization.findFirst({
      where: {
        slug: slug,
        type: 'FLEET_MANAGER',
        status: 'active',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        vehicles: {
          where: { status: 'active' },
          take: 6,
        },
        drivers: {
          where: { status: 'active' },
          take: 6,
        },
        _count: {
          select: {
            vehicles: true,
            drivers: true,
          },
        },
      },
    });
    
    if (!fleet) {
      console.log('❌ Flotte non trouvée:', slug);
      return res.status(404).json({ error: 'Fleet not found' });
    }
    
    console.log('✅ Flotte trouvée:', fleet.name);
    res.json(fleet);
  } catch (error) {
    console.error('Error fetching fleet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🏢 Route pour les landing pages des coopératives
router.get('/coop/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    console.log('🔍 Recherche coopérative:', slug);
    
    const coop = await prisma.organization.findFirst({
      where: {
        slug: slug,
        type: 'COOPERATIVE',
        status: 'active',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        vehicles: {
          where: { status: 'active' },
          take: 6,
        },
        drivers: {
          where: { status: 'active' },
          take: 6,
        },
        _count: {
          select: {
            vehicles: true,
            drivers: true,
          },
        },
      },
    });
    
    if (!coop) {
      console.log('❌ Coopérative non trouvée:', slug);
      return res.status(404).json({ error: 'Coop not found' });
    }
    
    console.log('✅ Coopérative trouvée:', coop.name);
    res.json(coop);
  } catch (error) {
    console.error('Error fetching coop:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
