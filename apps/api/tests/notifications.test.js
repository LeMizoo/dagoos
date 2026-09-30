// ============================================================
// TESTS — Notifications isolation (2.3)
// ============================================================
//
// Vérifie l'isolation des notifications entre rôles et périmètres.
//
// Chaîne testée :
//   JWT réel → authMiddleware réel → requirePermission réel
//     → buildNotificationScope → Prisma mocké
//
// Aucune base de données n'est utilisée.
// ============================================================

// IMPORTANT : doit précéder tout require qui lit JWT_SECRET
require('dotenv/config');

jest.mock('../lib/prisma', () => ({
  notification: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
  driver: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
}));

const request = require('supertest');
const app = require('../app');
const prisma = require('../lib/prisma');
const { generateToken } = require('./helpers/auth');
const { buildNotificationScope } = require('../modules/notifications/notifications.scope');

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function authHeader(user) {
  return `Bearer ${generateToken(user)}`;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================
// 1. buildNotificationScope — tests unitaires
// ============================================================

describe('buildNotificationScope — règles de périmètre', () => {
  test('DRIVER → filtre userId', () => {
    const result = buildNotificationScope({ id: 'u1', role: 'DRIVER' });
    expect(result).toEqual({ ok: true, where: { userId: 'u1' } });
  });

  test('FLEET_MANAGER → filtre organizationId', () => {
    const result = buildNotificationScope({
      id: 'u1',
      role: 'FLEET_MANAGER',
      organizationId: 'o1',
    });
    expect(result).toEqual({ ok: true, where: { organizationId: 'o1' } });
  });

  test('COOP_MANAGER → filtre organizationId', () => {
    const result = buildNotificationScope({
      id: 'u1',
      role: 'COOP_MANAGER',
      organizationId: 'o2',
    });
    expect(result).toEqual({ ok: true, where: { organizationId: 'o2' } });
  });

  test('FLEET_MANAGER sans organizationId → 403', () => {
    const result = buildNotificationScope({
      id: 'u1',
      role: 'FLEET_MANAGER',
      organizationId: null,
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
  });

  test('ADMIN → périmètre vide (global)', () => {
    const result = buildNotificationScope({ id: 'u1', role: 'ADMIN' });
    expect(result).toEqual({ ok: true, where: {} });
  });

  test('SUPER_ADMIN → périmètre vide (global)', () => {
    const result = buildNotificationScope({ id: 'u1', role: 'SUPER_ADMIN' });
    expect(result).toEqual({ ok: true, where: {} });
  });

  test('rôle inconnu → 403 (fail-closed)', () => {
    const result = buildNotificationScope({ id: 'u1', role: 'HACKER' });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
  });

  test('user null → 401', () => {
    const result = buildNotificationScope(null);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });
});

// ============================================================
// 2. GET /api/notifications
// ============================================================

describe('GET /api/notifications — isolation', () => {
  test('DRIVER → where.userId', async () => {
    prisma.notification.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', authHeader({ id: 'driver-1', role: 'DRIVER' }));

    expect(res.status).toBe(200);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'driver-1' }),
      })
    );
  });

  test('FLEET_MANAGER → where.organizationId', async () => {
    prisma.notification.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/notifications')
      .set(
        'Authorization',
        authHeader({
          id: 'mgr-1',
          role: 'FLEET_MANAGER',
          organizationId: 'org-1',
        })
      );

    expect(res.status).toBe(200);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-1' }),
      })
    );
  });

  test('ADMIN → pas de filtre d\'isolation', async () => {
    prisma.notification.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', authHeader({ id: 'admin-1', role: 'ADMIN' }));

    expect(res.status).toBe(200);

    const callArg = prisma.notification.findMany.mock.calls[0][0];
    expect(callArg.where).not.toHaveProperty('userId');
    expect(callArg.where).not.toHaveProperty('organizationId');
  });

  test('rôle inconnu → 403', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', authHeader({ id: 'x', role: 'HACKER' }));

    expect(res.status).toBe(403);
    expect(prisma.notification.findMany).not.toHaveBeenCalled();
  });
});

// ============================================================
// 3. GET /api/notifications/:id
// ============================================================

describe('GET /api/notifications/:id — isolation', () => {
  test('propriétaire → 200', async () => {
    prisma.notification.findUnique.mockResolvedValue({
      id: 'n1',
      userId: 'driver-1',
      organizationId: 'org-1',
    });

    const res = await request(app)
      .get('/api/notifications/n1')
      .set('Authorization', authHeader({ id: 'driver-1', role: 'DRIVER' }));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('n1');
  });

  test('non-propriétaire même rôle → 403', async () => {
    prisma.notification.findUnique.mockResolvedValue({
      id: 'n1',
      userId: 'driver-OTHER',
    });

    const res = await request(app)
      .get('/api/notifications/n1')
      .set('Authorization', authHeader({ id: 'driver-1', role: 'DRIVER' }));

    expect(res.status).toBe(403);
  });

  test('inexistant → 404', async () => {
    prisma.notification.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/notifications/nope')
      .set('Authorization', authHeader({ id: 'driver-1', role: 'DRIVER' }));

    expect(res.status).toBe(404);
  });

  test('rôle inconnu → 403', async () => {
    const res = await request(app)
      .get('/api/notifications/n1')
      .set('Authorization', authHeader({ id: 'x', role: 'HACKER' }));

    expect(res.status).toBe(403);
    expect(prisma.notification.findUnique).not.toHaveBeenCalled();
  });
});

// ============================================================
// 4. PUT /api/notifications/:id/read
// ============================================================

describe('PUT /api/notifications/:id/read — isolation', () => {
  test('propriétaire → 200 + update appelé', async () => {
    prisma.notification.findUnique.mockResolvedValue({
      id: 'n1',
      userId: 'driver-1',
    });
    prisma.notification.update.mockResolvedValue({ id: 'n1', read: true });

    const res = await request(app)
      .put('/api/notifications/n1/read')
      .set('Authorization', authHeader({ id: 'driver-1', role: 'DRIVER' }));

    expect(res.status).toBe(200);
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'n1' },
      data: { read: true },
    });
  });

  test('non-propriétaire → 403 + update NON appelé', async () => {
    prisma.notification.findUnique.mockResolvedValue({
      id: 'n1',
      userId: 'driver-OTHER',
    });

    const res = await request(app)
      .put('/api/notifications/n1/read')
      .set('Authorization', authHeader({ id: 'driver-1', role: 'DRIVER' }));

    expect(res.status).toBe(403);
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });

  test('inexistant → 404', async () => {
    prisma.notification.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/notifications/nope/read')
      .set('Authorization', authHeader({ id: 'driver-1', role: 'DRIVER' }));

    expect(res.status).toBe(404);
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });
});

// ============================================================
// 5. GET /api/notifications/unread-count
// ============================================================

describe('GET /api/notifications/unread-count — isolation', () => {
  test('DRIVER → where.userId + read:false', async () => {
    prisma.notification.count.mockResolvedValue(3);

    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', authHeader({ id: 'driver-1', role: 'DRIVER' }));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 3 });
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { userId: 'driver-1', read: false },
    });
  });

  test('FLEET_MANAGER → where.organizationId + read:false', async () => {
    prisma.notification.count.mockResolvedValue(5);

    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set(
        'Authorization',
        authHeader({
          id: 'mgr-1',
          role: 'FLEET_MANAGER',
          organizationId: 'org-1',
        })
      );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 5 });
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', read: false },
    });
  });

  test('ADMIN → where vide + read:false', async () => {
    prisma.notification.count.mockResolvedValue(100);

    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', authHeader({ id: 'admin-1', role: 'ADMIN' }));

    expect(res.status).toBe(200);
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { read: false },
    });
  });
});
