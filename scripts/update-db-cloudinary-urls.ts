import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const mapPath = path.join(__dirname, "cloudinary-url-map.json");
  if (!fs.existsSync(mapPath)) {
    console.error("cloudinary-url-map.json not found. Run upload-to-cloudinary.ts first.");
    process.exit(1);
  }

  const urlMap: Record<string, string> = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
  console.log(`Loaded ${Object.keys(urlMap).length} Cloudinary URLs`);

  const images = await prisma.productImage.findMany({ select: { id: true, url: true } });
  console.log(`Found ${images.length} product images in DB`);

  let updated = 0;
  let notFound = 0;

  for (const img of images) {
    // Current URL format: /products/filename.webp
    const filename = img.url.replace(/^\/products\//, "");
    const cloudinaryUrl = urlMap[filename];

    if (cloudinaryUrl) {
      await prisma.productImage.update({
        where: { id: img.id },
        data: { url: cloudinaryUrl },
      });
      updated++;
    } else {
      console.warn(`No Cloudinary URL for: ${filename}`);
      notFound++;
    }
  }

  console.log(`\nDone! ${updated} URLs updated, ${notFound} not found in Cloudinary`);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
