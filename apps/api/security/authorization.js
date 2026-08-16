const { hasPermission } = require('./roles');
const { SCOPES, getUserScope } = require('./scopes');

function can(user, permission) {
  if (!user || !permission) {
    return false;
  }

  return hasPermission(user.role, permission);
}

function canAccessOrganization(user, organizationId) {
  if (!user || !organizationId) {
    return false;
  }

  const scope = getUserScope(user);

  if (scope === SCOPES.GLOBAL) {
    return true;
  }

  if (scope === SCOPES.ORGANIZATION) {
    return Boolean(user.organizationId) &&
      user.organizationId === organizationId;
  }

  return false;
}

function canAccessSelf(user, userId) {
  if (!user || !userId) {
    return false;
  }

  if (getUserScope(user) !== SCOPES.SELF) {
    return false;
  }

  return user.id === userId;
}

function authorizeOrganization(user, permission, organizationId) {
  if (!can(user, permission)) {
    return false;
  }

  return canAccessOrganization(user, organizationId);
}

function authorizeSelf(user, permission, userId) {
  if (!can(user, permission)) {
    return false;
  }

  return canAccessSelf(user, userId);
}

module.exports = {
  can,
  canAccessOrganization,
  canAccessSelf,
  authorizeOrganization,
  authorizeSelf,
};
