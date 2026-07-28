const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const router = express.Router();
router.get('/', authMiddleware, async (req, res) => {
  try { const data = await prisma.proprietaire.findMany({ include: { vehicles: true }, orderBy: { createdAt: 'desc' } }); res.json(data); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/', authMiddleware, async (req, res) => {
  try { const p = await prisma.proprietaire.create({ data: req.body }); res.status(201).json(p); } catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = router;
