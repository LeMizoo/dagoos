const prisma = require('./prisma');

/**
 * Extrait l'IP client depuis la requête Express.
 * Priorité : x-forwarded-for (Vercel/Render) → req.ip → null.
 */
function getClientIp(req) {
  if (!req) return null;

  const forwarded = req.headers && req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }

  return req.ip || null;
}

/**
 * Écrit une entrée dans la table Log.
 *
 * Un échec d'écriture du log ne doit jamais casser
 * la requête métier principale.
 */
async function logAction({
  userId = null,
  action,
  details = null,
  req = null,
}) {
  try {
    if (!action || typeof action !== 'string') {
      console.error('[logAction] action manquante ou invalide');
      return;
    }

    await prisma.log.create({
      data: {
        userId: userId || null,
        action,
        details: details ? String(details) : null,
        ip: getClientIp(req),
      },
    });
  } catch (error) {
    console.error('[logAction] échec écriture log:', error.message);
  }
}

module.exports = {
  logAction,
};
