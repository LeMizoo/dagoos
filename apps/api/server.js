const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/users/users.routes'));
app.use('/api/organizations', require('./modules/organizations/organizations.routes'));
app.use('/api/drivers', require('./modules/drivers/drivers.routes'));
app.use('/api/vehicles', require('./modules/vehicles/vehicles.routes'));
app.use('/api/plans', require('./modules/plans/plans.routes'));
app.use('/api/messages', require('./modules/messages/messages.routes'));
app.use('/api', require('./modules/finances/finances.routes'));
app.use('/api', require('./modules/landing/landing.routes'));

// Route de santé
app.get('/api', (req, res) => {
  res.json({ message: "🚀 Dagoo's API - La mobilité connectée", status: 'online' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ API sur http://localhost:${PORT}`));
