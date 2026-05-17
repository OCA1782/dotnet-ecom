"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { formatPrice } from "@/lib/utils";

export default function FavorilerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { items, loading, toggle } = useWishlist(!!user);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/giris");
  }, [authLoading, user, router]);

  if (authLoading || (!user && !authLoading)) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Favorilerim</h1>
          <p className="text-sm text-slate-500 mt-1">{items.length} ürün</p>
        </div>
        <Link href="/urunler" className="text-sm text-teal-600 hover:text-teal-800 font-medium">
          Alışverişe Devam →
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Yükleniyor...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <div className="text-5xl mb-4">🤍</div>
          <p className="text-slate-500 font-medium">Henüz favori ürün eklemediniz.</p>
          <p className="text-slate-400 text-sm mt-1">Ürün sayfasındaki kalp ikonuna tıklayarak ekleyebilirsiniz.</p>
          <Link href="/urunler"
            className="inline-block mt-5 px-5 py-2.5 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition font-semibold">
            Ürünleri Keşfet
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
              <Link href={`/urun/${item.slug}`} className="block">
                <div className="aspect-square bg-slate-50 overflow-hidden">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.name}
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <Link href={`/urun/${item.slug}`}>
                  <p className="font-semibold text-slate-800 text-sm leading-snug hover:text-teal-700 transition-colors line-clamp-2">
                    {item.name}
                  </p>
                </Link>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    {item.discountPrice ? (
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-teal-700">{formatPrice(item.discountPrice)}</span>
                        <span className="text-xs text-slate-400 line-through">{formatPrice(item.price)}</span>
                      </div>
                    ) : (
                      <span className="font-bold text-slate-800">{formatPrice(item.price)}</span>
                    )}
                  </div>
                  <button
                    onClick={() => toggle(item.productId)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition"
                    title="Favorilerden Çıkar">
                    ❤️
                  </button>
                </div>
                {!item.isActive && (
                  <p className="text-xs text-slate-400 mt-2 bg-slate-50 rounded-lg px-2 py-1">Bu ürün artık satışta değil</p>
                )}
                {item.isActive && (
                  <Link href={`/urun/${item.slug}`}
                    className="mt-3 block text-center px-4 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition font-semibold">
                    Ürüne Git
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
