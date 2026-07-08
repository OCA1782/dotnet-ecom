"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import type { Brand, Category } from "@/types";
import { useI18n } from "@/contexts/I18nContext";
import { Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5124";

export interface ProductFiltersProps {
  categories: Category[];
  brands: Brand[];
  activeCategory?: string;
  minFiyat?: string;
  maxFiyat?: string;
  searchTerm?: string;
  activeVehicleModel?: string;
  activeOemNo?: string;
  activeChassis?: string;
  activeMotor?: string;
  activeBrandIds: string[];
  activeRating?: number;
  activeSiralama?: string;
  activeIndirimli?: boolean;
  activeNitelikler?: string;
  categorySlug?: string;
  /** Called right after a filter action triggers navigation (e.g. to close a mobile sheet) */
  onNavigate?: () => void;
  /** Override the outer wrapper className (defaults to desktop card styling) */
  className?: string;
}

const RATINGS = [4, 3, 2, 1];

export default function ProductFilters({
  categories, brands, activeCategory, minFiyat, maxFiyat, searchTerm,
  activeVehicleModel, activeOemNo, activeChassis, activeMotor,
  activeBrandIds, activeRating, activeSiralama, activeIndirimli,
  activeNitelikler, categorySlug, onNavigate, className,
}: ProductFiltersProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [search, setSearch] = useState(searchTerm ?? "");
  const [min, setMin] = useState(minFiyat ?? "");
  const [max, setMax] = useState(maxFiyat ?? "");
  const [selectedBrands, setSelectedBrands] = useState<string[]>(activeBrandIds);
  const [attributes, setAttributes] = useState<Record<string, string[]>>({});
  const [brandSearch, setBrandSearch] = useState("");
  const [isPending, setIsPending] = useState(false);

  // Sync local state when URL-derived props change (e.g. nav brand click)
  useEffect(() => { setSearch(searchTerm ?? ""); }, [searchTerm]);
  useEffect(() => { setMin(minFiyat ?? ""); }, [minFiyat]);
  useEffect(() => { setMax(maxFiyat ?? ""); }, [maxFiyat]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setSelectedBrands(activeBrandIds); }, [activeBrandIds.join(",")]);

  // Detect navigation completion: when server re-renders with new props, clear pending
  const brandsKey = activeBrandIds.join(",");
  const filterKey = `${activeCategory}|${minFiyat}|${maxFiyat}|${searchTerm}|${brandsKey}|${activeSiralama}|${activeRating}|${activeIndirimli}|${activeNitelikler}|${activeVehicleModel}|${activeOemNo}|${activeChassis}|${activeMotor}`;
  const prevKeyRef = useRef(filterKey);
  useEffect(() => {
    if (prevKeyRef.current !== filterKey) {
      prevKeyRef.current = filterKey;
      setIsPending(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const SORT_OPTIONS = [
    { value: "",             label: "Varsayılan" },
    { value: "yeni",         label: t("prod2.sort.new") },
    { value: "cok-satan",    label: t("prod2.sort.bestseller") },
    { value: "fiyat-artan",  label: t("prod2.sort.price_asc") },
    { value: "fiyat-azalan", label: t("prod2.sort.price_desc") },
    { value: "indirim",      label: "İndirime Göre" },
  ];

  // Parse active attribute pairs: "Renk:Kırmızı,Beden:M" → [{key,value}]
  const activeAttrPairs: { key: string; value: string }[] = (activeNitelikler ?? "")
    .split(",")
    .filter(Boolean)
    .map(p => {
      const idx = p.indexOf(":");
      if (idx < 0) return null;
      return { key: p.slice(0, idx), value: p.slice(idx + 1) };
    })
    .filter((x): x is { key: string; value: string } => x !== null);

  useEffect(() => {
    const url = `${API_BASE}/api/products/attributes${categorySlug ? `?categorySlug=${encodeURIComponent(categorySlug)}` : ""}`;
    fetch(url)
      .then(r => r.ok ? r.json() : {})
      .then((data: Record<string, string[]>) => setAttributes(data))
      .catch(() => {});
  }, [categorySlug]);

  function navigate(url: string) {
    setIsPending(true);
    onNavigate?.();
    router.push(url);
  }

  function buildUrl(overrides: Record<string, string | undefined>) {
    const qs = new URLSearchParams();
    const s = overrides.s !== undefined ? overrides.s : search;
    const arac = overrides.arac !== undefined ? overrides.arac : activeVehicleModel;
    const oemNo = overrides.oemNo !== undefined ? overrides.oemNo : activeOemNo;
    const chassis = overrides.chassis !== undefined ? overrides.chassis : activeChassis;
    const motor = overrides.motor !== undefined ? overrides.motor : activeMotor;
    const kat = overrides.kategori !== undefined ? overrides.kategori : activeCategory;
    const mn = overrides.minFiyat !== undefined ? overrides.minFiyat : min;
    const mx = overrides.maxFiyat !== undefined ? overrides.maxFiyat : max;
    const bnds = overrides.markalar !== undefined ? overrides.markalar : selectedBrands.join(",");
    const puan = overrides.puan !== undefined ? overrides.puan : (activeRating ? String(activeRating) : "");
    const sira = overrides.siralama !== undefined ? overrides.siralama : activeSiralama;
    const indr = overrides.indirimli !== undefined ? overrides.indirimli : (activeIndirimli ? "true" : "");
    const nit = overrides.nitelikler !== undefined ? overrides.nitelikler : activeNitelikler;
    if (s) qs.set("s", s);
    if (arac) qs.set("arac", arac);
    if (oemNo) qs.set("oemNo", oemNo);
    if (chassis) qs.set("chassis", chassis);
    if (motor) qs.set("motor", motor);
    if (kat) qs.set("kategori", kat);
    if (mn) qs.set("minFiyat", mn);
    if (mx) qs.set("maxFiyat", mx);
    if (bnds) qs.set("markalar", bnds);
    if (puan) qs.set("puan", puan);
    if (sira) qs.set("siralama", sira);
    if (indr) qs.set("indirimli", indr);
    if (nit) qs.set("nitelikler", nit);
    return `/urunler${qs.toString() ? `?${qs}` : ""}`;
  }

  function toggleBrand(id: string) {
    const next = selectedBrands.includes(id)
      ? selectedBrands.filter(b => b !== id)
      : [...selectedBrands, id];
    setSelectedBrands(next);
    navigate(buildUrl({ markalar: next.join(",") || undefined, sayfa: "1" }));
  }

  function toggleAttr(key: string, value: string) {
    const isActive = activeAttrPairs.some(p => p.key === key && p.value === value);
    const next = isActive
      ? activeAttrPairs.filter(p => !(p.key === key && p.value === value))
      : [...activeAttrPairs, { key, value }];
    const nit = next.map(p => `${p.key}:${p.value}`).join(",") || undefined;
    navigate(buildUrl({ nitelikler: nit, sayfa: "1" }));
  }

  const hasAnyFilter = !!(activeCategory || min || max || search || activeVehicleModel || selectedBrands.length
    || activeRating || activeSiralama || activeIndirimli || activeNitelikler);

  const filteredBrands = brandSearch.trim()
    ? brands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()))
    : brands;

  return (
    <div className={className ?? "relative bg-white rounded-2xl border border-teal-100 p-5 space-y-6 shadow-sm sticky top-4"}>

      {/* Loading overlay — shown while navigation is in flight */}
      {isPending && (
        <div className="absolute inset-0 bg-white/75 rounded-2xl flex items-center justify-center z-10 pointer-events-none">
          <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
        </div>
      )}

      {/* Search */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Arama</h3>
        <div className="flex gap-1">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && navigate(buildUrl({ s: search, sayfa: "1" }))}
            placeholder="Ürün ara..."
            className="flex-1 border border-teal-200 rounded-xl px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <button
            onClick={() => navigate(buildUrl({ s: search, sayfa: "1" }))}
            className="px-3 py-1.5 bg-teal-600 text-white rounded-xl text-sm hover:bg-teal-700 transition"
          >
            Git
          </button>
        </div>
      </div>

      {/* Sort */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t("prod2.sort.label")}</h3>
        <div className="space-y-1">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => navigate(buildUrl({ siralama: opt.value || undefined, sayfa: "1" }))}
              className={`w-full text-left text-sm px-3 py-1.5 rounded-xl transition ${
                (activeSiralama ?? "") === opt.value
                  ? "bg-teal-100 text-teal-700 font-semibold"
                  : "text-slate-600 hover:bg-teal-50 hover:text-teal-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t("prod2.filter.category")}</h3>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => navigate(buildUrl({ kategori: "", sayfa: "1" }))}
                className={`text-sm w-full text-left px-3 py-1.5 rounded-xl transition ${
                  !activeCategory ? "bg-teal-100 text-teal-700 font-semibold" : "text-slate-600 hover:bg-teal-50 hover:text-teal-600"
                }`}
              >
                {t("prod2.filter.all_categories")}
              </button>
            </li>
            {categories.map(cat => (
              <li key={cat.id}>
                <button
                  onClick={() => navigate(buildUrl({ kategori: cat.slug, sayfa: "1" }))}
                  className={`text-sm w-full text-left px-3 py-1.5 rounded-xl transition font-medium ${
                    activeCategory === cat.slug ? "bg-teal-100 text-teal-700 font-semibold" : "text-slate-700 hover:bg-teal-50 hover:text-teal-600"
                  }`}
                >
                  {cat.name}
                </button>
                {cat.subCategories?.length > 0 && (
                  <ul className="mt-0.5 ml-3 border-l-2 border-teal-100 pl-2 space-y-0.5">
                    {cat.subCategories.map(sub => (
                      <li key={sub.id}>
                        <button
                          onClick={() => navigate(buildUrl({ kategori: sub.slug, sayfa: "1" }))}
                          className={`text-xs w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                            activeCategory === sub.slug ? "bg-teal-100 text-teal-700 font-semibold" : "text-slate-500 hover:bg-teal-50 hover:text-teal-600"
                          }`}
                        >
                          {sub.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Price range */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t("prod2.filter.price_range")}</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min ₺"
            value={min}
            onChange={e => setMin(e.target.value)}
            onKeyDown={e => e.key === "Enter" && navigate(buildUrl({ minFiyat: min || undefined, maxFiyat: max || undefined, sayfa: "1" }))}
            className="w-full border border-teal-200 rounded-xl px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <span className="text-slate-400 text-sm shrink-0">–</span>
          <input
            type="number"
            placeholder="Max ₺"
            value={max}
            onChange={e => setMax(e.target.value)}
            onKeyDown={e => e.key === "Enter" && navigate(buildUrl({ minFiyat: min || undefined, maxFiyat: max || undefined, sayfa: "1" }))}
            className="w-full border border-teal-200 rounded-xl px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
        <button
          onClick={() => navigate(buildUrl({ minFiyat: min || undefined, maxFiyat: max || undefined, sayfa: "1" }))}
          className="mt-2 w-full py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium text-sm rounded-xl transition"
        >
          {t("prod2.filter.apply")}
        </button>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t("prod2.filter.brand")}</h3>
          {brands.length > 5 && (
            <input
              type="text"
              value={brandSearch}
              onChange={e => setBrandSearch(e.target.value)}
              placeholder="Marka ara..."
              className="w-full border border-teal-100 rounded-lg px-2.5 py-1.5 text-xs mb-2 focus:outline-none focus:ring-1 focus:ring-teal-300 bg-slate-50 placeholder-slate-400"
            />
          )}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {filteredBrands.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 text-center">Marka bulunamadı</p>
            ) : (
              filteredBrands.map(brand => (
                <label key={brand.id} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand.id)}
                    onChange={() => toggleBrand(brand.id)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-400"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-teal-700 transition">{brand.name}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      {/* Attribute filters */}
      {Object.entries(attributes).map(([key, values]) => (
        <div key={key}>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{key}</h3>
          <div className="flex flex-wrap gap-1.5">
            {values.map(val => {
              const isActive = activeAttrPairs.some(p => p.key === key && p.value === val);
              return (
                <button
                  key={val}
                  onClick={() => toggleAttr(key, val)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition font-medium ${
                    isActive
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-700"
                  }`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Rating filter */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t("prod2.filter.min_rating")}</h3>
        <div className="space-y-1">
          {RATINGS.map(r => (
            <button
              key={r}
              onClick={() => navigate(buildUrl({ puan: activeRating === r ? undefined : String(r), sayfa: "1" }))}
              className={`w-full text-left flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl transition ${
                activeRating === r ? "bg-amber-100 text-amber-700 font-semibold" : "text-slate-600 hover:bg-amber-50 hover:text-amber-600"
              }`}
            >
              <span className="text-amber-400 tracking-tight">{"★".repeat(r)}{"☆".repeat(5 - r)}</span>
              <span>ve üzeri</span>
            </button>
          ))}
        </div>
      </div>

      {/* İndirimli toggle */}
      <div>
        <button
          onClick={() => navigate(buildUrl({ indirimli: activeIndirimli ? undefined : "true", sayfa: "1" }))}
          className={`w-full py-2 rounded-xl text-sm font-semibold transition ${
            activeIndirimli
              ? "bg-orange-500 text-white hover:bg-orange-600"
              : "bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200"
          }`}
        >
          {activeIndirimli ? `✓ ${t("prod2.list.on_sale")}` : `🏷️ ${t("prod2.filter.on_sale_only")}`}
        </button>
      </div>

      {/* Clear all */}
      {hasAnyFilter && (
        <button
          onClick={() => { setMin(""); setMax(""); setSearch(""); setSelectedBrands([]); navigate("/urunler"); }}
          className="w-full py-1.5 border border-red-200 text-red-500 text-sm rounded-xl hover:bg-red-50 transition font-medium"
        >
          {t("prod2.filter.clear")}
        </button>
      )}
    </div>
  );
}
