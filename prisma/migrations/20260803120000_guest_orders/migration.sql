-- Guest checkout: orders may exist without a user account.
ALTER TABLE "orders" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "orders" ADD COLUMN "guest_name" TEXT;
ALTER TABLE "orders" ADD COLUMN "guest_email" TEXT;
ALTER TABLE "orders" ADD COLUMN "guest_phone" TEXT;
