import { v2 as cloudinary } from "cloudinary";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGES_DIR = "C:/Users/nidza/Downloads/images/images";
const BATCH_SIZE = 10; // concurrent uploads

async function uploadImage(filePath: string): Promise<{ filename: string; url: string } | null> {
  const filename = path.basename(filePath);
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "altamoda/products",
      public_id: path.parse(filename).name, // filename without extension
      overwrite: false,
      resource_type: "image",
    });
    return { filename, url: result.secure_url };
  } catch (err: any) {
    if (err?.http_code === 409) {
      // Already exists
      const publicId = `altamoda/products/${path.parse(filename).name}`;
      const url = cloudinary.url(publicId, { secure: true });
      return { filename, url };
    }
    console.error(`Failed to upload ${filename}:`, err.message || err);
    return null;
  }
}

async function main() {
  const files = fs.readdirSync(IMAGES_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return [".webp", ".jpg", ".jpeg", ".png", ".gif"].includes(ext);
  });

  console.log(`Found ${files.length} image files to upload`);

  const urlMap: Record<string, string> = {};
  let uploaded = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const promises = batch.map((file) => uploadImage(path.join(IMAGES_DIR, file)));
    const results = await Promise.all(promises);

    for (const result of results) {
      if (result) {
        urlMap[result.filename] = result.url;
        uploaded++;
      } else {
        failed++;
      }
    }

    console.log(`Progress: ${uploaded + failed}/${files.length} (${uploaded} uploaded, ${failed} failed)`);
  }

  // Save the URL mapping for the DB update step
  const mapPath = path.join(__dirname, "cloudinary-url-map.json");
  fs.writeFileSync(mapPath, JSON.stringify(urlMap, null, 2));
  console.log(`\nDone! ${uploaded} uploaded, ${failed} failed`);
  console.log(`URL map saved to ${mapPath}`);
}

main().catch(console.error);
