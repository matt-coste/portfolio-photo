/**
 * global.js — Shared across all pages
 * Handles: SITE config, i18n (FR/EN), theme (dark/light),
 *          manifest loader, header, footer, lightbox
 */


// ══════════════════════════════════════════════════════════════
// BOOT — S'exécute immédiatement, avant tout le reste
// ══════════════════════════════════════════════════════════════
(function () {
  const theme = localStorage.getItem('theme') || 'dark';
  const lang = localStorage.getItem('lang') || 'en';
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('lang', lang === 'fr' ? 'fr' : 'en');
})();


// ══════════════════════════════════════════════════════════════
// SITE CONFIG — Edit this section
// ══════════════════════════════════════════════════════════════
const SITE = {
  name: "Matt C.",

  // Hero background photo (home page). Set to null to disable.
  heroBg: "assets/main_background.jpg",

  socials: [
    { label: "Instagram", url: "https://instagram.com/matt_cste" },
    { label: "Vsco", url: "https://vsco.co/yourhandle" },
    { label: "Email", url: "mailto:you@example.com" },
  ],

  about: {
    photo: "assets/about.jpg",
    gear: [
      "Sony A6700",
      "Tamron 17-70mm f/2.8 DI III-A VC RXD",
      "Sony E 70-350mm f/4.5-6.3 G OSS",
      "Freewell M2 82mm 5 Pack + Glow Mist 1/4",
    ],
    contact: "mc.mattcoste@gmail.com",
  },
};

// ══════════════════════════════════════════════════════════════
// i18n — Translations
// ══════════════════════════════════════════════════════════════
const I18N = {
  en: {
    // Navigation
    nav_home: "Home",
    nav_collections: "Collections",
    nav_about: "About",

    // Home
    hero_line1: "The",
    hero_line2: "frame",
    hero_line3: "is everything.",
    hero_sub: "Photography by",
    feed_label: "Selected work",
    loading: "Loading photos…",

    // Collections
    collections_label: "Archive",
    collections_title: "Collections",
    collections_series: "series",
    col_photos: "photos",
    col_photo: "photo",

    // Collection detail
    col_back: "Collections",
    col_label: "Series",
    col_tab_all: "All",
    col_stat_photos: "Photos",
    col_stat_subs: "Subcollections",

    // About
    about_label: "Photographer",
    about_gear: "Equipment",
    about_contact: "Contact",
    about_cta: "Get in touch →",
    about_bio: `Amateur photographer based in Toulouse, I currently work as a software engineer, but I am deeply passionate about imagery and visual storytelling.

Photography is much more than a hobby to me — it is a life project. My ambition is to become a professional photographer and turn this passion into my main career.

Curious and open to all fields, I’m interested in many areas: events, sports, automotive, wildlife, portrait… Some of them I already explore; others are still waiting to be experienced. Each represents an opportunity for me to learn, grow, and tell new stories.
I’m also interested in video, with the long-term goal of creating documentaries.`,
    // Lightbox
    lb_view_col: "→ View collection",

    // Footer
    footer_rights: "All rights reserved",
  },

  fr: {
    // Navigation
    nav_home: "Accueil",
    nav_collections: "Collections",
    nav_about: "À propos",

    // Home
    hero_line1: "Le",
    hero_line2: "cadre",
    hero_line3: "est essentiel.",
    hero_sub: "Photographie par",
    feed_label: "Sélection",
    loading: "Chargement…",

    // Collections
    collections_label: "Archives",
    collections_title: "Collections",
    collections_series: "séries",
    col_photos: "photos",
    col_photo: "photo",

    // Collection detail
    col_back: "Collections",
    col_label: "Série",
    col_tab_all: "Tout",
    col_stat_photos: "Photos",
    col_stat_subs: "Sous-collections",

    // About
    about_label: "Photographe",
    about_gear: "Équipement",
    about_contact: "Contact",
    about_cta: "Me contacter →",
    about_bio: `Photographe amateur basé à Toulouse, je suis actuellement ingénieur logiciel de métier, mais profondément passionné par l’image et la narration visuelle.

La photographie est bien plus qu’un loisir pour moi : c’est un projet de vie. Mon ambition est de devenir photographe professionnel et de faire de cette passion mon activité principale.

Curieux et ouvert à tous les univers, je m’intéresse à de nombreux domaines : événementiel, sport, automobile, animalier, portrait… Certains, je les explore déjà ; d’autres restent encore à expérimenter. Mais chacun représente pour moi une opportunité d’apprendre, de progresser et de raconter de nouvelles histoires.
Je m’intéresse également à la vidéo, avec l’envie, à terme, de réaliser des documentaires.`,

    // Lightbox
    lb_view_col: "→ Voir la collection",

    // Footer
    footer_rights: "Tous droits réservés",
  },
};

// ══════════════════════════════════════════════════════════════
// STATE — Theme & Lang (persisted in localStorage)
// ══════════════════════════════════════════════════════════════
const State = {
  _theme: localStorage.getItem('theme') || 'dark',
  _lang: localStorage.getItem('lang') || 'en',

  get theme() { return this._theme; },
  get lang() { return this._lang; },

  setTheme(t) {
    this._theme = t;
    localStorage.setItem('theme', t);
    document.documentElement.setAttribute('data-theme', t);
    // Update toggle icon
    const btn = document.querySelector('.theme-toggle');
    if (btn) btn.textContent = t === 'dark' ? '☀' : '☾';
  },

  setLang(l) {
    this._lang = l;
    localStorage.setItem('lang', l);
    document.documentElement.setAttribute('lang', l === 'fr' ? 'fr' : 'en');
    applyTranslations();
    const btn = document.querySelector('.lang-toggle');
    if (btn) btn.textContent = l === 'en' ? 'FR' : 'EN';
    // Hook : si la page courante expose une fonction de re-rendu, l'appeler
    if (typeof window.onLangChange === 'function') window.onLangChange();
  },

  toggleTheme() { this.setTheme(this._theme === 'dark' ? 'light' : 'dark'); },
  toggleLang() { this.setLang(this._lang === 'en' ? 'fr' : 'en'); },
};

// Shorthand to get a translation string
function t(key) {
  return (I18N[State.lang] || I18N.en)[key] || key;
}

// Ajoute cette fonction après la définition de t()
function tField(field) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[State.lang] || field.en || '';
}

// Apply data-i18n attributes
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}

// ══════════════════════════════════════════════════════════════
// MANIFEST LOADER
// ══════════════════════════════════════════════════════════════
function loadManifest() {
  if (!window.MANIFEST) {
    throw new Error(
      'manifest.js introuvable. Lancez : node generate-manifest.js — puis rechargez.'
    );
  }
  return window.MANIFEST;
}

// ══════════════════════════════════════════════════════════════
// HEADER
// ══════════════════════════════════════════════════════════════
function initHeader(activePage) {
  const pages = [
    { id: 'home', key: 'nav_home', href: 'index.html' },
    { id: 'collections', key: 'nav_collections', href: 'collections.html' },
    { id: 'about', key: 'nav_about', href: 'about.html' },
  ];

  const header = document.getElementById('site-header');
  if (!header) return;

  const themeIcon = State.theme === 'dark' ? '☀' : '☾';
  const langLabel = State.lang === 'en' ? 'FR' : 'EN';

  header.innerHTML = `
    <a class="site-logo" href="index.html">${SITE.name}</a>
    <div class="header-right">
      <nav>
        <ul class="site-nav">
          ${pages.map(p => `
            <li>
              <a href="${p.href}"
                 data-i18n="${p.key}"
                 ${p.id === activePage ? 'class="active"' : ''}>
                ${t(p.key)}
              </a>
            </li>
          `).join('')}
        </ul>
      </nav>
      <div class="header-controls">
        <button class="theme-toggle" id="theme-toggle" title="Toggle theme">${themeIcon}</button>
        <button class="lang-toggle"  id="lang-toggle">${langLabel}</button>
      </div>
    </div>
  `;

  document.getElementById('theme-toggle').addEventListener('click', () => State.toggleTheme());
  document.getElementById('lang-toggle').addEventListener('click', () => State.toggleLang());
}

// ══════════════════════════════════════════════════════════════
// FOOTER
// ══════════════════════════════════════════════════════════════
function initFooter() {
  const footer = document.getElementById('site-footer');
  if (!footer) return;
  footer.innerHTML = `
    <span class="footer-copy">© ${new Date().getFullYear()} ${SITE.name} — <span data-i18n="footer_rights">${t('footer_rights')}</span></span>
    <div class="footer-socials">
      ${SITE.socials.map(s =>
    `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`
  ).join('')}
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════
// LIGHTBOX
// ══════════════════════════════════════════════════════════════
const Lightbox = (() => {
  let photos = [], current = 0;

  const el = document.getElementById('lightbox');
  const imgEl = document.getElementById('lightbox-img');
  const captionEl = document.getElementById('lightbox-caption');
  const goBtn = document.getElementById('lightbox-go-btn');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  function show() {
    const p = photos[current];
    imgEl.style.opacity = '1';
    imgEl.src = p.src;
    captionEl.textContent = p.label || '';
    captionEl.style.display = p.label ? 'block' : 'none';
    if (p.collectionId) {
      goBtn.style.display = 'inline-block';
      goBtn.textContent = t('lb_view_col');
      goBtn.onclick = () => { close(); window.location.href = `collection.html?id=${encodeURIComponent(p.collectionId)}`; };
    } else {
      goBtn.style.display = 'none';
    }
    el.classList.toggle('has-nav', photos.length > 1);
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function open(photoList, index) { photos = photoList; current = index; show(); }

  function close() {
    el.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { imgEl.src = ''; }, 300);
  }

  function step(dir) {
    current = (current + dir + photos.length) % photos.length;
    imgEl.style.opacity = '0';
    setTimeout(show, 150);
  }

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (prevBtn) prevBtn.addEventListener('click', () => step(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => step(1));
  if (el) el.addEventListener('click', e => { if (e.target === el) close(); });
  document.addEventListener('keydown', e => {
    if (!el?.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  return { open, close };
})();

// ══════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  if (!month) return year;
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  const locale = State.lang === 'fr' ? 'fr-FR' : 'en-US';
  return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

function getOrientation(img) {
  const r = img.naturalWidth / img.naturalHeight;
  if (r < 0.85) return 'portrait';
  if (r > 1.15) return 'landscape';
  return 'square';
}

// Simpler version without self-reference issue:
function revealOnScroll(elements, threshold = 0.07) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold });
  elements.forEach(el => io.observe(el));
  return io;
}

