/**
 * about.js — About page
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeader('about');
  initFooter();
  applyTranslations();

  const { photo, gear, contact } = SITE.about;

  // Photo
  const photoEl = document.getElementById('about-photo');
  if (photoEl) {
    photoEl.src = photo;
    photoEl.alt = SITE.name;
    photoEl.onerror = function() {
      this.parentElement.innerHTML = '<div class="about-photo-placeholder">✦</div>';
    };
  }

  // Name
  const nameEl = document.getElementById('about-name');
  if (nameEl) nameEl.textContent = SITE.name;

  // Bio — from i18n
  const bioEl = document.getElementById('about-bio');
  if (bioEl) bioEl.textContent = t('about_bio');

  // Gear
  const gearEl = document.getElementById('gear-list');
  if (gearEl) gearEl.innerHTML = gear.map(g => `<li>${g}</li>`).join('');

  // Contact
  const contactEl = document.getElementById('contact-link');
  if (contactEl) {
    const isEmail = contact.includes('@');
    contactEl.href        = isEmail ? `mailto:${contact}` : contact;
    contactEl.dataset.i18n = 'about_cta';
    contactEl.textContent  = t('about_cta');
  }

  // Scroll reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
});
