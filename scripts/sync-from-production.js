const https = require('https');
const pg = require('pg');

const PROD_URL = 'https://altamoda.vercel.app/api/data-export?secret=altamoda-sync-2026';
const LOCAL_DB = 'postgresql://postgres:admin@localhost:5433/altamoda_nikola';

const TABLES = [
  'brands', 'categories', 'productLines', 'products', 'productImages',
  'colorProducts', 'attributes', 'productAttributes',
  'users', 'b2bProfiles', 'orders', 'orderItems',
  'reviews', 'wishlistItems', 'cartItems',
  'newsletterSubscribers', 'newsletterCampaigns',
  'promotions'
];

// DB table names (snake_case) matching Prisma @@map
const DB_TABLE_MAP = {
  brands: 'brands',
  categories: 'categories',
  productLines: 'product_lines',
  products: 'products',
  productImages: 'product_images',
  colorProducts: 'color_products',
  attributes: 'attributes',
  productAttributes: 'product_attributes',
  users: 'users',
  b2bProfiles: 'b2b_profiles',
  orders: 'orders',
  orderItems: 'order_items',
  reviews: 'reviews',
  wishlistItems: 'wishlist_items',
  cartItems: 'cart_items',
  newsletterSubscribers: 'newsletter_subscribers',
  newsletterCampaigns: 'newsletter_campaigns',
  promotions: 'promotions',
};

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Failed to parse response (status ${res.statusCode}): ${data.substring(0, 200)}`)); }
      });
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
      console.error(`  Error fetching ${table} page ${page}: ${e.message}`);
      break;
    }
  }
  return allData;
}

function buildInsert(dbTable, rows) {
  if (rows.length === 0) return null;

  const cols = Object.keys(rows[0]);
  // Convert camelCase to snake_case for column names
  const snakeCols = cols.map(c => c.replace(/[A-Z]/g, m => '_' + m.toLowerCase()));
  const colList = snakeCols.map(c => `"${c}"`).join(', ');

  const values = [];
  const params = [];
  let paramIdx = 1;

  for (const row of rows) {
    const rowParams = [];
    for (const col of cols) {
      let val = row[col];
      // Handle nested objects (like promotion.products) - skip them
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        val = null;
      }
      if (Array.isArray(val)) {
        val = null; // Skip array fields
      }
      params.push(val);
      rowParams.push(`$${paramIdx++}`);
    }
    values.push(`(${rowParams.join(', ')})`);
  }

  return {
    text: `INSERT INTO "${dbTable}" (${colList}) VALUES ${values.join(', ')} ON CONFLICT (id) DO NOTHING`,
    values: params,
  };
}

async function main() {
  const client = new pg.Client(LOCAL_DB);
  await client.connect();
  console.log('Connected to local DB\n');

  // Disable FK checks during import
  await client.query('SET session_replication_role = replica;');

  // Truncate all tables first (in reverse order for FK safety, but we disabled checks)
  console.log('Truncating local tables...');
  for (const table of [...TABLES].reverse()) {
    const dbTable = DB_TABLE_MAP[table];
    try {
      await client.query(`TRUNCATE TABLE "${dbTable}" CASCADE`);
      console.log(`  Truncated ${dbTable}`);
    } catch (e) {
      console.log(`  Skip ${dbTable}: ${e.message.split('\n')[0]}`);
    }
  }
  // Also truncate promotion_products
  try { await client.query('TRUNCATE TABLE "promotion_products" CASCADE'); } catch (e) {}

  console.log('\nFetching production data...\n');

  for (const table of TABLES) {
    console.log(`Fetching ${table}...`);
    try {
      const rows = await fetchAllPages(table);
      if (rows.length === 0) {
        console.log(`  ${table}: 0 rows (empty)\n`);
        continue;
      }

      const dbTable = DB_TABLE_MAP[table];

      // For promotions, handle the nested products separately
      if (table === 'promotions') {
        const promoProducts = [];
        for (const row of rows) {
          if (row.products && Array.isArray(row.products)) {
            promoProducts.push(...row.products);
          }
          delete row.products;
        }

        // Insert promotions
        const query = buildInsert(dbTable, rows);
        if (query) {
          await client.query(query);
          console.log(`  Inserted ${rows.length} rows into ${dbTable}`);
        }

        // Insert promotion_products
        if (promoProducts.length > 0) {
          const ppQuery = buildInsert('promotion_products', promoProducts);
          if (ppQuery) {
            await client.query(ppQuery);
            console.log(`  Inserted ${promoProducts.length} rows into promotion_products`);
          }
        }
      } else {
        // Batch insert in chunks of 50 to avoid too many params
        const CHUNK = 50;
        let inserted = 0;
        for (let i = 0; i < rows.length; i += CHUNK) {
          const chunk = rows.slice(i, i + CHUNK);
          const query = buildInsert(dbTable, chunk);
          if (query) {
            try {
              await client.query(query);
              inserted += chunk.length;
            } catch (e) {
              console.error(`  Error inserting chunk into ${dbTable}: ${e.message.split('\n')[0]}`);
              // Try one by one
              for (const row of chunk) {
                try {
                  const singleQuery = buildInsert(dbTable, [row]);
                  if (singleQuery) await client.query(singleQuery);
                  inserted++;
                } catch (e2) {
                  console.error(`    Skip row ${row.id}: ${e2.message.split('\n')[0]}`);
                }
              }
            }
          }
        }
        console.log(`  Inserted ${inserted}/${rows.length} rows into ${dbTable}\n`);
      }
    } catch (e) {
      console.error(`  Failed to fetch ${table}: ${e.message}\n`);
    }
  }

  // Re-enable FK checks
  await client.query('SET session_replication_role = DEFAULT;');

  console.log('\nSync complete!');
  await client.end();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
