import admin from 'firebase-admin';

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
        console.warn("FIREBASE_SERVICE_ACCOUNT est manquant. Notification ignorée.");
        return res.status(200).json({
            success: true,
            status: "skipped",
            message: "Notifications push non configurées sur ce serveur."
        });
    }

    try {
        if (!admin.apps.length) {
            console.log("Initialisation de Firebase Admin...");
            const serviceAccount = JSON.parse(serviceAccountRaw);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("Firebase Admin initialisé.");
        }

        console.log(`Tentative d'envoi de notification au token: ${token.substring(0, 10)}...`);

        const host = req.headers.host || 'delcakebf.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;

        const response = await admin.messaging().send({
            notification: { title, body },
            token: token,
            data: data || {},
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    click_action: 'TOP_STORY_ACTIVITY',
                    icon: 'stock_ticker_update',
                    color: '#E8178A'
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                        'content-available': 1
                    }
                }
            },
            webpush: {
                headers: {
                    Urgency: 'high'
                },
                notification: {
                    icon: `${baseUrl}/favicon.svg`,
                    badge: `${baseUrl}/favicon.svg`,
                    tag: 'delice-cake-order',
                    renotify: true,
                    requireInteraction: true
                },
                fcm_options: {
                    link: baseUrl
                }
            }
        });
        return res.status(200).json({ success: true, messageId: response });

    } catch (err) {
        console.error("Erreur FCM :", err.message);
        return res.status(500).json({ error: "Échec de l'envoi", details: err.message });
    }
}
