const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../lib/prisma');
const { authMiddleware, JWT_SECRET } = require('../../middleware/auth');

const router = express.Router();

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, plan } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: { name, email, phone, password: hashed, role: role || 'USER' }
    });

    // Créer l'organisation si fleet ou coop
    if (role === 'FLEET_MANAGER' || role === 'COOPERATIVE') {
      const code = role === 'FLEET_MANAGER' ? 'FL-' : 'CO-';
      await prisma.organization.create({
        data: {
          name, email, phone,
          code: code + Math.random().toString(36).substring(2,6).toUpperCase(),
          slug: name.toLowerCase().replace(/ /g, '-'),
          type: role, plan: plan || 'Freemium'
        }
      });
    }

    res.status(201).json({ message: 'Compte créé avec succès !' });
  } catch (e) {
    res.status(500).json({ error: e.message });
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
router.post('/fleet-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    
    // Vérifier le rôle : seuls FLEET_MANAGER peuvent se connecter ici
    if (user.role !== 'FLEET_MANAGER') {
      return res.status(403).json({ error: 'Accès réservé aux gestionnaires de flotte.' });
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
      user: { id: user.id, name: user.name, email: user.email, role: user.role, organizationId: org?.id, organizationCode: org?.code, organizationName: org?.name }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Login Coop Manager
router.post('/coop-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    
    // Vérifier le rôle : seuls COOPERATIVE peuvent se connecter ici
    if (user.role !== 'COOPERATIVE') {
      return res.status(403).json({ error: 'Accès réservé aux gestionnaires de coopérative.' });
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
      user: { id: user.id, name: user.name, email: user.email, role: user.role, organizationId: org?.id, organizationCode: org?.code, organizationName: org?.name }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Connexion chauffeur (par code + PIN)
router.post('/driver-login', async (req, res) => {
  try {
    const { code, pin } = req.body;
    const driver = await prisma.driver.findUnique({ 
      where: { driverCode: code },
      include: { user: true, organization: true }
    });
    if (!driver) return res.status(401).json({ error: 'Code chauffeur introuvable' });
    if (driver.pin !== pin) return res.status(401).json({ error: 'PIN incorrect' });
    const token = jwt.sign(
      { id: driver.user.id, email: driver.user.email, role: 'DRIVER', driverId: driver.id },
      JWT_SECRET, { expiresIn: '7d' }
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
      select: { id: true, name: true, email: true, role: true, phone: true }
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
