const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');
const cloudinary = require('cloudinary').v2;
const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const [orgCount, driverCount, vehicleCount] = await Promise.all([
      prisma.organization.count(),
      prisma.driver.count(),
      prisma.vehicle.count()
    ]);
    res.json({ organizations: orgCount, drivers: driverCount, vehicles: vehicleCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/landing-content', async (req, res) => {
  try {
    const content = await prisma.landingContent.findMany({ where: { active: true } });
    res.json(content);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin : lire une section unitaire
router.get('/landing-content/:section', authMiddleware, requirePermission('content.manage'), async (req, res) => {
  try {
    const content = await prisma.landingContent.findUnique({
      where: { section: req.params.section }
    });
    res.json(content || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin : upload image editoriale (globale, pas d'organisation)
router.post('/landing-content/upload', authMiddleware, requirePermission('content.manage'), async (req, res) => {
  try {
    const { image } = req.body || {};

    if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Image manquante ou format invalide (data URI attendu)' });
    }

    const formatMatch = image.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
    if (!formatMatch) {
      return res.status(400).json({ error: 'Data URI malforme' });
    }

    const ALLOWED = ['jpeg', 'jpg', 'png', 'webp', 'heic', 'heif'];
    const format = formatMatch[1].toLowerCase();
    if (!ALLOWED.includes(format)) {
      return res.status(400).json({ error: `Format non supporte : ${format}` });
    }

    const base64Data = image.split(',')[1];
    const estimatedBytes = Math.ceil((base64Data.length * 3) / 4);
    if (estimatedBytes > 5 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image trop volumineuse (max 5 MB)' });
    }

    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const folder = `dagoos/editorial/${yearMonth}`;
    const publicId = `editorial-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const uploadResult = await cloudinary.uploader.upload(image, {
      folder,
      public_id: publicId,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good', fetch_format: 'auto', width: 1920, crop: 'limit' },
      ],
      overwrite: false,
      invalidate: true,
    });

    res.status(201).json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    console.error('POST /landing-content/upload:', error);
    if (error.http_code) {
      return res.status(error.http_code).json({ error: `Cloudinary : ${error.message}` });
    }
    res.status(500).json({ error: "Erreur lors de l'upload" });
  }
});

// Admin : modifier le contenu landing
router.put('/landing-content/:section', authMiddleware, requirePermission('content.manage'), async (req, res) => {
  try {
    const { title, subtitle, body, imageUrl, active } = req.body;
    const content = await prisma.landingContent.upsert({
      where: { section: req.params.section },
      update: { title, subtitle, body, imageUrl, active },
      create: { section: req.params.section, title, subtitle, body, imageUrl, active }
    });
    res.json(content);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
