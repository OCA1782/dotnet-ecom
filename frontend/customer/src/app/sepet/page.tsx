"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, Trash2, Heart, ShoppingBag, Tag, X } from "lucide-react";
import { api } from "@/lib/api";
import type { CartItem } from "@/types";
import { useI18n } from "@/contexts/I18nContext";

function DeleteModal({
  item,
  onClose,
  onDelete,
  onWishlist,
  t,
}: {
  item: CartItem;
  onClose: () => void;
  onDelete: () => void;
  onWishlist: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
        <div className="flex gap-3 mb-4">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
            {item.imageUrl
              ? <Image src={item.imageUrl} alt={item.productName} width={48} height={48} className="w-full h-full object-contain p-1" />
              : <span>📦</span>}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm line-clamp-2">{item.productName}</p>
            {item.variantName && <p className="text-xs text-slate-500">{item.variantName}</p>}
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-4">{t('cart.delete.modal.question')}</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onWishlist}
            className="flex items-center justify-center gap-2 w-full bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-sm py-2.5 rounded-xl transition"
          >
            <Heart className="w-4 h-4" /> {t('cart.delete.modal.to_wishlist')}
          </button>
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-2 w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm py-2.5 rounded-xl transition"
          >
            <Trash2 className="w-4 h-4" /> {t('cart.delete.modal.direct')}
          </button>
        </div>
      </div>
    </div>
  );
}

function CartItemRow({
  item,
  onUpdate,
  onToggle,
  onDelete,
  dimmed = false,
  t,
}: {
  item: CartItem;
  onUpdate: (id: string, qty: number) => Promise<void>;
  onToggle: (id: string, selected: boolean) => Promise<void>;
  onDelete: () => void;
  dimmed?: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className={`bg-white border rounded-xl p-4 flex gap-3 transition ${dimmed ? "opacity-50 border-slate-100" : "border-slate-200"}`}>
      <div className="flex items-start pt-1 shrink-0">
        <input
          type="checkbox"
          checked={item.isSelected}
          onChange={e => onToggle(item.cartItemId, e.target.checked)}
          className="w-4 h-4 accent-teal-600 cursor-pointer"
          aria-label={item.productName}
        />
      </div>
      <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
        {item.imageUrl
          ? <Image src={item.imageUrl} alt={item.productName} width={64} height={64} className="object-contain w-full h-full p-1" />
          : <span className="text-2xl">📦</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 text-sm line-clamp-1">{item.productName}</p>
        {item.variantName && <p className="text-xs text-slate-500 mt-0.5">{item.variantName}</p>}
        <p className="text-xs text-slate-400 mt-0.5">SKU: {item.sku}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => onUpdate(item.cartItemId, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition disabled:opacity-30"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
            <button
              onClick={() => onUpdate(item.cartItemId, item.quantity + 1)}
              disabled={item.quantity >= item.availableStock}
              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition disabled:opacity-30"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title={t('cart.item.remove_title')}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-slate-900 text-sm">{formatPrice(item.lineTotal)}</p>
        <p className="text-xs text-slate-400 mt-0.5">{formatPrice(item.unitPrice)} {t('cart.item.unit_price')}</p>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { t } = useI18n();
  const { cart, loading, fetchCart, updateItem, removeItem, toggleSelection, applyCoupon, removeCoupon } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CartItem | null>(null);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    if (cart?.couponCode) { setCouponError(t('cart.coupon.remove_existing')); return; }
    setCouponLoading(true);
    setCouponError(null);
    const error = await applyCoupon(couponInput.trim());
    if (error) setCouponError(error);
    else setCouponInput("");
    setCouponLoading(false);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await removeItem(deleteTarget.cartItemId);
    setDeleteTarget(null);
  }

  async function handleDeleteAndWishlist() {
    if (!deleteTarget) return;
    try { await api.post(`/api/wishlist/${deleteTarget.productId}`, {}); } catch { /* already in wishlist */ }
    await removeItem(deleteTarget.cartItemId);
    setDeleteTarget(null);
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">{t('cart.loading')}</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <p className="text-xl text-slate-500 mb-4">{t('cart.empty')}</p>
        <Link href="/urunler" className="inline-block bg-teal-600 text-white px-6 py-2.5 rounded-xl hover:bg-teal-700 transition">
          {t('cart.empty.shop_btn')}
        </Link>
      </div>
    );
  }

  const selected = cart.items.filter(i => i.isSelected);
  const deselected = cart.items.filter(i => !i.isSelected);
  const selectedQty = selected.reduce((s, i) => s + i.quantity, 0);
  const selectedSubTotal = selected.reduce((s, i) => s + i.lineTotal, 0);
  const selectedShipping = selectedSubTotal >= 500 ? 0 : 29.90;
  const selectedTotal = Math.max(0, selectedSubTotal + selectedShipping - cart.discountAmount);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {deleteTarget && (
        <DeleteModal
          item={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDelete={handleDeleteConfirm}
          onWishlist={handleDeleteAndWishlist}
          t={t}
        />
      )}

      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        {t('cart.title')}
        <span className="ml-2 text-base font-normal text-slate-400">
          ({cart.items.length} {t('cart.unit')}
          {selected.length < cart.items.length ? `, ${selected.length} ${t('cart.selected')}` : ""})
        </span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">

          {selected.map(item => (
            <CartItemRow
              key={item.cartItemId}
              item={item}
              onUpdate={updateItem}
              onToggle={toggleSelection}
              onDelete={() => setDeleteTarget(item)}
              t={t}
            />
          ))}

          {deselected.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                {t('cart.later.label')} ({deselected.length})
              </p>
              <div className="space-y-2">
                {deselected.map(item => (
                  <CartItemRow
                    key={item.cartItemId}
                    item={item}
                    onUpdate={updateItem}
                    onToggle={toggleSelection}
                    onDelete={() => setDeleteTarget(item)}
                    dimmed
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Coupon */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-teal-600" />
              <p className="text-sm font-medium text-slate-700">{t('cart.coupon.title')}</p>
              <span className="text-xs text-slate-400">{t('cart.coupon.hint')}</span>
            </div>
            {cart.couponCode ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-sm font-mono font-semibold text-green-700">{cart.couponCode}</span>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{t('cart.coupon.applied')}</span>
                </div>
                <button
                  onClick={() => removeCoupon()}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                  onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
                  placeholder={t('cart.coupon.placeholder')}
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-mono uppercase"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  className="bg-teal-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-teal-700 transition disabled:opacity-50 shrink-0"
                >
                  {couponLoading ? t('cart.coupon.applying') : t('cart.coupon.apply')}
                </button>
              </div>
            )}
            {couponError && <p className="mt-2 text-xs text-red-600">{couponError}</p>}
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 sticky top-24 space-y-3">
            <h2 className="font-semibold text-slate-900 mb-1">{t('cart.summary.title')}</h2>
            {selected.length < cart.items.length && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
                {t('cart.summary.only_selected').replace('{n}', selected.length.toString())}
              </p>
            )}
            <div className="flex justify-between text-sm text-slate-600">
              <span>{t('cart.summary.subtotal').replace('{n}', selectedQty.toString())}</span>
              <span>{formatPrice(selectedSubTotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>{t('cart.summary.shipping')}</span>
              <span>{selectedShipping === 0 ? t('cart.summary.shipping_free') : formatPrice(selectedShipping)}</span>
            </div>
            {cart.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>{t('cart.summary.discount')} {cart.couponCode && <span className="font-mono">({cart.couponCode})</span>}</span>
                <span>−{formatPrice(cart.discountAmount)}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-slate-900">
              <span>{t('cart.summary.total')}</span>
              <span>{formatPrice(selectedTotal)}</span>
            </div>
            {selected.length > 0 ? (
              <Link
                href="/odeme"
                className="block w-full text-center bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 transition mt-2"
              >
                {t('cart.summary.checkout_btn').replace('{n}', selectedQty.toString())}
              </Link>
            ) : (
              <p className="text-center text-xs text-slate-400 py-3 border border-dashed border-slate-200 rounded-xl">
                {t('cart.summary.select_to_continue')}
              </p>
            )}
            <Link href="/urunler" className="block w-full text-center text-sm text-slate-500 hover:text-slate-900 transition">
              {t('cart.summary.continue_shopping')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
