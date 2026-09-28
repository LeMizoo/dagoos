// ============================================================
// Utils — Échappement HTML et validation d'URL
// Phase 0 — Étape 0.13.2
// Adapté de apps/dagoos-mobile/js/escape.js (P3)
// ============================================================

/**
 * Échappe les caractères HTML dangereux dans une chaîne.
 * Retourne une chaîne vide si la valeur est null ou undefined.
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Vérifie qu'une URL est valide pour un src d'image.
 * Autorise : http(s), data:image, chemin absolu /...
 * Refuse : tout le reste.
 */
export function isValidImageUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  if (/^https?:\/\//i.test(url)) return true;
  if (/^data:image\//i.test(url)) return true;
  if (/^\/[^/]/.test(url)) return true;
  return false;
}
