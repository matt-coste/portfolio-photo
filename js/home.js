/**
 * home.js — Home page
 * Layout : justified grid (rangées de hauteur fixe, photos pleine largeur)
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeader('home');
  initFooter();

  // ── HERO ──────────────────────────────────────────────────
  document.querySelectorAll('.hero-word').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.13}s`;
    setTimeout(() => el.classList.add('visible'), 80 + i * 130);
  });

  applyTranslations();
  document.getElementById('hero-name').textContent = SITE.name;

  // ── HERO BG ───────────────────────────────────────────────
  const heroBgWrap = document.getElementById('hero-bg');
  if (heroBgWrap && SITE.heroBg) {
    const img = document.createElement('img');
    img.src = SITE.heroBg;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.onerror = () => heroBgWrap.remove();
    heroBgWrap.appendChild(img);
  } else if (heroBgWrap) {
    heroBgWrap.remove();
  }

  // ── MANIFEST ──────────────────────────────────────────────
  const strip = document.getElementById('feed-strip');
  const countEl = document.getElementById('feed-count');
  const loadingEl = document.getElementById('feed-loading');

  let manifest;
  try {
    manifest = loadManifest();
  } catch (e) {
    if (loadingEl) { loadingEl.textContent = e.message; loadingEl.style.color = '#d06040'; }
    return;
  }

  let feed = [...manifest.homeFeed];
  // Shuffle
  for (let i = feed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [feed[i], feed[j]] = [feed[j], feed[i]];
  }

  if (loadingEl) loadingEl.remove();
  // if (countEl) countEl.textContent = `${feed.length} ${t('col_photos')}`;

  const collectionMap = {};
  manifest.collections.forEach(c => { collectionMap[c.id] = c.title; });

  // ── JUSTIFIED GRID ────────────────────────────────────────
  // On charge d'abord toutes les images pour connaître leurs ratios,
  // puis on construit les rangées.

  const TARGET_ROW_H = Math.round(window.innerHeight * 0.38); // hauteur cible ~38vh
  const MIN_ROW_H = 180;
  const MAX_ROW_H = 560;
  const GAP = 4; // px entre photos (doit correspondre au CSS)

  // 1. Charger les images et collecter les ratios
  let loaded = 0;
  const items = feed.map(photo => ({
    photo,
    ratio: null, // width/height, rempli après chargement
    el: null,    // élément DOM, créé après
  }));

  if (items.length === 0) return;

  items.forEach((item, idx) => {
    const img = new Image();
    img.onload = () => {
      item.ratio = img.naturalWidth / img.naturalHeight;
      loaded++;
      if (loaded === items.length) buildGrid();
    };
    img.onerror = () => {
      item.ratio = 1.5; // fallback landscape
      loaded++;
      if (loaded === items.length) buildGrid();
    };
    img.src = item.photo.src;
  });

  // 2. Construire les rangées une fois tous les ratios connus
  function buildGrid() {
    // Largeur disponible (strip sans padding)
    const stripPad = parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue('--pad')) || 48;
    const availW = strip.clientWidth - stripPad * 2;

    // Exclure les photos portrait (ratio < 0.95) du layout justifié
    const landscapeItems = items.filter(item => (item.ratio || 1.5) >= 0.65);
    if (countEl) countEl.textContent = `${landscapeItems.length} ${t('col_photos')}`;
    const rows = makeRows(landscapeItems, availW, TARGET_ROW_H, GAP);

    // Créer le DOM
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.05 });

    rows.forEach((row, rowIdx) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'feed-row';
      rowEl.style.height = row.height + 'px';

      row.items.forEach((item, colIdx) => {
        const itemEl = document.createElement('div');
        itemEl.dataset.collectionId = item.photo.collectionId || '';
        itemEl.className = 'feed-item';
        itemEl.style.width = item.width + 'px';
        itemEl.style.height = row.height + 'px';
        itemEl.style.transitionDelay = `${Math.min((rowIdx * 3 + colIdx) * 0.05, 0.5)}s`;

        const img = document.createElement('img');
        img.src = item.photo.src;
        img.alt = tField(item.photo.label) || '';
        img.loading = 'lazy';

        const label = document.createElement('div');
        label.className = 'feed-item-label';
        label.textContent = tField(collectionMap[item.photo.collectionId]) || '';

        itemEl.appendChild(img);
        itemEl.appendChild(label);

        const idx = feed.indexOf(item.photo);
        itemEl.addEventListener('click', () => {
          Lightbox.open(
            feed.map(p => ({ src: p.src, label: tField(p.label), collectionId: p.collectionId })),
            idx
          );
        });

        rowEl.appendChild(itemEl);
        io.observe(itemEl);
      });

      strip.appendChild(rowEl);
    });
  }

  // ── ALGORITHME DE JUSTIFICATION ───────────────────────────
  //
  // Pour chaque rangée :
  // 1. Accumuler des photos jusqu'à ce que leur largeur totale
  //    (à hauteur cible) dépasse la largeur disponible.
  // 2. Calculer la hauteur réelle qui fait exactement remplir la rangée.
  // 3. Dériver la largeur de chaque photo depuis cette hauteur.
  //
  function makeRows(allItems, availW, targetH, gap) {
    const rows = [];
    let start = 0;

    while (start < allItems.length) {
      let end = start;
      let totalRatio = 0;

      // Avancer jusqu'à remplir la rangée (ou fin des photos)
      while (end < allItems.length) {
        const r = allItems[end].ratio || 1.5;
        const projectedW = (totalRatio + r) * targetH + gap * (end - start);
        totalRatio += r;
        end++;
        if (projectedW >= availW) break;
      }

      // Hauteur réelle pour que la somme des largeurs = availW
      // sumW = sumRatios * H + gaps  =>  H = (availW - gaps) / sumRatios
      const gapsInRow = (end - start - 1) * gap;
      const rowH = Math.min(MAX_ROW_H, Math.max(MIN_ROW_H,
        Math.round((availW - gapsInRow) / totalRatio)
      ));

      // Largeurs entières — distribuer l'arrondi sur la dernière photo
      let usedW = 0;
      const rowItems = allItems.slice(start, end).map((item, i, arr) => {
        let w;
        if (i === arr.length - 1) {
          // Dernière photo : prend le reste pour éviter le pixel gap
          w = availW - usedW - gap * (arr.length - 1);
        } else {
          w = Math.round((item.ratio || 1.5) * rowH);
          usedW += w;
        }
        return { ...item, width: w };
      });

      rows.push({ height: rowH, items: rowItems });
      start = end;
    }

    return rows;
  }

  // Ajoute à la fin du DOMContentLoaded, après buildGrid()
  window.onLangChange = () => {
    document.querySelectorAll('.feed-item-label').forEach(el => {
      const colId = el.closest('.feed-item')?.dataset.collectionId;
      if (colId) el.textContent = tField(collectionMap[colId]) || '';
    });
    applyTranslations();
  };
});