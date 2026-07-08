import xlsx from "xlsx";
import fs from "fs";
import path from "path";

const EXCEL = "/Users/nikola/Downloads/AMS sajt 2026. baza B2C i B2B, FINAL! FINALA (1).xlsx";
const PHOTOS = "/Users/nikola/Downloads/fotke alatamoda/wetransfer_ams-foto-baza-sve_2026-06-25_1541";

const wb = xlsx.readFile(EXCEL);
const rows = xlsx.utils.sheet_to_json(wb.Sheets["AMS final baza"], { defval: null });

const norm = (s) => String(s ?? "").trim();
const normBrand = (s) => norm(s).toUpperCase().replace(/[’'`]/g, "'");

// Identify exception brands
const IDENT_BRANDS = new Set(["ELCHIM", "L'IMAGE", "LIMAGE", "L IMAGE"]);
const isIdentBrand = (b) => {
  const u = normBrand(b);
  return u.includes("ELCHIM") || u.includes("IMAGE");
};

// Build product map keyed by expected base code
const products = [];
const byCode = new Map();
const dupCodes = [];
for (const r of rows) {
  const ean = norm(r["EAN CODE"]);
  const ident = norm(r["IDENT"]);
  const brand = norm(r["BREND"]);
  const useIdent = isIdentBrand(brand);
  const code = useIdent ? ident : ean;
  const p = { ident, ean, brand, naziv: norm(r["NAZIV"]), useIdent, code };
  products.push(p);
  if (!code) continue;
  if (byCode.has(code)) dupCodes.push(code);
  else byCode.set(code, p);
}

// Distinct brands containing image/elchim
const exceptionRows = products.filter((p) => p.useIdent);
console.log("=== EXCEPTION (IDENT-named) brands found in Excel ===");
const exByBrand = {};
for (const p of exceptionRows) exByBrand[p.brand] = (exByBrand[p.brand]||0)+1;
console.log(exByBrand);
console.log("Exception products:", exceptionRows.map(p=>`${p.brand} IDENT=${p.ident} EAN=${p.ean}`).join("\n  "));

// Scan photos -> group by base code
const files = fs.readdirSync(PHOTOS).filter(f => /\.(jpe?g|png|tif|gif|webp)$/i.test(f));
const groups = new Map(); // baseCode -> [filenames]
const baseOf = (f) => {
  const name = path.parse(f).name; // strip ext
  const m = name.match(/^(.*?)(?:_(\d+))?$/); // strip trailing _N
  // careful: only strip if there is a _digits suffix
  const mm = name.match(/^(.+?)[-_](\d+)$/);
  return mm ? mm[1] : name;
};
for (const f of files) {
  const b = baseOf(f);
  if (!groups.has(b)) groups.set(b, []);
  groups.get(b).push(f);
}

// Cross-check
let photoCodesMatched = 0, photoCodesUnmatched = [];
for (const [code, fl] of groups) {
  if (byCode.has(code)) photoCodesMatched++;
  else photoCodesUnmatched.push({ code, count: fl.length, sample: fl.slice(0,3) });
}
const productsWithPhotos = products.filter(p => p.code && groups.has(p.code));
const productsNoCode = products.filter(p => !p.code);
const productsNoPhotos = products.filter(p => p.code && !groups.has(p.code));

console.log("\n=== SUMMARY ===");
console.log("Excel products:", products.length);
console.log("  products with usable code:", products.length - productsNoCode.length);
console.log("  products missing code (no EAN/IDENT):", productsNoCode.length);
console.log("Photo files total:", files.length);
console.log("Distinct photo base-codes:", groups.size);
console.log("  base-codes matched to a product:", photoCodesMatched);
console.log("  base-codes WITHOUT a product:", photoCodesUnmatched.length);
console.log("Products that HAVE >=1 photo:", productsWithPhotos.length);
console.log("Products with code but NO photo:", productsNoPhotos.length);
console.log("Duplicate codes in Excel:", [...new Set(dupCodes)].length);

console.log("\n=== Unmatched photo base-codes (first 25) ===");
for (const u of photoCodesUnmatched.slice(0,25)) console.log(` ${u.code} (${u.count}) e.g. ${u.sample.join(", ")}`);

console.log("\n=== Products with NO photo (first 25) ===");
for (const p of productsNoPhotos.slice(0,25)) console.log(` ${p.brand} | code=${p.code} | ${p.naziv}`);

// Write full report json
const report = {
  exceptionBrands: exByBrand,
  counts: {
    products: products.length, productsNoCode: productsNoCode.length,
    photoFiles: files.length, distinctCodes: groups.size,
    matchedCodes: photoCodesMatched, unmatchedCodes: photoCodesUnmatched.length,
    productsWithPhotos: productsWithPhotos.length, productsNoPhotos: productsNoPhotos.length,
  },
  unmatchedPhotoCodes: photoCodesUnmatched,
  productsNoPhotos: productsNoPhotos.map(p=>({brand:p.brand,code:p.code,ean:p.ean,ident:p.ident,naziv:p.naziv})),
  duplicateCodes: [...new Set(dupCodes)],
};
fs.writeFileSync("scripts/photo-map-report.json", JSON.stringify(report,null,2));
console.log("\nFull report -> scripts/photo-map-report.json");
