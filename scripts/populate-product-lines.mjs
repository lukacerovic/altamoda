// Populate product_lines + products.product_line_id from the Excel "LINIJA"
// column so the (already-built) brand-scoped, multipick line-filter pills on the
// storefront light up. The storefront filters lines via productLine.slug ->
// product_line_id; that FK was null on every product because line data only
// lived in the Excel. This find-or-creates one product_lines row per
// (brand, LINIJA) and links each product to it.
//
// Usage:
//   node scripts/populate-product-lines.mjs           # dry run
//   node scripts/populate-product-lines.mjs --apply    # write
//   TARGET_DB_URL=<prod url> node scripts/populate-product-lines.mjs --apply

import XLSX from 'xlsx';
import { Client } from 'pg';
import crypto from 'node:crypto';

const EXCEL = '/Users/nikola/Downloads/AMS sajt 2026. baza B2C i B2B, FINAL! FINALA.xlsx';
const SHEET = 'AMS final baza';
const DB_URL = process.env.TARGET_DB_URL || 'postgresql://nikola@localhost:5432/altamoda_local_final';
const DB_SSL = /render\.com/.test(DB_URL) ? { rejectUnauthorized: false } : undefined;
const APPLY = process.argv.includes('--apply');

function cuid() {
  return ('c' + Date.now().toString(36) + crypto.randomBytes(8).toString('hex') + crypto.randomBytes(4).toString('hex')).slice(0, 25);
}
function slugify(s) {
  return String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}

function readExcel() {
  const wb = XLSX.readFile(EXCEL);
  const ws = wb.Sheets[SHEET];
  const ref = XLSX.utils.decode_range(ws['!ref']);
  const hdr = {};
  for (let c = ref.s.c; c <= ref.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) hdr[String(cell.v).trim()] = c;
  }
  const col = (n) => hdr[n] ?? hdr[n + ' '];
  const get = (r, n) => { const cell = ws[XLSX.utils.encode_cell({ r, c: col(n) })]; return cell ? String(cell.w ?? cell.v ?? '').trim() : ''; };
  const idc = col('IDENT');
  const out = new Map(); // sku -> { brand, linija }
  for (let r = 1; r <= ref.e.r; r++) {
    const id = ws[XLSX.utils.encode_cell({ r, c: idc })];
    const sku = id ? String(id.v).trim() : '';
    if (!sku) continue;
    out.set(sku, { brand: get(r, 'BREND'), linija: get(r, 'LINIJA') });
  }
  return out;
}

async function main() {
  const xl = readExcel();
  const client = new Client({ connectionString: DB_URL, ssl: DB_SSL });
  await client.connect();
  console.log('Target DB:', DB_URL.replace(/:[^:@/]+@/, ':***@'));

  const brands = (await client.query('select id, name, slug from brands')).rows;
  const brandByName = new Map(brands.map((b) => [b.name.toLowerCase().trim(), b]));
  const products = (await client.query('select id, sku, brand_id, product_line_id from products')).rows;

  // Existing lines keyed by brand_id + lowercased name; track used slugs globally.
  const lineRows = (await client.query('select id, name, slug, brand_id from product_lines')).rows;
  const lineByKey = new Map(lineRows.map((l) => [`${l.brand_id}::${l.name.toLowerCase().trim()}`, l]));
  const usedSlugs = new Set(lineRows.map((l) => l.slug));

  const newLines = []; // {id, name, slug, brand_id}
  const uniqueSlug = (base, brandSlug) => {
    let s = slugify(base) || 'line';
    if (!usedSlugs.has(s)) { usedSlugs.add(s); return s; }
    const withBrand = slugify(`${brandSlug}-${base}`);
    if (!usedSlugs.has(withBrand)) { usedSlugs.add(withBrand); return withBrand; }
    for (let n = 2; n < 9999; n++) { const c = `${s}-${n}`; if (!usedSlugs.has(c)) { usedSlugs.add(c); return c; } }
    throw new Error('slug overflow ' + base);
  };

  const updates = []; // {productId, lineId}
  const stats = { linked: 0, alreadyLinked: 0, noLinija: 0, noBrand: 0, noExcel: 0, createdLines: 0 };

  for (const p of products) {
    const x = xl.get(String(p.sku).trim());
    if (!x) { stats.noExcel++; continue; }
    if (!x.linija) { stats.noLinija++; continue; }
    const brand = x.brand ? brandByName.get(x.brand.toLowerCase().trim()) : null;
    const brandId = brand ? brand.id : p.brand_id;
    if (!brandId) { stats.noBrand++; continue; }

    const key = `${brandId}::${x.linija.toLowerCase().trim()}`;
    let line = lineByKey.get(key);
    if (!line) {
      line = { id: cuid(), name: x.linija, slug: uniqueSlug(x.linija, brand ? brand.slug : 'line'), brand_id: brandId };
      lineByKey.set(key, line);
      newLines.push(line);
      stats.createdLines++;
    }
    if (p.product_line_id === line.id) { stats.alreadyLinked++; continue; }
    updates.push({ productId: p.id, lineId: line.id });
    stats.linked++;
  }

  console.log('\n=== PLAN ===', stats);
  console.log(`New product_lines to create: ${newLines.length}`);
  for (const l of newLines.slice(0, 15)) console.log(`  + ${l.name}  (slug ${l.slug})`);
  if (newLines.length > 15) console.log(`  …and ${newLines.length - 15} more`);
  console.log(`Products to link: ${updates.length}`);

  if (!APPLY) { console.log('\nDry run — no writes. Re-run with --apply.'); await client.end(); return; }

  await client.query('BEGIN');
  try {
    for (const l of newLines) {
      await client.query(
        'insert into product_lines (id, name, slug, brand_id) values ($1,$2,$3,$4)',
        [l.id, l.name, l.slug, l.brand_id],
      );
    }
    // Batch the product updates by line for fewer round-trips.
    const byLine = new Map();
    for (const u of updates) { if (!byLine.has(u.lineId)) byLine.set(u.lineId, []); byLine.get(u.lineId).push(u.productId); }
    for (const [lineId, ids] of byLine) {
      await client.query('update products set product_line_id=$1 where id = any($2)', [lineId, ids]);
    }
    await client.query('COMMIT');
    console.log(`\n✅ Applied: created ${newLines.length} lines, linked ${updates.length} products.`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
