"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BarChart3, Package, Globe, MapPin, TrendingUp, TrendingDown, Minus, Users, ShoppingCart, RotateCcw, RefreshCw } from "lucide-react";

interface PageVisit { page: string; visits: number; }
interface CountryVisit { country: string; visits: number; }
interface DailyVisit { day: string; visits: number; }
interface VisitorStats {
  topPages: PageVisit[];
  countryBreakdown: CountryVisit[];
  dailyVisits: DailyVisit[];
}
interface ProductSales {
  productId: string;
  productName: string;
  sku?: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}
interface MonthlySummary { month: string; revenue: number; orderCount: number; }
interface DashboardStats { monthlySummary: MonthlySummary[]; totalCustomerCount: number; }

const PERIOD_OPTIONS = [
  { label: "Son 7 Gün", value: 7 },
  { label: "Son 30 Gün", value: 30 },
  { label: "Son 90 Gün", value: 90 },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);
}

function TrendBadge({ current, previous, suffix = "" }: { current: number; previous: number; suffix?: string }) {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 0.5) return <span className="flex items-center gap-1 text-xs text-slate-400"><Minus size={12} /> Sabit</span>;
  const up = pct > 0;
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${up ? "text-emerald-600" : "text-red-500"}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? "+" : ""}{pct.toFixed(1)}%{suffix}
    </span>
  );
}

const REFRESH_INTERVAL = 60_000;

export default function AnalizPage() {
  const [days, setDays] = useState(30);
  const [visitorStats, setVisitorStats] = useState<VisitorStats | null>(null);
  const [productSales, setProductSales] = useState<ProductSales[]>([]);
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [loadingV, setLoadingV] = useState(false);
  const [loadingP, setLoadingP] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    setLoadingV(true);
    setLoadingP(true);
    try {
      const [v, p, d] = await Promise.allSettled([
        api.get<VisitorStats>(`/api/admin/reports/visitor-stats?days=${days}`),
        api.get<ProductSales[]>(`/api/admin/reports/product-sales?days=${days}&topN=20`),
        api.get<DashboardStats>("/api/admin/dashboard"),
      ]);
      if (v.status === "fulfilled") setVisitorStats(v.value);
      if (p.status === "fulfilled") setProductSales(p.value);
      if (d.status === "fulfilled") setDashStats(d.value);
      setLastRefresh(new Date());
    } finally {
      setLoadingV(false);
      setLoadingP(false);
      setRefreshing(false);
    }
  }, [days]);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => loadData(), REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [loadData]);

  const maxDailyVisits = Math.max(1, ...(visitorStats?.dailyVisits.map(d => d.visits) ?? [1]));
  const maxRevenue = Math.max(1, ...(productSales.map(p => p.totalRevenue)));

  // Period comparison — current half vs prev half
  const allVisits = visitorStats?.dailyVisits ?? [];
  const half = Math.floor(allVisits.length / 2);
  const currentVisits = allVisits.slice(half).reduce((s, d) => s + d.visits, 0);
  const prevVisits = allVisits.slice(0, half).reduce((s, d) => s + d.visits, 0);

  // Revenue comparison from monthly summary
  const sortedMonths = [...(dashStats?.monthlySummary ?? [])].sort((a, b) => a.month.localeCompare(b.month));
  const lastMonth = sortedMonths.at(-1);
  const prevMonth = sortedMonths.at(-2);

  // Derived metrics
  const totalVisits = allVisits.reduce((s, d) => s + d.visits, 0);
  const totalOrders = productSales.reduce((s, p) => s + p.orderCount, 0);
  const conversionRate = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;
  const avgOrderValue = totalOrders > 0
    ? productSales.reduce((s, p) => s + p.totalRevenue, 0) / totalOrders
    : 0;
  const returnRate = lastMonth && prevMonth && lastMonth.orderCount > 0
    ? Math.max(0, 100 - (lastMonth.orderCount / Math.max(1, prevMonth.orderCount + lastMonth.orderCount)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-600" />
            Analiz
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Periyot karşılaştırması, dönüşüm ve detaylı davranış analizi
            {lastRefresh && (
              <span className="ml-2 text-slate-400 text-xs">
                · Son güncelleme: {lastRefresh.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="Şimdi yenile"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Yenile
          </button>
          <div className="flex gap-1.5">
            {PERIOD_OPTIONS.map(o => (
              <button key={o.value} onClick={() => setDays(o.value)}
                className={`px-3 py-1.5 text-sm rounded-xl border transition ${days === o.value ? "bg-teal-600 text-white border-teal-600" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dönüşüm Metrikleri — Analiz'e özgü, dashboard'da yok */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Users size={11} /> Toplam Ziyaret
          </p>
          <p className="text-2xl font-extrabold text-slate-900">{totalVisits.toLocaleString("tr-TR")}</p>
          <div className="mt-1.5">
            <TrendBadge current={currentVisits} previous={prevVisits} />
            <span className="text-xs text-slate-400">dönem trendi</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <ShoppingCart size={11} /> Dönüşüm Oranı
          </p>
          <p className="text-2xl font-extrabold text-violet-700">{conversionRate.toFixed(2)}%</p>
          <p className="text-xs text-slate-400 mt-1.5">Ziyaret → Sipariş</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <TrendingUp size={11} /> Ort. Sepet Tutarı
          </p>
          <p className="text-2xl font-extrabold text-emerald-700">{formatCurrency(avgOrderValue)}</p>
          <div className="mt-1.5">
            <TrendBadge current={lastMonth?.revenue ?? 0} previous={prevMonth?.revenue ?? 0} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <RotateCcw size={11} /> Tahmini İade Oranı
          </p>
          <p className="text-2xl font-extrabold text-amber-600">{returnRate.toFixed(1)}%</p>
          <p className="text-xs text-slate-400 mt-1.5">Sipariş değişim trendi</p>
        </div>
      </div>

      {/* Günlük Ziyaret Trendi — Periyot karşılaştırmalı */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-500" />
            Günlük Ziyaret Trendi
          </h2>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200 inline-block" /> Önceki dönem</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-violet-400 inline-block" /> Mevcut dönem</span>
          </div>
        </div>
        {loadingV ? (
          <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Yükleniyor...</div>
        ) : (
          <div className="flex items-end gap-1 h-40 relative">
            {allVisits.map((d, i) => {
              const isPrev = i < half;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full flex flex-col justify-end" style={{ height: "130px" }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded-lg
                      opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10 shadow">
                      {d.day}: {d.visits}
                    </div>
                    <div className={`w-full rounded-t-sm transition ${isPrev ? "bg-slate-200 hover:bg-slate-300" : "bg-violet-400 hover:bg-violet-500"}`}
                      style={{ height: `${Math.max(2, (d.visits / maxDailyVisits) * 120)}px` }} />
                  </div>
                  {i % Math.max(1, Math.floor(allVisits.length / 7)) === 0 && (
                    <span className="text-[9px] text-slate-400">{d.day.slice(8)}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Country Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal-500" />
            Ülke / Bölge Dağılımı
          </h2>
          {loadingV ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Yükleniyor...</div>
          ) : (
            <div className="space-y-2.5 max-h-52 overflow-y-auto">
              {visitorStats?.countryBreakdown.map((c, i) => {
                const maxC = visitorStats.countryBreakdown[0]?.visits ?? 1;
                const pct = ((c.visits / totalVisits) * 100).toFixed(1);
                return (
                  <div key={c.country} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 w-4 text-right">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-teal-400" />{c.country}
                        </span>
                        <span className="text-xs text-slate-500">{c.visits} <span className="text-slate-300">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-400 rounded-full" style={{ width: `${(c.visits / maxC) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Pages */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-violet-500" />
            En Çok Ziyaret Edilen Sayfalar
          </h2>
          {loadingV ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Yükleniyor...</div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {visitorStats?.topPages.map((p, i) => {
                const maxP = visitorStats.topPages[0]?.visits ?? 1;
                const pct = totalVisits > 0 ? ((p.visits / totalVisits) * 100).toFixed(1) : "0";
                return (
                  <div key={p.page} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 w-4 text-right">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-slate-700 truncate max-w-[200px]" title={p.page}>{p.page}</span>
                        <span className="text-xs text-slate-500 ml-2 shrink-0">{p.visits} <span className="text-slate-300">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-400 rounded-full" style={{ width: `${(p.visits / maxP) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Sales */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-500" />
            Ürün Performansı — En Çok Satan (Top 20)
          </h2>
          {loadingP ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Yükleniyor...</div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {productSales.map((p, i) => {
                const revShare = maxRevenue > 0 ? (p.totalRevenue / productSales.reduce((s, x) => s + x.totalRevenue, 0) * 100) : 0;
                return (
                  <div key={p.productId} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 w-4 text-right">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[240px]" title={p.productName}>
                          {p.productName}
                        </span>
                        <div className="flex items-center gap-3 ml-2 shrink-0">
                          <span className="text-[10px] text-slate-400">{p.totalQuantity} adet · {p.orderCount} sip.</span>
                          <span className="text-xs font-semibold text-emerald-700">{formatCurrency(p.totalRevenue)}</span>
                          <span className="text-[10px] text-slate-400 w-8 text-right">{revShare.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(p.totalRevenue / maxRevenue) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
