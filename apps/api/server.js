const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/users/users.routes'));
app.use('/api/organizations', require('./modules/organizations/organizations.routes'));
app.use('/api/drivers', require('./modules/drivers/drivers.routes'));
app.use('/api/vehicles', require('./modules/vehicles/vehicles.routes'));
app.use('/api/maintenance', require('./modules/maintenance/maintenance.routes'));
app.use('/api/proprietaires', require('./modules/proprietaires/proprietaires.routes'));
app.use('/api/societes', require('./modules/societes/societes.routes'));
app.use('/api/contrats', require('./modules/contrats/contrats.routes'));
app.use('/api/livraisons', require('./modules/livraisons/livraisons.routes'));
app.use('/api/plans', require('./modules/plans/plans.routes'));
app.use('/api/tarifs', require('./modules/tarifs/tarifs.routes'));

// Route db-push
app.post('/api/db-push', async (req, res) => {
  const { password } = req.body;
  if (password !== 'DagoosSeed2026!') return res.status(403).json({ error: 'Accès refusé' });
  const { execSync } = require('child_process');
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'pipe', timeout: 60000 });
    execSync('npx prisma generate', { stdio: 'pipe', timeout: 60000 });
    res.json({ success: true, message: 'Schéma synchronisé' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.use('/api/messages', require('./modules/messages/messages.routes'));
app.use('/api/notifications', require('./modules/notifications/notifications.routes'));
app.use('/api/logs', require('./modules/logs.routes'));
app.use('/api', require('./modules/finances/finances.routes'));
app.use('/api', require('./modules/landing/landing.routes'));

app.get('/api', (req, res) => {
  res.json({ message: "🚀 Dagoo's API - La mobilité connectée", status: 'online' });
});

// Route seed protégée
app.post('/api/seed', async (req, res) => {
  const { password } = req.body;
  if (password !== 'DagoosSeed2026!') return res.status(403).json({ error: 'Accès refusé' });
  const { execSync } = require('child_process');
  try {
    execSync('node seed-full.js', { stdio: 'pipe', timeout: 60000 });
    execSync('node reset-tovo.js', { stdio: 'pipe', timeout: 30000 });
    execSync('node seed-coops-premium.js', { stdio: 'pipe', timeout: 30000 });
    execSync('node seed-proprietaires-societes.js', { stdio: 'pipe', timeout: 60000 });
    execSync('node seed-chauffeurs.js', { stdio: 'pipe', timeout: 120000 });
    res.json({ success: true, message: 'Seeds exécutés avec succès' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ API sur http://localhost:${PORT}`));
// Force deploy Fri, Jul 31, 2026 11:25:10 AM
// Force redeploy Mon, Aug  3, 2026  8:27:15 AM

// ============ ROUTES PUBLIQUES POUR DRIVER ============

// Route publique pour récupérer les infos du chauffeur (par ID)
app.get('/api/public/driver/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('Driver')
      .select('*, Vehicle(*), Organization(*)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Route publique pour récupérer les véhicules d'un chauffeur
app.get('/api/public/vehicles/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const { data, error } = await supabase
      .from('Vehicle')
      .select('*')
      .eq('driverId', driverId);
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Route publique pour récupérer les organisations
app.get('/api/public/organizations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Organization')
      .select('*');
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Route publique pour récupérer les courses d'un chauffeur
app.get('/api/public/trips/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { date } = req.query;
    
    let query = supabase
      .from('Trip')
      .select('*')
      .eq('driverId', driverId);
    
    if (date) {
      query = query.gte('createdAt', date);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
// Force deploy Thu, Aug  6, 2026  5:35:03 AM
// force deploy Fri, Aug  7, 2026  8:54:59 AM
// force seed route deploy Fri, Aug  7, 2026 10:41:06 AM
// force deploy v2 Fri, Aug  7, 2026 10:51:47 AM
