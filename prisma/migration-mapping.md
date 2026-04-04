# Migration Mapping: Old MySQL (altamoda_db) to New PostgreSQL (Prisma)

This document describes the field-by-field mapping from the legacy MySQL database
(exported via phpMyAdmin) to the new PostgreSQL schema managed by Prisma.

The migration script lives at `prisma/seed-from-old-db.ts` and is executed with:

```bash
npx tsx prisma/seed-from-old-db.ts
```

---

## Processing Order

Tables must be seeded in this order to satisfy foreign-key constraints:

1. brands
2. categories
3. dynamic_attributes (features)
4. dynamic_attribute_options (feature_options)
5. products
6. product_images
7. product_categories (updates `categoryId` on existing products)
8. product_options (creates product_attributes rows)
9. users (+ user_addresses + b2b_profiles)
10. orders
11. order_items
12. newsletter_subscribers
13. wishlists (wishes)

---

## 1. brands -> brands

| Old Column (MySQL)       | New Column (Prisma)  | Transformation                                         |
|--------------------------|----------------------|--------------------------------------------------------|
| `id` (int)               | -- (lookup map only) | Old int ID mapped to new cuid for FK references        |
| `name`                   | `name`               | Direct copy                                            |
| `uri`                    | `slug` (unique)      | Direct copy                                            |
| `logo`                   | `logoUrl`            | Prefix: `https://www.altamoda.rs/uploads/store/brands/`|
| `description_sr`         | `description`        | HTML entity decode, strip if needed                    |
| --                       | `isActive`           | Default `true`                                         |

### Known brand IDs (old -> name)

| Old ID | Name             |
|--------|------------------|
| 1      | Redken           |
| 2      | Redken Brews     |
| 3      | Matrix           |
| 4      | Elchim           |
| 5      | Biolage          |
| 6      | Mizutani         |
| 8      | L'image          |
| 9      | Biolage R.A.W.   |
| 10     | Olivia Garden    |

---

## 2. categories -> categories

| Old Column          | New Column       | Transformation                                   |
|---------------------|------------------|--------------------------------------------------|
| `id` (int)          | -- (lookup map)  | Old int ID mapped to new cuid                    |
| `parent` (int/NULL) | `parentId`       | Lookup via category ID map; NULL stays NULL       |
| `name_sr`           | `nameLat`        | Direct copy (Serbian Latin)                       |
| --                  | `nameCyr`        | NULL (not available in old DB)                    |
| `uri_sr`            | `slug` (unique)  | Direct copy; append suffix if duplicate           |
| `level`             | `depth`          | `level - 1` (old is 1-based, new is 0-based)     |
| `active`            | `isActive`       | `1` -> `true`, `0` -> `false`                     |
| --                  | `sortOrder`      | Default `0`                                       |

**Note:** Categories are inserted in two passes. First pass creates all categories
without `parentId`, then a second pass updates `parentId` using the ID map.

---

## 3. features -> dynamic_attributes

| Old Column   | New Column       | Transformation                                   |
|--------------|------------------|--------------------------------------------------|
| `id` (int)   | -- (lookup map)  | Old int ID mapped to new cuid                    |
| `name_sr`    | `nameLat`        | Direct copy                                      |
| --           | `nameCyr`        | NULL                                             |
| `name_en`    | `slug`           | Slugified (lowercase, hyphens, trimmed)          |
| --           | `type`           | Default `select` (all features use options)      |
| --           | `filterable`     | Default `true`                                   |
| --           | `showInFilters`  | Default `true`                                   |
| --           | `sortOrder`      | Default `0`                                      |

---

## 4. feature_options -> dynamic_attribute_options

| Old Column     | New Column     | Transformation                                   |
|----------------|----------------|--------------------------------------------------|
| `id` (int)     | -- (lookup map)| Old int ID mapped to new cuid                    |
| `feature_id`   | `attributeId`  | Lookup via dynamic_attributes ID map              |
| `name_sr`      | `value`        | Direct copy                                      |
| --             | `sortOrder`    | Insertion order (0-based index per attribute)     |

---

## 5. products -> products

| Old Column            | New Column          | Transformation                                             |
|-----------------------|---------------------|------------------------------------------------------------|
| `id` (int)            | -- (lookup map)     | Old int ID mapped to new cuid                              |
| `code`                | `sku` (unique)      | Direct copy; generate fallback if empty (`OLD-{id}`)       |
| `name_sr`             | `nameLat`           | HTML entity decode                                         |
| --                    | `nameCyr`           | NULL                                                       |
| `uri_sr`              | `slug` (unique)     | Direct copy; append suffix if duplicate                    |
| `manufacturer_id`     | `brandId`           | Lookup via brands ID map                                   |
| --                    | `categoryId`        | Set later from `product_categories` table                  |
| `description_sr`      | `description`       | HTML entity decode                                         |
| --                    | `ingredients`       | NULL                                                       |
| `aditional_info_1_sr` | `usageInstructions` | HTML entity decode                                         |
| `no_pdv_price`        | `priceB2c`          | Decimal; this is the B2C price without VAT                 |
| --                    | `priceB2b`          | NULL (not in old DB)                                       |
| `promotion_price`     | `oldPrice`          | Only if different from `no_pdv_price`; else NULL           |
| `stock`               | `stockQuantity`     | Integer; default 0                                         |
| --                    | `isProfessional`    | Default `false`                                            |
| `product_active`      | `isActive`          | `1` -> `true`, `0` -> `false`                              |
| `new`                 | `isNew`             | `1` -> `true`, `0` -> `false`                              |
| `top`                 | `isFeatured`        | `1` -> `true`, `0` -> `false`                              |
| `recommended`         | `isBestseller`      | `1` -> `true`, `0` -> `false`                              |
| `meta_tag_sr`         | `seoTitle`          | HTML entity decode                                         |
| `seo_description_sr`  | `seoDescription`    | HTML entity decode                                         |

---

## 6. product_categories -> Update categoryId on products

| Old Column      | Action                                                            |
|-----------------|-------------------------------------------------------------------|
| `product_id`    | Lookup product via products ID map                                |
| `category_id`   | Lookup category via categories ID map                             |

**Strategy:** Many-to-many in old DB becomes many-to-one in new DB.
Use the **first** category found for each product (lowest `id` row).

---

## 7. product_images -> product_images

| Old Column     | New Column    | Transformation                                                     |
|----------------|---------------|--------------------------------------------------------------------|
| `id` (int)     | -- (no map)   | Not referenced by other tables                                     |
| `product_id`   | `productId`   | Lookup via products ID map                                         |
| `filename`     | `url`         | Prefix: `https://www.altamoda.rs/uploads/store/products/`          |
| --             | `altText`     | NULL                                                               |
| --             | `type`        | Default `image`                                                    |
| `main_image`   | `isPrimary`   | `1` -> `true`, `0` -> `false`                                     |
| --             | `sortOrder`   | `isPrimary ? 0 : 1`                                               |

---

## 8. product_options -> product_attributes

The `product_options` table is a join table linking products to feature options.

| Old Column    | New Column    | Transformation                                                    |
|---------------|---------------|-------------------------------------------------------------------|
| `product_id`  | `productId`   | Lookup via products ID map                                        |
| `option_id`   | `attributeId` | Derived: lookup `feature_options[option_id].feature_id` -> dynamic_attributes ID map |
|               | `value`       | The `name_sr` of the matching `feature_option`                    |

The `option_id` maps to `feature_options.id`. From there we get `feature_id` which
maps to the `DynamicAttribute`, and `name_sr` which becomes the `value`.

---

## 9. users -> users + user_addresses + b2b_profiles

### users table

| Old Column         | New Column      | Transformation                                              |
|--------------------|-----------------|-------------------------------------------------------------|
| `id` (int)         | -- (lookup map) | Old int ID mapped to new cuid                               |
| `email`            | `email` (unique)| Direct copy; skip duplicates                                |
| `password` (SHA1)  | `passwordHash`  | Placeholder: `SHA1_NEEDS_REHASH:{original_hash}`            |
| `first_name` + `last_name` | `name` | Concatenation with space                                    |
| `phone`            | `phone`         | Direct copy                                                 |
| `user_type`        | `role`          | `legal_entity` -> `b2b`, else -> `b2c`                     |
| `blocked_user`     | `status`        | `1` -> `suspended`, `0` -> `active`                         |
| `date_registered`  | `createdAt`     | Parse date; use `new Date()` if invalid (e.g., `0000-00-00`)|

### user_addresses table (created per user)

| Old Column       | New Column    | Transformation              |
|------------------|---------------|-----------------------------|
| `address`        | `street`      | Direct copy                 |
| `city`           | `city`        | Direct copy                 |
| `postal_number`  | `postalCode`  | Direct copy                 |
| --               | `label`       | Default `"Glavna adresa"`   |
| --               | `country`     | Default `"Srbija"`          |
| --               | `isDefault`   | `true`                      |

### b2b_profiles table (created for `user_type = 'legal_entity'`)

| Old Column           | New Column    | Transformation               |
|----------------------|---------------|------------------------------|
| `company_name`       | `salonName`   | Direct copy                  |
| `company_pib`        | `pib`         | Direct copy                  |
| `company_reg_number` | `maticniBroj` | Direct copy                  |
| `address`            | `address`     | Direct copy                  |

**Password migration note:**
Old passwords are SHA1 hashes. They cannot be directly converted to bcrypt.
The migration stores them with a `SHA1_NEEDS_REHASH:` prefix. The application
must detect this prefix at login time, verify against SHA1, then re-hash with
bcrypt and update the record.

---

## 10. orders -> orders

| Old Column              | New Column         | Transformation                                         |
|-------------------------|--------------------|---------------------------------------------------------|
| `id` (int)              | -- (lookup map)    | Old int ID mapped to new cuid                          |
| `id`                    | `orderNumber`      | Format: `AM-{old_id.toString().padStart(6, '0')}`     |
| `user_id`               | `userId`           | Lookup via users ID map; **skip order if no match**    |
| `status` (tinyint 1-3)  | `status`           | `1` -> `novi`, `2` -> `u_obradi`, `3` -> `isporuceno` |
| `items_price`           | `subtotal`         | Decimal                                                |
| `shipping_price`        | `shippingCost`     | Decimal                                                |
| `total_price`           | `total`            | Decimal                                                |
| `payment_type`          | `paymentMethod`    | `1` -> `cash_on_delivery`, `2` -> `bank_transfer`, `3` -> `card` |
| `completed`             | `paymentStatus`    | `1` -> `paid`, `0` -> `pending`                        |
| `additional_instructions`| `notes`           | Direct copy                                            |
| `status_1_date`         | `createdAt`        | Parse datetime                                         |
| shipping fields         | `shippingAddress`  | JSON (see below)                                       |

### shippingAddress JSON structure

```json
{
  "name": "{first_name} {last_name}",
  "street": "{address}",
  "city": "{city}",
  "postalCode": "{postal_no}",
  "phone": "{contact_phone}"
}
```

**Note:** Orders with `user_id = NULL` (guest orders) are skipped because the new
schema requires a `userId` foreign key.

---

## 11. order_items -> order_items

| Old Column     | New Column     | Transformation                                              |
|----------------|----------------|-------------------------------------------------------------|
| `id` (int)     | -- (no map)    | Not referenced elsewhere                                    |
| `order_id`     | `orderId`      | Lookup via orders ID map; skip if order was skipped         |
| `product_id`   | `productId`    | Lookup via products ID map                                  |
| --             | `productName`  | Resolved from products data: `nameLat` (or `name_sr`)       |
| --             | `productSku`   | Resolved from products data: `sku` (or `code`)              |
| `amount`       | `quantity`     | Direct copy                                                 |
| `price`        | `unitPrice`    | Decimal                                                     |
| `amount * price`| `totalPrice`  | Computed: `quantity * unitPrice`                             |

---

## 12. newsletter_subscribers -> newsletter_subscribers

| Old Column   | New Column      | Transformation                          |
|--------------|-----------------|-----------------------------------------|
| `id` (int)   | -- (no map)     | Not referenced                          |
| `email`      | `email` (unique)| Direct copy; skip duplicates            |
| --           | `segment`       | Default `b2c`                           |
| --           | `isSubscribed`  | Default `true`                          |
| `date`       | `subscribedAt`  | Parse datetime                          |

---

## 13. wishes -> wishlists

| Old Column    | New Column   | Transformation                                    |
|---------------|--------------|---------------------------------------------------|
| `id` (int)    | -- (no map)  | Not referenced                                    |
| `user` (int)  | `userId`     | Lookup via users ID map; skip if no match         |
| `product` (int)| `productId` | Lookup via products ID map; skip if no match      |
| --            | `createdAt`  | Default `new Date()`                              |

**Note:** The `@@unique([userId, productId])` constraint means duplicates are skipped.

---

## ID Mapping Strategy

All old integer IDs are mapped to new cuid strings via in-memory `Map<number, string>`
objects. These maps are populated during insertion and used to resolve foreign keys
in dependent tables.

| Map Name            | Old Table          | Key (old int) | Value (new cuid) |
|---------------------|--------------------|---------------|------------------|
| `brandIdMap`        | brands             | brands.id     | Brand.id         |
| `categoryIdMap`     | categories         | categories.id | Category.id      |
| `attributeIdMap`    | features           | features.id   | DynamicAttribute.id |
| `optionIdMap`       | feature_options    | feature_options.id | DynamicAttributeOption.id |
| `productIdMap`      | products           | products.id   | Product.id       |
| `userIdMap`         | users              | users.id      | User.id          |
| `orderIdMap`        | orders             | orders.id     | Order.id         |

---

## Edge Cases

1. **Duplicate slugs:** Append `-2`, `-3`, etc. until unique.
2. **Duplicate emails:** Skip the second occurrence (users and newsletter).
3. **NULL user_id on orders:** Skip the order entirely (new schema requires userId).
4. **Invalid dates (`0000-00-00`):** Replace with `new Date('2015-01-01')` as a fallback.
5. **Empty SKU/code:** Generate `OLD-{product_id}`.
6. **SHA1 passwords:** Prefix with `SHA1_NEEDS_REHASH:` for app-level handling.
7. **product_options with missing product or option:** Skip silently.
8. **HTML entities in text fields:** Decoded using `he` library.
