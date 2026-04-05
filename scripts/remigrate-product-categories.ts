import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as readline from "readline";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const sqlPath = "C:/Users/nidza/Downloads/altamoda_db.sql";

  // Step 1: Build old category ID -> new category ID map
  // Parse old categories from dump
  console.log("Reading SQL dump...");
  const fileStream = fs.createReadStream(sqlPath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let inCategoriesInsert = false;
  let inProductCategoriesInsert = false;
  let buffer = "";

  // Old category: id -> { name, parent_id }
  const oldCategories = new Map<number, { name: string; parentId: number | null }>();
  // Product -> category assignments: product_id -> [category_id, ...]
  const productCategoryMap = new Map<number, number[]>();

  for await (const line of rl) {
    // Parse categories
    if (line.startsWith("INSERT INTO `categories`")) {
      inCategoriesInsert = true;
      buffer = line;
      continue;
    }
    // Parse product_categories
    if (line.startsWith("INSERT INTO `product_categories`")) {
      inProductCategoriesInsert = true;
      buffer = line;
      continue;
    }

    if (inCategoriesInsert) {
      buffer += "\n" + line;
      if (line.trimEnd().endsWith(";")) {
        inCategoriesInsert = false;
        // Parse: (id, parent_id, ..., name_sr, ...)
        const valuesIdx = buffer.indexOf("VALUES");
        if (valuesIdx !== -1) {
          const data = buffer.substring(valuesIdx + 6);
          const rowRegex = /\((\d+),\s*(\d+|NULL),\s*'([^']*)'/g;
          let m;
          while ((m = rowRegex.exec(data)) !== null) {
            const id = parseInt(m[1]);
            const parentId = m[2] === "NULL" ? null : parseInt(m[2]);
            const name = m[3].replace(/\\'/g, "'");
            oldCategories.set(id, { name, parentId });
          }
        }
        buffer = "";
      }
      continue;
    }

    if (inProductCategoriesInsert) {
      buffer += "\n" + line;
      if (line.trimEnd().endsWith(";")) {
        inProductCategoriesInsert = false;
        const valuesIdx = buffer.indexOf("VALUES");
        if (valuesIdx !== -1) {
          const data = buffer.substring(valuesIdx + 6);
          const rowRegex = /\((\d+),\s*(\d+),\s*(\d+)\)/g;
          let m;
          while ((m = rowRegex.exec(data)) !== null) {
            const productId = parseInt(m[2]);
            const categoryId = parseInt(m[3]);
            if (!productCategoryMap.has(productId)) {
              productCategoryMap.set(productId, []);
            }
            productCategoryMap.get(productId)!.push(categoryId);
          }
        }
        buffer = "";
      }
      continue;
    }
  }

  console.log(`Old categories: ${oldCategories.size}`);
  console.log(`Product-category mappings: ${productCategoryMap.size} products`);

  // Step 2: Build old category name -> new category ID map
  const newCategories = await prisma.category.findMany({
    select: { id: true, nameLat: true, slug: true, parentId: true },
  });

  // Map by name (case-insensitive)
  const newCatByName = new Map<string, typeof newCategories[0]>();
  for (const c of newCategories) {
    newCatByName.set(c.nameLat.toLowerCase(), c);
  }

  // Build old ID -> new ID map
  const oldToNewCatId = new Map<number, string>();
  for (const [oldId, oldCat] of oldCategories) {
    const newCat = newCatByName.get(oldCat.name.toLowerCase());
    if (newCat) {
      oldToNewCatId.set(oldId, newCat.id);
    }
  }
  console.log(`Mapped ${oldToNewCatId.size} old -> new categories`);

  // Step 3: For each product, find the deepest (most specific) category
  // Build new category depth map
  const newCatDepth = new Map<string, number>();
  function getDepth(catId: string): number {
    if (newCatDepth.has(catId)) return newCatDepth.get(catId)!;
    const cat = newCategories.find(c => c.id === catId);
    if (!cat || !cat.parentId) {
      newCatDepth.set(catId, 0);
      return 0;
    }
    const d = 1 + getDepth(cat.parentId);
    newCatDepth.set(catId, d);
    return d;
  }
  newCategories.forEach(c => getDepth(c.id));

  // Step 4: Get old product ID -> new product slug mapping from seed script
  // We need to match old product IDs to new products. The seed script used uri_sr as slug.
  // Let's read the products INSERT to get old_id -> slug mapping
  const fileStream2 = fs.createReadStream(sqlPath, { encoding: "utf-8" });
  const rl2 = readline.createInterface({ input: fileStream2, crlfDelay: Infinity });

  let inProductsInsert = false;
  let pbuf = "";
  const oldProductIdToSlug = new Map<number, string>();

  for await (const line of rl2) {
    if (line.startsWith("INSERT INTO `products`")) {
      inProductsInsert = true;
      pbuf = line;
      continue;
    }
    if (inProductsInsert) {
      pbuf += "\n" + line;
      if (line.trimEnd().endsWith(";")) {
        inProductsInsert = false;
        // Extract (id, ..., uri_sr at index 22)
        // We need a simpler approach - find id and uri_sr
        const valuesIdx = pbuf.indexOf("VALUES");
        if (valuesIdx !== -1) {
          const data = pbuf.substring(valuesIdx + 6);
          // Parse row by row
          let depth = 0;
          let start = -1;
          let inStr = false;
          let escape = false;

          for (let i = 0; i < data.length; i++) {
            const ch = data[i];
            if (escape) { escape = false; continue; }
            if (ch === "\\") { escape = true; continue; }
            if (ch === "'" && !inStr) { inStr = true; continue; }
            if (ch === "'" && inStr) { inStr = false; continue; }
            if (inStr) continue;
            if (ch === "(") {
              if (depth === 0) start = i;
              depth++;
            }
            if (ch === ")") {
              depth--;
              if (depth === 0 && start >= 0) {
                const row = data.substring(start + 1, i);
                // Get first number (id)
                const idMatch = row.match(/^(\d+)/);
                if (idMatch) {
                  const oldId = parseInt(idMatch[1]);
                  // Find uri_sr - it's the slug field. Count to field index 22
                  // Simple approach: find fields by splitting carefully
                  let fieldIdx = 0;
                  let j = 0;
                  let inS = false;
                  let esc = false;
                  let fieldStart = 0;

                  while (j < row.length && fieldIdx <= 22) {
                    const c = row[j];
                    if (esc) { esc = false; j++; continue; }
                    if (c === "\\") { esc = true; j++; continue; }
                    if (c === "'" && !inS) { inS = true; j++; continue; }
                    if (c === "'" && inS) { inS = false; j++; continue; }
                    if (c === "," && !inS) {
                      fieldIdx++;
                      j++;
                      fieldStart = j;
                      // skip whitespace
                      while (j < row.length && row[j] === " ") j++;
                      fieldStart = j;
                      continue;
                    }
                    j++;
                  }

                  if (fieldIdx >= 22) {
                    // Extract field 22 value
                    let val = "";
                    let k = fieldStart;
                    if (row[k] === "'") {
                      k++;
                      while (k < row.length) {
                        if (row[k] === "\\" && k + 1 < row.length) { val += row[k+1]; k += 2; continue; }
                        if (row[k] === "'") break;
                        val += row[k];
                        k++;
                      }
                      oldProductIdToSlug.set(oldId, val);
                    }
                  }
                }
                start = -1;
              }
            }
          }
        }
        pbuf = "";
      }
      continue;
    }
  }

  console.log(`Old product ID -> slug mappings: ${oldProductIdToSlug.size}`);

  // Step 5: Update products with their deepest category
  let updated = 0;
  let noMapping = 0;
  let noProduct = 0;

  for (const [oldProductId, oldCatIds] of productCategoryMap) {
    const slug = oldProductIdToSlug.get(oldProductId);
    if (!slug) { noMapping++; continue; }

    // Map old category IDs to new, find deepest
    let bestCatId: string | null = null;
    let bestDepth = -1;

    for (const oldCatId of oldCatIds) {
      const newCatId = oldToNewCatId.get(oldCatId);
      if (newCatId) {
        const depth = newCatDepth.get(newCatId) ?? 0;
        if (depth > bestDepth) {
          bestDepth = depth;
          bestCatId = newCatId;
        }
      }
    }

    if (!bestCatId) { noMapping++; continue; }

    try {
      const result = await prisma.product.updateMany({
        where: { slug },
        data: { categoryId: bestCatId },
      });
      if (result.count > 0) updated++;
      else noProduct++;
    } catch {
      noProduct++;
    }

    if ((updated + noMapping + noProduct) % 200 === 0) {
      console.log(`  Progress: ${updated + noMapping + noProduct}/${productCategoryMap.size}`);
    }
  }

  console.log(`\nDone! ${updated} products updated, ${noMapping} no category mapping, ${noProduct} product not found`);

  // Verify
  const catCounts = await prisma.$queryRawUnsafe<{ name_lat: string; slug: string; cnt: bigint }[]>(`
    SELECT c.name_lat, c.slug, COUNT(p.id) as cnt
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
    WHERE c.is_active = true
    GROUP BY c.name_lat, c.slug
    HAVING COUNT(p.id) > 0
    ORDER BY cnt DESC
  `);

  console.log("\n--- Category product counts (non-zero) ---");
  for (const r of catCounts) {
    console.log(`  ${r.name_lat}: ${r.cnt}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
