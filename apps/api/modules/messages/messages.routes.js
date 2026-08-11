const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');

const router = express.Router();


router.get('/', authMiddleware, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      include: { organization: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(messages);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.get('/unread-count', authMiddleware, async (req, res) => {
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


router.post('/', authMiddleware, async (req, res) => {
  try {
    const { organizationId, subject, content, type } = req.body;

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


router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    await prisma.message.update({
      where: {
        id: req.params.id
      },
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

router.put('/:id/reply', authMiddleware, async (req, res) => {
  try {
    const { reply } = req.body;

    if (!reply || !reply.trim()) {
      return res.status(400).json({ error: 'Réponse vide' });
    }

    const message = await prisma.message.findUnique({
      where: { id: req.params.id }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message introuvable' });
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