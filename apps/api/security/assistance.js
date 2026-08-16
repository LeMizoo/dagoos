const crypto = require('crypto');
const { can } = require('./authorization');
const { createAuditEvent } = require('./audit');

const requests = new Map();

function audit(event) {
  if (typeof event === 'function') {
    event();
  }
}

function requestAccess({
  requesterId,
  requesterRole,
  organizationId = null,
  targetId = null,
  reason,
  durationMinutes,
  onAudit = null,
}) {
  if (!requesterId || !requesterRole) {
    throw new Error('Demandeur obligatoire');
  }

  if (!reason || !reason.trim()) {
    throw new Error('La raison est obligatoire');
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error('Durée invalide');
  }

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + durationMinutes * 60 * 1000
  );

  const request = Object.freeze({
    id: crypto.randomUUID(),
    requesterId,
    requesterRole,
    organizationId,
    targetId,
    reason: reason.trim(),
    durationMinutes,
    status: 'PENDING',
    createdAt: now.toISOString(),
    approvedAt: null,
    approvedBy: null,
    approverRole: null,
    revokedAt: null,
    revokedBy: null,
    expiresAt: expiresAt.toISOString(),
  });

  requests.set(request.id, request);

  audit(() => onAudit?.(createAuditEvent({
    actorId: requesterId,
    actorRole: requesterRole,
    action: 'assistance.request',
    permission: 'assistance.request',
    organizationId,
    targetId,
    reason: request.reason,
    result: 'PENDING',
  })));

  return request;
}

function approveAccess({
  requestId,
  approverId,
  approverRole,
  onAudit = null,
}) {
  const request = requests.get(requestId);

  if (!request) {
    throw new Error('Demande d assistance introuvable');
  }

  if (request.status !== 'PENDING') {
    throw new Error('Demande non approuvable');
  }

  if (!approverId || !approverRole) {
    throw new Error('Approbateur obligatoire');
  }

  const approver = {
    id: approverId,
    role: approverRole,
  };

  if (!can(approver, 'assistance.approve')) {
    audit(() => onAudit?.(createAuditEvent({
      actorId: approverId,
      actorRole: approverRole,
      action: 'assistance.approve',
      permission: 'assistance.approve',
      organizationId: request.organizationId,
      targetId: request.targetId,
      reason: 'Permission insuffisante',
      result: 'DENIED',
    })));

    throw new Error('Permission assistance.approve requise');
  }

  const approved = Object.freeze({
    ...request,
    status: 'ACTIVE',
    approvedAt: new Date().toISOString(),
    approvedBy: approverId,
    approverRole,
  });

  requests.set(requestId, approved);

  audit(() => onAudit?.(createAuditEvent({
    actorId: approverId,
    actorRole: approverRole,
    action: 'assistance.approve',
    permission: 'assistance.approve',
    organizationId: request.organizationId,
    targetId: request.targetId,
    reason: request.reason,
    result: 'ALLOWED',
  })));

  return approved;
}

function revokeAccess({
  requestId,
  revokerId,
  revokerRole,
  onAudit = null,
}) {
  const request = requests.get(requestId);

  if (!request) {
    throw new Error('Demande d assistance introuvable');
  }

  if (request.status !== 'ACTIVE') {
    throw new Error('Accès non actif');
  }

  if (!revokerId || !revokerRole) {
    throw new Error('Révocateur obligatoire');
  }

  const revoker = {
    id: revokerId,
    role: revokerRole,
  };

  if (!can(revoker, 'assistance.revoke')) {
    audit(() => onAudit?.(createAuditEvent({
      actorId: revokerId,
      actorRole: revokerRole,
      action: 'assistance.revoke',
      permission: 'assistance.revoke',
      organizationId: request.organizationId,
      targetId: request.targetId,
      reason: 'Permission insuffisante',
      result: 'DENIED',
    })));

    throw new Error('Permission assistance.revoke requise');
  }

  const revoked = Object.freeze({
    ...request,
    status: 'REVOKED',
    revokedAt: new Date().toISOString(),
    revokedBy: revokerId,
  });

  requests.set(requestId, revoked);

  audit(() => onAudit?.(createAuditEvent({
    actorId: revokerId,
    actorRole: revokerRole,
    action: 'assistance.revoke',
    permission: 'assistance.revoke',
    organizationId: request.organizationId,
    targetId: request.targetId,
    reason: request.reason,
    result: 'ALLOWED',
  })));

  return revoked;
}

function isAccessActive(requestId) {
  const request = requests.get(requestId);

  if (!request || request.status !== 'ACTIVE') {
    return false;
  }

  if (new Date(request.expiresAt).getTime() <= Date.now()) {
    requests.set(requestId, Object.freeze({
      ...request,
      status: 'EXPIRED',
    }));

    return false;
  }

  return true;
}

function getAccess(requestId) {
  return requests.get(requestId) || null;
}

module.exports = {
  requestAccess,
  approveAccess,
  revokeAccess,
  isAccessActive,
  getAccess,
};
