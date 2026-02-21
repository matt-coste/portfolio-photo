#!/usr/bin/env node
/**
 * generate-manifest.js
 *
 * Conventions de nommage :
 *
 * COLLECTIONS (avec date) :
 *   Spain-Espagne~2026           → { en: "Spain", fr: "Espagne" }, date: "2026"
 *   San_Francisco~2024           → { en: "San Francisco", fr: "San Francisco" }, date: "2024"
 *   Vacation_trip_Italy-Vacance_en_Italie~2025 → { en: "Vacation trip Italy", fr: "Vacance en Italie" }, date: "2025"
 *
 * SOUS-DOSSIERS et PHOTOS (sans date) :
 *   Buildings-Bâtiments          → { en: "Buildings", fr: "Bâtiments" }
 *   Sagrada_Familia              → { en: "Sagrada Familia", fr: "Sagrada Familia" }
 *
 * DESCRIPTION.MD :
 *   ::en
 *   English description here.
 *   ::fr
 *   Description française ici.
 */

const fs = require('fs');
const path = require('path');

const COLLECTIONS_DIR = path.join(__dirname, 'assets', 'collections');
const OUTPUT_FILE = path.join(__dirname, 'js', 'manifest.js');
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

function isImage(name) { return IMAGE_EXTS.has(path.extname(name).toLowerCase()); }
function slugify(name) { return name.trim().replace(/\s+/g, '_'); }

// ── BILINGUAL HELPERS ─────────────────────────────────────────

// Gère la partie SANS date (sous-dossiers, photos, partie titre)
// "Spain-Espagne"            → { en: "Spain", fr: "Espagne" }
// "San_Francisco"            → { en: "San Francisco", fr: "San Francisco" }
// "Vacation_trip_Italy-Vacance_en_Italie" → { en: "Vacation trip Italy", fr: "Vacance en Italie" }
function parseBilingual(str) {
  const dashIdx = str.indexOf('-');
  if (dashIdx !== -1) {
    const en = str.slice(0, dashIdx).replace(/_/g, ' ').replace(/'/g, "'").trim();
    const fr = str.slice(dashIdx + 1).replace(/_/g, ' ').replace(/'/g, "'").trim();
    return { en, fr };
  }
  const clean = str.replace(/_/g, ' ').replace(/'/g, "'").trim();
  return { en: clean, fr: clean };
}

// Parse le dossier d'une collection : sépare le titre de la date via '~'
// "Spain-Espagne~2026"   → { title: { en: "Spain", fr: "Espagne" }, date: "2026" }
// "San_Francisco~2024"   → { title: { en: "San Francisco", fr: "San Francisco" }, date: "2024" }
// "No_Date_Folder"       → { title: { en: "No Date Folder", fr: "No Date Folder" }, date: null }
function parseCollectionFolder(folderName) {
  const tildeIdx = folderName.lastIndexOf('~');
  if (tildeIdx !== -1) {
    const titlePart = folderName.slice(0, tildeIdx);
    const datePart = folderName.slice(tildeIdx + 1);
    // Vérifier que la partie après ~ ressemble à une date
    if (/^\d{4}(-\d{2}(-\d{2})?)?$/.test(datePart)) {
      return { title: parseBilingual(titlePart), date: datePart };
    }
  }
  return { title: parseBilingual(folderName), date: null };
}

// Parse description.md — supporte les blocs ::en et ::fr dans n'importe quel ordre
// Tout ce qui suit ::en jusqu'au prochain ::fr (ou fin de fichier) = description EN
// Tout ce qui suit ::fr jusqu'au prochain ::en (ou fin de fichier) = description FR
// Si aucun marqueur → même texte pour les deux langues
function readMarkdown(dir) {
  const mdPath = path.join(dir, 'description.md');
  if (!fs.existsSync(mdPath)) return null;
  const content = fs.readFileSync(mdPath, 'utf8').trim();

  const enMatch = content.match(/::en\s*([\s\S]*?)(?=::fr|$)/);
  const frMatch = content.match(/::fr\s*([\s\S]*?)(?=::en|$)/);

  if (enMatch || frMatch) {
    return {
      en: enMatch ? enMatch[1].trim() : '',
      fr: frMatch ? frMatch[1].trim() : '',
    };
  }
  // Pas de marqueur → même texte dans les deux langues
  return { en: content, fr: content };
}

// ── MAIN ──────────────────────────────────────────────────────
function scan() {
  if (!fs.existsSync(COLLECTIONS_DIR)) {
    console.error('Folder not found: ' + COLLECTIONS_DIR);
    process.exit(1);
  }

  const collections = fs.readdirSync(COLLECTIONS_DIR)
    .filter(n => fs.statSync(path.join(COLLECTIONS_DIR, n)).isDirectory())
    .sort()
    .map(folderName => {
      const colDir = path.join(COLLECTIONS_DIR, folderName);
      const { title, date } = parseCollectionFolder(folderName);
      const description = readMarkdown(colDir);
      const id = slugify(folderName);
      const children = fs.readdirSync(colDir).sort();

      // Images directes — label bilingue depuis le nom de fichier
      const directImages = children.filter(isImage).map(name => ({
        filename: name,
        src: `assets/collections/${folderName}/${name}`,
        label: parseBilingual(path.basename(name, path.extname(name))),
      }));

      // Sous-collections — titre et labels bilingues
      const subcollections = children
        .filter(n => fs.statSync(path.join(colDir, n)).isDirectory())
        .map(subName => {
          const subDir = path.join(colDir, subName);
          const photos = fs.readdirSync(subDir)
            .filter(isImage)
            .sort()
            .map(name => ({
              filename: name,
              src: `assets/collections/${folderName}/${subName}/${name}`,
              label: parseBilingual(path.basename(name, path.extname(name))),
            }));
          return {
            id: slugify(subName),
            title: parseBilingual(subName.trim()),
            description: readMarkdown(subDir),
            photos,
          };
        });

      // Toutes les images disponibles pour la cover (directes + sous-collections)
      const allAvailable = [
        ...directImages,
        ...subcollections.flatMap(s => s.photos),
      ];
      const covers = allAvailable.map(i => i.src);
      const allPhotos = [...directImages, ...subcollections.flatMap(s => s.photos)];

      return {
        id,
        folderName,
        title,
        date,
        description,
        covers,
        photos: directImages,
        subcollections,
        allPhotos,
      };
    });

  // Shuffle et sélection pour le home feed (max 4 par collection)
  const homeFeed = [];
  collections.forEach(col => {
    const pool = [...col.allPhotos];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    pool.slice(0, 4).forEach(p => homeFeed.push({ ...p, collectionId: col.id }));
  });
  for (let i = homeFeed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [homeFeed[i], homeFeed[j]] = [homeFeed[j], homeFeed[i]];
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  const payload = JSON.stringify({ collections, homeFeed }, null, 2);
  fs.writeFileSync(
    OUTPUT_FILE,
    `// Auto-generated by generate-manifest.js — do not edit manually.\n// Re-run: node generate-manifest.js\nwindow.MANIFEST = ${payload};\n`,
    'utf8'
  );
  console.log('Manifest written to js/manifest.js');
  console.log('  ' + collections.length + ' collection(s), ' + homeFeed.length + ' home photos.');
}

scan();