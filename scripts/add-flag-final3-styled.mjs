// Adds the "FOTO NA SAJTU" column to FINAL!-3.xlsx WITHOUT touching its rich
// styling. SheetJS write would strip the bold/rich text, so instead we edit the
// worksheet XML inside the .xlsx zip directly, inserting one inline-string cell
// (column U) per row. Flags are computed from the DB exactly like the FINAL!-2
// pass: products -> DA/NE (group-aware photo coverage), named group headers -> —.
//
// The surrounding bash wrapper extracts xl/worksheets/sheet1.xml and
// xl/workbook.xml into a work dir; this script rewrites them in place; the
// wrapper rezips them into the output file.
//
// Usage: node scripts/add-flag-final3-styled.mjs <workDir>

import XLSX from 'xlsx';
import { Client } from 'pg';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const WORK = process.argv[2];
if (!WORK) throw new Error('workDir arg required');
const EXCEL = '/Users/nikola/Downloads/AMS sajt 2026. baza B2C i B2B, FINAL!-3.xlsx';
const SHEET = 'AMS final baza';
const DB_URL = 'postgresql://nikola@localhost:5432/altamoda_local_final';
const HEADER = 'FOTO NA SAJTU';
const SHEET_XML = resolve(WORK, 'xl/worksheets/sheet1.xml');
const WB_XML = resolve(WORK, 'xl/workbook.xml');

async function loadDb(client) {
  const { rows: products } = await client.query(
    'select id, sku, group_slug from products',
  );
  const { rows: images } = await client.query('select product_id, url from product_images');
  const bySku = new Map();
  for (const p of products) if (p.sku) bySku.set(String(p.sku).trim(), p);
  const cloudByProduct = new Map();
  for (const im of images)
    if (im.url && im.url.includes('cloudinary'))
      cloudByProduct.set(im.product_id, (cloudByProduct.get(im.product_id) || 0) + 1);
  const cloudByGroup = new Map();
  for (const p of products)
    if (p.group_slug)
      cloudByGroup.set(p.group_slug, (cloudByGroup.get(p.group_slug) || 0) + (cloudByProduct.get(p.id) || 0));
  return { bySku, cloudByProduct, cloudByGroup };
}

const hasPhoto = (p, db) =>
  p.group_slug ? (db.cloudByGroup.get(p.group_slug) || 0) > 0 : (db.cloudByProduct.get(p.id) || 0) > 0;

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  const db = await loadDb(client);
  await client.end();

  // Flags per spreadsheet row via SheetJS (cell addresses, robust to gaps).
  const wb = XLSX.readFile(EXCEL);
  const ws = wb.Sheets[SHEET];
  const ref = XLSX.utils.decode_range(ws['!ref']);
  const get = (r, c) => {
    const cell = ws[XLSX.utils.encode_cell({ r, c })];
    return cell == null ? '' : String(cell.v).trim();
  };
  const flagByRow = new Map(); // 1-based spreadsheet row -> flag
  const stats = { DA: 0, NE: 0, '—': 0, blank: 0 };
  for (let r = ref.s.r + 1; r <= ref.e.r; r++) {
    const ident = get(r, 0);
    const naziv = get(r, 2);
    let flag = '';
    if (ident) {
      const p = db.bySku.get(ident);
      flag = p ? (hasPhoto(p, db) ? 'DA' : 'NE') : 'NE';
    } else if (naziv && !/^\d+$/.test(naziv)) {
      flag = '—';
    }
    if (flag) {
      flagByRow.set(r + 1, flag); // SheetJS row r (0-based) -> spreadsheet row r+1
      stats[flag]++;
    } else stats.blank++;
  }

  // --- Edit worksheet XML ---
  let xml = readFileSync(SHEET_XML, 'utf8');
  xml = xml.replace('<dimension ref="A1:T1010"/>', '<dimension ref="A1:U1010"/>');
  xml = xml.replace('<autoFilter ref="A1:T1010"/>', '<autoFilter ref="A1:U1010"/>');
  xml = xml.replace(/spans="1:20"/g, 'spans="1:21"');

  let added = 0;
  xml = xml.replace(/(<row r="(\d+)"[^>]*>)([\s\S]*?)(<\/row>)/g, (m, open, rn, body, close) => {
    const n = Number(rn);
    let cell = '';
    if (n === 1) {
      cell = `<c r="U1" s="16" t="inlineStr"><is><t>${xmlEscape(HEADER)}</t></is></c>`;
    } else if (flagByRow.has(n)) {
      cell = `<c r="U${n}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(flagByRow.get(n))}</t></is></c>`;
    }
    if (cell) added++;
    return open + body + cell + close;
  });
  writeFileSync(SHEET_XML, xml, 'utf8');

  // --- Keep _FilterDatabase defined name in sync with the widened autofilter ---
  let wbxml = readFileSync(WB_XML, 'utf8');
  wbxml = wbxml.replace("'AMS final baza'!$A$1:$T$1010", "'AMS final baza'!$A$1:$U$1010");
  writeFileSync(WB_XML, wbxml, 'utf8');

  console.log('Flags computed:', stats);
  console.log('U cells inserted (incl. header):', added);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
