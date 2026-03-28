import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Česta Pitanja (FAQ)',
  description: 'Odgovori na najčešća pitanja o naručivanju, isporuci, plaćanju i B2B saradnji sa Alta Moda.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.altamoda.rs'}/faq`,
  },
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children
}
