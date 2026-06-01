"use client";

import Link from "next/link";
import { X, BarChart2 } from "lucide-react";
import { useCompare } from "@/contexts/CompareContext";
import { formatPrice } from "@/lib/utils";

export default function CompareBar() {
  const { products, removeProduct, clearProducts } = useCompare();
  if (products.length === 0) return null;

  const compareUrl = `/karsilastir?ids=${products.map(p => p.id).join(",")}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#12304A] text-white shadow-2xl border-t-2 border-teal-500">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <span className="text-sm font-semibold whitespace-nowrap text-teal-300">
          Karşılaştır ({products.length}/4)
        </span>

        <div className="flex-1 flex gap-2 overflow-x-auto min-w-0">
          {products.map(p => (
            <div key={p.id} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 min-w-0 flex-shrink-0">
              {p.imageUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={p.imageUrl} alt={p.name} className="w-8 h-8 object-contain rounded" />
                : <span className="text-xl">📦</span>
              }
              <div className="min-w-0">
                <p className="text-xs font-medium truncate max-w-[110px] leading-tight">{p.name}</p>
                <p className="text-xs text-teal-300">{formatPrice(p.discountPrice ?? p.price)}</p>
              </div>
              <button
                onClick={() => removeProduct(p.id)}
                className="ml-1 text-white/50 hover:text-white transition"
                aria-label="Kaldır">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {Array.from({ length: 4 - products.length }).map((_, i) => (
            <div key={i} className="flex items-center justify-center bg-white/5 border border-white/15 border-dashed rounded-lg px-5 py-1.5 flex-shrink-0">
              <span className="text-xs text-white/30">+ ekle</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={clearProducts}
            className="text-xs text-white/50 hover:text-white underline transition">
            Temizle
          </button>
          {products.length >= 2 && (
            <Link
              href={compareUrl}
              className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition whitespace-nowrap">
              <BarChart2 className="w-4 h-4" />
              Karşılaştır
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
