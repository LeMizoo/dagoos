const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../lib/prisma');
const { authMiddleware, JWT_SECRET } = require('../../middleware/auth');

const router = express.Router();

const crypto = require("crypto");
const PUBLIC_ORGANIZATION_ROLES = new Set(["FLEET_MANAGER", "COOP_MANAGER"]);

// Public organization registration only.
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, role, plan, organizationName } = req.body;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!name || !normalizedEmail || typeof password !== "string" || password.length < 12) return res.status(400).json({ error: "Nom, email et mot de passe de 12 caracteres minimum requis" });
    if (!PUBLIC_ORGANIZATION_ROLES.has(role)) return res.status(400).json({ error: "Type organisation invalide" });
    const organizationLabel = String(organizationName || name).trim();
    if (!organizationLabel) return res.status(400).json({ error: "Nom organisation requis" });
    const suffix = crypto.randomBytes(4).toString("hex");
    const slug = organizationLabel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) + "-" + suffix;
    const code = (role === "FLEET_MANAGER" ? "FL-" : "CO-") + crypto.randomBytes(3).toString("hex").toUpperCase();
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({ data: { name: organizationLabel, email: normalizedEmail, phone: phone || null, code, slug, type: role, plan: plan || "Freemium" } });
      await tx.user.create({ data: { name: String(name).trim(), email: normalizedEmail, phone: phone || null, password: hashedPassword, role, organizationId: organization.id } });
    });
    res.status(201).json({ message: "Compte cree avec succes" });
  } catch (e) {
    if (e.code === "P2002") return res.status(409).json({ error: "Un compte ou une organisation utilise deja cet email" });
    console.error("POST /auth/register", e);
    res.status(500).json({ error: "Erreur creation compte" });
  }
});

// Connexion
// Login Super Admin / Admin (central)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    
    // Vérifier le rôle : seuls SUPER_ADMIN et ADMIN peuvent se connecter ici
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs. Utilisez le portail Fleet ou Coop.' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Connexion réussie !', token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Login Fleet Manager
router.post('/urbain-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    
    // Vérifier le rôle : seuls FLEET_MANAGER peuvent se connecter ici
    if (user.role !== 'FLEET_MANAGER') {
      return res.status(403).json({ error: 'Accès réservé au transport urbain (FLEET_MANAGER).' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    
    // Chercher l'organisation liée
    const org = await prisma.organization.findFirst({ where: { email: user.email } });
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, organizationId: org?.id, organizationCode: org?.code, organizationName: org?.name },
      JWT_SECRET, { expiresIn: '7d' }
    );
    res.json({ 
      message: 'Connexion réussie !', token, 
      redirectPath: '/flotte/urbain',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, organizationId: org?.id, organizationCode: org?.code, organizationName: org?.name, organizationType: org?.type }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Login Coop Manager
router.post('/interurbain-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    
    // Vérifier le rôle : seuls COOPERATIVE peuvent se connecter ici
    if (user.role !== 'COOP_MANAGER') {
      return res.status(403).json({ error: 'Accès réservé au transport interurbain (COOP_MANAGER).' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    
    // Chercher l'organisation liée
    const org = await prisma.organization.findFirst({ where: { email: user.email } });
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, organizationId: org?.id, organizationCode: org?.code, organizationName: org?.name },
      JWT_SECRET, { expiresIn: '7d' }
    );
    res.json({ 
      message: 'Connexion réussie !', token, 
      redirectPath: '/flotte/interurbain',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, organizationId: org?.id, organizationCode: org?.code, organizationName: org?.name, organizationType: org?.type }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.post('/driver-login', async (req, res) => {
  try {
    const { code, pin } = req.body;
    const driver = await prisma.driver.findUnique({ 
      where: { driverCode: code },
      include: { user: true, organization: true }
    });
    if (!driver) return res.status(401).json({ error: 'Code chauffeur introuvable' });
    const validPin = driver.pin.startsWith("$2")
      ? await bcrypt.compare(pin, driver.pin)
      : driver.pin === pin;
    if (!validPin) return res.status(401).json({ error: "PIN incorrect" });
    if (!driver.pin.startsWith("$2")) {
      await prisma.driver.update({ where: { id: driver.id }, data: { pin: await bcrypt.hash(pin, 12) } });
    }
    const token = jwt.sign(
      {
        id: driver.user.id,
        email: driver.user.email,
        role: 'DRIVER',
        driverId: driver.id,
        organizationId: driver.organizationId,
        organizationCode: driver.organization?.code,
        organizationName: driver.organization?.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      message: 'Connexion réussie !', token,
      user: { id: driver.user.id, name: driver.user.name, email: driver.user.email, driverCode: driver.driverCode, driverId: driver.id, role: 'DRIVER', organization: driver.organization?.name }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// Récupérer le profil utilisateur connecté
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur introuvable'
      });
    }

    // Le JWT contient les informations de contexte
    // nécessaires aux profils Fleet / Coop / Driver.
    const sessionUser = {
      ...user,

      ...(req.user.organizationId
        ? {
            organizationId: req.user.organizationId,
            organizationCode: req.user.organizationCode,
            organizationName: req.user.organizationName
          }
        : {}),

      ...(req.user.driverId
        ? {
            driverId: req.user.driverId,
            driverCode: req.user.driverCode
          }
        : {})
    };

    res.json({
      user: sessionUser
    });
  } catch (e) {
    console.error('[auth/me]', e);

    res.status(500).json({
      error: 'Erreur lors de la récupération du profil'
    });
  }
});

module.exports = router;
