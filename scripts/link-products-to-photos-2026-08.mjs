/**
 * Link DB products to the 2026-08 Cloudinary photo base (transfer-019fdc87).
 *
 * The by-code map is the UNION of the July base (cloudinary-urls-by-code-2026.json)
 * and the August delivery (cloudinary-urls-by-code-2026-08.json): the August
 * delivery is mostly the same photos plus additions, but a few codes ship only
 * the *new* suffixes (e.g. 3474636484805_13/_14), so a plain replace would drop
 * that product's older photos. Union by public_id, ordered by suffix, keeps both.
 *
 * Match key: EAN (normal products -> Product.barcode) or IDENT (Elchim/L'image
 * -> Product.sku). For each matched product the ProductImage rows are REPLACED
 * with the ordered set (_1 becomes the primary image).
 *
 * Usage:
 *   node scripts/link-products-to-photos-2026-08.mjs            # dry run
 *   node scripts/link-products-to-photos-2026-08.mjs --apply    # write to DB
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();
const APPLY = process.argv.includes("--apply");
const conn = process.env.DATABASE_URL;
if (!conn) { console.error("Missing DATABASE_URL"); process.exit(1); }
console.log(`TARGET DB: local (${new URL(conn).hostname})`);
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: conn }) });

const oldMap = JSON.parse(fs.readFileSync("scripts/cloudinary-urls-by-code-2026.json", "utf-8"));
const newMap = JSON.parse(fs.readFileSync("scripts/cloudinary-urls-by-code-2026-08.json", "utf-8"));

// public_id ("<code>_<n>" or bare "<code>") -> suffix number for ordering
const suffixOf = (url) => {
  const id = url.split("/").pop().replace(/\.[a-z]+$/i, "");
  const m = id.match(/_(\d+)$/);
  return m ? Number(m[1]) : 0;
};
const publicIdOf = (url) => url.split("/").pop().replace(/\.[a-z]+$/i, "");

const byCode = {};
const allCodes = new Set([...Object.keys(oldMap), ...Object.keys(newMap)]);
let unionGain = 0;
for (const code of allCodes) {
  const seen = new Map(); // publicId -> url (old wins: versioned URL)
  for (const url of newMap[code] ?? []) seen.set(publicIdOf(url), url);
  for (const url of oldMap[code] ?? []) seen.set(publicIdOf(url), url);
  const urls = [...seen.values()].sort((a, b) => suffixOf(a) - suffixOf(b));
  if (urls.length > (newMap[code]?.length ?? 0) && (newMap[code]?.length ?? 0) > 0) unionGain++;
  byCode[code] = urls;
}
console.log(`codes: old=${Object.keys(oldMap).length} new=${Object.keys(newMap).length} union=${allCodes.size} (codes where union > new: ${unionGain})`);

const products = await prisma.product.findMany({ select: { id: true, sku: true, barcode: true, nameLat: true } });
const byBarcode = new Map();
const bySku = new Map();
for (const p of products) {
  if (p.barcode) byBarcode.set(String(p.barcode).trim(), p);
  if (p.sku) bySku.set(String(p.sku).trim(), p);
}

const matched = [];
const unmatched = [];
const usedProductIds = new Set();
for (const [code, urls] of Object.entries(byCode)) {
  if (!urls.length) continue;
  const product = byBarcode.get(code) || bySku.get(code);
  if (!product) { unmatched.push({ code, n: urls.length }); continue; }
  if (usedProductIds.has(product.id)) continue;
  usedProductIds.add(product.id);
  matched.push({ product, urls });
}

const totalImgs = matched.reduce((a, m) => a + m.urls.length, 0);
console.log("=== LINK PLAN ===");
console.log("matched to a product:", matched.length);
console.log("unmatched codes:", unmatched.length, unmatched.slice(0, 10).map((u) => u.code));
console.log("image rows that would be written:", totalImgs);
console.log("products in DB with no code match (untouched):", products.length - matched.length);

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
