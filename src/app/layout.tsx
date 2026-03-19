import type { Metadata } from "next";
import AuthProvider from "@/components/providers/AuthProvider";
import CartProvider from "@/components/providers/CartProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alta Moda | Profesionalna frizerska oprema i kozmetika",
  description:
    "Premium frizerska oprema, boje za kosu, nega i styling proizvodi vodećih svetskih brendova. B2B i B2C web shop za salone i krajnje kupce.",
  keywords:
    "frizerska oprema, boje za kosu, profesionalna kozmetika, salon oprema, L'Oréal, Schwarzkopf, Wella, Kérastase",
  openGraph: {
    title: "Alta Moda | Profesionalna frizerska oprema i kozmetika",
    description:
      "Premium frizerska oprema, boje za kosu, nega i styling proizvodi vodećih svetskih brendova.",
    type: "website",
    locale: "sr_RS",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr">
      <body className="antialiased" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
