// Restore descriptive product names for grouped (color-variant) products.
//
// The Excel sync overwrote name_lat with the Excel NAZIV, which for grouped
// products is just the bare shade code ("6NV"). That breaks the storefront's
// group label (route.ts strips color_code from the name -> empty string).
// This restores name_lat from the pre-sync backup for every product whose
// group_slug is set, matched by SKU (stable across local/prod). Non-grouped
// products keep their correct Excel names.
//
// Usage:
//   node scripts/restore-grouped-names.mjs                                   # dry run vs local
//   node scripts/restore-grouped-names.mjs --apply                           # write to local
//   TARGET_DB_URL=postgres://... node scripts/restore-grouped-names.mjs [--apply]   # target prod

import { Client } from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP = path.join(__dirname, 'backup-local-before-sync-2026-07-10T19-07-41-949Z.json');
const APPLY = process.argv.includes('--apply');

function targetDbUrl() {
  if (process.env.TARGET_DB_URL) return process.env.TARGET_DB_URL.trim().replace(/\?schema=public/, '');
  const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  const m = env.match(/^DATABASE_URL=(.*)$/m);
  if (!m) throw new Error('DATABASE_URL not found in .env');
  return m[1].trim().replace(/^"|"$/g, '').replace(/\?schema=public/, '');
}

async function main() {
  const backup = JSON.parse(fs.readFileSync(BACKUP, 'utf8'));
  // Pre-sync name by SKU, only for grouped products.
  const preName = new Map();
  for (const p of backup.products) {
    if (p.group_slug && String(p.group_slug).trim() !== '') preName.set(String(p.sku).trim(), p.name_lat);
  }
  console.log('Backup grouped products:', preName.size);

  const DB_URL = targetDbUrl();
  const ssl = /render\.com/.test(DB_URL) ? { rejectUnauthorized: false } : undefined;
  const client = new Client({ connectionString: DB_URL, ssl });
  await client.connect();
  console.log('Target DB:', DB_URL.replace(/:[^:@/]+@/, ':***@'));

  const rows = (await client.query(
    `select id, sku, name_lat, group_slug from products where group_slug is not null and group_slug <> ''`,
  )).rows;

  const changes = [];
  const missing = [];
  for (const r of rows) {
    const want = preName.get(String(r.sku).trim());
    if (want == null) { missing.push(r.sku); continue; }
    if (r.name_lat !== want) changes.push({ id: r.id, sku: r.sku, from: r.name_lat, to: want });
  }

  console.log(`\nGrouped products in DB: ${rows.length}`);
  console.log(`Names to restore (differ): ${changes.length}`);
  console.log(`Not found in backup (skipped): ${missing.length}${missing.length ? ' -> ' + missing.slice(0, 10).join(', ') : ''}`);
  console.log('\nSample before -> after:');
  for (const c of changes.slice(0, 12)) console.log(`  ${c.sku}: ${JSON.stringify(c.from)} -> ${JSON.stringify(c.to)}`);

  if (!APPLY) { console.log('\nDry run — no writes. Re-run with --apply.'); await client.end(); return; }

  const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };
  await client.query('BEGIN');
  try {
    let done = 0;
    for (const part of chunk(changes, 300)) {
      const params = [];
      const vals = part.map((c, ri) => {
        params.push(c.id, c.to);
        const cast = ri === 0 ? '::text' : '';
        return `($${params.length - 1}${cast}, $${params.length}${cast})`;
      });
      await client.query(
        `UPDATE products p SET name_lat = v.name, updated_at = now()
         FROM (VALUES ${vals.join(',')}) AS v(id, name) WHERE p.id = v.id`,
        params,
      );
      done += part.length;
    }
    await client.query('COMMIT');
    console.log(`\n✅ Restored ${done} grouped product names.`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('\n❌ Rolled back — no changes written.');
    throw e;
  }
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
