import type { Metadata } from "next";
import { Geist, Pacifico } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const dynamic = "force-dynamic";
import ChatWidget from "@/components/ChatWidget";
import LocationPermissionBanner from "@/components/LocationPermissionBanner";
import ThemeProvider from "@/components/ThemeProvider";
import CompareBar from "@/components/CompareBar";
import GoogleProvider from "@/components/GoogleProvider";
import { CompareProvider } from "@/contexts/CompareContext";
import { getSettings } from "@/lib/settings";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const pacifico = Pacifico({ subsets: ["latin"], weight: "400", variable: "--font-pacifico" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteName = settings.SiteName || "Keyvora";
  const rawFavicon = settings.CustomerFaviconUrl || settings.FaviconUrl || "/logo-icon.png";
  const version = settings.SettingsVersion ?? "";
  const faviconUrl = version ? `${rawFavicon}?v=${version}` : rawFavicon;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${siteName} — Keyifli Alışverişin Yeni Adresi`,
      template: `%s | ${siteName}`,
    },
    description: "Keyifli alışverişin yeni adresi. Binlerce ürün, hızlı teslimat, güvenli ödeme.",
    icons: {
      icon: [{ url: faviconUrl, type: "image/png" }],
      apple: faviconUrl,
    },
    openGraph: {
      siteName: siteName,
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
}

const VALID_TEMPLATES = ["modern", "minimal", "bold", "dark", "showcase", "luxe", "sport", "retro", "instagram", "masonry", "brutalist", "glassmorphism", "neon", "pastel", "catalog", "atolye", "anadolu", "cini"] as const;
type TemplateName = typeof VALID_TEMPLATES[number];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const rawTemplate = settings.CustomerTemplate ?? "modern";
  const template: TemplateName = (VALID_TEMPLATES as readonly string[]).includes(rawTemplate)
    ? rawTemplate as TemplateName
    : "modern";

  return (
    <html lang="tr" className={`${geist.variable} ${pacifico.variable} h-full antialiased`} data-template={template}>
      <body className="min-h-full flex flex-col">
        <GoogleProvider>
        <CompareProvider>
          <Header
            logoUrl={settings.CustomerLogoNamed || settings.CustomerLogoIcon || undefined}
            siteName={settings.SiteName || undefined}
          />
          <main className="flex-1">{children}</main>
          <Footer />
          <ChatWidget />
          <LocationPermissionBanner />
          <ThemeProvider />
          <CompareBar />
        </CompareProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}
