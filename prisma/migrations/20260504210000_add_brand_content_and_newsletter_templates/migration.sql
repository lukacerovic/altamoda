-- Captures more schema drift (brands.content, newsletter_templates table,
-- newsletter_campaigns.template_id FK) that was introduced via prisma db
-- push and never recorded as a migration. IF NOT EXISTS keeps it safe to
-- re-apply on databases that may already have the changes.

ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "content" TEXT;

CREATE TABLE IF NOT EXISTS "newsletter_templates" (
  "id"           TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "description"  TEXT,
  "subject"      TEXT NOT NULL,
  "html_content" TEXT NOT NULL,
  "thumbnail"    TEXT,
  "is_default"   BOOLEAN NOT NULL DEFAULT false,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "newsletter_templates_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "newsletter_campaigns" ADD COLUMN IF NOT EXISTS "template_id" TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_campaigns_template_id_fkey'
  ) THEN
    ALTER TABLE "newsletter_campaigns"
      ADD CONSTRAINT "newsletter_campaigns_template_id_fkey"
      FOREIGN KEY ("template_id") REFERENCES "newsletter_templates"("id")
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;
