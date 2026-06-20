// Populate altamoda_local_final from the FINAL!-2 Excel.
//
// Steps:
//   1. Trim transactional rows (cart_items only — orders/wishlists/reviews are empty).
//   2. Delete all products whose sku is NOT in the Excel IDENT set (drops 2999 rows,
//      cascades to product_images).
//   3. Ensure category rows exist for the top-level Excel KATEGORIJA values
//      (Stajling, Nega, Kolor, Pribor, Minival).
//   4. Insert one product row per unmatched Excel row (687 rows). Variants get
//      group_slug = slug(parent_naziv) and a composite name "<parent> / <code>".
//      Pricing: price_b2c = MP sa PDV, price_b2b = VP sa PDV.

import XLSX from 'xlsx';
import { Client } from 'pg';
import crypto from 'node:crypto';

const EXCEL_PATH = '/Users/nikola/Downloads/AMS sajt 2026. baza B2C i B2B, FINAL!-2.xlsx';
const SHEET_NAME = 'AMS final baza';
const DB_URL = 'postgresql://nikola@localhost:5432/altamoda_local_final';

// ---------- helpers ----------

// cuid-like 25-char id starting with 'c'. Format matches existing rows enough
// for app code that treats id as opaque text.
function cuid() {
  const t = Date.now().toString(36);
  const r1 = crypto.randomBytes(8).toString('hex');
  const r2 = crypto.randomBytes(4).toString('hex');
  return ('c' + t + r1 + r2).slice(0, 25);
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function parsePrice(v) {
  if (v == null) return null;
  const s = String(v).replace(/\s+/g, '').replace(/,/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function normName(s) {
  if (!s) return '';
  return String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

// ---------- Excel ingestion (same shape as report script) ----------

function readExcel() {
  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets[SHEET_NAME];
  if (!ws) throw new Error(`Sheet "${SHEET_NAME}" not found`);
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
      linija: String(r['LINIJA'] ?? '').trim(),
      tip_proizvoda: String(r['TIP PROIZVODA'] ?? '').trim(),
      tip_kose: String(r['TIP KOSE'] ?? '').trim(),
      tagovi: String(r['FUNKCIJA/TAGOVI'] ?? '').trim(),
      opis: String(r['OPIS '] ?? r['OPIS'] ?? '').trim(),
      upotreba: String(r['UPOTREBA'] ?? '').trim(),
      sastav: String(r['SASTAV'] ?? '').trim(),
      benefiti: String(r['BENEFITI'] ?? '').trim(),
      deklaracija: String(r['DEKLARACIJA'] ?? '').trim(),
      vp_bez: parsePrice(r[' VP CENA bez PDV ']),
      vp_sa: parsePrice(r[' VP CENA sa PDV ']),
      mp_bez: parsePrice(r[' MP CENA bez PDV ']),
      mp_sa: parsePrice(r['MP CENA sa PDV']),
    };
    if (!row.ident && !row.ean && !row.naziv) continue;
    if (!row.ident && !row.ean && row.naziv) {
      currentParent = row.naziv;
      row.kind = 'section_header';
      row.parent_naziv = '';
      out.push(row);
      continue;
    }
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

// ---------- DB helpers ----------

async function buildBrandLookup(client) {
  const { rows } = await client.query(`SELECT id, name FROM brands`);
  const map = new Map();
  for (const b of rows) map.set(b.name.toLowerCase().trim(), b.id);
  return map;
}

async function ensureCategories(client, names) {
  const map = new Map();
  for (const display of names) {
    const slug = slugify(display);
    const { rows } = await client.query(`SELECT id FROM categories WHERE slug = $1 LIMIT 1`, [slug]);
    if (rows[0]) {
      map.set(display, rows[0].id);
      continue;
    }
    const id = cuid();
    await client.query(
      `INSERT INTO categories (id, name_lat, name_cyr, slug, sort_order, is_active, depth)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, display, null, slug, 100, true, 0],
    );
    map.set(display, id);
    console.log(`  created category: ${display} (${slug})`);
  }
  return map;
}

// ---------- main ----------

async function main() {
  const excel = readExcel();
  const productRows = excel.filter((r) => r.kind === 'product');
  const sectionHeaders = excel.filter((r) => r.kind === 'section_header');
  const excelIdents = new Set(productRows.map((r) => r.ident).filter(Boolean));
  console.log(`Excel: ${productRows.length} products, ${sectionHeaders.length} section headers, ${excelIdents.size} unique IDENTs`);

  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    await client.query('BEGIN');

    // 1. Wipe cart_items (would otherwise RESTRICT product deletion).
    const cartDel = await client.query('DELETE FROM cart_items');
    console.log(`Deleted cart_items: ${cartDel.rowCount}`);

    // 2. Determine which products to keep / delete.
    const { rows: dbProducts } = await client.query('SELECT id, sku FROM products');
    const keepSkus = new Set();
    const dropIds = [];
    for (const p of dbProducts) {
      if (excelIdents.has(p.sku)) keepSkus.add(p.sku);
      else dropIds.push(p.id);
    }
    console.log(`Keeping ${keepSkus.size} matched products, deleting ${dropIds.length}`);
    // Batched delete to avoid huge IN list issues.
    const BATCH = 500;
    for (let i = 0; i < dropIds.length; i += BATCH) {
      const slice = dropIds.slice(i, i + BATCH);
      await client.query('DELETE FROM products WHERE id = ANY($1::text[])', [slice]);
    }
    const { rows: postDel } = await client.query('SELECT COUNT(*)::int AS n FROM products');
    console.log(`After delete: ${postDel[0].n} products`);

    // 3. Categories: take first comma-separated KATEGORIJA token per row.
    const catTokens = new Set();
    for (const r of productRows) {
      if (!excelIdents.has(r.ident)) continue; // we only need cats for inserts later, but be inclusive
      const first = (r.kategorija || '').split(',')[0].trim();
      if (first) catTokens.add(first);
    }
    // Display name = titlecase.
    function title(s) {
      return s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
    }
    const catDisplayList = [...catTokens].map(title);
    console.log(`Excel category tokens to ensure: ${catDisplayList.join(', ')}`);
    const catMap = await ensureCategories(client, catDisplayList);

    // 4. Brand lookup (build after no destructive ops on brands).
    const brandMap = await buildBrandLookup(client);
    console.log(`Brands available: ${[...brandMap.keys()].join(', ')}`);

    // 5. Slug uniqueness: prefetch existing slugs.
    const { rows: existingSlugs } = await client.query('SELECT slug FROM products');
    const slugSet = new Set(existingSlugs.map((r) => r.slug));
    function makeUniqueSlug(base) {
      let s = slugify(base);
      if (!s) s = 'product';
      if (!slugSet.has(s)) {
        slugSet.add(s);
        return s;
      }
      for (let n = 2; n < 9999; n++) {
        const cand = `${s}-${n}`;
        if (!slugSet.has(cand)) {
          slugSet.add(cand);
          return cand;
        }
      }
      throw new Error(`Could not allocate slug for "${base}"`);
    }

    // 6. Determine inserts: Excel product rows whose sku is NOT in keepSkus
    //    (i.e., the "unmatched" set from the report).
    const toInsert = productRows.filter((r) => r.ident && !keepSkus.has(r.ident));
    console.log(`Inserting ${toInsert.length} new products`);

    let inserted = 0;
    let unmappedBrand = 0;
    for (const r of toInsert) {
      const brandKey = r.brend.toLowerCase().trim();
      const brandId = brandKey ? brandMap.get(brandKey) || null : null;
      if (brandKey && !brandId) unmappedBrand++;

      const firstCat = (r.kategorija || '').split(',')[0].trim();
      const categoryId = firstCat ? catMap.get(title(firstCat)) || null : null;

      const isVariant = !!r.parent_naziv;
      const baseName = isVariant ? `${r.parent_naziv} / ${r.naziv}` : r.naziv;
      const slug = makeUniqueSlug(baseName);
      const groupSlug = isVariant ? slugify(r.parent_naziv) : null;
      const colorCode = isVariant ? r.naziv : null;
      const colorName = isVariant ? r.naziv : null;

      const priceB2c = r.mp_sa ?? r.mp_bez ?? 0;
      const priceB2b = r.vp_sa ?? r.vp_bez ?? null;

      const id = cuid();
      const now = new Date();
      await client.query(
        `INSERT INTO products (
           id, sku, name_lat, slug, brand_id, category_id,
           description, usage_instructions, ingredients, benefits, declaration,
           price_b2c, price_b2b, stock_quantity, low_stock_threshold,
           is_professional, is_active, is_new, is_featured, is_bestseller,
           vat_rate, group_slug, color_code, color_name,
           subcategory, product_type, hair_types, tags,
           barcode, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6,
           $7, $8, $9, $10, $11,
           $12, $13, $14, $15,
           $16, $17, $18, $19, $20,
           $21, $22, $23, $24,
           $25, $26, $27, $28,
           $29, $30, $30
         )`,
        [
          id, r.ident, baseName, slug, brandId, categoryId,
          r.opis || null, r.upotreba || null, r.sastav || null, r.benefiti || null, r.deklaracija || null,
          priceB2c, priceB2b, 0, 5,
          false, true, false, false, false,
          20, groupSlug, colorCode, colorName,
          r.potkategorija || null, r.tip_proizvoda || null, r.tip_kose || null, r.tagovi || null,
          r.ean || null, now,
        ],
      );
      inserted++;
    }
    console.log(`Inserted: ${inserted}`);
    if (unmappedBrand) console.log(`WARNING: ${unmappedBrand} rows had a BREND not found in brands table`);

    await client.query('COMMIT');

    // Final summary
    const { rows: finalCount } = await client.query(
      `SELECT
         (SELECT COUNT(*) FROM products)::int AS total,
         (SELECT COUNT(DISTINCT product_id) FROM product_images)::int AS with_images,
         (SELECT COUNT(*) FROM products WHERE group_slug IS NOT NULL)::int AS with_group_slug,
         (SELECT COUNT(*) FROM products WHERE brand_id IS NULL)::int AS missing_brand`,
    );
    console.log('\n=== FINAL ===', finalCount[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
