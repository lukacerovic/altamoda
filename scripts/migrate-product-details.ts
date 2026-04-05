import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function parseInsert(sql: string, table: string): string[][] {
  const regex = new RegExp(
    `INSERT INTO \`${table}\`[^;]*?VALUES\\s*([\\s\\S]*?);`,
    "gi"
  );
  const rows: string[][] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(sql)) !== null) {
    const valuesBlock = m[1];
    const rowRegex = /\((?:[^()]*|\((?:[^()]*|\([^()]*\))*\))*\)/g;
    let rm: RegExpExecArray | null;
    while ((rm = rowRegex.exec(valuesBlock)) !== null) {
      const raw = rm[0].slice(1, -1);
      const fields: string[] = [];
      let current = "";
      let inStr = false;
      let escape = false;
      for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        if (escape) { current += ch; escape = false; continue; }
        if (ch === "\\") { escape = true; current += ch; continue; }
        if (ch === "'" && !inStr) { inStr = true; continue; }
        if (ch === "'" && inStr) {
          if (raw[i + 1] === "'") { current += "'"; i++; continue; }
          inStr = false; continue;
        }
        if (ch === "," && !inStr) { fields.push(current.trim()); current = ""; continue; }
        current += ch;
      }
      fields.push(current.trim());
      rows.push(fields);
    }
  }
  return rows;
}

function valOrNull(v: string): string | null {
  if (!v || v === "NULL" || v === "null") return null;
  return v.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\'/g, "'").replace(/\\"/g, '"');
}

function decodeHtml(s: string | null): string | null {
  if (!s) return null;
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

async function main() {
  const sqlPath = "C:/Users/nidza/Downloads/altamoda_db.sql";
  console.log("Reading SQL dump...");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  console.log("Parsing products table...");
  const rows = parseInsert(sql, "products");
  console.log(`Found ${rows.length} product rows`);

  // Column indices from old DB:
  // 0:id, 1:code, 2:product_active, 3:main_price, 4:no_pdv_price,
  // 5:promotion_price, 6:new, 7:sale, 8:recommended, 9:sold_out,
  // 10:top, 11:have_stock, 12:stock, 13:manufacturer_id,
  // 14:popup_product, 15:sales_count,
  // 16:name_sr, 17:full_name_sr, 18:description_sr,
  // 19:aditional_info_1_sr (usage), 20:aditional_info_2_sr (purpose/benefits), 21:aditional_info_3_sr (INCI/ingredients)
  // 22:uri_sr

  // Build a map: old product slug -> { purpose, ingredients }
  const updates: { slug: string; purpose: string | null; ingredients: string | null }[] = [];

  for (const r of rows) {
    const slug = valOrNull(r[22]);
    if (!slug) continue;

    const purpose = decodeHtml(valOrNull(r[20]));
    const ingredients = decodeHtml(valOrNull(r[21]));

    if (purpose || ingredients) {
      updates.push({ slug, purpose, ingredients });
    }
  }

  console.log(`Found ${updates.length} products with purpose or ingredients data`);

  let updated = 0;
  let notFound = 0;

  for (const u of updates) {
    try {
      const result = await prisma.product.updateMany({
        where: { slug: u.slug },
        data: {
          ...(u.purpose ? { purpose: u.purpose } : {}),
          ...(u.ingredients ? { ingredients: u.ingredients } : {}),
        },
      });
      if (result.count > 0) updated++;
      else notFound++;
    } catch {
      notFound++;
    }
  }

  console.log(`\nDone! ${updated} products updated, ${notFound} not found`);

  // Stats
  const purposeCount = await prisma.product.count({ where: { purpose: { not: null } } });
  const ingredientsCount = await prisma.product.count({ where: { ingredients: { not: null } } });
  const usageCount = await prisma.product.count({ where: { usageInstructions: { not: null } } });
  console.log(`\nProducts with purpose: ${purposeCount}`);
  console.log(`Products with ingredients: ${ingredientsCount}`);
  console.log(`Products with usage instructions: ${usageCount}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
