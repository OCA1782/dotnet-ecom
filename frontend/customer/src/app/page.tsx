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

const CATEGORY_COLORS = [
  "from-pink-400 to-rose-500",
  "from-violet-400 to-indigo-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-blue-500",
  "from-fuchsia-400 to-purple-500",
  "from-lime-400 to-green-500",
  "from-red-400 to-pink-500",
];

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-14">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-3xl text-white p-12 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-pink-300 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 backdrop-blur-sm">
            🎉 Yeni Sezon İndirimleri Başladı
          </span>
          <h1 className="text-5xl font-extrabold mb-3 tracking-tight">Hoş Geldiniz</h1>
          <p className="text-indigo-100 text-lg mb-8">Binlerce ürün, en uygun fiyatlar, hızlı teslimat</p>
          <Link
            href="/urunler"
            className="inline-block bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-2xl hover:bg-indigo-50 transition shadow-lg shadow-indigo-900/20"
          >
            Alışverişe Başla →
          </Link>
        </div>
      </section>

      {/* Kategoriler */}
      {categories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-zinc-900">Kategoriler</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/urunler?kategori=${cat.slug}`}
                className="group rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-200"
              >
                <div className={`bg-gradient-to-br ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} p-5 text-center`}>
                  <div className="w-12 h-12 bg-white/25 rounded-2xl mx-auto mb-2 flex items-center justify-center text-2xl backdrop-blur-sm">
                    📦
                  </div>
                  <span className="text-sm font-semibold text-white drop-shadow">{cat.name}</span>
                </div>
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
            <Link
              href="/urunler"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Tümünü Gör →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product) => (
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
                    <img src={product.imageUrl} alt={product.name} className="object-contain w-full h-full p-4" />
                  ) : (
                    <span className="text-4xl">📦</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-indigo-400 font-medium mb-1">{product.brandName}</p>
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
        </section>
      )}

      {/* Banner */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl p-8 text-white">
          <p className="text-sm font-semibold opacity-80 mb-1">Fırsatı Kaçırma</p>
          <h3 className="text-2xl font-bold mb-3">%40'a Varan İndirim</h3>
          <Link href="/urunler" className="inline-block bg-white text-orange-600 font-semibold text-sm px-5 py-2 rounded-xl hover:bg-orange-50 transition">
            İncele →
          </Link>
        </div>
        <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl p-8 text-white">
          <p className="text-sm font-semibold opacity-80 mb-1">500 TL Üzeri</p>
          <h3 className="text-2xl font-bold mb-3">Ücretsiz Kargo</h3>
          <Link href="/urunler" className="inline-block bg-white text-emerald-600 font-semibold text-sm px-5 py-2 rounded-xl hover:bg-emerald-50 transition">
            Alışverişe Başla →
          </Link>
        </div>
      </section>
    </div>
  );
}
