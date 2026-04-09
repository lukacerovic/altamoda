const https = require('https');
const pg = require('pg');

const PROD_URL = 'https://altamoda.vercel.app/api/data-export?secret=altamoda-sync-2026';
const LOCAL_DB = 'postgresql://postgres:admin@localhost:5433/altamoda_nikola';

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(new Error(`Parse error (${res.statusCode}): ${data.substring(0, 200)}`)); } });
    }).on('error', reject);
  });
}

async function fetchAllPages(table) {
  const allData = [];
  let page = 0;
  while (true) {
    try {
      const res = await fetch(`${PROD_URL}&table=${table}&page=${page}`);
      if (!res.data || res.data.length === 0) break;
      allData.push(...res.data);
      console.log(`  ${table} page ${page}: ${res.data.length} rows`);
      if (res.data.length < 200) break;
      page++;
    } catch (e) {
      console.error(`  Error: ${e.message}`);
      break;
    }
  }
  return allData;
}

function buildInsert(dbTable, rows) {
  if (rows.length === 0) return null;
  const cols = Object.keys(rows[0]).filter(c => {
    // Skip nested objects/arrays
    const v = rows[0][c];
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) return false;
    if (Array.isArray(v)) return false;
    return true;
  });
  const snakeCols = cols.map(c => c.replace(/[A-Z]/g, m => '_' + m.toLowerCase()));
  const colList = snakeCols.map(c => `"${c}"`).join(', ');
  const values = [];
  const params = [];
  let idx = 1;
  for (const row of rows) {
    const rp = [];
    for (const col of cols) {
      params.push(row[col] ?? null);
      rp.push(`$${idx++}`);
    }
    values.push(`(${rp.join(', ')})`);
  }
  return { text: `INSERT INTO "${dbTable}" (${colList}) VALUES ${values.join(', ')} ON CONFLICT (id) DO NOTHING`, values: params };
}

async function main() {
  const client = new pg.Client(LOCAL_DB);
  await client.connect();
  await client.query('SET session_replication_role = replica;');

  // Fetch and insert users
  console.log('Fetching users...');
  await client.query('TRUNCATE TABLE "users" CASCADE');
  const users = await fetchAllPages('users');
  if (users.length > 0) {
    const CHUNK = 50;
    let ins = 0;
    for (let i = 0; i < users.length; i += CHUNK) {
      const chunk = users.slice(i, i + CHUNK);
      const q = buildInsert('users', chunk);
      if (q) {
        try { await client.query(q); ins += chunk.length; }
        catch (e) {
          // Try individually
          for (const row of chunk) {
            try { await client.query(buildInsert('users', [row])); ins++; }
            catch (e2) { console.error(`  Skip user ${row.id}: ${e2.message.split('\n')[0]}`); }
          }
        }
      }
    }
    console.log(`  Inserted ${ins}/${users.length} users`);
  }

  // Re-insert b2b_profiles (they depend on users)
  console.log('\nRe-fetching b2bProfiles...');
  await client.query('TRUNCATE TABLE "b2b_profiles" CASCADE');
  const profiles = await fetchAllPages('b2bProfiles');
  if (profiles.length > 0) {
    const CHUNK = 50;
    let ins = 0;
    for (let i = 0; i < profiles.length; i += CHUNK) {
      const chunk = profiles.slice(i, i + CHUNK);
      const q = buildInsert('b2b_profiles', chunk);
      if (q) {
        try { await client.query(q); ins += chunk.length; }
        catch (e) {
          for (const row of chunk) {
            try { await client.query(buildInsert('b2b_profiles', [row])); ins++; }
            catch (e2) { console.error(`  Skip profile ${row.id}: ${e2.message.split('\n')[0]}`); }
          }
        }
      }
    }
    console.log(`  Inserted ${ins}/${profiles.length} b2b_profiles`);
  }

  // Re-insert cart_items (depends on users)
  console.log('\nRe-fetching cartItems...');
  await client.query('TRUNCATE TABLE "cart_items" CASCADE');
  const carts = await fetchAllPages('cartItems');
  if (carts.length > 0) {
    const q = buildInsert('cart_items', carts);
    if (q) { try { await client.query(q); console.log(`  Inserted ${carts.length} cart_items`); } catch (e) { console.error(`  Error: ${e.message.split('\n')[0]}`); } }
  }

  await client.query('SET session_replication_role = DEFAULT;');
  console.log('\nDone!');
  await client.end();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
