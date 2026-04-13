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
  // Multi-slash: "Matrix So Color Sync/Acidic Toner/10PG 90ml" → base: "Matrix So Color Sync 90ml", color: "10PG"
  // Also: "Matrix So Color Sync/Fast Toner/Anti Brass 90ml" → base: "Matrix So Color Sync 90ml", color: "Anti Brass"
  // Shades EQ slash-format: "Redken Shades EQ 06VB/Violet Blue/Lagoon 60ml" → base: "Redken Shades EQ 60ml", color: "06VB/Violet Blue/Lagoon"
  // Also: "Redken Shades EQ 04VRo/Rosé/60ml"
  (name) => {
    const m = name.match(/^(Redken Shades EQ)\s+(\d{1,3}[A-Z]{1,4}[a-z]?\/.+?)\s*(\d+ml)\s*$/i);
    if (m) return { baseName: `${m[1]} ${m[3]}`, colorCode: m[2].trim() };
    return null;
  },

  // Shades EQ without volume: "Redken Shades EQ 08NA Volcanic" → base: "Redken Shades EQ 60ml", color: "08NA Volcanic"
  (name) => {
    const m = name.match(/^(Redken Shades EQ)\s+(\d{1,3}[A-Z]{1,4}[+]?\s+[A-Za-z ]+)$/i);
    if (m) return { baseName: `${m[1]} 60ml`, colorCode: m[2].trim() };
    return null;
  },

  // Skip products where slash is inside the color code, not separating product line from color
  (name) => {
    if (/Color Gels Lacquers/i.test(name)) return null;
    if (/Chromatics Ultra Rich/i.test(name)) return null;
    if (/Chromatics Beyond Cover/i.test(name)) return null;
    if (/Shades EQ\s+\d/i.test(name)) return null;
    const parts = name.split("/");
    if (parts.length < 2) return null;
    const productLine = parts[0].trim();
    const lastPart = parts[parts.length - 1].trim();
    const volMatch = lastPart.match(/^(.+?)\s+(\d+ml)\s*$/i);
    if (volMatch) {
      return { baseName: `${productLine} ${volMatch[2]}`, colorCode: volMatch[1].trim() };
    }
    // No volume: "Product/ColorCode"
    if (parts.length === 2 && lastPart.match(/^[A-Z0-9]/)) {
      return { baseName: productLine, colorCode: lastPart };
    }
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

  // "Redken Shades EQ 09B Irish Creme 60ml" → base: "Redken Shades EQ 60ml", color: "09B Irish Creme"
  // "Redken Shades EQ 04VRo/Rosé/60ml" handled by slash pattern, but catch non-slash ones
  (name) => {
    const m = name.match(/^(Redken Shades EQ)\s+(\d{1,3}[A-Z]{1,4}[+]?)\s*(.*?)\s*(\d+ml)\s*$/i);
    if (m) return { baseName: `${m[1]} ${m[4]}`, colorCode: `${m[2]}${m[3] ? ' ' + m[3] : ''}`.trim() };
    return null;
  },

  // "Redken Shades EQ Bonder Inside 010AA 60ml" → base: "Redken Shades EQ Bonder Inside 60ml", color: "010AA"
  // "Redken Shades EQ Bonder Inside Clear 60ml" → base: "Redken Shades EQ Bonder Inside 60ml", color: "Clear"
  (name) => {
    const m = name.match(/^(Redken Shades EQ Bonder Inside)\s+(\d{1,3}[A-Z]{1,4}[+]?)\s*(.*?)\s*(\d+ml)\s*$/i);
    if (m) return { baseName: `${m[1]} ${m[4]}`, colorCode: `${m[2]}${m[3] ? ' ' + m[3] : ''}`.trim() };
    const m2 = name.match(/^(Redken Shades EQ Bonder Inside)\s+(Clear)\s+(\d+ml)\s*$/i);
    if (m2) return { baseName: `${m2[1]} ${m2[3]}`, colorCode: m2[2] };
    return null;
  },

  // "Redken Shades EQ Orange Color Kicker 60ml" → base: "Redken Shades EQ Color Kicker 60ml", color: "Orange"
  (name) => {
    const m = name.match(/^(Redken Shades EQ)\s+([A-Z][a-z]+)\s+(Color Kicker)\s+(\d+ml)$/i);
    if (m) return { baseName: `${m[1]} ${m[3]} ${m[4]}`, colorCode: m[2].trim() };
    return null;
  },

  // "Redken Color Gels Oils 06ABn 60ml" → base: "Redken Color Gels Oils 60ml", color: "06ABn"
  // "Redken Color Gels Oils 8N 60ml" → base: "Redken Color Gels Oils 60ml", color: "8N"
  // "Redken Color Gels Oils Clear 60ml" → base: "Redken Color Gels Oils 60ml", color: "Clear"
  (name) => {
    const m = name.match(/^(?:Redken\s+)?(Color Gels (?:Oils|Lacquers))\s+(\d{1,3}[A-Z]{1,4}[a-z]?)\s*(.*?)\s*(\d+ml)\s*$/i);
    if (m) return { baseName: `Redken ${m[1]} ${m[4]}`, colorCode: `${m[2]}${m[3] ? ' ' + m[3] : ''}`.trim() };
    const m2 = name.match(/^(?:Redken\s+)?(Color Gels (?:Oils|Lacquers))\s+(Clear)\s+(\d+ml)\s*$/i);
    if (m2) return { baseName: `Redken ${m2[1]} ${m2[3]}`, colorCode: m2[2] };
    return null;
  },

  // "10 min. Color Gels Lacquers 8NA/VOLCANIC 60ml" → base: "Redken Color Gels Lacquers 60ml", color: "8NA/VOLCANIC"
  // "Redken Color Gels Lacquers 8GN/IVY 60ml" → base: "Redken Color Gels Lacquers 60ml", color: "8GN/IVY"
  // "Redken Color Gels Lacquers CLEAR 60ml" → base: "Redken Color Gels Lacquers 60ml", color: "CLEAR"
  // These have slash IN the color code (not separating product line from color)
  (name) => {
    // With slash in color code
    const m = name.match(/^(?:10 min\.\s+|Redken\s+)?(Color Gels Lacquers)\s+(\d{1,3}[A-Z]{1,4}[a-z]?\/[A-Z\sÉÀ]+?)\s*(\d+ml)\s*$/i);
    if (m) return { baseName: `Redken ${m[1]} ${m[3]}`, colorCode: m[2].trim() };
    // Without slash (simple code or Clear)
    const m2 = name.match(/^(?:10 min\.\s+|Redken\s+)?(Color Gels Lacquers)\s+(\d{1,3}[A-Z]{1,4}[a-z]?|CLEAR)\s*(.*?)\s*(\d+ml)\s*$/i);
    if (m2) return { baseName: `Redken ${m2[1]} ${m2[4]}`, colorCode: `${m2[2]}${m2[3] ? ' ' + m2[3] : ''}`.trim() };
    return null;
  },

  // "Matrix Tonal Control 10P 90ml" → base: "Matrix Tonal Control 90ml", color: "10P"
  // "Matrix Tonal Control Clear 90ml" → base: "Matrix Tonal Control 90ml", color: "Clear"
  (name) => {
    const m = name.match(/^(Matrix Tonal Control)\s+(\d{1,2}[A-Z]{1,3}[+]?)\s*(.*?)\s*(\d+ml)\s*$/i);
    if (m) return { baseName: `${m[1]} ${m[4]}`, colorCode: `${m[2]}${m[3] ? ' ' + m[3] : ''}`.trim() };
    const m2 = name.match(/^(Matrix Tonal Control)\s+(Clear)\s+(\d+ml)\s*$/i);
    if (m2) return { baseName: `${m2[1]} ${m2[3]}`, colorCode: m2[2] };
    return null;
  },

  // "Shades EQ 010GI Tahitian Sand 60ml" (without "Redken" prefix) → group with Redken Shades EQ
  (name) => {
    const m = name.match(/^(Shades EQ)\s+(\d{1,3}[A-Z]{1,4}[+]?)\s*(.*?)\s*(\d+ml)\s*$/i);
    if (m) return { baseName: `Redken ${m[1]} ${m[4]}`, colorCode: `${m[2]}${m[3] ? ' ' + m[3] : ''}`.trim() };
    return null;
  },

  // "Redken Chromatics Remixed Violet 63ml" → base: "Redken Chromatics Remixed 63ml", color: "Violet"
  (name) => {
    const m = name.trim().match(/^(Redken Chromatics Remixed)\s+(.+?)\s+(\d+ml)\s*$/i);
    if (m) return { baseName: `${m[1]} ${m[3]}`, colorCode: m[2].trim() };
    return null;
  },

  // "Redken Blond Idol Color High Lift Violet .2 60ml" → base: "Redken Blond Idol Color High Lift 60ml", color: "Violet .2"
  (name) => {
    const m = name.match(/^(Redken Blond Idol Color High Lift)\s+(.+?)\s+(\d+ml)\s*$/i);
    if (m) return { baseName: `${m[1]} ${m[3]}`, colorCode: m[2].trim() };
    return null;
  },

  // "Redken Blond Idol Base Breaker Clear 60ml" → base: "Redken Blond Idol Base Breaker 60ml", color: "Clear"
  (name) => {
    const m = name.match(/^(Redken Blond Idol Base Breaker)\s+(.+?)\s+(\d+ml)\s*$/i);
    if (m) return { baseName: `${m[1]} ${m[3]}`, colorCode: m[2].trim() };
    return null;
  },

  // Developer/oxidant variants: "Matrix Cream Oxydant Developer 30 Vol (9%) 1000ml"
  // → base: "Matrix Cream Oxydant Developer 1000ml", color: "30 Vol (9%)"
  // Also: "Redken Pro Oxide Developer 20 Vol (6%)" (no ml)
  // Also: "Redken Chromatics Developer 10 Vol (3%)"
  (name) => {
    const m = name.match(/^(.+?Developer)\s+(\d+\s*Vol\s*\(\d+%?\))\s*(\d+ml)?\s*$/i);
    if (m) return { baseName: `${m[1]}${m[3] ? ' ' + m[3] : ''}`, colorCode: m[2].trim() };
    return null;
  },

  // Olivia Garden brush sizes: "Olivia Garden Expert Blowout Shine 35"
  // → base: "Olivia Garden Expert Blowout Shine", color: "35"
  (name) => {
    const m = name.match(/^(Olivia Garden .+?)\s+(\d{2})$/);
    if (m) return { baseName: m[1], colorCode: m[2] };
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

    const nameClean = p.nameLat.trim();
    for (const fn of patterns) {
      result = fn(nameClean);
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
