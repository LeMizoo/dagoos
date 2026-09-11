// ============================================================
// RATE LIMITING — Endpoints publics sensibles
// ============================================================
// Protection contre l'abus : 10 requêtes / IP / minute
// sur les endpoints de création de LeadAction.
// ============================================================

const rateLimit = require('express-rate-limit');

const publicLeadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Trop de demandes. Veuillez réessayer dans une minute.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

module.exports = { publicLeadLimiter };
