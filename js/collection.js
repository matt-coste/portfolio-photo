/**
 * collection.js — Single collection page
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeader('collections');
  initFooter();
  applyTranslations();

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const titleEl = document.getElementById('col-title');
  const pillsEl = document.getElementById('col-pills');
  const descEl = document.getElementById('col-description');
  const statsEl = document.getElementById('col-stats');
  const tabsWrap = document.getElementById('sub-tabs-wrap');
  const subDescEl = document.getElementById('sub-desc');
  const gridEl = document.getElementById('col-photos-grid');
  const labelEl = document.getElementById('col-series-label');
  const backEl = document.getElementById('col-back');

  if (labelEl) labelEl.textContent = t('col_label');
  if (backEl) backEl.textContent = t('col_back');

  let manifest;
  try { manifest = loadManifest(); }
  catch (e) { if (titleEl) titleEl.textContent = e.message; return; }

  const col = manifest.collections.find(c => c.id === id);
  if (!col) { if (titleEl) titleEl.textContent = 'Collection not found.'; return; }

  // ── TITRE ─────────────────────────────────────────────────
  const colTitle = tField(col.title);
  document.title = `${colTitle} — ${SITE.name}`;
  if (titleEl) titleEl.textContent = colTitle;

  // ── DATE PILL ─────────────────────────────────────────────
  if (col.date && pillsEl) {
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = formatDate(col.date);
    pillsEl.appendChild(pill);
  }

  // ── DESCRIPTION ───────────────────────────────────────────
  if (descEl) {
    const desc = tField(col.description);
    if (desc) {
      descEl.innerHTML = mdLight(desc);
      descEl.style.display = 'block';
    } else {
      descEl.style.display = 'none';
    }
  }

  // ── STATS ─────────────────────────────────────────────────
  const allPhotos = col.allPhotos || [
    ...col.photos,
    ...col.subcollections.flatMap(s => s.photos)
  ];
  const total = allPhotos.length;

  if (statsEl) {
    statsEl.innerHTML = `
      <span>${t('col_stat_photos')} <span>${total}</span></span>
      ${col.subcollections.length
        ? `<span>${t('col_stat_subs')} <span>${col.subcollections.length}</span></span>`
        : ''}
    `;
  }

  // ── ONGLETS SOUS-COLLECTIONS ──────────────────────────────
  const hasSubs = col.subcollections?.length > 0;
  if (hasSubs && tabsWrap) {
    tabsWrap.style.display = 'flex';

    const makeTab = (subId, label) => {
      const btn = document.createElement('button');
      btn.className = 'sub-tab';
      btn.dataset.subId = subId;
      btn.textContent = label;
      return btn;
    };

    const allTab = makeTab('all', t('col_tab_all'));
    allTab.classList.add('active');
    tabsWrap.appendChild(allTab);

    // tField() pour éviter [object Object]
    col.subcollections.forEach(sub =>
      tabsWrap.appendChild(makeTab(sub.id, tField(sub.title)))
    );

    tabsWrap.addEventListener('click', e => {
      const btn = e.target.closest('.sub-tab');
      if (!btn) return;
      tabsWrap.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const subId = btn.dataset.subId;
      const sub = subId === 'all' ? null : col.subcollections.find(s => s.id === subId);
      renderPhotos(sub ? sub.photos : getAll(col), sub);
    });
  }

  // ── INTERSECTION OBSERVER ─────────────────────────────────
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.05 });

  function getAll(collection) {
    const direct = [...collection.photos].sort((a, b) => a.filename.localeCompare(b.filename));
    const subs = collection.subcollections.flatMap(
      s => [...s.photos].sort((a, b) => a.filename.localeCompare(b.filename))
    );
    return [...direct, ...subs];
  }

  function renderPhotos(photos, sub) {
    gridEl.innerHTML = '';

    // Description de sous-collection
    if (subDescEl) {
      const subDesc = sub ? tField(sub.description) : '';
      if (subDesc) {
        subDescEl.innerHTML = mdLight(subDesc);
        subDescEl.style.display = 'block';
      } else {
        subDescEl.style.display = 'none';
      }
    }

    const sorted = [...photos].sort((a, b) => a.filename.localeCompare(b.filename));

    sorted.forEach((photo, idx) => {
      const item = document.createElement('div');
      item.className = 'col-photo-item';
      item.style.transitionDelay = `${Math.min(idx * 0.04, 0.35)}s`;

      const caption = tField(photo.label);

      item.innerHTML = `
        <img src="${photo.src}" alt="${caption}" loading="lazy"
             onerror="this.closest('.col-photo-item').style.display='none'">
        ${caption ? `<div class="col-photo-caption">${caption}</div>` : ''}
      `;

      item.addEventListener('click', () => {
        Lightbox.open(
          sorted.map(p => ({ src: p.src, label: tField(p.label), collectionId: null })),
          idx
        );
      });

      gridEl.appendChild(item);
      io.observe(item);
    });
  }

  renderPhotos(getAll(col), null);

  window.onLangChange = () => {
    // Titre
    const colTitle = tField(col.title);
    document.title = `${colTitle} — ${SITE.name}`;
    if (titleEl) titleEl.textContent = colTitle;

    // Description collection
    if (descEl) {
      const desc = tField(col.description);
      if (desc) { descEl.innerHTML = mdLight(desc); descEl.style.display = 'block'; }
      else descEl.style.display = 'none';
    }

    // Onglets sous-collections — mettre à jour les labels
    if (tabsWrap) {
      tabsWrap.querySelectorAll('.sub-tab').forEach(btn => {
        const subId = btn.dataset.subId;
        if (subId === 'all') {
          btn.textContent = t('col_tab_all');
        } else {
          const sub = col.subcollections.find(s => s.id === subId);
          if (sub) btn.textContent = tField(sub.title);
        }
      });
    }

    // Re-rendre les photos avec les nouvelles captions
    // Trouver l'onglet actif
    const activeTab = tabsWrap?.querySelector('.sub-tab.active');
    const activeSubId = activeTab?.dataset.subId || 'all';
    const activeSub = activeSubId === 'all'
      ? null
      : col.subcollections.find(s => s.id === activeSubId);
    renderPhotos(activeSub ? activeSub.photos : getAll(col), activeSub);

    // Éléments statiques traduits
    if (labelEl) labelEl.textContent = t('col_label');
    if (backEl) backEl.textContent = t('col_back');
  };
});

// Markdown minimal : **bold**, *italic*, sauts de ligne → <br>
function mdLight(str) {
  if (!str) return '';
  return str
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}