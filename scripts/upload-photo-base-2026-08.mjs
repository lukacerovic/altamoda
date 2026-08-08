/**
 * Upload the 2026 FINAL FINALA photo base to Cloudinary.
 *
 * Naming rules (per Zora's instructions):
 *  - Normal products: photo filename = EAN CODE (single) or EAN_1, EAN_2 ... (multiple)
 *  - Exception brands Elchim & L'image: photo filename = IDENT (their internal program id)
 *
 * This script normalizes dirty filenames (trailing spaces, a dropped leading "3",
 * hyphen "-N" separators used instead of "_N") to a CLEAN canonical public_id of the
 * form  <code>  or  <code>_<n>  where <code> is the product's real EAN/IDENT.
 *
 * Usage:
 *   node scripts/upload-photo-base-2026.mjs --dry-run   # plan only, no API calls, no creds needed
 *   node scripts/upload-photo-base-2026.mjs             # actually upload (needs CLOUDINARY_* env)
 */
import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

// Load .env.local first (project convention), then .env as fallback.
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config();

const EXCEL = "/Users/lukacerovic/Downloads/! AMS sajt 2026_1. baza B2C i B2B, FINAL FINALA, jul FINAL!!! - Copy.xlsx";
const PHOTOS = "/Users/lukacerovic/Downloads/transfer-019fdc87";
const FOLDER = "altamoda/products";
const BATCH_SIZE = 10;
const DRY = process.argv.includes("--dry-run");

const norm = (s) => String(s ?? "").trim();
const isExceptionBrand = (b) => {
  const u = norm(b).toUpperCase();
  return u.includes("ELCHIM") || u.includes("IMAGE");
};

// ---- Build product code map from Excel ----
const wb = xlsx.readFile(EXCEL);
const rows = xlsx.utils.sheet_to_json(wb.Sheets["AMS final baza"], { defval: null });
const byCode = new Map(); // code -> product
for (const r of rows) {
  const useIdent = isExceptionBrand(r["BREND"]);
  const code = useIdent ? norm(r["IDENT"]) : norm(r["EAN CODE"]);
  if (!code) continue;
  byCode.set(code, {
    code,
    ean: norm(r["EAN CODE"]),
    ident: norm(r["IDENT"]),
    brand: norm(r["BREND"]),
    naziv: norm(r["NAZIV"]),
    useIdent,
  });
}

// ---- Resolve a filename to (code, suffix, orphan) ----
function resolve(filename) {
  const name = path.parse(filename).name;
  const m = name.match(/^(.+?)[-_](\d+)$/); // trailing _N or -N
  const rawBase = m ? m[1] : name;
  const suffix = m ? Number(m[2]) : null;
  const base = rawBase.trim(); // strip stray whitespace (e.g. "...142    ")

  let code, orphan = false;
  if (byCode.has(base)) code = base;
  else if (byCode.has("3" + base)) code = "3" + base; // dropped leading "3"
  else { code = base; orphan = true; }

  const publicId = suffix != null ? `${code}_${suffix}` : code;
  return { code, suffix, orphan, publicId };
}

// ---- Scan photos & build plan ----
const files = fs
  .readdirSync(PHOTOS)
  .filter((f) => /\.(jpe?g|png|tif|gif|webp)$/i.test(f))
  .sort();

const plan = [];            // { file, publicId, code, orphan, suffix }
const usedByCode = new Map(); // code -> Set<number|null> of taken suffixes
const remapped = [];         // files whose suffix was bumped to avoid a collision
const orphans = [];
const perProduct = new Map(); // code -> [{suffix, publicId, file}]

const takeSuffix = (code, proposed) => {
  if (!usedByCode.has(code)) usedByCode.set(code, new Set());
  const used = usedByCode.get(code);
  // bare-code (no suffix) only allowed once; otherwise fall through to integers
  if (proposed === null && !used.has(null)) { used.add(null); return null; }
  let n = proposed === null ? 1 : proposed;
  while (used.has(n)) n++;
  used.add(n);
  return n;
};

for (const file of files) {
  const r = resolve(file);
  const finalSuffix = takeSuffix(r.code, r.suffix);
  if (finalSuffix !== r.suffix) remapped.push({ file, from: r.publicId, to: `${r.code}_${finalSuffix}` });
  const publicId = finalSuffix === null ? r.code : `${r.code}_${finalSuffix}`;
  if (r.orphan) orphans.push(file);
  plan.push({ file, code: r.code, orphan: r.orphan, suffix: finalSuffix, publicId });
  if (!perProduct.has(r.code)) perProduct.set(r.code, []);
  perProduct.get(r.code).push({ suffix: finalSuffix, publicId, file });
}

console.log(`Photos: ${files.length} | distinct public_ids: ${new Set(plan.map((p) => p.publicId)).size}`);
console.log(`Products covered: ${[...perProduct.keys()].filter((c) => byCode.has(c)).length}`);
console.log(`Orphan files (no product): ${orphans.length}${orphans.length ? " -> " + orphans.join(", ") : ""}`);
console.log(`Re-indexed (collision-avoided): ${remapped.length}`);
for (const c of remapped) console.log(`  ~ ${c.file}: ${c.from} -> ${c.to}`);

// Write the plan manifest (useful for review / later DB linking)
fs.writeFileSync(
  "scripts/photo-upload-plan-2026-08.json",
  JSON.stringify(
    {
      folder: FOLDER,
      total: files.length,
      orphans,
      remapped,
      perProduct: Object.fromEntries(
        [...perProduct.entries()].map(([code, imgs]) => [
          code,
          imgs.sort((a, b) => (a.suffix ?? 0) - (b.suffix ?? 0)).map((i) => i.publicId),
        ])
      ),
    },
    null,
    2
  )
);
console.log("Plan -> scripts/photo-upload-plan-2026-08.json");

if (DRY) {
  console.log("\nDRY RUN — no uploads performed.");
  process.exit(0);
}

// ---- Real upload ----
const { v2: cloudinary } = await import("cloudinary");
const need = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
const missing = need.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`\nMissing credentials: ${missing.join(", ")}. Add them to .env.local and re-run.`);
  process.exit(1);
}
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadOne({ file, publicId }) {
  const fp = path.join(PHOTOS, file);
  try {
    const res = await cloudinary.uploader.upload(fp, {
      folder: FOLDER,
      public_id: publicId,
      overwrite: false,
      resource_type: "image",
    });
    return { publicId, url: res.secure_url };
  } catch (err) {
    if (err?.http_code === 409) {
      const url = cloudinary.url(`${FOLDER}/${publicId}`, { secure: true });
      return { publicId, url, existed: true };
    }
    console.error(`FAILED ${file} (${publicId}): ${err?.message || err}`);
    return null;
  }
}

const urlByPublicId = {};
let ok = 0, fail = 0;
for (let i = 0; i < plan.length; i += BATCH_SIZE) {
  const batch = plan.slice(i, i + BATCH_SIZE);
  const results = await Promise.all(batch.map(uploadOne));
  for (const r of results) {
    if (r) { urlByPublicId[r.publicId] = r.url; ok++; }
    else fail++;
  }
  console.log(`Progress ${Math.min(i + BATCH_SIZE, plan.length)}/${plan.length} (ok=${ok} fail=${fail})`);
}

// code -> ordered [urls]
const urlByCode = {};
for (const [code, imgs] of perProduct) {
  urlByCode[code] = imgs
    .sort((a, b) => (a.suffix ?? 0) - (b.suffix ?? 0))
    .map((i) => urlByPublicId[i.publicId])
    .filter(Boolean);
}

fs.writeFileSync("scripts/cloudinary-url-map-2026-08.json", JSON.stringify(urlByPublicId, null, 2));
fs.writeFileSync("scripts/cloudinary-urls-by-code-2026-08.json", JSON.stringify(urlByCode, null, 2));
console.log(`\nDone! uploaded/existed=${ok} failed=${fail}`);
console.log("Maps -> scripts/cloudinary-url-map-2026-08.json, scripts/cloudinary-urls-by-code-2026-08.json");
