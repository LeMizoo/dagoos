const PERMISSIONS = Object.freeze({
  ORGANIZATIONS_READ: 'organizations.read',
  ORGANIZATIONS_CREATE: 'organizations.create',
  ORGANIZATIONS_UPDATE: 'organizations.update',
  ORGANIZATIONS_SUSPEND: 'organizations.suspend',

  USERS_READ: 'users.read',
  USERS_MANAGE: 'users.manage',

  DRIVERS_READ: 'drivers.read',
  DRIVERS_MANAGE: 'drivers.manage',
  PROPRIETAIRES_READ: 'proprietaires.read',
  PROPRIETAIRES_MANAGE: 'proprietaires.manage',
  SOCIETES_READ: 'societes.read',
  SOCIETES_MANAGE: 'societes.manage',

  VEHICLES_READ: 'vehicles.read',
  VEHICLES_MANAGE: 'vehicles.manage',

  CONTRACTS_READ: 'contracts.read',
  CONTRACTS_MANAGE: 'contracts.manage',
  LIVRAISONS_READ: 'livraisons.read',
  LIVRAISONS_MANAGE: 'livraisons.manage',

  MAINTENANCE_READ: 'maintenance.read',
  MAINTENANCE_MANAGE: 'maintenance.manage',

  MESSAGES_READ: 'messages.read',
  MESSAGES_MANAGE: 'messages.manage',
  NOTIFICATIONS_READ: 'notifications.read',
  NOTIFICATIONS_MANAGE: 'notifications.manage',

  FINANCES_READ: 'finances.read',
  FINANCES_MANAGE: 'finances.manage',
  COURSES_CREATE: 'courses.create',

  TARIFS_READ: 'tarifs.read',
  TARIFS_MANAGE: 'tarifs.manage',

  LOGS_READ: 'logs.read',

  LANDING_MANAGE: 'landing.manage',

  FLEET_READ: 'fleet.read',
  FLEET_MANAGE: 'fleet.manage',

  COOP_READ: 'coop.read',
  COOP_MANAGE: 'coop.manage',

  PLANS_READ: 'plans.read',
  PLANS_MANAGE: 'plans.manage',

  SUBSCRIPTIONS_READ: 'subscriptions.read',
  SUBSCRIPTIONS_MANAGE: 'subscriptions.manage',

  BILLING_READ: 'billing.read',
  BILLING_MANAGE: 'billing.manage',

  RULES_READ: 'rules.read',
  RULES_MANAGE: 'rules.manage',

  MONITORING_READ: 'monitoring.read',

  SUPPORT_READ: 'support.read',
  SUPPORT_MANAGE: 'support.manage',

  ASSISTANCE_REQUEST: 'assistance.request',
  ASSISTANCE_APPROVE: 'assistance.approve',
  ASSISTANCE_REVOKE: 'assistance.revoke',

  AUDIT_READ: 'audit.read',
});

module.exports = {
  PERMISSIONS,
};
