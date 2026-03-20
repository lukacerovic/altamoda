# Alta Moda CSV-to-DB Migration Analysis

## 1. Data Structure Comparison

### CSV Columns (scraped data)

| CSV Column | Example Value |
|---|---|
| `id` | `1` |
| `name` | `Redken Extreme Gift Set` |
| `brand` | `Redken` |
| `category` | `Hair Care` |
| `volume_size` | `300ml` |
| `current_price_rsd` | `9030` |
| `original_price_rsd` | `12870` |
| `url_slug` | `rdk-holidays-eu-extreme-kit` |
| `image_url` | `https://www.altamoda.rs/uploads/store/products/images/...webp` |

### Prisma Product Model (DB)

| DB Field | Type | Required | CSV Mapping |
|---|---|---|---|
| `id` | `String (cuid)` | auto | -- (auto-generated) |
| `sku` | `String (unique)` | **YES** | **MISSING** -- must generate |
| `nameLat` | `String` | **YES** | `name` |
| `nameCyr` | `String?` | no | **MISSING** -- not scraped |
| `slug` | `String (unique)` | **YES** | `url_slug` |
| `brandId` | `String? (FK)` | no | `brand` -- needs lookup/creation |
| `productLineId` | `String? (FK)` | no | **MISSING** -- not scraped |
| `categoryId` | `String? (FK)` | no | `category` -- needs lookup/creation |
| `description` | `String?` | no | **MISSING** -- not scraped |
| `ingredients` | `String?` | no | **MISSING** -- not scraped |
| `usageInstructions` | `String?` | no | **MISSING** -- not scraped |
| `priceB2c` | `Decimal` | **YES** | `current_price_rsd` |
| `priceB2b` | `Decimal?` | no | **MISSING** -- B2B pricing not public |
| `oldPrice` | `Decimal?` | no | `original_price_rsd` |
| `costPrice` | `Decimal?` | no | **MISSING** -- internal data |
| `stockQuantity` | `Int` | default 0 | **MISSING** -- not scraped |
| `lowStockThreshold` | `Int` | default 5 | -- (use default) |
| `weightGrams` | `Int?` | no | **MISSING** |
| `volumeMl` | `Int?` | no | `volume_size` -- needs parsing |
| `isProfessional` | `Boolean` | default false | **MISSING** -- needs manual classification |
| `isActive` | `Boolean` | default true | -- (default true) |
| `isNew` | `Boolean` | default false | **MISSING** |
| `isFeatured` | `Boolean` | default false | **MISSING** |
| `isBestseller` | `Boolean` | default false | **MISSING** |
| `erpId` | `String?` | no | **MISSING** |
| `seoTitle` | `String?` | no | **MISSING** |
| `seoDescription` | `String?` | no | **MISSING** |
| `createdAt` | `DateTime` | auto | -- (auto) |
| `updatedAt` | `DateTime` | auto | -- (auto) |

### Related Tables

| Related Model | CSV Mapping | Notes |
|---|---|---|
| `Brand` | `brand` (name string) | Must create Brand records first, then reference by ID |
| `Category` | `category` (name string) | Must create Category records first, then reference by ID |
| `ProductLine` | **MISSING** | No product line data in CSV |
| `ProductImage` | `image_url` | Must create ProductImage record per product |
| `ColorProduct` | **MISSING** | Color products (dyes) in CSV have no color metadata |

---

## 2. Gap Analysis

### Directly Mappable Fields (5/28)

| CSV Field | DB Field | Transformation |
|---|---|---|
| `name` | `nameLat` | Direct copy |
| `url_slug` | `slug` | Direct copy |
| `current_price_rsd` | `priceB2c` | Direct copy (numeric) |
| `original_price_rsd` | `oldPrice` | Direct copy (numeric, nullable) |
| `volume_size` | `volumeMl` | Parse numeric value from strings like `300ml`, `10x6ml`, `7g` |

### Fields Requiring Generation or Lookup (4)

| DB Field | Strategy |
|---|---|
| `sku` | Generate from `url_slug` or use a prefix + sequential number (e.g., `AM-0001`) |
| `brandId` | Create Brand records from unique `brand` values, then FK lookup |
| `categoryId` | Create Category records from unique `category` values, then FK lookup |
| `ProductImage` | Create one image record per product using `image_url` with `isPrimary: true` |

### Fields With No CSV Data (19)

| DB Field | Impact | Recommendation |
|---|---|---|
| `nameCyr` | Low -- optional | Leave null, add later via admin |
| `productLineId` | Low -- optional | Leave null |
| `description` | Medium -- shown on product page | **Scrape from individual product pages** or add via admin |
| `ingredients` | Medium -- shown on product page | **Scrape from individual product pages** or add via admin |
| `usageInstructions` | Low -- optional | Leave null |
| `priceB2b` | Medium -- B2B feature | Must be set manually (internal pricing) |
| `costPrice` | Low -- admin only | Internal data, set manually |
| `stockQuantity` | **HIGH** -- affects availability | Default to 0 or a sensible value like 100 |
| `weightGrams` | Low -- shipping calc | Leave null |
| `isProfessional` | Medium -- visibility filter | Default false, review manually |
| `isNew` | Low -- badge/filter | Could auto-set for recent products |
| `isFeatured` | Low -- homepage display | Set manually via admin |
| `isBestseller` | Low -- badge | Set manually via admin |
| `erpId` | Low -- ERP sync | Leave null until ERP integration |
| `seoTitle` | Low -- SEO | Auto-generate from `name` |
| `seoDescription` | Low -- SEO | Leave null |

---

## 3. Migration Complexity Assessment

### Overall: MEDIUM difficulty

The migration is straightforward because:
- The existing CSV import endpoint (`/api/products/import`) already handles the core logic
- Brand/Category lookup by name is already implemented
- Slug generation is already handled

But requires work because:
- The CSV import endpoint expects different column names (`sku`, `name`, `priceB2c`)
- No image import support in the current endpoint
- SKU values must be generated (not present in scraped data)
- `volume_size` needs parsing (mixed formats: `300ml`, `10x6ml`, `7g`, `5.75''`)
- Category values are informal (not matching any existing DB categories)

---

## 4. Pre-Migration Steps Required

### Step 1: Seed Brands (6 unique brands)

```
Redken, Matrix, Framesi, Biolage, Olivia Garden, Elchim, L'image
```

Must create Brand records with proper slugs before importing products.

### Step 2: Seed Categories (normalize ~25 unique categories)

CSV has informal categories that need mapping to a proper tree:

| CSV Category | Suggested DB Category (nameLat) | Parent |
|---|---|---|
| Shampoo | Samponi | Nega kose |
| Conditioner | Regeneratori | Nega kose |
| Masks | Maske | Nega kose |
| Oils / Oils/Serums | Ulja i serumi | Nega kose |
| Serum | Serumi | Nega kose |
| Treatment | Tretmani | Nega kose |
| Leave-in | Leave-in proizvodi | Nega kose |
| Spray | Sprejevi | Nega kose |
| Styling | Stajling | Stajling |
| Styling (Men) | Muski stajling | Muska linija |
| Men's Care | Muska nega | Muska linija |
| Hair Care | Nega kose | -- (root) |
| Hair Care (Men) | Muska nega kose | Muska linija |
| Color Care | Nega boje | Nega kose |
| Color | Boje za kosu | Kolor |
| Brushes | Cetke | Pribor |
| Scissors | Makaze | Pribor |
| Combs | Cesljevi | Pribor |
| Tools | Alat i pribor | Pribor |
| Accessories | Dodaci | Pribor |
| Hair Tools | Aparati za kosu | Aparati |
| Training Tools | Trening oprema | Pribor |

### Step 3: Generate SKUs

The CSV has no SKU field. Options:
- **Option A**: Use `url_slug` as SKU (already unique) -- simplest
- **Option B**: Generate with brand prefix: `RDK-001`, `MTX-001`, `FRM-001`, etc.
- **Option C**: Use the slug suffix from the website as SKU

**Recommendation**: Option A -- use `url_slug` as SKU since it's already unique and matches the source system.

### Step 4: Parse `volume_size`

Convert to `volumeMl` (Int):
- `300ml` -> `300`
- `10x6ml` -> `60` (total)
- `500ml` -> `500`
- `7g` -> null (weight, not volume -- store in `weightGrams`)
- `5.75''` -> null (size measurement, not volume)
- `300ml + 300ml + 150ml` (sets) -> `750` or null

---

## 5. Required Changes to Import Endpoint

The existing `/api/products/import/route.ts` needs these additions:

1. **Image support**: After creating each product, create a `ProductImage` record
2. **SKU generation**: Handle case where SKU is derived from slug
3. **Volume parsing**: Parse `volume_size` string into `volumeMl` integer
4. **Column name mapping**: Map CSV column names to expected field names
5. **oldPrice mapping**: The current endpoint supports `oldPrice` but CSV uses `original_price_rsd`

### Estimated changes:

```
CsvRow interface:     ~10 lines changed (add image_url, volume_size, url_slug)
parseCsv function:    unchanged (generic)
POST handler:         ~30 lines added (image creation, volume parsing, SKU gen)
```

---

## 6. Migration Script Outline

```
1. Read altamoda_products.csv
2. Extract unique brands -> upsert into `brands` table
3. Extract unique categories -> upsert into `categories` table (with hierarchy)
4. For each product row:
   a. Lookup brandId by brand name
   b. Lookup categoryId by category name
   c. Parse volumeMl from volume_size
   d. Use url_slug as SKU
   e. Create product with: nameLat, slug, priceB2c, oldPrice, volumeMl, brandId, categoryId
   f. Create ProductImage with: url=image_url, isPrimary=true
5. Report: created / errors / skipped
```

---

## 7. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Duplicate slugs with existing data | Medium | Check for existing slugs before insert, append suffix if needed |
| Category mismatch with existing categories | Low | Create fresh categories or map to existing ones |
| Missing stock quantities | **High** | All products will show as out-of-stock (qty=0) unless defaulted |
| No B2B prices | Medium | B2B users won't see prices until manually set |
| No product descriptions | Medium | Product detail pages will be sparse |
| Image URLs are external | Low | URLs point to altamoda.rs -- works as long as site is up |
| Price format (no decimals) | Low | All scraped prices are integers in RSD, valid for Decimal field |

---

## 8. Summary

| Metric | Value |
|---|---|
| Total products in CSV | 281 |
| Fields directly mappable | 5 of 28 (18%) |
| Fields auto-defaultable | 9 of 28 (32%) |
| Fields needing generation | 4 (SKU, brandId, categoryId, ProductImage) |
| Fields left empty | 10 (description, ingredients, B2B pricing, etc.) |
| Unique brands to create | 7 |
| Unique categories to create | ~22 |
| Estimated implementation time | ~2-3 hours |
| Existing import endpoint reusable | Yes, with modifications |

### Verdict

The migration is **feasible and relatively straightforward**. The biggest gaps are missing product descriptions/ingredients (which would require scraping individual product pages) and stock quantities (which need manual input). The existing import endpoint provides a solid foundation -- it needs minor extensions for image creation and column mapping. No schema changes are required.
