-- CreateIndex: products table
CREATE INDEX IF NOT EXISTS "products_is_active_is_professional_idx" ON "products"("is_active", "is_professional");
CREATE INDEX IF NOT EXISTS "products_is_active_is_featured_idx" ON "products"("is_active", "is_featured");
CREATE INDEX IF NOT EXISTS "products_is_active_is_bestseller_idx" ON "products"("is_active", "is_bestseller");
CREATE INDEX IF NOT EXISTS "products_is_active_is_new_idx" ON "products"("is_active", "is_new");
CREATE INDEX IF NOT EXISTS "products_category_id_idx" ON "products"("category_id");
CREATE INDEX IF NOT EXISTS "products_brand_id_idx" ON "products"("brand_id");
CREATE INDEX IF NOT EXISTS "products_group_slug_idx" ON "products"("group_slug");
CREATE INDEX IF NOT EXISTS "products_is_active_created_at_idx" ON "products"("is_active", "created_at");
CREATE INDEX IF NOT EXISTS "products_is_active_price_b2c_idx" ON "products"("is_active", "price_b2c");

-- CreateIndex: product_images table
CREATE INDEX IF NOT EXISTS "product_images_product_id_is_primary_idx" ON "product_images"("product_id", "is_primary");

-- CreateIndex: color_products table
CREATE INDEX IF NOT EXISTS "color_products_color_level_idx" ON "color_products"("color_level");
CREATE INDEX IF NOT EXISTS "color_products_undertone_code_idx" ON "color_products"("undertone_code");

-- CreateIndex: wishlists table
CREATE INDEX IF NOT EXISTS "wishlists_user_id_idx" ON "wishlists"("user_id");

-- CreateIndex: reviews table
CREATE INDEX IF NOT EXISTS "reviews_product_id_idx" ON "reviews"("product_id");

-- CreateIndex: erp_sync_queue table
CREATE INDEX IF NOT EXISTS "erp_sync_queue_status_next_retry_at_idx" ON "erp_sync_queue"("status", "next_retry_at");
