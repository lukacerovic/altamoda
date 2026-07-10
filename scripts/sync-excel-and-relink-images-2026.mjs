// Sync the LOCAL `altamoda` DB to the Excel catalog and relink product images
// from the (frozen) dump image set.
//
//   Excel  = source of truth for product DATA (any non-empty column overrides the DB).
//   Images = the dump's complete SKU-named Cloudinary set, frozen into
//            scripts/dump-images-by-sku-2026.json (the .dump file is never touched).
//
// The local catalog set already equals the Excel set (997 products, verified), so
// this script does NOT insert or delete products — it only:
//   1. overrides mapped fields on each product from its Excel row (by IDENT = sku),
//   2. for every product that has dump images, replaces its product_images rows
//      with the dump's set (uniform .jpg lineage; "Replace all with dump set").
//
// Join key everywhere: SKU  (Excel IDENT == products.sku == dump sku).
// Field mapping + rich-text->HTML rules match scripts/apply-final-finala-delta.mjs.
//
// Usage:
//   node scripts/sync-excel-and-relink-images-2026.mjs            # dry run vs local (no writes)
//   node scripts/sync-excel-and-relink-images-2026.mjs --apply    # write to local DB
//   TARGET_DB_URL=postgres://... node scripts/sync-excel-and-relink-images-2026.mjs [--apply]  # target another DB (e.g. prod)

import XLSX from 'xlsx';
import { Client } from 'pg';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXCEL = '/Users/lukacerovic/Downloads/AMS sajt 2026_1. baza B2C i B2B, FINAL FINALA (1).xlsx';
const SHEET = 'AMS final baza';
const IMAGES_JSON = path.join(__dirname, 'dump-images-by-sku-2026.json');
const APPLY = process.argv.includes('--apply');

// Target DB: TARGET_DB_URL env var (e.g. prod) wins; otherwise local from .env.
// Strip the Prisma-only ?schema= param that libpq rejects.
function targetDbUrl() {
  if (process.env.TARGET_DB_URL) return process.env.TARGET_DB_URL.trim().replace(/\?schema=public/, '');
  const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  const m = env.match(/^DATABASE_URL=(.*)$/m);
  if (!m) throw new Error('DATABASE_URL not found in .env');
  return m[1].trim().replace(/^"|"$/g, '').replace(/\?schema=public/, '');
}

// ---------- helpers (same rules as the delta script) ----------
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

// rich text (cell.h) -> semantic HTML (allowlist: p, br, strong, ul, li)
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

function readExcel() {
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
  const xl = readExcel();
  const imagesBySku = new Map();
  for (const row of JSON.parse(fs.readFileSync(IMAGES_JSON, 'utf8'))) {
    if (!imagesBySku.has(row.sku)) imagesBySku.set(row.sku, []);
    imagesBySku.get(row.sku).push(row);
  }

  const DB_URL = targetDbUrl();
  const ssl = /render\.com/.test(DB_URL) ? { rejectUnauthorized: false } : undefined;
  const client = new Client({ connectionString: DB_URL, ssl });
  await client.connect();
  console.log('Target DB:', DB_URL.replace(/:[^:@/]+@/, ':***@'));
  console.log('Excel products:', xl.size, '| dump image SKUs:', imagesBySku.size);

  const existing = (await client.query('select id, sku, slug, name_lat from products')).rows;
  const skuRow = new Map(existing.map((r) => [String(r.sku).trim(), r]));
  const brandMap = new Map((await client.query('select id, name from brands')).rows.map((b) => [b.name.toLowerCase().trim(), b.id]));
  const catBySlug = new Map((await client.query('select id, slug from categories')).rows.map((c) => [c.slug, c.id]));

  // Fields we override from Excel, mapped Excel-value -> DB column.
  const FIELD_COLS = {
    naziv: 'name_lat', ean: 'barcode', description: 'description', usage: 'usage_instructions',
    ingredients: 'ingredients', benefits: 'benefits', declaration: 'declaration',
    potkategorija: 'subcategory', tipProizvoda: 'product_type', tipKose: 'hair_types', tagovi: 'tags',
  };

  const plan = {
    updates: [], newCategories: [], unresolvedBrands: new Map(),
    inExcelNotDb: [], relinkImages: 0, relinkRows: 0, noImageSkus: [],
  };

  for (const [sku, x] of xl) {
    const cur = skuRow.get(sku);
    if (!cur) { plan.inExcelNotDb.push(sku); continue; }

    const set = {};
    for (const [k, col] of Object.entries(FIELD_COLS)) {
      const v = x[k];
      if (v != null && String(v).trim() !== '') set[col] = v;
    }
    const priceB2c = x.mpSa ?? x.mpBez;
    const priceB2b = x.vpSa ?? x.vpBez;
    if (priceB2c != null) set.price_b2c = priceB2c;
    if (priceB2b != null) set.price_b2b = priceB2b;

    // brand: override only if Excel brand resolves to an existing brand row.
    if (x.brend) {
      const bid = brandMap.get(x.brend.toLowerCase().trim());
      if (bid) set.brand_id = bid;
      else plan.unresolvedBrands.set(x.brend, (plan.unresolvedBrands.get(x.brend) || 0) + 1);
    }
    // category: first KATEGORIJA token -> title -> slug; create if missing (as delta did).
    const firstCat = (x.kategorija || '').split(',')[0].trim();
    if (firstCat) {
      const catName = title(firstCat);
      const catSlug = slugify(catName);
      let categoryId = catBySlug.get(catSlug) || null;
      if (!categoryId) {
        const c = { name: catName, slug: catSlug, id: cuid() };
        catBySlug.set(catSlug, c.id); plan.newCategories.push(c); categoryId = c.id;
      }
      set.category_id = categoryId;
    }

    plan.updates.push({ id: cur.id, sku, set });
  }

  // Image relink plan (replace-all): every product with dump images.
  for (const [sku, cur] of skuRow) {
    const imgs = imagesBySku.get(sku);
    if (imgs && imgs.length) { plan.relinkImages++; plan.relinkRows += imgs.length; }
    else plan.noImageSkus.push(sku);
  }

  // ---------- report ----------
  console.log('\n=== FIELD OVERRIDES ===');
  console.log(`  products to update: ${plan.updates.length}`);
  const fieldCounts = {};
  for (const u of plan.updates) for (const k of Object.keys(u.set)) fieldCounts[k] = (fieldCounts[k] || 0) + 1;
  console.log('  per-field non-empty overrides:', JSON.stringify(fieldCounts, null, 0));
  const sample = plan.updates.find((u) => u.set.name_lat);
  if (sample) console.log(`  sample ${sample.sku}:`, Object.keys(sample.set).join(', '));

  console.log('\n=== NEW CATEGORIES (created if missing) ===', plan.newCategories.map((c) => c.name).join(', ') || '(none)');
  console.log('\n=== UNRESOLVED BRANDS (kept existing brand_id) ===');
  if (plan.unresolvedBrands.size === 0) console.log('  (none)');
  else for (const [b, n] of [...plan.unresolvedBrands.entries()].sort((a, z) => z[1] - a[1])) console.log(`  ${n.toString().padStart(4)}x  ${b}`);

  console.log('\n=== EXCEL PRODUCTS NOT IN DB (not inserted) ===', plan.inExcelNotDb.join(', ') || '(none)');

  console.log('\n=== IMAGE RELINK (replace-all from dump) ===');
  console.log(`  products relinked: ${plan.relinkImages}  (image rows inserted: ${plan.relinkRows})`);
  console.log(`  products with NO dump image (left as-is): ${plan.noImageSkus.length} -> ${plan.noImageSkus.join(', ')}`);

  if (!APPLY) { console.log('\nDry run — no writes. Re-run with --apply.'); await client.end(); return; }

  // ---------- backup then apply ----------
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(__dirname, `backup-local-before-sync-${ts}.json`);
  const bProducts = (await client.query('select * from products')).rows;
  const bImages = (await client.query('select * from product_images')).rows;
  fs.writeFileSync(backupPath, JSON.stringify({ products: bProducts, product_images: bImages }, null, 0));
  console.log(`\nBackup written: ${path.relative(path.join(__dirname, '..'), backupPath)} (${bProducts.length} products, ${bImages.length} images)`);

  const chunk = (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };

  await client.query('BEGIN');
  try {
    for (const c of plan.newCategories) {
      await client.query(
        `INSERT INTO categories (id, name_lat, name_cyr, slug, sort_order, is_active, depth)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (slug) DO NOTHING`,
        [c.id, c.name, null, c.slug, 100, true, 0],
      );
    }

    // --- Field overrides: batched UPDATE ... FROM (VALUES ...) ---
    // COALESCE(v.col, p.col) => a NULL value keeps the existing DB value, so a
    // column absent from Excel for a given product is never wiped.
    const UPD_COLS = ['name_lat', 'barcode', 'description', 'usage_instructions', 'ingredients',
      'benefits', 'declaration', 'subcategory', 'product_type', 'hair_types', 'tags',
      'price_b2c', 'price_b2b', 'brand_id', 'category_id'];
    const TYPE = (c) => (c === 'price_b2c' || c === 'price_b2b' ? 'numeric' : 'text');
    const ALL = ['id', ...UPD_COLS];
    const setClause = UPD_COLS.map((c) => `${c}=COALESCE(v.${c},p.${c})`).join(', ');
    let updated = 0;
    for (const part of chunk(plan.updates, 200)) {
      const params = [];
      const rows = part.map((u, ri) => {
        const vals = [u.id, ...UPD_COLS.map((c) => (u.set[c] ?? null))];
        const ph = vals.map((_, ci) => {
          params.push(vals[ci]);
          const cast = ri === 0 ? `::${ci === 0 ? 'text' : TYPE(UPD_COLS[ci - 1])}` : '';
          return `$${params.length}${cast}`;
        });
        return `(${ph.join(',')})`;
      });
      await client.query(
        `UPDATE products p SET ${setClause}, updated_at=now()
         FROM (VALUES ${rows.join(',')}) AS v(${ALL.join(',')})
         WHERE p.id = v.id`,
        params,
      );
      updated += part.length;
    }

    // --- Image relink: one bulk DELETE + chunked bulk INSERT ---
    const relink = [];
    for (const [sku, cur] of skuRow) {
      const imgs = imagesBySku.get(sku);
      if (imgs && imgs.length) for (const im of imgs) relink.push([cuid(), cur.id, im.url, im.alt_text, im.type, im.sort_order, im.is_primary]);
    }
    const relinkIds = [...new Set(relink.map((r) => r[1]))];
    await client.query('DELETE FROM product_images WHERE product_id = ANY($1::text[])', [relinkIds]);
    let inserted = 0;
    for (const part of chunk(relink, 500)) {
      const params = [];
      const rows = part.map((r) => `(${r.map((_, i) => { params.push(r[i]); return `$${params.length}`; }).join(',')})`);
      await client.query(
        `INSERT INTO product_images (id, product_id, url, alt_text, type, sort_order, is_primary) VALUES ${rows.join(',')}`,
        params,
      );
      inserted += part.length;
    }

    await client.query('COMMIT');
    console.log(`\n✅ Applied: ${updated} products updated, ${plan.newCategories.length} categories created, ${relinkIds.length} products relinked (${inserted} image rows).`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('\n❌ Rolled back — no changes written.');
    throw e;
  }
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
