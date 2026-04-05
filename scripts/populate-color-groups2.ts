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

// Patterns: [regex, extractBaseName, extractColorCode]
// Each regex matches the full product name
type PatternFn = (name: string) => { baseName: string; colorCode: string } | null;

const patterns: PatternFn[] = [
  // "Matrix So Color Sync/10A 90ml" or "Matrix So Color/8N Light Blonde Neutral 90ml"
  (name) => {
    const m = name.match(/^(.+?)\/(.+?)\s+(\d+ml)$/i);
    if (m) return { baseName: `${m[1].trim()} ${m[3]}`, colorCode: m[2].trim() };
    // Without ml: "Matrix So Color/8N"
    const m2 = name.match(/^(.+?)\/(.+)$/);
    if (m2 && m2[2].match(/^[A-Z0-9]/)) return { baseName: m2[1].trim(), colorCode: m2[2].trim() };
    return null;
  },

  // "Redken Chromatics Ultra Rich 7.13/7AGO/Ash Gold 63ml"
  (name) => {
    const m = name.match(/^(Redken Chromatics Ultra Rich)\s+(\d+\.\d+\/[A-Z0-9]+\/[A-Za-z ]+?)\s*(\d+ml)$/i);
    if (m) return { baseName: `${m[1]} ${m[3]}`, colorCode: m[2].trim() };
    return null;
  },

  // "Redken Chromatics Beyond Cover 10.13 Ash Gold 63ml"
  (name) => {
    const m = name.match(/^(Redken Chromatics Beyond Cover)\s+(\d+\.?\d*\s+[A-Za-z ]+?)\s*(\d+ml)$/i);
    if (m) return { baseName: `${m[1]} ${m[3]}`, colorCode: m[2].trim() };
    return null;
  },

  // "Redken Chromatics Natural 10 63ml"
  (name) => {
    const m = name.match(/^(Redken Chromatics Natural)\s+(\d+)\s+(\d+ml)$/i);
    if (m) return { baseName: `${m[1]} ${m[3]}`, colorCode: m[2].trim() };
    return null;
  },

  // "Redken Chromatics 7.4 Copper 63ml" (already grouped but catch stragglers)
  (name) => {
    const m = name.match(/^(Redken Chromatics)\s+(\d+\.?\d*\s*[A-Za-z]*(?:\s+[A-Za-z]+)?)\s+(\d+ml)$/i);
    if (m) return { baseName: `${m[1]} ${m[3]}`, colorCode: m[2].trim() };
    return null;
  },

  // "Matrix So Color Cult ADMIRAL NAVY 118ml"
  (name) => {
    const m = name.match(/^(Matrix So Color Cult)\s+([A-Z][A-Z ]+?)\s+(\d+ml)$/i);
    if (m) return { baseName: `${m[1]} ${m[3]}`, colorCode: m[2].trim() };
    return null;
  },

  // "Matrix So Color Beauty Mocha 6MC 90ml"
  (name) => {
    const m = name.match(/^(Matrix So Color Beauty)\s+(.+?)\s+(\d+ml)$/i);
    if (m && m[2].match(/\d/)) return { baseName: `${m[1]} ${m[3]}`, colorCode: m[2].trim() };
    return null;
  },

  // "RK CG10 8NA Volcanic 60ml" / "RK CGLaq10 ..." / "RK SEQP ..." / "RK CB ..."
  (name) => {
    const m = name.match(/^(RK\s+(?:CG(?:Laq)?10|SEQ[A-Z]*|CB))\s+(.+?)\s+(\d+ml)$/i);
    if (m) return { baseName: `${m[1]} ${m[3]}`, colorCode: m[2].trim() };
    return null;
  },

  // "MX SCB2 UL-V 90ml"
  (name) => {
    const m = name.match(/^(MX\s+\w+)\s+(.+?)\s+(\d+ml)$/i);
    if (m) return { baseName: `${m[1]} ${m[3]}`, colorCode: m[2].trim() };
    return null;
  },
];

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true, groupSlug: null },
    select: { id: true, nameLat: true },
    orderBy: { nameLat: "asc" },
  });

  console.log(`Ungrouped active products: ${products.length}`);

  let grouped = 0;
  const groupCounts = new Map<string, number>();

  for (const p of products) {
    let result: { baseName: string; colorCode: string } | null = null;

    for (const fn of patterns) {
      result = fn(p.nameLat);
      if (result) break;
    }

    if (result) {
      const groupSlug = slugify(result.baseName);
      groupCounts.set(groupSlug, (groupCounts.get(groupSlug) || 0) + 1);

      await prisma.product.update({
        where: { id: p.id },
        data: { groupSlug, colorCode: result.colorCode, colorName: result.colorCode },
      });
      grouped++;
    }
  }

  // Also count existing groups to merge with
  const existingGroups = await prisma.product.groupBy({
    by: ['groupSlug'],
    where: { groupSlug: { not: null }, isActive: true },
    _count: true,
  });
  const existingCounts = new Map(existingGroups.map(g => [g.groupSlug!, g._count]));

  // Remove singles (only new groups that have exactly 1 member AND no existing siblings)
  let singles = 0;
  for (const [slug, count] of groupCounts) {
    const existingCount = existingCounts.get(slug) || 0;
    if (count === 1 && existingCount <= 1) {
      await prisma.product.updateMany({
        where: { groupSlug: slug },
        data: { groupSlug: null, colorCode: null, colorName: null },
      });
      singles++;
    }
  }

  // Final stats
  const finalGroups = await prisma.product.groupBy({
    by: ['groupSlug'],
    where: { groupSlug: { not: null }, isActive: true },
    _count: true,
  });

  console.log(`\nNewly grouped: ${grouped}, removed singles: ${singles}`);
  console.log(`\nAll color groups (${finalGroups.length}):`);
  finalGroups
    .sort((a, b) => b._count - a._count)
    .forEach(g => console.log(`  ${g.groupSlug}: ${g._count} variants`));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
