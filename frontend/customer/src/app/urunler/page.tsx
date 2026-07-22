import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import Link from "next/link";
import Image from "next/image";
import { serverFetch } from "@/lib/server-fetch";
import type { Brand, Category, ProductListItem, PaginatedList } from "@/types";
import { formatPrice } from "@/lib/utils";
import ProductFilters from "./ProductFilters";
import MobileFilterSheet from "./MobileFilterSheet";
import { getSettings } from "@/lib/settings";
import { getServerLang } from "@/lib/server-i18n";
import { t as translate } from "@/lib/i18n";

type SearchParams = Promise<{
  s?: string;
  arac?: string;       // vehicle model exact search — from SparePartsBrandNav model click
  motor?: string;      // engine filter (text search within product name)
  oemNo?: string;      // OEM / part reference number
  chassis?: string;    // chassis / VIN number
  kategori?: string;
  kategoriler?: string; // category ID — araç menüsünden gelen (SparePartsBrandNav)
  marka?: string;       // vehicle brand label — from SparePartsBrandNav (breadcrumb display)
  minFiyat?: string;
  maxFiyat?: string;
  sayfa?: string;
  ozellik?: string;
  indirimli?: string;
  siralama?: string;   // yeni | cok-satan | fiyat-artan | fiyat-azalan
  markalar?: string;   // comma-sep brand IDs
  puan?: string;       // min rating 1-5
  nitelikler?: string; // comma-sep key:value pairs, e.g. "Renk:Kırmızı,Beden:M"
}>;

async function getCategories(): Promise<Category[]> {
  try { return await serverFetch<Category[]>("/api/categories", 300); }
  catch { return []; }
}

async function getBrands(categorySlug?: string): Promise<Brand[]> {
  try {
    const qs = new URLSearchParams({ pageSize: "200", onlyActive: "true", sortBy: "name" });
    if (categorySlug) qs.set("categorySlug", categorySlug);
    const data = await serverFetch<{ items: Brand[] }>(`/api/brands?${qs}`, 120);
    return data.items ?? [];
  } catch { return []; }
}

function extractBaseModel(vehicleModel: string): string {
  // "Astra F" → "Astra", "Golf VIII" → "Golf", "3 Serisi E90" → "3 Serisi", "X5 E53" → "X5"
  return vehicleModel
    .replace(/\s+([A-Z]\d+[A-Za-z]?|[IVXLC]{1,6}|[A-Z]{1,2}\d*)$/, "")
    .trim();
}

async function getSuggestedProducts(searchTerm: string, limit = 8): Promise<ProductListItem[]> {
  try {
    const data = await serverFetch<PaginatedList<ProductListItem>>(
      `/api/products?page=1&pageSize=${limit}&search=${encodeURIComponent(searchTerm)}`, 60
    );
    return data.items;
  } catch { return []; }
}

async function getProducts(params: Awaited<SearchParams>): Promise<PaginatedList<ProductListItem>> {
  try {
    const qs = new URLSearchParams();
    qs.set("page", params.sayfa ?? "1");
    qs.set("pageSize", "12");
    if (params.s) qs.set("search", params.s);
    // arac varsa her zaman vehicleModel LIKE gönder; kategoriler (brand UUID) varsa ek pre-filter
    if (params.arac) qs.set("vehicleModel", params.arac);
    if (params.motor) qs.set("search", [params.s, params.motor].filter(Boolean).join(" "));
    if (params.oemNo) qs.set("oemPartNo", params.oemNo);
    if (params.chassis) qs.set("chassis", params.chassis);
    if (params.kategoriler) qs.set("categoryId", params.kategoriler);
    else if (params.kategori) qs.set("categorySlug", params.kategori);
    if (params.minFiyat) qs.set("minPrice", params.minFiyat);
    if (params.maxFiyat) qs.set("maxPrice", params.maxFiyat);
    if (params.ozellik === "featured") qs.set("featured", "true");
    if (params.indirimli === "true") qs.set("onSale", "true");
    if (params.markalar) qs.set("brandIds", params.markalar);
    if (params.puan) qs.set("minRating", params.puan);
    if (params.nitelikler) qs.set("attributes", params.nitelikler);
    if (params.siralama === "yeni") qs.set("sortBy", "newest");
    else if (params.siralama === "cok-satan") qs.set("sortBy", "bestseller");
    else if (params.siralama === "fiyat-artan") qs.set("sortBy", "price-asc");
    else if (params.siralama === "fiyat-azalan") qs.set("sortBy", "price-desc");
    else if (params.siralama === "indirim") qs.set("sortBy", "discount-desc");
    return await serverFetch<PaginatedList<ProductListItem>>(`/api/products?${qs}`, 60);
  } catch {
    return { items: [], totalCount: 0, page: 1, pageSize: 12, totalPages: 0, hasNextPage: false, hasPreviousPage: false };
  }
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const [params, settings] = await Promise.all([searchParams, getSettings()]);
  const siteName = settings.SiteName || "";
  const title = params.oemNo
    ? `OEM ${params.oemNo} Parça Arama`
    : params.chassis
    ? `Şasi ${params.chassis} Uyumlu Parçalar`
    : params.arac
    ? `${params.marka ? `${params.marka} ` : ""}${params.arac} Uyumlu Yedek Parçalar`
    : params.s
    ? `"${params.s}" için Arama Sonuçları`
    : params.siralama === "yeni"     ? "Yeni Sezon Ürünleri"
    : params.siralama === "cok-satan" ? "Çok Satanlar"
    : params.ozellik === "featured"  ? "Öne Çıkan Ürünler"
    : params.indirimli === "true"    ? "İndirimli Ürünler"
    : params.kategori
    ? `${params.kategori.charAt(0).toUpperCase() + params.kategori.slice(1)} Ürünleri`
    : "Tüm Ürünler";
  const description = `${siteName}'da ${title.toLowerCase()} — uygun fiyat, hızlı teslimat.`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${title} | ${siteName}`,
      description,
    },
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [allCategories, brands, products, lang, settings] = await Promise.all([
    getCategories(),
    getBrands(params.kategori), getProducts(params), getServerLang(), getSettings(),
  ]);

  // Araç modeli araması sıfır sonuç döndürürse daha geniş önerileri çek
  const noVehicleResults = params.arac && products.items.length === 0 && Number(params.sayfa ?? 1) === 1;
  const baseModel = params.arac ? extractBaseModel(params.arac) : "";
  // baseModel = extractBaseModel("A Serisi W176") → "A Serisi"; use it for both suggestions and button text
  const suggestedProducts = noVehicleResults && baseModel
    ? await getSuggestedProducts(baseModel !== params.arac ? baseModel : baseModel.split(" ")[0])
    : [];

  const categories = (params.arac || params.marka) ? [] : allCategories;
  const t = (key: string) => translate(lang, key);
  const isSP = settings.CustomerTemplate === "spareparts";

  const currentPage = Number(params.sayfa ?? 1);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const merged = { ...params, ...overrides };
    const qs = new URLSearchParams();
    if (merged.s) qs.set("s", merged.s);
    if (merged.arac) qs.set("arac", merged.arac);
    if (merged.motor) qs.set("motor", merged.motor);
    if (merged.oemNo) qs.set("oemNo", merged.oemNo);
    if (merged.chassis) qs.set("chassis", merged.chassis);
    if (merged.kategoriler) qs.set("kategoriler", merged.kategoriler);
    if (merged.marka) qs.set("marka", merged.marka);
    if (merged.kategori) qs.set("kategori", merged.kategori);
    if (merged.minFiyat) qs.set("minFiyat", merged.minFiyat);
    if (merged.maxFiyat) qs.set("maxFiyat", merged.maxFiyat);
    if (merged.ozellik) qs.set("ozellik", merged.ozellik);
    if (merged.indirimli) qs.set("indirimli", merged.indirimli);
    if (merged.siralama) qs.set("siralama", merged.siralama);
    if (merged.markalar) qs.set("markalar", merged.markalar);
    if (merged.puan) qs.set("puan", merged.puan);
    if (merged.nitelikler) qs.set("nitelikler", merged.nitelikler);
    if (merged.sayfa && merged.sayfa !== "1") qs.set("sayfa", merged.sayfa);
    const q = qs.toString();
    return `/urunler${q ? `?${q}` : ""}`;
  }

  const activeBrandIds = params.markalar?.split(",").filter(Boolean) ?? [];
  const activeBrandNames = activeBrandIds
    .map(id => brands.find(b => b.id === id)?.name)
    .filter(Boolean) as string[];

  const activeAttrPairs = params.nitelikler
    ? params.nitelikler.split(",").filter(Boolean).map(p => {
        const idx = p.indexOf(":");
        if (idx < 0) return null;
        return { key: p.slice(0, idx), value: p.slice(idx + 1) };
      }).filter((x): x is { key: string; value: string } => x !== null)
    : [];

  const hasFilters = !!(params.s || params.arac || params.motor || params.oemNo || params.chassis || params.kategori || params.kategoriler || params.ozellik || params.indirimli
    || params.minFiyat || params.maxFiyat || params.siralama || params.markalar || params.puan || params.nitelikler);

  return (
    <div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Arama / marka+model başlığı — spareparts */}
      {isSP && (params.s || params.arac || params.oemNo || params.chassis) && (
        <div className="mb-5">
          <nav className="text-[11px] text-gray-400 mb-1 flex items-center gap-1">
            <Link href="/" className="hover:text-orange-500 transition-colors">Anasayfa</Link>
            <span>/</span>
            {params.marka && params.arac && (
              <>
                <Link href={`/urunler?s=${encodeURIComponent(params.marka)}&marka=${encodeURIComponent(params.marka)}`} className="hover:text-orange-500 transition-colors">{params.marka}</Link>
                <span>/</span>
              </>
            )}
            <span className="text-gray-600 font-semibold">
              {params.oemNo ? `OEM: ${params.oemNo}` : params.chassis ? `Şasi: ${params.chassis}` : (params.arac ?? params.s)}
            </span>
          </nav>
          <h1 className="text-xl font-extrabold text-gray-800 uppercase tracking-wide">
            {params.oemNo ? `OEM / Parça No: ${params.oemNo}` : params.chassis ? `Şasi: ${params.chassis}` :
             params.marka && params.arac ? `${params.marka} ${params.arac}` : (params.arac ?? params.s)}
          </h1>
          {params.arac && (
            <p className="text-xs text-gray-400 mt-0.5">{params.marka ? `${params.marka} ` : ""}{params.arac} uyumlu parçalar gösteriliyor</p>
          )}
          {params.oemNo && (
            <p className="text-xs text-gray-400 mt-0.5">OEM / parça numarasına göre sonuçlar</p>
          )}
          {params.chassis && (
            <p className="text-xs text-gray-400 mt-0.5">Şasi numarasına göre uyumlu parçalar</p>
          )}
        </div>
      )}

      <div className="flex gap-8">
        {/* Sidebar Filters — desktop only */}
        <aside className="hidden lg:block w-64 shrink-0">
          <ProductFilters
            categories={categories}
            brands={brands}
            activeCategory={params.kategori}
            minFiyat={params.minFiyat}
            maxFiyat={params.maxFiyat}
            searchTerm={params.s}
            activeVehicleModel={params.arac}
            activeOemNo={params.oemNo}
            activeChassis={params.chassis}
            activeMotor={params.motor}
            activeBrandIds={activeBrandIds}
            activeRating={params.puan ? Number(params.puan) : undefined}
            activeSiralama={params.siralama}
            activeIndirimli={params.indirimli === "true"}
            activeNitelikler={params.nitelikler}
            categorySlug={params.kategori}
          />
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Mobile filter sheet — hidden on desktop */}
          <MobileFilterSheet
            categories={categories}
            brands={brands}
            activeCategory={params.kategori}
            minFiyat={params.minFiyat}
            maxFiyat={params.maxFiyat}
            searchTerm={params.s}
            activeVehicleModel={params.arac}
            activeOemNo={params.oemNo}
            activeChassis={params.chassis}
            activeMotor={params.motor}
            activeBrandIds={activeBrandIds}
            activeRating={params.puan ? Number(params.puan) : undefined}
            activeSiralama={params.siralama}
            activeIndirimli={params.indirimli === "true"}
            activeNitelikler={params.nitelikler}
            categorySlug={params.kategori}
          />

          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm font-medium ${isSP ? "text-orange-500" : "text-teal-400"}`}>
                {t("prod2.list.count").replace("{n}", String(products.totalCount))}
              </p>
              {params.s && (
                <FilterBadge label={`"${params.s}"`} href={buildUrl({ s: undefined, sayfa: "1" })} />
              )}
              {params.kategori && (
                <FilterBadge label={categories.find(c => c.slug === params.kategori)?.name ?? params.kategori} href={buildUrl({ kategori: undefined, sayfa: "1" })} color="teal" />
              )}
              {params.indirimli === "true" && (
                <FilterBadge label={t("prod2.list.on_sale")} href={buildUrl({ indirimli: undefined, sayfa: "1" })} color="orange" />
              )}
              {params.ozellik === "featured" && (
                <FilterBadge label={t("prod2.list.featured")} href={buildUrl({ ozellik: undefined, sayfa: "1" })} color="amber" />
              )}
              {(params.minFiyat || params.maxFiyat) && (
                <FilterBadge
                  label={`${params.minFiyat ?? "0"} – ${params.maxFiyat ?? "∞"} ₺`}
                  href={buildUrl({ minFiyat: undefined, maxFiyat: undefined, sayfa: "1" })}
                  color="violet"
                />
              )}
              {activeBrandNames.map(name => (
                <FilterBadge key={name} label={name} href={buildUrl({
                  markalar: activeBrandIds.filter(id => brands.find(b => b.id === id)?.name !== name).join(",") || undefined,
                  sayfa: "1",
                })} color="blue" />
              ))}
              {params.puan && (
                <FilterBadge label={`${params.puan}+ Yıldız`} href={buildUrl({ puan: undefined, sayfa: "1" })} color="amber" />
              )}
              {activeAttrPairs.map(({ key, value }) => (
                <FilterBadge
                  key={`${key}:${value}`}
                  label={`${key}: ${value}`}
                  color="teal"
                  href={buildUrl({
                    nitelikler: activeAttrPairs
                      .filter(p => !(p.key === key && p.value === value))
                      .map(p => `${p.key}:${p.value}`)
                      .join(",") || undefined,
                    sayfa: "1",
                  })}
                />
              ))}
              {params.siralama && (
                <FilterBadge
                  label={{
                    yeni: t("prod2.sort.new"),
                    "cok-satan": t("prod2.sort.bestseller"),
                    "fiyat-artan": t("prod2.sort.price_asc"),
                    "fiyat-azalan": t("prod2.sort.price_desc"),
                    indirim: "İndirime Göre",
                  }[params.siralama] ?? params.siralama}
                  href={buildUrl({ siralama: undefined, sayfa: "1" })}
                />
              )}
            </div>
            {hasFilters && (
              <Link href="/urunler" className="text-xs text-slate-400 hover:text-red-500 transition font-medium">
                {t("prod2.filter.clear")} ×
              </Link>
            )}
          </div>

          {products.items.length === 0 ? (
            <div>
              <div className="text-center py-12 text-slate-400">
                <p className="text-5xl mb-4">🔍</p>
                <p className="text-lg font-medium text-slate-700">
                  {params.arac
                    ? <><span className="text-orange-600 font-bold">&ldquo;{params.arac}&rdquo;</span> için ürün bulunamadı.</>
                    : t("prod2.list.no_results")}
                </p>
                {params.arac && (
                  <p className="text-sm text-slate-400 mt-1">
                    Tam model eşleşmesi bulunamadı — daha geniş arama sonuçları aşağıda gösteriliyor.
                  </p>
                )}
                <div className="flex items-center justify-center gap-3 mt-4">
                  {params.arac && (
                    <Link
                      href={`/urunler?s=${encodeURIComponent(baseModel || params.arac.split(" ")[0])}`}
                      className={`text-sm font-semibold px-4 py-2 rounded-full border transition ${
                        isSP
                          ? "border-orange-300 text-orange-600 hover:bg-orange-50"
                          : "border-teal-300 text-teal-600 hover:bg-teal-50"
                      }`}
                    >
                      &ldquo;{baseModel || params.arac.split(" ")[0]}&rdquo; ara →
                    </Link>
                  )}
                  <Link href="/urunler" className="text-sm font-semibold text-slate-400 hover:text-red-500 transition">
                    Tüm Ürünlere Dön
                  </Link>
                </div>
              </div>

              {/* Önerilen ürünler — araç modeli araması için fallback */}
              {suggestedProducts.length > 0 && (
                <div className="mt-4">
                  <div className={`flex items-center gap-2 mb-4 px-1 ${isSP ? "" : ""}`}>
                    <span className={`w-2.5 h-2.5 rounded-full inline-block ${isSP ? "bg-orange-500" : "bg-teal-500"}`} />
                    <h3 className="text-sm font-extrabold text-gray-800">
                      {baseModel && baseModel !== params.arac
                        ? <>&ldquo;{baseModel}&rdquo; ile İlgili Ürünler</>
                        : <>Önerilen Ürünler</>}
                    </h3>
                    <span className="text-xs text-gray-400">({suggestedProducts.length} ürün)</span>
                  </div>
                  <div data-product-grid className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {suggestedProducts.map((product) => (
                      <Link
                        key={product.id}
                        href={`/urun/${product.slug}`}
                        className={`bg-white rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-200 group ${
                          isSP
                            ? "border border-gray-100 hover:shadow-lg hover:shadow-orange-100/50 shadow-sm"
                            : "border border-teal-100 hover:shadow-xl hover:shadow-teal-100/50"
                        }`}
                      >
                        <div className={`aspect-square flex items-center justify-center relative ${
                          isSP ? "bg-white" : "bg-gradient-to-br from-teal-50 to-cyan-50"
                        }`}>
                          {product.discountPrice && (
                            <span className={`absolute top-2 left-2 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow ${
                              isSP ? "bg-orange-500" : "bg-gradient-to-r from-orange-400 to-pink-500"
                            }`}>{t("prod2.list.on_sale")}</span>
                          )}
                          {product.imageUrl ? (
                            <Image src={product.imageUrl} alt={product.name} width={200} height={200} className="object-contain w-full h-full p-4" />
                          ) : (
                            <span className="text-4xl">📦</span>
                          )}
                        </div>
                        <div className="p-3">
                          {product.brandName && (
                            <p className={`text-xs font-medium mb-0.5 ${isSP ? "text-orange-500" : "text-teal-400"}`}>{product.brandName}</p>
                          )}
                          <h3 className={`font-semibold text-slate-800 line-clamp-2 text-sm transition-colors ${
                            isSP ? "group-hover:text-orange-600" : "group-hover:text-teal-700"
                          }`}>{product.name}</h3>
                          <div className="mt-2 flex items-center gap-2">
                            {product.discountPrice ? (
                              <>
                                <span className={`font-bold ${isSP ? "text-orange-600" : "text-teal-700"}`}>{formatPrice(product.discountPrice)}</span>
                                <span className="text-xs text-slate-400 line-through">{formatPrice(product.price)}</span>
                              </>
                            ) : (
                              <span className={`font-bold ${isSP ? "text-orange-600" : "text-teal-700"}`}>{formatPrice(product.price)}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div data-product-grid className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.items.map((product) => (
                <Link
                  key={product.id}
                  href={`/urun/${product.slug}`}
                  className={`bg-white rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-200 group ${
                    isSP
                      ? "border border-gray-100 hover:shadow-lg hover:shadow-orange-100/50 shadow-sm"
                      : "border border-teal-100 hover:shadow-xl hover:shadow-teal-100/50"
                  }`}
                >
                  <div className={`aspect-square flex items-center justify-center relative ${
                    isSP ? "bg-white" : "bg-gradient-to-br from-teal-50 to-cyan-50"
                  }`}>
                    {product.discountPrice && (
                      <span className={`absolute top-2 left-2 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow ${
                        isSP ? "bg-orange-500" : "bg-gradient-to-r from-orange-400 to-pink-500"
                      }`}>
                        {t("prod2.list.on_sale")}
                      </span>
                    )}
                    {isSP && product.availableStock > 0 && (
                      <span className="absolute top-2 right-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Stokta</span>
                    )}
                    {product.imageUrl ? (
                      <Image src={product.imageUrl} alt={product.name} width={200} height={200} className="object-contain w-full h-full p-4" />
                    ) : (
                      <span className="text-4xl">📦</span>
                    )}
                  </div>
                  <div className="p-3">
                    {product.brandName && (
                      <p className={`text-xs font-medium mb-0.5 ${isSP ? "text-orange-500" : "text-teal-400"}`}>{product.brandName}</p>
                    )}
                    <h3 className={`font-semibold text-slate-800 line-clamp-2 text-sm transition-colors ${
                      isSP ? "group-hover:text-orange-600" : "group-hover:text-teal-700"
                    }`}>
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                      {product.discountPrice ? (
                        <>
                          <span className={`font-bold ${isSP ? "text-orange-600" : "text-teal-700"}`}>{formatPrice(product.discountPrice)}</span>
                          <span className="text-xs text-slate-400 line-through">{formatPrice(product.price)}</span>
                        </>
                      ) : (
                        <span className={`font-bold ${isSP ? "text-orange-600" : "text-teal-700"}`}>{formatPrice(product.price)}</span>
                      )}
                    </div>
                    {product.availableStock === 0 && (
                      <span className="text-xs text-red-500 mt-1 block font-medium">{t("prod2.card.out_of_stock")}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {products.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {products.hasPreviousPage && (
                <Link href={buildUrl({ sayfa: String(currentPage - 1) })} className={`px-4 py-2 rounded-xl border text-sm transition font-medium ${isSP ? "border-orange-200 text-orange-600 hover:bg-orange-50" : "border-teal-200 text-teal-600 hover:bg-teal-50"}`}>
                  {t("prod2.page.prev")}
                </Link>
              )}
              {Array.from({ length: products.totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - currentPage) <= 2)
                .map((p) => (
                  <Link
                    key={p}
                    href={buildUrl({ sayfa: String(p) })}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                      p === currentPage
                        ? isSP
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-transparent shadow"
                          : "bg-gradient-to-r from-teal-500 to-teal-700 text-white border-transparent shadow"
                        : isSP
                          ? "border-orange-200 text-orange-600 hover:bg-orange-50"
                          : "border-teal-200 text-teal-600 hover:bg-teal-50"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              {products.hasNextPage && (
                <Link href={buildUrl({ sayfa: String(currentPage + 1) })} className={`px-4 py-2 rounded-xl border text-sm transition font-medium ${isSP ? "border-orange-200 text-orange-600 hover:bg-orange-50" : "border-teal-200 text-teal-600 hover:bg-teal-50"}`}>
                  {t("prod2.page.next")}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}

function FilterBadge({ label, href, color = "slate" }: { label: string; href: string; color?: string }) {
  const colors: Record<string, string> = {
    slate:  "bg-slate-100 text-slate-600",
    teal:   "bg-teal-100 text-teal-700",
    orange: "bg-orange-100 text-orange-700",
    amber:  "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
    blue:   "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${colors[color] ?? colors.slate}`}>
      {label}
      <Link href={href} className="ml-0.5 opacity-60 hover:opacity-100">×</Link>
    </span>
  );
}
