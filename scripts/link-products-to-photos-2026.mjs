/**
 * Link DB products to the 2026 Cloudinary photo base.
 *
 * Match key: cloudinary-urls-by-code-2026.json is keyed by EAN (normal) or IDENT (Elchim/L'image).
 *   - normal products  -> Product.barcode == code
 *   - exception/all     -> Product.sku     == code   (sku mirrors the ERP IDENT)
 *
 * For each matched product we REPLACE its ProductImage rows with the new ordered set
 * (sortOrder 0..n following the _1,_2,_3 photo order). Unmatched products are left untouched.
 *
 * Usage:
 *   node scripts/link-products-to-photos-2026.mjs            # dry run (no writes)
 *   node scripts/link-products-to-photos-2026.mjs --apply    # write to DB
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const APPLY = process.argv.includes("--apply");
const PROD = process.argv.includes("--prod");
const conn = PROD ? process.env.DATABASE_URL_PROD : process.env.DATABASE_URL;
if (!conn) { console.error("Missing connection string"); process.exit(1); }
console.log(`TARGET DB: ${PROD ? "PRODUCTION" : "local"} (${new URL(conn).hostname})`);
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: conn }) });

const byCode = JSON.parse(fs.readFileSync("scripts/cloudinary-urls-by-code-2026.json", "utf-8"));

const products = await prisma.product.findMany({ select: { id: true, sku: true, barcode: true, nameLat: true } });
const byBarcode = new Map();
const bySku = new Map();
for (const p of products) {
  if (p.barcode) byBarcode.set(String(p.barcode).trim(), p);
  if (p.sku) bySku.set(String(p.sku).trim(), p);
}

const matched = [];     // { product, urls }
const unmatched = [];   // codes with no product
const usedProductIds = new Set();

for (const [code, urls] of Object.entries(byCode)) {
  if (!urls.length) continue;
  const product = byBarcode.get(code) || bySku.get(code);
  if (!product) { unmatched.push({ code, n: urls.length }); continue; }
  if (usedProductIds.has(product.id)) {
    // two codes -> same product (shouldn't happen); skip the dup
    continue;
  }
  usedProductIds.add(product.id);
  matched.push({ product, urls });
}

const totalImgs = matched.reduce((a, m) => a + m.urls.length, 0);
console.log("=== LINK PLAN ===");
console.log("codes in map:", Object.keys(byCode).length);
console.log("matched to a product:", matched.length);
console.log("unmatched codes:", unmatched.length);
console.log("image rows that would be written:", totalImgs);
console.log("products in DB that stay untouched:", products.length - matched.length);
console.log("\nunmatched codes (no product):");
for (const u of unmatched) console.log(`  ${u.code} (${u.n} photos)`);

if (!APPLY) {
  console.log("\nDRY RUN — no DB writes. Re-run with --apply to write.");
  await prisma.$disconnect();
  process.exit(0);
}

console.log("\nApplying...");
let done = 0;
for (const { product, urls } of matched) {
  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: product.id } }),
    prisma.productImage.createMany({
      data: urls.map((url, i) => ({
        productId: product.id,
        url,
        altText: product.nameLat,
        sortOrder: i,
        isPrimary: i === 0,
      })),
    }),
  ]);
  done++;
  if (done % 100 === 0) console.log(`  ${done}/${matched.length}`);
}
console.log(`\nDone! Linked ${done} products, ${totalImgs} image rows.`);
await prisma.$disconnect();
