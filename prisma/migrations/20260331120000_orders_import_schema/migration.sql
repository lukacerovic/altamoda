-- AlterTable: Add erp_id to users
ALTER TABLE "users" ADD COLUMN "erp_id" TEXT;

-- CreateIndex: Unique constraint on users.erp_id
CREATE UNIQUE INDEX "users_erp_id_key" ON "users"("erp_id");

-- CreateIndex: Unique constraint on orders.erp_id
CREATE UNIQUE INDEX "orders_erp_id_key" ON "orders"("erp_id");

-- AlterTable: Make b2b_profiles.pib optional
ALTER TABLE "b2b_profiles" ALTER COLUMN "pib" DROP NOT NULL;

-- AlterTable: Make b2b_profiles.maticni_broj optional
ALTER TABLE "b2b_profiles" ALTER COLUMN "maticni_broj" DROP NOT NULL;
