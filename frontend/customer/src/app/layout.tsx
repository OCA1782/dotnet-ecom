import type { Metadata } from "next";
import { Geist, Pacifico } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SparePartsBrandNav, { type NavBrand } from "@/components/templates/SparePartsBrandNav";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";
import ChatWidget from "@/components/ChatWidget";
import LocationPermissionBanner from "@/components/LocationPermissionBanner";
import ThemeProvider from "@/components/ThemeProvider";
import CompareBar from "@/components/CompareBar";
import GoogleProvider from "@/components/GoogleProvider";
import { CompareProvider } from "@/contexts/CompareContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { getSettings } from "@/lib/settings";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const pacifico = Pacifico({ subsets: ["latin"], weight: "400", variable: "--font-pacifico" });

async function getVehicleNavBrands(): Promise<NavBrand[]> {
  try {
    const data = await api.get<{ id: string; name: string; slug: string; showInVehicleNav: boolean; subCategories: { id: string; name: string; imageUrl?: string }[] }[]>(
      "/api/categories?onlyActive=true&showInVehicleNav=true"
    );
    return data.filter(c => c.showInVehicleNav).map(c => ({
      key: c.slug, label: c.name, id: c.id,
      models: c.subCategories.map(s => ({ name: s.name, id: s.id, imageUrl: s.imageUrl })),
    }));
  } catch { return []; }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteName = settings.SiteName || "";
  const rawFavicon = settings.CustomerFaviconUrl || settings.FaviconUrl || "/logo-icon.svg";
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

const VALID_TEMPLATES = ["modern", "minimal", "bold", "dark", "showcase", "luxe", "sport", "retro", "instagram", "masonry", "brutalist", "glassmorphism", "neon", "pastel", "catalog", "atolye", "anadolu", "cini", "automotive", "telecom", "manufacturing", "education", "legal", "healthcare", "spareparts", "marketplace", "techstore"] as const;
type TemplateName = typeof VALID_TEMPLATES[number];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, vehicleNavBrands] = await Promise.all([getSettings(), getVehicleNavBrands()]);

  // Template kalıcılığı: API başarısızsa env var, o da yoksa son template
  const envFallback = process.env.NEXT_PUBLIC_FALLBACK_TEMPLATE ?? "modern";
  const rawTemplate = settings.CustomerTemplate ?? envFallback;
  const template: TemplateName = (VALID_TEMPLATES as readonly string[]).includes(rawTemplate)
    ? rawTemplate as TemplateName
    : envFallback as TemplateName;

  const languageSwitcherEnabled = settings.CustomerLanguageSwitcherEnabled !== "false";
  const isMaintenanceMode = settings.MaintenanceMode === "true";
  const maintenanceMsg = settings.Msg_MaintenanceMode || "Site bakım çalışması yapılıyor. Lütfen daha sonra tekrar deneyin.";
  const siteName = settings.SiteName || "Mağaza";

  if (isMaintenanceMode) {
    return (
      <html lang="tr" className={`${geist.variable} h-full antialiased`}>
        <body className="min-h-full flex items-center justify-center bg-slate-50">
          <div className="max-w-md w-full mx-4 text-center">
            <div className="text-5xl mb-6">🔧</div>
            <h1 className="text-2xl font-bold text-slate-800 mb-3">{siteName}</h1>
            <p className="text-slate-600 mb-8 leading-relaxed">{maintenanceMsg}</p>
            <div className="text-xs text-slate-400">Bakım Modu Aktif</div>
          </div>
        </body>
      </html>
    );
  }

  const HOT_PARTS = (settings.Spareparts_HotParts?.trim()
    ? settings.Spareparts_HotParts.split(",").map((s: string) => s.trim()).filter(Boolean)
    : ["Fren Diski","Motor Yağı","Hava Filtresi","Akü","Buji Seti","Amortisör","Debriyaj","Radyatör"]
  ).map((label: string) => ({ label, href: `/urunler?s=${encodeURIComponent(label)}` }));

  return (
    <html lang="tr" className={`${geist.variable} ${pacifico.variable} h-full antialiased`} data-template={template}>
      <body className="min-h-full flex flex-col">
        <GoogleProvider>
        <I18nProvider>
        <CompareProvider>
          {/* Spareparts şablonunda Header + araç nav şeridi birlikte sabitlenir */}
          <div className={template === "spareparts" ? "sticky top-0 z-50" : undefined}>
            <Header
              logoUrl={settings.CustomerLogoNamed || settings.CustomerLogoIcon || undefined}
              siteName={siteName}
              languageSwitcherEnabled={languageSwitcherEnabled}
            />
            {template === "spareparts" && (
              <>
                <SparePartsBrandNav initialBrands={vehicleNavBrands} />
                <div className="bg-[#fff7ed] border-b border-orange-100">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-widest shrink-0">EN ÇOK ARANAN</span>
                      {HOT_PARTS.map((p: { label: string; href: string }) => (
                        <Link key={p.label} href={p.href}
                          className="text-[11px] font-semibold text-gray-700 hover:text-orange-600 hover:underline transition-colors">
                          {p.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <main className="flex-1">{children}</main>
          <Footer />
          <ChatWidget />
          <LocationPermissionBanner />
          <ThemeProvider />
          <CompareBar />
        </CompareProvider>
        </I18nProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}
