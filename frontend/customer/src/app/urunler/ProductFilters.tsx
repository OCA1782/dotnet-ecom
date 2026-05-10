"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category } from "@/types";

interface Props {
  categories: Category[];
  activeCategory?: string;
  minFiyat?: string;
  maxFiyat?: string;
  searchTerm?: string;
}

export default function ProductFilters({ categories, activeCategory, minFiyat, maxFiyat, searchTerm }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(searchTerm ?? "");
  const [min, setMin] = useState(minFiyat ?? "");
  const [max, setMax] = useState(maxFiyat ?? "");

  function buildUrl(overrides: Record<string, string | undefined>) {
    const qs = new URLSearchParams();
    const s = overrides.s !== undefined ? overrides.s : search;
    const kat = overrides.kategori !== undefined ? overrides.kategori : activeCategory;
    const mn = overrides.minFiyat !== undefined ? overrides.minFiyat : min;
    const mx = overrides.maxFiyat !== undefined ? overrides.maxFiyat : max;
    if (s) qs.set("s", s);
    if (kat) qs.set("kategori", kat);
    if (mn) qs.set("minFiyat", mn);
    if (mx) qs.set("maxFiyat", mx);
    return `/urunler${qs.toString() ? `?${qs}` : ""}`;
  }

  function applyPriceFilter() {
    router.push(buildUrl({}));
  }

  return (
    <div className="bg-white rounded-2xl border border-teal-100 p-5 space-y-6 shadow-sm">
      {/* Search */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-2">Arama</h3>
        <div className="flex gap-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && router.push(buildUrl({ s: search }))}
            placeholder="Ürün ara..."
            className="flex-1 border border-teal-200 rounded-xl px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <button
            onClick={() => router.push(buildUrl({ s: search }))}
            className="px-3 py-1.5 bg-teal-600 text-white rounded-xl text-sm hover:bg-teal-700 transition"
          >
            Git
          </button>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-2">Kategoriler</h3>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => router.push(buildUrl({ kategori: "" }))}
                className={`text-sm w-full text-left px-3 py-1.5 rounded-xl transition ${
                  !activeCategory
                    ? "bg-teal-100 text-teal-700 font-semibold"
                    : "text-slate-600 hover:bg-teal-50 hover:text-teal-600"
                }`}
              >
                Tümü
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => router.push(buildUrl({ kategori: cat.slug }))}
                  className={`text-sm w-full text-left px-3 py-1.5 rounded-xl transition ${
                    activeCategory === cat.slug
                      ? "bg-teal-100 text-teal-700 font-semibold"
                      : "text-slate-600 hover:bg-teal-50 hover:text-teal-600"
                  }`}
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Price range */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-2">Fiyat Aralığı</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="w-full border border-teal-200 rounded-xl px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <span className="text-slate-400 text-sm">–</span>
          <input
            type="number"
            placeholder="Max"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="w-full border border-teal-200 rounded-xl px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
        <button
          onClick={applyPriceFilter}
          className="mt-2 w-full py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium text-sm rounded-xl transition"
        >
          Uygula
        </button>
      </div>

      {/* Clear all */}
      {(activeCategory || min || max || search) && (
        <button
          onClick={() => router.push("/urunler")}
          className="w-full py-1.5 border border-red-200 text-red-500 text-sm rounded-xl hover:bg-red-50 transition font-medium"
        >
          Filtreleri Temizle
        </button>
      )}
    </div>
  );
}
