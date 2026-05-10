import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

const SITE_NAME = "Keyvora";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Keyifli Alışverişin Yeni Adresi`,
    template: `%s | ${SITE_NAME}`,
  },
  description: "Keyifli alışverişin yeni adresi. Binlerce ürün, hızlı teslimat, güvenli ödeme.",
  icons: {
    icon: [{ url: "/logo-icon.png", type: "image/png" }],
    apple: "/logo-icon.png",
  },
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F7FAFA]">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
