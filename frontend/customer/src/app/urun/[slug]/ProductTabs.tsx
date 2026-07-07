"use client";

import { useState } from "react";
import type { ProductDetail } from "@/types";
import ReviewSection from "./ReviewSection";

const TABS = [
  { key: "desc",    label: "Ürün Açıklaması" },
  { key: "compat",  label: "Uyumlu Araçlar"  },
  { key: "specs",   label: "Teknik Özellikler" },
  { key: "reviews", label: "Değerlendirmeler"  },
] as const;

type TabKey = typeof TABS[number]["key"];

interface Props {
  product: ProductDetail;
  reviewCount: number;
}

export default function ProductTabs({ product, reviewCount }: Props) {
  const [active, setActive] = useState<TabKey>("desc");

  return (
    <div className="mt-8 border-t border-gray-200">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex-shrink-0 px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              active === tab.key
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
            }`}
          >
            {tab.label}
            {tab.key === "reviews" && reviewCount > 0 && (
              <span className="ml-1.5 text-[10px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
                {reviewCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="py-6">
        {active === "desc" && (
          <div>
            {product.description ? (
              <div
                className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <p className="text-sm text-gray-400">Ürün açıklaması mevcut değil.</p>
            )}
          </div>
        )}

        {active === "compat" && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Uyumlu Araç / Şasi Bilgisi</p>
            {(product.oemPartNumber || product.chassis) ? (
              <div className="space-y-2">
                {product.oemPartNumber && (
                  <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                    <span className="text-[10px] font-extrabold text-orange-400 uppercase tracking-widest shrink-0">OEM</span>
                    <span className="font-mono text-sm font-bold text-gray-800">{product.oemPartNumber}</span>
                  </div>
                )}
                {product.chassis && (
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest shrink-0">Şasi</span>
                    <span className="font-mono text-sm font-bold text-gray-800">{product.chassis}</span>
                  </div>
                )}
                <p className="text-xs text-gray-400 pt-1">
                  Araç uyumluluğunu doğrulamak için OEM / parça numarasını yetkili servis veya katalog üzerinden kontrol edin.
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-5 text-center">
                <p className="text-sm text-gray-400">Bu ürün için araç uyumluluk bilgisi girilmemiş.</p>
                {product.shortDescription && (
                  <p className="mt-2 text-sm text-gray-500">{product.shortDescription}</p>
                )}
              </div>
            )}
          </div>
        )}

        {active === "specs" && (
          <div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {product.oemPartNumber && (
                  <tr>
                    <td className="py-2.5 pr-4 font-semibold text-gray-600 w-40">OEM / Parça No</td>
                    <td className="py-2.5 text-gray-800 font-mono">{product.oemPartNumber}</td>
                  </tr>
                )}
                {product.chassis && (
                  <tr>
                    <td className="py-2.5 pr-4 font-semibold text-gray-600 w-40">Şasi / Model</td>
                    <td className="py-2.5 text-gray-800 font-mono">{product.chassis}</td>
                  </tr>
                )}
                {product.sku && (
                  <tr>
                    <td className="py-2.5 pr-4 font-semibold text-gray-600 w-40">SKU</td>
                    <td className="py-2.5 text-gray-800 font-mono">{product.sku}</td>
                  </tr>
                )}
                {product.brandName && (
                  <tr>
                    <td className="py-2.5 pr-4 font-semibold text-gray-600">Marka</td>
                    <td className="py-2.5 text-gray-800">{product.brandName}</td>
                  </tr>
                )}
                {product.categoryName && (
                  <tr>
                    <td className="py-2.5 pr-4 font-semibold text-gray-600">Kategori</td>
                    <td className="py-2.5 text-gray-800">{product.categoryName}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-2.5 pr-4 font-semibold text-gray-600">KDV Oranı</td>
                  <td className="py-2.5 text-gray-800">%{product.taxRate}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {active === "reviews" && (
          <ReviewSection productId={product.id} />
        )}
      </div>
    </div>
  );
}
