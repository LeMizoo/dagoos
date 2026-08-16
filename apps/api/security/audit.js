function createAuditEvent({
  actorId,
  actorRole,
  action,
  permission = null,
  organizationId = null,
  targetId = null,
  reason = null,
  result,
}) {
  if (!actorId || !actorRole || !action || !result) {
    throw new Error('Informations d audit obligatoires manquantes');
  }

  return Object.freeze({
    actorId,
    actorRole,
    action,
    permission,
    organizationId,
    targetId,
    reason,
    result,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  createAuditEvent,
};
