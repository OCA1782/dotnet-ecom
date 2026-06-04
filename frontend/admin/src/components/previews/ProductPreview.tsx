"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";

interface ProductForm {
  name: string;
  shortDescription: string;
  description: string;
  price: string;
  discountPrice: string;
  brandId?: string;
  isPublished: boolean;
  isActive: boolean;
  isFeatured: boolean;
}

interface ProductImage {
  imageUrl: string;
  isMain: boolean;
}

interface Brand { id: string; name: string; }

interface ProductPreviewProps {
  form: ProductForm;
  images: ProductImage[];
  brands: Brand[];
  initialStock?: string;
}

export default function ProductPreview({ form, images, brands, initialStock }: ProductPreviewProps) {
  const [tab, setTab] = useState<"kart" | "detay">("kart");

  const price    = parseFloat(form.price)        || 0;
  const discount = parseFloat(form.discountPrice) || 0;
  const hasDiscount = discount > 0 && discount < price;
  const displayPrice = hasDiscount ? discount : price;
  const mainImage = images.find(i => i.isMain)?.imageUrl ?? images[0]?.imageUrl ?? null;
  const brandName = brands.find(b => b.id === form.brandId)?.name ?? null;
  const stock = parseInt(initialStock ?? "1") || 1;

  if (!form.name && !price) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center h-48 text-slate-400 text-xs text-center p-4">
        Ad ve fiyat girin
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1">
        {(["kart", "detay"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${tab === t ? "bg-teal-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>
            {t === "kart" ? "🃏 Kart" : "📄 Detay"}
          </button>
        ))}
      </div>

      {tab === "kart" && (
        <>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Ürün Kartı (Liste Görünümü)</p>
          {/* Product card — replicates ProductCard.tsx */}
          <div className="bg-white rounded-2xl border border-[#E3EFEE] overflow-hidden shadow-sm">
            <div className="relative">
              {hasDiscount && (
                <span className="absolute top-2 left-2 z-10 bg-[#FF7A45] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  İndirim
                </span>
              )}
              <div className="h-40 bg-gradient-to-b from-[#F0FBFA] to-white flex items-center justify-center overflow-hidden">
                {mainImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mainImage} alt={form.name} className="object-contain w-full h-full p-4" />
                ) : (
                  <span className="text-4xl">📦</span>
                )}
              </div>
            </div>

            <div className="p-4">
              {brandName && (
                <p className="text-xs text-teal-500 font-semibold mb-1">{brandName}</p>
              )}
              <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 leading-snug">
                {form.name || "Ürün Adı"}
              </h3>

              <div className="mt-2 flex items-center gap-2">
                {hasDiscount ? (
                  <>
                    <span className="font-bold text-[#008F86] text-base">{formatPrice(discount)}</span>
                    <span className="text-xs text-slate-400 line-through">{formatPrice(price)}</span>
                  </>
                ) : (
                  <span className="font-bold text-[#008F86] text-base">{price ? formatPrice(price) : "—"}</span>
                )}
              </div>

              {price >= 500 && stock > 0 && (
                <p className="text-xs text-teal-600 font-semibold mt-1.5">✓ Ücretsiz kargo</p>
              )}

              {stock === 0 ? (
                <p className="text-xs text-red-500 mt-3 font-medium">Stokta Yok</p>
              ) : (
                <div className="mt-3 w-full bg-[#12304A] text-white text-xs font-semibold py-2.5 rounded-xl text-center">
                  Sepete Ekle
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-1.5 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${form.isPublished ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
              {form.isPublished ? "Yayında" : "Taslak"}
            </span>
            {form.isFeatured && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Öne Çıkan</span>
            )}
            {hasDiscount && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                %{Math.round((1 - discount / price) * 100)} İndirim
              </span>
            )}
          </div>
        </>
      )}

      {tab === "detay" && (
        <>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Ürün Detay Sayfası</p>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            {/* Image */}
            <div className="h-44 bg-gradient-to-b from-[#F0FBFA] to-white flex items-center justify-center">
              {mainImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mainImage} alt={form.name} className="object-contain w-full h-full p-4" />
              ) : (
                <span className="text-5xl">📦</span>
              )}
            </div>

            <div className="p-4 space-y-3">
              {brandName && (
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{brandName}</p>
              )}
              <h1 className="text-base font-bold text-slate-900">{form.name || "Ürün Adı"}</h1>

              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-900">{price ? formatPrice(displayPrice) : "—"}</span>
                {hasDiscount && (
                  <span className="text-sm text-slate-400 line-through">{formatPrice(price)}</span>
                )}
              </div>

              {form.shortDescription && (
                <p className="text-xs text-slate-500 leading-relaxed">{form.shortDescription}</p>
              )}

              <span className={`inline-block text-xs font-medium ${stock === 0 ? "text-red-600" : "text-green-600"}`}>
                {stock === 0 ? "Stokta Yok" : "Stokta Var"}
              </span>

              {form.description && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Ürün Açıklaması</p>
                  <div
                    className="text-xs text-slate-600 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: form.description }}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
