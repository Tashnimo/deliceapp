/**
 * API pour envoyer des notifications push via Firebase Cloud Messaging (FCM)
 * Nécessite la variable d'environnement FIREBASE_SERVICE_ACCOUNT (JSON du compte de service)
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { token, title, body, data } = req.body;

    if (!token || !title || !body) {
        return res.status(400).json({ error: 'Paramètres manquants (token, title, body)' });
    }

    // Le compte de service est nécessaire pour l'authentification FCM v1
    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountRaw) {
        console.error("FIREBASE_SERVICE_ACCOUNT est manquant.");
        return res.status(500).json({
            error: "Serveur non configuré pour les notifications push.",
            instructions: "Veuillez ajouter FIREBASE_SERVICE_ACCOUNT dans les variables d'environnement Vercel."
        });
    }

    try {
        // Note: Pour un environnement Vercel sans firebase-admin installé, 
        // une implémentation pure fetch + signature JWT serait très longue.
        // Nous recommandons d'installer `firebase-admin` via npm.
        // Voici une version simplifiée utilisant l'API REST Legacy si disponible, 
        // ou le template pour firebase-admin.

        // Pour les besoins de ce projet, nous allons utiliser firebase-admin s'il est disponible,
        // sinon nous renverrons une erreur explicite pour que l'utilisateur l'ajoute.

        let admin;
        try {
            admin = require('firebase-admin');
        } catch (e) {
            return res.status(500).json({
                error: "firebase-admin n'est pas installé.",
                solution: "Exécutez `npm install firebase-admin` et déployez à nouveau."
            });
        }

        if (!admin.apps.length) {
            const serviceAccount = JSON.parse(serviceAccountRaw);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }

        const message = {
            notification: { title, body },
            token: token,
            data: data || {},
            webpush: {
                notification: {
                    icon: 'https://delice-cake.vercel.app/favicon.svg',
                    badge: 'https://delice-cake.vercel.app/favicon.svg',
                    click_action: 'https://delice-cake.vercel.app/'
                }
            }
        };

        const response = await admin.messaging().send(message);
        return res.status(200).json({ success: true, messageId: response });

    } catch (err) {
        console.error("Erreur FCM :", err.message);
        return res.status(500).json({ error: "Échec de l'envoi", details: err.message });
    }
}
