/**
 * collections.js — Collections list page
 */
document.addEventListener('DOMContentLoaded', () => {
  initHeader('collections');
  initFooter();
  applyTranslations();

  const grid = document.getElementById('collections-grid');
  const countEl = document.getElementById('col-count');
  const loadingEl = document.getElementById('col-loading');
  const sortBtn = document.getElementById('sort-toggle');

  let manifest;
  try {
    manifest = loadManifest();
  } catch (e) {
    if (loadingEl) { loadingEl.textContent = e.message; loadingEl.style.color = '#d06040'; }
    return;
  }
  if (loadingEl) loadingEl.remove();

  let collections = [...manifest.collections];
  let sortAsc = false;

  if (countEl) countEl.textContent = `${collections.length} ${t('collections_series')}`;

  // ── TRI ──────────────────────────────────────────────────────
  function sortCollections() {
    collections.sort((a, b) => {
      const da = a.date || '0000';
      const db = b.date || '0000';
      return sortAsc ? da.localeCompare(db) : db.localeCompare(da);
    });
  }

  if (sortBtn) {
    sortBtn.addEventListener('click', () => {
      sortAsc = !sortAsc;
      sortBtn.textContent = sortAsc ? '↑ Date' : '↓ Date';
      renderGrid();
    });
  }

  // ── COVER PICKER ─────────────────────────────────────────────
  function pickCover(card, coverSrcs) {
    const coversDiv = card.querySelector('.col-card-covers');
    if (!coverSrcs || coverSrcs.length === 0) {
      coversDiv.innerHTML = '<div class="col-card-no-photo">✦</div>';
      return;
    }
    let landscapeFound = false;
    function testNext(idx) {
      if (landscapeFound || idx >= coverSrcs.length) {
        if (!landscapeFound) {
          coversDiv.innerHTML = coverSrcs.slice(0, 2).map(src =>
            `<img src="${src}" alt="" loading="lazy">`
          ).join('');
        }
        return;
      }
      const probe = new Image();
      probe.onload = () => {
        if (!landscapeFound) {
          if (probe.naturalWidth / probe.naturalHeight > 1.1) {
            landscapeFound = true;
            coversDiv.innerHTML = `<img src="${coverSrcs[idx]}" alt="" loading="lazy" style="width:100%">`;
          } else {
            testNext(idx + 1);
          }
        }
      };
      probe.onerror = () => testNext(idx + 1);
      probe.src = coverSrcs[idx];
    }
    testNext(0);
  }

  // ── RENDER ───────────────────────────────────────────────────
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.07 });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  function renderGrid() {
    grid.innerHTML = '';
    sortCollections();

    collections.forEach((col, idx) => {
      const card = document.createElement('a');
      card.className = 'col-card';
      card.href = `collection.html?id=${encodeURIComponent(col.id)}`;

      const allPhotos = col.allPhotos || [
        ...col.photos,
        ...col.subcollections.flatMap(s => s.photos)
      ];
      const photoCount = allPhotos.length;
      const photoLabel = photoCount === 1 ? t('col_photo') : t('col_photos');
      const dateStr = formatDate(col.date);

      card.innerHTML = `
        <div class="col-card-covers">
          <div class="col-card-no-photo" style="opacity:.25">…</div>
        </div>
        <div class="col-card-overlay">
          ${dateStr ? `<div class="col-card-date">${dateStr}</div>` : ''}
          <div class="col-card-title">${tField(col.title)}</div>
          <div class="col-card-meta">${photoCount} ${photoLabel}</div>
        </div>
      `;

      card.style.transitionDelay = `${Math.min(idx * 0.06, 0.45)}s`;
      grid.appendChild(card);
      io.observe(card);
      pickCover(card, col.covers);
    });
  }


  renderGrid();
  window.onLangChange = () => renderGrid();

});