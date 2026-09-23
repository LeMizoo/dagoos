// ============================================================
// Table de correspondance des villes et quartiers de Madagascar
// Source : coordonnées GPS fiables (OpenStreetMap + terrain)
// But : éviter les ambiguïtés Nominatim (ex: 3 "Ivato" à Mada)
// ============================================================

// Normalisation : minuscules, sans accents, sans tirets
function normalizeKey(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const VILLES = {
  // ============================================================
  // GRANDS CHEFS-LIEUX (7 provinces historiques)
  // ============================================================
  'antananarivo':   { lat: -18.9137, lng: 47.5361 },
  'tana':           { lat: -18.9137, lng: 47.5361 },
  'toamasina':      { lat: -18.1499, lng: 49.4023 },
  'tamatave':       { lat: -18.1499, lng: 49.4023 },
  'antsirabe':      { lat: -19.8659, lng: 47.0333 },
  'fianarantsoa':   { lat: -21.4527, lng: 47.0857 },
  'mahajanga':      { lat: -15.7167, lng: 46.3167 },
  'majunga':        { lat: -15.7167, lng: 46.3167 },
  'toliara':        { lat: -23.3568, lng: 43.6667 },
  'tulear':         { lat: -23.3568, lng: 43.6667 },
  'antsiranana':    { lat: -12.2795, lng: 49.2913 },
  'diego suarez':   { lat: -12.2795, lng: 49.2913 },
  'diego':          { lat: -12.2795, lng: 49.2913 },

  // ============================================================
  // VILLES SECONDAIRES IMPORTANTES
  // ============================================================
  'ambositra':      { lat: -20.5305, lng: 47.2442 },
  'ambatondrazaka': { lat: -17.8333, lng: 48.4167 },
  'moramanga':      { lat: -18.9494, lng: 48.2306 },
  'brickaville':    { lat: -18.8189, lng: 49.0826 },
  'nosy be':        { lat: -13.3167, lng: 48.2667 },
  'hell ville':     { lat: -13.4050, lng: 48.2750 },
  'manakara':       { lat: -22.1453, lng: 48.0117 },
  'farafangana':    { lat: -22.8225, lng: 47.8264 },
  'ambalavao':      { lat: -21.8333, lng: 46.9333 },
  'ihosy':          { lat: -22.4022, lng: 46.1253 },
  'toliary':        { lat: -23.3568, lng: 43.6667 },

  // ============================================================
  // GRAND ANTANANARIVO — Quartiers principaux
  // ============================================================
  // Centre-ville / quartiers d'affaires
  'analakely':           { lat: -18.9089, lng: 47.5253 },
  'ankorondrano':        { lat: -18.9045, lng: 47.5089 },
  'andraharo':           { lat: -18.8792, lng: 47.5079 },
  'antanimena':          { lat: -18.9167, lng: 47.5167 },
  'ambatobe':            { lat: -18.8500, lng: 47.5333 },
  'ambatoroka':          { lat: -18.9167, lng: 47.5500 },
  'ambohijatovo':        { lat: -18.9100, lng: 47.5250 },
  'isanakely':           { lat: -18.9167, lng: 47.5167 },
  'tsaralalana':         { lat: -18.9167, lng: 47.5167 },
  'behoririka':          { lat: -18.9100, lng: 47.5200 },

  // Nord de Tana
  'ivato':               { lat: -18.8082, lng: 47.4816 },
  'ivato aeroport':      { lat: -18.7969, lng: 47.4861 },
  'aeroport ivato':      { lat: -18.7969, lng: 47.4861 },
  'ambohidratrimo':      { lat: -18.8219, lng: 47.4642 },
  'ankadindravola':      { lat: -18.8098, lng: 47.4934 },
  'talatamaty':          { lat: -18.8500, lng: 47.4667 },
  'antsohihy':           { lat: -18.8333, lng: 47.4833 },
  'sabotsy':             { lat: -18.9000, lng: 47.5167 },

  // Sud-ouest de Tana
  'itaosy':              { lat: -18.9181, lng: 47.4708 },
  'ankadikely':          { lat: -18.9500, lng: 47.4667 },
  'ambohimanambola':     { lat: -18.9500, lng: 47.5167 },
  'tanjombato':          { lat: -18.9667, lng: 47.5167 },

  // Sud de Tana
  'ankadifotsy':         { lat: -18.9500, lng: 47.5333 },
  'ambohibao':           { lat: -18.8667, lng: 47.5000 },
  'ankorondrano sud':    { lat: -18.9200, lng: 47.5100 },

  // Est de Tana
  'ambatofotsikely':     { lat: -18.9000, lng: 47.5500 },
  'ankadindramamy':      { lat: -18.9200, lng: 47.5400 },

  // ============================================================
  // GRAND ANTANANARIVO — Autres communes
  // ============================================================
  'ambohidrapeto':       { lat: -18.9333, lng: 47.4833 },
  'andoharanofotsy':     { lat: -18.9667, lng: 47.5000 },
  'manjakandriana':      { lat: -18.9167, lng: 47.8000 },
  'ambohimanga':         { lat: -18.7667, lng: 47.5667 },
};

/**
 * Cherche une ville/quartier dans la table locale
 * Retourne { lat, lng } ou null
 */
function findVilleLocal(adresse) {
  if (!adresse) return null;

  const key = normalizeKey(adresse).split(' ').slice(0, 3).join(' ');
  // Essaie d'abord la clé complète normalisée
  const fullKey = normalizeKey(adresse);
  if (VILLES[fullKey]) return VILLES[fullKey];

  // Puis essaie segment par segment (séparé par virgules)
  const segments = String(adresse).split(',').map(s => normalizeKey(s));
  for (const seg of segments) {
    if (VILLES[seg]) return VILLES[seg];
  }

  // Puis essaie les 1-3 premiers mots
  for (let i = 3; i >= 1; i--) {
    const subKey = normalizeKey(adresse).split(' ').slice(0, i).join(' ');
    if (VILLES[subKey]) return VILLES[subKey];
  }

  return null;
}

module.exports = {
  VILLES,
  findVilleLocal,
  normalizeKey,
};
