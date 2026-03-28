import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'O Nama',
  description: 'Alta Moda — distributer profesionalne frizerske opreme i kozmetike u Srbiji. Saznajte više o našem timu, misiji i brendovima.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.altamoda.rs'}/about`,
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
