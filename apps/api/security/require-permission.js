const { can } = require('./authorization');
const { createAuditEvent } = require('./audit');

function requirePermission(permission, options = {}) {
  return (req, res, next) => {
    const organizationId =
      options.organizationId ||
      req.params?.organizationId ||
      req.body?.organizationId ||
      req.query?.organizationId ||
      req.user?.organizationId ||
      null;

    const reason =
      options.reason ||
      req.body?.reason ||
      req.query?.reason ||
      null;

    if (!req.user) {
      const audit = createAuditEvent({
        actorId: 'anonymous',
        actorRole: 'ANONYMOUS',
        action: 'authorization.check',
        permission,
        organizationId,
        reason,
        result: 'UNAUTHENTICATED',
      });

      if (typeof options.onAudit === 'function') {
        options.onAudit(audit);
      }

      return res.status(401).json({
        error: 'Non authentifié',
      });
    }

    if (!can(req.user, permission)) {
      const audit = createAuditEvent({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'authorization.check',
        permission,
        organizationId,
        reason,
        result: 'DENIED',
      });

      if (typeof options.onAudit === 'function') {
        options.onAudit(audit);
      }

      return res.status(403).json({
        error: 'Permission insuffisante',
        permission,
      });
    }

    const audit = createAuditEvent({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'authorization.check',
      permission,
      organizationId,
      reason,
      result: 'ALLOWED',
    });

    if (typeof options.onAudit === 'function') {
      options.onAudit(audit);
    }

    next();
  };
}

module.exports = {
  requirePermission,
};
