import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Brand, Category, ProductListItem, PaginatedList } from "@/types";
import { formatPrice } from "@/lib/utils";
import ProductFilters from "./ProductFilters";
import { getSettings } from "@/lib/settings";

type SearchParams = Promise<{
  s?: string;
  kategori?: string;
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
  try { return await api.get<Category[]>("/api/categories"); }
  catch { return []; }
}

async function getBrands(): Promise<Brand[]> {
  try { return await api.get<Brand[]>("/api/brands"); }
  catch { return []; }
}

async function getProducts(params: Awaited<SearchParams>): Promise<PaginatedList<ProductListItem>> {
  try {
    const qs = new URLSearchParams();
    qs.set("page", params.sayfa ?? "1");
    qs.set("pageSize", "12");
    if (params.s) qs.set("search", params.s);
    if (params.kategori) qs.set("categorySlug", params.kategori);
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
    return await api.get<PaginatedList<ProductListItem>>(`/api/products?${qs}`);
  } catch {
    return { items: [], totalCount: 0, page: 1, pageSize: 12, totalPages: 0, hasNextPage: false, hasPreviousPage: false };
  }
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const [params, settings] = await Promise.all([searchParams, getSettings()]);
  const siteName = settings.SiteName || "Keyvora";
  const title = params.s
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
  const [categories, brands, products] = await Promise.all([getCategories(), getBrands(), getProducts(params)]);

  const currentPage = Number(params.sayfa ?? 1);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const merged = { ...params, ...overrides };
    const qs = new URLSearchParams();
    if (merged.s) qs.set("s", merged.s);
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

  const hasFilters = !!(params.s || params.kategori || params.ozellik || params.indirimli
    || params.minFiyat || params.maxFiyat || params.siralama || params.markalar || params.puan || params.nitelikler);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <ProductFilters
            categories={categories}
            brands={brands}
            activeCategory={params.kategori}
            minFiyat={params.minFiyat}
            maxFiyat={params.maxFiyat}
            searchTerm={params.s}
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
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm text-teal-400 font-medium">
                <span className="text-teal-700 font-bold">{products.totalCount}</span> ürün
              </p>
              {params.s && (
                <FilterBadge label={`"${params.s}"`} href={buildUrl({ s: undefined, sayfa: "1" })} />
              )}
              {params.kategori && (
                <FilterBadge label={categories.find(c => c.slug === params.kategori)?.name ?? params.kategori} href={buildUrl({ kategori: undefined, sayfa: "1" })} color="teal" />
              )}
              {params.indirimli === "true" && (
                <FilterBadge label="İndirimli" href={buildUrl({ indirimli: undefined, sayfa: "1" })} color="orange" />
              )}
              {params.ozellik === "featured" && (
                <FilterBadge label="Öne Çıkan" href={buildUrl({ ozellik: undefined, sayfa: "1" })} color="amber" />
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
                  label={{ yeni: "Yeni Sezon", "cok-satan": "Çok Satanlar", "fiyat-artan": "Fiyat ↑", "fiyat-azalan": "Fiyat ↓" }[params.siralama] ?? params.siralama}
                  href={buildUrl({ siralama: undefined, sayfa: "1" })}
                />
              )}
            </div>
            {hasFilters && (
              <Link href="/urunler" className="text-xs text-slate-400 hover:text-red-500 transition font-medium">
                Tümünü temizle ×
              </Link>
            )}
          </div>

          {products.items.length === 0 ? (
            <div className="text-center py-24 text-slate-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-medium text-slate-600">Ürün bulunamadı</p>
              <Link href="/urunler" className="mt-3 inline-block text-sm font-semibold text-teal-600 hover:text-teal-800">
                Filtreleri Temizle
              </Link>
            </div>
          ) : (
            <div data-product-grid className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.items.map((product) => (
                <Link
                  key={product.id}
                  href={`/urun/${product.slug}`}
                  className="bg-white rounded-2xl border border-teal-100 overflow-hidden hover:shadow-xl hover:shadow-teal-100/50 hover:-translate-y-1 transition-all duration-200 group"
                >
                  <div className="aspect-square bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center relative">
                    {product.discountPrice && (
                      <span className="absolute top-2 left-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                        İndirim
                      </span>
                    )}
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.imageUrl} alt={product.name} className="object-contain w-full h-full p-4" />
                    ) : (
                      <span className="text-4xl">📦</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-teal-400 font-medium mb-0.5">{product.brandName}</p>
                    <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm group-hover:text-teal-700 transition-colors">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                      {product.discountPrice ? (
                        <>
                          <span className="font-bold text-teal-700">{formatPrice(product.discountPrice)}</span>
                          <span className="text-xs text-slate-400 line-through">{formatPrice(product.price)}</span>
                        </>
                      ) : (
                        <span className="font-bold text-teal-700">{formatPrice(product.price)}</span>
                      )}
                    </div>
                    {product.availableStock === 0 && (
                      <span className="text-xs text-red-500 mt-1 block font-medium">Stokta Yok</span>
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
                <Link href={buildUrl({ sayfa: String(currentPage - 1) })} className="px-4 py-2 rounded-xl border border-teal-200 text-sm text-teal-600 hover:bg-teal-50 transition font-medium">
                  ← Önceki
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
                        ? "bg-gradient-to-r from-teal-500 to-teal-700 text-white border-transparent shadow"
                        : "border-teal-200 text-teal-600 hover:bg-teal-50"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              {products.hasNextPage && (
                <Link href={buildUrl({ sayfa: String(currentPage + 1) })} className="px-4 py-2 rounded-xl border border-teal-200 text-sm text-teal-600 hover:bg-teal-50 transition font-medium">
                  Sonraki →
                </Link>
              )}
            </div>
          )}
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
