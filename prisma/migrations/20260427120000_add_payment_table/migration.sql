-- Add payments table — Monri PSP integration scaffolding (one row per payment attempt)

CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_payment_id" TEXT,
    "provider_order_number" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "raw_request" JSONB,
    "raw_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");
CREATE INDEX "payments_provider_payment_id_idx" ON "payments"("provider_payment_id");
CREATE INDEX "payments_provider_order_number_idx" ON "payments"("provider_order_number");

ALTER TABLE "payments"
    ADD CONSTRAINT "payments_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
