import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Outlet — Sniženi Proizvodi',
  description: 'Profesionalni proizvodi za kosu po sniženim cenama. Outlet ponuda Alta Moda — šamponi, maske, boje i styling po akcijskim cenama.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.altamoda.rs'}/outlet`,
  },
}

export default function OutletLayout({ children }: { children: React.ReactNode }) {
  return children
}
