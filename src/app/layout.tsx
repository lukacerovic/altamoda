import type { Metadata } from "next";
import { Inter, Noto_Serif } from "next/font/google";
import AuthProvider from "@/components/providers/AuthProvider";
import CartProvider from "@/components/providers/CartProvider";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-noto-serif",
  display: "swap",
});

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
      <body className={`${inter.variable} ${notoSerif.variable} bg-surface font-body text-on-surface antialiased`}>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
