const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../lib/prisma');
const { JWT_SECRET } = require('../../middleware/auth');

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
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Connexion réussie !', token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
