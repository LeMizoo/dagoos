const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');
const router = express.Router();
router.get('/', authMiddleware, requirePermission('notifications.read'), async (req, res) => {
  try { const data = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }); res.json(data); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/unread-count', authMiddleware, requirePermission('notifications.read'), async (req, res) => {
  try { const count = await prisma.notification.count({ where: { read: false } }); res.json({ count }); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/:id/read', authMiddleware, requirePermission('notifications.manage'), async (req, res) => {
  try { await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } }); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = router;
