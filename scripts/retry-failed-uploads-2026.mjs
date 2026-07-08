/**
 * Retry the 6 photos that failed in the main 2026 upload.
 *  - Oversized (>10MB) files are downscaled with `sips` (max 2200px, q80) to a temp copy first.
 *  - Results are merged into cloudinary-url-map-2026.json + cloudinary-urls-by-code-2026.json.
 */
import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const PHOTOS = "/Users/nikola/Downloads/fotke alatamoda/wetransfer_ams-foto-baza-sve_2026-06-25_1541";
const FOLDER = "altamoda/products";
const MAX = 10 * 1024 * 1024;

// filename -> canonical public_id (clean EAN_n)
const FAILED = {
  "3474637152000_11.png": "3474637152000_11",
  "3474637258719_2.jpg": "3474637258719_2",
  "3474637327422_2.jpg": "3474637327422_2",
  "3474637327422_5.jpg": "3474637327422_5",
  "3474637327422_3.jpg": "3474637327422_3",
  "8032505872792_2.jpg": "8032505872792_2",
};

const { v2: cloudinary } = await import("cloudinary");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "amsretry-"));
const results = {};

for (const [file, publicId] of Object.entries(FAILED)) {
  let src = path.join(PHOTOS, file);
  const size = fs.statSync(src).size;
  if (size > MAX) {
    const out = path.join(tmp, file.replace(/\.[^.]+$/, ".jpg"));
    execFileSync("sips", ["-s", "format", "jpeg", "-Z", "2200", "--setProperty", "formatOptions", "80", src, "--out", out]);
    const newSize = fs.statSync(out).size;
    console.log(`downscaled ${file}: ${(size/1e6).toFixed(1)}MB -> ${(newSize/1e6).toFixed(1)}MB`);
    src = out;
  }
  try {
    const res = await cloudinary.uploader.upload(src, {
      folder: FOLDER, public_id: publicId, overwrite: true, resource_type: "image",
    });
    results[publicId] = res.secure_url;
    console.log(`OK  ${publicId} -> ${res.secure_url}`);
  } catch (e) {
    console.error(`STILL FAILED ${publicId}: ${e?.message || JSON.stringify(e)}`);
  }
}

// Merge into existing maps
const mapPath = "scripts/cloudinary-url-map-2026.json";
const byCodePath = "scripts/cloudinary-urls-by-code-2026.json";
const map = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
const byCode = JSON.parse(fs.readFileSync(byCodePath, "utf-8"));

const codeOf = (pid) => (pid.match(/^(.+?)_(\d+)$/) || [, pid])[1];
const idxOf = (pid) => { const m = pid.match(/^(.+?)_(\d+)$/); return m ? Number(m[2]) : 0; };

for (const [publicId, url] of Object.entries(results)) map[publicId] = url;

// Rebuild by-code lists for every touched code, straight from the merged publicId map.
const touched = new Set(Object.keys(results).map(codeOf));
for (const code of touched) {
  byCode[code] = Object.keys(map)
    .filter((pid) => codeOf(pid) === code)
    .sort((a, b) => idxOf(a) - idxOf(b))
    .map((pid) => map[pid]);
}

fs.writeFileSync(mapPath, JSON.stringify(map, null, 2));
fs.writeFileSync(byCodePath, JSON.stringify(byCode, null, 2));
console.log(`\nMerged ${Object.keys(results).length} URLs into maps.`);
