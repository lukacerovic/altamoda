-- AlterEnum
ALTER TYPE "NewsletterSegment" ADD VALUE 'all';

-- DropIndex
DROP INDEX "brands_name_trgm_idx";

-- DropIndex
DROP INDEX "products_name_lat_trgm_idx";

-- DropIndex
DROP INDEX "products_sku_trgm_idx";

-- AlterTable
ALTER TABLE "b2b_profiles" ALTER COLUMN "pib" DROP NOT NULL,
ALTER COLUMN "maticni_broj" DROP NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "vpos_auth_number" TEXT,
ADD COLUMN     "vpos_result_code" TEXT,
ADD COLUMN     "vpos_transaction_id" TEXT;

-- CreateTable
CREATE TABLE "payment_attempts" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "result_code" TEXT,
    "transaction_id" TEXT,
    "auth_number" TEXT,
    "source" TEXT NOT NULL DEFAULT 'urlms',
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_attempts_order_id_idx" ON "payment_attempts"("order_id");

-- AddForeignKey
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
