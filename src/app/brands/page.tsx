export const revalidate = 300

import { prisma } from "@/lib/db";
import { Metadata } from "next";
import BrandsListClient from "./BrandsListClient";

export const metadata: Metadata = {
  title: "Brendovi | Alta Moda",
  description: "Istražite sve brendove profesionalne kozmetike za kosu u ponudi Alta Moda.",
};

export default async function BrandsPage() {
  const [brands, rawCounts, dupGroups] = await Promise.all([
    prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, logoUrl: true, description: true },
      orderBy: { name: "asc" },
    }),
    // Total active products per brand (B2C + B2B — guests can browse the
    // "All products" / "Business" tabs on /products without logging in, they
    // just can't see B2B prices there without a B2B account).
    prisma.product.groupBy({ by: ["brandId"], where: { isActive: true }, _count: true }),
    // Color-variant shades share a `groupSlug` and are shown as a single card
    // (see /products' SSR), so — like the sitewide "Svi Proizvodi (N)" count —
    // each group must count once, not once per shade.
    prisma.product.groupBy({
      by: ["brandId", "groupSlug"],
      where: { isActive: true, groupSlug: { not: null } },
      _count: true,
    }),
  ]);

  const duplicatesByBrand = new Map<string, number>();
  for (const g of dupGroups) {
    if (!g.brandId) continue;
    duplicatesByBrand.set(g.brandId, (duplicatesByBrand.get(g.brandId) ?? 0) + (g._count - 1));
  }
  const countByBrand = new Map<string, number>();
  for (const c of rawCounts) {
    if (!c.brandId) continue;
    countByBrand.set(c.brandId, c._count - (duplicatesByBrand.get(c.brandId) ?? 0));
  }

  const brandsWithCounts = brands.map((b) => ({
    ...b,
    _count: { products: countByBrand.get(b.id) ?? 0 },
  }));

  return <BrandsListClient brands={brandsWithCounts} />;
}
