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
    const notificationTitle = payload.notification.title || "Nouvelle commande !";
    const notificationOptions = {
        body: payload.notification.body || "Vérifiez votre tableau de bord.",
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer le clic sur la notification
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('https://delice-cake.vercel.app/')
    );
});
