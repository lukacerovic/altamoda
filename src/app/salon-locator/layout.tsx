import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pronađi Salon',
  description: 'Pronađite profesionalne frizerske salone u Srbiji koji koriste Alta Moda proizvode.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.altamoda.rs'}/salon-locator`,
  },
}

export default function SalonLocatorLayout({ children }: { children: React.ReactNode }) {
  return children
}
