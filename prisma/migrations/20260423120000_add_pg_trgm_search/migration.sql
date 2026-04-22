-- Enable trigram extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram indexes accelerate both similarity() scoring and ILIKE '%x%' substring matches
CREATE INDEX IF NOT EXISTS "products_name_lat_trgm_idx" ON "products" USING GIN ("name_lat" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "products_sku_trgm_idx" ON "products" USING GIN ("sku" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "brands_name_trgm_idx" ON "brands" USING GIN ("name" gin_trgm_ops);
