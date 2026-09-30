// ============================================================
// Notifications — Scope builder
// ============================================================
//
// Construit le périmètre d'accès aux notifications selon le rôle.
//
// Règle STRICTE (fail-closed) :
//   - Tout rôle non explicitement supporté est REJETÉ (403).
//   - Ne jamais tomber dans un "pas de filtre" implicite : un rôle
//     inconnu obtiendrait sinon l'accès global.
//
// Contrat :
//   - { ok: true, where }                → périmètre d'accès
//   - { ok: false, status, error }       → rejet immédiat
//
// Le where retourné ne contient QUE les critères d'isolation.
// Chaque route ajoute ensuite ses propres critères (id, read, type).
// ============================================================

/**
 * @param {object|null|undefined} user - req.user (issu du JWT décodé)
 * @returns {{ ok: true, where: object } | { ok: false, status: number, error: string }}
 */
function buildNotificationScope(user) {
  if (!user || typeof user !== 'object') {
    return {
      ok: false,
      status: 401,
      error: 'Utilisateur non authentifié',
    };
  }

  const role = user.role;

  // DRIVER : uniquement ses propres notifications
  if (role === 'DRIVER') {
    return {
      ok: true,
      where: { userId: user.id },
    };
  }

  // FLEET_MANAGER / COOP_MANAGER : uniquement leur organisation
  if (role === 'FLEET_MANAGER' || role === 'COOP_MANAGER') {
    if (!user.organizationId) {
      return {
        ok: false,
        status: 403,
        error: 'Organisation utilisateur introuvable',
      };
    }

    return {
      ok: true,
      where: { organizationId: user.organizationId },
    };
  }

  // ADMIN / SUPER_ADMIN : accès global (where vide = pas de filtre)
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return {
      ok: true,
      where: {},
    };
  }

  // Tout autre rôle : REJETÉ (fail-closed)
  return {
    ok: false,
    status: 403,
    error: 'Rôle non autorisé',
  };
}

module.exports = { buildNotificationScope };
