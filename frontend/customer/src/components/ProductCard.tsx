"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useCompare } from "@/contexts/CompareContext";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import type { ProductListItem } from "@/types";

export default function ProductCard({ product, initialLiked = false }: {
  product: ProductListItem;
  initialLiked?: boolean;
}) {
  const { t } = useI18n();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { isComparing, addProduct, removeProduct, isFull } = useCompare();
  const router = useRouter();
  const comparing = isComparing(product.id);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [liked, setLiked] = useState(initialLiked);
  const [liking, setLiking] = useState(false);

  async function handleToggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (!user) { router.push("/giris"); return; }
    if (liking) return;
    setLiking(true);
    try {
      if (liked) {
        await api.delete(`/api/wishlist/${product.id}`);
      } else {
        await api.post(`/api/wishlist/${product.id}`, {});
      }
      setLiked(l => !l);
    } catch {
      // silent
    } finally {
      setLiking(false);
    }
  }

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      await addToCart(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("product.add_error");
      setCartError(msg);
      setTimeout(() => setCartError(null), 3000);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="product-card bg-white rounded-2xl border border-[#E3EFEE] overflow-hidden hover:shadow-xl hover:shadow-[#12304A]/10 hover:-translate-y-1 transition-all duration-200 group flex flex-col">
      <Link href={`/urun/${product.slug}`} className="block relative">
        {product.discountPrice && (
          <span className="absolute top-2 left-2 z-10 bg-[#FF7A45] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
            {t("product.sale_badge")}
          </span>
        )}
        <button
          onClick={e => {
            e.preventDefault();
            if (comparing) removeProduct(product.id);
            else addProduct(product);
          }}
          disabled={!comparing && isFull}
          className={`absolute bottom-2 left-2 z-10 w-7 h-7 flex items-center justify-center rounded-full shadow transition-all text-xs font-bold ${
            comparing ? "bg-teal-500 text-white" : isFull ? "bg-white/50 text-slate-300 cursor-not-allowed" : "bg-white/80 text-slate-400 hover:bg-teal-100 hover:text-teal-600"
          } backdrop-blur-sm`}
          title={comparing ? t("product.compare.remove") : isFull ? t("product.compare.full") : t("product.compare.add")}
        >
          ⇄
        </button>
        <button
          onClick={handleToggleWishlist}
          disabled={liking}
          className={`absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full shadow transition-all ${
            liked ? "bg-red-500 text-white" : "bg-white/80 text-slate-400 hover:text-red-400"
          } backdrop-blur-sm`}
          title={liked ? t("product.wishlist.remove") : t("product.wishlist.add")}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
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

        {product.availableStock > 0 && product.price >= 500 && (
          <p className="text-xs text-teal-600 font-semibold mt-2">{t("product.free_shipping")}</p>
        )}
        {cartError && (
          <p className="text-xs text-red-500 mt-2 leading-tight">{cartError}</p>
        )}
        {product.availableStock === 0 ? (
          <p className="text-xs text-red-500 mt-3 font-medium">{t("product.out_of_stock_short")}</p>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className={`mt-3 w-full text-white text-xs font-semibold py-2.5 rounded-xl transition ${
              added
                ? "bg-green-600 hover:bg-green-700"
                : cartError
                ? "bg-red-500 hover:bg-red-600"
                : "bg-[#12304A] hover:bg-[#FF7A45]"
            } disabled:opacity-60`}
          >
            {adding ? t("product.adding") : added ? t("product.added") : cartError ? t("product.retry") : t("product.add_to_cart")}
          </button>
        )}
      </div>
    </div>
  );
}
