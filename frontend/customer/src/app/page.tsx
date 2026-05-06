import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Category, ProductListItem, PaginatedList } from "@/types";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ana Sayfa",
  description: "Güvenilir alışverişin adresi. Binlerce ürün arasından seçiminizi yapın.",
  openGraph: {
    title: "Ecom — Online Alışveriş",
    description: "Güvenilir alışverişin adresi.",
    type: "website",
  },
};

async function getCategories(): Promise<Category[]> {
  try {
    return await api.get<Category[]>("/api/categories");
  } catch {
    return [];
  }
}

async function getFeaturedProducts(): Promise<ProductListItem[]> {
  try {
    const data = await api.get<PaginatedList<ProductListItem>>("/api/products?page=1&pageSize=8");
    return data.items;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Hero */}
      <section className="bg-zinc-900 rounded-2xl text-white p-10 text-center">
        <h1 className="text-4xl font-bold mb-3">Hoş Geldiniz</h1>
        <p className="text-zinc-300 mb-6">Binlerce ürün arasından seçiminizi yapın</p>
        <Link
          href="/urunler"
          className="inline-block bg-white text-zinc-900 font-semibold px-6 py-3 rounded-lg hover:bg-zinc-100 transition"
        >
          Alışverişe Başla
        </Link>
      </section>

      {/* Kategoriler */}
      {categories.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">Kategoriler</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/urunler?kategori=${cat.slug}`}
                className="bg-white rounded-xl p-4 text-center border border-zinc-200 hover:border-zinc-400 hover:shadow-sm transition"
              >
                <div className="w-12 h-12 bg-zinc-100 rounded-full mx-auto mb-2 flex items-center justify-center text-xl">
                  📦
                </div>
                <span className="text-sm font-medium text-zinc-700">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Öne Çıkan Ürünler */}
      {products.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-zinc-900">Öne Çıkan Ürünler</h2>
            <Link href="/urunler" className="text-sm text-zinc-600 hover:text-zinc-900 underline">
              Tümünü Gör
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/urun/${product.slug}`}
                className="bg-white rounded-xl border border-zinc-200 overflow-hidden hover:shadow-md transition group"
              >
                <div className="aspect-square bg-zinc-100 flex items-center justify-center">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrl} alt={product.name} className="object-contain w-full h-full p-4" />
                  ) : (
                    <span className="text-4xl">📦</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-zinc-500 mb-1">{product.brandName}</p>
                  <h3 className="font-medium text-zinc-900 line-clamp-2 text-sm group-hover:text-zinc-700">
                    {product.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    {product.discountPrice ? (
                      <>
                        <span className="font-bold text-zinc-900">{formatPrice(product.discountPrice)}</span>
                        <span className="text-xs text-zinc-400 line-through">{formatPrice(product.price)}</span>
                      </>
                    ) : (
                      <span className="font-bold text-zinc-900">{formatPrice(product.price)}</span>
                    )}
                  </div>
                  {product.availableStock === 0 && (
                    <span className="text-xs text-red-500 mt-1 block">Stokta Yok</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
