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
            <p className="text-sm font-semibold text-gray-700 mb-3">Uyumlu Araç Modelleri</p>
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 leading-relaxed">
              {product.name}
            </div>
            {product.shortDescription && (
              <p className="mt-3 text-sm text-gray-500">{product.shortDescription}</p>
            )}
          </div>
        )}

        {active === "specs" && (
          <div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {product.sku && (
                  <tr>
                    <td className="py-2.5 pr-4 font-semibold text-gray-600 w-40">OEM / Parça No</td>
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
