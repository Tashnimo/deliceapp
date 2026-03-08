importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyBsTQR5wHa7EoX9Fb4DapQh_HYZi2Y7JDw",
    authDomain: "delice-cake-ba890.firebaseapp.com",
    projectId: "delice-cake-ba890",
    storageBucket: "delice-cake-ba890.firebasestorage.app",
    messagingSenderId: "276871376532",
    appId: "1:276871376532:web:475a59a23a6fe9ee1a0e81"
});

const messaging = firebase.messaging();

// Gérer les notifications en arrière-plan
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Notification reçue en arrière-plan ', payload);

    // Si Firebase envoie une vraie notification backend, il l'affiche tout seul !
    if (payload.notification) {
        console.log("Notification gérée nativement par FCM.");
        return;
    }

    // Le backend n'a envoyé que des datas (fallback safe)
    const notificationTitle = payload.data?.title || "Délice Cake";
    const notificationOptions = {
        body: payload.data?.body || "Nouvelle mise à jour sur votre commande !",
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        data: payload.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer le clic sur la notification
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Si on a un lien de destination dans les data, on l'utilise
    const targetUrl = event.notification.data?.link || self.location.origin;

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((windowClients) => {
            // Si un onglet est déjà ouvert sur notre site, on le focus
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // Sinon on ouvre un nouvel onglet
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
