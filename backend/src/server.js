const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes de bienvenue
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Dagoo\'s API - La mobilité connectée... Chez les potes, ça roule.',
    version: '1.0.0',
    status: 'Dago ready ! 🇲🇬'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    message: 'Salama Dago ! L\'API fonctionne parfaitement ✅',
    data: {
      features: ['Auth', 'Fleets', 'Drivers', 'Trips', 'Payments'],
      slogan: 'La mobilité connectée... Chez les potes, ça roule.'
    }
  });
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`✅ Dagoo's API lancée sur http://localhost:${port}`);
  console.log(`🏷️  Slogan : La mobilité connectée... Chez les potes, ça roule.`);
  console.log(`🇲🇬  Salama Dago !`);
});
