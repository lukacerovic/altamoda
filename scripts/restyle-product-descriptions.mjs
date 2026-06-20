// Re-style the 5 product long-text fields as semantic HTML, sourcing the
// formatting (bold runs, paragraph breaks, bullet lists) from the rich text in
// FINAL!-3.xlsx. The plain text of these cells is byte-identical to what's
// already in the DB (verified), so this is a pure formatting upgrade — the
// words never change. An integrity guard enforces that: the generated HTML,
// stripped back to text, must equal the current DB value.
//
// Fields (Excel column -> DB column):
//   OPIS        -> description
//   UPOTREBA    -> usage_instructions
//   SASTAV      -> ingredients
//   BENEFITI    -> benefits
//   DEKLARACIJA -> declaration
//
// Frontend already renders these via dangerouslySetInnerHTML + DOMPurify with
// Tailwind styles for <strong>/<p>/<ul>/<li>, so no frontend change is needed.
//
// Usage:
//   node scripts/restyle-product-descriptions.mjs            # dry run (samples + stats)
//   node scripts/restyle-product-descriptions.mjs --apply    # write to local DB

import XLSX from 'xlsx';
import { Client } from 'pg';

const EXCEL = '/Users/nikola/Downloads/AMS sajt 2026. baza B2C i B2B, FINAL!-3.xlsx';
const SHEET = 'AMS final baza';
const DB_URL = 'postgresql://nikola@localhost:5432/altamoda_local_final';
const APPLY = process.argv.includes('--apply');

const FIELDS = [
  { xl: 'OPIS', db: 'description' },
  { xl: 'UPOTREBA', db: 'usage_instructions' },
  { xl: 'SASTAV', db: 'ingredients' },
  { xl: 'BENEFITI', db: 'benefits' },
  { xl: 'DEKLARACIJA', db: 'declaration' },
];

// Decode the handful of entities SheetJS emits, for the integrity comparison.
const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x0*([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#0*(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));

// Normalize text for integrity comparison: strip tags, drop bullet glyphs,
// decode entities, collapse all whitespace.
const normText = (s) =>
  decode(String(s == null ? '' : s).replace(/<[^>]+>/g, ' '))
    .replace(/[•·]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// cell.h (SheetJS rich-text HTML) -> trimmed lines that may contain inline
// <strong>. SheetJS already HTML-escapes the text content, so we only normalize
// tags (no re-escaping). Span wrappers carry font-size only and are dropped.
function toLines(h) {
  let s = String(h);
  s = s.replace(/&#x0*0?d;/gi, '').replace(/&#x0*0?a;/gi, ''); // CR/LF artifacts
  s = s.replace(/<\/?span[^>]*>/gi, ''); // drop font-size spans
  s = s.replace(/<b>/gi, '<strong>').replace(/<\/b>/gi, '</strong>'); // bold -> strong
  s = s.replace(/<br\s*\/?>/gi, '\n'); // breaks -> newlines
  s = s.replace(/<(?!\/?strong\b)[^>]+>/gi, ''); // strip every tag except <strong>
  return s.split('\n').map((ln) => ln.trim());
}

// Build semantic HTML from lines: blank line => block break; •-lines => <ul>;
// runs of normal lines => one <p> with <br/> between them.
function linesToHtml(lines) {
  const blocks = [];
  let para = [];
  let list = [];
  const flushPara = () => {
    if (para.length) blocks.push('<p>' + para.join('<br/>') + '</p>');
    para = [];
  };
  const flushList = () => {
    if (list.length) blocks.push('<ul>' + list.map((li) => '<li>' + li + '</li>').join('') + '</ul>');
    list = [];
  };
  for (const raw of lines) {
    const ln = raw.trim();
    if (!ln) {
      flushPara();
      flushList();
      continue;
    }
    const bullet = ln.match(/^[•·]\s*(.*)$/);
    if (bullet) {
      flushPara();
      const item = bullet[1].trim();
      if (item) list.push(item);
    } else {
      flushList();
      para.push(ln);
    }
  }
  flushPara();
  flushList();
  return blocks.join('');
}

function cellToHtml(h) {
  if (h == null || h === '') return '';
  return linesToHtml(toLines(h));
}

function readExcel() {
  const wb = XLSX.readFile(EXCEL, { cellHTML: true });
  const ws = wb.Sheets[SHEET];
  const ref = XLSX.utils.decode_range(ws['!ref']);
  const hdr = {};
  for (let c = ref.s.c; c <= ref.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) hdr[String(cell.v).trim()] = c;
  }
  const colOf = (name) => hdr[name] ?? hdr[name + ' '];
  const identCol = colOf('IDENT') ?? 0;
  const fieldCols = FIELDS.map((f) => ({ ...f, col: colOf(f.xl) }));
  const out = new Map(); // ident -> { dbField: html }
  for (let r = 1; r <= ref.e.r; r++) {
    const idc = ws[XLSX.utils.encode_cell({ r, c: identCol })];
    const ident = idc ? String(idc.v).trim() : '';
    if (!ident) continue;
    const rec = {};
    for (const f of fieldCols) {
      const cell = f.col == null ? null : ws[XLSX.utils.encode_cell({ r, c: f.col })];
      rec[f.db] = cell ? cellToHtml(cell.h ?? cell.w ?? cell.v ?? '') : '';
    }
    out.set(ident, rec);
  }
  return out;
}

async function main() {
  const xl = readExcel();
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  const { rows } = await client.query(
    'select id, sku, description, usage_instructions, ingredients, benefits, declaration from products',
  );

  const stats = {};
  for (const f of FIELDS) stats[f.db] = { updated: 0, unchanged: 0, integrityFail: 0, noExcel: 0 };
  const failures = [];
  const updates = []; // { id, sets: {col: html} }
  let samplesShown = 0;

  for (const p of rows) {
    const rec = xl.get(String(p.sku).trim());
    const sets = {};
    for (const f of FIELDS) {
      const cur = p[f.db];
      if (!rec || rec[f.db] == null || rec[f.db] === '') {
        if (cur && cur.trim()) stats[f.db].noExcel++;
        continue;
      }
      const html = rec[f.db];
      // Integrity: stripped HTML must equal current DB text (word-for-word).
      if (cur && cur.trim()) {
        if (normText(html) !== normText(cur)) {
          stats[f.db].integrityFail++;
          failures.push({ sku: p.sku, field: f.db, db: normText(cur).slice(0, 70), out: normText(html).slice(0, 70) });
          continue;
        }
      }
      if (html === cur) {
        stats[f.db].unchanged++;
        continue;
      }
      sets[f.db] = html;
      stats[f.db].updated++;
    }
    if (Object.keys(sets).length) updates.push({ id: p.id, sets });

    // Show a couple of full before/after samples in dry-run.
    if (!APPLY && samplesShown < 2 && p.sku && (sets.description || sets.benefits || sets.declaration)) {
      samplesShown++;
      console.log(`\n────── SAMPLE ${samplesShown}: SKU ${p.sku} ──────`);
      for (const f of ['description', 'benefits', 'declaration']) {
        if (sets[f]) console.log(`\n[${f}]\n${sets[f]}`);
      }
    }
  }

  console.log('\n=== STATS (per field) ===');
  for (const f of FIELDS) console.log(`  ${f.db.padEnd(20)}`, stats[f.db]);
  console.log(`\nProducts with at least one field to update: ${updates.length}`);
  if (failures.length) {
    console.log(`\n⚠ INTEGRITY MISMATCHES: ${failures.length} (skipped, not written)`);
    for (const x of failures.slice(0, 10)) console.log('  ', x.sku, x.field, '\n     DB :', x.db, '\n     OUT:', x.out);
  }

  if (!APPLY) {
    console.log('\nDry run — no DB writes. Re-run with --apply to write to local DB.');
    await client.end();
    return;
  }

  let n = 0;
  for (const u of updates) {
    const cols = Object.keys(u.sets);
    const setSql = cols.map((c, i) => `${c} = $${i + 2}`).join(', ');
    await client.query(`update products set ${setSql} where id = $1`, [u.id, ...cols.map((c) => u.sets[c])]);
    n++;
  }
  console.log(`\n✅ Applied: updated ${n} products in local DB.`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
