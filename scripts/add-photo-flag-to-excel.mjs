// Adds a "FOTO NA SAJTU" column to the "AMS final baza" sheet, flagging each
// product row DA (has a photo live on the website) or NE (no photo).
//
// "Photo on the website" = the matched DB product has a Cloudinary image, OR —
// for variants that collapse into a group on the storefront — the group has at
// least one Cloudinary image (so a single shared gallery doesn't read as every
// variant missing its photo).
//
// Matching mirrors scripts/excel-db-match-report.mjs:
//   1) sku == IDENT   2) barcode == EAN CODE   3) normalized NAZIV vs name
// Section-header rows (NAZIV only, no IDENT) are flagged from their children:
// DA if any child variant resolves to DA.
//
// Reads/writes the AOA verbatim so all original columns/rows are preserved; the
// new column is appended as the last column. Output is a NEW file (the original
// is left untouched). Note: SheetJS community build does not preserve cell
// styling, so the output is data-faithful but visually plain.

import XLSX from 'xlsx';
import { Client } from 'pg';

const EXCEL_IN = '/Users/nikola/Downloads/AMS sajt 2026. baza B2C i B2B, FINAL!-2.xlsx';
const EXCEL_OUT = '/Users/nikola/Downloads/AMS sajt 2026. baza B2C i B2B, FINAL!-2 (FOTO FLAG).xlsx';
const SHEET_NAME = 'AMS final baza';
const NEW_COL_HEADER = 'FOTO NA SAJTU';
const DB_URL = 'postgresql://nikola@localhost:5432/altamoda_local_final';

const COL_IDENT = 0; // A
const COL_EAN = 1; // B
const COL_NAZIV = 2; // C
const COL_BREND = 4; // E

function normName(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function loadDb(client) {
  const { rows: products } = await client.query(
    `SELECT id, sku, barcode, name_lat, name_cyr, group_slug, is_active FROM products`,
  );
  const { rows: images } = await client.query(
    `SELECT product_id, url FROM product_images`,
  );

  const bySku = new Map();
  const byBarcode = new Map();
  const byName = new Map();
  const push = (map, key, p) => {
    if (!key) return;
    const k = String(key).trim();
    if (!k) return;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(p);
  };
  for (const p of products) {
    push(bySku, p.sku, p);
    push(byBarcode, p.barcode, p);
    const nLat = normName(p.name_lat);
    const nCyr = normName(p.name_cyr);
    push(byName, nLat, p);
    if (nCyr && nCyr !== nLat) push(byName, nCyr, p);
  }

  // cloudinary image count per product
  const cloudByProduct = new Map();
  for (const im of images) {
    if (im.url && im.url.includes('cloudinary')) {
      cloudByProduct.set(im.product_id, (cloudByProduct.get(im.product_id) || 0) + 1);
    }
  }
  // cloudinary count per group_slug
  const cloudByGroup = new Map();
  for (const p of products) {
    if (!p.group_slug) continue;
    const c = cloudByProduct.get(p.id) || 0;
    cloudByGroup.set(p.group_slug, (cloudByGroup.get(p.group_slug) || 0) + c);
  }

  return { bySku, byBarcode, byName, cloudByProduct, cloudByGroup };
}

function pickBest(list) {
  if (!list || !list.length) return null;
  return list.find((p) => p.is_active) || list[0];
}

// Returns { product, method } or { product: null }
function matchRow(ident, ean, naziv, db) {
  if (ident && db.bySku.has(ident)) return { product: pickBest(db.bySku.get(ident)), method: 'sku' };
  if (ean && db.byBarcode.has(ean)) return { product: pickBest(db.byBarcode.get(ean)), method: 'barcode' };
  const n = normName(naziv);
  if (n && db.byName.has(n)) {
    const c = db.byName.get(n);
    return { product: pickBest(c), method: c.length === 1 ? 'name' : 'name_ambiguous' };
  }
  return { product: null, method: '' };
}

// DA if the product (or its group, when collapsed) has any cloudinary photo
function hasPhoto(product, db) {
  if (!product) return false;
  if (product.group_slug) return (db.cloudByGroup.get(product.group_slug) || 0) > 0;
  return (db.cloudByProduct.get(product.id) || 0) > 0;
}

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  const db = await loadDb(client);

  const wb = XLSX.readFile(EXCEL_IN);
  const ws = wb.Sheets[SHEET_NAME];
  if (!ws) throw new Error(`Sheet "${SHEET_NAME}" not found`);
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });

  const header = aoa[0];
  const newColIdx = header.length; // append
  header[newColIdx] = NEW_COL_HEADER;

  // Resolve a flag for every row. Non-product rows (NAZIV-only section headers
  // and number-only footer rows) are marked with a dash so DA/NE applies to
  // real sellable products only. Fully-empty rows are left empty.
  const MARK = '—';
  const flags = new Array(aoa.length).fill(''); // index aligned to aoa
  const stats = { da: 0, ne_in_db_no_photo: 0, ne_not_in_db: 0, marked: 0, empty: 0 };

  for (let i = 1; i < aoa.length; i++) {
    const r = aoa[i];
    if (!r || !r.some((c) => String(c).trim() !== '')) {
      flags[i] = '';
      stats.empty++;
      continue;
    }
    const ident = String(r[COL_IDENT] ?? '').trim();
    const ean = String(r[COL_EAN] ?? '').trim();
    const naziv = String(r[COL_NAZIV] ?? '').trim();

    // Rows without IDENT/EAN are either named group headers (collapsed-group
    // parents — mark with a dash) or numeric total/summary rows at the bottom
    // (NAZIV is just a number — leave blank, they aren't products).
    if (!ident && !ean) {
      if (naziv && !/^\d+$/.test(naziv)) {
        flags[i] = MARK;
        stats.marked++;
      } else {
        flags[i] = '';
        stats.empty++;
      }
      continue;
    }

    const { product } = matchRow(ident, ean, naziv, db);
    if (!product) {
      flags[i] = 'NE';
      stats.ne_not_in_db++;
    } else if (hasPhoto(product, db)) {
      flags[i] = 'DA';
      stats.da++;
    } else {
      flags[i] = 'NE';
      stats.ne_in_db_no_photo++;
    }
  }

  // Write flags back into the AOA new column.
  for (let i = 1; i < aoa.length; i++) {
    aoa[i][newColIdx] = flags[i];
  }

  const newWs = XLSX.utils.aoa_to_sheet(aoa);
  wb.Sheets[SHEET_NAME] = newWs;
  XLSX.writeFile(wb, EXCEL_OUT);

  console.log('=== FOTO NA SAJTU flag written ===');
  console.log('Output:', EXCEL_OUT);
  console.log('Column:', XLSX.utils.encode_col(newColIdx), `(${NEW_COL_HEADER})`);
  console.log('DA  (photo on site):        ', stats.da);
  console.log('NE  (in DB, no photo):      ', stats.ne_in_db_no_photo);
  console.log('NE  (not matched in DB):    ', stats.ne_not_in_db);
  console.log('—   (non-product rows):     ', stats.marked);
  console.log('    (fully-empty rows):     ', stats.empty);
  const totalNe = stats.ne_in_db_no_photo + stats.ne_not_in_db;
  console.log(`TOTAL product rows: ${stats.da + totalNe}  ->  DA ${stats.da} / NE ${totalNe}`);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
