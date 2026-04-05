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

  // Parse old categories
  const oldCategories = new Map<number, { name: string; parentId: number | null }>();
  const catBlocks = sql.match(/INSERT INTO `categories`[^;]+VALUES\s*([\s\S]*?);/g);
  if (catBlocks) {
    for (const block of catBlocks) {
      const rx = /\((\d+),\s*(NULL|\d+),\s*(?:NULL|'(?:[^'\\]|\\.)*'),\s*(?:NULL|'(?:[^'\\]|\\.)*'),\s*\d+,\s*'((?:[^'\\]|\\.)*?)'/g;
      let m;
      while ((m = rx.exec(block)) !== null) {
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
      const rx = /\((\d+),\s*(\d+),\s*(\d+)\)/g;
      let m;
      while ((m = rx.exec(block)) !== null) {
        const pid = parseInt(m[2]);
        const cid = parseInt(m[3]);
        if (!productCategoryMap.has(pid)) productCategoryMap.set(pid, []);
        productCategoryMap.get(pid)!.push(cid);
      }
    }
  }
  console.log(`Products with categories: ${productCategoryMap.size}`);

  // Parse old products: get id -> code (SKU) — field index 1
  const oldProductCode = new Map<number, string>();
  const prodBlocks = sql.match(/INSERT INTO `products`[^;]+VALUES\s*([\s\S]*?);/g);
  if (prodBlocks) {
    for (const block of prodBlocks) {
      // Simple regex: (id, 'code', ...)
      const rx = /\((\d+),\s*'([^']*)'/g;
      let m;
      while ((m = rx.exec(block)) !== null) {
        oldProductCode.set(parseInt(m[1]), m[2]);
      }
    }
  }
  console.log(`Old product codes: ${oldProductCode.size}`);

  // Build maps
  const newCategories = await prisma.category.findMany({ select: { id: true, nameLat: true, parentId: true } });
  const newCatByName = new Map(newCategories.map(c => [c.nameLat.toLowerCase(), c]));

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

  // Build new product SKU -> id map
  const newProducts = await prisma.product.findMany({ select: { id: true, sku: true } });
  const newProductBySku = new Map<string, string>();
  for (const p of newProducts) {
    newProductBySku.set(p.sku.toLowerCase(), p.id);
  }
  console.log(`New products: ${newProducts.length}`);

  // Also build by sku with _oldId suffix (seed script appended _oldId for uniqueness)
  // The seed script did: uniqueSku(code, oldId) which adds _oldId if code is empty or duplicate

  // Update products
  let updated = 0, noCode = 0, noProduct = 0, noCat = 0;

  for (const [oldProdId, oldCatIds] of productCategoryMap) {
    const code = oldProductCode.get(oldProdId);
    if (!code) { noCode++; continue; }

    // Try matching by code, or code_oldId
    let newProdId = newProductBySku.get(code.toLowerCase());
    if (!newProdId) newProdId = newProductBySku.get(`${code}_${oldProdId}`.toLowerCase());
    if (!newProdId) newProdId = newProductBySku.get(`prod_${oldProdId}`.toLowerCase());
    if (!newProdId) { noProduct++; continue; }

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

    if (!bestCatId) { noCat++; continue; }

    await prisma.product.update({ where: { id: newProdId }, data: { categoryId: bestCatId } });
    updated++;

    if (updated % 200 === 0) console.log(`  Progress: ${updated}`);
  }

  console.log(`\nDone! ${updated} updated, ${noCode} no code, ${noProduct} no product match, ${noCat} no category`);

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
