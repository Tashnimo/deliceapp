# 📔 MASTER GUIDE : Réplication & Déploiement Multi-Domaine
### Projet : Délice Cake (Expérience Premium & IA)

Ce guide est le document de référence pour recréer l'intégralité de l'application sur n'importe quel autre domaine ou pour un nouveau projet client.

---

## 🛠️ 1. Pile Technologique (Tech Stack)

| Composant | Technologie | Rôle |
| :--- | :--- | :--- |
| **Front-End** | HTML5 / CSS3 / JavaScript Vanille | Structure, Style et Logique |
| **Animations** | GSAP (ScrollTrigger) | Révélations fluides et effets parallaxe |
| **Scrolling** | Lenis.js | Défilement fluide (Smooth Scroll) |
| **Base de données** | Firebase Firestore | Stockage Produits, Commandes, IA |
| **Authentification** | Firebase Auth | Sécurisation de l'espace Admin |
| **Intelligence Artificielle**| Llama 3 (via Hugging Face) | Chatbot intelligent et extraction PDF |
| **Gestion Médias** | Cloudinary (Upload Widget) | Stockage et optimisation auto des images |
| **Graphismes 3D** | Spline (Embed) | Éléments 3D interactifs (optionnel) |

---

## ⚙️ 2. Configuration des Services Externes

### A. Firebase (Le Cœur de la Donnée)
1. **Créer un projet** sur la [Console Firebase](https://console.firebase.google.com/).
2. **Firestore Database** : Activer et créer les collections suivantes :
   - `products` : Champs `name`, `price`, `image`, `desc`, `status`, `isFeatured`.
   - `orders` : Champs `items`, `total`, `customerName`, `customerPhone`, `status`, `createdAt`.
   - `knowledge` : Un seul document `brain` avec un champ `text`.
3. **Authentication** : Activer la méthode "Email/Mot de passe".

### B. Hugging Face (Le Cerveau)
1. Créer un compte sur [Hugging Face](https://huggingface.co/).
2. Générer un **Access Token (Read)** dans Settings -> Access Tokens.
3. Modèle cible : `meta-llama/Meta-Llama-3-8B-Instruct`.

### C. Cloudinary (Les Médias)
1. Créer un compte sur [Cloudinary](https://cloudinary.com/).
2. Dans "Settings" -> "Upload" :
   - Ajouter un **Upload Preset**.
   - Modifier son mode en **"Unsigned"** (Crucial pour fonctionner sans serveur backend).
   - Noter le `Cloud Name` et le `Preset Name`.

---

## 🏗️ 3. Installation et Configuration locale

1. **Fichiers source** : Copier tous les fichiers `.html`, `.css`, `.js` et les ressources (.webp, .svg, .glb).
2. **Configuration API** (`firebase-config.js`) :
   ```javascript
   const firebaseConfig = {
     apiKey: "VOTRE_ALE",
     authDomain: "VOTRE_DOMAINE",
     projectId: "VOTRE_ID",
     // ... copier le reste depuis la console Firebase
   };
   const HF_API_KEY = "hf_VOTRE_TOKEN_LLAMA";
   ```
3. **Configuration Admin** (`admin.js`) :
   - Remplacer `CLOUDINARY_CLOUD_NAME` et `CLOUDINARY_UPLOAD_PRESET` par vos identifiants Cloudinary.

---

## ⚡ 4. Optimisations de Performance "Vitesse Mobile"

Le site applique des règles strictes pour garantir un score Lighthouse > 90 :
- **Deferring** : Tous les scripts (`lenis`, `firebase`, `admin.js`) utilisent l'attribut `defer`.
- **CLS (Layout Stability)** :
  - Chaque image possède des attributs `width` et `height`.
  - Utilisation de `aspect-ratio` en CSS pour réserver l'espace des images dynamiques.
- **Smart Images** :
  - Paramètres Cloudinary : `f_auto` (format automatique comme WebP), `q_auto` (qualité optimisée).
  - Lazy-loading : `loading="lazy"` sur les images hors-écran.

---

## 🚀 5. Checklist de Déploiement

- [ ] Firebase : Règles Firestore configurées (lecture publique pour produits, auth pour admin).
- [ ] Firebase : Compte admin créé dans l'onglet Authentication.
- [ ] Cloudinary : Preset vérifié en mode "Unsigned".
- [ ] Site : Vérification du lien WhatsApp dans le pied de page (`https://wa.me/VOTRE_NUMERO`).
- [ ] SEO : Mise à jour des balises `<title>` et `meta description` dans `index.html`.

---
*Document généré le 1er Mars 2026 pour le déploiement universel du projet Délice Cake.*
