const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ===== AJOUTER UN CHAUFFEUR =====
exports.addDriver = async (req, res) => {
  try {
    if (!['FLEET_MANAGER', 'SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé. Rôle non autorisé.' });
    }

    const { name, email, phone, password, licenseNumber } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà.' });
    }

    if (licenseNumber) {
      const existingLicense = await prisma.driver.findFirst({ where: { licenseNumber } });
      if (existingLicense) {
        return res.status(400).json({ error: 'Ce numéro de permis est déjà enregistré.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password || 'Dagoos2026!', 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone: phone || '',
          password: hashedPassword,
          role: 'DRIVER'
        }
      });

      const driver = await tx.driver.create({
        data: {
          userId: user.id,
          licenseNumber: licenseNumber || `TEMP-${user.id.substring(0, 8)}`,
          phone: phone || '',
          isAvailable: true,
          rating: 0
        }
      });

      return { user, driver };
    });

    res.status(201).json({
      message: 'Chauffeur ajouté avec succès !',
      driver: {
        id: result.driver.id,
        userId: result.user.id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        licenseNumber: result.driver.licenseNumber,
        isAvailable: result.driver.isAvailable,
        rating: result.driver.rating
      }
    });

  } catch (error) {
    console.error('Erreur ajout chauffeur:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du chauffeur.' });
  }
};

// ===== LISTER LES CHAUFFEURS =====
exports.getDrivers = async (req, res) => {
  try {
    let drivers;

    if (['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      drivers = await prisma.driver.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              createdAt: true
            }
          },
          vehicle: {
            select: {
              id: true,
              plateNumber: true,
              brand: true,
              model: true,
              type: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (req.user.role === 'FLEET_MANAGER') {
      drivers = await prisma.driver.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              createdAt: true
            }
          },
          vehicle: {
            select: {
              id: true,
              plateNumber: true,
              brand: true,
              model: true,
              type: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    res.json(drivers);
  } catch (error) {
    console.error('Erreur liste chauffeurs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des chauffeurs.' });
  }
};

// ===== DÉTAIL D'UN CHAUFFEUR =====
exports.getDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true
          }
        },
        vehicle: true,
        trips: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            payment: true
          }
        }
      }
    });

    if (!driver) {
      return res.status(404).json({ error: 'Chauffeur non trouvé.' });
    }

    if (req.user.role === 'FLEET_MANAGER' && driver.user.role !== 'DRIVER') {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    res.json(driver);
  } catch (error) {
    console.error('Erreur détail chauffeur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du chauffeur.' });
  }
};

// ===== MODIFIER UN CHAUFFEUR =====
exports.updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable, licenseNumber, phone } = req.body;

    const driver = await prisma.driver.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!driver) {
      return res.status(404).json({ error: 'Chauffeur non trouvé.' });
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'FLEET_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const updatedDriver = await prisma.$transaction(async (tx) => {
      const driverUpdate = await tx.driver.update({
        where: { id },
        data: {
          ...(isAvailable !== undefined && { isAvailable }),
          ...(licenseNumber && { licenseNumber }),
          ...(phone && { phone })
        }
      });

      if (phone) {
        await tx.user.update({
          where: { id: driver.userId },
          data: { phone }
        });
      }

      return driverUpdate;
    });

    res.json({
      message: 'Chauffeur mis à jour avec succès !',
      driver: updatedDriver
    });
  } catch (error) {
    console.error('Erreur modification chauffeur:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du chauffeur.' });
  }
};

// ===== SUPPRIMER UN CHAUFFEUR =====
exports.deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!driver) {
      return res.status(404).json({ error: 'Chauffeur non trouvé.' });
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé. Seuls les administrateurs peuvent supprimer un chauffeur.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.driver.delete({ where: { id } });
      await tx.user.delete({ where: { id: driver.userId } });
    });

    res.json({ message: 'Chauffeur supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur suppression chauffeur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du chauffeur.' });
  }
};
