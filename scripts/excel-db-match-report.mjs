// One-off analysis: map Excel "AMS final baza" rows to DB products and check
// Cloudinary image coverage. Emits two CSVs in reports/:
//   excel-match-matched.csv   — Excel rows that matched a DB product (any method)
//   excel-match-unmatched.csv — Excel rows with no DB match (user will handle manually)
//
// Excel structure (FINAL!-2.xlsx): rows fall into two shapes.
//   - Section header: NAZIV is the parent product name, IDENT and EAN are blank.
//     These define a "collapsed group" on the storefront. We carry the parent
//     NAZIV forward as parent_naziv for the children that follow. Section
//     headers are not matched against products (they have no IDENT) — they're
//     summarized at the end and don't appear in unmatched.csv.
//   - Variant / standalone product: IDENT and EAN populated. NAZIV may be the
//     full product name (standalone) or a short color code like "1NN" (variant
//     under the most recent section header).
//
// Match priority per Excel row with IDENT:
//   1) sku == Excel IDENT           (deterministic; sku covers all 3306 DB rows)
//   2) barcode == Excel EAN CODE    (only 17 DB rows carry barcode; rare)
//   3) normalized name match        (Excel NAZIV vs name_lat / name_cyr)
//
// Photo coverage is reported at two levels:
//   - product:  cloudinary image count on the matched DB product
//   - group:    cloudinary image count across the group_slug (so collapsed
//               variants don't read as "missing photos" when the group has them)

import XLSX from 'xlsx';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const EXCEL_PATH = '/Users/nikola/Downloads/AMS sajt 2026. baza B2C i B2B, FINAL!-2.xlsx';
const SHEET_NAME = 'AMS final baza';
const DB_URL =
  'postgresql://altamoda_db_2_1_user:omS84aCvmFrC4zAw4SQuVIcr5s6Jdfnc@dpg-d8jicf6gvqtc73c2hgig-a.frankfurt-postgres.render.com/altamoda_db_2_1';

const OUT_DIR = resolve(REPO_ROOT, 'reports');
const OUT_MATCHED = resolve(OUT_DIR, 'excel-match-matched.csv');
const OUT_UNMATCHED = resolve(OUT_DIR, 'excel-match-unmatched.csv');

function normName(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function csvField(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCsv(path, headers, rows) {
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(headers.map((h) => csvField(r[h])).join(','));
  writeFileSync(path, lines.join('\n') + '\n', 'utf8');
}

function readExcel() {
  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets[SHEET_NAME];
  if (!ws) throw new Error(`Sheet "${SHEET_NAME}" not found in ${EXCEL_PATH}`);
  const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
  const out = [];
  let currentParent = '';
  for (let idx = 0; idx < raw.length; idx++) {
    const r = raw[idx];
    const row = {
      excel_row: idx + 2,
      ident: String(r['IDENT'] ?? '').trim(),
      ean: String(r['EAN CODE'] ?? '').trim(),
      naziv: String(r['NAZIV'] ?? '').trim(),
      brend: String(r['BREND'] ?? '').trim(),
      kategorija: String(r['KATEGORIJA'] ?? '').trim(),
      potkategorija: String(r['POTKATEGORIJA'] ?? '').trim(),
      tip_proizvoda: String(r['TIP PROIZVODA'] ?? '').trim(),
    };
    if (!row.ident && !row.ean && !row.naziv) continue;
    if (!row.ident && !row.ean && row.naziv) {
      currentParent = row.naziv;
      row.kind = 'section_header';
      row.parent_naziv = '';
      out.push(row);
      continue;
    }
    // Product row. Distinguish standalone vs collapsed-group variant:
    //   - standalone: NAZIV starts with the BREND (e.g. "Biolage Full Rescue...")
    //   - variant:    NAZIV is a short color/shade code (e.g. "1NN", "10HC/10.64")
    // Standalone resets the carried parent so it doesn't leak to unrelated rows.
    const nazivL = row.naziv.toLowerCase();
    const brendL = row.brend.toLowerCase();
    const isStandalone = brendL && nazivL.startsWith(brendL.split(' ')[0]);
    row.kind = 'product';
    if (isStandalone) {
      currentParent = '';
      row.parent_naziv = '';
    } else {
      row.parent_naziv = currentParent;
    }
    out.push(row);
  }
  return out;
}

async function loadDb(client) {
  const { rows: products } = await client.query(`
    SELECT id, sku, barcode, name_lat, name_cyr, slug, group_slug,
           color_code, color_name, is_active
    FROM products
  `);
  const { rows: imageRows } = await client.query(`
    SELECT product_id, url, is_primary, sort_order
    FROM product_images
  `);

  const bySku = new Map();
  const byBarcode = new Map();
  const byName = new Map();
  const byId = new Map();
  for (const p of products) {
    byId.set(p.id, p);
    if (p.sku) {
      const k = String(p.sku).trim();
      if (!bySku.has(k)) bySku.set(k, []);
      bySku.get(k).push(p);
    }
    if (p.barcode) {
      const k = String(p.barcode).trim();
      if (!byBarcode.has(k)) byBarcode.set(k, []);
      byBarcode.get(k).push(p);
    }
    const nLat = normName(p.name_lat);
    if (nLat) {
      if (!byName.has(nLat)) byName.set(nLat, []);
      byName.get(nLat).push(p);
    }
    const nCyr = normName(p.name_cyr);
    if (nCyr && nCyr !== nLat) {
      if (!byName.has(nCyr)) byName.set(nCyr, []);
      byName.get(nCyr).push(p);
    }
  }

  // Per-product image aggregates
  const imagesByProduct = new Map();
  for (const im of imageRows) {
    if (!imagesByProduct.has(im.product_id)) imagesByProduct.set(im.product_id, []);
    imagesByProduct.get(im.product_id).push(im);
  }

  // Per-group_slug aggregates (sum of cloudinary urls across all variants)
  const productsByGroup = new Map();
  for (const p of products) {
    if (!p.group_slug) continue;
    if (!productsByGroup.has(p.group_slug)) productsByGroup.set(p.group_slug, []);
    productsByGroup.get(p.group_slug).push(p);
  }
  const groupStats = new Map();
  for (const [gs, list] of productsByGroup) {
    let total = 0;
    let cloud = 0;
    let sampleUrl = '';
    for (const p of list) {
      const imgs = imagesByProduct.get(p.id) || [];
      total += imgs.length;
      for (const im of imgs) {
        if (im.url && im.url.includes('cloudinary')) {
          cloud++;
          if (!sampleUrl) sampleUrl = im.url;
        } else if (!sampleUrl && im.url) {
          sampleUrl = im.url;
        }
      }
    }
    groupStats.set(gs, { total, cloud, sampleUrl, variantCount: list.length });
  }

  return { products, byId, bySku, byBarcode, byName, imagesByProduct, groupStats };
}

function pickBest(list) {
  if (!list || list.length === 0) return null;
  // Prefer active rows, then ones with photos handled elsewhere
  const active = list.filter((p) => p.is_active);
  return active[0] || list[0];
}

function summarizeProductImages(product, db) {
  const imgs = db.imagesByProduct.get(product.id) || [];
  let cloud = 0;
  let sample = '';
  for (const im of imgs) {
    if (im.url && im.url.includes('cloudinary')) {
      cloud++;
      if (!sample) sample = im.url;
    } else if (!sample && im.url) sample = im.url;
  }
  return { total: imgs.length, cloud, sample };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const excelRows = readExcel();
  console.log(`Excel: ${excelRows.length} product rows`);

  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const db = await loadDb(client);
  console.log(
    `DB: ${db.products.length} products, ${db.groupStats.size} groups, ${db.imagesByProduct.size} products have images`,
  );

  const matched = [];
  const unmatched = [];
  const sectionHeaders = [];

  for (const row of excelRows) {
    if (row.kind === 'section_header') {
      sectionHeaders.push(row);
      continue;
    }
    let matchMethod = '';
    let product = null;

    // 1. sku == IDENT
    if (row.ident && db.bySku.has(row.ident)) {
      product = pickBest(db.bySku.get(row.ident));
      matchMethod = 'sku';
    }
    // 2. barcode == EAN
    if (!product && row.ean && db.byBarcode.has(row.ean)) {
      product = pickBest(db.byBarcode.get(row.ean));
      matchMethod = 'barcode';
    }
    // 3. normalized name
    if (!product && row.naziv) {
      const n = normName(row.naziv);
      if (n && db.byName.has(n)) {
        const candidates = db.byName.get(n);
        if (candidates.length === 1) {
          product = candidates[0];
          matchMethod = 'name_exact';
        } else {
          // ambiguous — still report as matched with first active, flag method
          product = pickBest(candidates);
          matchMethod = 'name_ambiguous';
        }
      }
    }

    if (!product) {
      unmatched.push({
        excel_row: row.excel_row,
        ident: row.ident,
        ean: row.ean,
        naziv: row.naziv,
        parent_naziv: row.parent_naziv,
        brend: row.brend,
        kategorija: row.kategorija,
        potkategorija: row.potkategorija,
        tip_proizvoda: row.tip_proizvoda,
      });
      continue;
    }

    const productImgs = summarizeProductImages(product, db);
    const group = product.group_slug ? db.groupStats.get(product.group_slug) : null;

    // Status logic: prefer group-level coverage when the product belongs to a collapsed group
    let photoStatus;
    if (group) {
      photoStatus = group.cloud > 0 ? 'group_has_cloudinary' : group.total > 0 ? 'group_has_non_cloudinary' : 'group_no_images';
    } else {
      photoStatus = productImgs.cloud > 0 ? 'has_cloudinary' : productImgs.total > 0 ? 'has_non_cloudinary' : 'no_images';
    }

    matched.push({
      excel_row: row.excel_row,
      ident: row.ident,
      ean: row.ean,
      naziv: row.naziv,
      parent_naziv: row.parent_naziv,
      match_method: matchMethod,
      db_id: product.id,
      db_sku: product.sku,
      db_barcode: product.barcode || '',
      db_name_lat: product.name_lat,
      db_slug: product.slug,
      db_group_slug: product.group_slug || '',
      db_is_active: product.is_active,
      product_image_count: productImgs.total,
      product_cloudinary_count: productImgs.cloud,
      group_variant_count: group ? group.variantCount : '',
      group_image_count: group ? group.total : '',
      group_cloudinary_count: group ? group.cloud : '',
      photo_status: photoStatus,
      sample_url: (group && group.sampleUrl) || productImgs.sample || '',
    });
  }

  writeCsv(
    OUT_MATCHED,
    [
      'excel_row', 'ident', 'ean', 'naziv', 'parent_naziv', 'match_method',
      'db_id', 'db_sku', 'db_barcode', 'db_name_lat', 'db_slug', 'db_group_slug', 'db_is_active',
      'product_image_count', 'product_cloudinary_count',
      'group_variant_count', 'group_image_count', 'group_cloudinary_count',
      'photo_status', 'sample_url',
    ],
    matched,
  );
  writeCsv(
    OUT_UNMATCHED,
    ['excel_row', 'ident', 'ean', 'naziv', 'parent_naziv', 'brend', 'kategorija', 'potkategorija', 'tip_proizvoda'],
    unmatched,
  );

  // Summary
  const byMethod = matched.reduce((acc, m) => ((acc[m.match_method] = (acc[m.match_method] || 0) + 1), acc), {});
  const byStatus = matched.reduce((acc, m) => ((acc[m.photo_status] = (acc[m.photo_status] || 0) + 1), acc), {});
  console.log('\n=== SUMMARY ===');
  console.log(`Excel rows total:    ${excelRows.length}`);
  console.log(`Section headers:     ${sectionHeaders.length}`);
  console.log(`Product rows:        ${matched.length + unmatched.length}`);
  console.log(`  Matched:           ${matched.length}`);
  console.log(`  Unmatched:         ${unmatched.length}`);
  console.log('Match method breakdown:', byMethod);
  console.log('Photo status breakdown:', byStatus);
  console.log(`\nWritten: ${OUT_MATCHED}`);
  console.log(`Written: ${OUT_UNMATCHED}`);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
