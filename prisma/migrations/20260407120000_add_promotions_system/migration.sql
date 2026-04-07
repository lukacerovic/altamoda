-- AlterEnum: Add 'price' to PromoType
ALTER TYPE "PromoType" ADD VALUE IF NOT EXISTS 'price';

-- AlterTable: Add badge column and make dates nullable
ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "badge" TEXT;
ALTER TABLE "promotions" ALTER COLUMN "start_date" DROP NOT NULL;
ALTER TABLE "promotions" ALTER COLUMN "end_date" DROP NOT NULL;

-- CreateTable: promotion_products join table
CREATE TABLE IF NOT EXISTS "promotion_products" (
    "id" TEXT NOT NULL,
    "promotion_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,

    CONSTRAINT "promotion_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "promotion_products_promotion_id_product_id_key" ON "promotion_products"("promotion_id", "product_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "promotion_products_product_id_idx" ON "promotion_products"("product_id");

-- AddForeignKey
ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
