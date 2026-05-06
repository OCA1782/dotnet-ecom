import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Category, ProductListItem, PaginatedList } from "@/types";
import { formatPrice } from "@/lib/utils";
import ProductFilters from "./ProductFilters";

type SearchParams = Promise<{
  s?: string;
  kategori?: string;
  minFiyat?: string;
  maxFiyat?: string;
  sayfa?: string;
}>;

async function getCategories(): Promise<Category[]> {
  try {
    return await api.get<Category[]>("/api/categories");
  } catch {
    return [];
  }
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
    return await api.get<PaginatedList<ProductListItem>>(`/api/products?${qs}`);
  } catch {
    return { items: [], totalCount: 0, page: 1, pageSize: 12, totalPages: 0, hasNextPage: false, hasPreviousPage: false };
  }
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams;
  const title = params.s
    ? `"${params.s}" için Arama Sonuçları`
    : params.kategori
    ? `${params.kategori.charAt(0).toUpperCase() + params.kategori.slice(1)} Ürünleri`
    : "Tüm Ürünler";
  return {
    title,
    description: `Ecom'da ${title.toLowerCase()} — uygun fiyat, hızlı teslimat.`,
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [categories, products] = await Promise.all([getCategories(), getProducts(params)]);

  const currentPage = Number(params.sayfa ?? 1);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const merged = { ...params, ...overrides };
    const qs = new URLSearchParams();
    if (merged.s) qs.set("s", merged.s);
    if (merged.kategori) qs.set("kategori", merged.kategori);
    if (merged.minFiyat) qs.set("minFiyat", merged.minFiyat);
    if (merged.maxFiyat) qs.set("maxFiyat", merged.maxFiyat);
    if (merged.sayfa && merged.sayfa !== "1") qs.set("sayfa", merged.sayfa);
    const q = qs.toString();
    return `/urunler${q ? `?${q}` : ""}`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block w-56 shrink-0">
          <ProductFilters
            categories={categories}
            activeCategory={params.kategori}
            minFiyat={params.minFiyat}
            maxFiyat={params.maxFiyat}
            searchTerm={params.s}
          />
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-indigo-400 font-medium">
              <span className="text-indigo-700 font-bold">{products.totalCount}</span> ürün bulundu
            </p>
          </div>

          {products.items.length === 0 ? (
            <div className="text-center py-24 text-zinc-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-medium text-zinc-600">Ürün bulunamadı</p>
              <Link href="/urunler" className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                Filtreleri Temizle
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.items.map((product) => (
                <Link
                  key={product.id}
                  href={`/urun/${product.slug}`}
                  className="bg-white rounded-2xl border border-indigo-100 overflow-hidden hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1 transition-all duration-200 group"
                >
                  <div className="aspect-square bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center relative">
                    {product.discountPrice && (
                      <span className="absolute top-2 left-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                        İndirim
                      </span>
                    )}
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="object-contain w-full h-full p-4"
                      />
                    ) : (
                      <span className="text-4xl">📦</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-indigo-400 font-medium mb-0.5">{product.brandName}</p>
                    <h3 className="font-semibold text-zinc-800 line-clamp-2 text-sm group-hover:text-indigo-700 transition-colors">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                      {product.discountPrice ? (
                        <>
                          <span className="font-bold text-indigo-700">{formatPrice(product.discountPrice)}</span>
                          <span className="text-xs text-zinc-400 line-through">{formatPrice(product.price)}</span>
                        </>
                      ) : (
                        <span className="font-bold text-indigo-700">{formatPrice(product.price)}</span>
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
                <Link
                  href={buildUrl({ sayfa: String(currentPage - 1) })}
                  className="px-4 py-2 rounded-xl border border-indigo-200 text-sm text-indigo-600 hover:bg-indigo-50 transition font-medium"
                >
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
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow"
                        : "border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              {products.hasNextPage && (
                <Link
                  href={buildUrl({ sayfa: String(currentPage + 1) })}
                  className="px-4 py-2 rounded-xl border border-indigo-200 text-sm text-indigo-600 hover:bg-indigo-50 transition font-medium"
                >
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
