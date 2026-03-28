import type { Metadata } from "next";
import AuthProvider from "@/components/providers/AuthProvider";
import CartProvider from "@/components/providers/CartProvider";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.altamoda.rs";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Alta Moda | Profesionalna frizerska oprema i kozmetika",
    template: "%s | Alta Moda",
  },
  description:
    "Premium frizerska oprema, boje za kosu, nega i styling proizvodi vodećih svetskih brendova. B2B i B2C web shop za salone i krajnje kupce.",
  keywords:
    "frizerska oprema, boje za kosu, profesionalna kozmetika, salon oprema, L'Oréal, Schwarzkopf, Wella, Kérastase, Alta Moda, Srbija",
  openGraph: {
    title: "Alta Moda | Profesionalna frizerska oprema i kozmetika",
    description:
      "Premium frizerska oprema, boje za kosu, nega i styling proizvodi vodećih svetskih brendova.",
    type: "website",
    locale: "sr_RS",
    siteName: "Alta Moda",
    url: BASE_URL,
  },
  alternates: {
    canonical: BASE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr">
      <body className="bg-surface font-body text-on-surface antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Alta Moda",
              url: BASE_URL,
              logo: `${BASE_URL}/logo.png`,
              description: "Profesionalna frizerska oprema i kozmetika — distributer vodećih svetskih brendova za salone i krajnje kupce u Srbiji.",
              address: {
                "@type": "PostalAddress",
                addressCountry: "RS",
              },
              sameAs: [],
            }),
          }}
        />
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
