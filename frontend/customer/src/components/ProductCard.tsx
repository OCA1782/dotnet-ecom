"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import type { ProductListItem } from "@/types";

export default function ProductCard({ product }: { product: ProductListItem }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      await addToCart(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch {
      // silent
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E3EFEE] overflow-hidden hover:shadow-xl hover:shadow-[#12304A]/10 hover:-translate-y-1 transition-all duration-200 group flex flex-col">
      <Link href={`/urun/${product.slug}`} className="block relative">
        {product.discountPrice && (
          <span className="absolute top-2 left-2 z-10 bg-[#FF7A45] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
            İndirim
          </span>
        )}
        <div className="h-44 bg-gradient-to-b from-[#F0FBFA] to-white flex items-center justify-center overflow-hidden">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="object-contain w-full h-full p-4" />
          ) : (
            <span className="text-5xl">📦</span>
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        {product.brandName && (
          <p className="text-xs text-teal-500 font-semibold mb-1">{product.brandName}</p>
        )}
        <Link href={`/urun/${product.slug}`} className="flex-1">
          <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm group-hover:text-teal-700 transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center gap-2">
          {product.discountPrice ? (
            <>
              <span className="font-bold text-[#008F86] text-base">{formatPrice(product.discountPrice)}</span>
              <span className="text-xs text-slate-400 line-through">{formatPrice(product.price)}</span>
            </>
          ) : (
            <span className="font-bold text-[#008F86] text-base">{formatPrice(product.price)}</span>
          )}
        </div>

        {product.availableStock > 0 && (
          <p className="text-xs text-teal-600 font-semibold mt-2">✓ Ücretsiz kargo</p>
        )}
        {product.availableStock === 0 ? (
          <p className="text-xs text-red-500 mt-3 font-medium">Stokta Yok</p>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className={`mt-3 w-full text-white text-xs font-semibold py-2.5 rounded-xl transition ${
              added
                ? "bg-green-600 hover:bg-green-700"
                : "bg-[#12304A] hover:bg-[#FF7A45]"
            } disabled:opacity-60`}
          >
            {adding ? "Ekleniyor..." : added ? "✓ Eklendi" : "Sepete Ekle"}
          </button>
        )}
      </div>
    </div>
  );
}
