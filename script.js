// TELEGRAM Notification via Worker Proxy (Sécurisé)
const TELEGRAM_CONFIG = {
  chatIds: []
};

// --- Helper: Google Drive Direct Link Converter ---
function convertToDirectDriveLink(url) {
  if (!url) return url;
  // Support standard /file/d/ID links
  const driveRegex = /\/file\/d\/([^\/]+)/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  // Support uc?id=ID and open?id=ID links
  const idRegex = /[?&]id=([^&]+)/;
  const idMatch = url.match(idRegex);
  if (url.includes('drive.google.com') && idMatch && idMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }
  return url;
}

async function sendTelegramNotification(message) {
  try {
    // Dynamically fetch chat IDs from site settings so it works without redeploying
    let chatIds = [];
    try {
      const settings = await DataService.getSiteSettings();
      if (settings && settings.telegramChatIds) {
        chatIds = settings.telegramChatIds;
      }
    } catch (e) {
      console.warn("Could not fetch dynamic Telegram IDs, falling back to ENV only.", e);
    }

    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, chatIds })
    });
  } catch (e) {
    console.error("Telegram notification error", e);
  }
}

// === PRELOADER ===
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add('hidden');
      setTimeout(() => preloader.remove(), 1000);
    }, 100);
  }
});

// Safety timeout: Hide preloader even if 'load' event fails to fire
setTimeout(() => {
  const preloader = document.getElementById('preloader');
  if (preloader && !preloader.classList.contains('hidden')) {
    console.log("Preloader safety timeout triggered.");
    preloader.classList.add('hidden');
    setTimeout(() => preloader.remove(), 1000);
  }
}, 4000);

// === SCROLL PROGRESS & NAV scroll effect ===
const nav = document.getElementById('nav');
const progressBar = document.getElementById('scroll-progress');

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = (scrollTop / docHeight) * 100;

  if (progressBar) progressBar.style.width = scrollPercent + '%';
  if (nav) nav.classList.toggle('scrolled', scrollTop > 40);
});

// === Mobile menu ===
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobile-menu');
const mobileClose = document.getElementById('mobile-close');

burger.addEventListener('click', () => mobileMenu.classList.add('open'));
mobileClose.addEventListener('click', () => mobileMenu.classList.remove('open'));

function closeMobile() {
  mobileMenu.classList.remove('open');
}

// === Premium Scroll Reveals ===
const revealElements = document.querySelectorAll('.reveal-clip, .reveal-stagger-parent');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-revealed');
      revealObserver.unobserve(entry.target); // Only reveal once for a premium feel
    }
  });
}, { threshold: 0.01, rootMargin: '0px 0px 50px 0px' });

revealElements.forEach(el => revealObserver.observe(el));

// Fallback: If elements are still not revealed after a short delay (e.g. browser bug), force them visible
setTimeout(() => {
  revealElements.forEach(el => {
    if (!el.classList.contains('is-revealed')) {
      el.classList.add('is-revealed');
      el.style.transitionDuration = '0.5s'; // Faster fallback reveal
    }
  });
}, 2500);

// === Stats counter animation ===
const statsNums = document.querySelectorAll('.stats__num');
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const plus = el.querySelector('.stats__plus');
      const suffix = plus ? plus.textContent : '';
      const raw = el.textContent.replace(suffix, '').trim();
      const target = parseFloat(raw);
      let start = 0;
      const duration = 1400;
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        // Re-inject suffix span
        el.innerHTML = Math.round(eased * target) + `<span class="stats__plus">${suffix}</span>`;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      statsObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

statsNums.forEach(n => statsObserver.observe(n));

// === Interactivity State & Utils ===
let isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
const lerp = (start, end, factor) => start + (end - start) * factor;

// === Custom Cursor Implementation ===
function initCustomCursor() {
  if (isTouchDevice) return; // Don't run custom cursor on mobile/touch

  const cursor = document.querySelector('.custom-cursor');
  const follower = document.querySelector('.cursor-follower');
  if (!cursor || !follower) return;

  document.body.classList.add('has-custom-cursor');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;
  let followerX = mouseX;
  let followerY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Handle Hover States for the cursor
  const interactiveElSelector = 'a, button, .hotspot, [data-magnetic]';

  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest(interactiveElSelector);
    if (target) {
      cursor.classList.add('hover');
      follower.classList.add('hover');
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest(interactiveElSelector);
    if (target) {
      cursor.classList.remove('hover');
      follower.classList.remove('hover');
    }
  });

  function renderCursor() {
    // Main dot follows instantly
    cursorX = lerp(cursorX, mouseX, 0.4);
    cursorY = lerp(cursorY, mouseY, 0.4);

    // Follower has a lag/spring effect
    followerX = lerp(followerX, mouseX, 0.15);
    followerY = lerp(followerY, mouseY, 0.15);

    cursor.style.transform = `translate(${cursorX - 4}px, ${cursorY - 4}px)`; // offset by half width
    follower.style.transform = `translate(${followerX - 20}px, ${followerY - 20}px)`;

    requestAnimationFrame(renderCursor);
  }

  renderCursor();

  // === Magnetic Buttons Validation within Cursor Context ===
  // We initialize magnetic buttons here because they share the mouse move logic
  initMagneticButtons();
}

// === Magnetic Buttons Implementation ===
function initMagneticButtons() {
  if (isTouchDevice) return;

  const magneticEls = document.querySelectorAll('[data-magnetic]');

  magneticEls.forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const h = rect.width / 2;
      const v = rect.height / 2;

      // Calculate cursor position relative to element center
      const x = e.clientX - rect.left - h;
      const y = e.clientY - rect.top - v;

      // Apply a subtle pull effect text/icon inside if it exists
      const pullFactor = 0.3;
      el.style.transform = `translate(${x * pullFactor}px, ${y * pullFactor}px)`;
    });

    el.addEventListener('mouseleave', () => {
      // Reset position with a subtle spring back (handled by existing css transitions if present, or we add one)
      el.style.transform = `translate(0px, 0px)`;
    });
  });
}

// === Smooth hero title entrance ===
document.addEventListener('DOMContentLoaded', () => {
  initCustomCursor();

  const heroContent = document.querySelector('.hero__content');
  if (heroContent) {
    // Add base reveal class
    heroContent.classList.add('reveal-clip');

    // Trigger reveal shortly after load
    setTimeout(() => {
      heroContent.classList.add('is-revealed');
    }, 150);
  }

  // Initialize all features
  initHotspots();
  initTiltEffect();
  initVoiceOver();
  loadSiteSettings();
  init3DModelColor();
});

// === 3D MODEL COLOR & TEXTURE UPDATE ===
function init3DModelColor() {
  const modelViewer = document.getElementById('hero-3d-model');
  if (!modelViewer) return;

  const updateMaterials = () => {
    const model = modelViewer.model;
    if (!model || !model.materials) return;

    console.log("Updating 3D Model Materials...");

    // Golden Cake Color (RGBA)
    const cakeColor = [0.92, 0.72, 0.45, 1.0]; // Warm golden-brown

    model.materials.forEach(material => {
      // 1. Update Base Color
      if (material.pbrMetallicRoughness) {
        material.pbrMetallicRoughness.setBaseColorFactor(cakeColor);

        // 2. Adjust texture for "moist/soft" look (Matte)
        // High roughness = matte (less shiny)
        material.pbrMetallicRoughness.setRoughnessFactor(0.85);
        // Low metallic = non-reflective
        material.pbrMetallicRoughness.setMetallicFactor(0.0);
      }
    });
  };

  // If already loaded
  if (modelViewer.loaded) {
    updateMaterials();
  } else {
    // Wait for load
    modelViewer.addEventListener('load', updateMaterials);
  }
}

// === AI VOICE-OVER (STABLE MP3 PRIORITY) ===
function initVoiceOver() {
  const welcomeMessage = "Bienvenue chez Délice Cake. L'art de la pâtisserie artisanale s'invite chez vous. Succombez à une expérience de douceur et de raffinement.";

  const speakSystemTTS = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(welcomeMessage);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleInteraction = () => {
    // 1. Try playing the MP3 file
    const audio = new Audio('welcome.mp3');

    audio.play()
      .then(() => {
        console.log("SUCCESS: Welcome MP3 playing.");
      })
      .catch(err => {
        // Silencing NotAllowedError as we have a TTS fallback
        if (err.name !== 'NotAllowedError') {
          console.warn("Welcome MP3 playback issue:", err.message);
        }
        speakSystemTTS();
      });

    // Remove listeners
    document.removeEventListener('click', handleInteraction);
    document.removeEventListener('touchstart', handleInteraction);
  };

  document.addEventListener('click', handleInteraction, { once: true });
  document.addEventListener('touchstart', handleInteraction, { once: true });
}

// === IMAGE HOTSPOTS INTERACTION ===
function initHotspots() {
  const hotspots = document.querySelectorAll('.hotspot');
  if (!hotspots.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('active');
          setTimeout(() => entry.target.classList.remove('active'), 2500);
        }, 500);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  hotspots.forEach(h => observer.observe(h));
}

// === CARD TILT EFFECT ===
function initTiltEffect() {
  if (isTouchDevice) return;
  const cards = document.querySelectorAll('.produits__card, .marquee-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
  });
}



// ======= LENIS SMOOTH SCROLL =======
if (typeof Lenis !== 'undefined') {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  });

  function rafLenis(time) {
    lenis.raf(time);
    requestAnimationFrame(rafLenis);
  }

  requestAnimationFrame(rafLenis);

  // --- Parallax Effects via Lenis ---
  const ring1 = document.querySelector('.hero__ring--1');
  const ring2 = document.querySelector('.hero__ring--2');

  // Select all custom parallax elements
  const parallaxElements = document.querySelectorAll('[data-parallax]');

  lenis.on('scroll', (e) => {
    if (isTouchDevice) return; // Keep mobile simple (optional: you can remove this to allow parallax on mobile if it performs well)
    const scrollY = e.scroll;

    // Parallax the hero rings
    if (scrollY < window.innerHeight) {
      if (ring1) ring1.style.transform = `translateY(${scrollY * 0.25}px)`;
      if (ring2) ring2.style.transform = `translateY(${scrollY * 0.1}px) scale(0.9)`;
    }

    // Global Parallax for any element
    parallaxElements.forEach(el => {
      // Calculate element's position relative to the viewport
      const rect = el.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;

      // Calculate distance from center of screen
      const distanceFromCenter = elementCenter - viewportCenter;

      // Get speed factor from data attribute (e.g., 0.1 for slow down, -0.1 for slow up)
      const speed = parseFloat(el.getAttribute('data-parallax')) || 0.1;

      // Apply transform (we use y-axis movement. If element is below center, it moves up faster/slower depending on speed)
      // Multiply by speed. A subtle speed like 0.1 to 0.15 is best for immersion.
      const yOffset = distanceFromCenter * speed;

      el.style.transform = `translate3d(0, ${yOffset}px, 0)`;
    });
  });

  // Bind Lenis to anchor links for smooth scrolling to sections
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        lenis.scrollTo(target, { offset: -80 }); // Offset for fixed nav
        // Close mobile menu if open
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu && mobileMenu.classList.contains('open')) {
          mobileMenu.classList.remove('open');
        }
      }
    });
  });
}

// ======= DYNAMIC SITE SETTINGS =======
async function loadSiteSettings() {
  try {
    if (typeof DataService === 'undefined') return;
    let settings = await DataService.getSiteSettings();
    if (!settings) settings = DEFAULT_SITE_SETTINGS;
    if (!settings) return;

    // 1. Hero Section
    if (settings.heroTitle) {
      const heroTitle = document.querySelector('.hero__title');
      if (heroTitle) heroTitle.innerHTML = settings.heroTitle.replace(/\n/g, '<br>');
    }
    if (settings.heroSubtitle) {
      const heroSubtitle = document.querySelector('.hero__subtitle');
      if (heroSubtitle) heroSubtitle.innerHTML = settings.heroSubtitle.replace(/\n/g, '<br>');
    }
    if (settings.heroBadge) {
      const heroBadge = document.querySelector('.hero__badge');
      if (heroBadge) heroBadge.textContent = settings.heroBadge;
    }
    if (settings.heroImage) {
      const heroImg = document.getElementById('hero-cake-img');
      if (heroImg) heroImg.src = convertToDirectDriveLink(settings.heroImage);
    }

    // 2. Marquee Section
    if (settings.marqueeItems && settings.marqueeItems.length > 0) {
      const stripTrack = document.querySelector('.strip__track');
      if (stripTrack) {
        let marqueeHtml = '';
        // Create a long enough string to loop
        const items = settings.marqueeItems;
        const repeatedItems = [...items, ...items, ...items];
        repeatedItems.forEach(text => {
          marqueeHtml += `<span>${text}</span><svg class="strip-sep" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" fill="#fff" stroke="#fff" stroke-width="1.5" stroke-linejoin="round" /></svg>`;
        });
        stripTrack.innerHTML = marqueeHtml;
      }
    }

    // 3. Saveurs Section
    if (settings.saveursTitle) {
      const saveursTitle = document.querySelector('.saveurs .section-title');
      if (saveursTitle) saveursTitle.innerHTML = settings.saveursTitle;
    }
    if (settings.saveursDesc) {
      const saveursHeader = document.querySelector('.saveurs__header');
      if (saveursHeader) {
        let descEl = saveursHeader.querySelector('.section-sub');
        if (!descEl) {
          descEl = document.createElement('p');
          descEl.className = 'section-sub';
          saveursHeader.appendChild(descEl);
        }
        descEl.textContent = settings.saveursDesc;
      }
    }

    // 4. Contact & WhatsApp
    if (settings.whatsappNum) {
      const waLinks = document.querySelectorAll('a[href^="https://wa.me"]');
      waLinks.forEach(link => {
        const currentMsg = link.href.split('text=')[1] || "";
        link.href = `https://wa.me/${settings.whatsappNum}${currentMsg ? '?text=' + currentMsg : ''}`;
      });
      // also update footer/contact text if it contains the number
      const contactBtn = document.getElementById('contact-whatsapp-btn');
      if (contactBtn && contactBtn.innerHTML.includes('56 88 89 72')) {
        contactBtn.innerHTML = contactBtn.innerHTML.replace('56 88 89 72', settings.whatsappNum);
      }
    }
    if (settings.ctaText) {
      const ctaBtns = [
        document.getElementById('nav-cta'),
        document.getElementById('hero-order-btn'),
        document.getElementById('product-order-btn'),
        document.getElementById('saveurs-order-btn'),
        document.getElementById('submit-order-btn')
      ];
      ctaBtns.forEach(btn => {
        if (btn) btn.textContent = settings.ctaText;
      });
    }

    // 5. Video Implementation
    if (settings.videoUrl) {
      const heroVisual = document.querySelector('.hero__visual');
      if (heroVisual) {
        // Remove existing video if any
        const existingVideo = heroVisual.querySelector('video');
        if (existingVideo) existingVideo.remove();

        const video = document.createElement('video');
        video.src = settings.videoUrl;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        heroVisual.appendChild(video);
      }
    }

    // 6. Telegram Notifications
    if (settings.telegramChatIds && Array.isArray(settings.telegramChatIds)) {
      TELEGRAM_CONFIG.chatIds = settings.telegramChatIds;
    }

  } catch (error) {
    console.error("Error loading site settings:", error);
  }
}

// ======= DYNAMIC PRODUCTS & CUSTOM ORDER MODAL =======
document.addEventListener('DOMContentLoaded', () => {
  // Load products dynamically before initializing the modal
  loadDynamicProducts();
});

async function loadDynamicProducts() {
  try {
    if (typeof DataService !== 'undefined') {
      const products = await DataService.getProducts();
      const activeProducts = products.filter(p => p.status === 'active');

      // 1. Populate Marquee
      const marqueeTrack = document.getElementById('dynamic-marquee-track');
      if (marqueeTrack && activeProducts.length > 0) {
        let marqueeHtml = '';

        // Helper to optimize Cloudinary URLs on the fly
        const getOptimizedUrl = (url, width = 300) => {
          if (!url) return 'product_cupcake.webp';

          // First, convert Google Drive links if necessary
          const directUrl = convertToDirectDriveLink(url);

          if (directUrl.includes('cloudinary.com') && !directUrl.includes('/upload/f_auto')) {
            // Insert optimization parameters after /upload/
            return directUrl.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
          }
          return directUrl;
        };

        // --- 0. Populate Main (Featured) Product ---
        const featuredProduct = activeProducts.find(p => p.isFeatured);
        const mainProductImg = document.querySelector('#main-product img');
        const mainProductName = document.querySelector('.produits__name');
        const mainProductDesc = document.querySelector('.produits__desc');

        if (featuredProduct && mainProductImg) {
          mainProductImg.src = getOptimizedUrl(featuredProduct.image, 600);
          mainProductImg.alt = featuredProduct.name;
          if (mainProductName) mainProductName.textContent = featuredProduct.name;
          if (mainProductDesc) mainProductDesc.textContent = featuredProduct.desc || '';
        }

        // Need 2 groups for infinite CSS loop
        for (let i = 0; i < 2; i++) {
          marqueeHtml += `<div class="products-marquee__group" ${i === 1 ? 'aria-hidden="true"' : ''}>`;
          // Exclude the main featured product from the marquee to avoid redundancy if desired
          const marqueeProducts = activeProducts.filter(p => !p.isFeatured);
          let toShow = marqueeProducts.length ? marqueeProducts : activeProducts;

          // Si on a très peu de produits (ex: 1), on le répète pour que le bandeau
          // soit bien rempli. Le CSS a besoin de 2 groupes pour l'animation continue,
          // mais si le groupe est trop petit, on voit la coupure.
          const minItems = 4;
          if (toShow.length > 0 && toShow.length < minItems) {
            const original = [...toShow];
            while (toShow.length < minItems) {
              toShow = toShow.concat(original);
            }
          }

          toShow.forEach(p => {
            const imgUrl = getOptimizedUrl(p.image, 250);
            marqueeHtml += `
                            <div class="marquee-card">
                                <div class="marquee-card__img-ph">
                                    <img src="${imgUrl.replace(/"/g, '&quot;').replace(/>/g, '&gt;')}" 
                                        alt="${p.name.replace(/"/g, '&quot;')}" loading="lazy" decoding="async"
                                        width="120" height="120"
                                        onerror="this.src='product_cupcake.webp'; this.onerror=null;"
                                        style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />
                                </div>
                                <h3 class="marquee-card__title">${p.name}</h3>
                                <p class="marquee-card__desc">${p.desc || ''}</p>
                            </div>
                        `;
          });
          marqueeHtml += `</div>`;
        }
        marqueeTrack.innerHTML = marqueeHtml;
      }

      // 2. Populate Order Form
      const orderProductsContainer = document.getElementById('dynamic-order-products');
      if (orderProductsContainer && activeProducts.length > 0) {
        let orderHtml = '';
        activeProducts.forEach((p, index) => {
          const isCustom = p.isCustom || p.name.toLowerCase().includes('événement') || p.name.toLowerCase().includes('sur mesure');
          if (isCustom) {
            orderHtml += `
                            <div class="product-item" style="flex-wrap: wrap;">
                                <label class="product-checkbox" style="width: 100%; margin-bottom: 0.5rem;">
                                    <input type="checkbox" name="product" value="${p.name}" class="prod-check"
                                        data-id="prod-${index}" data-price="${p.price}">
                                    <span class="checkmark"></span>
                                    <span class="prod-name">${p.name}</span>
                                    <span class="prod-price">sur mesure</span>
                                </label>
                                <div class="prod-options" id="options-prod-${index}"
                                    style="display: none; width: 100%; padding-left: 28px; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                    <select id="select-prod-${index}" class="form-input"
                                        style="padding: 0.4rem 0.5rem; height: auto; width: auto; flex-grow: 1;">
                                        <option value="5000">5 000 FCFA</option>
                                        <option value="10000">10 000 FCFA</option>
                                        <option value="15000">15 000 FCFA</option>
                                        <option value="custom">Saisir le budget</option>
                                    </select>
                                    <input type="number" id="custom-price-prod-${index}" class="form-input" placeholder="FCFA"
                                        style="display: none; padding: 0.4rem 0.5rem; height: auto; width: 100px;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <span style="font-size: 0.9rem;">Qté:</span>
                                        <input type="number" min="1" value="1" class="prod-qty" id="qty-prod-${index}" disabled
                                            style="margin:0;">
                                    </div>
                                </div>
                            </div>
                        `;
          } else {
            orderHtml += `
                            <div class="product-item">
                                <label class="product-checkbox">
                                    <input type="checkbox" name="product" value="${p.name}" class="prod-check"
                                        data-id="prod-${index}" data-price="${p.price}">
                                    <span class="checkmark"></span>
                                    <span class="prod-name">${p.name}</span>
                                    <span class="prod-price">${p.price} FCFA</span>
                                </label>
                                <input type="number" min="1" value="1" class="prod-qty" id="qty-prod-${index}" disabled>
                            </div>
                        `;
          }
        });
        orderProductsContainer.innerHTML = orderHtml;
      }
    }
  } catch (err) {
    console.error("Erreur de chargement des produits dynamiques :", err);
  } finally {
    initOrderModal();
  }
}

function initOrderModal() {
  const modal = document.getElementById('order-modal');
  if (!modal) return;
  const closeBtn = document.getElementById('modal-close');
  const orderForm = document.getElementById('order-form');
  const formError = document.getElementById('form-error');

  // Specific Order buttons on the page
  const orderButtons = [
    document.getElementById('saveurs-order-btn'),
    document.getElementById('contact-whatsapp-btn'),
    document.getElementById('hero-order-btn'),
    document.getElementById('product-order-btn'),
    ...document.querySelectorAll('a[href^="https://wa.me"]')
  ].filter(btn => btn !== null);

  const checkboxes = document.querySelectorAll('.prod-check');

  // Open modal
  orderButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Log interest to Admin (Lead)
      if (typeof DataService !== 'undefined' && DataService.logLead) {
        DataService.logLead(btn.id || btn.textContent.trim());
      }

      // Allow CTA buttons to do both: scroll if they are anchor links, or just open modal
      if (!btn.getAttribute('href') || btn.getAttribute('href').startsWith('https://wa.me')) {
        e.preventDefault();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Stop background scrolling
      }
    });
  });

  // Close modal
  const closeModal = () => {
    modal.classList.remove('active');
    formError.style.display = 'none';
    document.body.style.overflow = '';
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Toggle quantity inputs based on checkbox selection
  let leadSentInSession = false;
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const prodId = e.target.getAttribute('data-id');
      const qtyInput = document.getElementById(`qty-${prodId}`);
      const productItem = e.target.closest('.product-item');

      if (e.target.checked) {
        if (qtyInput) qtyInput.disabled = false;
        productItem.classList.add('selected');
        const optionsDiv = document.getElementById(`options-${prodId}`);
        if (optionsDiv) optionsDiv.style.display = 'flex';

        // Notify via Telegram only for the first selection of the session
        if (!leadSentInSession) {
          sendTelegramNotification(`👀 <b>Intérêt Produit !</b>\nUn client a commencé sa sélection avec : <i>${e.target.value}</i>`);
          leadSentInSession = true;
        }
      } else {
        if (qtyInput) {
          qtyInput.disabled = true;
          qtyInput.value = 1;
        }
        productItem.classList.remove('selected');
        const optionsDiv = document.getElementById(`options-${prodId}`);
        if (optionsDiv) optionsDiv.style.display = 'none';
      }
      calculateTotal();
    });
  });

  // Also calculate total when a quantity input changes
  const qtyInputs = document.querySelectorAll('.prod-qty');
  qtyInputs.forEach(input => {
    input.addEventListener('input', calculateTotal);
  });

  // Calculate Total Amount
  const totalDisplay = document.getElementById('order-total');
  function calculateTotal() {
    let total = 0;
    checkboxes.forEach(checkbox => {
      if (checkbox.checked) {
        const prodId = checkbox.getAttribute('data-id');
        let price = parseInt(checkbox.getAttribute('data-price')) || 0;

        // Check if there's a specific select for this product
        const selectEl = document.getElementById(`select-${prodId}`);
        if (selectEl) {
          if (selectEl.value === 'custom') {
            const customInput = document.getElementById(`custom-price-${prodId}`);
            price = parseInt(customInput.value) || 0;
          } else {
            price = parseInt(selectEl.value) || 0;
          }
        }

        const qtyInput = document.getElementById(`qty-${prodId}`);
        const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;
        total += price * qty;
      }
    });

    // Format total with spaces for thousands (e.g., 5 000)
    if (totalDisplay) {
      totalDisplay.textContent = new Intl.NumberFormat('fr-FR').format(total) + ' FCFA';
    }
  }

  // Listen to select and custom price changes
  document.querySelectorAll('select[id^="select-prod-"]').forEach(select => {
    select.addEventListener('change', (e) => {
      const prodId = e.target.id.replace('select-', '');
      const customInput = document.getElementById(`custom-price-${prodId}`);
      if (e.target.value === 'custom') {
        if (customInput) customInput.style.display = 'block';
      } else {
        if (customInput) {
          customInput.style.display = 'none';
          customInput.value = ''; // clear when not custom
        }
      }
      calculateTotal();
    });
  });

  document.querySelectorAll('input[id^="custom-price-prod-"]').forEach(input => {
    input.addEventListener('input', calculateTotal);
  });

  // Handle Form Submission
  if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = orderForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.textContent = 'Envoi en cours...';
        submitBtn.disabled = true;
      }

      try {
        // Gather selected products
        const selectedProducts = [];
        const orderItemsData = []; // For database

        checkboxes.forEach(checkbox => {
          if (checkbox.checked) {
            const prodIdStr = checkbox.getAttribute('data-id');
            const qtyInput = document.getElementById(`qty-${prodIdStr}`);
            const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
            let productText = `${qty}x ${checkbox.value}`;
            let finalPrice = parseInt(checkbox.getAttribute('data-price')) || 0;

            const selectEl = document.getElementById(`select-${prodIdStr}`);
            if (selectEl) {
              if (selectEl.value === 'custom') {
                const customInput = document.getElementById(`custom-price-${prodIdStr}`);
                finalPrice = parseInt(customInput.value) || 0;
              } else {
                finalPrice = parseInt(selectEl.value) || 0;
              }
              productText += ` (Budget: ${new Intl.NumberFormat('fr-FR').format(finalPrice)} FCFA)`;
            }

            selectedProducts.push(`- ` + productText);
            orderItemsData.push({
              name: checkbox.value,
              quantity: qty,
              unitPrice: finalPrice,
              totalPrice: finalPrice * qty
            });
          }
        });

        // Validation
        if (selectedProducts.length === 0) {
          formError.style.display = 'block';
          if (submitBtn) {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
          }
          return;
        }
        formError.style.display = 'none';

        // Gather Note
        const note = document.getElementById('order-note').value.trim();

        // Calculate Total Numeric
        const currentTotalStr = document.getElementById('order-total').textContent;
        const numericTotal = orderItemsData.reduce((sum, item) => sum + item.totalPrice, 0);

        // 1. SAVE TO DATABASE (FIREBASE OR LOCAL)
        let orderId = null;
        if (typeof DataService !== 'undefined' && DataService.saveOrder) {
          orderId = await DataService.saveOrder({
            items: orderItemsData,
            totalAmount: numericTotal,
            note: note,
            status: 'new' // 'new', 'processing', 'completed', 'cancelled'
          });
          // Stocker l'ID pour le suivi
          if (orderId) {
            localStorage.setItem('delice_last_order_id', orderId);
            if (window.refreshOrderTracking) window.refreshOrderTracking();

            // Send Telegram Notification
            const adminLink = window.location.origin + "/admin";
            const messageTelegram = `🍰 <b>NOUVELLE COMMANDE !</b>\n\n` +
              `💰 Total : ${numericTotal.toLocaleString('fr-FR')} FCFA\n` +
              `📝 Note : ${note || 'Aucune'}\n\n` +
              `<a href="${adminLink}">Accéder à l'espace Admin</a>`;
            await sendTelegramNotification(messageTelegram);
          }
        }

        // 2. CONSTRUCT AND OPEN WHATSAPP MESSAGE
        let message = `Bonjour Délice Cake ! 🍰\nJe souhaite passer une commande :\n\n*Mes délices :*\n${selectedProducts.join('\n')}`;

        if (currentTotalStr && currentTotalStr !== '0 FCFA') {
          message += `\n\n*Total estimé :* ${numericTotal.toLocaleString('fr-FR')} FCFA`;
        }

        if (note) {
          message += `\n\n*Personnalisation / Note :*\n${note}`;
        }

        message += `\n\nMerci !`;

        // Encode for URL
        const encodedMessage = encodeURIComponent(message);

        // Use production number as absolute fallback
        const whatsappNum = (typeof DataService !== 'undefined' && DataService.getSiteSettingsSync && DataService.getSiteSettingsSync().whatsappNum) || "22656808872";
        const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encodedMessage}`;

        // Open WhatsApp
        window.open(whatsappUrl, '_blank');

        // Optional: Close modal after sending
        closeModal();
      } catch (error) {
        console.error("Erreur lors de l'envoi de la commande :", error);
        alert("Une erreur est survenue lors de l'enregistrement de votre commande. Veuillez réessayer ou nous contacter directement via WhatsApp.");
      } finally {
        if (submitBtn) {
          submitBtn.textContent = originalBtnText;
          submitBtn.disabled = false;
        }
      }
    });
  }

  initOrderTracking();
}

// === ORDER TRACKING LOGIC ===
let orderSubscription = null;

function initOrderTracking() {
  const trackBtnNav = document.getElementById('track-order-nav');
  const trackBtnMobile = document.getElementById('track-order-mobile');
  const navBadge = document.getElementById('nav-track-badge');
  const mobileBadge = document.getElementById('mobile-track-badge');
  const modal = document.getElementById('track-modal');
  const closeBtn = document.getElementById('track-modal-close');
  const content = document.getElementById('track-content');

  if (!modal || !content) return;

  const STATUS_REELS = {
    'new': { label: 'Reçue', icon: '📝', color: '#E8178A', desc: 'Nous avons bien reçu votre commande.', class: 'status-new' },
    'processing': { label: 'En préparation', icon: '👨‍🍳', color: '#F59E0B', desc: 'Nos pâtissiers préparent vos délices.', class: 'status-processing' },
    'completed': { label: 'Prête / Livrée', icon: '✅', color: '#10B981', desc: 'Votre commande est prête ou en chemin !', class: 'status-completed' },
    'cancelled': { label: 'Annulée', icon: '❌', color: '#EF4444', desc: 'La commande a été annulée.', class: 'status-cancelled' }
  };

  const updateUI = (order) => {
    if (!order) return;

    const status = STATUS_REELS[order.status || 'new'];
    const statusOrder = ['new', 'processing', 'completed'];
    const currentIndex = statusOrder.indexOf(order.status || 'new');

    // Update Badges
    [navBadge, mobileBadge].forEach(badge => {
      if (badge) {
        badge.className = 'track-badge active status-' + (order.status || 'new');
        badge.textContent = status.label;
      }
    });

    // Update Modal Content
    content.innerHTML = `
      <div class="track-status-header" style="background: ${status.color}10; border-color: ${status.color}30;">
        <div style="font-size: 3.5rem; margin-bottom: 0.5rem; filter: drop-shadow(0 4px 10px ${status.color}30);">${status.icon}</div>
        <h4 style="color: ${status.color}; font-size: 1.5rem; margin-bottom: 0.3rem; font-family: var(--font-fancy);">${status.label}</h4>
        <p style="font-size: 0.95rem; color: #6b4557; opacity: 0.8;">${status.desc}</p>
      </div>

      <div class="track-stepper">
        <div class="step-item ${currentIndex >= 0 ? (currentIndex > 0 ? 'completed' : 'active') : ''}">
          <div class="step-dot">${currentIndex > 0 ? '✓' : '1'}</div>
          <div class="step-label">Reçue</div>
        </div>
        <div class="step-item ${currentIndex >= 1 ? (currentIndex > 1 ? 'completed' : 'active') : ''}">
          <div class="step-dot">${currentIndex > 1 ? '✓' : '2'}</div>
          <div class="step-label">En cours</div>
        </div>
        <div class="step-item ${currentIndex >= 2 ? (currentIndex > 2 ? 'completed' : 'active') : ''}">
          <div class="step-dot">${currentIndex > 2 ? '✓' : '3'}</div>
          <div class="step-label">Prête</div>
        </div>
      </div>

      <div class="track-details" style="background: #fff; padding: 1.5rem; border-radius: 20px; border: 1px solid #eee;">
        <h5 style="margin-bottom: 1rem; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: #999;">Détails de la commande</h5>
        <ul style="list-style: none; padding: 0; margin-bottom: 1.5rem;">
          ${order.items.map(item => `
            <li style="display:flex; justify-content:space-between; padding: 0.6rem 0; border-bottom: 1px dotted #eee; font-size: 0.95rem;">
              <span><strong>${item.quantity}x</strong> ${item.name}</span>
              <span style="font-weight: 700; color: var(--black);">${item.totalPrice.toLocaleString('fr-FR')} FCFA</span>
            </li>
          `).join('')}
        </ul>
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 2px solid var(--pink-pale);">
          <span style="font-weight: 700; font-size: 1.1rem;">Total</span>
          <span style="color: var(--pink); font-size: 1.4rem; font-weight: 800;">${order.totalAmount.toLocaleString('fr-FR')} FCFA</span>
        </div>
      </div>
    `;
  };

  const startTracking = () => {
    const lastOrderId = localStorage.getItem('delice_last_order_id');
    if (!lastOrderId) return;

    if (orderSubscription) orderSubscription(); // Unsubscribe previous if any

    orderSubscription = DataService.subscribeToOrder(lastOrderId, (order) => {
      updateUI(order);
    });
  };

  // Check on load
  startTracking();

  // Expose to global scope so we can call it after placing an order
  window.refreshOrderTracking = startTracking;

  const openTracking = (e) => {
    if (e) e.preventDefault();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const lastOrderId = localStorage.getItem('delice_last_order_id');
    if (!lastOrderId) {
      content.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <p style="color: var(--grey-text);">Aucune commande trouvée sur cet appareil.</p>
        </div>
      `;
    }
  };

  if (trackBtnNav) trackBtnNav.addEventListener('click', openTracking);
  if (trackBtnMobile) trackBtnMobile.addEventListener('click', (e) => {
    if (typeof closeMobile === 'function') closeMobile();
    openTracking(e);
  });

  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

// ==========================================
// DELICE AI CHATBOT LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const chatbotToggler = document.getElementById('chatbot-toggler');
  const chatbotCloseBtn = document.getElementById('chatbot-close-btn');
  const chatbotContainer = document.getElementById('chatbot-container');
  const chatbotInput = document.getElementById('chatbot-input');
  const chatbotSendBtn = document.getElementById('chatbot-send-btn');
  const chatbotMessages = document.getElementById('chatbot-messages');

  // Toggle Chatbot Window
  if (chatbotToggler) {
    chatbotToggler.addEventListener('click', () => {
      chatbotContainer.classList.toggle('active');
      if (chatbotContainer.classList.contains('active')) {
        chatbotInput.focus();
      }
    });
  }

  if (chatbotCloseBtn) {
    chatbotCloseBtn.addEventListener('click', () => {
      chatbotContainer.classList.remove('active');
    });
  }

  // Create a chat list item
  const createChatLi = (message, className) => {
    const chatLi = document.createElement('li');
    chatLi.classList.add('chat', className);
    let chatContent = className === 'outgoing' ? `<p></p>` : `<div class="chat-content"><p></p></div>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector('p').textContent = message; // Safe text injection
    return chatLi;
  }

  // Handle Chat Logic
  const handleChat = async () => {
    let userMessage = chatbotInput.value.trim();
    if (!userMessage) return;

    // Clear input and reset height
    chatbotInput.value = '';
    chatbotInput.style.height = '45px';

    // Session ID for persistence
    let chatId = localStorage.getItem('delice_chat_session');
    if (!chatId) {
      chatId = 'chat_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('delice_chat_session', chatId);
    }

    // Append user message
    const outgoingChatLi = createChatLi(userMessage, 'outgoing');
    chatbotMessages.appendChild(outgoingChatLi);
    chatbotMessages.scrollTo(0, chatbotMessages.scrollHeight);

    // Persist user message
    DataService.saveChatMessage(chatId, { role: 'user', content: userMessage });

    // Show typing indicator
    const incomingChatLi = document.createElement('li');
    incomingChatLi.classList.add('chat', 'incoming');
    incomingChatLi.innerHTML = `<div class="chat-content"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
    chatbotMessages.appendChild(incomingChatLi);
    chatbotMessages.scrollTo(0, chatbotMessages.scrollHeight);

    // Call AI API
    try {
      const botResponse = await generateAIResponse(userMessage);

      // --- ORDER DETECTION LOGIC ---
      let cleanResponse = botResponse;
      const orderMatch = botResponse.match(/\[ORDER_JSON:\s*(\{.*?\})\s*\]/s);

      if (orderMatch) {
        try {
          const orderData = JSON.parse(orderMatch[1]);
          console.log("AI detected an order:", orderData);

          // 1. Process the order
          if (orderData.items && orderData.items.length > 0) {
            const finalOrder = {
              items: orderData.items.map(item => ({
                name: item.name,
                quantity: item.qty || 1,
                unitPrice: item.price || 0,
                totalPrice: (item.price || 0) * (item.qty || 1)
              })),
              totalAmount: orderData.total || 0,
              note: `Commande via Délice AI Chat (${chatId})`,
              status: 'new'
            };

            // 2. Save to database
            if (typeof DataService !== 'undefined' && DataService.saveOrder) {
              const orderId = await DataService.saveOrder(finalOrder);
              if (orderId) {
                localStorage.setItem('delice_last_order_id', orderId);
                if (window.refreshOrderTracking) window.refreshOrderTracking();

                // 3. Send Telegram Notification
                const adminLink = window.location.origin + "/admin";
                const messageTelegram = `🤖 <b>COMMANDE VIA IA !</b>\n\n` +
                  `💰 Total : ${finalOrder.totalAmount.toLocaleString('fr-FR')} FCFA\n` +
                  `📝 Chat ID : ${chatId}\n\n` +
                  `<a href="${adminLink}">Accéder à l'espace Admin</a>`;
                await sendTelegramNotification(messageTelegram);
              }
            }
          }

          // Remove the technical tag from the message shown to the user
          cleanResponse = botResponse.replace(/\[ORDER_JSON:\s*(\{.*?\})\s*\]/gs, "").trim();

        } catch (parseErr) {
          console.error("Failed to parse AI order JSON:", parseErr);
        }
      }
      // --- END ORDER DETECTION ---

      const pElement = document.createElement('p');
      pElement.innerHTML = formatAIResponse(cleanResponse);

      incomingChatLi.querySelector('.chat-content').innerHTML = '';
      incomingChatLi.querySelector('.chat-content').appendChild(pElement);

      // Persist bot message (store clean version)
      DataService.saveChatMessage(chatId, { role: 'assistant', content: cleanResponse });

    } catch (error) {
      incomingChatLi.querySelector('.chat-content').innerHTML = `<p style="color:#EF4444;">Désolé, je rencontre un petit problème technique. Veuillez réessayer.</p>`;
    } finally {
      chatbotMessages.scrollTo(0, chatbotMessages.scrollHeight);
    }
  }

  // Format AI Response (Bold, Line breaks)
  const formatAIResponse = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  // Enter key to send (Shift+Enter for newline)
  if (chatbotInput) {
    chatbotInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleChat();
      }
    });

    chatbotInput.addEventListener('input', () => {
      chatbotInput.style.height = '45px';
      chatbotInput.style.height = `${chatbotInput.scrollHeight}px`;
    });
  }

  if (chatbotSendBtn) {
    chatbotSendBtn.addEventListener('click', handleChat);
  }

  async function loadDynamicContent() {
    try {
      const settings = await DataService.getSiteSettings();
      if (!settings) return;

      // Hero section
      if (settings.heroBadge) {
        const hb = document.getElementById('site-hero-badge-display');
        if (hb) hb.textContent = settings.heroBadge;
      }
      if (settings.heroTitle) {
        const ht = document.getElementById('site-hero-title-display');
        if (ht) ht.innerHTML = settings.heroTitle.replace(/\n/g, '<br/>');
      }
      if (settings.heroSubtitle) {
        const hs = document.getElementById('site-hero-subtitle-display');
        if (hs) hs.innerHTML = settings.heroSubtitle.replace(/\n/g, '<br/>');
      }
      if (settings.heroImage) {
        const hi = document.getElementById('hero-cake-img');
        if (hi) hi.src = convertToDirectDriveLink(settings.heroImage);
      }

      // Saveurs section
      if (settings.saveursTitle) {
        const st = document.getElementById('site-saveurs-title-display');
        if (st) st.innerHTML = settings.saveursTitle;
      }
      if (settings.saveursDesc) {
        const sd = document.getElementById('site-saveurs-desc-display');
        if (sd) sd.textContent = settings.saveursDesc;
      }

      // WhatsApp & CTA
      if (settings.whatsappNum) {
        const waLinks = document.querySelectorAll('a[href^="https://wa.me/"]');
        waLinks.forEach(link => {
          try {
            const url = new URL(link.href);
            const message = url.searchParams.get('text') || "";
            link.href = `https://wa.me/${settings.whatsappNum}${message ? '?text=' + encodeURIComponent(message) : ''}`;
          } catch (e) {
            link.href = `https://wa.me/${settings.whatsappNum}`;
          }
        });
      }
      if (settings.ctaText) {
        const ctaElements = [
          document.getElementById('nav-cta'),
          document.getElementById('hero-order-btn'),
          document.getElementById('product-order-btn'),
          document.getElementById('saveurs-order-btn')
        ];
        ctaElements.forEach(el => { if (el) el.textContent = settings.ctaText; });
      }

    } catch (e) {
      console.error("Dynamic content error", e);
    }
  }
  loadDynamicContent();

  // ==========================================
  // DELICE AI CHAT LOGIC — Via Proxy Vercel /api/chat
  // ==========================================
  // La clé HF_API_KEY est stockée de manière sécurisée dans les variables
  // d'environnement Vercel. Le frontend appelle uniquement /api/chat.

  async function initSystemContext() {
    try {
      const products = await DataService.getProducts();
      const activeProducts = products.filter(p => p.status === 'active');
      const kbContent = await DataService.getKnowledgeBase();

      let productListText = activeProducts.map(p => `- ${p.name} : ${p.price} FCFA`).join("\n");

      systemContext = `Tu es Délice AI, assistant de la pâtisserie Délice Cake au Burkina Faso. 
Sois chaleureux, concis et utilise des emojis. 

MENU :
${productListText || "Sachet Délice Cake (500 FCFA), Cupcake (1000 FCFA), Tiramisu (1000 FCFA)"}

INFO : ${kbContent || "Pâtisseries artisanales au cœur de chocolat."}`;
    } catch (e) {
      console.error("AI Context Init Fail:", e);
      systemContext = "Assistant Délice Cake. Aidez le client avec le menu.";
    }
  }

  let chatHistoryMessages = [];
  let systemContext = "";

  window.generateAIResponse = async function (userText) {
    if (!systemContext || systemContext === "") {
      await initSystemContext();
    }

    if (chatHistoryMessages.length === 0) {
      chatHistoryMessages.push({ role: "system", content: systemContext });
    }

    chatHistoryMessages.push({ role: "user", content: userText });

    const payload = {
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      messages: chatHistoryMessages,
      max_tokens: 200,
      temperature: 0.6,
      top_p: 0.9,
      stream: false
    };

    try {
      // Appel via le proxy sécurisé Vercel — la clé HF_API_KEY est sur Vercel
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.error ? (typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error)) : "Unknown error";

        if (response.status === 503 || errorMessage.includes("is currently loading") || errorMessage.includes("se réveille")) {
          chatHistoryMessages.pop();
          return "Le cerveau de Délice AI se réveille... 🤖 Patientez 10s et réessayez.";
        }
        throw new Error(`Status: ${response.status} - ${errorMessage}`);
      }

      const result = await response.json();
      console.log("DEBUG AI - Réponse brute :", result);

      let botText = "";
      // Détection flexible du format
      if (result.choices && result.choices[0] && result.choices[0].message) {
        botText = result.choices[0].message.content;
      } else if (Array.isArray(result) && result[0] && result[0].generated_text) {
        botText = result[0].generated_text;
      } else if (result.generated_text) {
        botText = result.generated_text;
      } else if (result.error) {
        botText = "Erreur API : " + (result.error.message || JSON.stringify(result.error));
      } else {
        botText = "Désolé, j'ai reçu un format bizarre. Réponse : " + JSON.stringify(result).slice(0, 100);
      }

      botText = botText.trim().replace(/^Délice AI\s*:\s*/i, '');
      chatHistoryMessages.push({ role: "assistant", content: botText });
      return botText;
    } catch (error) {
      console.error("DEBUG AI - Erreur critique :", error);
      return `Désolé, l'IA est indisponible pour le moment. Veuillez réessayer plus tard. (${error.message})`;
    }
  };

});

// Vercel Cache Busting Version: 04/03/2026 - AI Fix Version 12 (Groq API - Llama 3.1)
// Trigger Vercel Deploy 9
