const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');

const router = express.Router();

const PRIVILEGED_ROLES = ['SUPER_ADMIN', 'ADMIN'];

async function canAccessOrganization(req, organizationId) {
  if (PRIVILEGED_ROLES.includes(req.user.role)) return true;
  if (!organizationId) return false;
  if (req.user.organizationId) return req.user.organizationId === organizationId;

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { driver: { select: { organizationId: true } } },
  });
  return user?.driver?.organizationId === organizationId;
}

function getPeriodDates() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const weekStart = new Date(now);
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  weekStart.setDate(now.getDate() + mondayOffset);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  return { today, weekStartStr, monthStartStr };
}

// GET /api/drivers/:id/stats
router.get('/:id/stats', authMiddleware, requirePermission('drivers.read'), async (req, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      select: { id: true, organizationId: true, driverCode: true },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Chauffeur introuvable' });
    }

    if (!(await canAccessOrganization(req, driver.organizationId))) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { today, weekStartStr, monthStartStr } = getPeriodDates();

    // Récupérer les courses terminées sur la période
    const coursesToday = await prisma.course.findMany({
      where: {
        driverId: driver.id,
        statut: 'TERMINEE',
        date: { gte: new Date(today) },
      },
      select: { montantChauffeur: true, date: true },
    });

    const coursesWeek = await prisma.course.findMany({
      where: {
        driverId: driver.id,
        statut: 'TERMINEE',
        date: { gte: new Date(weekStartStr) },
      },
      select: { montantChauffeur: true, date: true },
    });

    const coursesMonth = await prisma.course.findMany({
      where: {
        driverId: driver.id,
        statut: 'TERMINEE',
        date: { gte: new Date(monthStartStr) },
      },
      select: { montantChauffeur: true, date: true },
    });

    // Récupérer les dépenses
    const expensesToday = await prisma.expense.findMany({
      where: {
        driverId: driver.id,
        date: { gte: new Date(today) },
      },
      select: { amount: true },
    });

    const expensesWeek = await prisma.expense.findMany({
      where: {
        driverId: driver.id,
        date: { gte: new Date(weekStartStr) },
      },
      select: { amount: true },
    });

    const expensesMonth = await prisma.expense.findMany({
      where: {
        driverId: driver.id,
        date: { gte: new Date(monthStartStr) },
      },
      select: { amount: true },
    });

    const sum = (arr, field) => arr.reduce((acc, item) => acc + Number(item[field] || 0), 0);

    const revenueToday = sum(coursesToday, 'montantChauffeur');
    const revenueWeek = sum(coursesWeek, 'montantChauffeur');
    const revenueMonth = sum(coursesMonth, 'montantChauffeur');

    const expensesTodayTotal = sum(expensesToday, 'amount');
    const expensesWeekTotal = sum(expensesWeek, 'amount');
    const expensesMonthTotal = sum(expensesMonth, 'amount');

    // Pointage du jour
    const todayPointage = await prisma.pointage.findFirst({
      where: {
        driverId: driver.id,
        date: today,
        type: 'arrivee',
      },
      orderBy: { heure: 'asc' },
    });

    // Dossier pour l'heure de prise de poste
    const dossier = await prisma.driverDossier.findUnique({
      where: { driverId: driver.id },
      select: { heurePrisePoste: true },
    });

    let attendance = {
      status: 'NON_DEBUTE',
      late: false,
      minutesLate: 0,
    };

    if (todayPointage) {
      attendance.status = todayPointage.statut || 'PRESENT';

      const heurePrisePoste = dossier?.heurePrisePoste || '07:00';
      const [h, m] = heurePrisePoste.split(':').map(Number);
      const expectedTime = new Date(today);
      expectedTime.setHours(h || 7, m || 0, 0, 0);

      const actualTime = new Date(todayPointage.heure);

      if (actualTime > expectedTime) {
        const diffMinutes = Math.floor((actualTime - expectedTime) / 60000);
        attendance.late = diffMinutes > 30;
        attendance.minutesLate = diffMinutes;
      }
    }

    res.json({
      today: {
        courses: coursesToday.length,
        revenue: revenueToday,
        expenses: expensesTodayTotal,
        net: revenueToday - expensesTodayTotal,
      },
      week: {
        courses: coursesWeek.length,
        revenue: revenueWeek,
        expenses: expensesWeekTotal,
        net: revenueWeek - expensesWeekTotal,
      },
      month: {
        courses: coursesMonth.length,
        revenue: revenueMonth,
        expenses: expensesMonthTotal,
        net: revenueMonth - expensesMonthTotal,
      },
      attendance,
    });
  } catch (error) {
    console.error('GET /drivers/:id/stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
