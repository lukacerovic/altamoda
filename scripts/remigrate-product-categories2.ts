import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const sqlPath = "C:/Users/nidza/Downloads/altamoda_db.sql";
  console.log("Reading SQL dump...");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  // Step 1: Parse old categories
  // Format: (id, parent, icon, image, level, 'name_sr', ...)
  const oldCategories = new Map<number, { name: string; parentId: number | null }>();

  // Find categories INSERT block
  const catMatch = sql.match(/INSERT INTO `categories`[^;]+VALUES\s*([\s\S]*?);/g);
  if (catMatch) {
    for (const block of catMatch) {
      // Match each row: (id, parent, ...)
      const rowRegex = /\((\d+),\s*(NULL|\d+),\s*(?:NULL|'[^']*'),\s*(?:NULL|'[^']*'),\s*\d+,\s*'((?:[^'\\]|\\.|'')*?)'/g;
      let m;
      while ((m = rowRegex.exec(block)) !== null) {
        const id = parseInt(m[1]);
        const parentId = m[2] === "NULL" ? null : parseInt(m[2]);
        const name = m[3].replace(/\\'/g, "'").replace(/''/g, "'");
        oldCategories.set(id, { name, parentId });
      }
    }
  }
  console.log(`Old categories: ${oldCategories.size}`);
  // Show some
  for (const [id, cat] of Array.from(oldCategories.entries()).slice(0, 5)) {
    console.log(`  ${id}: ${cat.name} (parent: ${cat.parentId})`);
  }

  // Step 2: Parse product_categories
  const productCategoryMap = new Map<number, number[]>();
  const pcMatch = sql.match(/INSERT INTO `product_categories`[^;]+VALUES\s*([\s\S]*?);/g);
  if (pcMatch) {
    for (const block of pcMatch) {
      const rowRegex = /\((\d+),\s*(\d+),\s*(\d+)\)/g;
      let m;
      while ((m = rowRegex.exec(block)) !== null) {
        const productId = parseInt(m[2]);
        const categoryId = parseInt(m[3]);
        if (!productCategoryMap.has(productId)) {
          productCategoryMap.set(productId, []);
        }
        productCategoryMap.get(productId)!.push(categoryId);
      }
    }
  }
  console.log(`Product-category mappings: ${productCategoryMap.size} products`);

  // Step 3: Parse old products to get id -> slug
  const oldProductSlug = new Map<number, string>();
  // Match product rows - get id (field 0) and uri_sr (field 22)
  // Simpler: search for uri_sr values using the products INSERT
  // We know the migration used uri_sr as slug
  // Let's use the existing products in DB and match by old ID through a different approach
  // Actually, let's get product slugs from the new DB and match by name

  // Better approach: parse product id and uri_sr from dump
  const prodInserts = sql.match(/INSERT INTO `products`[^;]+VALUES\s*([\s\S]*?);/g);
  if (prodInserts) {
    for (const block of prodInserts) {
      // Each row starts with (id, ... and uri_sr is at position 22
      // Let's find each row's id and walk to field 22
      let depth = 0;
      let start = -1;
      let inStr = false;
      let escape = false;

      for (let i = 0; i < block.length; i++) {
        const ch = block[i];
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
            const row = block.substring(start + 1, i);
            // Get ID
            const idMatch = row.match(/^(\d+)/);
            if (!idMatch) { start = -1; continue; }
            const oldId = parseInt(idMatch[1]);

            // Walk to field 22 (uri_sr)
            let fieldIdx = 0;
            let j = 0;
            let ins = false;
            let esc = false;

            while (j < row.length && fieldIdx < 22) {
              const c = row[j];
              if (esc) { esc = false; j++; continue; }
              if (c === "\\") { esc = true; j++; continue; }
              if (c === "'" && !ins) { ins = true; j++; continue; }
              if (c === "'" && ins) { ins = false; j++; continue; }
              if (c === "," && !ins) { fieldIdx++; }
              j++;
            }

            // Now at field 22, skip whitespace
            while (j < row.length && row[j] === " ") j++;

            if (row[j] === "'") {
              j++; // skip opening quote
              let slug = "";
              while (j < row.length) {
                if (row[j] === "\\" && j + 1 < row.length) { slug += row[j+1]; j += 2; continue; }
                if (row[j] === "'") break;
                slug += row[j];
                j++;
              }
              oldProductSlug.set(oldId, slug);
            }
            start = -1;
          }
        }
      }
    }
  }
  console.log(`Old product slugs: ${oldProductSlug.size}`);

  // Step 4: Build old category name -> new category ID map
  const newCategories = await prisma.category.findMany({
    select: { id: true, nameLat: true, slug: true, parentId: true },
  });

  const newCatByName = new Map<string, typeof newCategories[0]>();
  for (const c of newCategories) {
    newCatByName.set(c.nameLat.toLowerCase(), c);
  }

  const oldToNewCatId = new Map<number, string>();
  for (const [oldId, oldCat] of oldCategories) {
    const newCat = newCatByName.get(oldCat.name.toLowerCase());
    if (newCat) {
      oldToNewCatId.set(oldId, newCat.id);
    }
  }
  console.log(`Mapped ${oldToNewCatId.size}/${oldCategories.size} old -> new categories`);

  // Step 5: Build depth map
  const newCatDepth = new Map<string, number>();
  function getDepth(catId: string): number {
    if (newCatDepth.has(catId)) return newCatDepth.get(catId)!;
    const cat = newCategories.find(c => c.id === catId);
    if (!cat || !cat.parentId) { newCatDepth.set(catId, 0); return 0; }
    const d = 1 + getDepth(cat.parentId);
    newCatDepth.set(catId, d);
    return d;
  }
  newCategories.forEach(c => getDepth(c.id));

  // Step 6: Update each product to its deepest category
  let updated = 0;
  let noMapping = 0;
  let noProduct = 0;

  for (const [oldProductId, oldCatIds] of productCategoryMap) {
    const slug = oldProductSlug.get(oldProductId);
    if (!slug) { noMapping++; continue; }

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

  console.log(`\nDone! ${updated} updated, ${noMapping} no mapping, ${noProduct} not found`);

  // Verify
  const catCounts = await prisma.$queryRawUnsafe<{ name_lat: string; cnt: bigint }[]>(`
    SELECT c.name_lat, COUNT(p.id) as cnt
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
    WHERE c.is_active = true
    GROUP BY c.name_lat
    HAVING COUNT(p.id) > 0
    ORDER BY cnt DESC
  `);

  console.log("\n--- Category product counts ---");
  for (const r of catCounts) {
    console.log(`  ${r.name_lat}: ${r.cnt}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
