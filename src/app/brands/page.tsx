export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/db";
import { Metadata } from "next";
import BrandsListClient from "./BrandsListClient";

export const metadata: Metadata = {
  title: "Brendovi | Alta Moda",
  description: "Istražite sve brendove profesionalne kozmetike za kosu u ponudi Alta Moda.",
};

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      description: true,
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  });

  return <BrandsListClient brands={brands} />;
}
