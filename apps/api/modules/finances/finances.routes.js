const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');

const router = express.Router();

// =========================================================
// HELPERS
// =========================================================

async function getOrganizationId(req) {
  if (req.user.organizationId) {
    return req.user.organizationId;
  }

  if (req.user.driverId) {
    const driver = await prisma.driver.findUnique({
      where: { id: req.user.driverId },
      select: { organizationId: true }
    });

    return driver?.organizationId || null;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      driver: {
        select: {
          organizationId: true
        }
      }
    }
  });

  return user?.driver?.organizationId || null;
}

async function getOrganizationDriverIds(req) {
  const organizationId = await getOrganizationId(req);

  if (!organizationId) {
    return [];
  }

  const drivers = await prisma.driver.findMany({
    where: { organizationId },
    select: { id: true }
  });

  return drivers.map((driver) => driver.id);
}

function isAdmin(req) {
  return req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN';
}

// =========================================================
// COURSES
// =========================================================

// GET /api/finances/courses
router.get('/courses', authMiddleware, requirePermission('finances.read'), async (req, res) => {
  try {
    const where = {};

    if (isAdmin(req)) {
      if (req.query.driverId) {
        where.driverId = req.query.driverId;
      }
    } else if (req.user.role === 'DRIVER' && req.user.driverId) {
      where.driverId = req.user.driverId;
    } else {
      const driverIds = await getOrganizationDriverIds(req);

      if (req.query.driverId) {
        if (!driverIds.includes(req.query.driverId)) {
          return res.status(403).json({
            success: false,
            error: 'Accès refusé à ce chauffeur'
          });
        }

        where.driverId = req.query.driverId;
      } else {
        where.driverId = {
          in: driverIds
        };
      }
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            driverCode: true,
            status: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        vehicle: {
          select: {
            id: true,
            plate: true,
            model: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: 500
    });

    res.json(courses);
  } catch (error) {
    console.error('GET /finances/courses:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/finances/courses
router.post('/courses', authMiddleware, requirePermission('courses.create'), async (req, res) => {
  try {
    if (!req.user.driverId) {
      return res.status(400).json({
        success: false,
        error: 'Chauffeur non associé'
      });
    }

    const driver = await prisma.driver.findUnique({
      where: {
        id: req.user.driverId
      }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Chauffeur introuvable'
      });
    }

    const {
      vehicleId,
      type,
      distanceKm,
      price,
      commission
    } = req.body;

    if (!price || Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Montant invalide'
      });
    }

    const finalVehicleId = vehicleId || driver.vehicleId;

    if (!finalVehicleId) {
      return res.status(400).json({
        success: false,
        error: 'Aucun véhicule associé au chauffeur'
      });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: {
        id: finalVehicleId
      },
      select: {
        id: true,
        organizationId: true
      }
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Véhicule introuvable'
      });
    }

    if (
      vehicle.organizationId &&
      vehicle.organizationId !== driver.organizationId
    ) {
      return res.status(403).json({
        success: false,
        error: 'Véhicule non autorisé pour ce chauffeur'
      });
    }

    const amount = Number(price);

    const course = await prisma.course.create({
      data: {
        driverId: driver.id,
        vehicleId: finalVehicleId,
        type: type || 'NORMALE',
        distanceKm: Number(distanceKm || 0),
        price: amount,
        commission:
          commission !== undefined
            ? Number(commission)
            : Math.round(amount * 0.20)
      },
      include: {
        driver: {
          select: {
            id: true,
            driverCode: true,
            user: {
              select: {
                name: true
              }
            }
          }
        },
        vehicle: {
          select: {
            id: true,
            plate: true,
            model: true
          }
        }
      }
    });

    res.status(201).json(course);
  } catch (error) {
    console.error('POST /finances/courses:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =========================================================
// ROUTES MÉTIER COURSE
// =========================================================

// POST /api/finances/courses/:id/start - Démarrer la course (EN_ATTENTE → EN_ROUTE)
router.post('/courses/:id/start', authMiddleware, async (req, res) => {
  try {
    if (!req.user.driverId) {
      return res.status(403).json({ error: 'Chauffeur non associé' });
    }

    const course = await prisma.course.findUnique({
      where: { id: req.params.id }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course introuvable' });
    }

    if (course.driverId !== req.user.driverId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    if (course.statut !== 'EN_ATTENTE') {
      return res.status(409).json({ error: 'Course déjà démarrée ou terminée' });
    }

    const updated = await prisma.course.update({
      where: { id: req.params.id },
      data: {
        statut: 'EN_ROUTE',
        startedAt: new Date()
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('POST /courses/:id/start:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/finances/courses/:id/complete - Terminer la course (EN_COURS → TERMINEE)
router.post('/courses/:id/complete', authMiddleware, async (req, res) => {
  try {
    if (!req.user.driverId) {
      return res.status(403).json({ error: 'Chauffeur non associé' });
    }

    const course = await prisma.course.findUnique({
      where: { id: req.params.id }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course introuvable' });
    }

    if (course.driverId !== req.user.driverId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Accepter EN_ROUTE ou EN_COURS → TERMINEE
    if (course.statut !== 'EN_ROUTE' && course.statut !== 'EN_COURS') {
      return res.status(409).json({ error: 'Course non démarrée' });
    }

    // Si distanceKm envoyée, la prendre ; sinon conserver l'actuelle
    const distanceFinale = req.body.distanceKm !== undefined
      ? Number(req.body.distanceKm)
      : course.distanceKm;

    // Recalculer le prix final si la distance a changé
    // Pour l'instant : conserver le prix figé (géocodage à venir)
    const prixFinal = course.price;
    const montantChauffeurFinal = course.montantChauffeur;
    const montantOrganisationFinal = course.montantOrganisation;

    const updated = await prisma.course.update({
      where: { id: req.params.id },
      data: {
        statut: 'TERMINEE',
        distanceKm: distanceFinale,
        price: prixFinal,
        montantChauffeur: montantChauffeurFinal,
        montantOrganisation: montantOrganisationFinal,
        commission: montantOrganisationFinal, // legacy
        completedAt: new Date()
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('POST /courses/:id/complete:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/finances/courses/:id/cancel - Annuler la course
router.post('/courses/:id/cancel', authMiddleware, async (req, res) => {
  try {
    if (!req.user.driverId) {
      return res.status(403).json({ error: 'Chauffeur non associé' });
    }

    const course = await prisma.course.findUnique({
      where: { id: req.params.id }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course introuvable' });
    }

    if (course.driverId !== req.user.driverId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    if (course.statut === 'TERMINEE' || course.statut === 'ANNULEE') {
      return res.status(409).json({ error: 'Course déjà terminée ou annulée' });
    }

    const { motifAnnulation } = req.body;

    const updated = await prisma.course.update({
      where: { id: req.params.id },
      data: {
        statut: 'ANNULEE',
        motifAnnulation: motifAnnulation || 'ANNULATION_CHAUFFEUR',
        annulePar: 'DRIVER',
        cancelledAt: new Date()
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('POST /courses/:id/cancel:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================================================
// TRANSACTIONS / PAYMENTS
// =========================================================

// GET /api/finances/transactions
router.get('/transactions', authMiddleware, requirePermission('finances.read'), async (req, res) => {
  try {
    const where = {};

    if (req.user.role === 'DRIVER' && req.user.driverId) {
      // SELF : un chauffeur ne peut voir que ses propres transactions.
      const trips = await prisma.trip.findMany({
        where: {
          driverId: req.user.driverId
        },
        select: {
          id: true
        }
      });

      const tripIds = trips.map((trip) => trip.id);

      if (!tripIds.length) {
        return res.json([]);
      }

      where.tripId = {
        in: tripIds
      };
    } else if (!isAdmin(req)) {
      // ORGANIZATION : Fleet / Coop ne voient que les transactions
      // des chauffeurs de leur propre organisation.
      const driverIds = await getOrganizationDriverIds(req);

      if (!driverIds.length) {
        return res.json([]);
      }

      const trips = await prisma.trip.findMany({
        where: {
          driverId: {
            in: driverIds
          }
        },
        select: {
          id: true
        }
      });

      const tripIds = trips.map((trip) => trip.id);

      if (!tripIds.length) {
        return res.json([]);
      }

      where.tripId = {
        in: tripIds
      };
    }

    if (req.query.method) {
      where.method = req.query.method;
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: {
        date: 'desc'
      },
      take: 500
    });

    res.json(payments);
  } catch (error) {
    console.error('GET /finances/transactions:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =========================================================
// VERSEMENTS
// =========================================================

// GET /api/finances/versements
router.get('/versements', authMiddleware, requirePermission('finances.read'), async (req, res) => {
  try {
    const where = {};

    if (isAdmin(req)) {
      if (req.query.driverId) {
        where.driverId = req.query.driverId;
      }
    } else if (req.user.role === 'DRIVER' && req.user.driverId) {
      where.driverId = req.user.driverId;
    } else {
      const driverIds = await getOrganizationDriverIds(req);

      if (!driverIds.length) {
        return res.json([]);
      }

      if (req.query.driverId) {
        if (!driverIds.includes(req.query.driverId)) {
          return res.status(403).json({
            success: false,
            error: 'Accès refusé à ce chauffeur'
          });
        }

        where.driverId = req.query.driverId;
      } else {
        where.driverId = {
          in: driverIds
        };
      }
    }

    if (req.query.status) {
      where.status = req.query.status;
    }

    if (req.query.periode) {
      where.periode = req.query.periode;
    }

    const versements = await prisma.versement.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: 500
    });

    res.json(versements);
  } catch (error) {
    console.error('GET /finances/versements:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/finances/versements
router.post('/versements', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'DRIVER') {
      return res.status(403).json({
        success: false,
        error: 'Seul un chauffeur peut demander un versement'
      });
    }

    if (!req.user.driverId) {
      return res.status(400).json({
        success: false,
        error: 'Chauffeur non associé'
      });
    }

    const { amount, periode } = req.body;

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Montant invalide'
      });
    }

    if (!periode || !/^\d{4}-(0[1-9]|1[0-2])$/.test(periode)) {
      return res.status(400).json({
        success: false,
        error: 'Période invalide. Format attendu : YYYY-MM'
      });
    }

    const driver = await prisma.driver.findUnique({
      where: {
        id: req.user.driverId
      },
      select: {
        id: true,
        organizationId: true
      }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Chauffeur introuvable'
      });
    }

    const versement = await prisma.versement.create({
      data: {
        driverId: driver.id,
        amount: parsedAmount,
        periode,
        status: 'en_attente'
      }
    });

    res.status(201).json(versement);
  } catch (error) {
    console.error('POST /finances/versements:', error);

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la demande de versement'
    });
  }
});

// =========================================================
// DÉPENSES
// =========================================================

// GET /api/finances/expenses
router.get('/expenses', authMiddleware, requirePermission('finances.expenses.read'), async (req, res) => {
  try {
    const where = {};

    if (isAdmin(req)) {
      if (req.query.driverId) {
        where.driverId = req.query.driverId;
      }

      if (req.query.organizationId) {
        where.organizationId = req.query.organizationId;
      }
    } else if (req.user.role === 'DRIVER') {
      if (!req.user.driverId) {
        return res.status(400).json({
          success: false,
          error: 'Chauffeur non associé'
        });
      }

      where.driverId = req.user.driverId;
    } else {
      const organizationId = await getOrganizationId(req);

      if (!organizationId) {
        return res.json([]);
      }

      where.organizationId = organizationId;

      if (req.query.driverId) {
        const driver = await prisma.driver.findFirst({
          where: {
            id: req.query.driverId,
            organizationId
          },
          select: {
            id: true
          }
        });

        if (!driver) {
          return res.status(403).json({
            success: false,
            error: 'Accès refusé à ce chauffeur'
          });
        }

        where.driverId = driver.id;
      }
    }

    if (req.query.category) {
      where.category = req.query.category;
    }

    if (req.query.from || req.query.to) {
      where.date = {};

      if (req.query.from) {
        const from = new Date(req.query.from);

        if (Number.isNaN(from.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Date de début invalide'
          });
        }

        where.date.gte = from;
      }

      if (req.query.to) {
        const to = new Date(req.query.to);

        if (Number.isNaN(to.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Date de fin invalide'
          });
        }

        where.date.lte = to;
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            driverCode: true,
            user: {
              select: {
                name: true
              }
            }
          }
        },
        vehicle: {
          select: {
            id: true,
            plate: true,
            model: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: 500
    });

    res.json(expenses);
  } catch (error) {
    console.error('GET /finances/expenses:', error);

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des dépenses'
    });
  }
});

// POST /api/finances/expenses
router.post('/expenses', authMiddleware, requirePermission('finances.expenses.create'), async (req, res) => {
  try {
    if (!req.user.driverId) {
      return res.status(400).json({
        success: false,
        error: 'Chauffeur non associé'
      });
    }

    const driver = await prisma.driver.findUnique({
      where: {
        id: req.user.driverId
      },
      select: {
        id: true,
        organizationId: true,
        vehicleId: true
      }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Chauffeur introuvable'
      });
    }

    const {
      category,
      amount,
      description,
      vehicleId
    } = req.body;

    const allowedCategories = [
      'carburant',
      'entretien',
      'pneu',
      'autre'
    ];

    const normalizedCategory = String(category || 'autre').trim().toLowerCase();

    if (!allowedCategories.includes(normalizedCategory)) {
      return res.status(400).json({
        success: false,
        error: 'Catégorie de dépense invalide'
      });
    }

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Montant invalide'
      });
    }

    const finalVehicleId = vehicleId || driver.vehicleId || null;

    if (finalVehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: {
          id: finalVehicleId
        },
        select: {
          id: true,
          organizationId: true
        }
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Véhicule introuvable'
        });
      }

      if (
        vehicle.organizationId &&
        vehicle.organizationId !== driver.organizationId
      ) {
        return res.status(403).json({
          success: false,
          error: 'Véhicule non autorisé pour ce chauffeur'
        });
      }
    }

    const cleanDescription =
      description !== undefined && description !== null
        ? String(description).trim().slice(0, 500)
        : null;

    const expense = await prisma.expense.create({
      data: {
        driverId: driver.id,
        organizationId: driver.organizationId,
        vehicleId: finalVehicleId,
        category: normalizedCategory,
        amount: parsedAmount,
        description: cleanDescription || null
      },
      include: {
        driver: {
          select: {
            id: true,
            driverCode: true,
            user: {
              select: {
                name: true
              }
            }
          }
        },
        vehicle: {
          select: {
            id: true,
            plate: true,
            model: true
          }
        }
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('POST /finances/expenses:', error);

    res.status(500).json({
      success: false,
      error: 'Erreur lors de l’enregistrement de la dépense'
    });
  }
});

// =========================================================
// STATS
// =========================================================

// GET /api/finances/stats/summary
router.get('/stats/summary', authMiddleware, requirePermission('finances.read'), async (req, res) => {
  try {
    const now = new Date();

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const week = new Date(now);
    const day = week.getDay();
    const diff = day === 0 ? 6 : day - 1;
    week.setDate(week.getDate() - diff);
    week.setHours(0, 0, 0, 0);

    const whereBase = {};

    if (req.user.role === 'DRIVER' && req.user.driverId) {
      whereBase.driverId = req.user.driverId;
    } else if (!isAdmin(req)) {
      const driverIds = await getOrganizationDriverIds(req);

      if (!driverIds.length) {
        return res.json({
          today: {
            count: 0,
            ca: 0,
            com: 0,
            net: 0
          },
          week: {
            count: 0,
            ca: 0,
            com: 0,
            net: 0
          }
        });
      }

      whereBase.driverId = {
        in: driverIds
      };
    }

    const [todayCourses, weekCourses] = await Promise.all([
      prisma.course.findMany({
        where: {
          ...whereBase,
          date: {
            gte: today
          }
        },
        select: {
          price: true,
          commission: true
        }
      }),

      prisma.course.findMany({
        where: {
          ...whereBase,
          date: {
            gte: week
          }
        },
        select: {
          price: true,
          commission: true
        }
      })
    ]);

    function calculate(courses) {
      const count = courses.length;

      const ca = courses.reduce(
        (sum, course) => sum + Number(course.price || 0),
        0
      );

      const com = courses.reduce(
        (sum, course) => sum + Number(course.commission || 0),
        0
      );

      return {
        count,
        ca,
        com,
        net: ca - com
      };
    }

    res.json({
      today: calculate(todayCourses),
      week: calculate(weekCourses)
    });
  } catch (error) {
    console.error('GET /finances/stats/summary:', error);

    res.status(500).json({
      success: false,
      error: 'Erreur stats'
    });
  }
});

module.exports = router;
