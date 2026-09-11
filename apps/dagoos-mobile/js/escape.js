// ============================================================
// escape.js — P7-E2-FIX
// Module partagé d'échappement HTML et de validation d'URL.
// Chargé avant les pages dans index.html.
// ============================================================

window.escapeHtml = function(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Validation d'URL d'image : http(s), data:image, chemin absolu /...
window.isValidImageUrl = function(url) {
  if (typeof url !== 'string') return false;
  if (/^https?:\/\//i.test(url)) return true;
  if (/^data:image\//i.test(url)) return true;
  if (/^\/[^\/]/.test(url)) return true;
  return false;
};
