const express = require('express');
const prisma = require('../../lib/prisma');
const router = express.Router();

// POST /api/sessions - Créer une session
router.post('/', async (req, res) => {
  try {
    const { sessionId, token, expiresAt } = req.body;

    if (!sessionId || !token) {
      return res.status(400).json({ error: 'sessionId et token requis' });
    }

    await prisma.session.create({
      data: {
        id: sessionId,
        token,
        expiresAt: new Date(expiresAt || Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ ok: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/sessions/:id - Récupérer une session
router.get('/:id', async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(404).json({ error: 'Session introuvable ou expirée' });
    }

    res.json({ token: session.token });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/sessions/:id - Supprimer une session
router.delete('/:id', async (req, res) => {
  try {
    await prisma.session.delete({
      where: { id: req.params.id },
    });
    res.json({ ok: true });
  } catch(e) {
    res.status(404).json({ error: 'Session introuvable' });
  }
});

module.exports = router;
