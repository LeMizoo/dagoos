const express = require('express');
const prisma = require('../../lib/prisma');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { price: 'asc' } });
    res.json(plans);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
