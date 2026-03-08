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

// --- Customer Identity for Tracking ---
function getCustomerId() {
  let id = localStorage.getItem('delice_customer_id');
  if (!id) {
    id = 'cust_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('delice_customer_id', id);
  }
  return id;
}
getCustomerId(); // Initialize ID immediately for tracking

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
// Hide preloader as soon as DOM is ready (don't wait for images/fonts/etc.)
document.addEventListener('DOMContentLoaded', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add('hidden');
      setTimeout(() => { if (preloader.parentNode) preloader.remove(); }, 800);
    }, 300);
  }
});

// Absolute fallback: hide preloader after 1.5s no matter what
setTimeout(() => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.transition = 'opacity 0.4s ease';
    preloader.style.opacity = '0';
    preloader.style.pointerEvents = 'none';
    setTimeout(() => { if (preloader.parentNode) preloader.remove(); }, 500);
  }
}, 1500);

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

// ===================================================
// === CAKE STUDIO — Interactive Configurator Logic ===
// ===================================================
(function initCakeStudio() {
  // --- State ---
  const cakeState = {
    flavor: { value: 'choc', color: '#4A2C2A', label: 'Chocolat Noir' },
    color: { value: 'pink', color: '#E8178A', label: 'Rose Délice' },
    size: { value: 'small', tiers: 1, label: 'Standard (1 étage)' },
    shape: { value: 'square', label: 'Carré élégant' },
    customShape: '',
    parts: { value: '8', label: '8 parts (petit)' },
    occasion: { value: 'birthday', label: 'Anniversaire' },
    message: ''
  };

  const BASE_PRICE_PER_SLICE = 1500;

  // --- DOM Refs ---
  const tabs = document.querySelectorAll('.config-tab');
  const panels = document.querySelectorAll('.config-panel');
  const tier2 = document.getElementById('tier-2');
  const tier1el = document.getElementById('tier-1');
  const topper = document.querySelector('.cake-topper');
  const orderBtn = document.getElementById('order-custom-cake');
  const ctaHint = document.querySelector('.cta-hint');
  const msgInput = document.getElementById('cake-message-input');
  const charCount = document.getElementById('msg-char-count');
  const customShapeInput = document.getElementById('custom-shape-input');
  const customPartsInput = document.getElementById('custom-parts-input');
  const customPartsContainer = document.getElementById('custom-parts-container');

  if (!tabs.length) return;

  // --- Tab Switching (both rows) ---
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const cat = tab.dataset.category;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = document.querySelector(`[data-panel="${cat}"]`);
      if (target) target.classList.add('active');
    });
  });

  // --- Option Button Selection ---
  document.querySelectorAll('.config-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.closest('.config-panel');
      panel.querySelectorAll('.config-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Micro pop
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => btn.style.transform = '', 180);

      const type = panel.dataset.panel;
      const labelEl = btn.querySelector('span:last-child');
      const label = labelEl ? labelEl.textContent.trim() : '';

      switch (type) {
        case 'flavor':
          cakeState.flavor = { value: btn.dataset.value, color: btn.dataset.color || '#E8178A', label };
          break;
        case 'color':
          cakeState.color = { value: btn.dataset.value, color: btn.dataset.color || '#E8178A', label };
          break;
        case 'size':
          cakeState.size = { value: btn.dataset.value, tiers: parseInt(btn.dataset.tiers) || 1, label };
          break;
        case 'shape':
          cakeState.shape = { value: btn.dataset.value, label: btn.dataset.shapeLabel || label };
          break;
        case 'parts':
          cakeState.parts = { value: btn.dataset.value, label: btn.dataset.partsLabel || label };
          // Toggle custom input visibility
          if (customPartsContainer) {
            customPartsContainer.style.display = btn.dataset.value === 'custom' ? 'block' : 'none';
          }
          break;
        case 'occasion':
          cakeState.occasion = { value: btn.dataset.value, label: btn.dataset.occLabel || label };
          break;
      }
      renderCakePreview();
    });
  });

  // --- Message inputs ---
  if (msgInput) {
    msgInput.addEventListener('input', () => {
      cakeState.message = msgInput.value;
      if (charCount) charCount.textContent = msgInput.value.length;
      const svgText = document.querySelector('.cake-message-text');
      if (svgText) svgText.textContent = msgInput.value ? `"${msgInput.value}"` : '';
    });
  }

  if (customShapeInput) {
    customShapeInput.addEventListener('input', () => {
      cakeState.customShape = customShapeInput.value;
    });
  }

  if (customPartsInput) {
    customPartsInput.addEventListener('input', () => {
      const val = customPartsInput.value;
      if (val) {
        cakeState.parts.value = val;
        cakeState.parts.label = `${val} parts (personnalisé)`;
        renderCakePreview();
      }
    });
  }

  function renderCakePreview() {
    const icing = cakeState.color.color;
    const flavorColor = cakeState.flavor.color;
    const tiers = cakeState.size.tiers;
    const shape = cakeState.shape.value;

    // Icing color — update all .cake-body elements
    document.querySelectorAll('.cake-body').forEach(el => el.setAttribute('fill', icing));

    // Flavor layer color
    document.querySelectorAll('.flavor-line').forEach(el =>
      el.setAttribute('stroke', hexToRgba(flavorColor, 0.35))
    );

    // ------ Shape morphing via SVG clipPath ------
    const s = 'square';

    const t3 = document.getElementById('tier-3');
    const t2g = document.getElementById('tier-2');
    const t1g = document.getElementById('tier-1');

    if (t3) t3.setAttribute('clip-path', `url(#clip-${s}-b)`);
    if (t2g) t2g.setAttribute('clip-path', `url(#clip-${s}-m)`);
    if (t1g) t1g.setAttribute('clip-path', `url(#clip-${s}-t)`);

    // Tier 2 visibility
    if (tier2) {
      const show2 = tiers >= 2;
      tier2.style.opacity = show2 ? '1' : '0';
      tier2.style.transform = show2 ? 'translateY(0)' : 'translateY(20px)';
    }

    // Tier 1 (top) visibility
    if (tier1el) {
      const show3 = tiers >= 3;
      tier1el.style.opacity = show3 ? '1' : '0';
      tier1el.style.transform = show3 ? 'translateY(0)' : 'translateY(20px)';
    }

    // Topper
    if (topper) topper.style.opacity = tiers >= 3 ? '1' : '0';

    // Price + parts update: Dynamic calculation based on parts (minimum 1500 FCFA/slice)
    let numParts = parseInt(cakeState.parts.value);
    // If "custom" was clicked but value not yet set by input, default to 8 for preview
    if (isNaN(numParts)) numParts = 8;

    const finalCalculatedPrice = numParts * BASE_PRICE_PER_SLICE;

    if (ctaHint) {
      ctaHint.innerHTML = `<span class="material-symbols-outlined" style="font-size:1.2rem; vertical-align:middle; margin-right:4px;">payments</span> Estimé à : <strong>${finalCalculatedPrice.toLocaleString('fr-FR')} FCFA</strong> (${numParts} parts)`;
    }
  }

  // --- Hex → RGBA ---
  function hexToRgba(hex, alpha) {
    if (!hex || hex.length < 7) return `rgba(200,100,100,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // --- CTA → WhatsApp with full spec ---
  if (orderBtn) {
    orderBtn.addEventListener('click', async () => {
      const shapeDisplay = cakeState.customShape ? `${cakeState.shape.label} (Détail: ${cakeState.customShape})` : cakeState.shape.label;
      const numParts = parseInt(cakeState.parts.value) || 8;
      const finalPrice = numParts * BASE_PRICE_PER_SLICE;

      const msg =
        `*COMMANDE DÉSIR CAKE STUDIO* ✦\n` +
        `Nouveau gâteau personnalisé :\n\n` +
        `• Saveur        : ${cakeState.flavor.label}\n` +
        `• Glaçage       : ${cakeState.color.label}\n` +
        `• Format        : ${cakeState.size.label}\n` +
        `• Forme         : ${shapeDisplay}\n` +
        `• Parts         : ${cakeState.parts.label}\n` +
        `• Occasion      : ${cakeState.occasion.label}\n` +
        (cakeState.message ? `• Message       : "${cakeState.message}"\n` : '') +
        `• PRIX ESTIMÉ   : *${finalPrice.toLocaleString('fr-FR')} FCFA*\n\n` +
        `_Veuillez me contacter pour confirmer la commande._`;

      // Save to Firestore and notify Telegram
      try {
        const orderData = {
          type: 'cake_studio',
          items: [{
            name: `Gâteau Personnalisé (${cakeState.parts.label})`,
            details: {
              flavor: cakeState.flavor.label,
              color: cakeState.color.label,
              shape: shapeDisplay,
              parts: cakeState.parts.label,
              occasion: cakeState.occasion.label,
              message: cakeState.message || ''
            },
            quantity: 1,
            unitPrice: finalPrice,
            totalPrice: finalPrice
          }],
          totalAmount: finalPrice,
          status: 'new',
          customerNote: cakeState.message || ''
        };

        if (typeof DataService !== 'undefined') {
          orderId = await DataService.saveOrder(orderData);
          if (orderId) {
            localStorage.setItem('delice_last_order_id', orderId);
            if (window.refreshOrderTracking) window.refreshOrderTracking();
          }

          // Notify Telegram
          const telegramMsg = `🍰 <b>Nouvelle commande Cake Studio !</b>\n\n` +
            `🍫 Saveur: ${cakeState.flavor.label}\n` +
            `🎨 Glaçage: ${cakeState.color.label}\n` +
            `⬟ Forme: ${shapeDisplay}\n` +
            `🍽 Parts: ${cakeState.parts.label}\n` +
            `🎉 Occasion: ${cakeState.occasion.label}\n` +
            (cakeState.message ? `✍️ Message: "${cakeState.message}"\n` : '') +
            `💰 <b>TOTAL: ${finalPrice.toLocaleString('fr-FR')} FCFA</b>`;

          fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: telegramMsg })
          }).catch(e => console.error("Telegram notify failed", e));
        }
      } catch (err) {
        console.error("Order save failed", err);
      }

      window.open(`https://wa.me/22656808872?text=${encodeURIComponent(msg)}`, '_blank');
    });
  }

  // Initial render
  renderCakePreview();
})();


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
  initNotifications();
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
          const isPerSlice = !!p.isPerSlice;
          const lowerName = p.name.toLowerCase();
          // Precise matching for event cakes (with or without accents)
          const isCustom = p.isCustom ||
            lowerName.includes('évènement') ||
            lowerName.includes('événement') ||
            lowerName.includes('evenement') ||
            lowerName.includes('sur mesure');

          if (isCustom || isPerSlice) {
            orderHtml += `
                            <div class="product-item product-item--complex" style="flex-wrap: wrap; border: 2px solid var(--pink-pale); border-radius: 12px; padding: 12px; margin-bottom: 12px; transition: all 0.3s ease;">
                                <label class="product-checkbox" style="width: 100%; margin-bottom: 0.5rem; display: flex; align-items: center; cursor: pointer;">
                                    <input type="checkbox" name="product" value="${p.name}" class="prod-check"
                                        data-id="prod-${index}" data-price="${p.price}" data-perslice="${isPerSlice}">
                                    <span class="checkmark"></span>
                                    <span class="prod-name" style="font-weight: 700;">${p.name}</span>
                                    <span class="prod-price" style="margin-left: auto; color: var(--pink); font-weight: 600;">${isPerSlice ? `${p.price} FCFA / part` : 'sur mesure'}</span>
                                </label>
                                
                                <div class="prod-options" id="options-prod-${index}"
                                    style="display: none; width: 100%; padding: 10px; background: rgba(232, 23, 138, 0.05); border-radius: 8px; margin-top: 8px; border-left: 4px solid var(--pink);">
                                    
                                    ${!isPerSlice ? `
                                    <div style="margin-bottom: 10px;">
                                        <label style="display: block; font-size: 0.85rem; margin-bottom: 4px; font-weight: 600;">Choisissez votre budget :</label>
                                        <select id="select-prod-${index}" class="form-input" style="width: 100%; margin-bottom: 8px;">
                                            <option value="5000">5 000 FCFA</option>
                                            <option value="10000">10 000 FCFA</option>
                                            <option value="15000">15 000 FCFA</option>
                                            <option value="custom">Autre budget...</option>
                                        </select>
                                        <input type="number" id="custom-price-prod-${index}" class="form-input" placeholder="Entrez le montant en FCFA"
                                            style="display: none; width: 100%;">
                                    </div>
                                    ` : ''}
                                    
                                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                        <label style="display: block; font-size: 0.85rem; font-weight: 600;">${isPerSlice || lowerName.includes('part') ? 'Combien de parts souhaitez-vous ?' : 'Quantité :'}</label>
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <input type="number" min="1" value="${isPerSlice || lowerName.includes('part') ? '10' : '1'}" class="prod-qty" id="qty-prod-${index}" disabled
                                                style="width: 80px; text-align: center; font-weight: bold; border: 2px solid var(--pink);">
                                            <span style="font-size: 0.9rem; font-weight: 600;">${isPerSlice || lowerName.includes('part') ? 'parts' : 'unité(s)'}</span>
                                        </div>
                                        ${isPerSlice || lowerName.includes('part') ? `<p style="margin: 5px 0 0 0; font-size: 0.8rem; color: var(--pink); font-weight: 500;">✨ Total pour cet article : <span id="item-total-prod-${index}" style="font-weight: 700;">${p.price * 10}</span> FCFA</p>` : ''}
                                    </div>
                                </div>
                            </div>
                        `;
          } else {
            orderHtml += `
                            <div class="product-item" style="padding: 12px; border: 1px solid #eee; border-radius: 12px; margin-bottom: 8px;">
                                <label class="product-checkbox">
                                    <input type="checkbox" name="product" value="${p.name}" class="prod-check"
                                        data-id="prod-${index}" data-price="${p.price}" data-perslice="${isPerSlice}">
                                    <span class="checkmark"></span>
                                    <span class="prod-name">${p.name}</span>
                                    <span class="prod-price" style="margin-left: auto; color: var(--pink);">${p.price} FCFA</span>
                                </label>
                                <div style="display:flex; align-items:center; gap:0.5rem; margin-top: 5px; padding-left: 28px;">
                                  <span style="font-size:0.75rem; color:var(--grey-text);">${isPerSlice || lowerName.includes('part') ? 'Nombre de parts:' : 'Quantité:'}</span>
                                  <input type="number" min="1" value="1" class="prod-qty" id="qty-prod-${index}" disabled style="width: 50px; border-radius: 4px; border: 1px solid #ddd;">
                                </div>
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

        const isPerSlice = checkbox.getAttribute('data-perslice') === 'true';
        if (isPerSlice) {
          const itemTotal = price * qty;
          total += itemTotal;
          // Update individual item total display if it exists
          const itemTotalSpan = document.getElementById(`item-total-${prodId}`);
          if (itemTotalSpan) {
            itemTotalSpan.textContent = new Intl.NumberFormat('fr-FR').format(itemTotal);
          }
        } else {
          total += price * qty;
        }
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

            const isPerSlice = checkbox.getAttribute('data-perslice') === 'true';
            const selectEl = document.getElementById(`select-${prodIdStr}`);
            if (selectEl) {
              if (selectEl.value === 'custom') {
                const customInput = document.getElementById(`custom-price-${prodIdStr}`);
                finalPrice = parseInt(customInput.value) || 0;
              } else {
                finalPrice = parseInt(selectEl.value) || 0;
              }
              productText = `${qty}x ${checkbox.value} (Budget: ${new Intl.NumberFormat('fr-FR').format(finalPrice)} FCFA)`;
            } else if (isPerSlice) {
              const lineTotal = finalPrice * qty;
              productText = `${checkbox.value} (${qty} parts x ${finalPrice} = ${new Intl.NumberFormat('fr-FR').format(lineTotal)} FCFA)`;
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
            // The listener on subscribeToMyOrders will handle the UI update
          }

          // Send Telegram Notification
          const adminLink = window.location.origin + "/admin";
          const messageTelegram = `🍰 <b>NOUVELLE COMMANDE !</b>\n\n` +
            `💰 Total : ${numericTotal.toLocaleString('fr-FR')} FCFA\n` +
            `📝 Note : ${note || 'Aucune'}\n\n` +
            `<a href="${adminLink}">Accéder à l'espace Admin</a>`;
          await sendTelegramNotification(messageTelegram);
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
} // End initOrderModal

// Suggest notifications if not already granted
setTimeout(() => {
  if (Notification.permission === 'default') {
    console.log("Suggesting notifications for order tracking...");
  }
}, 3000);

// === NOTIFICATIONS LOGIC ===
async function initNotifications() {
  if (!messaging) {
    console.warn("FCM Messaging is not supported or not loaded.");
    return;
  }

  try {
    // Register Service Worker explicitly
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.register('firebase-messaging-sw.js');
      console.log('FCM SW Registered:', reg.scope);
      messaging.useServiceWorker(reg);
    }

    // Configure onMessage listener RIGHT NOW, regardless of if we have a token stored
    // This ensures foreground notifications work for returning users.
    setupForegroundListener();

    // Check if we already have a token
    const savedToken = localStorage.getItem('delice_fcm_token');

    // If permission is already granted, refresh/verify the token
    if (Notification.permission === 'granted') {
      await getAndStoreFCMToken();
    } else if (!savedToken) {
      console.log("No FCM Token and permission not granted yet.");
    }
  } catch (err) {
    console.error("FCM Init error:", err);
  }
}

function setupForegroundListener() {
  if (!messaging) return;
  messaging.onMessage((payload) => {
    console.log('Message reçu au premier plan: ', payload);
    const title = payload.notification?.title || payload.data?.title || "Délice Cake";
    const body = payload.notification?.body || payload.data?.body || "";

    // Notification sonore et visuelle locale via Toast (si dispo) ou Alert
    if (window.showToast) {
      window.showToast(`${title}: ${body}`, 'success');
    } else {
      alert(`${title}\n${body}`);
    }

    if (window.playSound) window.playSound('notification');

    // Notification système si permise
    if (Notification.permission === 'granted') {
      new Notification(title, { body: body, icon: '/favicon.svg' });
    }
  });
}

async function getAndStoreFCMToken() {
  if (!messaging) return;
  try {
    const vapidKey = "BMKTZISnCqUCld8Hj0EwFBWFS-O9BCorWJp_ZRbT42DCK7VnDL8feFTNAWYhY_fwQvx0FDzDPO3ax7pnis5fatE";

    let currentToken = null;
    try {
      const registration = await navigator.serviceWorker.ready;
      currentToken = await messaging.getToken({
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });
    } catch (e) {
      console.error("FCM Token Error: Please ensure VAPID key is correct and site is served over HTTPS.");
      return;
    }

    if (currentToken) {
      const oldToken = localStorage.getItem('delice_fcm_token');
      if (oldToken !== currentToken) {
        localStorage.setItem('delice_fcm_token', currentToken);
        console.log("New FCM Token stored.");
      }

      // Link the token to the LATEST order if it hasn't been linked yet
      const lastOrderId = localStorage.getItem('delice_last_order_id');
      if (lastOrderId && typeof DataService !== 'undefined') {
        console.log("Linking token to last order:", lastOrderId);
        await DataService.updateOrderPushToken(lastOrderId, currentToken);
      }
    } else {
      console.warn("No FCM token received.");
    }
  } catch (err) {
    console.error("Error in getAndStoreFCMToken:", err);
  }
}

// Helper: Check if iOS
function isIOS() {
  return [
    'iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'
  ].includes(navigator.platform) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

// Helper: Check if PWA (standalone)
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await getAndStoreFCMToken();

      // Update any active order if last order ID exists
      const lastOrderId = localStorage.getItem('delice_last_order_id');
      const token = localStorage.getItem('delice_fcm_token');
      if (lastOrderId && token && typeof DataService !== 'undefined') {
        await DataService.updateOrderPushToken(lastOrderId, token);
      }

      return true;
    }
  } catch (err) {
    console.error("Permission request error:", err);
  }
  return false;
}

// PROACTIVE NOTIFICATION PROMPT
function showProactiveNotifPrompt() {
  // Don't show if already granted or denied
  if (Notification.permission !== 'default') return;

  // Don't show if recently dismissed
  if (localStorage.getItem('delice_notif_prompt_dismissed')) return;

  // Custom message for iOS
  let promptBody = "Activez les notifications pour savoir exactement quand votre commande est prête, même hors du site. 🍰";
  if (isIOS() && !isStandalone()) {
    promptBody = "<strong>Spécial iPhone :</strong> Pour recevoir nos notifications, ajoutez ce site à votre écran d'accueil ! (Partager > Sur l'écran d'accueil) 📲";
  }

  const promptHtml = `
    <div id="proactive-notif-prompt" class="notif-prompt">
      <div class="notif-prompt__header">
        <div class="notif-prompt__icon">🔔</div>
        <div class="notif-prompt__text">
          <h4>Suivez votre gourmandise !</h4>
          <p>${promptBody}</p>
        </div>
      </div>
      <div class="notif-prompt__actions">
        <button id="notif-prompt-later" class="notif-prompt__btn notif-prompt__btn--secondary">Plus tard</button>
        <button id="notif-prompt-yes" class="notif-prompt__btn notif-prompt__btn--primary">${isIOS() && !isStandalone() ? 'Compris !' : 'Activer'}</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', promptHtml);
  const prompt = document.getElementById('proactive-notif-prompt');

  // Reveal after a slight delay
  setTimeout(() => {
    prompt.classList.add('active');
  }, 100);

  document.getElementById('notif-prompt-later').addEventListener('click', () => {
    prompt.classList.remove('active');
    localStorage.setItem('delice_notif_prompt_dismissed', 'true');
    setTimeout(() => prompt.remove(), 600);
  });

  document.getElementById('notif-prompt-yes').addEventListener('click', async () => {
    prompt.classList.remove('active');
    const granted = await requestNotificationPermission();
    if (granted) {
      localStorage.setItem('delice_notif_prompt_dismissed', 'true');
    }
    setTimeout(() => { if (prompt.parentNode) prompt.remove(); }, 600);
  });
}

// === ORDER TRACKING LOGIC ===
let orderSubscription = null;

function initOrderTracking() {
  // ==============================
  // PDF INVOICE GENERATOR (jsPDF)
  // ==============================
  function generateInvoicePDF(order) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      _printInvoiceFallback(order);
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const PINK = [232, 23, 138];
      const DARK_PINK = [180, 10, 100];
      const LIGHT_PINK = [255, 230, 245];
      const GOLD = [212, 175, 55];
      const DARK = [30, 20, 26];
      const GREY = [110, 90, 100];
      const WHITE = [255, 255, 255];
      const LIGHT_GREY = [245, 245, 248];

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 14;

      function getDateStr(raw) {
        let d;
        if (!raw) return new Date().toLocaleDateString('fr-FR');
        if (raw.toDate) d = raw.toDate();
        else if (raw.seconds) d = new Date(raw.seconds * 1000);
        else d = new Date(raw);
        return isNaN(d.getTime()) ? new Date().toLocaleDateString('fr-FR') :
          d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
      }
      function fmtAmount(n) {
        return (Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
      }

      const dateStr = getDateStr(order.createdAt);
      const ref = (order.id || 'N/A').substring(0, 12).toUpperCase();
      const sectionW = pageW - margin * 2;

      // HEADER
      doc.setFillColor(...PINK); doc.rect(0, 0, pageW, 60, 'F');
      doc.setFillColor(...DARK_PINK); doc.circle(pageW + 6, -8, 44, 'F');

      doc.setFontSize(28); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GOLD);
      doc.text('Delice', margin, 26);
      doc.setTextColor(...WHITE);
      doc.text('Cake', margin + doc.getTextWidth('Delice '), 26);
      doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(255, 200, 230);
      doc.text('Patisserie Artisanale  -  Burkina Faso', margin, 33);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(255, 220, 240);
      doc.text('www.delicecake.com', margin, 40);

      doc.setFillColor(...GOLD); doc.roundedRect(pageW - 56, 8, 44, 14, 3, 3, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...DARK);
      doc.text('FACTURE', pageW - 50, 17);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(255, 220, 240);
      doc.text('Reference :', pageW - 56, 28);
      doc.setFont('helvetica', 'bold'); doc.text(ref, pageW - 12, 28, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text('Date :', pageW - 56, 35); doc.text(dateStr, pageW - 12, 35, { align: 'right' });
      doc.text('Statut :', pageW - 56, 42);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...GOLD);
      doc.text('LIVRE / TERMINE', pageW - 12, 42, { align: 'right' });

      doc.setFillColor(...LIGHT_PINK);
      for (let i = margin; i <= pageW - margin; i += 6) { doc.circle(i, 63, 0.7, 'F'); }

      let y = 72;
      const halfW = sectionW / 2 - 4;
      const colL = margin, colR = margin + halfW + 8;

      doc.setFillColor(...LIGHT_PINK); doc.roundedRect(colL, y, halfW, 28, 3, 3, 'F');
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK_PINK);
      doc.text('INFORMATIONS CLIENT', colL + 4, y + 6);
      doc.setFillColor(...DARK_PINK); doc.rect(colL + 4, y + 8, halfW - 8, 0.4, 'F');
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...GREY);
      doc.text('Type : Commande en ligne', colL + 4, y + 14);
      doc.text('Note : ' + (order.note || 'Client').substring(0, 30), colL + 4, y + 20);
      doc.text('Paiement : A la livraison', colL + 4, y + 26);

      doc.setFillColor(250, 235, 245); doc.roundedRect(colR, y, halfW, 28, 3, 3, 'F');
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK_PINK);
      doc.text('DETAILS LIVRAISON', colR + 4, y + 6);
      doc.setFillColor(...DARK_PINK); doc.rect(colR + 4, y + 8, halfW - 8, 0.4, 'F');
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...GREY);
      doc.text('Mode : Livraison a domicile', colR + 4, y + 14);
      doc.text('Date : ' + dateStr, colR + 4, y + 20);
      doc.text('Reference : ' + ref, colR + 4, y + 26);

      y += 36;
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
      doc.text('DETAIL DE LA COMMANDE', colL, y);
      doc.setFillColor(...PINK); doc.rect(colL, y + 2, sectionW, 0.8, 'F');
      y += 6;

      const tableBody = (order.items || []).map((item, i) => [
        String(i + 1), item.name || '', String(item.quantity || 1),
        fmtAmount(item.unitPrice), fmtAmount(item.totalPrice)
      ]);

      doc.autoTable({
        startY: y, margin: { left: margin, right: margin },
        head: [["N°", "Designation", "Qte", "Prix Unit.", "Total"]],
        body: tableBody, theme: 'plain',
        headStyles: { fillColor: PINK, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { textColor: DARK, fontSize: 9 },
        alternateRowStyles: { fillColor: [255, 243, 251] },
      });

      const afterTable = doc.lastAutoTable.finalY + 6;
      const boxX = pageW / 2 + 2;
      doc.setFillColor(...LIGHT_GREY); doc.roundedRect(margin, afterTable, sectionW, 25, 3, 3, 'F');
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GREY);
      doc.text('Sous-total :', boxX, afterTable + 8);
      doc.text(fmtAmount(order.totalAmount), pageW - margin, afterTable + 8, { align: 'right' });
      doc.setFillColor(...PINK); doc.roundedRect(boxX - 1, afterTable + 12, pageW - margin - boxX + 1, 9, 1, 1, 'F');
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE);
      doc.text('TOTAL A PAYER', boxX + 3, afterTable + 18);
      doc.text(fmtAmount(order.totalAmount), pageW - margin, afterTable + 18, { align: 'right' });

      doc.setFillColor(...PINK); doc.rect(0, pageH - 10, pageW, 10, 'F');
      doc.setFontSize(7.5); doc.setTextColor(...WHITE);
      doc.text('Merci pour votre confiance ! DELICE CAKE - Burkina Faso', pageW / 2, pageH - 4, { align: 'center' });

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'Facture_DeliceCake_' + ref + '.pdf';
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 3000);
    } catch (err) { _printInvoiceFallback(order); }
  }

  function _printInvoiceFallback(order) {
    const ref = (order.id || 'N/A').substring(0, 12).toUpperCase();
    const rows = (order.items || []).map((it, i) => `<tr><td>${i + 1}</td><td>${it.name}</td><td>${it.quantity}</td><td>${it.unitPrice.toLocaleString()} FCFA</td><td>${it.totalPrice.toLocaleString()} FCFA</td></tr>`).join('');
    const html = `<html><body onload="window.print()"><h1>Facture Délice Cake</h1><p>Réf: ${ref}</p><table border="1" width="100%"><thead><tr><th>#</th><th>Article</th><th>Qté</th><th>Prix Unit.</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><h3>Total: ${order.totalAmount.toLocaleString()} FCFA</h3></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  }

  const navBadge = document.getElementById('nav-track-badge');
  const mobileBadge = document.getElementById('mobile-track-badge');
  const modal = document.getElementById('track-modal');
  const closeBtn = document.getElementById('track-modal-close');
  const content = document.getElementById('track-content');
  const trackingBar = document.getElementById('active-orders-tracking');
  let orderSubscription = null;

  const STATUS_REELS = {
    'new': { label: 'Reçue', icon: '📝', color: '#3b82f6', class: 'status-new', desc: 'Commande bien reçue.' },
    'processing': { label: 'Préparation', icon: '👨‍🍳', color: '#f59e0b', class: 'status-processing', desc: 'En cours de préparation.' },
    'completed': { label: 'Prête !', icon: '🍰', color: '#10b981', class: 'status-completed', desc: 'Votre commande est prête !' },
    'cancelled': { label: 'Annulée', icon: '❌', color: '#ef4444', class: 'status-cancelled', desc: 'Commande annulée.' }
  };

  const updateUI = (order) => {
    if (!order || !content) return;
    const status = STATUS_REELS[order.status || 'new'];
    const isCompleted = order.status === 'completed';

    content.innerHTML = `
      <div class="track-status-header" style="text-align:center; padding: 20px; background: ${isCompleted ? '#f0fdf4' : '#fff'}; border-radius: 12px; margin-bottom: 20px;">
        <div style="font-size: 3rem; margin-bottom: 10px;">${status.icon}</div>
        <h4 style="color: ${status.color}; margin:0;">${status.label}</h4>
        <p style="font-size: 0.9rem; margin-top: 5px;">${status.desc}</p>
      </div>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
        <ul style="list-style:none; padding:0;">
          ${order.items.map(it => `<li style="display:flex; justify-content:space-between; margin-bottom: 8px;"><span>${it.quantity}x ${it.name}</span><strong>${it.totalPrice.toLocaleString()} FCFA</strong></li>`).join('')}
        </ul>
        <div style="border-top: 2px solid #ddd; margin-top: 10px; padding-top: 10px; display:flex; justify-content:space-between; font-weight:bold;">
          <span>Total</span><span style="color: #E8178A;">${order.totalAmount.toLocaleString()} FCFA</span>
        </div>
      </div>
      ${isCompleted ? `<button id="dl-inv" class="btn btn--primary" style="width:100%; margin-top:15px;">📥 Télécharger Facture</button>` : ''}
    `;
    if (isCompleted) document.getElementById('dl-inv').onclick = () => generateInvoicePDF(order);
  };

  const renderTrackingUI = (orders, container) => {
    if (!container) return;
    container.innerHTML = '';
    const activeOrders = orders.filter(o => o.status !== 'cancelled');

    if (activeOrders.length === 0) {
      if (navBadge) navBadge.classList.remove('active');
      if (mobileBadge) mobileBadge.classList.remove('active');
      return;
    }

    activeOrders.forEach(order => {
      // Check if this specific order tracking has been dismissed for this session
      if (sessionStorage.getItem(`dismiss_track_${order.id}`)) return;

      const statusIdx = ['new', 'processing', 'completed'].indexOf(order.status || 'new');
      const status = STATUS_REELS[order.status || 'new'];

      const card = document.createElement('div');
      card.className = 'order-tracking-card premium-tracking';
      card.innerHTML = `
        <button class="close-track-btn" title="Fermer">&times;</button>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
           <div style="display:flex; align-items:center; gap:10px;">
              <div class="track-badge active status-${order.status || 'new'}"></div>
              <span style="font-weight:800; font-size:0.9rem;">Commande #${order.id.slice(-4).toUpperCase()}</span>
           </div>
           <span class="status-label-pill" style="background:${status.color}15; color:${status.color}; padding:4px 12px; border-radius:20px; font-size:0.75rem; font-weight:700;">${status.label}</span>
        </div>
        
        <div class="track-stepper" style="margin: 10px 0;">
          <div class="step-item ${statusIdx >= 0 ? 'completed' : ''} ${order.status === 'new' ? 'active' : ''}">
            <div class="step-dot">1</div>
          </div>
          <div class="step-item ${statusIdx >= 1 ? 'completed' : ''} ${order.status === 'processing' ? 'active' : ''}">
            <div class="step-dot">2</div>
          </div>
          <div class="step-item ${statusIdx >= 2 ? 'completed' : ''} ${order.status === 'completed' ? 'active' : ''}">
            <div class="step-dot">3</div>
          </div>
        </div>
        
        <div style="font-size:0.8rem; color:#666; margin-top:10px; display:flex; justify-content:space-between;">
           <span>${order.items.length} article(s)</span>
           <span style="color:var(--pink); font-weight:700;">${order.totalAmount.toLocaleString()} FCFA</span>
        </div>
      `;

      // Close button logic
      const closeBtn = card.querySelector('.close-track-btn');
      closeBtn.onclick = (e) => {
        e.stopPropagation(); // Don't open modal
        sessionStorage.setItem(`dismiss_track_${order.id}`, 'true');
        card.style.transform = 'translateX(-100px)';
        card.style.opacity = '0';
        setTimeout(() => card.remove(), 300);
      };

      card.onclick = () => {
        updateUI(order);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      };
      container.appendChild(card);
    });

    // Update badges with latest order status
    const latest = activeOrders[0];
    const s = STATUS_REELS[latest.status || 'new'];
    [navBadge, mobileBadge].forEach(b => {
      if (b) {
        b.className = 'track-badge active ' + s.class;
        b.textContent = s.label;
      }
    });
  };

  const startTracking = () => {
    const id = getCustomerId();
    const lastId = localStorage.getItem('delice_last_order_id');

    if (orderSubscription) orderSubscription();

    if (id) {
      orderSubscription = DataService.subscribeToMyOrders(id, (orders) => {
        renderTrackingUI(orders, trackingBar);
      });
    } else if (lastId) {
      // Fallback: track just the last order if no customer ID is active yet
      orderSubscription = DataService.subscribeToOrder(lastId, (order) => {
        if (order) renderTrackingUI([order], trackingBar);
      });
    }
  };

  startTracking();
  window.refreshOrderTracking = startTracking;

  const openTracking = (e) => {
    if (e) e.preventDefault();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    const lastId = localStorage.getItem('delice_last_order_id');
    if (lastId) {
      DataService.subscribeToOrder(lastId, (o) => updateUI(o));
    } else {
      content.innerHTML = '<p style="text-align:center; padding:20px;">Aucune commande active.</p>';
    }
  };

  if (document.getElementById('track-order-nav')) document.getElementById('track-order-nav').onclick = openTracking;
  if (document.getElementById('track-order-mobile')) document.getElementById('track-order-mobile').onclick = (e) => {
    if (window.closeMobile) window.closeMobile();
    openTracking(e);
  };
  if (closeBtn) closeBtn.onclick = () => { modal.classList.remove('active'); document.body.style.overflow = ''; };
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

      // --- NEW STRUCTURED ORDER DETECTION (Fixed for nested JSON) ---
      let cleanResponse = botResponse;
      let structuredData = null;

      // Extract using a greedy match to handle nested JSON correctly
      const tagMatch = botResponse.match(/\[ORDER_DATA:\s*(\{.*})\s*\]/is);

      if (tagMatch) {
        try {
          let rawJson = tagMatch[1];
          // Balanced brace balancing: find the actual end of the JSON root object
          const lastBrace = rawJson.lastIndexOf('}');
          if (lastBrace !== -1) {
            rawJson = rawJson.substring(0, lastBrace + 1);
          }

          structuredData = JSON.parse(rawJson);
          console.log("Délice AI - Données structurées extraites :", structuredData);

          // Remove the tag precisely from the response
          cleanResponse = botResponse.split(/\[ORDER_DATA:/i)[0] + botResponse.split(/\]/g).pop();
          // Fallback if split is weird
          if (cleanResponse.includes("[ORDER_DATA:")) {
            cleanResponse = botResponse.replace(/\[ORDER_DATA:.*?\]/is, "");
          }
        } catch (e) {
          console.error("Délice AI - Erreur de parsing JSON :", e);
        }
      }

      // Final aggressive cleanup: Remove any [DATA] tags and specifically the Mistral-style [CONFIRMATION] tags
      cleanResponse = cleanResponse.replace(/\[ORDER_DATA:.*?\]/is, "")
        .replace(/\[CONFIRMATION.*?\]/gi, "")
        .replace(/\[.*?\]/g, "")
        .trim();

      if (structuredData) {
        try {
          const items = structuredData.items || [];
          const deliveryFee = structuredData.delivery || 0;
          const depositPct = structuredData.depositPercent || 50;

          let subtotal = items.reduce((sum, it) => sum + (it.price * it.qty), 0);
          let totalAmount = subtotal + deliveryFee;
          let depositToPay = Math.round(subtotal * (depositPct / 100));
          let remainingPay = subtotal - depositToPay;

          const confirmId = 'ai-confirm-' + Math.floor(Math.random() * 10000);
          const itemsHtml = items.map(it => `
            <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.95em; color:#333;">
              <span style="font-weight:500;">${it.qty}x ${it.name}</span>
              <span style="font-weight:700;">${(it.price * it.qty).toLocaleString('fr-FR')} FCFA</span>
            </div>
          `).join('');

          const confirmHtml = `
            <div class="chat-confirmation-box" style="margin-top:15px; background:#fff; border-radius:18px; border: 1px solid #ffdeed; box-shadow: 0 15px 35px rgba(232, 23, 138, 0.12); overflow:hidden; color:#1a0a14; animation: slideUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);">
              <div style="background: linear-gradient(135deg, #E8178A, #ff4d94); color:#fff; padding:12px 18px; font-weight:800; display:flex; align-items:center; gap:10px; font-size:0.9em; letter-spacing:0.5px;">
                <span class="material-symbols-outlined" style="font-size:1.3rem;">shopping_bag</span>
                <span>RÉCAPITULATIF DE VOTRE COMMANDE</span>
              </div>
              
              <div style="padding:18px;">
                <div style="margin-bottom:15px; border-bottom:1px dashed #eee; padding-bottom:12px;">
                  ${itemsHtml}
                </div>

                <div style="display:flex; justify-content:space-between; margin-top:10px; font-weight:700; font-size:1.05em; color:#1a0a14;">
                  <span>Sous-total</span>
                  <span>${subtotal.toLocaleString('fr-FR')} FCFA</span>
                </div>

                <div style="margin:12px 0; padding:12px; background:#fff5f9; border-radius:12px; border-left:5px solid #E8178A;">
                  <div style="display:flex; justify-content:space-between; font-size:0.95em; color:#E8178A; font-weight:800; margin-bottom:4px;">
                    <span>ACOMPTE 50% À PAYER</span>
                    <span>${depositToPay.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; font-size:0.85em; color:#777; font-weight:500;">
                    <span>Reliquat (paiement à la livraison)</span>
                    <span>${remainingPay.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>

                <div style="display:flex; justify-content:space-between; font-size:0.9em; color:#666; margin-bottom:18px; padding:0 4px;">
                  <span style="display:flex; align-items:center; gap:5px;"><span class="material-symbols-outlined" style="font-size:1rem;">local_shipping</span> ${deliveryFee > 0 ? 'Livraison à domicile' : 'Retrait en boutique'}</span>
                  <span style="font-weight:700; color:${deliveryFee > 0 ? '#1a0a14' : '#10b981'};">${deliveryFee > 0 ? deliveryFee.toLocaleString('fr-FR') + ' FCFA' : 'GRATUIT'}</span>
                </div>

                <div style="display:flex; justify-content:space-between; border-top:2px solid #1a0a14; padding-top:12px; font-weight:900; font-size:1.25em; color:#1a0a14;">
                  <span>TOTAL TTC</span>
                  <span style="color:#E8178A;">${totalAmount.toLocaleString('fr-FR')} FCFA</span>
                </div>

                <div style="margin-top:22px; display:flex; gap:12px;">
                  <button id="${confirmId}-yes" class="btn btn--primary" style="flex:2; padding:14px; font-size:0.95em; border-radius:12px; box-shadow: 0 4px 12px rgba(232, 23, 138, 0.2);">✅ Confirmer</button>
                  <button id="${confirmId}-no" class="btn btn--ghost" style="flex:1; padding:14px; font-size:0.9em; border-radius:12px; color:#E8178A; border:1px solid #E8178A; background:transparent;">❌ Annuler</button>
                </div>
              </div>
            </div>
          `;

          const promptChatLi = createChatLi('', 'incoming');
          promptChatLi.innerHTML = `<div class="chat-content">${confirmHtml}</div>`;
          chatbotMessages.appendChild(promptChatLi);
          chatbotMessages.scrollTo(0, chatbotMessages.scrollHeight);

          const finalOrder = {
            items: items.map(it => ({ ...it, totalPrice: it.price * it.qty })),
            totalAmount: totalAmount,
            depositAmount: depositToPay,
            note: `Commande via Délice AI Chat (${chatId})`,
            status: 'new',
            customer_id: getCustomerId()
          };

          document.getElementById(`${confirmId}-yes`).addEventListener('click', async (e) => {
            const btnContainer = e.target.parentElement;
            btnContainer.innerHTML = `<div style="width:100%; text-align:center; padding:10px;"><div class="typing-dots" style="margin:0 auto;"><span></span><span></span><span></span></div></div>`;

            try {
              if (typeof DataService === 'undefined' || !DataService.saveOrder) throw new Error("Service indisponible");
              const orderId = await DataService.saveOrder(finalOrder);
              if (orderId) {
                localStorage.setItem('delice_last_order_id', orderId);
                btnContainer.innerHTML = `<div style="text-align:center; padding:12px; background:#f0fdf4; border-radius:10px; color:#10b981; font-weight:800; border:1px solid #bcf0da; width:100%; animation: fadeInUp 0.3s ease;">C'est noté ! Commande #${orderId.slice(-4).toUpperCase()} transmise. 🎉</div>`;

                const summary = items.map(it => `${it.qty}x ${it.name}`).join(', ');
                const adminLink = window.location.origin + "/admin";
                const telegramMsg = `🍰 <b>COMMANDE IA OK !</b>\n👤 Client: <code>${finalOrder.customer_id.slice(-6)}</code>\n🛒 Items: ${summary}\n💰 Total: <b>${totalAmount.toLocaleString('fr-FR')} FCFA</b>\n💳 Acompte: ${depositToPay.toLocaleString('fr-FR')} FCFA\n\n<a href="${adminLink}">Ouvrir l'Admin</a>`;

                await sendTelegramNotification(telegramMsg);
                if (window.refreshOrderTracking) window.refreshOrderTracking();
              }
            } catch (err) {
              console.error("Order Save Error:", err);
              btnContainer.innerHTML = `<div style="color:#ef4444; font-size:0.85em; text-align:center; width:100%;">Désolé, erreur réseau. Veuillez réessayer.</div>`;
            }
          });

          document.getElementById(`${confirmId}-no`).addEventListener('click', (e) => {
            const box = e.target.parentElement.closest('.chat-confirmation-box');
            box.style.opacity = '0.5';
            box.style.filter = 'grayscale(1)';
            e.target.parentElement.innerHTML = `<div style="text-align:center; color:#666; font-style:italic; width:100%;">Commande annulée. On continue ?</div>`;
          });

        } catch (err) {
          console.error("Order Recap UI Creation Fail:", err);
        }
      }
      // --- END STRUCTURED ORDER DETECTION ---

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

  let chatHistoryMessages = [];
  let systemContext = "";

  async function initSystemContext() {
    try {
      const products = await DataService.getProducts();
      const activeProducts = products.filter(p => p.status === 'active');
      const kbContent = await DataService.getKnowledgeBase();

      console.log("Délice AI - Chargement des données dynamiques...");
      let productListText = activeProducts.map(p => `- ${p.name} : ${p.price} FCFA`).join("\n");

      systemContext = `# 📌 PROMPT SYSTÈME — CHATBOT DÉLICE CAKE

Tu es l’assistant officiel de la pâtisserie Délice Cake à Ouagadougou. 
Ta mission : guider le client vers une commande parfaite avec courtoisie et efficacité.

## 🎯 STYLE & RÈGLES
- Ton chaleureux, humain, phrases COURTES.
- Ne JAMAIS inventer de prix ou de produits.
- Tu parles uniquement en français.

## 📖 INFOS COMPLÉMENTAIRES (BASE ADMIN)
${kbContent || "Pâtisserie artisanale secteur 51 Sanyiri."}

## 🛒 MENU (PRIX RÉELS)
${productListText || "Gâteau (1500/part), Boules de neige (500/sac)"}

## 🛒 PROCESSUS DE COMMANDE
1. Demande : Nb personnes, Saveur, Date, Perso, Livraison ou Retrait.
2. Rappelle l'acompte de 50% obligatoire (Orange Money +22675270326).
3. Livraison partout à Ouaga : 1000 FCFA. Retrait gratuit à Sanyiri.

## 📌 RÈGLES TECHNIQUES (CRITIQUE)
Dès que tu as TOUTES les informations pour finaliser (Produit, qtés, prix total, mode de livraison), tu DOIS :
1. Envoyer ta réponse de confirmation normale.
2. Ajouter SILENCIEUSEMENT à la toute fin de ton message le bloc suivant :
[ORDER_DATA: {"items": [{"name": "Nom", "qty": 1, "price": 0}], "delivery": 1000, "depositPercent": 50}]
Remplacement : "items" par la liste des produits, "delivery" (1000 ou 0), "depositPercent" (toujours 50).
3. TRÈS IMPORTANT : Dis au client : "Veuillez cliquer sur le bouton 'Confirmer' ci-dessous pour enregistrer votre commande."`;
    } catch (e) {
      console.error("AI Context Init Fail:", e);
      systemContext = "Assistant Délice Cake.";
    }
  }

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
      max_tokens: 800,
      temperature: 0.6,
      top_p: 0.9,
      stream: false
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  initNotifications();

  // Proactive notification prompt after 4 seconds
  setTimeout(showProactiveNotifPrompt, 4000);
});

// Vercel Cache Busting Version: 08/03/2026 - Restoration v4 (Dynamic Context Fix)
