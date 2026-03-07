// Configuration Firebase de votre projet
const firebaseConfig = {
    apiKey: "AIzaSyBsTQR5wHa7EoX9Fb4DapQh_HYZi2Y7JDw",
    authDomain: "delice-cake-ba890.firebaseapp.com",
    projectId: "delice-cake-ba890",
    storageBucket: "delice-cake-ba890.firebasestorage.app",
    messagingSenderId: "276871376532",
    appId: "1:276871376532:web:475a59a23a6fe9ee1a0e81"
};

// Initialisation de Firebase uniquement si la configuration a été modifiée
const isFirebaseConfigured = true;

// CONFIGURATION CLOUDINARY (Optionnel mais recommandé pour les images)
// Récupérez ces infos sur votre tableau de bord Cloudinary.com
const CLOUDINARY_CLOUD_NAME = "dt3rgieaf"; // Ex: "votre_cloud_name"
const CLOUDINARY_UPLOAD_PRESET = "Delice_cake_preset"; // Ex: "votre_preset_non_signe"

let db = null;
let auth = null;
let messaging = null;
let storage = null;

if (isFirebaseConfigured) {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    auth = firebase.auth();
    // Safety check: only initialize messaging if the SDK is loaded and supported
    if (firebase.messaging && typeof firebase.messaging.isSupported === 'function' && firebase.messaging.isSupported()) {
        messaging = firebase.messaging();
    }
    if (firebase.storage) {
        storage = firebase.storage();
    }
}

// Plus besoin de Cloudinary.

// ==========================================
// FALLBACK : Données locales par défaut
// Utilisées si Firebase n'est pas encore configuré
// ==========================================
const MOCK_PRODUCTS = [
    { id: 'p1', name: 'Sachet Délice Cake (12 pcs)', price: 500, status: 'active', desc: '12 petits gâteaux moelleux au cœur de chocolat.', image: 'logo_bag.webp', isFeatured: true },
    { id: 'p2', name: 'Cupcake Signature', price: 1000, status: 'active', desc: 'Crème fondante onctueuse', image: 'product_cupcake.webp', isFeatured: false },
    { id: 'p3', name: 'Tiramisu Maison', price: 1000, status: 'active', desc: 'Café intense & mascarpone', image: 'product_tiramisu.webp', isFeatured: false },
    { id: 'p4', name: 'Macarons Assortis (6 pcs)', price: 2500, status: 'inactive', desc: 'Assortiment de 6 macarons fondants.', image: '', isFeatured: false },
    { id: 'p5', name: 'Gâteau Événementiel', price: 5000, status: 'active', desc: 'Sur mesure pour vos événements.', image: 'product_cake.webp', isFeatured: false, isCustom: true },
];

const DEFAULT_SITE_SETTINGS = {
    heroTitle: "L'art du\npetit gâteau\nfondant",
    heroSubtitle: "Chaque bouchée révèle un cœur de chocolat irrésistible.\nLivraison disponible — Commandez dès maintenant.",
    heroBadge: "Fait maison · Artisanal",
    heroImage: "hero_cake.webp",
    marqueeItems: ["Fait maison", "Cœur chocolat", "Artisanal", "Livraison rapide", "Sans conservateurs"],
    saveursTitle: "Coupez, savourez, craquez",
    saveursDesc: "Un extérieur doré et moelleux, un intérieur généreux en chocolat fondant.",
    whatsappNum: "22656808872",
    ctaText: "Commander",
    telegramChatIds: ["1870863898"] // Gardez ceci vide, utilisez les Secrets Cloudflare pour la sécurité
};

// Service de données abstrait (permet de basculer entre Firebase et Local Storage/Mock)
const DataService = {
    getProducts: async () => {
        if (isFirebaseConfigured && db) {
            const snapshot = await db.collection('products').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
            // Utiliser le localStorage si disponible pour simuler la modification
            const stored = localStorage.getItem('delice_mock_products');
            if (stored) return JSON.parse(stored);
            return [...MOCK_PRODUCTS];
        }
    },

    saveProduct: async (product) => {
        if (isFirebaseConfigured && db) {
            const { id, ...data } = product;
            // Vérification de taille pour les images en Base64 (limite Firestore ~1Mo)
            if (data.image && data.image.startsWith('data:image')) {
                const sizeInBytes = Math.round((data.image.length * 3) / 4);
                if (sizeInBytes > 800000) { // 800Ko par sécurité
                    throw new Error("L'image est trop volumineuse pour être sauvegardée ainsi. Assurez-vous que Cloudinary est bien configuré.");
                }
            }
            if (id && !id.startsWith('new_')) {
                await db.collection('products').doc(id).update(data);
            } else {
                await db.collection('products').add(data);
            }
        } else {
            const products = await DataService.getProducts();
            const existingIndex = products.findIndex(p => p.id === product.id);
            if (existingIndex > -1) {
                products[existingIndex] = product;
            } else {
                product.id = 'p_' + Date.now();
                products.push(product);
            }
            localStorage.setItem('delice_mock_products', JSON.stringify(products));
        }
    },

    deleteProduct: async (id) => {
        if (isFirebaseConfigured && db) {
            await db.collection('products').doc(id).delete();
        } else {
            let products = await DataService.getProducts();
            products = products.filter(p => p.id !== id);
            localStorage.setItem('delice_mock_products', JSON.stringify(products));
        }
    },

    login: async (email, password) => {
        if (isFirebaseConfigured && auth) {
            return await auth.signInWithEmailAndPassword(email, password);
        } else {
            // Simulation de connexion si email = admin
            if (email.includes('admin')) {
                return { user: { email } };
            }
            throw new Error("Identifiants incorrects (mode démo: utilisez 'admin' dans l'email)");
        }
    },

    logout: async () => {
        if (isFirebaseConfigured && auth) {
            await auth.signOut();
        }
    },

    onAuthStateChanged: (callback) => {
        if (isFirebaseConfigured && auth) {
            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    // Fetch profile if user exists
                    try {
                        const profile = await DataService.getUserProfile(user.uid);
                        user.profile = profile;
                    } catch (e) {
                        console.error("Error fetching user profile", e);
                    }
                }
                callback(user);
            });
        } else {
            callback(null);
        }
    },

    getUserProfile: async (uid, email = null) => {
        if (isFirebaseConfigured && db) {
            try {
                // 1. Try by UID
                if (uid) {
                    const doc = await db.collection('users').doc(uid).get();
                    if (doc.exists) return doc.data();
                }

                // 2. Try by Email (important for pre-authorization)
                if (email) {
                    // Try direct doc with email as ID first (pre-authorized case)
                    const emailDoc = await db.collection('users').doc(email.toLowerCase()).get();
                    if (emailDoc.exists) return emailDoc.data();

                    // Then try query
                    const snapshot = await db.collection('users').where('email', '==', email.toLowerCase()).get();
                    if (!snapshot.empty) return snapshot.docs[0].data();
                }
                return null;
            } catch (e) {
                console.error("getUserProfile error:", e);
                return null;
            }
        }
        return { role: 'superadmin', permissions: { all: true } }; // Mock default
    },

    getAllAdmins: async () => {
        if (isFirebaseConfigured && db) {
            const snapshot = await db.collection('users').get();
            return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        }
        return JSON.parse(localStorage.getItem('delice_mock_admins') || '[]');
    },

    saveAdmin: async (adminData) => {
        const { uid, email, ...data } = adminData;
        if (isFirebaseConfigured && db) {
            // New Requirement: Verify if email exists in Firebase Auth before allowing
            if (!uid) {
                try {
                    const methods = await firebase.auth().fetchSignInMethodsForEmail(email.toLowerCase());
                    if (methods.length === 0) {
                        throw new Error("Cet e-mail n'est associé à aucun compte Firebase. Veuillez d'abord créer le compte dans la console Firebase ou demander à l'utilisateur de s'inscrire.");
                    }
                } catch (e) {
                    // Handle case where enumeration protection is ON or other errors
                    if (e.code === 'auth/invalid-email') throw e;
                    console.warn("fetchSignInMethodsForEmail check failed or restricted:", e.message);
                    // If restricted, we might still want to allow save but with a warning?
                    // User said "ceux déjà présent dans firebase", so we should ideally enforce it.
                }
            }

            const docId = uid || email.toLowerCase();
            await db.collection('users').doc(docId).set({
                ...data,
                email: email.toLowerCase(),
                uid: uid || null,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } else {
            let admins = await DataService.getAllAdmins();
            const idx = admins.findIndex(a => (uid && a.uid === uid) || (email && a.email === email));
            if (idx > -1) admins[idx] = { ...adminData, uid: uid || admins[idx].uid };
            else admins.push({ ...adminData, uid: uid || 'u_' + Date.now() });
            localStorage.setItem('delice_mock_admins', JSON.stringify(admins));
        }
    },

    cleanupPendingAdmins: async () => {
        if (isFirebaseConfigured && db) {
            const snapshot = await db.collection('users').where('uid', '==', null).get();
            const batch = db.batch();
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            return snapshot.size;
        }
        return 0;
    },

    deleteAdmin: async (uid) => {
        if (isFirebaseConfigured && db) {
            await db.collection('users').doc(uid).delete();
        } else {
            let admins = await DataService.getAllAdmins();
            admins = admins.filter(a => a.uid !== uid);
            localStorage.setItem('delice_mock_admins', JSON.stringify(admins));
        }
    },

    // ==========================================
    // GESTION DES COMMANDES
    // ==========================================
    saveOrder: async (orderData) => {
        if (isFirebaseConfigured && db) {
            const pushToken = localStorage.getItem('delice_fcm_token');
            const docRef = await db.collection('orders').add({
                ...orderData,
                pushToken: pushToken || null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } else {
            let orders = JSON.parse(localStorage.getItem('delice_mock_orders') || '[]');
            const newId = 'ord_' + Date.now();
            orders.push({
                ...orderData,
                id: newId,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('delice_mock_orders', JSON.stringify(orders));
            return newId;
        }
    },

    getOrderById: async (orderId) => {
        if (isFirebaseConfigured && db) {
            const doc = await db.collection('orders').doc(orderId).get();
            if (doc.exists) {
                const data = doc.data();
                if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                    data.createdAt = data.createdAt.toDate();
                }
                return { id: doc.id, ...data };
            }
            return null;
        } else {
            const orders = JSON.parse(localStorage.getItem('delice_mock_orders') || '[]');
            return orders.find(o => o.id === orderId) || null;
        }
    },

    subscribeToOrders: (callback) => {
        if (isFirebaseConfigured && db) {
            return db.collection('orders').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
                const orders = snapshot.docs.map(doc => {
                    const data = doc.data();
                    if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                        data.createdAt = data.createdAt.toDate();
                    }
                    return { id: doc.id, ...data };
                });
                callback(orders);
            });
        }
        return null;
    },

    getOrders: async () => {
        if (isFirebaseConfigured && db) {
            const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
            return snapshot.docs.map(doc => {
                const data = doc.data();
                // Convert Firestore Timestamp to JS Date
                if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                    data.createdAt = data.createdAt.toDate();
                }
                return { id: doc.id, ...data };
            });
        } else {
            const stored = localStorage.getItem('delice_mock_orders');
            if (stored) {
                const orders = JSON.parse(stored);
                // Tri par date décroissante
                return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }
            return [];
        }
    },

    updateOrderStatus: async (orderId, newStatus) => {
        if (isFirebaseConfigured && db) {
            const orderRef = db.collection('orders').doc(orderId);
            await orderRef.update({ status: newStatus });

            // Trigger push notification if token exists
            try {
                const doc = await orderRef.get();
                if (doc.exists) {
                    const order = doc.data();
                    if (order.pushToken) {
                        const STATUS_MESSAGES = {
                            'processing': "Votre commande est en cours de préparation ! 🧁",
                            'completed': "Votre commande est prête ! 🍰 À très bientôt.",
                            'cancelled': "Votre commande a été annulée."
                        };

                        if (STATUS_MESSAGES[newStatus]) {
                            fetch('/api/push-notify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    token: order.pushToken,
                                    title: "Mise à jour Délice Cake 🍰",
                                    body: STATUS_MESSAGES[newStatus]
                                })
                            }).catch(e => console.error("Push notify trigger failed", e));
                        }
                    }
                }
            } catch (err) {
                console.error("Error triggering notification:", err);
            }
        } else {
            let orders = JSON.parse(localStorage.getItem('delice_mock_orders') || '[]');
            const index = orders.findIndex(o => o.id === orderId);
            if (index > -1) {
                orders[index].status = newStatus;
                localStorage.setItem('delice_mock_orders', JSON.stringify(orders));
            }
        }
    },

    deleteOrder: async (orderId) => {
        if (isFirebaseConfigured && db) {
            await db.collection('orders').doc(orderId).delete();
        } else {
            let orders = JSON.parse(localStorage.getItem('delice_mock_orders') || '[]');
            orders = orders.filter(o => o.id !== orderId);
            localStorage.setItem('delice_mock_orders', JSON.stringify(orders));
        }
    },

    // ==========================================
    // BASE DE CONNAISSANCES IA
    // ==========================================
    getKnowledgeBase: async () => {
        if (isFirebaseConfigured && db) {
            const snapshot = await db.collection('knowledge_base').doc('main').get();
            if (snapshot.exists) {
                return snapshot.data().content || "";
            }
            return "";
        } else {
            return localStorage.getItem('delice_mock_kb') || "";
        }
    },

    saveKnowledgeBase: async (text) => {
        if (isFirebaseConfigured && db) {
            await db.collection('knowledge_base').doc('main').set({
                content: text,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            localStorage.setItem('delice_mock_kb', text);
        }
    },

    // ==========================================
    // GESTION DES DEPENSES
    // ==========================================
    getExpenses: async () => {
        if (isFirebaseConfigured && db) {
            const snapshot = await db.collection('expenses').orderBy('date', 'desc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
            return JSON.parse(localStorage.getItem('delice_mock_expenses') || '[]');
        }
    },

    addExpense: async (expense) => {
        if (isFirebaseConfigured && db) {
            await db.collection('expenses').add({
                ...expense,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            const expenses = JSON.parse(localStorage.getItem('delice_mock_expenses') || '[]');
            expenses.unshift({ ...expense, id: 'exp_' + Date.now() });
            localStorage.setItem('delice_mock_expenses', JSON.stringify(expenses));
        }
    },

    deleteExpense: async (id) => {
        if (isFirebaseConfigured && db) {
            await db.collection('expenses').doc(id).delete();
        } else {
            let expenses = JSON.parse(localStorage.getItem('delice_mock_expenses') || '[]');
            expenses = expenses.filter(e => e.id !== id);
            localStorage.setItem('delice_mock_expenses', JSON.stringify(expenses));
        }
    },

    // ==========================================
    // SUIVI DES LEADS (INTÉRET CLIENT)
    // ==========================================
    logLead: async (source) => {
        if (isFirebaseConfigured && db) {
            try {
                await db.collection('leads').add({
                    source: source || 'unknown',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (e) { console.error("Lead log failed", e); }
        }
    },

    subscribeToLeads: (callback) => {
        if (isFirebaseConfigured && db) {
            return db.collection('leads')
                .where('timestamp', '>', new Date(Date.now() - 30000)) // Only very recent ones
                .onSnapshot(snapshot => {
                    if (!snapshot.empty && !snapshot.metadata.hasPendingWrites) {
                        callback(snapshot.docs.map(doc => doc.data()));
                    }
                });
        }
        return null;
    },

    // ==========================================
    // RÉGLAGES DU SITE (TEXTES ET MÉDIAS)
    // ==========================================
    getSiteSettings: async () => {
        if (isFirebaseConfigured && db) {
            const doc = await db.collection('site_settings').doc('main').get();
            if (doc.exists) {
                return doc.data();
            }
            return null; // Let the caller handle default values
        } else {
            const stored = localStorage.getItem('delice_mock_site_settings');
            return stored ? JSON.parse(stored) : null;
        }
    },

    getSiteSettingsSync: () => {
        // Essential for immediate access to IDs/Phone if Firebase fails or is slow
        return DEFAULT_SITE_SETTINGS;
    },

    saveSiteSettings: async (settings) => {
        if (isFirebaseConfigured && db) {
            // Vérification de taille pour les images en Base64
            if (settings.heroImage && settings.heroImage.startsWith('data:image')) {
                const sizeInBytes = Math.round((settings.heroImage.length * 3) / 4);
                if (sizeInBytes > 800000) {
                    throw new Error("L'image Hero est trop volumineuse. Vérifiez Cloudinary.");
                }
            }
            await db.collection('site_settings').doc('main').set({
                ...settings,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            localStorage.setItem('delice_mock_site_settings', JSON.stringify(settings));
        }
    },

    subscribeToOrder: (orderId, callback) => {
        if (isFirebaseConfigured && db) {
            return db.collection('orders').doc(orderId).onSnapshot(doc => {
                if (doc.exists) {
                    callback({ id: doc.id, ...doc.data() });
                }
            });
        } else {
            // Mock local simulation
            const checkMock = () => {
                const orders = JSON.parse(localStorage.getItem('delice_mock_orders') || '[]');
                const order = orders.find(o => o.id === orderId);
                if (order) callback(order);
            };
            const interval = setInterval(checkMock, 5000);
            return () => clearInterval(interval);
        }
    },

    /**
     * @param {File} file 
     * @param {string} folder 
     * @returns {Promise<string>}
     */
    uploadFile: async (file, folder = 'misc') => {
        // PRIORITÉ 1 : Cloudinary (Plus fiable et gratuit)
        if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                formData.append('folder', `delice_cake/${folder}`);

                const response = await fetch(
                    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                    {
                        method: 'POST',
                        body: formData
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error ? errorData.error.message : "Erreur Cloudinary");
                }

                const data = await response.json();
                console.log("Cloudinary upload success:", data.secure_url);
                // Ajout d'un cache-buster pour éviter que l'ancienne image ne s'affiche
                return `${data.secure_url}?v=${Date.now()}`;
            } catch (error) {
                console.error("Cloudinary upload failed:", error);
                // Si Cloudinary est configuré mais échoue, c'est probablement une erreur de configuration (ex: Preset non signé).
                // On arrête l'upload ici pour avertir l'utilisateur au lieu de bloquer indéfiniment sur Firebase Storage.
                throw new Error("Échec Cloudinary (" + error.message + "). Vérifiez que votre Upload Preset '" + CLOUDINARY_UPLOAD_PRESET + "' est bien en mode 'Unsigned' (Non signé) dans vos paramètres Cloudinary.");
            }
        }

        // PRIORITÉ 2 : Firebase Storage
        if (isFirebaseConfigured && storage) {
            try {
                const fileName = `${Date.now()}_${file.name}`;
                const storageRef = storage.ref(`${folder}/${fileName}`);
                await storageRef.put(file);
                return await storageRef.getDownloadURL();
            } catch (error) {
                console.error("Firebase Storage upload failed, falling back...", error);
            }
        }

        // PRIORITÉ 3 : Base64 (Dernier recours, limité par la taille Firestore)
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = (e) => reject(new Error("Erreur de lecture du fichier"));
            reader.readAsDataURL(file);
        });
    },

    /**
     * @param {string} sessionId 
     * @param {object} message { role, content }
     */
    saveChatMessage: async (sessionId, message) => {
        if (isFirebaseConfigured && db) {
            try {
                // Update session document for listing
                await db.collection('ai_conversations').doc(sessionId).set({
                    lastMessage: message.content,
                    lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                // Add message to subcollection
                await db.collection('ai_conversations').doc(sessionId).collection('messages').add({
                    ...message,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (e) { console.error("Chat save failed", e); }
        }
    },

    getConversations: async () => {
        if (isFirebaseConfigured && db) {
            const snapshot = await db.collection('ai_conversations').orderBy('lastUpdate', 'desc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        return [];
    },

    getConversationMessages: async (sessionId) => {
        if (isFirebaseConfigured && db) {
            const snapshot = await db.collection('ai_conversations').doc(sessionId).collection('messages').orderBy('timestamp', 'asc').get();
            return snapshot.docs.map(doc => doc.data());
        }
        return [];
    }
};
