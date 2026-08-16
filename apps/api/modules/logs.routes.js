const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');
const { requirePermission } = require('../security/require-permission');
const router = express.Router();

router.get('/', authMiddleware, requirePermission('logs.read'), async (req, res) => {
  try {
    const logs = await prisma.log.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
