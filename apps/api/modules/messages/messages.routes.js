const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');

const router = express.Router();
const GLOBAL_ROLES = ['SUPER_ADMIN', 'ADMIN'];

async function getUserOrganizationId(req) {
  if (req.user?.organizationId) return req.user.organizationId;

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { driver: { select: { organizationId: true } } },
  });

  if (user?.driver?.organizationId) return user.driver.organizationId;

  const organization = await prisma.organization.findFirst({
    where: { email: req.user.email },
    select: { id: true },
  });

  return organization?.id || null;
}

async function canAccessMessage(req, organizationId) {
  if (GLOBAL_ROLES.includes(req.user.role)) return true;
  return organizationId === await getUserOrganizationId(req);
}


router.get('/', authMiddleware, requirePermission('messages.read'), async (req, res) => {
  try {
    const where = {};
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const organizationId = await getUserOrganizationId(req);
      if (!organizationId) return res.status(403).json({ error: 'Organisation introuvable' });
      where.organizationId = organizationId;
    } else if (req.query.organizationId) {
      where.organizationId = req.query.organizationId;
    }

    const messages = await prisma.message.findMany({
      where,
      include: { organization: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(messages);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.get('/unread-count', authMiddleware, requirePermission('messages.read'), async (req, res) => {
  try {
    const count = await prisma.message.count({
      where: {
        read: false
      }
    });

    res.json({
      count
    });

  } catch (e) {
    console.error('Erreur unread-count:', e);

    res.status(500).json({
      error: e.message
    });
  }
});


router.post('/', authMiddleware, requirePermission('messages.manage'), async (req, res) => {
  try {
    const { organizationId: requestedOrganizationId, subject, content, type } = req.body;
    const organizationId = GLOBAL_ROLES.includes(req.user.role)
      ? requestedOrganizationId
      : await getUserOrganizationId(req);

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId requis' });
    }

    const message = await prisma.message.create({
      data: {
        organizationId,
        subject,
        content,
        type: type || 'info'
      }
    });

    res.status(201).json(message);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.put('/:id/read', authMiddleware, requirePermission('messages.manage'), async (req, res) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.id },
      select: { organizationId: true },
    });

    if (!message) return res.status(404).json({ error: 'Message introuvable' });
    if (!(await canAccessMessage(req, message.organizationId))) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    await prisma.message.update({
      where: { id: req.params.id },
      data: {
        read: true
      }
    });

    res.json({
      ok: true
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id/reply', authMiddleware, requirePermission('messages.manage'), async (req, res) => {
  try {
    const { reply } = req.body;

    if (!reply || !reply.trim()) {
      return res.status(400).json({ error: 'R�ponse vide' });
    }

    const message = await prisma.message.findUnique({
      where: { id: req.params.id }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message introuvable' });
    }

    if (!(await canAccessMessage(req, message.organizationId))) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const updated = await prisma.message.update({
      where: { id: req.params.id },
      data: {
        reply: reply.trim(),
        replied: true,
        repliedAt: new Date(),
        repliedBy: req.user.email || req.user.id || 'Admin'
      },
      include: {
        organization: true
      }
    });

    res.json(updated);
  } catch (e) {
    console.error('Erreur reply:', e);
    res.status(500).json({ error: e.message });
  }
});


module.exports = router;