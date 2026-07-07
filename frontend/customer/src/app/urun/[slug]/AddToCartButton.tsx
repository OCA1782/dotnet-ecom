"use client";

import { useState, useEffect, useRef } from "react";
import { useCart } from "@/hooks/useCart";
import type { ProductVariant } from "@/types";
import { useI18n } from "@/contexts/I18nContext";

interface Props {
  productId: string;
  variants: ProductVariant[];
  availableStock: number;
}

export default function AddToCartButton({ productId, variants, availableStock }: Props) {
  const { t } = useI18n();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    variants.length === 1 ? variants[0].id : undefined
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [variantError, setVariantError] = useState(false);
  const variantRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();

  // Auto-dismiss success/error message after 4 seconds
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const effectiveStock =
    variants.length > 0
      ? (variants.find((v) => v.id === selectedVariantId)?.availableStock ?? 0)
      : availableStock;

  const needsVariant = variants.length > 1 && !selectedVariantId;
  const canAdd = effectiveStock > 0 && !needsVariant;

  async function handleAdd() {
    if (needsVariant) {
      setVariantError(true);
      variantRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    setVariantError(false);
    setLoading(true);
    setMessage(null);
    try {
      await addToCart(productId, quantity, selectedVariantId);
      setMessage({ text: t("prod2.cart.added"), type: "success" });
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : t("product.add_error"), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {variants.length > 1 && (
        <div>
          <p className={`text-sm font-medium mb-2 transition ${variantError ? "text-red-600" : "text-slate-700"}`}>
            {t("prod2.cart.variant_label")}
            {variantError && <span className="ml-1 text-xs font-normal">— lütfen bir seçenek seçin</span>}
          </p>
          <div
            ref={variantRef}
            className={`flex flex-wrap gap-2 rounded-xl transition ${variantError ? "p-2 ring-2 ring-red-300 bg-red-50" : ""}`}
          >
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => { setSelectedVariantId(v.id); setVariantError(false); }}
                disabled={v.availableStock === 0}
                className={`px-3 py-1.5 rounded-lg border text-sm transition ${
                  selectedVariantId === v.id
                    ? "border-teal-600 bg-teal-600 text-white"
                    : v.availableStock === 0
                    ? "border-slate-200 text-slate-300 cursor-not-allowed"
                    : "border-slate-300 hover:border-slate-500"
                }`}
              >
                {(() => { try { return JSON.parse(v.attributesJson ?? "")?.name ?? v.sku; } catch { return v.sku; } })()}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-slate-700">{t("prod2.cart.quantity_label")}</p>
        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="px-3 py-2 text-slate-600 hover:bg-slate-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            −
          </button>
          <span className="px-4 py-2 text-sm font-medium min-w-[2.5rem] text-center">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(effectiveStock, q + 1))}
            disabled={quantity >= effectiveStock || effectiveStock === 0}
            className="px-3 py-2 text-slate-600 hover:bg-slate-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
        {effectiveStock > 0 && effectiveStock <= 5 && (
          <span className="text-xs text-orange-600 font-medium">{t("prod2.cart.last_units").replace("{n}", String(effectiveStock))}</span>
        )}
      </div>

      <button
        onClick={handleAdd}
        disabled={effectiveStock === 0 || loading}
        className="w-full py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed bg-teal-600 text-white hover:bg-teal-700"
      >
        {loading
          ? t("prod2.cart.adding")
          : effectiveStock === 0
          ? t("prod2.detail.out_of_stock")
          : t("prod2.cart.add_btn")}
      </button>

      {message && (
        <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm ${
          message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="opacity-50 hover:opacity-100 text-base leading-none shrink-0">×</button>
        </div>
      )}
    </div>
  );
}
