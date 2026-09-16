# Charte visuelle DAGOO'S 2026

Référence officielle des couleurs et variables CSS utilisées par les trois Progressive Web Apps (PWA) DAGOO'S.

---

## 1. Palette officielle

| Rôle        | Couleur                                           | Hex       |
| ----------- | ------------------------------------------------- | --------- |
| Bleu marine | Texte principal, contours, informations           | `#06245F` |
| Or safran   | Accent principal DAGOO'S                          | `#E0A01C` |
| Vert        | Validations et accent des applications conducteur | `#0A6F35` |
| Blanc       | Surfaces principales et texte sur accent          | `#FFFFFF` |

### Principe

* **DAGOO'S Mobile** utilise l'or safran comme accent principal.
* **Fleet Driver** et **Coop Driver** utilisent le vert comme accent principal.
* Le bleu marine constitue la couleur principale des textes.
* Les couleurs d'état (erreur, succès, avertissement, information) utilisent les variables sémantiques prévues à cet effet.

---

## 2. Source de vérité CSS

Chaque PWA possède un fichier `theme.css` centralisant ses variables de thème :

```text
apps/fleet-driver/css/theme.css
apps/coop-driver/css/theme.css
apps/dagoos-mobile/css/theme.css
```

Les fichiers JavaScript, HTML et les autres feuilles CSS doivent utiliser ces variables plutôt que des couleurs hexadécimales hardcodées.

Exemple :

```css
color: var(--text-primary);
background: var(--bg-surface);
border-color: var(--border);
```

---

## 3. Variables communes

Les trois PWA partagent les variables suivantes.

### Surfaces

| Variable        | Valeur    | Usage                        |
| --------------- | --------- | ---------------------------- |
| `--bg-page`     | `#F7F8FA` | Fond général de page         |
| `--bg-surface`  | `#FFFFFF` | Cartes, panneaux et surfaces |
| `--bg-soft`     | `#F1F5F9` | Fond secondaire              |
| `--bg-elevated` | `#E2E8F0` | Surface surélevée            |

### Texte

| Variable           | Valeur    | Usage                      |
| ------------------ | --------- | -------------------------- |
| `--text-primary`   | `#06245F` | Texte principal            |
| `--text-secondary` | `#4A5A7A` | Texte secondaire           |
| `--text-muted`     | `#94A3B8` | Texte discret              |
| `--text-on-accent` | `#FFFFFF` | Texte sur couleur d'accent |

### Accent

| Variable         | Fleet Driver | Coop Driver | Dagoos Mobile |
| ---------------- | ------------ | ----------- | ------------- |
| `--accent`       | `#0A6F35`    | `#0A6F35`   | `#E0A01C`     |
| `--accent-hover` | `#085A2B`    | `#085A2B`   | `#C68B15`     |
| `--accent-soft`  | `#E6F4EA`    | `#E6F4EA`   | `#FEF3C7`     |

### États

| Variable       | Valeur    | Usage                     |
| -------------- | --------- | ------------------------- |
| `--error-bg`   | `#FEF2F2` | Fond erreur               |
| `--error-fg`   | `#DC2626` | Texte/icône erreur        |
| `--success-bg` | `#E6F4EA` | Fond succès               |
| `--success-fg` | `#0A6F35` | Texte/icône succès        |
| `--warning-bg` | `#FEF3C7` | Fond avertissement        |
| `--warning-fg` | `#E0A01C` | Texte/icône avertissement |
| `--info-bg`    | `#EFF6FF` | Fond information          |
| `--info-fg`    | `#06245F` | Texte/icône information   |

### Bordures

| Variable          | Valeur    | Usage             |
| ----------------- | --------- | ----------------- |
| `--border`        | `#E2E8F0` | Bordure standard  |
| `--border-strong` | `#CBD5E1` | Bordure renforcée |

---

## 4. Variables spécifiques Fleet Driver

Fichier :

```text
apps/fleet-driver/css/theme.css
```

Variables supplémentaires :

| Variable        | Valeur    | Usage               |
| --------------- | --------- | ------------------- |
| `--gold`        | `#E0A01C` | Or safran           |
| `--gold-hover`  | `#C68B15` | Or safran au survol |
| `--shadow-card` | —         | Ombre des cartes    |
| `--shadow-soft` | —         | Ombre légère        |

Les valeurs exactes des ombres restent définies exclusivement dans `theme.css`.

---

## 5. Variables spécifiques Coop Driver

Fichier :

```text
apps/coop-driver/css/theme.css
```

Variables supplémentaires :

| Variable        | Valeur    | Usage               |
| --------------- | --------- | ------------------- |
| `--gold`        | `#E0A01C` | Or safran           |
| `--gold-hover`  | `#C68B15` | Or safran au survol |
| `--gold-soft`   | `#FEF3C7` | Fond or doux        |
| `--shadow-card` | —         | Ombre des cartes    |
| `--shadow-soft` | —         | Ombre légère        |

Les valeurs exactes des ombres restent définies exclusivement dans `theme.css`.

---

## 6. Variables spécifiques Dagoos Mobile

Fichier :

```text
apps/dagoos-mobile/css/theme.css
```

### Bleu marine

| Variable       | Valeur    | Usage                 |
| -------------- | --------- | --------------------- |
| `--navy`       | `#06245F` | Bleu marine           |
| `--navy-hover` | `#041B47` | Bleu marine au survol |

### Splash screen

| Variable          | Valeur    | Usage                     |
| ----------------- | --------- | ------------------------- |
| `--splash-bg`     | `#16213e` | Fond historique du splash |
| `--splash-fg`     | `#FFFFFF` | Texte du splash           |
| `--splash-accent` | `#E0A01C` | Accent du splash          |

Le fond `--splash-bg: #16213e` est conservé volontairement pour le splash screen.

### Ombres

| Variable        | Usage            |
| --------------- | ---------------- |
| `--shadow-card` | Ombre des cartes |
| `--shadow-soft` | Ombre légère     |

---

## 7. Variables de branding dynamique

Dagoos Mobile possède également un mécanisme de branding dynamique dans :

```text
apps/dagoos-mobile/js/branding.js
```

Ce mécanisme utilise :

```css
--dagoo-secondary
```

Cette variable **ne fait pas partie de la charte CSS officielle** des trois PWA.

Elle est injectée dynamiquement par le mécanisme de branding et doit donc rester distincte des variables statiques déclarées dans `theme.css`.

Ne pas ajouter `--dagoo-secondary` aux fichiers `theme.css` uniquement pour satisfaire l'audit de la charte.

---

## 8. Règles de développement

### Règle 1 — Pas de couleur hardcodée

Éviter dans le code applicatif :

```css
color: #06245F;
background: #FFFFFF;
border-color: #E2E8F0;
```

Préférer :

```css
color: var(--text-primary);
background: var(--bg-surface);
border-color: var(--border);
```

### Règle 2 — Utiliser la variable sémantique

Choisir la variable selon le rôle de la couleur et non uniquement selon son apparence.

Exemple :

* texte principal → `--text-primary`
* texte secondaire → `--text-secondary`
* fond de page → `--bg-page`
* fond de carte → `--bg-surface`
* bordure → `--border`
* succès → `--success-fg`
* erreur → `--error-fg`
* accent → `--accent`

### Règle 3 — `theme.css` est la source de vérité

Toute modification de palette doit être effectuée dans le `theme.css` concerné.

Ne pas créer de nouvelles couleurs locales dans les fichiers JavaScript ou HTML sans justification.

### Règle 4 — Respecter l'identité de chaque PWA

Ne pas remplacer automatiquement :

```css
var(--accent)
```

par une couleur fixe.

La valeur de `--accent` dépend de la PWA :

* Fleet Driver → vert
* Coop Driver → vert
* Dagoos Mobile → or safran

---

## 9. Procédure de migration d'une nouvelle page

### Étape 1 — Audit

Rechercher les couleurs hardcodées :

```bash
grep -RInE '#[0-9A-Fa-f]{3,8}\b|rgba?\(' \
  apps/fleet-driver \
  apps/coop-driver \
  apps/dagoos-mobile
```

Lecture seule avant toute modification.

### Étape 2 — Identifier le rôle

Pour chaque couleur trouvée, déterminer son rôle :

* texte
* fond
* bordure
* accent
* succès
* erreur
* avertissement
* information
* ombre

### Étape 3 — Remplacer par une variable

Exemple :

```css
#06245F
```

devient selon le contexte :

```css
var(--text-primary)
```

et non simplement une nouvelle variable arbitraire.

### Étape 4 — Vérifier les variables

S'assurer que la variable utilisée existe dans le `theme.css` de la PWA concernée.

### Étape 5 — Vérifier le code

Effectuer au minimum :

```bash
git diff --check
```

Puis exécuter les tests/builds disponibles pour la PWA concernée.

### Étape 6 — Test visuel

Tester les écrans modifiés :

* affichage normal
* boutons
* cartes
* états d'erreur
* états de succès
* navigation
* responsive mobile

Lorsque le thème sombre existe, vérifier également le mode sombre.

### Étape 7 — Audit résiduel

Relancer l'audit des couleurs hardcodées afin de vérifier qu'aucune couleur oubliée ne subsiste.

### Étape 8 — Commit

Utiliser un commit ciblé décrivant la migration.

Exemple :

```text
refactor(dagoos-mobile): migrer nouvelle-page vers la charte CSS
```

---

## 10. Principe de maintenance

La charte visuelle doit rester :

* centralisée ;
* sémantique ;
* cohérente entre les trois PWA ;
* indépendante du contenu métier ;
* compatible avec les évolutions futures de palette.

Toute nouvelle couleur officielle doit d'abord être ajoutée au `theme.css` concerné, puis utilisée via une variable CSS.

**La charte définit les rôles visuels ; `theme.css` définit leurs valeurs.**
