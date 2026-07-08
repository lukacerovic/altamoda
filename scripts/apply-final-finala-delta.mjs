// Incremental update from "FINAL! FINALA.xlsx" against altamoda_local_final.
// The existing 991 products are unchanged (descriptions/prices already match),
// so this ONLY:
//   - inserts the 6 new products (with rich-text -> HTML descriptions),
//   - renames the 2 products whose size changed (400ml -> 1000ml).
// It never wipes or rewrites existing rows, so the HTML formatting stays intact.
//
// Usage:
//   node scripts/apply-final-finala-delta.mjs           # dry run
//   node scripts/apply-final-finala-delta.mjs --apply    # write to local DB

import XLSX from 'xlsx';
import { Client } from 'pg';
import crypto from 'node:crypto';

const EXCEL = '/Users/nikola/Downloads/AMS sajt 2026. baza B2C i B2B, FINAL! FINALA.xlsx';
const SHEET = 'AMS final baza';
const DB_URL = process.env.TARGET_DB_URL || 'postgresql://nikola@localhost:5432/altamoda_local_final';
const DB_SSL = /render\.com/.test(DB_URL) ? { rejectUnauthorized: false } : undefined;
const APPLY = process.argv.includes('--apply');

// Genuinely new products. 5294/5295 are intentionally EXCLUDED: the Excel
// lists them as duplicate IDENTs (different EAN) of products already in the DB
// — 5282 "Curl Soul šampon 1000ml" and 5283 "Curl Soul regenerator 1000ml".
// Inserting them would create storefront duplicates, matching why the existing
// import dedupes standalones by name.
const NEW_SKUS = ['2723', '5247', '5248', '5249'];
const SKIPPED_DUPLICATES = { '5294': '5282', '5295': '5283' };
// Renames: size changed in the new Excel. name comes from Excel NAZIV.
const RENAME_SKUS = ['2518', '2519'];

function cuid() {
  const t = Date.now().toString(36);
  return ('c' + t + crypto.randomBytes(8).toString('hex') + crypto.randomBytes(4).toString('hex')).slice(0, 25);
}
function slugify(s) {
  return String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}
function parsePrice(v) {
  if (v == null) return null;
  const s = String(v).replace(/\s+/g, '').replace(/,/g, '');
  if (!s || s === '-') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
const title = (s) => s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

// --- rich text (cell.h) -> semantic HTML (same rules as restyle script) ---
function toLines(h) {
  let s = String(h);
  s = s.replace(/&#x0*0?d;/gi, '').replace(/&#x0*0?a;/gi, '');
  s = s.replace(/<\/?span[^>]*>/gi, '');
  s = s.replace(/<b>/gi, '<strong>').replace(/<\/b>/gi, '</strong>');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<(?!\/?strong\b)[^>]+>/gi, '');
  return s.split('\n').map((ln) => ln.trim());
}
function linesToHtml(lines) {
  const blocks = []; let para = []; let list = [];
  const fp = () => { if (para.length) blocks.push('<p>' + para.join('<br/>') + '</p>'); para = []; };
  const fl = () => { if (list.length) blocks.push('<ul>' + list.map((li) => '<li>' + li + '</li>').join('') + '</ul>'); list = []; };
  for (const raw of lines) {
    const ln = raw.trim();
    if (!ln) { fp(); fl(); continue; }
    const b = ln.match(/^[•·]\s*(.*)$/);
    if (b) { fp(); if (b[1].trim()) list.push(b[1].trim()); }
    else { fl(); para.push(ln); }
  }
  fp(); fl();
  return blocks.join('');
}
const cellToHtml = (h) => (h == null || h === '' ? null : linesToHtml(toLines(h))) || null;

function readRows() {
  const wb = XLSX.readFile(EXCEL, { cellHTML: true });
  const ws = wb.Sheets[SHEET];
  const ref = XLSX.utils.decode_range(ws['!ref']);
  const hdr = {};
  for (let c = ref.s.c; c <= ref.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) hdr[String(cell.v).trim()] = c;
  }
  const col = (n) => hdr[n] ?? hdr[n + ' '];
  const cell = (r, n) => ws[XLSX.utils.encode_cell({ r, c: col(n) })];
  const w = (r, n) => { const x = cell(r, n); return x ? String(x.w ?? x.v ?? '').trim() : ''; };
  const html = (r, n) => { const x = cell(r, n); return x ? cellToHtml(x.h ?? x.w ?? x.v ?? '') : null; };
  const idc = col('IDENT');
  const out = new Map();
  for (let r = 1; r <= ref.e.r; r++) {
    const id = ws[XLSX.utils.encode_cell({ r, c: idc })];
    const sku = id ? String(id.v).trim() : '';
    if (!sku) continue;
    out.set(sku, {
      sku,
      naziv: w(r, 'NAZIV'),
      brend: w(r, 'BREND'),
      kategorija: w(r, 'KATEGORIJA'),
      potkategorija: w(r, 'POTKATEGORIJA'),
      tipProizvoda: w(r, 'TIP PROIZVODA'),
      tipKose: w(r, 'TIP KOSE'),
      tagovi: w(r, 'FUNKCIJA/TAGOVI'),
      ean: w(r, 'EAN CODE'),
      description: html(r, 'OPIS'),
      usage: html(r, 'UPOTREBA'),
      ingredients: html(r, 'SASTAV'),
      benefits: html(r, 'BENEFITI'),
      declaration: html(r, 'DEKLARACIJA'),
      vpSa: parsePrice(w(r, 'VP CENA sa PDV')),
      vpBez: parsePrice(w(r, 'VP CENA bez PDV')),
      mpSa: parsePrice(w(r, 'MP CENA sa PDV')),
      mpBez: parsePrice(w(r, 'MP CENA bez PDV')),
    });
  }
  return out;
}

async function main() {
  const xl = readRows();
  const client = new Client({ connectionString: DB_URL, ssl: DB_SSL });
  await client.connect();
  console.log('Target DB:', DB_URL.replace(/:[^:@/]+@/, ':***@'));

  // Load existing slugs + brand/category maps.
  const existing = (await client.query('select sku, slug, name_lat from products')).rows;
  const slugSet = new Set(existing.map((r) => r.slug));
  const skuRow = new Map(existing.map((r) => [String(r.sku).trim(), r]));
  const brandMap = new Map((await client.query('select id, name from brands')).rows.map((b) => [b.name.toLowerCase().trim(), b.id]));
  const catBySlug = new Map((await client.query('select id, slug from categories')).rows.map((c) => [c.slug, c.id]));

  const uniqueSlug = (base) => {
    let s = slugify(base) || 'product';
    if (!slugSet.has(s)) { slugSet.add(s); return s; }
    for (let n = 2; n < 9999; n++) { const c = `${s}-${n}`; if (!slugSet.has(c)) { slugSet.add(c); return c; } }
    throw new Error('slug overflow ' + base);
  };

  const plan = { renames: [], inserts: [], newCategories: [] };

  // 1) Renames first (frees the old slug for a possible new product to reuse).
  for (const sku of RENAME_SKUS) {
    const x = xl.get(sku); const cur = skuRow.get(sku);
    if (!x || !cur) { console.log(`! rename target ${sku} missing (xl:${!!x} db:${!!cur})`); continue; }
    if (cur.name_lat.trim() === x.naziv.trim()) continue;
    slugSet.delete(cur.slug); // release old slug
    const newSlug = uniqueSlug(x.naziv);
    plan.renames.push({ sku, from: cur.name_lat, to: x.naziv, oldSlug: cur.slug, newSlug });
  }

  // 2) Inserts for the 6 new products.
  for (const sku of NEW_SKUS) {
    const x = xl.get(sku);
    if (!x) { console.log(`! new sku ${sku} not in Excel`); continue; }
    if (skuRow.has(sku)) { console.log(`~ ${sku} already in DB, skipping insert`); continue; }
    const brandId = x.brend ? brandMap.get(x.brend.toLowerCase().trim()) || null : null;
    const firstCat = (x.kategorija || '').split(',')[0].trim();
    const catName = firstCat ? title(firstCat) : null;
    const catSlug = catName ? slugify(catName) : null;
    let categoryId = catSlug ? catBySlug.get(catSlug) || null : null;
    let createCat = null;
    if (catName && !categoryId) { createCat = { name: catName, slug: catSlug, id: cuid() }; categoryId = createCat.id; catBySlug.set(catSlug, categoryId); plan.newCategories.push(createCat); }
    const priceB2b = x.vpSa ?? x.vpBez ?? null;
    const priceB2c = x.mpSa ?? x.mpBez ?? priceB2b ?? 0;
    const isProfessional = /profesional|salon/i.test(`${x.kategorija} ${x.potkategorija}`);
    plan.inserts.push({
      id: cuid(), sku, name: x.naziv, slug: uniqueSlug(x.naziv), brandId, categoryId,
      brandName: x.brend, catName, priceB2c, priceB2b, isProfessional,
      x, createCat,
    });
  }

  // --- Report ---
  console.log('\n=== RENAMES ===');
  for (const r of plan.renames) console.log(`  ${r.sku}: "${r.from}" -> "${r.to}"   slug ${r.oldSlug} -> ${r.newSlug}`);
  console.log('\n=== NEW CATEGORIES (created if missing) ===', plan.newCategories.map((c) => c.name).join(', ') || '(none)');
  console.log('\n=== SKIPPED (duplicate IDENTs of existing products) ===');
  for (const [dup, existsAs] of Object.entries(SKIPPED_DUPLICATES)) console.log(`  ${dup} -> already in DB as ${existsAs}`);
  console.log('\n=== INSERTS ===');
  for (const i of plan.inserts) {
    console.log(`  ${i.sku}: ${i.name}`);
    console.log(`     brand=${i.brandName}${i.brandId ? '' : ' (NOT FOUND!)'}  cat=${i.catName}  B2C=${i.priceB2c}  B2B=${i.priceB2b ?? '-'}  professional=${i.isProfessional}`);
    console.log(`     slug=${i.slug}  desc=${i.x.description ? 'HTML' : 'none'}  benefits=${i.x.benefits ? 'HTML' : 'none'}`);
  }

  if (!APPLY) { console.log('\nDry run — no writes. Re-run with --apply.'); await client.end(); return; }

  await client.query('BEGIN');
  try {
    for (const c of plan.newCategories) {
      await client.query(
        `INSERT INTO categories (id, name_lat, name_cyr, slug, sort_order, is_active, depth) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [c.id, c.name, null, c.slug, 100, true, 0],
      );
    }
    for (const r of plan.renames) {
      await client.query('update products set name_lat=$1, slug=$2, updated_at=now() where sku=$3', [r.to, r.newSlug, r.sku]);
    }
    for (const i of plan.inserts) {
      const x = i.x; const now = new Date();
      await client.query(
        `INSERT INTO products (
           id, sku, name_lat, slug, brand_id, category_id,
           description, usage_instructions, ingredients, benefits, declaration,
           price_b2c, price_b2b, stock_quantity, low_stock_threshold,
           is_professional, is_active, is_new, is_featured, is_bestseller,
           vat_rate, group_slug, color_code, color_name,
           subcategory, product_type, hair_types, tags,
           barcode, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$30)`,
        [
          i.id, i.sku, i.name, i.slug, i.brandId, i.categoryId,
          x.description, x.usage, x.ingredients, x.benefits, x.declaration,
          i.priceB2c, i.priceB2b, 10, 5,
          i.isProfessional, true, false, false, false,
          20, null, null, null,
          x.potkategorija || null, x.tipProizvoda || null, x.tipKose || null, x.tagovi || null,
          x.ean || null, now,
        ],
      );
    }
    await client.query('COMMIT');
    console.log(`\n✅ Applied: ${plan.renames.length} renamed, ${plan.inserts.length} inserted, ${plan.newCategories.length} categories created.`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
