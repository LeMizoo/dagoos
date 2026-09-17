# Chantier Contact Public — DAGO MOBILITY

**Date de clôture :** 2026-09-17
**Périmètre :** `apps/api/`, `admin-next/` (flux de contact depuis la landing)
**Statut :** TERMINÉ

---

## 1. Objectif

Rendre les messages envoyés depuis le formulaire public `/contact` **visibles et exploitables** par les administrateurs de la plateforme.

### Contexte initial

Le formulaire `/contact` (livré en Vague 2 de DAGO MOBILITY) envoyait les messages vers l'endpoint générique `POST /public/actions` avec `type: 'CONTACT'`.

**Conséquence** :
- Les contacts étaient créés en base dans la table `LeadAction`
- Ils avaient `organizationId: null`
- **Aucune interface admin ne les affichait** :
  - `/flotte/demandes` filtre par `organizationId === org.id`
  - `/dashboard/messages` affiche la table `Message`, pas `LeadAction`

Les contacts étaient donc **stockés mais invisibles**.

### Solution retenue

Créer un **endpoint public dédié** `POST /api/public/contact` qui écrit dans la table **`Message`** existante avec `organizationId: null`.

**Bénéfices** :
- Réutilise l'infrastructure existante (table `Message`, page `/dashboard/messages`)
- Pas de nouvelle page, pas de nouvelle entrée sidebar
- Un seul flux de messagerie côté admin
- Les contacts apparaissent dans `/dashboard/messages` comme des messages normaux

---

## 2. Architecture retenue

### Flux avant / après

**Avant** :
```
/contact (public)
  → POST /api/public/actions { type: 'CONTACT' }
  → LeadAction (organizationId: null)
  → Invisible dans l'admin
```

**Après** :
```
/contact (public)
  → POST /api/public/contact
  → Message (organizationId: null, type: 'contact')
  → Visible dans /dashboard/messages
```

### Table `Message` — champs utilisés

| Champ | Valeur pour un contact public |
|---|---|
| `organizationId` | `null` |
| `subject` | `"Contact depuis la landing"` |
| `content` | Le message saisi |
| `sender` | `"NOM (TÉLÉPHONE)"` (concaténation) |
| `type` | `"contact"` |
| `read` | `false` |
| `replied` | `false` |
| `createdAt` | Date de soumission |

### Décisions clés

- **Réutiliser `Message`** au lieu de créer un nouveau modèle → évite migrations et dette
- **Réutiliser `messages.read` / `messages.manage`** (permissions déjà attribuées à `SUPER_ADMIN` et `ADMIN`) → pas de nouvelles permissions
- **Aucune nouvelle page admin** → tout reste sous « Messages »
- **Aucune nouvelle entrée sidebar** → cohérence avec l'organisation « Communication »

---

## 3. Endpoint public `POST /api/public/contact`

### Contrat

**URL** : `POST /api/public/contact`

**Headers** :
```
Content-Type: application/json
```

**Body** :
```json
{
  "clientNom": "Jean Dupont",
  "clientTel": "0341234567",
  "details": {
    "message": "Bonjour, j'ai une question..."
  }
}
```

**Réponse succès (201)** :
```json
{
  "ok": true,
  "messageId": "cmu5bvg93000210loju6a6gtg"
}
```

**Réponses erreur** :
| Code | Erreur | Cause |
|---|---|---|
| 400 | `clientNom invalide (2-100 caractères attendus)` | Nom trop court ou trop long |
| 400 | `clientTel invalide (format attendu : 03XXXXXXXX ou +261XXXXXXXXX)` | Téléphone mal formaté |
| 400 | `Le message est requis` | `details.message` vide |
| 400 | `Le message est trop long (2000 caractères maximum)` | Message > 2000 chars |
| 500 | `Erreur serveur` | Erreur interne |

### Implémentation

**Fichier** : `apps/api/modules/public/public.routes.js` (ligne ~2233)

**Points clés** :
- Utilise `publicLeadLimiter` (rate limiting déjà en place)
- Réutilise `validateClientNom` / `validateClientTel` (helpers existants)
- Crée un `Message` avec `organizationId: null`
- `sender` = `"NOM (TEL)"` pour identification facile côté admin

### Validation

| Champ | Règle |
|---|---|
| `clientNom` | 2-100 caractères, non vide |
| `clientTel` | Format malgache : `03XXXXXXXX` ou `+261XXXXXXXXX` |
| `details.message` | Non vide, max 2000 caractères |

---

## 4. Sécurisation `unread-count`

### Problème identifié

L'endpoint `GET /api/messages/unread-count` comptait **tous** les messages non lus de la plateforme, **sans filtrer par organisation**.

**Conséquence** : un utilisateur d'une organisation pouvait voir le **nombre total** de messages non lus (incluant ceux d'autres organisations), ce qui constitue une **fuite d'information**.

### Correctif

**Fichier** : `apps/api/modules/messages/messages.routes.js`

```js
router.get('/unread-count', authMiddleware, requirePermission('messages.read'), async (req, res) => {
  try {
    const where = { read: false };

    // Un utilisateur d'organisation ne voit que SES messages non lus.
    // Un super-admin voit tous les messages non lus (y compris les contacts publics).
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const organizationId = await getUserOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ error: 'Organisation introuvable' });
      }
      where.organizationId = organizationId;
    }

    const count = await prisma.message.count({ where });

    res.json({ count });
  } catch (e) {
    console.error('Erreur unread-count:', e);
    res.status(500).json({ error: e.message });
  }
});
```

**Comportement corrigé** :
- Utilisateur d'organisation → seulement ses messages non lus
- Super-admin → tous les messages non lus (y compris contacts publics)

---

## 5. Modifications frontend

### `/contact` — nouvel endpoint

**Fichier** : `admin-next/src/app/contact/page.tsx`

**Changement** :
```diff
- const response = await apiFetch('/public/actions', {
+ const response = await apiFetch('/public/contact', {
    method: 'POST',
    body: JSON.stringify({
-     type: 'CONTACT',
      clientNom: nomValue,
      clientTel: normalizePhone(telephoneValue),
      details: {
        message: messageValue,
      },
    }),
  });
```

### `/dashboard/messages` — affichage `sender`

**Fichier** : `admin-next/src/app/dashboard/messages/page.tsx`

**Changements** :

1. **Interface `Message`** — ajout `sender` et `type` :
```diff
- interface Message { id: string; organization?: { name?: string; id?: string }; subject?: string; content?: string; read?: boolean; createdAt?: string; }
+ interface Message {
+   id: string;
+   organization?: { name?: string; id?: string } | null;
+   subject?: string;
+   content?: string;
+   sender?: string;
+   type?: string;
+   read?: boolean;
+   createdAt?: string;
+ }
```

2. **Affichage liste** — fallback sur `sender` :
```diff
- {m.organization?.name || 'Inconnu'}
+ {m.organization?.name || m.sender || 'Contact public'}
```

3. **Affichage détail** — fallback sur `sender` :
```diff
- De : {selectedMsg.organization?.name || 'Inconnu'}
+ De : {selectedMsg.organization?.name || selectedMsg.sender || 'Contact public'}
```

**Résultat** : un contact public (sans organisation) affiche `NOM (TÉLÉPHONE)` au lieu de « Inconnu ».

---

## 6. Tests production

### Test 1 — Endpoint direct (curl)

```bash
curl -i -X POST https://dago-mobility.vercel.app/api/proxy/public/contact \
  -H "Content-Type: application/json" \
  -d '{"clientNom":"Curl Test","clientTel":"0341234567","details":{"message":"test curl direct"}}'
```

**Résultat observé** :
```
HTTP/2 201
{"ok":true,"messageId":"cmu5bvg93000210loju6a6gtg"}
```

✅ Endpoint fonctionnel.

### Test 2 — Vérification DB

```bash
cd apps/api && node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.message.findMany({
  where: { organizationId: null, type: 'contact' },
  orderBy: { createdAt: 'desc' },
  take: 5,
}).then(m => { console.log(JSON.stringify(m, null, 2)); return prisma.\$disconnect(); });
"
```

**Résultat observé** :
- Messages présents avec `organizationId: null`, `type: 'contact'`
- `sender` correctement formaté (`NOM (TEL)`)

✅ Persistance confirmée.

### Test 3 — Affichage dashboard

Sur `https://dago-mobility.vercel.app/dashboard/messages` (connecté en super-admin) :

**Résultat observé** :
```
💬 Messages
  💬 TEST FINAL CONTACT (0347654321)
     Contact depuis la landing
     TEST FINAL 2026
  💬 Test Cause 1 (0341234567)
     Contact depuis la landing
     test
```

✅ Contacts publics visibles avec `sender`, `subject`, `content`.

### Test 4 — `unread-count` sécurisé

Vérifié par code review + tests curl.

✅ Fuite corrigée.

---

## 7. Commits et déploiement

### Commits du chantier

```
96896a65  feat(contact): endpoint public dédié + affichage admin
```

### Fichiers modifiés

```
admin-next/src/app/contact/page.tsx              |  3 +-
admin-next/src/app/dashboard/messages/page.tsx   |  6 +--
apps/api/modules/messages/messages.routes.js     | 16 +--
apps/api/modules/public/public.routes.js         | 67 ++++++++++++++++++
```

### Déploiement Vercel

- Build : ✅ 70/70 pages
- Déploiement : `96896a6` — `completed`
- Test prod : ✅ passé

### État final

```
HEAD = origin/main = 96896a65
working tree = clean
```

---

## 8. Dette résiduelle

### Anciens `LeadAction CONTACT` — **conservés tels quels**

**Contexte** :
Avant la livraison de ce chantier, les contacts publics étaient stockés dans la table `LeadAction` avec `type: 'CONTACT'` et `organizationId: null`. Ces enregistrements **existent toujours** en base.

**Décision** : **Ne pas migrer ces données historiques pour le moment.**

**Raisons** :
1. Le nouveau flux fonctionne parfaitement
2. Une migration destructive comporte un risque (doublons, données incomplètes, conflits de timestamp)
3. Un audit précis de ces anciens enregistrements est nécessaire avant toute manipulation
4. La priorité est au bon fonctionnement du flux actuel

**Ces anciens contacts restent** :
- Consultables via Prisma Studio ou SQL
- **Invisibles** dans l'admin (ni `/dashboard/messages`, ni `/flotte/demandes`)
- **Non intrusifs** pour le nouveau flux

**Traitement futur possible** :
- Audit : compter les `LeadAction CONTACT`, vérifier les doublons éventuels
- Décider : migrer vers `Message`, archiver, ou laisser en legacy
- Migration séparée, avec backup préalable

**Statut** : dette technique tracée, non bloquante.

### Améliorations possibles (optionnelles)

- **Workflow de traitement** : statut `NEW` → `IN_PROGRESS` → `TRAITÉ` → `ARCHIVED` pour les contacts
- **Export CSV** : pour traiter les contacts dans un tableur
- **Notification email** : alerter immédiatement quand un nouveau contact arrive
- **Champ email dans le formulaire** : actuellement seul le téléphone est demandé (le backend `Message` n'a pas de champ email)

---

## 9. Référence Git

### Commits de la Vague 5

```
96896a65  feat(contact): endpoint public dédié + affichage admin
```

### Commits DAGO MOBILITY (contexte)

```
96896a65  feat(contact): endpoint public dédié + affichage admin     ← Vague 5
26d108e6  docs: affiner l'archive DAGO MOBILITY                      ← Doc V1-4
5255c79c  feat(landing): ajouter pages aide et statut                ← Vague 4
ea99479f  feat(landing): ajouter header logo et pages publiques      ← Vague 3
e4b9a789  feat(landing): ajouter la page /contact                    ← Vague 2
7e4406b8  feat(landing): extraire footer dans LandingFooter + LandingLayout  ← Vague 1
```

### État

```
HEAD = origin/main = 96896a65
working tree = clean
```

---

**Chantier clôturé le 17/09/2026.**
**Test fonctionnel validé en production.**
**Anciens contacts LeadAction conservés tels quels (dette tracée).**