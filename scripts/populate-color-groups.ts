import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[šş]/g, "s").replace(/[čć]/g, "c").replace(/[žż]/g, "z").replace(/đ/g, "dj")
    .replace(/['`]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Patterns to extract base name and color code from product names
const patterns: { regex: RegExp; baseGroup: number; colorGroup: number }[] = [
  // "Matrix So Color Sync/10A 90ml" → base: "Matrix So Color Sync 90ml", color: "10A"
  { regex: /^(.+)\/([A-Z0-9]+[A-Z](?:[A-Z0-9]*)?)\s+(\d+ml)$/i, baseGroup: 1, colorGroup: 2 },
  // "Matrix So Color/8N Light Blonde Neutral 90ml" → base: "Matrix So Color 90ml", color: "8N Light Blonde Neutral"
  { regex: /^(.+)\/(\d+[A-Z]+[^/]*?)\s+(\d+ml)$/i, baseGroup: 1, colorGroup: 2 },
  // "Matrix So Color/8N 90ml" → base: "Matrix So Color 90ml", color: "8N"
  { regex: /^(.+)\/([A-Z0-9]+)\s+(\d+ml)$/i, baseGroup: 1, colorGroup: 2 },
  // "Redken Chromatics 7.4 Copper 63ml" → base: "Redken Chromatics 63ml", color: "7.4 Copper"
  { regex: /^((?:Redken|Matrix)\s+Chromatics)\s+(\d+\.?\d*\s*[A-Za-z]*(?:\s+[A-Za-z]+)?)\s+(\d+ml)$/i, baseGroup: 1, colorGroup: 2 },
  // "Redken Shades EQ 09P Opal Glow 60ml" → base: "Redken Shades EQ 60ml", color: "09P Opal Glow"
  { regex: /^(Redken\s+Shades\s+EQ(?:\s+\w+)?)\s+(\d+[A-Z]+\s*.*?)\s+(\d+ml)$/i, baseGroup: 1, colorGroup: 2 },
  // "Redken City Beats Color Cream Big Apple Red 85ml" → base: "Redken City Beats Color Cream 85ml", color: "Big Apple Red"
  { regex: /^(Redken\s+City\s+Beats\s+Color\s+Cream)\s+(.+?)\s+(\d+ml)$/i, baseGroup: 1, colorGroup: 2 },
  // "RK CGLaq10 8NA Volcanic 60ml" → base: "RK CGLaq10 60ml", color: "8NA Volcanic"
  { regex: /^(RK\s+CG(?:Laq)?10)\s+(\d+[A-Z]+\s*.*?)\s+(\d+ml)$/i, baseGroup: 1, colorGroup: 2 },
  // "RK CG10 6ABN Brown Smoke 60ml"
  { regex: /^(RK\s+CG10)\s+(\d+[A-Z]+\s*.*?)\s+(\d+ml)$/i, baseGroup: 1, colorGroup: 2 },
  // "MX SCB2 UL-V 90ml" → base: "MX SCB2 90ml", color: "UL-V"
  { regex: /^(MX\s+\w+)\s+([A-Z0-9]+-?[A-Z0-9]+(?:\s+\w+)?)\s+(\d+ml)$/i, baseGroup: 1, colorGroup: 2 },
  // Generic: "Product Name/ColorCode" (no ml)
  { regex: /^(.+)\/([A-Z0-9][A-Z0-9./-]+)$/i, baseGroup: 1, colorGroup: 2 },
];

async function main() {
  // Get all active products that might be color variants
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, nameLat: true, slug: true },
    orderBy: { nameLat: "asc" },
  });

  console.log(`Total active products: ${products.length}`);

  let grouped = 0;
  const groupCounts = new Map<string, number>();

  for (const p of products) {
    let baseName: string | null = null;
    let colorCode: string | null = null;
    let volume: string | null = null;

    // Try slash-based pattern first (most common)
    const slashIdx = p.nameLat.indexOf("/");
    if (slashIdx > 0) {
      const before = p.nameLat.substring(0, slashIdx).trim();
      const after = p.nameLat.substring(slashIdx + 1).trim();
      // Extract volume from end
      const volMatch = after.match(/\s+(\d+ml)$/i);
      if (volMatch) {
        colorCode = after.replace(/\s+\d+ml$/i, "").trim();
        volume = volMatch[1];
        baseName = `${before} ${volume}`;
      } else {
        colorCode = after;
        baseName = before;
      }
    }

    // Try Chromatics pattern: "Redken Chromatics 7.4 Copper 63ml"
    if (!baseName) {
      const chromMatch = p.nameLat.match(/^(.+(?:Chromatics|Shades EQ|City Beats Color Cream))\s+(\d+\.?\d*[A-Z]?\s*[A-Za-z]*(?:\s+[A-Za-z]+)?)\s+(\d+ml)$/i);
      if (chromMatch) {
        baseName = `${chromMatch[1]} ${chromMatch[3]}`;
        colorCode = chromMatch[2].trim();
      }
    }

    // Try RK/MX abbreviated names
    if (!baseName) {
      const rkMatch = p.nameLat.match(/^(RK\s+(?:CG(?:Laq)?10|SEQ[A-Z]*|CB))\s+(.+?)\s+(\d+ml)$/i);
      if (rkMatch) {
        baseName = `${rkMatch[1]} ${rkMatch[3]}`;
        colorCode = rkMatch[2].trim();
      }
    }
    if (!baseName) {
      const mxMatch = p.nameLat.match(/^(MX\s+\w+)\s+(.+?)\s+(\d+ml)$/i);
      if (mxMatch) {
        baseName = `${mxMatch[1]} ${mxMatch[3]}`;
        colorCode = mxMatch[2].trim();
      }
    }

    if (baseName && colorCode) {
      const groupSlug = slugify(baseName);
      groupCounts.set(groupSlug, (groupCounts.get(groupSlug) || 0) + 1);

      await prisma.product.update({
        where: { id: p.id },
        data: {
          groupSlug,
          colorCode,
          colorName: colorCode, // will be same as code for now
        },
      });
      grouped++;
    }
  }

  // Only keep groupSlug for products that actually have siblings (>1 in group)
  let singles = 0;
  for (const [slug, count] of groupCounts) {
    if (count === 1) {
      await prisma.product.updateMany({
        where: { groupSlug: slug },
        data: { groupSlug: null, colorCode: null, colorName: null },
      });
      singles++;
    }
  }

  const realGroups = Array.from(groupCounts.entries()).filter(([, c]) => c > 1);
  console.log(`\nGrouped ${grouped} products, removed ${singles} singles`);
  console.log(`${realGroups.length} color groups with 2+ variants`);
  console.log(`\nTop groups:`);
  realGroups.sort((a, b) => b[1] - a[1]);
  for (const [slug, count] of realGroups.slice(0, 15)) {
    console.log(`  ${slug}: ${count} variants`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
