import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveOrganization } from './organization';

test('resolveOrganization uses organizationId from auth payload', () => {
  const me = {
    email: 'fleet-premium@test.mg',
    organizationId: 'org-42',
  };
  const organizations = [
    { id: 'org-1', type: 'COOPERATIVE', email: 'contact@sonatra.mg' },
    { id: 'org-42', type: 'FLEET_MANAGER', email: 'fleet-premium@test.mg' },
  ];

  const organization = resolveOrganization(me, organizations, 'FLEET_MANAGER');

  assert.ok(organization);
  assert.equal(organization.id, 'org-42');
  assert.equal(organization.type, 'FLEET_MANAGER');
});

test('resolveOrganization uses direct organization object when present', () => {
  const me = {
    email: 'contact@sonatra.mg',
    organization: { id: 'org-7', type: 'COOPERATIVE', email: 'contact@sonatra.mg' },
  };

  const organization = resolveOrganization(me, [], 'COOPERATIVE');

  assert.ok(organization);
  assert.equal(organization.id, 'org-7');
});

test('resolveOrganization finds the expected type in the organization list', () => {
  const me = { email: 'fleet-premium@test.mg' };
  const organizations = [
    { id: 'org-1', type: 'COOPERATIVE', email: 'contact@sonatra.mg' },
    { id: 'org-2', type: 'FLEET_MANAGER', email: 'fleet-premium@test.mg' },
  ];

  const organization = resolveOrganization(me, organizations, 'FLEET_MANAGER');

  assert.ok(organization);
  assert.equal(organization.id, 'org-2');
});
