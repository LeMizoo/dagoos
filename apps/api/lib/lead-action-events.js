// ============================================================
// 2.4.2 — TIMELINE PASSAGER
// Module d'écriture des LeadActionEvent.
//
// Référence : contrat 2.4.1 §5.2 (catalogue des événements),
//             §6.2 (acteurs déterministes), §12 (anti-patterns).
//
// Règles invariantes :
//   - Un événement est TOUJOURS écrit dans la transaction de la
//     mutation métier primaire (contrat 2.4.1 §3).
//   - Un événement est immuable : jamais de update, jamais de delete.
//   - `recordedAt` est réservé à l'audit technique, il ne sert
//     JAMAIS à trier (contrat 2.4.1 §4.bis).
//   - L'ordre fonctionnel est `occurredAt`, puis `id`.
//
// Note technique : la vérification `tx.leadActionEvent.create`
// garantit la présence du delegate sur le client fourni. Elle ne
// peut PAS prouver techniquement qu'il s'agit d'un $transaction
// plutôt que du client global. C'est une limite de Prisma ; la
// discipline de code et la revue assurent le respect du contrat.
// ============================================================

// ------------------------------------------------------------
// Catalogue des types d'événements émis en v1.
// Ajouter une valeur ici nécessite un amendement du contrat 2.4.1.
// ------------------------------------------------------------
const EVENT_TYPES = Object.freeze({
  // Cycle de vie global
  LEAD_CREATED: 'LEAD_CREATED',
  LEAD_ACCEPTED: 'LEAD_ACCEPTED',
  LEAD_REJECTED: 'LEAD_REJECTED',
  // Tarification
  PRICE_ESTIMATED: 'PRICE_ESTIMATED',
  // Négociation
  NEGOTIATION_OPENED_BY_CLIENT: 'NEGOTIATION_OPENED_BY_CLIENT',
  NEGOTIATION_OFFERED_TO_CLIENT: 'NEGOTIATION_OFFERED_TO_CLIENT',
  NEGOTIATION_ACCEPTED_BY_CLIENT: 'NEGOTIATION_ACCEPTED_BY_CLIENT',
  NEGOTIATION_REFUSED_BY_CLIENT: 'NEGOTIATION_REFUSED_BY_CLIENT',
  NEGOTIATION_EXPIRED: 'NEGOTIATION_EXPIRED',
});

// ------------------------------------------------------------
// Acteurs autorisés (contrat 2.4.1 §6.2).
// Règle de déterminisme : chaque événement a un actor unique.
// ------------------------------------------------------------
const ACTORS = Object.freeze({
  CLIENT: 'CLIENT',
  DRIVER: 'DRIVER',
  MANAGER: 'MANAGER',
  SYSTEM: 'SYSTEM',
});

// ------------------------------------------------------------
// Helper interne : vérifie qu'une valeur appartient à un
// catalogue figé.
// ------------------------------------------------------------
function assertInCatalog(value, catalog, label) {
  if (!Object.prototype.hasOwnProperty.call(catalog, value)) {
    const allowed = Object.keys(catalog).join(', ');
    throw new TypeError(
      `${label} invalide : "${value}". Valeurs autorisées : ${allowed}`
    );
  }
}

// ------------------------------------------------------------
// recordEvent — écrit un LeadActionEvent dans la transaction
// fournie.
//
// @param {object} tx - Client transactionnel Prisma (obligatoire).
//                      Doit exposer `tx.leadActionEvent.create`.
// @param {object} data
// @param {string} data.leadActionId  - Id de la LeadAction parente.
// @param {string} data.type          - Type d'événement (EVENT_TYPES).
// @param {string} data.actor         - Acteur (ACTORS).
// @param {Date}   [data.occurredAt]  - Date métier. Défaut : maintenant.
// @param {object} [data.payload]     - Payload JSON contextuel (facultatif).
// @param {boolean}[data.partial]     - Événement synthétique. Défaut : false.
//                                      Réservé à la migration historique.
//
// @returns {Promise<object>} L'événement créé.
// ------------------------------------------------------------
async function recordEvent(tx, data) {
  if (!tx || typeof tx.leadActionEvent?.create !== 'function') {
    throw new TypeError(
      'recordEvent : `tx` doit être un client transactionnel Prisma ' +
        'exposant `leadActionEvent.create`. ' +
        'Les événements sont obligatoirement écrits dans une transaction.'
    );
  }

  const {
    leadActionId,
    type,
    actor,
    occurredAt = new Date(),
    payload,
    partial = false,
  } = data || {};

  if (!leadActionId || typeof leadActionId !== 'string') {
    throw new TypeError('recordEvent : `leadActionId` est requis (string).');
  }

  assertInCatalog(type, EVENT_TYPES, 'recordEvent.type');
  assertInCatalog(actor, ACTORS, 'recordEvent.actor');

  if (!(occurredAt instanceof Date) || isNaN(occurredAt.getTime())) {
    throw new TypeError(
      'recordEvent : `occurredAt` doit être une Date valide.'
    );
  }

  if (partial !== true && partial !== false) {
    throw new TypeError('recordEvent : `partial` doit être un booléen.');
  }

  return tx.leadActionEvent.create({
    data: {
      leadActionId,
      type,
      actor,
      occurredAt,
      payload: payload ?? undefined,
      partial,
    },
  });
}

module.exports = {
  EVENT_TYPES,
  ACTORS,
  recordEvent,
};
