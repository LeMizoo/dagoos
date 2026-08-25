// ============================================================
// FINANCES SERVICE
// Logique métier extraite des routes
// ============================================================

const prisma = require('../../../lib/prisma');

/**
 * Récupérer les courses avec filtres
 */
async function getCourses(filters = {}) {
  const where = {};
  
  if (filters.driverId) where.driverId = filters.driverId;
  if (filters.vehicleId) where.vehicleId = filters.vehicleId;
  if (filters.organizationId) where.organizationId = filters.organizationId;
  if (filters.date) where.date = { gte: new Date(filters.date) };

  return prisma.course.findMany({
    where,
    include: {
      driver: { include: { user: true } },
      vehicle: true,
    },
    orderBy: { date: 'desc' },
  });
}

/**
 * Créer une course
 */
async function createCourse(data) {
  return prisma.course.create({ data });
}

/**
 * Récupérer les transactions
 */
async function getTransactions(filters = {}) {
  const where = {};
  if (filters.organizationId) where.organizationId = filters.organizationId;
  return prisma.transaction.findMany({
    where,
    include: { organization: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Récupérer les versements
 */
async function getVersements(filters = {}) {
  const where = {};
  if (filters.driverId) where.driverId = filters.driverId;
  if (filters.organizationId) where.organizationId = filters.organizationId;
  return prisma.versement.findMany({
    where,
    include: { driver: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Créer un versement
 */
async function createVersement(data) {
  return prisma.versement.create({ data });
}

/**
 * Récupérer les dépenses
 */
async function getExpenses(filters = {}) {
  const where = {};
  if (filters.driverId) where.driverId = filters.driverId;
  if (filters.vehicleId) where.vehicleId = filters.vehicleId;
  if (filters.organizationId) where.organizationId = filters.organizationId;
  return prisma.expense.findMany({
    where,
    include: { driver: { include: { user: true } }, vehicle: true },
    orderBy: { date: 'desc' },
  });
}

/**
 * Créer une dépense
 */
async function createExpense(data) {
  return prisma.expense.create({ data });
}

/**
 * Obtenir le résumé financier
 */
async function getStatsSummary(filters = {}) {
  const where = {};
  if (filters.driverId) where.driverId = filters.driverId;
  if (filters.organizationId) where.organizationId = filters.organizationId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayCourses, weekCourses, todayExpenses, weekExpenses] = await Promise.all([
    prisma.course.findMany({ where: { ...where, date: { gte: today } } }),
    prisma.course.findMany({ where: { ...where, date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.expense.findMany({ where: { ...where, date: { gte: today } } }),
    prisma.expense.findMany({ where: { ...where, date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
  ]);

  const ca = todayCourses.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
  const com = Math.round(ca * 0.20);
  const net = ca - com;
  const expenses = todayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const weekCa = weekCourses.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
  const weekCom = Math.round(weekCa * 0.20);
  const weekNet = weekCa - weekCom;
  const weekExpenseTotal = weekExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return {
    today: { count: todayCourses.length, ca, com, net, expenses },
    week: { count: weekCourses.length, ca: weekCa, com: weekCom, net: weekNet, expenses: weekExpenseTotal },
  };
}

module.exports = {
  getCourses,
  createCourse,
  getTransactions,
  getVersements,
  createVersement,
  getExpenses,
  createExpense,
  getStatsSummary,
};
