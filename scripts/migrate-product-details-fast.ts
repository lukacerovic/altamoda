import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as readline from "readline";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function decodeHtml(s: string): string {
  return s
    .replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\r/g, "\r")
    .replace(/\\'/g, "'").replace(/\\"/g, '"')
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, " ");
}

// Extract field value between single quotes, handling escaped quotes
function extractFields(row: string): string[] {
  const fields: string[] = [];
  let i = 0;
  // skip leading (
  if (row[0] === "(") i = 1;

  while (i < row.length) {
    // skip whitespace
    while (i < row.length && (row[i] === " " || row[i] === "\t")) i++;
    if (i >= row.length) break;

    if (row[i] === "'") {
      // String field
      i++; // skip opening quote
      let val = "";
      while (i < row.length) {
        if (row[i] === "\\" && i + 1 < row.length) {
          val += row[i] + row[i + 1];
          i += 2;
          continue;
        }
        if (row[i] === "'") {
          if (row[i + 1] === "'") { val += "'"; i += 2; continue; }
          i++; // skip closing quote
          break;
        }
        val += row[i];
        i++;
      }
      fields.push(val);
    } else if (row.substring(i, i + 4) === "NULL") {
      fields.push("NULL");
      i += 4;
    } else {
      // Numeric field
      let val = "";
      while (i < row.length && row[i] !== "," && row[i] !== ")") {
        val += row[i];
        i++;
      }
      fields.push(val.trim());
    }

    // skip comma
    while (i < row.length && (row[i] === "," || row[i] === " " || row[i] === ")")) {
      if (row[i] === ")") { i++; break; }
      i++;
    }
  }
  return fields;
}

async function main() {
  const sqlPath = "C:/Users/nidza/Downloads/altamoda_db.sql";
  console.log("Reading SQL dump line by line...");

  const fileStream = fs.createReadStream(sqlPath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let inProductsInsert = false;
  let buffer = "";
  const updates: { slug: string; purpose: string | null; ingredients: string | null }[] = [];

  for await (const line of rl) {
    if (line.startsWith("INSERT INTO `products`")) {
      inProductsInsert = true;
      buffer = line;
      continue;
    }

    if (inProductsInsert) {
      buffer += "\n" + line;
      if (line.endsWith(";")) {
        inProductsInsert = false;
        // Parse all rows from this INSERT
        // Split by ),( pattern - each row starts with ( and ends with )
        const valuesStart = buffer.indexOf("VALUES");
        if (valuesStart === -1) continue;
        const valuesStr = buffer.substring(valuesStart + 6).trim();

        // Split into individual row strings
        const rowStrings: string[] = [];
        let depth = 0;
        let start = -1;
        for (let i = 0; i < valuesStr.length; i++) {
          const ch = valuesStr[i];
          if (ch === "'" ) {
            // skip string content
            i++;
            while (i < valuesStr.length) {
              if (valuesStr[i] === "\\" ) { i += 2; continue; }
              if (valuesStr[i] === "'") break;
              i++;
            }
            continue;
          }
          if (ch === "(") {
            if (depth === 0) start = i;
            depth++;
          }
          if (ch === ")") {
            depth--;
            if (depth === 0 && start >= 0) {
              rowStrings.push(valuesStr.substring(start, i + 1));
              start = -1;
            }
          }
        }

        console.log(`Found ${rowStrings.length} product rows in INSERT`);

        for (const rowStr of rowStrings) {
          const fields = extractFields(rowStr);
          // Fields: 0:id, ..., 20:aditional_info_2_sr (purpose), 21:aditional_info_3_sr (ingredients), 22:uri_sr (slug)
          const slug = fields[22] && fields[22] !== "NULL" ? fields[22] : null;
          if (!slug) continue;

          const rawPurpose = fields[20] && fields[20] !== "NULL" ? fields[20] : null;
          const rawIngredients = fields[21] && fields[21] !== "NULL" ? fields[21] : null;

          const purpose = rawPurpose ? decodeHtml(rawPurpose) : null;
          const ingredients = rawIngredients ? decodeHtml(rawIngredients) : null;

          if (purpose || ingredients) {
            updates.push({ slug, purpose, ingredients });
          }
        }
        buffer = "";
      }
    }
  }

  console.log(`\nFound ${updates.length} products with purpose or ingredients data`);
  console.log("Updating database...");

  let updated = 0;
  let notFound = 0;

  for (const u of updates) {
    try {
      const data: Record<string, string> = {};
      if (u.purpose) data.purpose = u.purpose;
      if (u.ingredients) data.ingredients = u.ingredients;

      const result = await prisma.product.updateMany({
        where: { slug: u.slug },
        data,
      });
      if (result.count > 0) {
        updated++;
      } else {
        notFound++;
      }
    } catch {
      notFound++;
    }
    if ((updated + notFound) % 100 === 0) {
      console.log(`  Progress: ${updated + notFound}/${updates.length}`);
    }
  }

  console.log(`\nDone! ${updated} products updated, ${notFound} not found`);

  const purposeCount = await prisma.product.count({ where: { purpose: { not: null } } });
  const ingredientsCount = await prisma.product.count({ where: { ingredients: { not: null } } });
  const usageCount = await prisma.product.count({ where: { usageInstructions: { not: null } } });
  const totalActive = await prisma.product.count({ where: { isActive: true } });

  console.log(`\n--- Field Coverage ---`);
  console.log(`Active products: ${totalActive}`);
  console.log(`With purpose (namena): ${purposeCount}`);
  console.log(`With ingredients (INCI): ${ingredientsCount}`);
  console.log(`With usage instructions: ${usageCount}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
