/**
 * Migration Seed Script
 *
 * Reads the old MySQL dump (altamoda_db.sql) and seeds the new PostgreSQL
 * database via Prisma. Run with:
 *
 *   npx tsx prisma/seed-from-old-db.ts
 *
 * Prerequisites:
 *   - DATABASE_URL in .env pointing to the target PostgreSQL database
 *   - Prisma migrations already applied (`npx prisma migrate deploy`)
 *   - npm install he  (HTML entity decoder)
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SQL_DUMP_PATH = path.resolve(
  "C:/Users/nidza/Downloads/altamoda_db.sql"
);

const IMAGE_URL_PREFIX =
  "https://www.altamoda.rs/uploads/store/products/";
const BRAND_LOGO_PREFIX =
  "https://www.altamoda.rs/uploads/store/brands/";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// ID mapping tables  (old int -> new cuid)
// ---------------------------------------------------------------------------

const brandIdMap = new Map<number, string>();
const categoryIdMap = new Map<number, string>();
const attributeIdMap = new Map<number, string>();
const optionIdMap = new Map<number, string>();
const productIdMap = new Map<number, string>();
const userIdMap = new Map<number, string>();
const orderIdMap = new Map<number, string>();

// Additional lookup caches for order_items
const productNameCache = new Map<number, string>(); // old product id -> nameLat
const productSkuCache = new Map<number, string>(); // old product id -> sku

// feature_options metadata cache (option_id -> { feature_id, value })
const featureOptionMeta = new Map<
  number,
  { featureId: number; value: string }
>();

// category parent cache for second-pass update
const categoryParentCache = new Map<number, number | null>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal HTML entity decode (covers the most common cases in the dump). */
function decodeHtml(str: string | null | undefined): string | null {
  if (str == null) return null;
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/** Turn a string into a URL-friendly slug. */
function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Parse a MySQL INSERT statement and return an array of row-tuples.
 *
 *  Each row is an array of raw string values. NULL is represented by the
 *  string literal "NULL". Quoted strings have their outer quotes removed and
 *  internal escapes (\\', \\\\) resolved.
 */
function parseInsert(
  sql: string,
  tableName: string
): string[][] {
  const rows: string[][] = [];
  // Find all INSERT INTO `tableName` ... VALUES blocks
  const regex = new RegExp(
    `INSERT INTO \`${tableName}\`\\s*\\([^)]+\\)\\s*VALUES\\s*`,
    "gi"
  );
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sql)) !== null) {
    let pos = match.index + match[0].length;
    // Now parse value tuples until we hit a semicolon
    while (pos < sql.length) {
      // skip whitespace / newlines
      while (pos < sql.length && /[\s,]/.test(sql[pos])) pos++;
      if (pos >= sql.length || sql[pos] === ";") break;
      if (sql[pos] !== "(") break;
      pos++; // skip opening paren

      const values: string[] = [];
      while (pos < sql.length) {
        // skip whitespace
        while (pos < sql.length && sql[pos] === " ") pos++;

        if (sql[pos] === ")") {
          pos++;
          break;
        }
        if (sql[pos] === ",") {
          pos++;
          continue;
        }

        if (sql[pos] === "'") {
          // quoted string
          pos++;
          let val = "";
          while (pos < sql.length) {
            if (sql[pos] === "\\" && pos + 1 < sql.length) {
              const next = sql[pos + 1];
              if (next === "'") {
                val += "'";
                pos += 2;
              } else if (next === "\\") {
                val += "\\";
                pos += 2;
              } else if (next === "n") {
                val += "\n";
                pos += 2;
              } else if (next === "r") {
                val += "\r";
                pos += 2;
              } else if (next === "0") {
                val += "\0";
                pos += 2;
              } else {
                val += next;
                pos += 2;
              }
            } else if (sql[pos] === "'" && pos + 1 < sql.length && sql[pos + 1] === "'") {
              // double-quote escape
              val += "'";
              pos += 2;
            } else if (sql[pos] === "'") {
              pos++;
              break;
            } else {
              val += sql[pos];
              pos++;
            }
          }
          values.push(val);
        } else {
          // unquoted value (number or NULL)
          let val = "";
          while (
            pos < sql.length &&
            sql[pos] !== "," &&
            sql[pos] !== ")" &&
            sql[pos] !== " "
          ) {
            val += sql[pos];
            pos++;
          }
          values.push(val);
        }
      }
      rows.push(values);
    }
  }
  return rows;
}

/** Get a value or null if "NULL" or empty. */
function valOrNull(v: string | undefined): string | null {
  if (v === undefined || v === "NULL" || v === "") return null;
  return v;
}

/** Parse int or return 0. */
function intVal(v: string | undefined): number {
  if (v === undefined || v === "NULL" || v === "") return 0;
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : n;
}

/** Parse float or return 0. */
function floatVal(v: string | undefined): number {
  if (v === undefined || v === "NULL" || v === "") return 0;
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

/** Parse a date string, returning a safe Date. */
function parseDate(v: string | undefined): Date {
  if (!v || v === "NULL" || v.startsWith("0000")) {
    return new Date("2015-01-01T00:00:00Z");
  }
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date("2015-01-01T00:00:00Z") : d;
}

/** Boolean from tinyint string. */
function boolVal(v: string | undefined): boolean {
  return v === "1";
}

// Slug uniqueness helpers per entity
const usedSlugs = new Map<string, Set<string>>();

function uniqueSlug(entity: string, base: string): string {
  if (!usedSlugs.has(entity)) usedSlugs.set(entity, new Set());
  const set = usedSlugs.get(entity)!;
  let slug = base || "item";
  if (!set.has(slug)) {
    set.add(slug);
    return slug;
  }
  let i = 2;
  while (set.has(`${slug}-${i}`)) i++;
  const final = `${slug}-${i}`;
  set.add(final);
  return final;
}

// SKU uniqueness
const usedSkus = new Set<string>();
function uniqueSku(base: string, oldId: number): string {
  let sku = base && base.trim() ? base.trim() : `OLD-${oldId}`;
  if (!usedSkus.has(sku)) {
    usedSkus.add(sku);
    return sku;
  }
  let i = 2;
  while (usedSkus.has(`${sku}-${i}`)) i++;
  const final = `${sku}-${i}`;
  usedSkus.add(final);
  return final;
}

// Email uniqueness
const usedEmails = new Set<string>();

// ---------------------------------------------------------------------------
// Migration steps
// ---------------------------------------------------------------------------

async function migrateBrands(sql: string) {
  console.log("\n--- Migrating brands ---");
  const rows = parseInsert(sql, "brands");
  console.log(`  Found ${rows.length} rows in dump`);
  let count = 0;

  for (const r of rows) {
    // id, name, uri, logo, title_sr, title_en, description_sr, description_en, position,
    // seo_title_tag_sr, seo_title_tag_en, seo_meta_description_sr, seo_meta_description_en
    const oldId = intVal(r[0]);
    const name = valOrNull(r[1]) || "Unknown Brand";
    const slug = uniqueSlug("brand", r[2] || slugify(name));
    const logo = valOrNull(r[3]);
    const description = decodeHtml(valOrNull(r[6]));

    const brand = await prisma.brand.create({
      data: {
        name,
        slug,
        logoUrl: logo ? `${BRAND_LOGO_PREFIX}${logo}` : null,
        description,
        isActive: true,
      },
    });
    brandIdMap.set(oldId, brand.id);
    count++;
  }
  console.log(`  Inserted ${count} brands`);
}

async function migrateCategories(sql: string) {
  console.log("\n--- Migrating categories ---");
  const rows = parseInsert(sql, "categories");
  console.log(`  Found ${rows.length} rows in dump`);
  let count = 0;

  // First pass: insert all categories without parentId
  for (const r of rows) {
    // id, parent, icon, image, level, name_sr, seo_title_sr, uri_sr, seo_description_sr,
    // title_sr, description_sr, name_en, active, seo_title_en, uri_en, seo_description_en,
    // title_en, description_en
    const oldId = intVal(r[0]);
    const parentOld = valOrNull(r[1]) ? intVal(r[1]) : null;
    const level = intVal(r[4]);
    const nameLat = valOrNull(r[5]) || "Unknown";
    const slug = uniqueSlug("category", r[7] || slugify(nameLat));
    const isActive = boolVal(r[12]);

    categoryParentCache.set(oldId, parentOld);

    const cat = await prisma.category.create({
      data: {
        nameLat,
        slug,
        depth: Math.max(level - 1, 0),
        isActive,
        sortOrder: 0,
      },
    });
    categoryIdMap.set(oldId, cat.id);
    count++;
  }

  // Second pass: set parentId
  let parentUpdates = 0;
  for (const [oldId, parentOld] of categoryParentCache) {
    if (parentOld != null && categoryIdMap.has(parentOld)) {
      const newId = categoryIdMap.get(oldId)!;
      const newParentId = categoryIdMap.get(parentOld)!;
      await prisma.category.update({
        where: { id: newId },
        data: { parentId: newParentId },
      });
      parentUpdates++;
    }
  }

  console.log(`  Inserted ${count} categories (${parentUpdates} with parents)`);
}

async function migrateFeatures(sql: string) {
  console.log("\n--- Migrating features -> dynamic_attributes ---");
  const rows = parseInsert(sql, "features");
  console.log(`  Found ${rows.length} rows in dump`);
  let count = 0;

  for (const r of rows) {
    // id, mandatory, name_en, name_sr
    const oldId = intVal(r[0]);
    const nameEn = (valOrNull(r[2]) || "").trim();
    const nameSr = valOrNull(r[3]) || nameEn || "Attribute";
    const slug = uniqueSlug(
      "attribute",
      slugify(nameEn || nameSr)
    );

    const attr = await prisma.dynamicAttribute.create({
      data: {
        nameLat: nameSr,
        slug,
        type: "select",
        filterable: true,
        showInFilters: true,
        sortOrder: 0,
      },
    });
    attributeIdMap.set(oldId, attr.id);
    count++;
  }
  console.log(`  Inserted ${count} dynamic_attributes`);
}

async function migrateFeatureOptions(sql: string) {
  console.log("\n--- Migrating feature_options -> dynamic_attribute_options ---");
  const rows = parseInsert(sql, "feature_options");
  console.log(`  Found ${rows.length} rows in dump`);
  let count = 0;
  let skipped = 0;

  // Track sortOrder per attribute
  const sortCounters = new Map<number, number>();

  for (const r of rows) {
    // id, feature_id, name_en, name_sr
    const oldId = intVal(r[0]);
    const featureId = intVal(r[1]);
    const nameSr = valOrNull(r[3]) || valOrNull(r[2]) || "";

    // Cache for product_options mapping
    featureOptionMeta.set(oldId, { featureId, value: nameSr });

    const newAttributeId = attributeIdMap.get(featureId);
    if (!newAttributeId) {
      skipped++;
      continue;
    }

    const sortOrder = sortCounters.get(featureId) || 0;
    sortCounters.set(featureId, sortOrder + 1);

    const opt = await prisma.dynamicAttributeOption.create({
      data: {
        attributeId: newAttributeId,
        value: nameSr,
        sortOrder,
      },
    });
    optionIdMap.set(oldId, opt.id);
    count++;
  }
  console.log(`  Inserted ${count} options (${skipped} skipped)`);
}

async function migrateProducts(sql: string) {
  console.log("\n--- Migrating products ---");
  const rows = parseInsert(sql, "products");
  console.log(`  Found ${rows.length} rows in dump`);
  let count = 0;

  for (const r of rows) {
    // 0:id, 1:code, 2:product_active, 3:main_price, 4:no_pdv_price,
    // 5:promotion_price, 6:new, 7:sale, 8:recommended, 9:sold_out,
    // 10:top, 11:have_stock, 12:stock, 13:manufacturer_id,
    // 14:popup_product, 15:sales_count,
    // 16:name_sr, 17:full_name_sr, 18:description_sr,
    // 19:aditional_info_1_sr, 20:aditional_info_2_sr, 21:aditional_info_3_sr,
    // 22:uri_sr, 23:meta_tag_sr, 24:seo_description_sr,
    // 25:name_en, 26:full_name_en, 27:description_en,
    // 28:aditional_info_1_en, 29:aditional_info_2_en, 30:aditional_info_3_en,
    // 31:uri_en, 32:meta_tag_en, 33:seo_description_en

    const oldId = intVal(r[0]);
    const code = valOrNull(r[1]) || "";
    const sku = uniqueSku(code, oldId);
    const nameLat = decodeHtml(valOrNull(r[16])) || `Product ${oldId}`;
    const slug = uniqueSlug("product", r[22] || slugify(nameLat));
    const manufacturerId = intVal(r[13]);
    const noPdvPrice = floatVal(r[4]);
    const promotionPrice = floatVal(r[5]);
    const description = decodeHtml(valOrNull(r[18]));
    const usageInstructions = decodeHtml(valOrNull(r[19]));
    const seoTitle = decodeHtml(valOrNull(r[23]));
    const seoDescription = decodeHtml(valOrNull(r[24]));

    // Cache for order_items
    productNameCache.set(oldId, nameLat);
    productSkuCache.set(oldId, sku);

    const brandId = brandIdMap.get(manufacturerId) || null;

    // Determine oldPrice: only set if promotion_price differs from no_pdv_price
    // and promotion_price is non-zero
    let oldPrice: number | null = null;
    if (
      promotionPrice > 0 &&
      Math.abs(promotionPrice - noPdvPrice) > 0.01
    ) {
      oldPrice = promotionPrice;
    }

    const product = await prisma.product.create({
      data: {
        sku,
        nameLat,
        slug,
        brandId,
        description,
        usageInstructions,
        priceB2c: noPdvPrice || 0,
        oldPrice,
        stockQuantity: intVal(r[12]),
        isActive: boolVal(r[2]),
        isNew: boolVal(r[6]),
        isFeatured: boolVal(r[10]),
        isBestseller: boolVal(r[8]),
        seoTitle,
        seoDescription,
      },
    });
    productIdMap.set(oldId, product.id);
    count++;
  }
  console.log(`  Inserted ${count} products`);
}

async function migrateProductImages(sql: string) {
  console.log("\n--- Migrating product_images ---");
  const rows = parseInsert(sql, "product_images");
  console.log(`  Found ${rows.length} rows in dump`);
  let count = 0;
  let skipped = 0;

  for (const r of rows) {
    // id, product_id, filename, main_image
    const productOldId = intVal(r[1]);
    const filename = valOrNull(r[2]);
    const isPrimary = boolVal(r[3]);

    const newProductId = productIdMap.get(productOldId);
    if (!newProductId || !filename) {
      skipped++;
      continue;
    }

    await prisma.productImage.create({
      data: {
        productId: newProductId,
        url: `${IMAGE_URL_PREFIX}${filename}`,
        type: "image",
        isPrimary,
        sortOrder: isPrimary ? 0 : 1,
      },
    });
    count++;
  }
  console.log(`  Inserted ${count} images (${skipped} skipped)`);
}

async function migrateProductCategories(sql: string) {
  console.log("\n--- Migrating product_categories -> updating categoryId ---");
  const rows = parseInsert(sql, "product_categories");
  console.log(`  Found ${rows.length} rows in dump`);

  // Collect first category per product
  const firstCategory = new Map<number, number>();

  for (const r of rows) {
    // id, product_id, category_id
    const productOldId = intVal(r[1]);
    const categoryOldId = intVal(r[2]);

    if (!firstCategory.has(productOldId)) {
      firstCategory.set(productOldId, categoryOldId);
    }
  }

  let updated = 0;
  let skipped = 0;

  for (const [productOldId, categoryOldId] of firstCategory) {
    const newProductId = productIdMap.get(productOldId);
    const newCategoryId = categoryIdMap.get(categoryOldId);
    if (!newProductId || !newCategoryId) {
      skipped++;
      continue;
    }

    await prisma.product.update({
      where: { id: newProductId },
      data: { categoryId: newCategoryId },
    });
    updated++;
  }
  console.log(`  Updated ${updated} products with categoryId (${skipped} skipped)`);
}

async function migrateProductOptions(sql: string) {
  console.log("\n--- Migrating product_options -> product_attributes ---");
  const rows = parseInsert(sql, "product_options");
  console.log(`  Found ${rows.length} rows in dump`);
  let count = 0;
  let skipped = 0;

  // Track existing (productId, attributeId) to avoid unique constraint violation
  const seen = new Set<string>();

  for (const r of rows) {
    // product_id, option_id
    const productOldId = intVal(r[0]);
    const optionOldId = intVal(r[1]);

    const newProductId = productIdMap.get(productOldId);
    const meta = featureOptionMeta.get(optionOldId);
    if (!newProductId || !meta) {
      skipped++;
      continue;
    }

    const newAttributeId = attributeIdMap.get(meta.featureId);
    if (!newAttributeId) {
      skipped++;
      continue;
    }

    const key = `${newProductId}:${newAttributeId}`;
    if (seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);

    await prisma.productAttribute.create({
      data: {
        productId: newProductId,
        attributeId: newAttributeId,
        value: meta.value,
      },
    });
    count++;
  }
  console.log(`  Inserted ${count} product_attributes (${skipped} skipped)`);
}

async function migrateUsers(sql: string) {
  console.log("\n--- Migrating users ---");
  const rows = parseInsert(sql, "users");
  console.log(`  Found ${rows.length} rows in dump`);
  let count = 0;
  let skippedDup = 0;

  for (const r of rows) {
    // 0:id, 1:user_type, 2:first_name, 3:last_name, 4:email, 5:password,
    // 6:phone, 7:city, 8:address, 9:postal_number, 10:notify_email,
    // 11:company_name, 12:company_pib, 13:company_reg_number,
    // 14:date_registered, 15:vp_prices, 16:blocked_user

    const oldId = intVal(r[0]);
    const email = (valOrNull(r[4]) || "").trim().toLowerCase();

    if (!email || usedEmails.has(email)) {
      skippedDup++;
      continue;
    }
    usedEmails.add(email);

    const userType = valOrNull(r[1]) || "natural_person";
    const firstName = valOrNull(r[2]) || "";
    const lastName = valOrNull(r[3]) || "";
    const name = `${firstName} ${lastName}`.trim() || "Unknown";
    const phone = valOrNull(r[6]) || null;
    const city = valOrNull(r[7]) || "";
    const address = valOrNull(r[8]) || "";
    const postalCode = valOrNull(r[9]) || "";
    const password = valOrNull(r[5]) || "";
    const role = userType === "legal_entity" ? "b2b" : "b2c";
    const status = boolVal(r[16]) ? "suspended" : "active";
    const createdAt = parseDate(valOrNull(r[14]) || undefined);

    const companyName = valOrNull(r[11]);
    const companyPib = valOrNull(r[12]);
    const companyRegNumber = valOrNull(r[13]);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: `SHA1_NEEDS_REHASH:${password}`,
        name,
        phone,
        role: role as any,
        status: status as any,
        createdAt,
      },
    });
    userIdMap.set(oldId, user.id);

    // Create address if we have any address data
    if (address || city) {
      await prisma.userAddress.create({
        data: {
          userId: user.id,
          label: "Glavna adresa",
          street: address || "-",
          city: city || "-",
          postalCode: postalCode || "00000",
          country: "Srbija",
          isDefault: true,
        },
      });
    }

    // Create B2B profile for legal_entity users
    if (userType === "legal_entity" && companyName) {
      await prisma.b2bProfile.create({
        data: {
          userId: user.id,
          salonName: companyName,
          pib: companyPib,
          maticniBroj: companyRegNumber,
          address: address || null,
          discountTier: 0,
        },
      });
    }

    count++;
  }
  console.log(
    `  Inserted ${count} users (${skippedDup} duplicate emails skipped)`
  );
}

async function migrateOrders(sql: string) {
  console.log("\n--- Migrating orders ---");
  const rows = parseInsert(sql, "orders");
  console.log(`  Found ${rows.length} rows in dump`);
  let count = 0;
  let skipped = 0;

  const statusMap: Record<string, string> = {
    "1": "novi",
    "2": "u_obradi",
    "3": "isporuceno",
  };

  const paymentMap: Record<string, string> = {
    "1": "cash_on_delivery",
    "2": "bank_transfer",
    "3": "card",
  };

  for (const r of rows) {
    // 0:id, 1:user_id, 2:items_price, 3:shipping_price, 4:total_price,
    // 5:status, 6:ship_to_diff_address, 7:first_name, 8:last_name,
    // 9:email, 10:city, 11:address, 12:postal_no, 13:contact_phone,
    // 14:status_1_date, 15:status_2_date, 16:status_3_date,
    // 17:payment_type, 18:completed, 19:language, 20:currency,
    // 21:additional_instructions, 22:promo_code,
    // 23:user_type, 24:company_name, 25:company_pib, 26:company_reg_number

    const oldId = intVal(r[0]);
    const userOldId = valOrNull(r[1]) ? intVal(r[1]) : null;

    // Skip orders with no user (guest orders) since new schema requires userId
    if (userOldId == null || !userIdMap.has(userOldId)) {
      skipped++;
      continue;
    }

    const newUserId = userIdMap.get(userOldId)!;
    const orderStatus = statusMap[r[5]] || "novi";
    const paymentMethod = paymentMap[r[17]] || "cash_on_delivery";
    const paymentStatus = boolVal(r[18]) ? "paid" : "pending";

    const shippingAddress = {
      name: `${valOrNull(r[7]) || ""} ${valOrNull(r[8]) || ""}`.trim(),
      street: valOrNull(r[11]) || "",
      city: valOrNull(r[10]) || "",
      postalCode: valOrNull(r[12]) || "",
      phone: valOrNull(r[13]) || "",
    };

    const createdAt = parseDate(valOrNull(r[14]) || undefined);
    const orderNumber = `AM-${oldId.toString().padStart(6, "0")}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: newUserId,
        status: orderStatus as any,
        subtotal: floatVal(r[2]),
        shippingCost: floatVal(r[3]),
        total: floatVal(r[4]),
        paymentMethod: paymentMethod as any,
        paymentStatus: paymentStatus as any,
        shippingAddress,
        notes: decodeHtml(valOrNull(r[21])),
        createdAt,
      },
    });
    orderIdMap.set(oldId, order.id);
    count++;
  }
  console.log(`  Inserted ${count} orders (${skipped} skipped / no user)`);
}

async function migrateOrderItems(sql: string) {
  console.log("\n--- Migrating order_items ---");
  const rows = parseInsert(sql, "order_items");
  console.log(`  Found ${rows.length} rows in dump`);
  let count = 0;
  let skipped = 0;

  for (const r of rows) {
    // 0:id, 1:order_id, 2:product_id, 3:amount, 4:price, 5:options
    const orderOldId = intVal(r[1]);
    const productOldId = intVal(r[2]);
    const quantity = intVal(r[3]);
    const unitPrice = floatVal(r[4]);

    const newOrderId = orderIdMap.get(orderOldId);
    const newProductId = productIdMap.get(productOldId);
    if (!newOrderId || !newProductId) {
      skipped++;
      continue;
    }

    const productName =
      productNameCache.get(productOldId) || `Product ${productOldId}`;
    const productSku =
      productSkuCache.get(productOldId) || `OLD-${productOldId}`;

    await prisma.orderItem.create({
      data: {
        orderId: newOrderId,
        productId: newProductId,
        productName,
        productSku,
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
      },
    });
    count++;
  }
  console.log(`  Inserted ${count} order_items (${skipped} skipped)`);
}

async function migrateNewsletter(sql: string) {
  console.log("\n--- Migrating newsletter_subscribers ---");
  const rows = parseInsert(sql, "newsletter_subscribers");
  console.log(`  Found ${rows.length} rows in dump`);
  let count = 0;
  let skippedDup = 0;

  const seenEmails = new Set<string>();

  for (const r of rows) {
    // 0:id, 1:email, 2:language, 3:date
    const email = (valOrNull(r[1]) || "").trim().toLowerCase();
    if (!email || seenEmails.has(email)) {
      skippedDup++;
      continue;
    }
    seenEmails.add(email);

    const subscribedAt = parseDate(valOrNull(r[3]) || undefined);

    await prisma.newsletterSubscriber.create({
      data: {
        email,
        segment: "b2c",
        isSubscribed: true,
        subscribedAt,
      },
    });
    count++;
  }
  console.log(
    `  Inserted ${count} subscribers (${skippedDup} duplicates skipped)`
  );
}

async function migrateWishes(sql: string) {
  console.log("\n--- Migrating wishes -> wishlists ---");
  const rows = parseInsert(sql, "wishes");
  console.log(`  Found ${rows.length} rows in dump`);
  let count = 0;
  let skipped = 0;

  const seen = new Set<string>();

  for (const r of rows) {
    // 0:id, 1:user, 2:product
    const userOldId = intVal(r[1]);
    const productOldId = intVal(r[2]);

    const newUserId = userIdMap.get(userOldId);
    const newProductId = productIdMap.get(productOldId);
    if (!newUserId || !newProductId) {
      skipped++;
      continue;
    }

    const key = `${newUserId}:${newProductId}`;
    if (seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);

    await prisma.wishlist.create({
      data: {
        userId: newUserId,
        productId: newProductId,
      },
    });
    count++;
  }
  console.log(`  Inserted ${count} wishlists (${skipped} skipped)`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Alta Moda Data Migration ===");
  console.log(`Reading SQL dump from: ${SQL_DUMP_PATH}`);

  if (!fs.existsSync(SQL_DUMP_PATH)) {
    console.error(`ERROR: SQL dump file not found at ${SQL_DUMP_PATH}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(SQL_DUMP_PATH, "utf-8");
  console.log(`  Dump size: ${(sql.length / 1024 / 1024).toFixed(1)} MB`);

  const startTime = Date.now();

  // Process in order of foreign key dependencies
  await migrateBrands(sql);
  await migrateCategories(sql);
  await migrateFeatures(sql);
  await migrateFeatureOptions(sql);
  await migrateProducts(sql);
  await migrateProductImages(sql);
  await migrateProductCategories(sql);
  await migrateProductOptions(sql);
  await migrateUsers(sql);
  await migrateOrders(sql);
  await migrateOrderItems(sql);
  await migrateNewsletter(sql);
  await migrateWishes(sql);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== Migration complete in ${elapsed}s ===`);
  console.log(`  Brands:      ${brandIdMap.size}`);
  console.log(`  Categories:  ${categoryIdMap.size}`);
  console.log(`  Attributes:  ${attributeIdMap.size}`);
  console.log(`  Options:     ${optionIdMap.size}`);
  console.log(`  Products:    ${productIdMap.size}`);
  console.log(`  Users:       ${userIdMap.size}`);
  console.log(`  Orders:      ${orderIdMap.size}`);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
