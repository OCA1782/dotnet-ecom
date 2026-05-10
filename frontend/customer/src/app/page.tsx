import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Category, ProductListItem, PaginatedList } from "@/types";
import ProductCard from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Ana Sayfa | Keyvora",
  description: "Keyifli alışverişin yeni adresi. Binlerce ürün, güvenli ödeme, hızlı teslimat.",
  openGraph: {
    title: "Keyvora — Keyifli Alışverişin Yeni Adresi",
    description: "Sevdiğin ürünleri keşfet, güvenle satın al, hızlı teslimatla kapına gelsin.",
    type: "website",
  },
};

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
    const data = await api.get<PaginatedList<ProductListItem>>("/api/products?page=1&pageSize=4");
    return data.items.filter(p => p.discountPrice != null);
  } catch { return []; }
}

export default async function HomePage() {
  const [categoriesRaw, products, discountProducts] = await Promise.all([getCategories(), getFeaturedProducts(), getDiscountProducts()]);
  const categories = categoriesRaw.length > 0 ? categoriesRaw : FALLBACK_CATEGORIES;

  return (
    <div>

      {/* ── Hero ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <section className="relative bg-gradient-to-br from-[#19B7B1] via-[#0c9e98] to-[#12304A] rounded-3xl text-white overflow-hidden">
          {/* Dekoratif arka plan */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-[#FF7A45]/15 rounded-full blur-3xl" />
          </div>
          {/* Watermark logo sağda */}
          <div className="absolute right-8 bottom-4 w-72 h-72 pointer-events-none hidden lg:block opacity-[0.07]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="" className="w-full h-full object-contain" style={{ filter: "brightness(100)" }} />
          </div>

          <div className="relative px-8 py-16 lg:px-16 lg:py-20">
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm border border-white/20">
              🎉 Yeni Sezon İndirimleri Başladı
            </span>
            <h1 className="text-4xl lg:text-6xl font-extrabold mb-5 tracking-tight leading-tight max-w-2xl">
              Keyifli Alışverişin<br />
              <span className="text-[#FF7A45]">Yeni Adresi</span>
            </h1>
            <p className="text-teal-100 text-lg lg:text-xl mb-10 max-w-lg leading-relaxed">
              Sevdiğin ürünleri keşfet, güvenle satın al,<br className="hidden lg:block" /> hızlı teslimatla kapına gelsin.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/urunler"
                className="inline-flex items-center gap-2 bg-[#FF7A45] hover:bg-[#e86c3a] hover:-translate-y-0.5 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-orange-900/20 text-base"
              >
                Alışverişe Başla →
              </Link>
              <Link
                href="/urunler"
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-8 py-4 rounded-2xl backdrop-blur-sm transition border border-white/30 text-base"
              >
                Kampanyaları Gör
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* ── Avantajlar — lacivert şerit ── */}
      <div className="bg-[#12304A] mt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "🚀", title: "Hızlı Kargo", desc: "2-3 iş günü teslimat" },
              { icon: "🔒", title: "Güvenli Ödeme", desc: "256-bit SSL şifreleme" },
              { icon: "↩️", title: "Kolay İade", desc: "14 gün iade garantisi" },
              { icon: "💬", title: "7/24 Destek", desc: "Her zaman yanınızdayız" },
            ].map(item => (
              <div key={item.title} className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center text-xl shrink-0">
                  {item.icon}
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
              <h2 className="text-2xl font-extrabold text-slate-900">Kategoriler</h2>
              <p className="text-slate-500 text-sm mt-1">İhtiyacına göre kategorilere göz at</p>
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
                      ? <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> // eslint-disable-line @next/next/no-img-element
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
                <h2 className="text-2xl font-extrabold text-slate-900">Öne Çıkan Ürünler</h2>
                <p className="text-slate-500 text-sm mt-1">Popüler ürünleri avantajlı fiyatlarla keşfet</p>
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
                <h2 className="text-2xl font-extrabold text-slate-900">Fırsat İndirimi</h2>
                <p className="text-slate-500 text-sm mt-1">İndirimli ürünleri kaçırma</p>
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
          <div className="mb-7">
            <h2 className="text-2xl font-extrabold text-slate-900">Kampanyalar</h2>
            <p className="text-slate-500 text-sm mt-1">Kaçırmak istemeyeceğin fırsatlar</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="relative overflow-hidden bg-gradient-to-br from-[#FF7A45] to-[#d95f28] rounded-2xl p-8 text-white">
              <div className="absolute right-4 bottom-0 text-[110px] font-black text-white/15 leading-none select-none">%</div>
              <p className="text-sm font-semibold opacity-80 mb-2">Fırsatı Kaçırma</p>
              <h3 className="text-3xl font-extrabold mb-4">%40'a Varan İndirim</h3>
              <Link href="/urunler" className="inline-block bg-white text-[#FF7A45] font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-orange-50 transition">
                İncele →
              </Link>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-[#19B7B1] to-[#0c8f8a] rounded-2xl p-8 text-white">
              <div className="absolute right-4 bottom-0 text-[110px] font-black text-white/15 leading-none select-none">∞</div>
              <p className="text-sm font-semibold opacity-80 mb-2">500 TL Üzeri</p>
              <h3 className="text-3xl font-extrabold mb-4">Ücretsiz Kargo</h3>
              <Link href="/urunler" className="inline-block bg-white text-[#19B7B1] font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-teal-50 transition">
                Alışverişe Başla →
              </Link>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-[#12304A] to-[#1a4670] rounded-2xl p-8 text-white">
              <div className="absolute right-4 bottom-0 text-[110px] font-black text-white/15 leading-none select-none">★</div>
              <p className="text-sm font-semibold opacity-80 mb-2">Yeni Gelenler</p>
              <h3 className="text-3xl font-extrabold mb-4">Yeni Sezon Ürünleri</h3>
              <Link href="/urunler" className="inline-block bg-white text-[#12304A] font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-slate-50 transition">
                Keşfet →
              </Link>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-8 text-white">
              <div className="absolute right-4 bottom-0 text-[110px] font-black text-white/15 leading-none select-none">#1</div>
              <p className="text-sm font-semibold opacity-80 mb-2">En Çok Tercih Edilen</p>
              <h3 className="text-3xl font-extrabold mb-4">Çok Satanlar</h3>
              <Link href="/urunler" className="inline-block bg-white text-amber-600 font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-amber-50 transition">
                Hepsini Gör →
              </Link>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
