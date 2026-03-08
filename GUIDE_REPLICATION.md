# Délice Cake - Guide de Réplication Universel

Ce document détaille l'architecture complète, les fonctionnalités et les étapes nécessaires pour répliquer le site web e-commerce de Délice Cake, incluant son chatbot IA avancé, ses notifications push, et son tableau de bord d'administration complet.

---

## 🏗️ Architecture et Technologies

Le projet est conçu comme une **Single Page Application (SPA) Vanilla**. Il n'utilise pas de frameworks lourds (comme React ou Vue) pour le frontend afin de garantir une légèreté maximale, mais s'appuie sur une infrastructure backend Serverless puissante.

*   **Frontend** : HTML5, CSS3 (Vanilla), JavaScript (ES6+).
*   **Hébergement & Backend Serverless** : **Vercel**
*   **Base de données & Auth** : **Firebase** (Firestore, Firebase Auth)
*   **Notifications Web Push** : **Firebase Cloud Messaging (FCM)**
*   **Intelligence Artificielle** : API **Groq** (Modèle *Llama-3.1-8b-instant*)
*   **Notifications Admin** : Bot **Telegram**
*   **Redirection Client** : API **WhatsApp** (`api.whatsapp.com/send`)
*   **Génération PDF** : `jspdf` et `jspdf-autotable`

---

## ✨ Fonctionnalités Principales Déployées

### 1. Prise de Commande Classique et Dynamique
*   Sélection de produits dynamiques via une modale personnalisée.
*   Modification dynamique des paramètres du site (Texte CTA, Numéro WhatsApp, Vidéo, Titres, Descriptions) depuis le tableau de bord Admin, appliqués en temps réel sur le site client.

### 2. Chatbot Intelligent (Délice AI)
*   **Interaction fluide** : L'IA agit comme un vendeur, orientant le client selon le nombre de parts, les saveurs, etc.
*   **Extraction Structurée** : L'IA formate les données de commande dans un bloc JSON natif (`[ORDER_DATA: {...}]`) que le frontend intercepte.
*   **Confirmation Premium** : Une fois la commande détectée, une interface de validation avec reçu détaillé (Produits, Quantités, Total, Acompte de 50%) s'affiche dans le chat.

### 3. Système Unique de Multi-Notification
Lorsqu'une commande est confirmée (via la modale classique ou via l'IA) :
1.  **Enregistrement Base de données** : La commande est sauvegardée dans Firebase Firestore avec un statut `new`.
2.  **Notification Telegram (Admin)** : Un message formaté (montant, items, lien admin) est instantanément envoyé sur le canal Telegram de la cheffe via Vercel Serverless Functions (`/api/notify`).
3.  **Redirection WhatsApp (Client)** : Le client est redirigé vers l'application WhatsApp de la pâtisserie, avec un récapitulatif textuel complet pré-rempli.

### 4. Notifications Web Push Proactives (FCM)
*   Après une commande, le client est invité via une belle interface à autoriser les notifications.
*   Le "token" de son appareil est enregistré et lié à sa commande dans Firestore.
*   Lorsque l'Admin change le statut de la commande en **"Terminé / Prête"**, un appel API (`/api/push-notify`) déclenche une **notification Push sur le smartphone ou PC du client** ("Votre commande est prête ! 🍰"), même si le navigateur est fermé (grâce au *Service Worker*).

### 5. Tableau de Bord d'Administration Sécurisé
*   Authentification via Firebase Auth (Email/Mot de passe).
*   **Gestion des commandes** : Modification de statuts, suppression, consultation.
*   **Bouton "Tester la Notification"** : Pour vérifier le bon fonctionnement du Push vers l'appareil d'un client spécifique.
*   **Visionneuse de Chat** : L'administrateur peut lire dans une interface claire (façon iMessage/WhatsApp) les discussions qu'ont eues les clients avec le chatbot IA.
*   **Paramètres globaux** : Gestion des tarifs, du texte de couverture, de l'URL de la vidéo.

### 6. Suivi de Commande & Facturation PDF
*   Génération d'un lien de suivi persistant pour le client (Widget "Suivi" en haut du site).
*   Génération automatique d'une facture **PDF stylisée** (aux couleurs de la marque, avec calcul des totaux et références alphanumériques) grâce à la librairie `jsPDF`.

---

## 🚀 Guide Rapide de Configuration & Déploiement

### Étape 1 : Configuration de Firebase
1.  Créez un projet sur la console Firebase.
2.  Activez **Firestore Database** et **Authentication** (Email/Mot de passe).
3.  Activez **Cloud Messaging (FCM)**. Générez une clé **VAPID** pour le Web Push.
4.  Générez une clé de compte de service (Service Account JSON) pour l'API Backend.
5.  Mettez à jour le fichier `firebase-config.js` avec vos clés publiques (`apiKey`, `messagingSenderId`, `appId`, etc.).

### Étape 2 : Création des Bots et API Tierces
1.  **Groq API** : Créez un compte GroqCloud et générez une API Key pour le modèle Llama 3.
2.  **Telegram Bot** : 
    * Parlez à `@BotFather` sur Telegram pour créer un bot et obtenir le `TELEGRAM_BOT_TOKEN`.
    * Initiez une discussion avec votre bot, puis utilisez `@userinfobot` pour obtenir votre `TELEGRAM_CHAT_ID`.

### Étape 3 : Variables d'Environnement sur Vercel
Le site utilise des "Serverless Functions" (dossier `/api/`) pour cacher vos clés secrètes au public. Sur Vercel, ajoutez (Settings > Environment Variables) :
*   `GROQ_API_KEY` : Votre clé API Groq
*   `TELEGRAM_BOT_TOKEN` : Le token Botfather
*   `TELEGRAM_CHAT_IDS` : Votre identifiant Telegram.
*   `FIREBASE_SERVICE_ACCOUNT` : Le JSON complet et compacté du Service Account Firebase (pour les notifications Push).

### Étape 4 : Le Fichier `vercel.json`
Crucial pour le routage de l'API proxy, les headers de sécurité, et pour autoriser ou bloquer certains accès :
```json
{
    "rewrites": [
        { "source": "/api/chat", "destination": "/api/chat.js" },
        { "source": "/api/notify", "destination": "/api/notify.js" },
        { "source": "/api/push-notify", "destination": "/api/push-notify.js" }
    ]
}
```

### Étape 5 : Déploiement
*   Mettez le code sur Github.
*   Liez le dépôt sur Vercel.
*   Assurez-vous que l'Auth Admin Firebase contient bien un utilisateur autorisé manuellement.
*   **C'est en ligne !**

---

*Créé par Antigravity - Délice AI Architecture*
