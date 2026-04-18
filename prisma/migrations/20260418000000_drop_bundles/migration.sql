-- DropForeignKey
ALTER TABLE "bundle_items" DROP CONSTRAINT "bundle_items_bundle_id_fkey";

-- DropForeignKey
ALTER TABLE "bundle_items" DROP CONSTRAINT "bundle_items_product_id_fkey";

-- DropTable
DROP TABLE "bundle_items";

-- DropTable
DROP TABLE "bundles";
