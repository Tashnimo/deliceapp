# 📖 GUIDE UNIVERSEL — Site Web Premium avec IA & Gestion d'Activité
### Architecture complète · Toutes industries · N pages

> **Ce document est la référence absolue** pour recréer une application web premium identique à Délice Cake, quel que soit le secteur : restaurant, salon de beauté, boutique, artisan, clinique, agence, etc.

---

## 📐 1. Architecture Globale

```
Client (Navigateur)
    ├── index.html         ← Pages publiques (vitrine, boutique, landing...)
    ├── admin.html         ← Interface de gestion (protégée par login)
    ├── style.css          ← Design système complet (thème, animations)
    ├── admin.css          ← Design du panneau admin
    ├── script.js          ← Logique publique + Chatbot IA
    ├── admin.js           ← Logique admin (CRUD, stats, paramètres)
    └── firebase-config.js ← DataService (couche d'abstraction données)

Vercel (Serveur serverless)
    └── api/
        ├── chat.js        ← Proxy IA sécurisé (Groq / HF)
        └── notify.js      ← Proxy Telegram sécurisé

Firebase (Cloud)
    ├── Firestore          ← Base de données temps réel
    ├── Authentication     ← Connexion admin sécurisée
    └── Storage            ← Médias et images

Services tiers
    ├── Groq API           ← Intelligence Artificielle (LLM)
    ├── Cloudinary         ← Hébergement et optimisation images
    └── Telegram Bot       ← Notifications push gratuites
```

---

## 🛠️ 2. Stack Technologique Complète

| Composant | Technologie | Rôle | Gratuit ? |
|:---|:---|:---|:---:|
| **Structure** | HTML5 sémantique | Pages et contenu | ✅ |
| **Style** | CSS3 Vanille | Design, animations, responsive | ✅ |
| **Logique** | JavaScript ES6+ | Interactivité et appels API | ✅ |
| **Scroll fluide** | [Lenis.js](https://lenis.studiofreight.com/) | Smooth scroll premium | ✅ |
| **Animations** | GSAP (optionnel) | Effets d'entrée avancés | ✅ (basique) |
| **Base de données** | [Firebase Firestore](https://firebase.google.com/) | Données temps réel | ✅ (quota gratuit) |
| **Auth Admin** | Firebase Authentication | Connexion sécurisée | ✅ |
| **Stockage médias** | Firebase Storage ou [Cloudinary](https://cloudinary.com/) | Images produits | ✅ |
| **Intelligence IA** | [Groq API](https://console.groq.com/) | Chatbot Llama 3 | ✅ |
| **Notifications** | [Telegram Bot](https://core.telegram.org/bots) | Alertes commandes | ✅ |
| **Hébergement** | [Vercel](https://vercel.com/) | Déploiement + Fonctions serveur | ✅ |
| **Code source** | [GitHub](https://github.com/) | Versioning + CI/CD | ✅ |

> **Coût total de fonctionnement : 0 FCFA / mois** dans les quotas gratuits.

---

## ⚙️ 3. Configuration des Services (Étape par Étape)

### A. Firebase (Base de données)

1. Va sur [console.firebase.google.com](https://console.firebase.google.com/) → **Créer un projet**
2. **Firestore Database** → Créer la base → Mode `Test` (puis sécuriser avec les règles)
3. **Collections à créer** :
   - `products` — Champs : `name`, `price`, `desc`, `image`, `status`, `isFeatured`, `isCustom`
   - `orders` — Champs : `items[]`, `totalAmount`, `note`, `status`, `createdAt`
   - `site_settings` — Document `main` avec tous les textes du site
   - `knowledge_base` — Document `main` avec champ `content` (contexte IA)
   - `users` — Profils admins : `email`, `role`, `permissions`
   - `expenses` — Dépenses : `label`, `amount`, `date`, `category`
   - `leads` — Tracking intérêt clients
   - `ai_conversations` — Historique chats IA
4. **Authentication** → Activer **Email/Mot de passe**
5. Créer le premier compte admin : **Authentification → Ajouter un utilisateur**
6. Dans **Paramètres du projet → Vos applications** → Copier la config `firebaseConfig`

**Règles Firestore recommandées :**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public (lecture produits, paramètres)
    match /products/{doc} { allow read: if true; allow write: if request.auth != null; }
    match /site_settings/{doc} { allow read: if true; allow write: if request.auth != null; }
    // Protégé (admin seulement)
    match /orders/{doc} { allow read, write: if request.auth != null; }
    match /users/{doc} { allow read, write: if request.auth != null; }
    match /knowledge_base/{doc} { allow read: if true; allow write: if request.auth != null; }
    // Client peut écrire (commandes, leads, chats), admin peut lire
    match /leads/{doc} { allow create: if true; allow read: if request.auth != null; }
    match /ai_conversations/{session=**} { allow read, write: if true; }
    match /expenses/{doc} { allow read, write: if request.auth != null; }
  }
}
```

---

### B. Groq API (Intelligence Artificielle)

1. Va sur [console.groq.com](https://console.groq.com/) → Créer un compte gratuit
2. **API Keys** → **Create API Key** → Copier la clé (`gsk_...`)
3. Modèles disponibles gratuits : `llama-3.1-8b-instant` (rapide), `llama-3.3-70b-versatile` (intelligent)
4. Ajouter dans Vercel comme variable d'environnement : `GROQ_API_KEY`

> **Pourquoi Groq et non Hugging Face ?** HF a supprimé l'accès gratuit à leur API d'inférence en 2026. Groq offre 14 000 tokens/min gratuits avec latence < 1 seconde.

---

### C. Telegram Bot (Notifications)

1. Ouvre Telegram → Cherche **@BotFather**
2. Envoie `/newbot` → Donne un nom → Ton token arrive (`7xxx:AAAA...`)
3. Envoie un message à ton bot, puis va sur :
   `https://api.telegram.org/bot<TON_TOKEN>/getUpdates`
4. Récupère ton `chat_id` dans la réponse JSON
5. Ajouter dans Vercel : `TELEGRAM_BOT_TOKEN` et `TELEGRAM_CHAT_ID`

---

### D. Cloudinary (Images Produits) — *Optionnel si Firebase Storage utilisé*

1. Va sur [cloudinary.com](https://cloudinary.com/) → Compte gratuit
2. **Settings → Upload → Upload Presets** → Ajouter un preset en mode **Unsigned**
3. Noter : `Cloud Name` et `Preset Name`
4. Dans `admin.js`, remplacer `CLOUDINARY_CLOUD_NAME` et `CLOUDINARY_UPLOAD_PRESET`

---

### E. Vercel (Hébergement)

1. Va sur [vercel.com](https://vercel.com/) → Connecte ton compte GitHub
2. **New Project** → Importer ton repo GitHub
3. **Settings → Environment Variables** — Ajouter :

| Nom de la variable | Valeur | Description |
|:---|:---|:---|
| `GROQ_API_KEY` | `gsk_xxxxx` | Clé API Groq pour l'IA |
| `TELEGRAM_BOT_TOKEN` | `7xxx:AAAA` | Token du Bot Telegram |
| `TELEGRAM_CHAT_ID` | `123456789` | ID de ton chat Telegram |

4. Chaque `git push` sur `main` déclenche un redéploiement automatique.

---

## 📁 4. Structure des Fichiers

```
mon-projet/
├── index.html              ← Page d'accueil (or autant de pages que nécessaire)
├── admin.html              ← Panneau d'administration
├── style.css               ← Tous les styles du site vitrine
├── admin.css               ← Styles du panneau admin
├── script.js               ← Logique vitrine + chatbot IA + commandes
├── admin.js                ← Logique complète admin
├── firebase-config.js      ← Config Firebase + DataService abstrait
├── vercel.json             ← Config Vercel (routes propres)
├── manifest.json           ← PWA manifest (icône, nom appli)
├── firebase-messaging-sw.js ← Service worker (optionnel, notifs web)
├── favicon.svg             ← Icône de l'onglet
├── api/
│   ├── chat.js             ← Proxy IA sécurisé (Groq)
│   └── notify.js           ← Proxy Telegram sécurisé
└── assets/                 ← Images, logos, médias locaux
```

**`vercel.json` minimal :**
```json
{
  "version": 2,
  "cleanUrls": true
}
```

---

## 🎨 5. Design Système — Variables à Adapter par Secteur

Dans `style.css`, modifier la section `:root` :

```css
:root {
  /* === COULEURS (changer selon secteur) === */
  --pink: #E8178A;          /* Couleur principale (CTA, boutons) */
  --pink-pale: #FFF0F8;     /* Fond sections alternées */
  --black: #1A0A12;         /* Texte principal */
  --white: #FFFFFF;

  /* === TYPOGRAPHIE === */
  --font-main: 'Outfit', sans-serif;   /* Corps du texte */
  --font-fancy: 'Cormorant Garamond', serif; /* Titres élégants */

  /* === ESPACEMENTS === */
  --section-pad: clamp(4rem, 8vw, 7rem);
  --container: 1200px;
}
```

**Palettes suggérées par secteur :**
| Secteur | Principale | Accent | Font titre |
|:---|:---|:---|:---|
| Restauration / Food | `#C0392B` rouge | `#F39C12` or | Playfair Display |
| Beauté / Spa | `#8E44AD` violet | `#F8BBD9` rose | Cormorant |
| Tech / SaaS | `#2980B9` bleu | `#1ABC9C` vert | Inter |
| Luxe / Mode | `#1A1A1A` noir | `#C9A84C` or | Libre Baskerville |
| Santé / Clinique | `#16A085` vert | `#ECF0F1` gris | Lato |
| Artisan | `#8B4513` marron | `#D4A76A` beige | Merriweather |

---

## 🤖 6. Configuration du Chatbot IA

Le système de contexte IA (`script.js`) charge automatiquement :
- Le menu / catalogue de produits depuis Firestore
- La base de connaissances (`knowledge_base`) éditable depuis l'admin

**Adapter le prompt système dans `script.js` :**
```javascript
systemContext = `Tu es [NOM_ASSISTANT], assistant de [NOM_ENTREPRISE] situé(e) à [VILLE].
Sois chaleureux, concis et utilise des emojis.

CATALOGUE :
${productListText}

INFORMATIONS : ${kbContent}`;
```

**Le fichier `api/chat.js` :**
```javascript
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant"; // ou "llama-3.3-70b-versatile" pour plus d'intelligence
```

---

## 📋 7. DataService — Collections Firestore par Secteur

Le `DataService` dans `firebase-config.js` gère toutes les collections. Adapter les noms selon le secteur :

| Sector | `products` → | `orders` → | Champs spécifiques |
|:---|:---|:---|:---|
| Pâtisserie | Gâteaux | Commandes | `flavor`, `size`, `occasion` |
| Restaurant | Plats/Menu | Réservations | `persons`, `date`, `time` |
| Beauté | Soins/Services | Rendez-vous | `stylist`, `duration` |
| E-commerce | Produits | Achats | `sku`, `stock`, `variants` |
| Services B2B | Prestations | Devis/Contrats | `client`, `deadline` |

---

## 🧠 8. Panneau Admin — Fonctionnalités Incluses

Le panneau `admin.html` / `admin.js` comprend :

- **Tableau de bord** — Stats temps réel (CA, nb commandes, tendances)
- **Gestion Commandes** — Liste, filtre par statut, mise à jour statut
- **Gestion Produits/Services** — CRUD complet avec upload image Cloudinary
- **Paramètres Site** — Éditeur visuel de textes, images, numéros WhatsApp
- **Base de Connaissances IA** — Éditeur du contexte injecté dans Délice AI
- **Comptabilité** — Saisie dépenses, solde calculé (revenus - dépenses)
- **Conversations IA** — Historique des chats clients
- **Gestion Admins** — Système multi-admin avec rôles (superadmin, admin, comptable)
- **Notifications Telegram** — Alertes en temps réel sur mobile

**Rôles disponibles :**
| Rôle | Accès |
|:---|:---|
| `superadmin` | Tout + gestion des autres admins |
| `admin` | Commandes, produits, paramètres |

---

## 🚀 9. Checklist de Déploiement

### Préparation
- [ ] Créer projet Firebase + Firestore + Auth activée
- [ ] Créer compte Groq + clé API
- [ ] Créer Bot Telegram + récupérer chat_id
- [ ] Créer compte GitHub + push du code source
- [ ] Créer compte Vercel + importer le repo GitHub

### Configuration
- [ ] Mettre la config Firebase dans `firebase-config.js`
- [ ] Ajouter les variables d'environnement sur Vercel (`GROQ_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`)
- [ ] Adapter les couleurs / typographie dans `style.css`
- [ ] Adapter le prompt IA dans `script.js`
- [ ] Personnaliser les textes dans `DEFAULT_SITE_SETTINGS` (`firebase-config.js`)

### Admin & Contenu
- [ ] Créer le premier compte admin dans Firebase Auth
- [ ] Connexion sur `/admin` → Ajouter les produits/services
- [ ] Paramètres Site → Mettre le numéro WhatsApp, textes, images
- [ ] Base de Connaissances → Remplir avec les infos de l'entreprise

### SEO & Performance
- [ ] Mettre à jour `<title>` et `<meta description>` dans `index.html`
- [ ] Ajouter un `sitemap.xml` et `robots.txt`
- [ ] Compresser toutes les images en `.webp`
- [ ] Vérifier score Lighthouse > 90

### Tests finaux
- [ ] Tester le chatbot IA (envoyer "Bonjour")
- [ ] Passer une commande test → Vérifier notification Telegram
- [ ] Tester la connexion admin
- [ ] Tester sur mobile (responsive)

---

## 🔧 10. Ajouter des Pages Supplémentaires

Pour ajouter une nouvelle page (ex: `/a-propos`, `/galerie`, `/blog`) :

1. Créer `a-propos.html` avec la même structure `<head>` que `index.html`
2. Inclure les mêmes scripts (`firebase-config.js`, `script.js`)
3. Grâce au `"cleanUrls": true` dans `vercel.json`, l'URL sera `/a-propos` (sans `.html`)

**Template minimal d'une page :**
```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>À Propos — Votre Entreprise</title>
    <link rel="stylesheet" href="style.css">
    <!-- Firebase + Scripts identiques à index.html -->
</head>
<body>
    <nav><!-- Même navigation --></nav>
    <main>
        <!-- Contenu spécifique à la page -->
    </main>
    <footer><!-- Même pied de page --></footer>
    <script src="firebase-config.js" defer></script>
    <script src="script.js" defer></script>
</body>
</html>
```

---

## 🔐 11. Sécurité

| Pratique | Implémentation |
|:---|:---|
| **Clés API masquées** | Toujours dans Vercel Env Vars, jamais dans le code client |
| **API proxy** | `/api/chat.js` et `/api/notify.js` cachent les tokens côté serveur |
| **Auth admin** | Firebase Authentication sur toutes les routes admin |
| **Firestore** | Règles strictes : lecture publique limitée, écriture = auth obligatoire |
| **HTTPS** | Fourni automatiquement par Vercel |

---

## 📈 12. Évolutions et Scalabilité

| Besoin | Solution |
|:---|:---|
| Plus de trafic | Vercel auto-scale gratuitement jusqu'à 100GB/mois |
| Plus d'IA | Passer à `llama-3.3-70b-versatile` sur Groq |
| Paiement en ligne | Ajouter [Stripe](https://stripe.com/) ou [CinetPay](https://cinetpay.com/) (Afrique) |
| Multi-langues | `i18next.js` pour internationalisation |
| Blog / SEO | Ajouter pages statiques ou intégrer un CMS headless (Sanity, Contentful) |
| App Mobile | Transformer en PWA (manifest déjà inclus) ou React Native |
| Analytics | Firebase Analytics ou Plausible (vie privée) |
| Email marketing | [Mailchimp](https://mailchimp.com/) ou [Brevo](https://brevo.com/) (gratuit 300/j) |

---

*Document généré le 4 Mars 2026 — Version 2.0 (Groq AI Edition)*
*Architecture validée en production sur : Délice Cake, Ouagadougou (delcakebf.vercel.app)*
