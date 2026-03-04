/**
 * Délice Admin - Logic Dashboard
 * Connecté via DataService (Firebase ou Mock Local)
 */
// --- Global Debug / Error Hub ---
window.onerror = function (msg, url, lineNo, columnNo, error) {
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) {
        debugInfo.style.display = 'block';
        debugInfo.innerHTML += `<div>[Global Error] ${msg} (ligne ${lineNo})</div>`;
    }
    return false;
};

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // NOTIFICATIONS (Sonores & Browser)
    // ==========================================
    const playSound = (type) => {
        try {
            // Vibrate if mobile
            if (navigator.vibrate) {
                if (type === 'notification') {
                    navigator.vibrate([200, 100, 200]);
                } else if (type === 'success') {
                    navigator.vibrate(50);
                }
            }

            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            const now = ctx.currentTime;

            if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'notification') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.setValueAtTime(659.25, now + 0.15);
                gainNode.gain.setValueAtTime(0.2, now); // Increased volume
                gainNode.gain.setTargetAtTime(0, now, 0.3);
                osc.start(now);
                osc.stop(now + 0.5);
            }
        } catch (e) {
            console.log("Audio not supported or blocked", e);
        }
    };

    const sendBrowserNotification = (title, body) => {
        if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
            new Notification(title, {
                body: body,
                icon: 'favicon.svg'
            });
        }
    };

    // Aesthetic Toast Notification
    const showToast = (message, type = 'success') => {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.className = `toast toast--${type} active`;

        setTimeout(() => {
            toast.classList.remove('active');
        }, 4000);
    };

    // Firebase Cloud Messaging (FCM) Initialization
    async function initFCM() {
        if (!messaging) return;

        try {
            // Register service worker explicitly for Firebase Messaging
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('firebase-messaging-sw.js');
                console.log('Service Worker registered with scope:', registration.scope);

                // Set the service worker registration for messaging
                messaging.useServiceWorker(registration);
            }

            // Request permission
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Notification permission granted.');

                // Get Token (VAPID Key placeholder - replace with actual key from Firebase)
                // Note: The VAPID key is required for Web Push to work.
                const token = await messaging.getToken({
                    vapidKey: 'BPH6yV9GvW-vV6X4_G0V_oV9GvW-vV6X4_G0V_oV9GvW-vV6X4_G0V_o' // Placeholder
                });

                if (token) {
                    console.log('FCM Token:', token);

                    // Save token to Firestore so the server knows who to notify
                    try {
                        await db.collection('admin_tokens').doc(token).set({
                            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
                            platform: navigator.platform
                        });
                        console.log('Token saved to Firestore.');
                    } catch (e) {
                        console.error('Error saving token:', e);
                    }
                } else {
                    console.log('No registration token available.');
                }
            }
        } catch (err) {
            console.warn('FCM Initialization failed (Normal in local if no HTTPS):', err);
        }
    }

    // Lead Subscription for real-time interest
    let leadUnsubscribe = null;
    function initLeadSubscription() {
        if (leadUnsubscribe) leadUnsubscribe();
        if (typeof DataService.subscribeToLeads === 'function') {
            leadUnsubscribe = DataService.subscribeToLeads((newLeads) => {
                // Flash the browser tab or show a toast
                playSound('notification');
                sendBrowserNotification(
                    "Client intéressé ! 👀",
                    "Un visiteur vient de cliquer sur un bouton de commande."
                );
            });
        }
    }

    // Request notification permission on first interaction or load
    if (typeof Notification !== 'undefined' && Notification.permission !== "granted" && Notification.permission !== "denied") {
        // We'll call initFCM after login to ensure we have context
    }

    // --- DOM Elements ---
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('dashboard');
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    const debugInfo = document.getElementById('debug-info');
    const logoutBtn = document.getElementById('logout-btn');

    const productsTableBody = document.getElementById('products-table-body');
    const searchInput = document.getElementById('search-input');

    const addProductBtn = document.getElementById('add-product-btn');
    const productModal = document.getElementById('product-modal');
    const productForm = document.getElementById('product-form');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');

    const modalTitle = document.getElementById('modal-title');
    const idInput = document.getElementById('product-id');
    const imageInput = document.getElementById('product-image');
    const nameInput = document.getElementById('product-name');
    const priceInput = document.getElementById('product-price');
    const statusInput = document.getElementById('product-status');
    const descInput = document.getElementById('product-desc');

    const imageElement = document.getElementById('image-element');
    const imagePlaceholder = document.getElementById('image-placeholder');
    const navSite = document.getElementById('nav-site');
    const navChat = document.getElementById('nav-chat');
    const viewSite = document.getElementById('view-site');
    const viewChat = document.getElementById('view-chat');

    const chatSessionsBody = document.getElementById('chat-sessions-body');
    const chatViewerHeader = document.getElementById('chat-viewer-header');
    const chatViewerBody = document.getElementById('chat-viewer-body');

    // Admin Management Elements
    const navAdmins = document.getElementById('nav-admins');
    const navAdminsContainer = document.getElementById('nav-admins-container');
    const viewAdmins = document.getElementById('view-admins');
    const adminsTableBody = document.getElementById('admins-table-body');
    const searchAdminsInput = document.getElementById('search-admins-input');
    const addAdminBtn = document.getElementById('add-admin-btn');
    const adminModal = document.getElementById('admin-modal');
    const adminForm = document.getElementById('admin-form');
    const closeAdminModal = document.getElementById('close-admin-modal');
    const cancelAdminModal = document.getElementById('cancel-admin-modal');
    const adminModalTitle = document.getElementById('admin-modal-title');
    const adminUidInput = document.getElementById('admin-uid');
    const adminEmailInput = document.getElementById('admin-email');
    const adminRoleSelect = document.getElementById('admin-role');
    const permissionsContainer = document.getElementById('permissions-container');

    // Site Editor Elements
    const siteHeroTitle = document.getElementById('site-hero-title');
    const siteHeroSubtitle = document.getElementById('site-hero-subtitle');
    const siteHeroBadge = document.getElementById('site-hero-badge');
    const siteHeroImage = document.getElementById('site-hero-image');
    const siteMarqueeItems = document.getElementById('site-marquee-items');
    const siteSaveursTitle = document.getElementById('site-saveurs-title');
    const siteSaveursDesc = document.getElementById('site-saveurs-desc');
    const siteWhatsappNum = document.getElementById('site-whatsapp-num');
    const siteCtaText = document.getElementById('site-cta-text');
    const siteTelegramIds = document.getElementById('site-telegram-ids');
    const siteSaveBtn = document.getElementById('site-save-btn');

    const productFileInput = document.getElementById('product-file-input');
    const siteFileInput = document.getElementById('site-file-input');
    const uploadImageBtn = document.getElementById('upload-image-btn');

    let products = [];

    // --- Authentication ---
    DataService.onAuthStateChanged(async (user) => {
        try {
            if (user) {
                console.log("User logged in:", user.email);
                loginScreen.classList.add('hidden');
                dashboard.classList.add('visible');

                // ROLE-BASED UI INITIALIZATION
                // Fetch profile: try by UID, then by Email
                let profile = await DataService.getUserProfile(user.uid, user.email);

                // If specialized profile was found by email but not linked to UID yet, link it
                if (profile && !profile.uid && isFirebaseConfigured) {
                    console.log("Linking pre-authorized email profile to UID...");
                    await DataService.saveAdmin({ ...profile, uid: user.uid });
                }

                // Bootstrap: If no users in DB and this is the first one, make it superadmin
                if (isFirebaseConfigured && !profile) {
                    try {
                        const allAdmins = await DataService.getAllAdmins();
                        if (allAdmins.length === 0) {
                            profile = { role: 'superadmin', email: user.email, permissions: { all: true } };
                            await DataService.saveAdmin({ uid: user.uid, ...profile });
                            showToast("Bienvenue Super-Admin ! Accès total activé.", "success");
                        }
                    } catch (e) {
                        console.error("Bootstrap check failed:", e);
                    }
                }

                if (!profile) {
                    // Default fallback for authorized but not-yet-profiled users
                    profile = { role: 'admin', permissions: { products: true, orders: true } };
                }

                applyPermissions(profile);

                loadProducts();
                loadConversations();
                initFCM(); // Initialize FCM after login
                initLeadSubscription(); // Start listening for leads
            } else {
                dashboard.classList.remove('visible');
                loginScreen.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Auth state change error:", error);
            if (debugInfo) {
                debugInfo.style.display = 'block';
                debugInfo.textContent = "Erreur d'initialisation : " + error.message;
            }
        }
    });

    function applyPermissions(profile) {
        if (!profile) return;

        const isSuper = profile.role === 'superadmin';
        const perms = profile.permissions || {};

        // Sidebar visibility
        const adminsNav = document.getElementById('nav-admins-container');
        if (adminsNav) {
            adminsNav.style.display = isSuper ? 'block' : 'none';
        }

        // Other tabs visibility
        const getParent = (id) => {
            const el = document.getElementById(id);
            return el ? el.parentElement : null;
        };

        const navProductsLi = getParent('nav-products');
        const navOrdersLi = getParent('nav-orders');
        const navKnowledgeLi = getParent('nav-knowledge');
        const navChatLi = getParent('nav-chat');
        const navSiteLi = getParent('nav-site');
        const navAccountingLi = getParent('nav-accounting');

        if (!isSuper) {
            if (navProductsLi) navProductsLi.style.display = perms.products ? 'block' : 'none';
            if (navOrdersLi) navOrdersLi.style.display = perms.orders ? 'block' : 'none';
            if (navKnowledgeLi) navKnowledgeLi.style.display = perms.knowledge ? 'block' : 'none';
            if (navChatLi) navChatLi.style.display = perms.chat ? 'block' : 'none';
            if (navSiteLi) navSiteLi.style.display = perms.site ? 'block' : 'none';
            if (navAccountingLi) navAccountingLi.style.display = perms.accounting ? 'block' : 'none';
        } else {
            // Superadmin sees everything
            [navProductsLi, navOrdersLi, navKnowledgeLi, navChatLi, navSiteLi, navAccountingLi].forEach(li => {
                if (li) li.style.display = 'block';
            });
        }
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        try {
            const btn = loginForm.querySelector('button');
            const originalText = btn.textContent;

            loginError.style.display = 'none';
            debugInfo.style.display = 'none';
            debugInfo.textContent = '';

            btn.textContent = 'Connexion...';
            btn.disabled = true;

            // Vérification technique avant login
            if (typeof firebase === 'undefined') {
                throw new Error("SDK Firebase non chargé. Vérifiez votre connexion internet ou vos réglages de blocage.");
            }

            await DataService.login(email, password);

            // Si on utilise le mock, on simule le changement d'état manuel
            if (!isFirebaseConfigured) {
                loginScreen.classList.add('hidden');
                dashboard.classList.add('visible');
                loadProducts();
            }

            btn.textContent = originalText;
            btn.disabled = false;
        } catch (error) {
            console.error("Login detail error:", error);

            loginError.textContent = "Échec de la connexion.";
            loginError.style.display = 'block';

            // Affichage des détails techniques pour le débug mobile
            debugInfo.style.display = 'block';
            debugInfo.textContent = `Détail : ${error.code || 'Erreur'} - ${error.message}`;

            const btn = loginForm.querySelector('button');
            btn.textContent = 'Connexion';
            btn.disabled = false;
        }
    });

    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await DataService.logout();
        if (!isFirebaseConfigured) {
            dashboard.classList.remove('visible');
            loginScreen.classList.remove('hidden');
        }
    });

    // --- Loading Products ---
    async function loadProducts() {
        try {
            productsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chargement des produits...</td></tr>';
            products = await DataService.getProducts();
            renderTable();
        } catch (error) {
            console.error("Erreur de chargement", error);
            productsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--danger);">Erreur lors du chargement des produits.</td></tr>';
        }
    }

    // --- Rendering ---
    function renderTable() {
        const filterText = searchInput.value;
        productsTableBody.innerHTML = '';

        const filtered = products.filter(p => p.name.toLowerCase().includes(filterText.toLowerCase()));

        if (filtered.length === 0) {
            productsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--grey-text);">Aucun produit trouvé.</td></tr>';
            return;
        }

        filtered.forEach(p => {
            const tr = document.createElement('tr');

            const statusBadge = p.status === 'active'
                ? '<span class="badge badge--active">Actif</span>'
                : '<span class="badge badge--inactive">Inactif</span>';

            const getOptimizedUrl = (url, width = 100) => {
                if (!url) return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="%23E8178A" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                if (url.includes('cloudinary.com')) {
                    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_thumb/`);
                }
                return url;
            };

            const imgUrl = getOptimizedUrl(p.image, 80);

            tr.innerHTML = `
                <td>
                    <div class="product-cell">
                        <img src="${imgUrl}" alt="${p.name}" width="50" height="50" 
                            style="aspect-ratio: 1/1; object-fit: cover; border-radius: 8px;" decoding="async">
                        <div class="product-cell-info">
                            <strong>${p.name}</strong>
                            <span>${p.desc || '—'}</span>
                        </div>
                    </div>
                </td>
                <td><strong>${p.price}</strong> FCFA</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="actions">
                        <button class="action-btn edit" data-id="${p.id}" title="Modifier">
                            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                        <button class="action-btn delete" data-id="${p.id}" title="Supprimer">
                            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </td>
            `;
            productsTableBody.appendChild(tr);
        });

        // Attach events
        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => openModal(e.currentTarget.dataset.id));
        });

        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => deleteProduct(e.currentTarget.dataset.id));
        });
    }

    searchInput.addEventListener('input', renderTable);

    // --- Modal Logic ---
    function openModal(productId = null) {
        if (productId) {
            const product = products.find(p => p.id === productId);
            modalTitle.textContent = 'Modifier le produit';
            idInput.value = product.id;
            imageInput.value = product.image || '';
            nameInput.value = product.name;
            priceInput.value = product.price;
            statusInput.value = product.status;
            descInput.value = product.desc || '';
            updateImagePreview();
        } else {
            modalTitle.textContent = 'Ajouter un produit';
            productForm.reset();
            idInput.value = '';
            updateImagePreview();
        }
        productModal.classList.add('active');
    }

    function closeModal() {
        productModal.classList.remove('active');
    }

    addProductBtn.addEventListener('click', () => openModal(null));
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    // Live image preview (via URL field)
    imageInput.addEventListener('input', updateImagePreview);

    function updateImagePreview(url) {
        const src = typeof url === 'string' ? url : imageInput.value.trim();
        if (src) {
            imageElement.src = src;
            imageElement.style.display = 'block';
            imagePlaceholder.style.display = 'none';
        } else {
            imageElement.style.display = 'none';
            imagePlaceholder.style.display = 'block';
        }
    }

    // --- Firebase Storage Upload Logic ---
    if (uploadImageBtn && productFileInput) {
        uploadImageBtn.addEventListener('click', () => {
            productFileInput.click();
        });

        productFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const originalText = uploadImageBtn.textContent;
                uploadImageBtn.textContent = 'Téléchargement...';
                uploadImageBtn.disabled = true;

                const url = await DataService.uploadFile(file, 'products');
                imageInput.value = url;
                updateImagePreview(url);

                uploadImageBtn.textContent = originalText;
                uploadImageBtn.disabled = false;
            } catch (error) {
                console.error("Upload failed", error);
                alert("Erreur lors du téléchargement de l'image.");
                uploadImageBtn.textContent = 'Importer une image';
                uploadImageBtn.disabled = false;
            }
        });
    }

    // --- Form Submit ---
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = document.getElementById('save-product-btn');
        const origText = btn.textContent;
        btn.textContent = 'Enregistrement...';
        btn.disabled = true;

        const formData = {
            name: nameInput.value,
            price: parseInt(priceInput.value, 10),
            status: statusInput.value,
            desc: descInput.value,
            image: imageInput.value
        };

        if (idInput.value) {
            formData.id = idInput.value;
        }

        try {
            await DataService.saveProduct(formData);
            playSound('success');
            closeModal();
            loadProducts(); // Re-fetch from DB
        } catch (error) {
            alert("Erreur lors de la sauvegarde : " + error.message);
        } finally {
            btn.textContent = origText;
            btn.disabled = false;
        }
    });

    // --- Delete ---
    async function deleteProduct(productId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce produit définitivement ?')) {
            try {
                await DataService.deleteProduct(productId);
                playSound('success');
                loadProducts(); // Re-fetch
            } catch (error) {
                alert("Erreur lors de la suppression : " + error.message);
            }
        }
    }

    // ==========================================
    // MODULE COMMANDES
    // ==========================================

    // --- DOM Elements Commandes & IA ---
    const navProducts = document.getElementById('nav-products');
    const navOrders = document.getElementById('nav-orders');
    const navKnowledge = document.getElementById('nav-knowledge');
    const navAccounting = document.getElementById('nav-accounting');
    const viewProducts = document.getElementById('view-products');
    const viewOrders = document.getElementById('view-orders');
    const viewKnowledge = document.getElementById('view-knowledge');
    const viewAccounting = document.getElementById('view-accounting');
    const pageTitle = document.getElementById('page-title');

    const kbEditor = document.getElementById('kb-editor');
    const kbFileInput = document.getElementById('kb-file-input');
    const kbParseBtn = document.getElementById('kb-parse-btn');
    const kbSaveBtn = document.getElementById('kb-save-btn');
    const kbExtractStatus = document.getElementById('kb-extract-status');

    const ordersTableBody = document.getElementById('orders-table-body');
    const searchOrdersInput = document.getElementById('search-orders-input');
    const filterOrdersStatus = document.getElementById('filter-orders-status');
    const newOrderBadge = document.getElementById('new-order-badge');

    let orders = [];

    // --- Navigation (Tab Switching) ---
    function switchView(viewName) {
        // Reset all
        const allNavs = [navProducts, navOrders, navKnowledge, navSite, navChat, navAdmins];
        const allViews = [viewProducts, viewOrders, viewKnowledge, viewSite, viewChat, viewAdmins];
        if (navAccounting) allNavs.push(navAccounting);
        if (viewAccounting) allViews.push(viewAccounting);

        allNavs.forEach(n => { if (n) n.classList.remove('active'); });
        allViews.forEach(v => { if (v) v.style.display = 'none'; });

        if (viewName === 'products') {
            navProducts.classList.add('active');
            viewProducts.style.display = 'block';
            pageTitle.textContent = 'Gestion des Produits';
            loadProducts();
        } else if (viewName === 'orders') {
            navOrders.classList.add('active');
            viewOrders.style.display = 'block';
            pageTitle.textContent = 'Gestion des Commandes';
            loadOrders();
        } else if (viewName === 'knowledge') {
            navKnowledge.classList.add('active');
            viewKnowledge.style.display = 'block';
            pageTitle.textContent = 'Cerveau IA';
            loadKnowledge();
        } else if (viewName === 'chat') {
            if (navChat) navChat.classList.add('active');
            if (viewChat) viewChat.style.display = 'block';
            pageTitle.textContent = 'Conversations IA';
            loadConversations();
        } else if (viewName === 'accounting') {
            if (navAccounting) navAccounting.classList.add('active');
            if (viewAccounting) viewAccounting.style.display = 'block';
            pageTitle.textContent = 'Comptabilité';
            loadAccounting();
        } else if (viewName === 'site') {
            navSite.classList.add('active');
            viewSite.style.display = 'block';
            pageTitle.textContent = 'Personnalisation du Site';
            loadSiteSettings();
        } else if (viewName === 'admins') {
            if (navAdmins) navAdmins.classList.add('active');
            if (viewAdmins) viewAdmins.style.display = 'block';
            pageTitle.textContent = 'Gestion des Administrateurs';
            loadAdmins();
        }
    }

    navProducts.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('products');
    });

    navOrders.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('orders');
    });

    navKnowledge.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('knowledge');
    });

    if (navAccounting) {
        navAccounting.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('accounting');
        });
    }

    navSite.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('site');
    });

    if (navChat) {
        navChat.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('chat');
        });
    }

    if (navAdmins) {
        navAdmins.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('admins');
        });
    }

    let previousNewOrderCount = 0;
    let orderUnsubscribe = null;

    // --- Loading Orders (Real-time) ---
    async function loadOrders() {
        if (orderUnsubscribe) orderUnsubscribe();

        ordersTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chargement des commandes...</td></tr>';

        if (typeof DataService.subscribeToOrders === 'function') {
            orderUnsubscribe = DataService.subscribeToOrders((newOrders) => {
                orders = newOrders;
                renderOrdersTable();
                updateNewOrdersBadge();
            });
        } else {
            // Fallback for mock/local
            orders = await DataService.getOrders();
            renderOrdersTable();
            updateNewOrdersBadge();
        }
    }

    function updateNewOrdersBadge() {
        const newCount = orders.filter(o => o.status === 'new').length;
        if (newCount > 0) {
            newOrderBadge.style.display = 'inline-block';
            newOrderBadge.textContent = newCount;
            // Play sound and send browser notification if we have more new orders
            if (newCount > previousNewOrderCount) {
                playSound('notification');
                sendBrowserNotification(
                    "Nouvelle commande ! 🍰",
                    `Vous avez ${newCount} commande(s) en attente.`
                );
            }
        } else {
            newOrderBadge.style.display = 'none';
        }
        previousNewOrderCount = newCount;
    }

    // Status utilities
    const STATUS_MAP = {
        'new': { label: 'Nouveau', class: 'badge--active', color: '#E8178A' },
        'processing': { label: 'En cours', class: '', color: '#F59E0B' },
        'completed': { label: 'Terminé', class: '', color: '#10B981' },
        'cancelled': { label: 'Annulé', class: 'badge--inactive', color: '#EF4444' }
    };

    // --- Rendering Orders ---
    function renderOrdersTable() {
        const searchText = searchOrdersInput.value.toLowerCase();
        const statusFilter = filterOrdersStatus.value;

        ordersTableBody.innerHTML = '';

        let filteredOrders = orders.filter(o => {
            const matchStatus = statusFilter === 'all' || o.status === statusFilter;
            // Search in items, note or total
            const orderString = JSON.stringify(o).toLowerCase();
            const matchSearch = orderString.includes(searchText);
            return matchStatus && matchSearch;
        });

        if (filteredOrders.length === 0) {
            ordersTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--grey-text);">Aucune commande trouvée.</td></tr>';
            return;
        }

        filteredOrders.forEach(o => {
            const tr = document.createElement('tr');

            // Format Date
            let dateStr = 'Inconnue';
            if (o.createdAt) {
                const d = new Date(o.createdAt);
                dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            }

            // Format Items
            let itemsHtml = '<ul style="margin:0; padding-left:1.2rem; font-size:0.9rem; color:var(--grey-text);">';
            if (o.items && Array.isArray(o.items)) {
                o.items.forEach(item => {
                    itemsHtml += `<li><b>${item.quantity}x</b> ${item.name}</li>`;
                });
            }
            itemsHtml += '</ul>';
            if (o.note) {
                itemsHtml += `<div style="margin-top:0.5rem; font-size:0.85rem; padding:0.4rem; background:rgba(232, 23, 138, 0.1); border-left:2px solid var(--primary); border-radius:4px;"><i>Note: ${o.note}</i></div>`;
            }

            const currentStatus = o.status || 'new';
            const statusInfo = STATUS_MAP[currentStatus];
            const badgeHtml = `<span class="badge ${statusInfo.class}" style="${!statusInfo.class ? `background-color:${statusInfo.color}20; color:${statusInfo.color}; border:1px solid ${statusInfo.color}40;` : ''}">${statusInfo.label}</span>`;

            tr.innerHTML = `
                <td style="white-space:nowrap; font-size:0.9rem;">${dateStr}</td>
                <td style="max-width:300px;">${itemsHtml}</td>
                <td><strong>${new Intl.NumberFormat('fr-FR').format(o.totalAmount || 0)}</strong> FCFA</td>
                <td>
                    <select class="form-input status-dropdown" data-id="${o.id}" style="padding:0.2rem; width:120px; font-size:0.85rem; margin-bottom:0.3rem;">
                        <option value="new" ${currentStatus === 'new' ? 'selected' : ''}>Nouveau</option>
                        <option value="processing" ${currentStatus === 'processing' ? 'selected' : ''}>En cours</option>
                        <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>Terminé</option>
                        <option value="cancelled" ${currentStatus === 'cancelled' ? 'selected' : ''}>Annulé</option>
                    </select>
                    <div>${badgeHtml}</div>
                </td>
                <td style="text-align:right;">
                    <div class="actions">
                        <button class="action-btn delete delete-order" data-id="${o.id}" title="Supprimer">
                            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </td>
            `;
            ordersTableBody.appendChild(tr);
        });

        // Attach events
        document.querySelectorAll('.status-dropdown').forEach(select => {
            select.addEventListener('change', async (e) => {
                const orderId = e.target.getAttribute('data-id');
                const newStatus = e.target.value;
                try {
                    e.target.disabled = true;
                    await DataService.updateOrderStatus(orderId, newStatus);
                    playSound('success');
                    await loadOrders(); // Refresh to update badges and UI
                } catch (err) {
                    alert("Erreur lors de la mise à jour du statut.");
                    e.target.disabled = false;
                }
            });
        });

        document.querySelectorAll('.delete-order').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const orderId = e.currentTarget.getAttribute('data-id');
                if (confirm('Êtes-vous sûr de vouloir supprimer cette commande de l\'historique ?')) {
                    try {
                        await DataService.deleteOrder(orderId);
                        loadOrders();
                    } catch (err) {
                        alert("Erreur lors de la suppression de la commande.");
                    }
                }
            });
        });
    }

    searchOrdersInput.addEventListener('input', renderOrdersTable);
    filterOrdersStatus.addEventListener('change', renderOrdersTable);

    // ==========================================
    // MODULE KNOWLEDGE BASE IA
    // ==========================================

    async function loadKnowledge() {
        try {
            kbEditor.value = "Chargement des connaissances...";
            const content = await DataService.getKnowledgeBase();
            kbEditor.value = content;
        } catch (error) {
            console.error(error);
            kbEditor.value = "";
            alert("Erreur lors du chargement de la base de connaissances.");
        }
    }

    kbSaveBtn.addEventListener('click', async () => {
        try {
            const origText = kbSaveBtn.textContent;
            kbSaveBtn.textContent = 'Sauvegarde...';
            kbSaveBtn.disabled = true;

            await DataService.saveKnowledgeBase(kbEditor.value);
            playSound('success');

            kbSaveBtn.textContent = 'Sauvegardé !';
            setTimeout(() => {
                kbSaveBtn.textContent = origText;
                kbSaveBtn.disabled = false;
            }, 2000);
        } catch (error) {
            alert("Erreur de sauvegarde : " + error.message);
            kbSaveBtn.textContent = 'Sauvegarder les connaissances';
            kbSaveBtn.disabled = false;
        }
    });

    kbParseBtn.addEventListener('click', async () => {
        const file = kbFileInput.files[0];
        if (!file) {
            alert("Veuillez d'abord sélectionner un fichier (.txt ou .pdf).");
            return;
        }

        kbExtractStatus.style.display = 'block';
        kbParseBtn.disabled = true;

        try {
            let extractedText = "";

            if (file.type === "text/plain") {
                extractedText = await file.text();
            } else if (file.type === "application/pdf") {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = "";

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(" ");
                    fullText += pageText + "\n\n";
                }
                extractedText = fullText;
            } else {
                throw new Error("Format non supporté. Seuls les .txt et .pdf sont acceptés.");
            }

            // Ajouter le texte extrait au texte existant (avec séparateur)
            if (kbEditor.value.trim() !== "") {
                kbEditor.value += "\n\n--- Document ajouté : " + file.name + " ---\n\n";
            }
            kbEditor.value += extractedText;

            kbFileInput.value = ""; // Reset input
        } catch (error) {
            alert("Erreur lors de l'extraction. Vérifiez que c'est un vrai fichier TXT ou PDF : " + error.message);
        } finally {
            kbExtractStatus.style.display = 'none';
            kbParseBtn.disabled = false;
        }
    });

    // ==========================================
    // MODULE SITE SETTINGS
    // ==========================================

    async function loadSiteSettings() {
        try {
            let settings = await DataService.getSiteSettings();

            // Si pas de réglages en base, on utilise les défauts
            if (!settings) settings = DEFAULT_SITE_SETTINGS;

            if (settings) {
                siteHeroTitle.value = settings.heroTitle || DEFAULT_SITE_SETTINGS.heroTitle;
                siteHeroSubtitle.value = settings.heroSubtitle || DEFAULT_SITE_SETTINGS.heroSubtitle;
                siteHeroBadge.value = settings.heroBadge || DEFAULT_SITE_SETTINGS.heroBadge;
                siteHeroImage.value = settings.heroImage || DEFAULT_SITE_SETTINGS.heroImage;

                const marquee = settings.marqueeItems || DEFAULT_SITE_SETTINGS.marqueeItems;
                siteMarqueeItems.value = marquee.join(", ");

                siteSaveursTitle.value = settings.saveursTitle || DEFAULT_SITE_SETTINGS.saveursTitle;
                siteSaveursDesc.value = settings.saveursDesc || DEFAULT_SITE_SETTINGS.saveursDesc;
                siteWhatsappNum.value = settings.whatsappNum || DEFAULT_SITE_SETTINGS.whatsappNum;
                siteCtaText.value = settings.ctaText || DEFAULT_SITE_SETTINGS.ctaText;

                if (settings.telegramChatIds) {
                    siteTelegramIds.value = settings.telegramChatIds.join(", ");
                } else if (DEFAULT_SITE_SETTINGS.telegramChatIds) {
                    siteTelegramIds.value = DEFAULT_SITE_SETTINGS.telegramChatIds.join(", ");
                }
            }
        } catch (error) {
            console.error("Erreur chargement réglages", error);
        }
    }

    siteSaveBtn.addEventListener('click', async () => {
        try {
            siteSaveBtn.textContent = 'Enregistrement...';
            siteSaveBtn.disabled = true;

            const settings = {
                heroTitle: siteHeroTitle.value,
                heroSubtitle: siteHeroSubtitle.value,
                heroBadge: siteHeroBadge.value,
                heroImage: siteHeroImage.value,
                marqueeItems: siteMarqueeItems.value.split(",").map(i => i.trim()).filter(i => i !== ""),
                saveursTitle: siteSaveursTitle.value,
                saveursDesc: siteSaveursDesc.value,
                whatsappNum: siteWhatsappNum.value,
                ctaText: siteCtaText.value,
                telegramChatIds: siteTelegramIds.value.split(",").map(i => i.trim()).filter(i => i !== "")
            };

            await DataService.saveSiteSettings(settings);
            playSound('success');
            alert("Réglages du site sauvegardés avec succès !");
        } catch (error) {
            alert("Erreur lors de la sauvegarde : " + error.message);
        } finally {
            siteSaveBtn.textContent = 'Enregistrer les modifications';
            siteSaveBtn.disabled = false;
        }
    });

    // Integrated Firebase Storage for site media
    let currentSiteMediaBtn = null;
    document.querySelectorAll('.upload-site-media').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentSiteMediaBtn = e.currentTarget;
            siteFileInput.click();
        });
    });

    siteFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file || !currentSiteMediaBtn) return;

        const targetId = currentSiteMediaBtn.getAttribute('data-target');
        const targetInput = document.getElementById(targetId);
        const originalText = currentSiteMediaBtn.textContent;

        try {
            currentSiteMediaBtn.textContent = 'En cours...';
            currentSiteMediaBtn.disabled = true;

            const url = await DataService.uploadFile(file, 'site');
            targetInput.value = url;

            currentSiteMediaBtn.textContent = originalText;
            currentSiteMediaBtn.disabled = false;
        } catch (error) {
            console.error("Site media upload failed", error);
            alert("Erreur lors du téléchargement du média.");
            currentSiteMediaBtn.textContent = originalText;
            currentSiteMediaBtn.disabled = false;
        }
    });

    // ==========================================
    // QR CODE MOBILE ACCESS
    // ==========================================
    const qrModal = document.getElementById('qr-modal');
    const showQrBtn = document.getElementById('show-qr-btn');
    const closeQrBtn = document.getElementById('close-qr-btn');
    const qrCodeImg = document.getElementById('qr-code-img');
    const copyUrlBtn = document.getElementById('copy-url-btn');

    if (showQrBtn && qrModal) {
        showQrBtn.addEventListener('click', () => {
            playSound('success');

            let targetUrl = window.location.href;

            // Détecter si on est en local (file://) ou via un vrai serveur
            if (window.location.protocol === 'file:' || window.location.hostname === 'localhost') {
                // Proposer l'URL du site principal ou demander à l'admin de la renseigner
                const siteUrl = document.getElementById('qr-site-url');
                if (siteUrl && siteUrl.value.trim()) {
                    targetUrl = siteUrl.value.trim();
                } else {
                    qrCodeImg.src = '';
                    qrCodeImg.style.display = 'none';
                    document.getElementById('qr-local-notice').style.display = 'block';
                    qrModal.classList.add('active');
                    return;
                }
            }

            document.getElementById('qr-local-notice').style.display = 'none';
            qrCodeImg.style.display = 'block';
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(targetUrl)}&margin=10&bgcolor=ffffff&color=1a0a14`;
            qrCodeImg.src = qrApiUrl;
            qrModal.classList.add('active');

            // Mettre à jour le bouton "Copier"
            if (copyUrlBtn) copyUrlBtn.dataset.url = targetUrl;
        });
    }

    if (closeQrBtn) {
        closeQrBtn.addEventListener('click', () => {
            qrModal.classList.remove('active');
        });
    }

    if (copyUrlBtn) {
        copyUrlBtn.addEventListener('click', () => {
            const urlToCopy = copyUrlBtn.dataset.url || window.location.href;
            navigator.clipboard.writeText(urlToCopy);
            copyUrlBtn.textContent = 'Copié !';
            setTimeout(() => { copyUrlBtn.textContent = "Copier le lien d'accès"; }, 2000);
        });
    }

    // Générer le QR depuis le champ de saisie manuel 
    const generateManualQrBtn = document.getElementById('generate-manual-qr-btn');
    if (generateManualQrBtn) {
        generateManualQrBtn.addEventListener('click', () => {
            const siteUrl = document.getElementById('qr-site-url');
            const url = siteUrl && siteUrl.value.trim();
            if (!url) { alert('Veuillez saisir une URL valide.'); return; }
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}&margin=10&bgcolor=ffffff&color=1a0a14`;
            qrCodeImg.src = qrApiUrl;
            qrCodeImg.style.display = 'block';
            document.getElementById('qr-local-notice').style.display = 'none';
            if (copyUrlBtn) copyUrlBtn.dataset.url = url;
        });
    }

    // ==========================================
    // IA CONVERSATIONS MODULE
    // ==========================================

    const refreshChatsBtn = document.getElementById('refresh-chats-btn');
    if (refreshChatsBtn) {
        refreshChatsBtn.addEventListener('click', loadConversations);
    }

    async function loadConversations() {
        if (!chatSessionsBody) return;
        try {
            chatSessionsBody.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--grey-text);">Chargement...</div>';
            const sessions = await DataService.getConversations();

            if (sessions.length === 0) {
                chatSessionsBody.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--grey-text);">Aucune conversation.</div>';
                return;
            }

            chatSessionsBody.innerHTML = '';
            sessions.forEach(session => {
                const date = session.lastUpdate ? new Date(session.lastUpdate.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Récemment';
                const div = document.createElement('div');
                div.className = 'chat-session-item';
                div.style = 'padding: 1.2rem; border-bottom: 1px solid var(--grey); cursor: pointer; transition: background 0.2s;';
                div.innerHTML = `
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem;">
                        <span style="font-weight: 700; color: var(--black); font-size: 0.85rem;">Client #${session.id.substr(-4)}</span>
                        <span style="font-size: 0.7rem; color: var(--pink);">${date}</span>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--grey-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${session.lastMessage || '...'}
                    </div>
                `;

                div.addEventListener('click', () => {
                    document.querySelectorAll('.chat-session-item').forEach(el => el.style.background = 'transparent');
                    div.style.background = 'var(--pink-pale)';
                    loadConversationDetails(session.id);
                });

                chatSessionsBody.appendChild(div);
            });
        } catch (error) {
            console.error("Error loading conversations", error);
        }
    }

    async function loadConversationDetails(sessionId) {
        if (!chatViewerBody) return;
        try {
            chatViewerHeader.innerHTML = `<span style="color:var(--pink);">Conversation :</span> #${sessionId.substr(-4)}`;
            chatViewerBody.innerHTML = '<div style="margin: auto; text-align: center; color: var(--grey-text);">Chargement de l\'historique...</div>';

            const messages = await DataService.getConversationMessages(sessionId);

            chatViewerBody.innerHTML = '';
            messages.forEach(msg => {
                const div = document.createElement('div');
                const isBot = msg.role === 'assistant';

                div.style = `
                    max-width: 80%;
                    padding: 0.8rem 1rem;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    line-height: 1.4;
                    position: relative;
                    margin-bottom: 1rem;
                    ${isBot ? 'align-self: flex-start; background: #f0f0f0; border-bottom-left-radius: 2px;' : 'align-self: flex-end; background: var(--pink); color: white; border-bottom-right-radius: 2px;'}
                `;

                div.innerHTML = `
                    <div style="font-size: 0.65rem; margin-bottom: 0.3rem; opacity: 0.7; font-weight: 700;">
                        ${isBot ? '🤖 DELICE AI' : '👤 CLIENT'}
                    </div>
                    <div>${msg.content}</div>
                `;
                chatViewerBody.appendChild(div);
            });

            setTimeout(() => {
                chatViewerBody.scrollTo({ top: chatViewerBody.scrollHeight, behavior: 'smooth' });
            }, 100);

        } catch (error) {
            console.error("Error loading chat details", error);
        }
    }

    // ==========================================
    // MODULE GESTION DES ADMINS
    // ==========================================
    let admins = [];

    async function loadAdmins() {
        adminsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chargement...</td></tr>';
        try {
            admins = await DataService.getAllAdmins();
            renderAdminsTable();
        } catch (e) {
            console.error(e);
            adminsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--danger);">Erreur de chargement.</td></tr>';
        }
    }

    function renderAdminsTable() {
        const search = searchAdminsInput.value.toLowerCase();
        adminsTableBody.innerHTML = '';

        const filtered = admins.filter(a =>
            (a.email || '').toLowerCase().includes(search) ||
            (a.role || '').toLowerCase().includes(search)
        );

        if (filtered.length === 0) {
            adminsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--grey-text);">Aucun administrateur trouvé.</td></tr>';
            return;
        }

        filtered.forEach(a => {
            const tr = document.createElement('tr');
            const isSuper = a.role === 'superadmin';

            let permissionsHtml = '';
            if (isSuper) {
                permissionsHtml = '<span class="badge badge--active">Accès Total</span>';
            } else {
                const perms = a.permissions || {};
                const list = [];
                if (perms.products) list.push('Prod.');
                if (perms.orders) list.push('Comm.');
                if (perms.accounting) list.push('Compta.');
                if (perms.knowledge) list.push('IA');
                if (perms.chat) list.push('Chat');
                if (perms.site) list.push('Site');
                permissionsHtml = list.length > 0 ? list.join(', ') : '<span style="color:var(--grey-text);">Aucun</span>';
            }

            tr.innerHTML = `
                <td>
                    <div style="font-weight:600;">${a.email}</div>
                    <small style="color:var(--grey-text); font-size:0.75rem;">UID: ${a.uid || 'N/A'}</small>
                </td>
                <td><span class="badge ${isSuper ? 'badge--active' : ''}">${isSuper ? 'Super-Admin' : 'Admin'}</span></td>
                <td style="font-size:0.85rem;">${permissionsHtml}</td>
                <td style="text-align:right;">
                    <div class="actions">
                        <button class="action-btn edit edit-admin" data-uid="${a.uid}" title="Modifier">
                            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="action-btn delete delete-admin" data-uid="${a.uid}" title="Supprimer" ${isSuper && a.email === (firebase.auth().currentUser ? firebase.auth().currentUser.email : '') ? 'disabled' : ''}>
                            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </td>
            `;
            adminsTableBody.appendChild(tr);
        });

        // Events
        document.querySelectorAll('.edit-admin').forEach(btn => {
            btn.addEventListener('click', () => openAdminModal(btn.dataset.uid));
        });
        document.querySelectorAll('.delete-admin').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Supprimer cet administrateur ?')) {
                    await DataService.deleteAdmin(btn.dataset.uid);
                    loadAdmins();
                }
            });
        });
    }

    function openAdminModal(uid = null) {
        adminForm.reset();
        adminUidInput.value = uid || '';
        adminEmailInput.disabled = !!uid; // Can't change email/uid once set

        if (uid) {
            const admin = admins.find(a => a.uid === uid);
            if (admin) {
                adminModalTitle.textContent = "Modifier l'Administrateur";
                adminEmailInput.value = admin.email || '';
                adminRoleSelect.value = admin.role || 'admin';
                const perms = admin.permissions || {};
                document.getElementById('perm-products').checked = !!perms.products;
                document.getElementById('perm-orders').checked = !!perms.orders;
                document.getElementById('perm-accounting').checked = !!perms.accounting;
                document.getElementById('perm-knowledge').checked = !!perms.knowledge;
                document.getElementById('perm-chat').checked = !!perms.chat;
                document.getElementById('perm-site').checked = !!perms.site;
                togglePermissionsVisibility();
            }
        } else {
            adminModalTitle.textContent = "Ajouter un Administrateur";
            togglePermissionsVisibility();
        }
        adminModal.classList.add('active');
    }

    function togglePermissionsVisibility() {
        permissionsContainer.style.display = adminRoleSelect.value === 'superadmin' ? 'none' : 'block';
    }

    adminRoleSelect.addEventListener('change', togglePermissionsVisibility);

    function closeAdminModalFn() {
        adminModal.classList.remove('active');
    }

    closeAdminModal.addEventListener('click', closeAdminModalFn);
    cancelAdminModal.addEventListener('click', closeAdminModalFn);
    addAdminBtn.addEventListener('click', () => openAdminModal());

    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const uid = adminUidInput.value;
        const email = adminEmailInput.value.trim().toLowerCase();
        const role = adminRoleSelect.value;

        const permissions = {
            products: document.getElementById('perm-products').checked,
            orders: document.getElementById('perm-orders').checked,
            accounting: document.getElementById('perm-accounting').checked,
            knowledge: document.getElementById('perm-knowledge').checked,
            chat: document.getElementById('perm-chat').checked,
            site: document.getElementById('perm-site').checked
        };

        try {
            const btn = document.getElementById('save-admin-btn');
            btn.disabled = true;
            btn.textContent = 'Enregistrement...';

            // Pre-authorization by email is now supported natively by saveAdmin in firebase-config.js
            await DataService.saveAdmin({
                uid: uid || null,
                email,
                role,
                permissions: role === 'superadmin' ? { all: true } : permissions
            });

            playSound('success');
            closeAdminModalFn();
            loadAdmins();
        } catch (err) {
            showToast("Erreur: " + err.message, "error");
        } finally {
            const btn = document.getElementById('save-admin-btn');
            btn.disabled = false;
            btn.textContent = 'Enregistrer';
        }
    });

    searchAdminsInput.addEventListener('input', renderAdminsTable);

    const cleanupAdminsBtn = document.getElementById('cleanup-admins-btn');
    if (cleanupAdminsBtn) {
        cleanupAdminsBtn.addEventListener('click', async () => {
            if (!confirm("Voulez-vous supprimer tous les comptes administrateurs qui ne se sont jamais connectés (UID: N/A) ?")) return;

            try {
                cleanupAdminsBtn.disabled = true;
                cleanupAdminsBtn.textContent = 'Nettoyage...';
                const count = await DataService.cleanupPendingAdmins();
                showToast(`${count} compte(s) invalide(s) supprimé(s).`, "success");
                loadAdmins();
            } catch (err) {
                showToast("Erreur lors du nettoyage: " + err.message, "error");
            } finally {
                cleanupAdminsBtn.disabled = false;
                cleanupAdminsBtn.textContent = 'Nettoyer';
            }
        });
    }

    // ==========================================
    // MODULE COMPTABILITE
    // ==========================================

    let allExpenses = [];

    function filterOrdersByPeriod(orderList, period) {
        const now = new Date();
        return orderList.filter(o => {
            if (!o.createdAt) return period === 'all';
            const d = new Date(o.createdAt);
            if (period === 'this_month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
            if (period === 'last_month') { const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1); return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth(); }
            if (period === 'this_year') return d.getFullYear() === now.getFullYear();
            return true;
        });
    }
    function filterExpByPeriod(exps, period) {
        const now = new Date();
        return exps.filter(e => {
            if (!e.date) return period === 'all';
            const d = new Date(e.date);
            if (period === 'this_month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
            if (period === 'last_month') { const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1); return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth(); }
            if (period === 'this_year') return d.getFullYear() === now.getFullYear();
            return true;
        });
    }
    function fmt(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n)); }

    async function loadAccounting() {
        try {
            const [allOrders, expenses] = await Promise.all([DataService.getOrders(), DataService.getExpenses()]);
            allExpenses = expenses;
            const period = document.getElementById('acct-period')?.value || 'this_month';
            const filtered = filterOrdersByPeriod(allOrders, period);
            const completed = filtered.filter(o => o.status === 'completed');
            const filtExps = filterExpByPeriod(expenses, period);

            const totalRevenue = completed.reduce((s, o) => s + (o.totalAmount || 0), 0);
            const totalExpenses = filtExps.reduce((s, e) => s + (e.amount || 0), 0);
            const avgBasket = completed.length > 0 ? totalRevenue / completed.length : 0;
            const profit = totalRevenue - totalExpenses;

            document.getElementById('kpi-revenue').textContent = fmt(totalRevenue) + ' FCFA';
            document.getElementById('kpi-orders').textContent = completed.length;
            document.getElementById('kpi-avg').textContent = fmt(avgBasket);
            document.getElementById('kpi-expenses').textContent = fmt(totalExpenses) + ' FCFA';
            const profitEl = document.getElementById('kpi-profit');
            profitEl.textContent = fmt(profit) + ' FCFA';
            profitEl.style.color = profit >= 0 ? '#10B981' : '#EF4444';

            const MONTHS = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
            const monthlyData = {};
            allOrders.filter(o => o.status === 'completed').forEach(o => {
                if (!o.createdAt) return;
                const d = new Date(o.createdAt);
                const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
                if (!monthlyData[key]) monthlyData[key] = { label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, count: 0, revenue: 0 };
                monthlyData[key].count++; monthlyData[key].revenue += (o.totalAmount || 0);
            });

            const tbody = document.getElementById('acct-monthly-body');
            const sortedKeys = Object.keys(monthlyData).sort().reverse();
            if (tbody) {
                tbody.innerHTML = sortedKeys.length === 0
                    ? '<tr><td colspan="3" style="text-align:center; color:var(--grey-text);">Aucune commande terminée.</td></tr>'
                    : sortedKeys.map(k => `<tr><td>${monthlyData[k].label}</td><td>${monthlyData[k].count}</td><td><strong>${fmt(monthlyData[k].revenue)}</strong></td></tr>`).join('');
            }
            renderExpenseList(expenses);
        } catch (err) { console.error('Erreur comptabilité:', err); }
    }

    function renderExpenseList(expenses) {
        const list = document.getElementById('expense-list');
        if (!list) return;
        if (!expenses.length) { list.innerHTML = '<li style="color:var(--grey-text); font-size:0.85rem;">Aucune dépense enregistrée.</li>'; return; }
        list.innerHTML = expenses.slice(0, 20).map(e => `
            <li style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem 0.7rem; background:#fdf6f9; border-radius:8px; font-size:0.87rem;">
                <span><strong>${e.label}</strong><br><span style="color:var(--grey-text); font-size:0.8rem;">${e.date || '—'}</span></span>
                <span style="display:flex; align-items:center; gap:0.5rem;">
                    <strong style="color:#F59E0B;">${fmt(e.amount)} FCFA</strong>
                    <button class="action-btn delete delete-expense" data-id="${e.id}" title="Supprimer" style="width:28px;height:28px;">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </span>
            </li>`).join('');
        list.querySelectorAll('.delete-expense').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm('Supprimer cette dépense ?')) { await DataService.deleteExpense(id); playSound('success'); loadAccounting(); }
            });
        });
    }

    const acctPeriod = document.getElementById('acct-period');
    if (acctPeriod) acctPeriod.addEventListener('change', loadAccounting);
    const acctRefreshBtn = document.getElementById('acct-refresh-btn');
    if (acctRefreshBtn) acctRefreshBtn.addEventListener('click', loadAccounting);

    const addExpenseBtn = document.getElementById('add-expense-btn');
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', async () => {
            const label = document.getElementById('expense-label').value.trim();
            const amount = parseFloat(document.getElementById('expense-amount').value);
            const date = document.getElementById('expense-date').value;
            if (!label || isNaN(amount) || amount <= 0) { alert('Veuillez renseigner l\'intitulé et un montant valide.'); return; }
            addExpenseBtn.disabled = true; addExpenseBtn.textContent = 'Enregistrement...';
            try {
                await DataService.addExpense({ label, amount, date: date || new Date().toISOString().split('T')[0] });
                playSound('success');
                document.getElementById('expense-label').value = '';
                document.getElementById('expense-amount').value = '';
                document.getElementById('expense-date').value = '';
                loadAccounting();
            } catch (err) { alert('Erreur: ' + err.message); }
            finally { addExpenseBtn.disabled = false; addExpenseBtn.textContent = '+ Ajouter la dépense'; }
        });
    }

    const acctExportBtn = document.getElementById('acct-export-btn');
    if (acctExportBtn) {
        acctExportBtn.addEventListener('click', async () => {
            const allOrders = await DataService.getOrders();
            const completed = allOrders.filter(o => o.status === 'completed');
            const expenses = await DataService.getExpenses();
            let csv = 'Type,Date,Libellé,Montant (FCFA)\n';
            completed.forEach(o => {
                const d = o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : 'Inconnue';
                const items = (o.items || []).map(i => `${i.quantity}x ${i.name}`).join(' + ');
                csv += `Vente,${d},"${items}",${o.totalAmount || 0}\n`;
            });
            expenses.forEach(e => { csv += `Dépense,${e.date || ''},"${e.label}",-${e.amount || 0}\n`; });
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `comptabilite_delice_${new Date().toISOString().split('T')[0]}.csv`; a.click();
            URL.revokeObjectURL(url);
            playSound('success');
        });
    }

});
