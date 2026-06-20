// Wipe altamoda_local_final.products and re-insert every row from the
// FINAL!-2 Excel. Photos for matched SKUs are preserved by snapshotting
// product_images keyed by sku, then re-attaching after the wipe.
//
// Dedupe policy:
//   - Variant rows (under a section header): inserted as-is. Color codes like
//     "8G" / "4NN" legitimately recur across different parent groups; they
//     are disambiguated by parent_naziv (composite name + group_slug).
//   - Standalone rows: deduped by NAZIV. If Excel lists the same standalone
//     product name twice with different IDENTs (e.g. Biolage Color Last
//     šampon 400ml), keep one row, log the rest. Prefer the IDENT that
//     already has photos in the snapshot.

import XLSX from 'xlsx';
import { Client } from 'pg';
import crypto from 'node:crypto';

const EXCEL_PATH = '/Users/nikola/Downloads/AMS sajt 2026. baza B2C i B2B, FINAL!-2.xlsx';
const SHEET_NAME = 'AMS final baza';
const DB_URL = 'postgresql://nikola@localhost:5432/altamoda_local_final';

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

function title(s) {
  return s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

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
    // Standalone if NAZIV starts with the brand (e.g. "Redken Brews Outplay...")
    // OR contains a size suffix like "500ml", "75g", "1.5kg" — those are full
    // product names, not bare color codes. Variant codes like "1NN", "8AB",
    // "10HC/10.64" never carry a size unit.
    // Real product sizes follow a word: "pomada 100ml", "puder 232g", "X 1.5kg".
    // Color codes like "10G", "010NA" sit at the start of NAZIV with no preceding
    // word; requiring whitespace before the digits rejects them.
    const hasSizeSuffix = /\s\d{1,4}(?:[.,]\d+)?\s?(?:ml|g|kg|oz)\b/i.test(row.naziv);
    const isStandalone = (brendL && nazivL.startsWith(brendL.split(' ')[0])) || hasSizeSuffix;
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

async function snapshotImages(client) {
  const { rows } = await client.query(`
    SELECT p.sku, pi.url, pi.alt_text, pi.type, pi.sort_order, pi.is_primary
    FROM product_images pi
    JOIN products p ON p.id = pi.product_id
    ORDER BY p.sku, pi.sort_order, pi.is_primary DESC
  `);
  const bySku = new Map();
  for (const r of rows) {
    if (!bySku.has(r.sku)) bySku.set(r.sku, []);
    bySku.get(r.sku).push(r);
  }
  return bySku;
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
    console.log(`  created category: ${display}`);
  }
  return map;
}

async function main() {
  const excel = readExcel();
  const productRows = excel.filter((r) => r.kind === 'product');
  const sectionHeaders = excel.filter((r) => r.kind === 'section_header');
  console.log(`Excel: ${productRows.length} product rows, ${sectionHeaders.length} section headers`);

  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  try {
    await client.query('BEGIN');

    // 1. Snapshot photos by sku.
    const imagesBySku = await snapshotImages(client);
    const photoSkuCount = imagesBySku.size;
    let photoTotal = 0;
    for (const arr of imagesBySku.values()) photoTotal += arr.length;
    console.log(`Snapshot: ${photoTotal} images across ${photoSkuCount} SKUs`);

    // 2. Wipe products (cascade clears product_images, color_products, etc.).
    await client.query('DELETE FROM cart_items');
    await client.query('DELETE FROM wishlists');
    const del = await client.query('DELETE FROM products');
    console.log(`Deleted products: ${del.rowCount}`);

    // 3. Categories.
    const catTokens = new Set();
    for (const r of productRows) {
      const first = (r.kategorija || '').split(',')[0].trim();
      if (first) catTokens.add(title(first));
    }
    const catMap = await ensureCategories(client, [...catTokens]);

    // 4. Brand map (case-insensitive by name).
    const brandRows = (await client.query(`SELECT id, name FROM brands`)).rows;
    const brandMap = new Map(brandRows.map((b) => [b.name.toLowerCase().trim(), b.id]));

    // 5. Dedupe standalones by NAZIV. Prefer rows whose IDENT has a photo snapshot.
    const standalones = productRows.filter((r) => !r.parent_naziv);
    const variants = productRows.filter((r) => r.parent_naziv);
    const standaloneByName = new Map();
    for (const r of standalones) {
      if (!standaloneByName.has(r.naziv)) standaloneByName.set(r.naziv, []);
      standaloneByName.get(r.naziv).push(r);
    }
    const dedupedStandalones = [];
    const droppedStandalones = [];
    for (const [name, rows] of standaloneByName) {
      if (rows.length === 1) {
        dedupedStandalones.push(rows[0]);
        continue;
      }
      // Pick the one with photos; if tie, lowest IDENT.
      rows.sort((a, b) => {
        const ai = imagesBySku.has(a.ident) ? 0 : 1;
        const bi = imagesBySku.has(b.ident) ? 0 : 1;
        if (ai !== bi) return ai - bi;
        return a.ident.localeCompare(b.ident, undefined, { numeric: true });
      });
      dedupedStandalones.push(rows[0]);
      for (const dropped of rows.slice(1)) droppedStandalones.push(dropped);
    }
    console.log(`Standalones: ${standalones.length} → ${dedupedStandalones.length} after dedupe (${droppedStandalones.length} dropped)`);
    if (droppedStandalones.length) {
      console.log('  Dropped duplicate-NAZIV standalones:');
      for (const d of droppedStandalones) {
        console.log(`    "${d.naziv}" — IDENT ${d.ident} (kept the IDENT with photos / lower number)`);
      }
    }

    // 6. Insert.
    const slugSet = new Set();
    function uniqueSlug(base) {
      let s = slugify(base) || 'product';
      if (!slugSet.has(s)) { slugSet.add(s); return s; }
      for (let n = 2; n < 9999; n++) {
        const cand = `${s}-${n}`;
        if (!slugSet.has(cand)) { slugSet.add(cand); return cand; }
      }
      throw new Error(`slug overflow: ${base}`);
    }

    const skuToNewId = new Map();
    let insertCount = 0;
    const toInsert = [...dedupedStandalones, ...variants];
    for (const r of toInsert) {
      const isVariant = !!r.parent_naziv;
      const baseName = isVariant ? `${r.parent_naziv} / ${r.naziv}` : r.naziv;
      const slug = uniqueSlug(baseName);
      const groupSlug = isVariant ? slugify(r.parent_naziv) : null;
      const colorCode = isVariant ? r.naziv : null;
      const colorName = isVariant ? r.naziv : null;
      const brandId = r.brend ? brandMap.get(r.brend.toLowerCase().trim()) || null : null;
      const firstCat = (r.kategorija || '').split(',')[0].trim();
      const categoryId = firstCat ? catMap.get(title(firstCat)) || null : null;
      // Excel uses "-" in MP (retail) columns for collapsed-group variants —
      // those parse to null. Fall back to VP sa PDV so the storefront always
      // shows a non-zero price (per user request: "price should be seen sa PDV always").
      const priceB2b = r.vp_sa ?? r.vp_bez ?? null;
      const priceB2c = r.mp_sa ?? r.mp_bez ?? priceB2b ?? 0;
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
          priceB2c, priceB2b, 10, 5,
          false, true, false, false, false,
          20, groupSlug, colorCode, colorName,
          r.potkategorija || null, r.tip_proizvoda || null, r.tip_kose || null, r.tagovi || null,
          r.ean || null, now,
        ],
      );
      skuToNewId.set(r.ident, id);
      insertCount++;
    }
    console.log(`Inserted: ${insertCount}`);

    // 7. Reattach photos by sku.
    let imagesAttached = 0;
    for (const [sku, imgs] of imagesBySku) {
      const newId = skuToNewId.get(sku);
      if (!newId) continue; // dropped duplicate sku — its photos go to the kept twin instead
      for (const im of imgs) {
        await client.query(
          `INSERT INTO product_images (id, product_id, url, alt_text, type, sort_order, is_primary)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [cuid(), newId, im.url, im.alt_text, im.type, im.sort_order, im.is_primary],
        );
        imagesAttached++;
      }
    }
    // For dropped-duplicate skus: if their twin (kept sku) doesn't have photos,
    // transfer the dropped one's photos to the kept sku.
    for (const d of droppedStandalones) {
      const droppedImgs = imagesBySku.get(d.ident);
      if (!droppedImgs || droppedImgs.length === 0) continue;
      const keepRow = standaloneByName.get(d.naziv)[0];
      const keptHasPhotos = (imagesBySku.get(keepRow.ident) || []).length > 0;
      if (keptHasPhotos) continue;
      const keptNewId = skuToNewId.get(keepRow.ident);
      if (!keptNewId) continue;
      for (const im of droppedImgs) {
        await client.query(
          `INSERT INTO product_images (id, product_id, url, alt_text, type, sort_order, is_primary)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [cuid(), keptNewId, im.url, im.alt_text, im.type, im.sort_order, im.is_primary],
        );
        imagesAttached++;
      }
    }
    console.log(`Images re-attached: ${imagesAttached}`);

    await client.query('COMMIT');

    // Summary
    const finalRow = (await client.query(`SELECT
      (SELECT COUNT(*) FROM products)::int AS total,
      (SELECT COUNT(*) FROM products WHERE group_slug IS NULL)::int AS standalones,
      (SELECT COUNT(DISTINCT group_slug) FROM products WHERE group_slug IS NOT NULL)::int AS groups,
      (SELECT COUNT(DISTINCT product_id) FROM product_images)::int AS with_images,
      (SELECT COUNT(*) FROM products WHERE brand_id IS NULL)::int AS missing_brand`)).rows[0];
    console.log('\n=== FINAL ===', finalRow);
    console.log(`Collapsed storefront listings: ${finalRow.standalones + finalRow.groups}`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
