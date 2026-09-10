// ============================================================
// UPLOAD PHOTOS - Cloudinary
// ============================================================
// Endpoint : POST /api/public/upload-photo
// Reçoit : { image: "data:image/jpeg;base64,...", typeService: "marchandises" }
// Retourne : { url, publicId, width, height, format, bytes }
// ============================================================

const express = require('express');
const cloudinary = require('cloudinary').v2;
const router = express.Router();

// Configuration Cloudinary depuis variables d'environnement
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Limites
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'heic', 'heif'];

// Services autorisés à recevoir des photos
const PHOTO_ENABLED_SERVICES = ['marchandises', 'demenagement', 'depannage', 'fret'];

// ============================================================
// POST /api/public/upload-photo
// ============================================================
router.post('/upload-photo', async (req, res) => {
  try {
    const { image, typeService } = req.body;

    // 1. Validation entrée
    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        error: 'Image manquante (champ "image" requis en base64)'
      });
    }

    // 2. Vérifier format data URI
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({
        error: 'Format invalide : doit être un data URI (data:image/...)'
      });
    }

    // 3. Extraire le format
    const formatMatch = image.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
    if (!formatMatch) {
      return res.status(400).json({
        error: 'Format data URI malformé'
      });
    }

    const format = formatMatch[1].toLowerCase();
    if (!ALLOWED_FORMATS.includes(format)) {
      return res.status(400).json({
        error: `Format non supporté : ${format}. Autorisés : ${ALLOWED_FORMATS.join(', ')}`
      });
    }

    // 4. Estimer la taille (base64 → bytes)
    const base64Data = image.split(',')[1];
    if (!base64Data) {
      return res.status(400).json({
        error: 'Données base64 manquantes'
      });
    }

    const estimatedBytes = Math.ceil((base64Data.length * 3) / 4);
    if (estimatedBytes > MAX_FILE_SIZE) {
      return res.status(413).json({
        error: `Image trop volumineuse (${Math.round(estimatedBytes / 1024)} KB). Maximum : ${MAX_FILE_SIZE / 1024 / 1024} MB`
      });
    }

    // 5. Vérifier le service (si fourni)
    if (typeService && !PHOTO_ENABLED_SERVICES.includes(typeService)) {
      return res.status(400).json({
        error: `Les photos ne sont pas autorisées pour le service "${typeService}"`
      });
    }

    // 6. Générer le dossier Cloudinary
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const servicePath = typeService || 'general';
    const folder = `dagoos/long_haul/${yearMonth}/${servicePath}`;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const publicId = `photo-${timestamp}-${random}`;

    // 7. Upload vers Cloudinary
    console.log(`[UPLOAD] Envoi vers Cloudinary : ${folder}/${publicId} (${format}, ~${Math.round(estimatedBytes / 1024)} KB)`);

    const uploadResult = await cloudinary.uploader.upload(image, {
      folder,
      public_id: publicId,
      resource_type: 'image',
      transformation: [
        {
          quality: 'auto:good',
          fetch_format: 'auto',
          width: 1920,
          crop: 'limit'
        }
      ],
      overwrite: false,
      invalidate: true
    });

    console.log(`[UPLOAD] ✅ Upload réussi : ${uploadResult.secure_url}`);

    // 8. Réponse
    return res.status(201).json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes,
      createdAt: uploadResult.created_at
    });

  } catch (error) {
    console.error('[UPLOAD] Erreur Cloudinary :', error);

    // Erreur Cloudinary spécifique
    if (error.http_code) {
      return res.status(error.http_code).json({
        error: `Cloudinary : ${error.message}`
      });
    }

    return res.status(500).json({
      error: 'Erreur lors de l\'upload',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================
// GET /api/public/upload-photo/health
// Vérifie que Cloudinary est bien configuré
// ============================================================
router.get('/upload-photo/health', async (req, res) => {
  try {
    const config = cloudinary.config();

    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      return res.status(503).json({
        status: 'error',
        message: 'Cloudinary non configuré',
        missing: {
          cloud_name: !config.cloud_name,
          api_key: !config.api_key,
          api_secret: !config.api_secret
        }
      });
    }

    // Test : récupérer les 1 dernières images
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'dagoos/',
      max_results: 1
    });

    return res.json({
      status: 'ok',
      message: 'Cloudinary opérationnel',
      cloud_name: config.cloud_name,
      images_count: result.resources?.length || 0,
      last_upload: result.resources?.[0]?.created_at || null
    });

  } catch (error) {
    console.error('[HEALTH] Erreur Cloudinary :', error);
    return res.status(503).json({
      status: 'error',
      message: 'Cloudinary inaccessible',
      error: error.message
    });
  }
});

module.exports = router;
