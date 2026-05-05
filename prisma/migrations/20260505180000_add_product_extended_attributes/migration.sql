-- AlterTable: extend products table with attributes from the
-- "AMS sajt 2026. baza B2C i B2B, finalni uzorak.xlsx" import sheet.
-- POTKATEGORIJA → subcategory
-- TIP PROIZVODA → product_type   (e.g. "Teksturni sprej", "Šampon")
-- TIP KOSE      → hair_types     (comma-separated, e.g. "Svi tipovi kose, Tanka kosa")
-- FUNKCIJA/TAGOVI → tags         (comma-separated, e.g. "volumen, tekstura, kontrola")

ALTER TABLE "products"
  ADD COLUMN "subcategory" TEXT,
  ADD COLUMN "product_type" TEXT,
  ADD COLUMN "hair_types" TEXT,
  ADD COLUMN "tags" TEXT;
