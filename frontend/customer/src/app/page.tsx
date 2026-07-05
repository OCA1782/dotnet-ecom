import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import type { Category, ProductListItem, PaginatedList, Campaign } from "@/types";
import ProductCard from "@/components/ProductCard";
import { type AnnouncementItem } from "@/components/AnnouncementsSection";
import HeroSlider from "@/components/HeroSlider";
import { getSettings } from "@/lib/settings";
import SparePartsVehicleSelector from "@/components/templates/SparePartsVehicleSelector";
import SparePartsBrandNav, { type NavBrand } from "@/components/templates/SparePartsBrandNav";
import { getServerLang } from "@/lib/server-i18n";
import { t as translate } from "@/lib/i18n";

function parseTrustItem(str: string | undefined, fallback: { abbr: string; title: string; desc: string }) {
  if (!str?.trim()) return fallback;
  const p = str.split("|");
  return { abbr: p[0]?.trim() || fallback.abbr, title: p[1]?.trim() || fallback.title, desc: p[2]?.trim() || fallback.desc };
}
function parseList(str: string | undefined, fallback: string[]): string[] {
  if (!str?.trim()) return fallback;
  return str.split(",").map(s => s.trim()).filter(Boolean);
}

export async function generateMetadata(): Promise<Metadata> {
  const [settings, lang] = await Promise.all([getSettings(), getServerLang()]);
  const siteName = settings.SiteName || "";
  const t = (key: string) => translate(lang, key);
  return {
    title: t("home2.meta.title"),
    description: t("home2.meta.desc"),
    openGraph: {
      title: siteName ? `${siteName} — ${t("home2.meta.og.title")}` : t("home2.meta.og.title"),
      description: t("home2.meta.og.desc"),
      type: "website",
    },
  };
}

const CATEGORY_STYLES = [
  { card: "bg-teal-50   border-teal-100   hover:border-teal-300",   icon: "bg-teal-100   text-teal-600",   text: "group-hover:text-teal-700"   },
  { card: "bg-orange-50 border-orange-100 hover:border-orange-300", icon: "bg-orange-100 text-orange-600", text: "group-hover:text-orange-700" },
  { card: "bg-sky-50    border-sky-100    hover:border-sky-300",    icon: "bg-sky-100    text-sky-600",    text: "group-hover:text-sky-700"    },
  { card: "bg-emerald-50 border-emerald-100 hover:border-emerald-300", icon: "bg-emerald-100 text-emerald-600", text: "group-hover:text-emerald-700" },
  { card: "bg-amber-50  border-amber-100  hover:border-amber-300",  icon: "bg-amber-100  text-amber-600",  text: "group-hover:text-amber-700"  },
  { card: "bg-violet-50 border-violet-100 hover:border-violet-300", icon: "bg-violet-100 text-violet-600", text: "group-hover:text-violet-700" },
  { card: "bg-cyan-50   border-cyan-100   hover:border-cyan-300",   icon: "bg-cyan-100   text-cyan-600",   text: "group-hover:text-cyan-700"   },
  { card: "bg-lime-50   border-lime-100   hover:border-lime-300",   icon: "bg-lime-100   text-lime-700",   text: "group-hover:text-lime-700"   },
];

const FALLBACK_CATEGORIES: Category[] = [
  { id: "f1", name: "Elektronik", slug: "elektronik" } as Category,
  { id: "f2", name: "Moda", slug: "moda" } as Category,
  { id: "f3", name: "Ev & Yaşam", slug: "ev-yasam" } as Category,
  { id: "f4", name: "Kozmetik", slug: "kozmetik" } as Category,
  { id: "f5", name: "Anne & Çocuk", slug: "anne-cocuk" } as Category,
  { id: "f6", name: "Spor & Outdoor", slug: "spor-outdoor" } as Category,
];

async function getCategories(): Promise<Category[]> {
  try { return await api.get<Category[]>("/api/categories"); }
  catch { return []; }
}

async function getFeaturedProducts(): Promise<ProductListItem[]> {
  try {
    const data = await api.get<PaginatedList<ProductListItem>>("/api/products?page=1&pageSize=8&featured=true");
    return data.items;
  } catch { return []; }
}

async function getDiscountProducts(): Promise<ProductListItem[]> {
  try {
    const data = await api.get<PaginatedList<ProductListItem>>("/api/products?page=1&pageSize=4&onSale=true");
    return data.items;
  } catch { return []; }
}

async function getAnnouncements(): Promise<AnnouncementItem[]> {
  try {
    const data = await api.get<{ items: AnnouncementItem[] }>("/api/announcements?pageSize=20");
    return data.items;
  } catch { return []; }
}

async function getFeaturedCampaigns(): Promise<Campaign[]> {
  try { return await api.get<Campaign[]>("/api/campaigns?featured=true"); }
  catch { return []; }
}


const SCHEME_GRADIENT: Record<string, string> = {
  orange: "from-[#FF7A45] to-[#d95f28]",
  teal:   "from-[#19B7B1] to-[#0c8f8a]",
  navy:   "from-[#12304A] to-[#1a4670]",
  amber:  "from-amber-400 to-orange-500",
  purple: "from-purple-500 to-violet-700",
  green:  "from-emerald-500 to-teal-600",
  rose:   "from-rose-500 to-pink-600",
  sky:    "from-sky-400 to-blue-600",
};

const FALLBACK_CAMPAIGNS: Campaign[] = [
  { id: "f1", title: "%40'a Varan İndirim", subtitle: "Fırsatı Kaçırma", icon: "%", colorScheme: "orange", imageUrl: null, stylesJson: null, linkUrl: "/urunler?indirimli=true", linkText: "İncele →", displayOrder: 0, isActive: true, isFeatured: true },
  { id: "f2", title: "Ücretsiz Kargo", subtitle: "500 TL Üzeri", icon: "∞", colorScheme: "teal", imageUrl: null, stylesJson: null, linkUrl: "/urunler?minFiyat=500", linkText: "Alışverişe Başla →", displayOrder: 1, isActive: true, isFeatured: true },
  { id: "f3", title: "Yeni Sezon Ürünleri", subtitle: "Yeni Gelenler", icon: "★", colorScheme: "navy", imageUrl: null, stylesJson: null, linkUrl: "/urunler?siralama=yeni", linkText: "Keşfet →", displayOrder: 2, isActive: true, isFeatured: true },
  { id: "f4", title: "Çok Satanlar", subtitle: "En Çok Tercih Edilen", icon: "#1", colorScheme: "amber", imageUrl: null, stylesJson: null, linkUrl: "/urunler?siralama=cok-satan", linkText: "Hepsini Gör →", displayOrder: 3, isActive: true, isFeatured: true },
];

async function getVehicleNavBrands(): Promise<NavBrand[]> {
  try {
    const data = await api.get<{ id: string; name: string; slug: string; imageUrl?: string; showInVehicleNav: boolean; subCategories: { id: string; name: string; imageUrl?: string }[] }[]>(
      "/api/categories?onlyActive=true&showInVehicleNav=true"
    );
    const roots = data.filter(c => c.showInVehicleNav);
    return roots.map(c => ({
      key: c.slug, label: c.name, id: c.id,
      models: c.subCategories.map(s => ({ name: s.name, id: s.id, imageUrl: s.imageUrl })),
    }));
  } catch { return []; }
}

export default async function HomePage() {
  const [categoriesRaw, products, discountProducts, announcements, campaignsRaw, settings, lang, vehicleNavBrands] = await Promise.all([
    getCategories(), getFeaturedProducts(), getDiscountProducts(), getAnnouncements(), getFeaturedCampaigns(), getSettings(), getServerLang(), getVehicleNavBrands(),
  ]);
  const t = (key: string) => translate(lang, key);
  const categories = categoriesRaw.length > 0 ? categoriesRaw : FALLBACK_CATEGORIES;
  const campaigns = campaignsRaw.length > 0 ? campaignsRaw : FALLBACK_CAMPAIGNS;
  const template = settings.CustomerTemplate ?? "modern";

  /* ══════════════════════════════════════════════════════
     SPAREPARTS — Yedek Parça / Oto tarzı modern
     B2B bar → marka pill nav → "En Çok Aranan" şeridi
     → sidebar + sağ içerik → güvenilir marka şeridi
     (AutoDoc / OtoKadro / TecDoc benchmark)
  ══════════════════════════════════════════════════════ */
  if (template === "spareparts") {
    const siteName = settings.SiteName || "Yedek Parça";
    const b2bText   = settings.Spareparts_B2BText     || "Servis ve bayi hesabı açın — özel fiyatlar, hızlı sipariş ve öncelikli destek";
    const phone     = settings.Spareparts_Phone        || "0850 XXX XX XX";
    const heroCount = settings.Spareparts_HeroCount    || "700+";
    const heroCountUnit = settings.Spareparts_HeroCountUnit || "BİN ÜRÜN";
    const heroSlogan = settings.Spareparts_HeroSlogan  || "TÜRKİYE'NİN EN BÜYÜK OTO PARÇA MAĞAZASI";
    const promo1Title   = settings.Spareparts_Promo1Title   || "Filtre & Yağ Seti";
    const promo1Desc    = settings.Spareparts_Promo1Desc    || "Aracınıza uygun orijinal filtre setleri";
    const promo2Discount = settings.Spareparts_Promo2Discount || "%40'a varan indirim";
    const TRUSTED_BRANDS = parseList(settings.Spareparts_TrustedBrands, ["BOSCH","NGK","MANN","VALEO","BREMBO","CASTROL","MOBIL","TOTAL","SKF","GATES"]);
    const spTrustItems = [
      parseTrustItem(settings.Spareparts_Trust1, { abbr: "OEM",  title: "Orijinal Parçalar", desc: "OEM kalite güvencesi"        }),
      parseTrustItem(settings.Spareparts_Trust2, { abbr: "2G",   title: "Hızlı Kargo",       desc: "1-2 iş günü teslimat"        }),
      parseTrustItem(settings.Spareparts_Trust3, { abbr: "30G",  title: "30 Gün İade",        desc: "Koşulsuz iade garantisi"     }),
      parseTrustItem(settings.Spareparts_Trust4, { abbr: "7/24", title: "Teknik Destek",      desc: "Uzman ekip her an hazır"     }),
    ];
    const HOT_PARTS = parseList(
      settings.Spareparts_HotParts,
      ["Fren Diski","Motor Yağı","Hava Filtresi","Akü","Buji Seti","Amortisör","Debriyaj","Radyatör"]
    ).map(label => ({ label, href: `/urunler?s=${encodeURIComponent(label)}` }));
    return (
      <div className="bg-[#f3f4f6]">

        {/* ── B2B bilgi çubuğu ── */}
        <div className="bg-[#1c1f2e] text-gray-300 text-xs py-1.5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="bg-orange-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0">{t("home2.sp.b2b.badge")}</span>
              <span className="text-gray-400 truncate">{b2bText}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-orange-400 font-extrabold text-[12px] hidden md:inline tracking-wide">{siteName}</span>
              <span className="text-gray-600 hidden md:inline">|</span>
              <span className="text-gray-500 text-[10px] hidden sm:inline">📞 {phone}</span>
              <Link href="/iletisim"
                className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold px-3 py-1 rounded-full transition-all duration-150">
                {t("home2.sp.b2b.apply")}
              </Link>
            </div>
          </div>
        </div>

        {/* ── Araç markası pill nav ── */}
        <SparePartsBrandNav initialBrands={vehicleNavBrands} />

        {/* ── En Çok Aranan Parçalar şeridi ── */}
        <div className="bg-[#fff7ed] border-b border-orange-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-widest shrink-0">{t("home2.sp.hot.label")}</span>
              {HOT_PARTS.map(p => (
                <Link key={p.label} href={p.href}
                  className="text-[11px] font-semibold text-gray-700 hover:text-orange-600 hover:underline transition-colors">
                  {p.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Ana içerik: sidebar + sağ ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex gap-4 items-start">

            {/* ── Sol Sidebar ── */}
            <aside className="hidden lg:flex flex-col gap-3 w-[240px] shrink-0">

              {/* Araç seçici kartı */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3 flex items-center gap-2">
                  <span className="text-orange-400 text-base">🔧</span>
                  <span className="text-xs font-extrabold text-white uppercase tracking-wide">Aracınıza Göre Parça</span>
                </div>
                <div className="p-4">
                  <SparePartsVehicleSelector />
                </div>
              </div>

              {/* OEM numarası arama kutusu */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">OEM / Parça No ile Ara</p>
                <form action="/urunler" method="GET" className="flex rounded-full overflow-hidden border border-gray-200 focus-within:border-orange-400 transition-colors">
                  <input name="s" type="text" placeholder="Örn: 0004206510"
                    className="flex-1 text-xs px-4 py-2 focus:outline-none bg-white min-w-0" />
                  <button type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 transition-colors shrink-0">
                    {t("home2.sp.hero.search_btn")}
                  </button>
                </form>
              </div>

              {/* Kategoriler listesi */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="p-1.5 flex flex-col gap-0.5">
                  {categories.slice(0, 12).map(cat => (
                    <Link key={cat.id} href={`/urunler?kategori=${cat.slug}`}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all duration-150 group">
                      <span>{cat.name}</span>
                      <svg className="w-3 h-3 text-gray-300 group-hover:text-orange-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>

            {/* ── Sağ içerik ── */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">

              {/* ── Hero Banner (onlineyedekparca.com stili) ── */}
              <div className="rounded-2xl overflow-hidden shadow-sm"
                style={{ background: "linear-gradient(135deg, #0d1b2a 0%, #1a2744 55%, #0f3460 100%)" }}>
                <div className="flex items-center justify-between px-6 py-7 lg:px-8 lg:py-8 relative">
                  {/* Sol: count + slogan + CTA */}
                  <div className="relative z-10 max-w-sm">
                    <span className="inline-block bg-orange-500/20 text-orange-400 text-[10px] font-extrabold px-3 py-0.5 rounded-full mb-3 uppercase tracking-widest">
                      Stokta Hazır
                    </span>
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="text-orange-500 text-6xl font-black leading-none">{heroCount}</span>
                      <div className="flex flex-col leading-tight">
                        <span className="text-white text-2xl font-black">{heroCountUnit}</span>
                        <span className="text-orange-300 text-xs font-bold tracking-wide">İLE</span>
                      </div>
                    </div>
                    <p className="text-white text-sm font-extrabold leading-snug mb-1">{siteName.toUpperCase()}</p>
                    <p className="text-gray-400 text-xs leading-relaxed mb-5">{heroSlogan}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href="/urunler"
                        className="inline-block bg-orange-500 hover:bg-orange-400 text-white text-xs font-extrabold px-5 py-2.5 rounded-full transition-all duration-150 shadow-lg hover:shadow-orange-500/30">
                        {t("home2.sp.hero.search_btn")}
                      </Link>
                      <Link href="/urunler?indirimli=true"
                        className="inline-block bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-full border border-white/10 transition-all duration-150">
                        Fırsatları Gör
                      </Link>
                    </div>
                  </div>
                  {/* Sağ: dekoratif */}
                  <div className="hidden md:flex items-center justify-end w-48 h-36 shrink-0 select-none pointer-events-none opacity-[0.04]">
                    <span className="text-[180px] text-white font-black leading-none">⚙</span>
                  </div>
                  {/* İndirim rozeti */}
                  <div className="absolute top-5 right-5 w-16 h-16 rounded-full flex flex-col items-center justify-center text-center shadow-lg"
                    style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
                    <span className="text-white text-lg font-black leading-none">{promo2Discount.replace(/[^0-9%]/g,"")}</span>
                    <span className="text-orange-100 text-[8px] font-bold leading-tight">İNDİRİM</span>
                  </div>
                </div>
                {/* OEM Partner şeridi */}
                <div className="bg-black/30 px-6 py-2.5 flex items-center gap-4 flex-wrap border-t border-white/5">
                  <span className="text-[9px] font-extrabold text-gray-600 uppercase tracking-widest shrink-0">OEM Partner</span>
                  {["STELLANTIS","PSA","FCA","LANCIA","JEEP","BOSCH","VALEO","MANN+HUMMEL"].map(brand => (
                    <Link key={brand} href={`/urunler?s=${encodeURIComponent(brand)}`}
                      className="text-[11px] font-extrabold text-white/50 hover:text-orange-400 transition-colors duration-150">
                      {brand}
                    </Link>
                  ))}
                </div>
              </div>

              {/* ── Öne Çıkan Ürünler ── */}
              {products.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                    <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"/>
                      Öne Çıkan Ürünler
                    </h3>
                    <Link href="/urunler?ozellik=featured" className="text-xs text-orange-600 font-bold hover:underline">
                      Tümünü Gör →
                    </Link>
                  </div>
                  <div className="p-4">
                    <div data-product-grid className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {products.slice(0, 6).map(p => <ProductCard key={p.id} product={p} variant="spareparts" />)}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Marka & Kampanya Bannerleri ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Stok / ürün promo */}
                <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex items-center gap-4 px-5 py-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 min-h-[110px]">
                  <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                    <span className="text-2xl">🔧</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-extrabold text-orange-500 uppercase tracking-widest">Stokta Hazır</span>
                    <h4 className="font-extrabold text-gray-900 text-sm leading-tight mt-0.5 mb-1.5">{promo1Title} Stoklarda!</h4>
                    <p className="text-[11px] text-gray-400 leading-snug mb-2">{promo1Desc}</p>
                    <Link href="/urunler?s=filtre" className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors">
                      Ürünleri İncele <span aria-hidden>›</span>
                    </Link>
                  </div>
                </div>
                {/* Garaj kampanyası */}
                <div className="rounded-2xl overflow-hidden flex items-center gap-4 px-5 py-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-150 min-h-[110px]"
                  style={{ background: "linear-gradient(135deg,#1c5ea8 0%,#0f3f80 100%)" }}>
                  <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center shrink-0 text-3xl">
                    🚗
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-extrabold text-blue-200 uppercase tracking-widest">Kampanya</span>
                    <h4 className="font-extrabold text-white text-sm leading-tight mt-0.5 mb-1.5">Araçını Garaja Kaydet Kazan!</h4>
                    <p className="text-[11px] text-blue-200/70 leading-snug mb-2">Kayıtlı araçlar için özel fiyatlar</p>
                    <Link href="/hesabim"
                      className="inline-block bg-white text-blue-700 text-[11px] font-extrabold px-3.5 py-1.5 rounded-full hover:bg-blue-50 transition-all duration-150 shadow-sm">
                      Hemen Başla
                    </Link>
                  </div>
                </div>
              </div>

              {/* ── Haftanın Fırsatları ── */}
              {discountProducts.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                    <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"/>
                      Haftanın Fırsatları
                    </h3>
                    <Link href="/urunler?indirimli=true" className="text-xs text-orange-600 font-bold hover:underline">
                      Tümünü Gör →
                    </Link>
                  </div>
                  <div className="p-4">
                    <div data-product-grid className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {discountProducts.map(p => <ProductCard key={p.id} product={p} variant="spareparts" />)}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Kampanyalar ── */}
              {campaigns.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                    <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"/>
                      Kampanyalar
                    </h3>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {campaigns.slice(0, 4).map(c => {
                      const gradient = SCHEME_GRADIENT[c.colorScheme] ?? SCHEME_GRADIENT.orange;
                      return (
                        <div key={c.id} className="relative overflow-hidden rounded-xl p-4 text-white min-h-[100px] flex flex-col justify-between group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                          <div className="absolute right-2 bottom-0 text-[60px] font-black text-white/10 leading-none select-none">{c.icon}</div>
                          <div className="relative">
                            <h4 className="font-extrabold text-sm leading-tight mb-1">{c.title}</h4>
                            {c.subtitle && <p className="text-white/70 text-xs mb-2">{c.subtitle}</p>}
                            {c.linkUrl && (
                              <Link href={c.linkUrl} className="text-xs font-bold bg-white/20 hover:bg-white/35 px-3 py-1 rounded-full transition inline-block backdrop-blur-sm">
                                {c.linkText || "İncele →"}
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Güvenilir Markalar şeridi ── */}
        <div className="bg-white border-t border-gray-100 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-center mb-3">{t("home2.sp.trusted_brands")}</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {TRUSTED_BRANDS.map(b => (
                <Link key={b} href={`/urunler?s=${b}`}
                  className="text-xs font-extrabold text-gray-400 hover:text-orange-500 tracking-wider transition-colors">
                  {b}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Güvence şeridi (referans: onlineyedekparca trust bar) ── */}
        <div className="bg-[#1c1f2e] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {spTrustItems.map((item, i) => {
                const ICONS = ["🔒","🚚","↩","📞"];
                return (
                  <div key={item.abbr} className="flex items-center gap-3.5 group">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-xl flex items-center justify-center shrink-0 group-hover:bg-orange-500/25 transition-colors duration-150">
                      {ICONS[i] || item.abbr}
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-white leading-snug">{item.title}</p>
                      <p className="text-[10px] text-gray-500 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════
     MARKETPLACE — Trendyol / Hepsiburada tarzı modern
     Pill kategori nav → flash fırsat şeridi → hero+yan
     → kategori dairesel grid → flash indirimler (timer)
     → 5-kolon ürün grid → kampanya kartları → güvence
     (Trendyol / Hepsiburada / Pazarama benchmark)
  ══════════════════════════════════════════════════════ */
  if (template === "marketplace") {
    const siteName = settings.SiteName || "Pazar Yeri";
    const flashBarText = settings.Marketplace_FlashBarText || "Bugünün Süper Fırsatları — Bitmeden Kaçırma!";
    const heroDiscount = settings.Marketplace_HeroDiscount || "%70'e Varan";
    const heroTitle    = settings.Marketplace_HeroTitle    || "Flash İndirimler";
    const freeShipLimit = settings.Marketplace_FreeShippingLimit || "300";
    const mktTrustItems = [
      parseTrustItem(settings.Marketplace_Trust1, { abbr: "🔒", title: "Güvenli Alışveriş", desc: "256-bit SSL şifreleme"       }),
      parseTrustItem(settings.Marketplace_Trust2, { abbr: "🚚", title: "Hızlı Teslimat",    desc: "1-3 iş günü kargo"           }),
      parseTrustItem(settings.Marketplace_Trust3, { abbr: "↩️", title: "Kolay İade",        desc: "14 gün iade hakkı"           }),
      parseTrustItem(settings.Marketplace_Trust4, { abbr: "⭐", title: "Güvenilir Satıcı",  desc: "Onaylı mağaza garantisi"     }),
    ];
    const MKT_CATS = [
      { name: "Elektronik",   slug: "elektronik",   color: "#e8f0fe", text: "#1a56db" },
      { name: "Moda",         slug: "moda",         color: "#fce7f3", text: "#be185d" },
      { name: "Ev & Yaşam",   slug: "ev-yasam",     color: "#ecfdf5", text: "#065f46" },
      { name: "Spor",         slug: "spor-outdoor", color: "#fff7ed", text: "#c2410c" },
      { name: "Kozmetik",     slug: "kozmetik",     color: "#fdf4ff", text: "#7e22ce" },
      { name: "Anne & Çocuk", slug: "anne-cocuk",   color: "#fffbeb", text: "#b45309" },
      { name: "Kitap",        slug: "kitap",        color: "#f0fdf4", text: "#166534" },
      { name: "Oyun",         slug: "oyun",         color: "#eff6ff", text: "#1d4ed8" },
    ];
    const catList = categories.length > 0
      ? categories.slice(0, 10)
      : MKT_CATS.map((c, i) => ({ id: String(i), name: c.name, slug: c.slug } as Category));
    return (
      <div className="bg-[#f7f7f7]">

        {/* ── Flash Fırsat Sayaç Şeridi (Trendyol tarzı) ── */}
        <div className="bg-[#FF6000]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-white text-[#FF6000] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">⚡ FLASH</span>
              <span className="text-white text-[11px] font-bold hidden sm:inline">{flashBarText}</span>
              <span className="text-white text-[11px] font-bold sm:hidden">Flash Fırsatlar!</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-white font-extrabold text-[12px] hidden md:inline tracking-wide">{siteName}</span>
              <span className="text-white/40 hidden md:inline">|</span>
              <span className="text-white/80 text-[10px] font-semibold">{t("home2.mp.flash.timer")}</span>
              <span className="bg-white/20 text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded tabular-nums">08</span>
              <span className="text-white font-bold text-xs">:</span>
              <span className="bg-white/20 text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded tabular-nums">42</span>
              <span className="text-white font-bold text-xs">:</span>
              <span className="bg-white/20 text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded tabular-nums">15</span>
            </div>
          </div>
        </div>

        {/* ── Kategori pill navigasyonu — sarmalanabilir ── */}
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
            <div className="flex flex-wrap gap-1.5">
              {catList.slice(0, 9).map((cat, i) => (
                <Link key={cat.id} href={`/urunler?kategori=${cat.slug}`}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border ${
                    i === 0
                      ? "bg-[#FF6000] text-white border-[#FF6000] shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:border-[#FF6000] hover:text-[#FF6000] hover:bg-orange-50"
                  }`}>
                  {cat.name}
                </Link>
              ))}
              <Link href="/urunler"
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-[#FF6000] border border-transparent transition-all duration-150">
                Tümü ›
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-5">

          {/* ── Hero + 2 mini kart ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Ana hero — gradient, yuvarlak */}
            <div className="lg:col-span-2 rounded-2xl overflow-hidden relative flex items-end px-8 py-8 min-h-[220px]"
              style={{ background: "linear-gradient(135deg, #FF6000 0%, #e04800 55%, #c03a00 100%)" }}>
              <div className="absolute inset-0 opacity-10 select-none pointer-events-none flex items-center justify-end pr-10 text-[200px] leading-none font-black text-white">%</div>
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider backdrop-blur-sm">
                  ⚡ {siteName} Süper Fırsatları
                </span>
                <h2 className="text-white text-3xl font-extrabold leading-tight mb-3 drop-shadow">
                  {heroDiscount}<br/>{heroTitle}
                </h2>
                <div className="flex flex-wrap gap-3">
                  <Link href="/urunler?indirimli=true"
                    className="inline-block bg-white text-[#FF6000] font-extrabold text-sm px-7 py-2.5 rounded-full hover:bg-orange-50 transition-all duration-150 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                    Fırsatları Keşfet →
                  </Link>
                  <Link href="/urunler?siralama=cok-satan"
                    className="inline-block bg-white/20 hover:bg-white/30 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-all duration-150 backdrop-blur-sm">
                    Çok Satanlar
                  </Link>
                </div>
              </div>
            </div>

            {/* 2 mini banner — dikey */}
            <div className="flex lg:flex-col gap-3">
              <Link href="/urunler" className="group flex-1 rounded-2xl bg-white border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
                <div>
                  <span className="inline-block w-8 h-8 rounded-full bg-orange-100 text-[#FF6000] text-center leading-8 text-base font-black mb-2">🚚</span>
                  <p className="font-bold text-gray-800 text-sm">Ücretsiz Kargo</p>
                  <p className="text-xs text-gray-400 mt-0.5">{freeShipLimit} TL ve üzeri siparişlerde</p>
                </div>
                <span className="mt-3 text-xs font-bold text-[#FF6000] group-hover:underline">İncele →</span>
              </Link>
              <Link href="/urunler?siralama=yeni" className="group flex-1 rounded-2xl bg-[#fff8f4] border border-orange-100 p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
                <div>
                  <span className="inline-block w-8 h-8 rounded-full bg-orange-200 text-[#FF6000] text-center leading-8 text-base font-black mb-2">✨</span>
                  <p className="font-bold text-orange-800 text-sm">Yeni Gelenler</p>
                  <p className="text-xs text-orange-400 mt-0.5">Her gün güncelleniyor</p>
                </div>
                <span className="mt-3 text-xs font-bold text-[#FF6000] group-hover:underline">Keşfet →</span>
              </Link>
            </div>
          </div>

          {/* ── Kategori dairesel grid ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-gray-900">{t("home2.mp.cats.title")}</h3>
              <Link href="/urunler" className="text-xs font-bold text-[#FF6000] hover:underline">{t("home2.mp.cats.all")}</Link>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {MKT_CATS.map(cat => (
                <Link key={cat.slug} href={`/urunler?kategori=${cat.slug}`}
                  className="group flex flex-col items-center gap-2 py-3 rounded-xl hover:bg-gray-50 transition-all duration-150">
                  <span className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 transition-all duration-150 group-hover:scale-110"
                    style={{ backgroundColor: cat.color, color: cat.text }}>
                    {cat.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-600 group-hover:text-gray-900 text-center leading-snug">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Flash Fırsatlar — indirimli ürünler ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-[#FF6000]/5 to-transparent">
              <span className="text-lg">⚡</span>
              <h3 className="font-extrabold text-gray-900">Flash Fırsatlar</h3>
              <span className="bg-[#FF6000] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Bugün Son</span>
              <div className="flex items-center gap-1 ml-1">
                <span className="bg-[#FF6000]/10 text-[#FF6000] text-[10px] font-extrabold px-1.5 py-0.5 rounded tabular-nums">08:42</span>
              </div>
              <Link href="/urunler?indirimli=true" className="ml-auto text-xs font-bold text-[#FF6000] hover:underline">
                Tümünü Gör →
              </Link>
            </div>
            {discountProducts.length > 0 ? (
              <div className="p-4">
                <div data-product-grid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {discountProducts.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-gray-400">{t("home2.no_products")}</div>
            )}
          </div>

          {/* ── Öne Çıkan Ürünler ── */}
          {products.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 flex items-center gap-3 border-b border-gray-100">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6000] inline-block"/>
                <h3 className="font-extrabold text-gray-900">Öne Çıkan Ürünler</h3>
                <span className="text-[10px] font-bold text-[#FF6000] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">Editörün Seçimi</span>
                <Link href="/urunler?ozellik=featured" className="ml-auto text-xs font-bold text-[#FF6000] hover:underline">
                  Tümünü Gör →
                </Link>
              </div>
              <div className="p-4">
                <div data-product-grid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              </div>
            </div>
          )}

          {/* ── Kampanya kartları ── */}
          {campaigns.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {campaigns.slice(0, 4).map(c => {
                const gradient = SCHEME_GRADIENT[c.colorScheme] ?? SCHEME_GRADIENT.orange;
                return (
                  <div key={c.id} className="relative overflow-hidden rounded-2xl p-5 text-white min-h-[110px] flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                    <div className="absolute right-3 bottom-0 text-[72px] font-black text-white/10 leading-none select-none">{c.icon}</div>
                    <div className="relative">
                      <h4 className="font-extrabold text-sm leading-tight mb-1">{c.title}</h4>
                      {c.subtitle && <p className="text-white/70 text-xs mb-2">{c.subtitle}</p>}
                      {c.linkUrl && (
                        <Link href={c.linkUrl} className="text-xs font-bold bg-white/20 hover:bg-white/35 px-3 py-1 rounded-full transition inline-block backdrop-blur-sm">
                          {c.linkText || "İncele →"}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Güvence şeridi ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {mktTrustItems.map(item => (
                <div key={item.title} className="flex items-center gap-3">
                  <span className="text-xl shrink-0">{item.abbr}</span>
                  <div>
                    <p className="text-xs font-bold text-gray-800 leading-snug">{item.title}</p>
                    <p className="text-[10px] text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════
     TECHSTORE — MediaMarkt / Vatan tarzı modern
     Flaş fırsat şeridi → hızlı link çubuğu → hero+yan
     → 6 kategori kutusu → marka logoları şeridi
     → ürün grid'leri → güvence/servis şeridi
     (MediaMarkt TR / Vatan Bilgisayar / Amazon TR benchmark)
  ══════════════════════════════════════════════════════ */
  if (template === "techstore") {
    const siteName = settings.SiteName || "Elektronik";
    const tsFlashText = settings.Techstore_FlashBarText  || "Bugüne Özel Teknoloji Fırsatları!";
    const tsHeroTitle = settings.Techstore_HeroTitle     || "En Yeni Teknoloji";
    const tsHeroSub   = settings.Techstore_HeroSubtitle  || "En Uygun Fiyatla";
    const tsHeroDesc  = settings.Techstore_HeroDesc      || "Binlerce elektronik ürün, resmi garanti, güvenli ödeme";
    const tsTrustItems = [
      parseTrustItem(settings.Techstore_Trust1, { abbr: "🏅", title: "Resmi Garanti",    desc: "Türkiye distribütörü"          }),
      parseTrustItem(settings.Techstore_Trust2, { abbr: "🔒", title: "Güvenli Ödeme",    desc: "3D Secure & SSL"               }),
      parseTrustItem(settings.Techstore_Trust3, { abbr: "🔧", title: "Teknik Servis",    desc: "Yetkili servis desteği"        }),
      parseTrustItem(settings.Techstore_Trust4, { abbr: "↩️", title: "14 Gün İade",      desc: "Sorunsuz iade garantisi"       }),
    ];
    const TECH_CATS = [
      { name: "Laptop & PC",    slug: "laptop",     abbr: "LP", bg: "#1e293b", fg: "#94a3b8" },
      { name: "Akıllı Telefon", slug: "telefon",    abbr: "AT", bg: "#1e3a5f", fg: "#60a5fa" },
      { name: "TV & Ses",       slug: "tv",         abbr: "TV", bg: "#1c1917", fg: "#a8a29e" },
      { name: "Beyaz Eşya",     slug: "beyaz-esya", abbr: "BE", bg: "#1a2e1a", fg: "#86efac" },
      { name: "Oyun & Konsol",  slug: "oyun",       abbr: "OY", bg: "#2d1b3d", fg: "#c084fc" },
      { name: "Aksesuar",       slug: "aksesuar",   abbr: "AK", bg: "#2a1515", fg: "#fca5a5" },
    ];
    const TECH_QUICK = ["Kampanyalar","Çok Satanlar","Yeni Gelenler","Haftanın Fırsatı","Refurbished","Hizmetler"];
    const TECH_QUICK_HREFS = ["/kampanyalar","/urunler?siralama=cok-satan","/urunler?siralama=yeni","/urunler?indirimli=true","/urunler?s=yenilenmiş","/iletisim"];
    const TECH_BRANDS = parseList(settings.Techstore_Brands, ["APPLE","SAMSUNG","SONY","LG","ASUS","LENOVO","HUAWEI","XIAOMI"]);
    return (
      <div className="bg-[#f2f2f2]">

        {/* ── Flaş Fırsat şeridi (MediaMarkt tarzı kırmızı) ── */}
        <div className="bg-[#cc0000]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-white text-[#cc0000] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0">⚡ FLAŞ</span>
              <span className="text-white text-[11px] font-bold hidden sm:inline">{tsFlashText}</span>
              <span className="text-white text-[11px] font-bold sm:hidden">Günün Fırsatları!</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-white font-extrabold text-[12px] hidden md:inline tracking-wide">{siteName}</span>
              <span className="text-white/40 hidden md:inline">|</span>
              <Link href="/urunler?indirimli=true"
                className="bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold px-3 py-1 rounded-full transition-all">
                Tümünü Gör →
              </Link>
            </div>
          </div>
        </div>

        {/* ── Hızlı link çubuğu — pill butonlar ── */}
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap gap-1.5">
            {TECH_QUICK.map((lbl, i) => (
              <Link key={lbl} href={TECH_QUICK_HREFS[i]}
                className="px-3.5 py-1 rounded-full text-[11px] font-semibold border border-gray-200 text-gray-600 hover:border-[#cc0000] hover:text-[#cc0000] hover:bg-red-50 transition-all duration-150">
                {lbl}
              </Link>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-5">

          {/* ── Hero + 2 yan kart ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Ana hero */}
            <div className="lg:col-span-2 rounded-2xl overflow-hidden relative flex items-center px-8 py-10 min-h-[220px]"
              style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d0000 60%, #1a1a1a 100%)" }}>
              <div className="absolute inset-0 opacity-10 select-none pointer-events-none text-right pr-8 flex items-center justify-end">
                <span className="text-[160px] font-black text-white leading-none">⚡</span>
              </div>
              <div className="relative z-10">
                <span className="inline-flex items-center bg-[#cc0000] text-white text-[10px] font-extrabold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                  {siteName} Teknoloji Festivali
                </span>
                <h2 className="text-white text-3xl font-extrabold leading-tight mb-2">
                  {tsHeroTitle}<br/>
                  <span className="text-red-400">{tsHeroSub}</span>
                </h2>
                <p className="text-gray-400 text-sm mb-5">{tsHeroDesc}</p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/urunler"
                    className="inline-block bg-[#cc0000] hover:bg-[#a80000] text-white font-extrabold text-sm px-6 py-2.5 rounded-xl transition-all duration-150 shadow-lg hover:shadow-red-900/40 hover:-translate-y-0.5">
                    Ürünleri Keşfet
                  </Link>
                  <Link href="/urunler?indirimli=true"
                    className="inline-block border border-white/20 hover:border-red-500 text-gray-300 hover:text-red-400 font-semibold text-sm px-6 py-2.5 rounded-xl transition-all duration-150">
                    Fırsatlar
                  </Link>
                </div>
              </div>
            </div>

            {/* 2 mini banner */}
            <div className="flex lg:flex-col gap-3">
              <Link href="/urunler?indirimli=true" className="group flex-1 rounded-2xl overflow-hidden relative flex flex-col justify-between p-5 min-h-[105px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150"
                style={{ background: "linear-gradient(135deg, #cc0000, #8b0000)" }}>
                <div>
                  <p className="text-red-300 text-[10px] font-extrabold uppercase tracking-widest mb-1">⚡ Flaş İndirim</p>
                  <p className="text-white font-extrabold text-sm">Seçili ürünlerde<br/>%50&apos;ye varan</p>
                </div>
                <span className="mt-2 text-xs font-bold text-white/80 group-hover:text-white">İncele →</span>
                <div className="absolute right-3 bottom-1 text-5xl opacity-10 select-none leading-none text-white">%</div>
              </Link>
              <Link href="/urunler?siralama=yeni" className="group flex-1 rounded-2xl bg-white border border-gray-100 flex flex-col justify-between p-5 min-h-[105px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150">
                <div>
                  <p className="text-gray-400 text-[10px] font-extrabold uppercase tracking-widest mb-1">✨ Yeni Gelenler</p>
                  <p className="text-gray-800 font-extrabold text-sm">2026 Model<br/>Ürünler Geldi</p>
                </div>
                <span className="mt-2 text-xs font-bold text-[#cc0000] group-hover:underline">Keşfet →</span>
              </Link>
            </div>
          </div>

          {/* ── 6 Kategori kutusu — renk aksan, yuvarlak ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-gray-900">{t("home2.mp.cats.title")}</h3>
              <Link href="/urunler" className="text-xs font-bold text-[#cc0000] hover:underline">{t("home2.mp.cats.all")}</Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {TECH_CATS.map(cat => (
                <Link key={cat.slug} href={`/urunler?kategori=${cat.slug}`}
                  className="group rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-2.5 py-5 px-2 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer"
                  style={{ backgroundColor: cat.bg }}>
                  <span className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-extrabold transition-transform duration-150 group-hover:scale-110"
                    style={{ backgroundColor: cat.fg + "22", color: cat.fg }}>
                    {cat.abbr}
                  </span>
                  <span className="text-[10px] font-semibold text-center leading-snug transition-colors duration-150"
                    style={{ color: cat.fg }}>
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Güvenilir Markalar ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">{t("home2.ts.brands.title")}</p>
              <Link href="/urunler" className="text-xs font-bold text-[#cc0000] hover:underline">Tüm Markalar →</Link>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {TECH_BRANDS.map(b => (
                <Link key={b} href={`/urunler?s=${b}`}
                  className="text-xs font-extrabold text-gray-400 hover:text-[#cc0000] tracking-widest transition-colors">
                  {b}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Öne Çıkan Ürünler ── */}
          {products.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 flex items-center gap-3 border-b border-gray-100">
                <span className="w-2.5 h-2.5 rounded-full bg-[#cc0000] inline-block"/>
                <h3 className="font-extrabold text-gray-900">Öne Çıkan Ürünler</h3>
                <span className="text-[10px] font-bold text-[#cc0000] bg-red-50 px-2 py-0.5 rounded-full border border-red-100">Editörün Seçimi</span>
                <Link href="/urunler?ozellik=featured" className="ml-auto text-xs font-bold text-[#cc0000] hover:underline">
                  Tümünü Gör →
                </Link>
              </div>
              <div className="p-4">
                <div data-product-grid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              </div>
            </div>
          )}

          {/* ── İndirimli Ürünler ── */}
          {discountProducts.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-red-50 to-transparent">
                <span className="text-lg">⚡</span>
                <h3 className="font-extrabold text-gray-900">Flaş Fırsat Ürünleri</h3>
                <span className="bg-[#cc0000] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">{t("home2.ts.limited.badge")}</span>
                <Link href="/urunler?indirimli=true" className="ml-auto text-xs font-bold text-[#cc0000] hover:underline">
                  Tümünü Gör →
                </Link>
              </div>
              <div className="p-4">
                <div data-product-grid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {discountProducts.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              </div>
            </div>
          )}

          {/* ── Güvence & Servis şeridi ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {tsTrustItems.map(item => (
                <div key={item.title} className="flex items-center gap-3">
                  <span className="text-xl shrink-0">{item.abbr}</span>
                  <div>
                    <p className="text-xs font-bold text-gray-800 leading-snug">{item.title}</p>
                    <p className="text-[10px] text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════
     DEFAULT — modern / diğer tüm şablonlar
  ══════════════════════════════════════════════════════ */
  const defaultTrustItems = [
    parseTrustItem(settings.Default_Trust1, { abbr: "🚀", title: "Hızlı Kargo",   desc: "2-3 iş günü teslimat"    }),
    parseTrustItem(settings.Default_Trust2, { abbr: "🔒", title: "Güvenli Ödeme", desc: "256-bit SSL şifreleme"   }),
    parseTrustItem(settings.Default_Trust3, { abbr: "↩️", title: "Kolay İade",    desc: "14 gün iade garantisi"   }),
    parseTrustItem(settings.Default_Trust4, { abbr: "💬", title: "7/24 Destek",   desc: "Her zaman yanınızdayız" }),
  ];
  const defCatsTitle  = settings.Default_CategoriesTitle    || "Kategoriler";
  const defCatsSub    = settings.Default_CategoriesSubtitle || "İhtiyacına göre kategorilere göz at";
  const defFeatTitle  = settings.Default_FeaturedTitle      || "Öne Çıkan Ürünler";
  const defFeatSub    = settings.Default_FeaturedSubtitle   || "Popüler ürünleri avantajlı fiyatlarla keşfet";
  const defDiscTitle  = settings.Default_DiscountTitle      || "Fırsat İndirimi";
  const defDiscSub    = settings.Default_DiscountSubtitle   || "İndirimli ürünleri kaçırma";
  const defCmpTitle   = settings.Default_CampaignsTitle     || "Kampanyalar";
  const defCmpSub     = settings.Default_CampaignsSubtitle  || "Kaçırmak istemeyeceğin fırsatlar";
  return (
    <div>

      {/* ── Hero Slider ── */}
      <HeroSlider announcements={announcements} />

      {/* ── Avantajlar — lacivert şerit ── */}
      <div className="bg-[#12304A] mt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {defaultTrustItems.map(item => (
              <div key={item.title} className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center text-xl shrink-0">
                  {item.abbr}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{item.title}</p>
                  <p className="text-teal-300 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Kategoriler — beyaz, renkli kartlar ── */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">{defCatsTitle}</h2>
              <p className="text-slate-500 text-sm mt-1">{defCatsSub}</p>
            </div>
            <Link href="/urunler" className="text-sm font-semibold text-teal-600 hover:text-teal-800 transition">
              Tümü →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => {
              const s = CATEGORY_STYLES[i % CATEGORY_STYLES.length];
              return (
                <Link
                  key={cat.id}
                  href={`/urunler?kategori=${cat.slug}`}
                  className={`group rounded-2xl border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ${s.card}`}
                >
                  <div className={`h-28 flex items-center justify-center text-4xl overflow-hidden ${cat.imageUrl ? "" : s.icon}`}>
                    {cat.imageUrl
                      ? <Image src={cat.imageUrl} alt={cat.name} width={200} height={112} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : "📦"}
                  </div>
                  <div className="p-3 text-center">
                    <span className={`text-sm font-semibold text-slate-700 ${s.text} transition-colors leading-tight`}>
                      {cat.name}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Öne Çıkan Ürünler ── */}
      {products.length > 0 && (
        <div className="bg-[#F7FAFA] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">{defFeatTitle}</h2>
                <p className="text-slate-500 text-sm mt-1">{defFeatSub}</p>
              </div>
              <Link href="/urunler?ozellik=featured" className="text-sm font-semibold text-teal-600 hover:text-teal-800 transition">
                Tümünü Gör →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Fırsat İndirimi ── */}
      {discountProducts.length > 0 && (
        <div className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">{defDiscTitle}</h2>
                <p className="text-slate-500 text-sm mt-1">{defDiscSub}</p>
              </div>
              <Link href="/urunler?indirimli=true" className="text-sm font-semibold text-teal-600 hover:text-teal-800 transition">
                Tümünü Gör →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {discountProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Kampanyalar — beyaz ── */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <Link href="/kampanyalar" className="group inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
                <h2 className="text-2xl font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors">{defCmpTitle}</h2>
                <span className="text-slate-400 group-hover:text-teal-500 text-xl transition-colors">›</span>
              </Link>
              <p className="text-slate-500 text-sm mt-1">{defCmpSub}</p>
            </div>
            <Link href="/kampanyalar" className="text-sm font-semibold text-teal-600 hover:text-teal-800 transition-colors">
              Tümünü Gör →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {campaigns.map(c => {
              const gradient = SCHEME_GRADIENT[c.colorScheme] ?? SCHEME_GRADIENT.orange;
              const styles = c.stylesJson ? (() => { try { return JSON.parse(c.stylesJson); } catch { return {}; } })() : {};
              const titleStyle = { color: styles.titleColor ?? "#ffffff", fontSize: styles.titleFontSize ? `${styles.titleFontSize}px` : undefined, fontWeight: styles.titleFontWeight ?? "800" };
              const subtitleStyle = { color: styles.subtitleColor ?? "rgba(255,255,255,0.85)" };
              const btnStyle = { color: styles.linkTextColor ?? undefined, backgroundColor: styles.linkBgColor ?? "#ffffff" };
              return (
                <div key={c.id} className="relative overflow-hidden rounded-2xl p-8 text-white" style={c.imageUrl ? { backgroundImage: `url(${c.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                  {!c.imageUrl && <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />}
                  {c.imageUrl && <div className="absolute inset-0 bg-black/40" />}
                  <div className="absolute right-4 bottom-0 text-[110px] font-black text-white/15 leading-none select-none">{c.icon}</div>
                  <div className="relative">
                    {c.subtitle && <p className="text-sm font-semibold opacity-80 mb-2" style={subtitleStyle}>{c.subtitle}</p>}
                    <h3 className="text-3xl font-extrabold mb-4 leading-tight" style={titleStyle}>{c.title}</h3>
                    {c.linkUrl && (
                      <Link href={c.linkUrl} className="inline-block font-bold text-sm px-6 py-2.5 rounded-xl hover:opacity-90 transition" style={btnStyle}>
                        {c.linkText || "İncele →"}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
