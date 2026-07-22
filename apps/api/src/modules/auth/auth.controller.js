const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dagoos_super_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const ALLOWED_REGISTRATION_ROLES = ['COOPERATIVE', 'FLEET_MANAGER'];

// ===== INSCRIPTION =====
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (role && !ALLOWED_REGISTRATION_ROLES.includes(role)) {
      return res.status(403).json({ 
        error: 'Ce rôle n\'est pas autorisé à l\'inscription publique.',
        allowedRoles: ALLOWED_REGISTRATION_ROLES
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: role || 'FLEET_MANAGER',
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Compte créé avec succès !',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription.' });
  }
};

// ===== CONNEXION CLASSIQUE (email + mot de passe) =====
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Connexion réussie !',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion.' });
  }
};

// ===== CONNEXION CHAUFFEUR (CODE + PIN) =====
exports.driverLogin = async (req, res) => {
  try {
    const { code, pin } = req.body;

    if (!code || !pin) {
      return res.status(400).json({ error: 'Code et PIN requis.' });
    }

    const driver = await prisma.driver.findFirst({
      where: { driverCode: code },
      include: { 
        user: true,
        organization: true
      }
    });

    if (!driver) {
      return res.status(401).json({ error: 'Code chauffeur invalide.' });
    }

    const validPin = await bcrypt.compare(pin, driver.pin);
    if (!validPin) {
      return res.status(401).json({ error: 'PIN incorrect.' });
    }

    if (driver.status !== 'active') {
      return res.status(403).json({ error: 'Compte chauffeur désactivé.' });
    }

    const token = jwt.sign(
      { id: driver.user.id, email: driver.user.email || `${code}@driver.dagoos.mg`, role: 'DRIVER', driverId: driver.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Connexion réussie !',
      token,
      user: {
        id: driver.user.id,
        name: driver.user.name || code,
        email: driver.user.email,
        phone: driver.user.phone,
        role: 'DRIVER',
        driverCode: driver.driverCode,
        organization: driver.organization.name
      },
    });
  } catch (error) {
    console.error('Erreur driver login:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion chauffeur.' });
  }
};

// ===== RÉCUPÉRER LES ORGANISATIONS =====
exports.getOrganizations = async (req, res) => {
  try {
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true, code: true, type: true }
    });
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des organisations.' });
  }
};

// ===== PROFIL =====
exports.profile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil.' });
  }
};
