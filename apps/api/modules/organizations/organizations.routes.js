const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const orgs = await prisma.organization.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(orgs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, email, plan, status, paymentStatus, paymentRef, paymentAmount, subscriptionEnd } = req.body;
    const org = await prisma.organization.update({
      where: { id: req.params.id },
      data: { name, email, plan, status, paymentStatus, paymentRef, paymentAmount, subscriptionEnd }
    });
    res.json(org);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const org = await prisma.organization.update({ where: { id: req.params.id }, data: { status } });
    res.json(org);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
