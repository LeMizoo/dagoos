const SCOPES = Object.freeze({
  GLOBAL: 'GLOBAL',
  ORGANIZATION: 'ORGANIZATION',
  SELF: 'SELF',
});

function getUserScope(user) {
  if (!user || !user.role) {
    return null;
  }

  switch (user.role) {
    case 'SUPER_ADMIN':
      return SCOPES.GLOBAL;

    case 'ADMIN':
      return SCOPES.GLOBAL;

    case 'FLEET_MANAGER':
    case 'COOPERATIVE':
      return SCOPES.ORGANIZATION;

    case 'DRIVER':
      return SCOPES.SELF;

    default:
      return null;
  }
}

module.exports = {
  SCOPES,
  getUserScope,
};
