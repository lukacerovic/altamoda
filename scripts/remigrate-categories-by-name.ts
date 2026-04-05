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

  // Parse old categories: (id, parent, icon, image, level, 'name_sr', ...)
  const oldCategories = new Map<number, { name: string; parentId: number | null }>();
  const catBlocks = sql.match(/INSERT INTO `categories`[^;]+VALUES\s*([\s\S]*?);/g);
  if (catBlocks) {
    for (const block of catBlocks) {
      const rowRegex = /\((\d+),\s*(NULL|\d+),\s*(?:NULL|'[^']*'),\s*(?:NULL|'[^']*'),\s*\d+,\s*'((?:[^'\\]|\\.|'')*?)'/g;
      let m;
      while ((m = rowRegex.exec(block)) !== null) {
        oldCategories.set(parseInt(m[1]), { name: m[3].replace(/\\'/g, "'"), parentId: m[2] === "NULL" ? null : parseInt(m[2]) });
      }
    }
  }
  console.log(`Old categories: ${oldCategories.size}`);

  // Parse product_categories
  const productCategoryMap = new Map<number, number[]>();
  const pcBlocks = sql.match(/INSERT INTO `product_categories`[^;]+VALUES\s*([\s\S]*?);/g);
  if (pcBlocks) {
    for (const block of pcBlocks) {
      const rowRegex = /\((\d+),\s*(\d+),\s*(\d+)\)/g;
      let m;
      while ((m = rowRegex.exec(block)) !== null) {
        const pid = parseInt(m[2]);
        const cid = parseInt(m[3]);
        if (!productCategoryMap.has(pid)) productCategoryMap.set(pid, []);
        productCategoryMap.get(pid)!.push(cid);
      }
    }
  }
  console.log(`Product-category mappings: ${productCategoryMap.size}`);

  // Parse old products: get id -> name_sr (field 16)
  const oldProductName = new Map<number, string>();
  const prodBlocks = sql.match(/INSERT INTO `products`[^;]+VALUES\s*([\s\S]*?);/g);
  if (prodBlocks) {
    for (const block of prodBlocks) {
      let depth = 0, start = -1, inStr = false, escape = false;
      for (let i = 0; i < block.length; i++) {
        const ch = block[i];
        if (escape) { escape = false; continue; }
        if (ch === "\\") { escape = true; continue; }
        if (ch === "'" && !inStr) { inStr = true; continue; }
        if (ch === "'" && inStr) { inStr = false; continue; }
        if (inStr) continue;
        if (ch === "(") { if (depth === 0) start = i; depth++; }
        if (ch === ")") {
          depth--;
          if (depth === 0 && start >= 0) {
            const row = block.substring(start + 1, i);
            const idM = row.match(/^(\d+)/);
            if (idM) {
              const oldId = parseInt(idM[1]);
              // Walk to field 16 (name_sr)
              let fi = 0, j = 0, ins = false, esc = false;
              while (j < row.length && fi < 16) {
                const c = row[j];
                if (esc) { esc = false; j++; continue; }
                if (c === "\\") { esc = true; j++; continue; }
                if (c === "'" && !ins) { ins = true; j++; continue; }
                if (c === "'" && ins) { ins = false; j++; continue; }
                if (c === "," && !ins) fi++;
                j++;
              }
              while (j < row.length && row[j] === " ") j++;
              if (row[j] === "'") {
                j++;
                let name = "";
                while (j < row.length) {
                  if (row[j] === "\\" && j + 1 < row.length) { name += row[j + 1]; j += 2; continue; }
                  if (row[j] === "'") break;
                  name += row[j]; j++;
                }
                // Decode HTML entities
                name = name.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, " ");
                oldProductName.set(oldId, name);
              }
            }
            start = -1;
          }
        }
      }
    }
  }
  console.log(`Old product names: ${oldProductName.size}`);

  // Build new category maps
  const newCategories = await prisma.category.findMany({
    select: { id: true, nameLat: true, slug: true, parentId: true },
  });
  const newCatByName = new Map<string, typeof newCategories[0]>();
  for (const c of newCategories) newCatByName.set(c.nameLat.toLowerCase(), c);

  const oldToNewCatId = new Map<number, string>();
  for (const [oldId, oldCat] of oldCategories) {
    const nc = newCatByName.get(oldCat.name.toLowerCase());
    if (nc) oldToNewCatId.set(oldId, nc.id);
  }
  console.log(`Category mappings: ${oldToNewCatId.size}/${oldCategories.size}`);

  // Depth map
  const depthMap = new Map<string, number>();
  function getDepth(id: string): number {
    if (depthMap.has(id)) return depthMap.get(id)!;
    const c = newCategories.find(x => x.id === id);
    if (!c || !c.parentId) { depthMap.set(id, 0); return 0; }
    const d = 1 + getDepth(c.parentId);
    depthMap.set(id, d);
    return d;
  }
  newCategories.forEach(c => getDepth(c.id));

  // Build new product name -> id map
  const newProducts = await prisma.product.findMany({
    select: { id: true, nameLat: true },
  });
  const newProductByName = new Map<string, string>();
  for (const p of newProducts) {
    newProductByName.set(p.nameLat.toLowerCase(), p.id);
  }
  console.log(`New products in DB: ${newProducts.length}`);

  // Update products
  let updated = 0, noMapping = 0, noProduct = 0;

  for (const [oldProdId, oldCatIds] of productCategoryMap) {
    const name = oldProductName.get(oldProdId);
    if (!name) { noMapping++; continue; }

    const newProdId = newProductByName.get(name.toLowerCase());
    if (!newProdId) { noMapping++; continue; }

    // Find deepest category
    let bestCatId: string | null = null;
    let bestDepth = -1;
    for (const oldCatId of oldCatIds) {
      const newCatId = oldToNewCatId.get(oldCatId);
      if (newCatId) {
        const d = depthMap.get(newCatId) ?? 0;
        if (d > bestDepth) { bestDepth = d; bestCatId = newCatId; }
      }
    }

    if (!bestCatId) { noMapping++; continue; }

    await prisma.product.update({
      where: { id: newProdId },
      data: { categoryId: bestCatId },
    });
    updated++;

    if (updated % 200 === 0) console.log(`  Progress: ${updated}`);
  }

  console.log(`\nDone! ${updated} updated, ${noMapping} no mapping, ${noProduct} not found`);

  // Verify
  const catCounts = await prisma.$queryRawUnsafe<{ name_lat: string; parent: string | null; cnt: bigint }[]>(`
    SELECT c.name_lat, pc.name_lat as parent, COUNT(p.id) as cnt
    FROM categories c
    LEFT JOIN categories pc ON c.parent_id = pc.id
    LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
    WHERE c.is_active = true
    GROUP BY c.name_lat, pc.name_lat
    HAVING COUNT(p.id) > 0
    ORDER BY cnt DESC
  `);

  console.log("\n--- Category product counts ---");
  for (const r of catCounts) {
    const parent = r.parent ? ` (${r.parent})` : "";
    console.log(`  ${r.name_lat}${parent}: ${r.cnt}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
