// ============================================================
// TEST RÔLES
// ============================================================

const { ROLES, hasPermission } = require('../security/roles');

describe('Rôles DAGOOS', () => {
  test('SUPER_ADMIN existe', () => {
    expect(ROLES.SUPER_ADMIN).toBeDefined();
  });

  test('ADMIN existe', () => {
    expect(ROLES.ADMIN).toBeDefined();
  });

  test('FLEET_MANAGER existe', () => {
    expect(ROLES.FLEET_MANAGER).toBeDefined();
  });

  test('COOP_MANAGER existe', () => {
    expect(ROLES.COOP_MANAGER).toBeDefined();
  });

  test('DRIVER existe', () => {
    expect(ROLES.DRIVER).toBeDefined();
  });

  test('COOPERATIVE ne doit plus exister', () => {
    expect(ROLES.COOPERATIVE).toBeUndefined();
  });
});
