"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import type { ProductVariant } from "@/types";

interface Props {
  productId: string;
  variants: ProductVariant[];
  availableStock: number;
}

export default function AddToCartButton({ productId, variants, availableStock }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    variants.length === 1 ? variants[0].id : undefined
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const { addToCart } = useCart();

  const effectiveStock =
    variants.length > 0
      ? (variants.find((v) => v.id === selectedVariantId)?.availableStock ?? 0)
      : availableStock;

  const canAdd = effectiveStock > 0 && (variants.length === 0 || !!selectedVariantId);

  async function handleAdd() {
    setLoading(true);
    setMessage(null);
    try {
      await addToCart(productId, quantity, selectedVariantId);
      setMessage({ text: "Sepete eklendi!", type: "success" });
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Hata oluştu", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Variant selection */}
      {variants.length > 1 && (
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Seçenek</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariantId(v.id)}
                disabled={v.availableStock === 0}
                className={`px-3 py-1.5 rounded-lg border text-sm transition ${
                  selectedVariantId === v.id
                    ? "border-teal-600 bg-teal-600 text-white"
                    : v.availableStock === 0
                    ? "border-slate-200 text-slate-300 cursor-not-allowed"
                    : "border-slate-300 hover:border-slate-500"
                }`}
              >
                {v.attributesJson ? JSON.parse(v.attributesJson)?.name ?? v.sku : v.sku}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-slate-700">Adet</p>
        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-slate-600 hover:bg-slate-100 transition"
          >
            −
          </button>
          <span className="px-4 py-2 text-sm font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(effectiveStock, q + 1))}
            className="px-3 py-2 text-slate-600 hover:bg-slate-100 transition"
          >
            +
          </button>
        </div>
        {effectiveStock > 0 && effectiveStock <= 5 && (
          <span className="text-xs text-orange-600">Son {effectiveStock} adet</span>
        )}
      </div>

      {/* Add button */}
      <button
        onClick={handleAdd}
        disabled={!canAdd || loading}
        className="w-full py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 bg-teal-600 text-white hover:bg-teal-700"
      >
        {loading ? "Ekleniyor..." : !canAdd ? (effectiveStock === 0 ? "Stokta Yok" : "Seçenek Seçin") : "Sepete Ekle"}
      </button>

      {message && (
        <p className={`text-sm text-center ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
