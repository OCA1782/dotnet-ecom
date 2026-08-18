import type { Metadata } from "next";
import { Geist, Pacifico } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SparePartsBrandNav from "@/components/templates/SparePartsBrandNav";

export const revalidate = 30;
import ChatWidget from "@/components/ChatWidget";
import LocationPermissionBanner from "@/components/LocationPermissionBanner";
import VisitorTracker from "@/components/VisitorTracker";
import ThemeProvider from "@/components/ThemeProvider";
import CompareBar from "@/components/CompareBar";
import GoogleProvider from "@/components/GoogleProvider";
import { CompareProvider } from "@/contexts/CompareContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { getSettings } from "@/lib/settings";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const pacifico = Pacifico({ subsets: ["latin"], weight: "400", variable: "--font-pacifico" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteName = settings.SiteName || "";
  const rawFavicon = settings.CustomerFaviconUrl || settings.FaviconUrl || process.env.CUSTOMER_FALLBACK_FAVICON_URL || "https://images.autoforcepart.com/static/autoforcepart-logo-no-text.png";
  const version = settings.SettingsVersion ?? "";
  const faviconUrl = version ? `${rawFavicon}?v=${version}` : rawFavicon;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${siteName} — Güçlü Parçalar, Yüksek Performans`,
      template: `%s | ${siteName}`,
    },
    description: "Güçlü parçalar, yüksek performans. Binlerce yedek parça, güvenli ödeme, hızlı teslimat.",
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
    verification: {
      google: "F0gzIIjHOSHeDCwZB1YUiQOeEzO7iaOn-zbX9KQFEbA",
    },
  };
}

const VALID_TEMPLATES = ["modern", "minimal", "bold", "dark", "showcase", "luxe", "sport", "retro", "instagram", "masonry", "brutalist", "glassmorphism", "neon", "pastel", "catalog", "atolye", "anadolu", "cini", "automotive", "telecom", "manufacturing", "education", "legal", "healthcare", "spareparts", "marketplace", "techstore"] as const;
type TemplateName = typeof VALID_TEMPLATES[number];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

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

  const contactEmail = settings.ContactEmail ?? "";
  const contactPhone = settings.ContactPhone ?? "";
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: SITE_URL,
    logo: settings.CustomerLogoNamed || settings.CustomerLogoIcon || process.env.CUSTOMER_FALLBACK_LOGO_NAMED || undefined,
    ...(contactEmail ? { email: contactEmail } : {}),
    ...(contactPhone ? { telephone: contactPhone } : {}),
    ...(settings.SocialInstagram || settings.SocialTwitter || settings.SocialYoutube || settings.SocialLinkedin
      ? { sameAs: [settings.SocialInstagram, settings.SocialTwitter, settings.SocialYoutube, settings.SocialLinkedin].filter(Boolean) }
      : {}),
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/urunler?s={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="tr" className={`${geist.variable} ${pacifico.variable} h-full antialiased`} data-template={template}>
      <body className="min-h-full flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <GoogleProvider>
        <I18nProvider>
        <CompareProvider>
          {/* Spareparts şablonunda Header + araç nav şeridi birlikte sabitlenir */}
          <div className={template === "spareparts" ? "sticky top-0 z-50" : undefined}>
            <Header
              logoNamed={settings.CustomerLogoNamed || process.env.CUSTOMER_FALLBACK_LOGO_NAMED || "https://images.autoforcepart.com/static/autoforcepart-logo-with-text.png"}
              logoIcon={settings.CustomerLogoIcon || process.env.CUSTOMER_FALLBACK_LOGO_ICON || "https://images.autoforcepart.com/static/autoforcepart-logo-no-text.png"}
              siteName={siteName}
              languageSwitcherEnabled={languageSwitcherEnabled}
            />
            {template === "spareparts" && (
              <>
                <SparePartsBrandNav initialBrands={[]} />
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
          <VisitorTracker />
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
