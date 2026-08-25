// ============================================================
// TEST SCOPES
// ============================================================

const { SCOPES, getUserScope } = require('../security/scopes');

describe('Scopes utilisateur', () => {
  test('SUPER_ADMIN → GLOBAL', () => {
    expect(getUserScope({ role: 'SUPER_ADMIN' })).toBe(SCOPES.GLOBAL);
  });

  test('ADMIN → GLOBAL', () => {
    expect(getUserScope({ role: 'ADMIN' })).toBe(SCOPES.GLOBAL);
  });

  test('FLEET_MANAGER → ORGANIZATION', () => {
    expect(getUserScope({ role: 'FLEET_MANAGER' })).toBe(SCOPES.ORGANIZATION);
  });

  test('COOP_MANAGER → ORGANIZATION', () => {
    expect(getUserScope({ role: 'COOP_MANAGER' })).toBe(SCOPES.ORGANIZATION);
  });

  test('DRIVER → SELF', () => {
    expect(getUserScope({ role: 'DRIVER' })).toBe(SCOPES.SELF);
  });

  test('Rôle inconnu → null', () => {
    expect(getUserScope({ role: 'INCONNU' })).toBeNull();
  });
});
