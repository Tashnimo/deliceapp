# 📔 Guide de Réplication Technique - Délice Cake

Ce guide contient toutes les informations nécessaires pour recréer ou déployer le site **Délice Cake** sur un nouveau domaine ou environnement.

---

## 🛠️ 1. Services Externes & Clés API

### A. Firebase (Base de données & Auth)
Le site utilise Firebase pour stocker les produits, les commandes et les connaissances de l'IA.
- **Console** : [firebase.google.com](https://console.firebase.google.com/)
- **Services activés** :
  - **Authentication** : Activer la connexion par Email/Mot de passe.
  - **Firestore Database** : Créer une base en mode "Production" (ou modifier les règles pour autoriser l'accès).
- **Configuration** (`firebase-config.js`) : Copiez l'objet `firebaseConfig` fourni par la console Firebase dans ce fichier.

### B. Hugging Face (Cerveau de l'IA)
Utilisé par le chatbot pour générer des réponses intelligentes.
- **Provider** : Hugging Face Inference API.
- **Modèle utilisé** : `meta-llama/Meta-Llama-3-8B-Instruct`.
- **Clé API** : NE PAS mettre dans le code. À configurer uniquement dans les **Secrets Cloudflare** (variable `HF_API_KEY`).

### C. Cloudinary (Hébergement Images)
Remplace Firebase Storage pour une gestion plus fluide des médias et une optimisation automatique.
- **Console** : [cloudinary.com](https://cloudinary.com/)
- **Configuration Required** :
  - **Cloud Name** : `dt3rgieaf` (à mettre à jour si changement de compte).
  - **Upload Preset** : `Delice_preset` (doit être configuré en mode **"Unsigned"**).
- **Fichiers concernés** : `admin.js` (Variables `CLOUDINARY_CLOUD_NAME` et `CLOUDINARY_UPLOAD_PRESET`).

---

## 🏗️ 2. Structure du Projet

- `index.html` : Vitrine publique (optimisée performance).
- `style.css` : Design system, animations et responsive.
- `script.js` : Logique front-end, animations GSAP, interactions IA.
- `admin.html` : Tableau de bord sécurisé.
- `admin.js` : Gestion CRUD (Produits/Commandes), Brain IA, Cloudinary Widget.
- `firebase-config.js` : Cœur de la configuration des services.

---

## ⚡ 3. Bonnes Pratiques de Performance (Mobile)

Pour maintenir un score Lighthouse élevé :
1. **Scripts Différés** : Utilisez l'attribut `defer` pour tous les scripts non-critiques (Firebase, Lenis).
2. **Stabilité Visuelle (CLS)** : 
   - Toujours spécifier `width` et `height` sur les balises `<img>`.
   - Utiliser `aspect-ratio` en CSS pour les conteneurs d'images.
3. **Optimisation Cloudinary** : 
   - Utiliser `f_auto, q_auto` dans les URLs d'images pour une compression automatique.
   - Utiliser le paramètre `w_` pour redimensionner les images selon la taille d'affichage (ex: `w_300` pour les miniatures).
4. **Chargement Prioritaire** : Ajouter `fetchpriority="high"` sur l'image principale au-dessus de la ligne de flottaison (LCP).

---

## 🚀 4. Étapes de Déploiement

1. **Hébergement** : Importez tous les fichiers sur votre serveur (GitHub Pages, Vercel, Hostinger, etc.).
2. **Sécurité Admin** :
   - Créez un compte administrateur dans Firebase Authentication.
   - Assurez-vous que les règles Firestore restreignent l'écriture aux utilisateurs authentifiés.
3. **Test Media** : Allez sur l'espace admin et uploadez une image de test avec le nouveau compte Cloudinary.
4. **Test IA** : Posez une question sur vos produits au chatbot pour vérifier la connexion à Hugging Face.

---

## 🤖 5. Automatisation avec GitHub (Zéro Tracas)

Pour éviter les envois manuels et rendre le site vraiment "dynamique" :

1.  **Créez un dépôt sur GitHub** : Nommez-le `delice-cake` sur [github.com](https://github.com).
2.  **Envoyez vos fichiers (Méthode simple)** :
    - Sur la page de votre nouveau dépôt, cliquez sur le lien **"uploading an existing file"** (en bas de la page).
    - Sélectionnez tous vos fichiers locaux (Ctrl+A dans votre dossier) et glissez-les dans la fenêtre GitHub.
    - Cliquez sur **"Commit changes"**.
3.  **Liez à Cloudflare Pages** :
    - Dans Cloudflare, créez un nouveau projet Pages > **"Connecter à Git"**.
    - Sélectionnez votre dépôt `delice-cake`.
    - **Configuration** : Build command (vide), Output directory : `.` (le point).
4.  **Résultat** : Pour chaque mise à jour, il vous suffira de glisser les fichiers modifiés sur GitHub. Cloudflare s'occupe du reste !

## Configuration Cloudflare Workers & IA

Le site est désormais **entièrement sécurisé**. Aucune clé n'est visible dans le code source.

### 1. Sécurité (Secrets)
Vous devez configurer 3 secrets dans votre tableau de bord Cloudflare (**Settings > Variables > Production**) :

1.  **`HF_API_KEY`** : Votre clé Hugging Face.
2.  **`TELEGRAM_BOT_TOKEN`** : Le jeton de votre bot Telegram (ex: `123456:ABC...`).
3.  **`TELEGRAM_CHAT_IDS`** : Les IDs des admins, séparés par une virgule (ex: `7687122420,1870863898`).

### 2. Procédure de mise à jour
1.  Enregistrez vos modifications sur votre ordinateur.
2.  Allez sur GitHub et glissez les fichiers modifiés.
3.  Cloudflare déploie automatiquement.
4.  **Note** : Si vous changez une clé, n'oubliez pas de mettre à jour le secret dans Cloudflare et de relancer un déploiement.

---
*Dernière mise à jour : 3 Mars 2026*
