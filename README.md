# 🏍️ DAGOO MOBILITY

**La mobilité connectée... Chez les potes, ça roule.**

*Dago = surnom des Malgaches. Dagoo = "Chez nous", "Entre nous".*

---

## 🌐 URLs

| Service | URL |
|---------|-----|
| **Landing Page** | [dago-mobility.vercel.app](https://dago-mobility.vercel.app) |
| **Admin** | [dago-mobility.vercel.app/login](https://dago-mobility.vercel.app/login) |
| **Fleet** | [dago-mobility.vercel.app/fleet-login](https://dago-mobility.vercel.app/fleet-login) |
| **Coop** | [dago-mobility.vercel.app/coop-login](https://dago-mobility.vercel.app/coop-login) |
| **Register** | [dago-mobility.vercel.app/register](https://dago-mobility.vercel.app/register) |
| **Driver PWA** | [dago-driver.pages.dev](https://dago-driver.pages.dev) |
| **API** | [dagoos-api.onrender.com](https://dagoos-api.onrender.com) |

---

## 🏗️ Structure du projet
D:/Dagoos/
├── admin-next/ → Frontend Next.js 14 + React 18 + Tailwind CSS (Vercel) - 58 pages
├── apps/
│ ├── api/ → Backend Express + Prisma + SQLite (Render)
│ ├── fleet/ → Flotte (legacy - migré vers admin-next)
│ ├── coop/ → Coopérative (legacy - migré vers admin-next)
│ ├── driver/ → PWA Chauffeur (Cloudflare Pages)
│ └── landing/ → Landing page (legacy - migrée vers admin-next)
├── assets/ → Images, logos, favicons
├── packages/ → Packages partagés (types, utils, hooks, ui)
└── docs/ → Documentation

---

## 🔧 Technologies

| Couche | Technologie |
|--------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide React |
| **Backend** | Express.js, Prisma ORM, SQLite, JWT |
| **Hébergement** | Vercel (frontend), Render (API), Cloudflare Pages (Driver PWA) |

---

## 🔑 Comptes

### Super Admins
| Email | Mot de passe |
|-------|-------------|
| `admin@dagoos.mg` | `admin123` |
| `tovoniaina.rahendrison@gmail.com` | `ByGagoos@2024!` |

### Admins (équipe ByDagoos)
| Email | Mot de passe |
|-------|-------------|
| `finances@bydagoos.mg` | `Finance123!` |
| `logistique@bydagoos.mg` | `Logistique123!` |
| `support@bydagoos.mg` | `Support123!` |
| `admin@bydagoos.mg` | `Admin123!` |
| `miantsatianarahendrison@gmail.com` | `Mi2026!` |

### Gestionnaires de Flotte
| Email | Mot de passe |
|-------|-------------|
| `fleet-freemium@test.mg` | `123456` |
| `fleet-basic@test.mg` | `123456` |
| `fleet-standard@test.mg` | `123456` |
| `fleet-premium@test.mg` | `123456` |
| `abela@me.eu` | `Proprio123!` |
| `diego@speed.mg` | `Proprio123!` |
| `rabe@email.com` | `Proprio123!` |

### Coopératives
| Email | Mot de passe |
|-------|-------------|
| `coop-freemium@test.mg` | `123456` |
| `coop-basic@test.mg` | `123456` |
| `coop-standard@test.mg` | `123456` |
| `coop-premium@test.mg` | `123456` |
| `rafilipo@moi.eu` | `VJFR1T89` |
| `rakoto@email.com` | `Proprio123!` |

### Coopératives Premium (avec landing page)
| Coopérative | Email | Mot de passe |
|-------------|-------|-------------|
| ANTSIRABE – TANA | `contact@antsirabe-tana.mg` | `Test123` |
| SONATRA | `contact@sonatra.mg` | `Test123` |
| KOFMAD | `contact@kofmad.mg` | `Test123` |
| TRANS BESADY RN7 | `contact@trans-besady-rn7.mg` | `Test123` |
| TRANS MINO | `contact@trans-mino.mg` | `Test123` |
| KOFIAM | `contact@kofiam.mg` | `Test123` |
| MADA VOYAGE | `contact@mada-voyage.mg` | `Test123` |
| KOFIMANGA | `contact@kofimanga.mg` | `Test123` |
| TRANS 47 | `contact@trans-47.mg` | `Test123` |
| KOFISA | `contact@kofisa.mg` | `Test123` |
| FIMPIMA | `contact@fimpima.mg` | `Test123` |
| FIFIABE | `contact@fifiabe.mg` | `Test123` |
| KOFIFI | `contact@kofifi.mg` | `Test123` |
| TRANS ROUTE | `contact@trans-route.mg` | `Test123` |

---

## 🛠️ Développement

```bash
# Lancer en local
cd admin-next && npm run dev     # http://localhost:5001

# Build production
cd admin-next && npm run build

# Déployer
git add admin-next/ && git commit -m "message" && git push origin main

© 2026 Dagoo Mobility. La mobilité connectée... Chez les potes, ça roule.