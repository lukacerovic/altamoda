-- AlterTable
ALTER TABLE "b2b_profiles" ADD COLUMN     "erp_subject_id" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "vat_code" TEXT,
ADD COLUMN     "vat_rate" INTEGER NOT NULL DEFAULT 20;

-- CreateTable
CREATE TABLE "erp_sync_queue" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "direction" "SyncDirection" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "last_error" TEXT,
    "next_retry_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "erp_sync_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "erp_sync_queue_status_next_retry_at_idx" ON "erp_sync_queue"("status", "next_retry_at");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_profiles_erp_subject_id_key" ON "b2b_profiles"("erp_subject_id");
