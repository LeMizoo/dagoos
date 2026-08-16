const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');
const router = express.Router();

// GET /api/users
router.get('/', authMiddleware, requirePermission('users.read'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/users/:id
router.get('/:id', authMiddleware, requirePermission('users.read'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/users/:id — Modification du profil utilisateur
router.put('/:id', authMiddleware, requirePermission('users.manage'), async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    // Seuls les champs fournis sont mis à jour
    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (role !== undefined) data.role = role;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true }
    });
    res.json(user);
  } catch (e) {
    console.error('Erreur PUT user:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
