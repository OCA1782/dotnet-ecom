"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { cart, loading, fetchCart, updateItem, removeItem, applyCoupon, removeCoupon } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    const error = await applyCoupon(couponInput.trim());
    if (error) setCouponError(error);
    else setCouponInput("");
    setCouponLoading(false);
  }

  async function handleRemoveCoupon() {
    await removeCoupon();
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-zinc-400">
        Sepet yükleniyor...
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-xl text-zinc-500 mb-4">Sepetiniz boş</p>
        <Link href="/urunler" className="inline-block bg-zinc-900 text-white px-6 py-2.5 rounded-lg hover:bg-zinc-700 transition">
          Alışverişe Başla
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-zinc-900 mb-8">Sepetim</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item.cartItemId} className="bg-white border border-zinc-200 rounded-xl p-4 flex gap-4">
              <div className="w-20 h-20 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.productName} className="object-contain w-full h-full p-2" />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900 text-sm line-clamp-2">{item.productName}</p>
                {item.variantName && <p className="text-xs text-zinc-500 mt-0.5">{item.variantName}</p>}
                <p className="text-xs text-zinc-400 mt-0.5">SKU: {item.sku}</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center border border-zinc-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateItem(item.cartItemId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="px-2.5 py-1 text-zinc-600 hover:bg-zinc-100 transition disabled:opacity-40 text-sm"
                    >
                      −
                    </button>
                    <span className="px-3 text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateItem(item.cartItemId, item.quantity + 1)}
                      disabled={item.quantity >= item.availableStock}
                      className="px-2.5 py-1 text-zinc-600 hover:bg-zinc-100 transition disabled:opacity-40 text-sm"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.cartItemId)}
                    className="text-xs text-red-500 hover:text-red-700 transition"
                  >
                    Kaldır
                  </button>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-zinc-900">{formatPrice(item.lineTotal)}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{formatPrice(item.unitPrice)} / adet</p>
              </div>
            </div>
          ))}

          {/* Coupon input */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4">
            <p className="text-sm font-medium text-zinc-700 mb-3">İndirim Kuponu</p>
            {cart.couponCode ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-sm font-mono font-semibold text-green-700">{cart.couponCode}</span>
                  <span className="text-xs text-green-600">Uygulandı</span>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-xs text-red-500 hover:text-red-700 transition shrink-0"
                >
                  Kaldır
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  placeholder="Kupon kodunuzu girin"
                  className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono uppercase"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  className="bg-zinc-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-zinc-700 transition disabled:opacity-50 shrink-0"
                >
                  {couponLoading ? "..." : "Uygula"}
                </button>
              </div>
            )}
            {couponError && (
              <p className="mt-2 text-xs text-red-600">{couponError}</p>
            )}
          </div>
        </div>

        {/* Order summary */}
        <div>
          <div className="bg-white border border-zinc-200 rounded-xl p-6 sticky top-24 space-y-3">
            <h2 className="font-semibold text-zinc-900 mb-4">Sipariş Özeti</h2>
            <div className="flex justify-between text-sm text-zinc-600">
              <span>Ara Toplam</span>
              <span>{formatPrice(cart.subTotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-600">
              <span>KDV</span>
              <span>{formatPrice(cart.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-600">
              <span>Kargo</span>
              <span>{cart.shippingAmount === 0 ? "Ücretsiz" : formatPrice(cart.shippingAmount)}</span>
            </div>
            {cart.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>İndirim {cart.couponCode && <span className="font-mono">({cart.couponCode})</span>}</span>
                <span>−{formatPrice(cart.discountAmount)}</span>
              </div>
            )}
            <div className="border-t border-zinc-200 pt-3 flex justify-between font-bold text-zinc-900">
              <span>Toplam</span>
              <span>{formatPrice(cart.grandTotal)}</span>
            </div>
            <Link
              href="/odeme"
              className="block w-full text-center bg-zinc-900 text-white font-semibold py-3 rounded-xl hover:bg-zinc-700 transition mt-4"
            >
              Siparişi Tamamla
            </Link>
            <Link
              href="/urunler"
              className="block w-full text-center text-sm text-zinc-500 hover:text-zinc-900 transition"
            >
              Alışverişe Devam Et
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
