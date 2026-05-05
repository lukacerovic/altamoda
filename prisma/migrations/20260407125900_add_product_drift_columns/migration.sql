-- Adds product columns that were introduced via `prisma db push` during development
-- but never captured in a migration. Required before the performance-indexes migration,
-- which references "group_slug". IF NOT EXISTS keeps this idempotent on databases that
-- may already have the columns from earlier ad-hoc pushes.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "purpose" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "warnings" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "shelf_life" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "importer_info" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "group_slug" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "color_code" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "color_name" TEXT;
