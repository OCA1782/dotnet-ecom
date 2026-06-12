"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import {
  BarChart3, Globe, MapPin, TrendingUp, TrendingDown, Minus,
  Package, Users, ShoppingCart, Activity, RefreshCw,
} from "lucide-react";

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

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 0.5) return (
    <span className="flex items-center gap-1 text-xs text-slate-400">
      <Minus size={11} /> Sabit
    </span>
  );
  const up = pct > 0;
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${up ? "text-emerald-600" : "text-red-500"}`}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

function SvgAreaChart({
  data,
  stroke = "#8b5cf6",
  fill = "rgba(139,92,246,0.10)",
  height = 80,
}: {
  data: number[];
  stroke?: string;
  fill?: string;
  height?: number;
}) {
  if (!data.length) return (
    <div style={{ height }} className="flex items-center justify-center text-xs text-slate-300">Veri yok</div>
  );
  const W = 600;
  const H = height;
  const max = Math.max(...data, 1);
  const pts: [number, number][] = data.map((v, i) => [
    (i / Math.max(data.length - 1, 1)) * W,
    H - (v / max) * (H - 10) - 5,
  ]);

  const path = pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
    const [px, py] = pts[i - 1];
    const cx1 = (px + (x - px) * 0.4).toFixed(1);
    const cx2 = (x - (x - px) * 0.4).toFixed(1);
    return `${acc} C ${cx1} ${py.toFixed(1)}, ${cx2} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, "");

  const last = pts[pts.length - 1];
  const fillPath = `${path} L ${last[0].toFixed(1)} ${H} L 0 ${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`grad-${stroke.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RingMeter({
  pct,
  color,
  size = 64,
  strokeWidth = 6,
}: {
  pct: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    const t = setTimeout(() => setOffset(circ * (1 - Math.min(Math.max(pct, 0), 100) / 100)), 120);
    return () => clearTimeout(t);
  }, [pct, circ]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease-out" }}
      />
    </svg>
  );
}

function AnimBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), delay + 80);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${w}%`, backgroundColor: color, transition: "width 0.7s ease-out" }}
      />
    </div>
  );
}

function SkeletonRows({ n = 5 }: { n?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-6 bg-slate-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

const REFRESH_INTERVAL = 60_000;

export default function AnalizPage() {
  const { t } = useI18n();
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
    const id = window.setTimeout(() => { void loadData(); }, 0);
    const timer = setInterval(() => { void loadData(); }, REFRESH_INTERVAL);
    return () => {
      window.clearTimeout(id);
      clearInterval(timer);
    };
  }, [loadData]);

  const allVisits = visitorStats?.dailyVisits ?? [];
  const half = Math.floor(allVisits.length / 2);
  const currentVisits = allVisits.slice(half).reduce((s, d) => s + d.visits, 0);
  const prevVisits = allVisits.slice(0, half).reduce((s, d) => s + d.visits, 0);
  const totalVisits = allVisits.reduce((s, d) => s + d.visits, 0);
  const totalOrders = productSales.reduce((s, p) => s + p.orderCount, 0);
  const totalRevenue = productSales.reduce((s, p) => s + p.totalRevenue, 0);
  const conversionRate = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const sortedMonths = [...(dashStats?.monthlySummary ?? [])].sort((a, b) => a.month.localeCompare(b.month));
  const lastMonth = sortedMonths.at(-1);
  const prevMonth = sortedMonths.at(-2);

  const dailyVisitData = allVisits.map(d => d.visits);
  const monthlyRevenueData = sortedMonths.map(m => m.revenue);

  // 5 evenly spaced x-axis labels for daily chart
  const xLabels = allVisits.length > 0
    ? [0, 1, 2, 3, 4].map(i => {
      const idx = Math.round(i * (allVisits.length - 1) / 4);
      return allVisits[idx]?.day.slice(5) ?? "";
    })
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-600" />
            {t("nav./raporlar", "Analiz")}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ziyaret, dönüşüm ve satış performansı
            {lastRefresh && (
              <span className="ml-2 text-slate-400 text-xs">
                · {lastRefresh.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {t("action.refresh", "Yenile")}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <div className="relative shrink-0">
            <RingMeter pct={prevVisits > 0 ? Math.min(100, (currentVisits / prevVisits) * 50) : 50} color="#8b5cf6" />
            <span className="absolute inset-0 flex items-center justify-center">
              <Users size={16} className="text-violet-500" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">Toplam Ziyaret</p>
            <p className="text-xl font-extrabold text-slate-900">{totalVisits.toLocaleString("tr-TR")}</p>
            <TrendBadge current={currentVisits} previous={prevVisits} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <div className="relative shrink-0">
            <RingMeter pct={Math.min(100, conversionRate * 20)} color="#14b8a6" />
            <span className="absolute inset-0 flex items-center justify-center">
              <ShoppingCart size={16} className="text-teal-500" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">{t("col.conversion", "Dönüşüm")}</p>
            <p className="text-xl font-extrabold text-teal-700">{conversionRate.toFixed(2)}%</p>
            <p className="text-[11px] text-slate-400">Ziyaret → Sipariş</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <div className="relative shrink-0">
            <RingMeter pct={prevMonth && lastMonth ? Math.min(100, (lastMonth.revenue / Math.max(prevMonth.revenue, 1)) * 50) : 50} color="#10b981" />
            <span className="absolute inset-0 flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-500" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">Ort. Sepet</p>
            <p className="text-lg font-extrabold text-emerald-700">{formatCurrency(avgOrderValue)}</p>
            <TrendBadge current={lastMonth?.revenue ?? 0} previous={prevMonth?.revenue ?? 0} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <div className="relative shrink-0">
            <RingMeter pct={Math.min(100, totalOrders * 3)} color="#f59e0b" />
            <span className="absolute inset-0 flex items-center justify-center">
              <Activity size={16} className="text-amber-500" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">{t("col.revenue", "Gelir")}</p>
            <p className="text-lg font-extrabold text-amber-700">{formatCurrency(totalRevenue)}</p>
            <p className="text-[11px] text-slate-400">{totalOrders} sipariş</p>
          </div>
        </div>
      </div>

      {/* Area Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Daily Visit Trend */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-500" />
              Günlük Ziyaret Trendi
            </h2>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-slate-200 inline-block" /> Önceki dönem
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-violet-400 inline-block" /> Mevcut dönem
              </span>
            </div>
          </div>
          {loadingV ? (
            <div className="h-20 flex items-center justify-center">
              <div className="w-full h-16 bg-slate-100 rounded animate-pulse" />
            </div>
          ) : (
            <>
              {/* Half-period shading overlay hint */}
              <div className="relative">
                <div className="absolute inset-0 flex pointer-events-none">
                  <div className="flex-1 bg-slate-50 rounded-l opacity-60" />
                  <div className="flex-1" />
                </div>
                <SvgAreaChart data={dailyVisitData} stroke="#8b5cf6" fill="rgba(139,92,246,0.10)" height={80} />
              </div>
              {xLabels.length > 0 && (
                <div className="flex justify-between mt-1 px-0.5">
                  {xLabels.map((l, i) => (
                    <span key={i} className="text-[10px] text-slate-400">{l}</span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Monthly Revenue Trend */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Aylık Gelir Trendi
          </h2>
          {!dashStats ? (
            <div className="h-20 flex items-center justify-center">
              <div className="w-full h-16 bg-slate-100 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <SvgAreaChart data={monthlyRevenueData} stroke="#10b981" fill="rgba(16,185,129,0.10)" height={80} />
              {sortedMonths.length > 0 && (
                <div className="flex justify-between mt-1 px-0.5">
                  <span className="text-[10px] text-slate-400">{sortedMonths[0]?.month.slice(0, 7)}</span>
                  <span className="text-[10px] text-slate-400">{sortedMonths.at(-1)?.month.slice(0, 7)}</span>
                </div>
              )}
              {lastMonth && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Son ay</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-700">{formatCurrency(lastMonth.revenue)}</span>
                    <TrendBadge current={lastMonth.revenue} previous={prevMonth?.revenue ?? 0} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Country + Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal-500" />
            Ülke / Bölge Dağılımı
          </h2>
          {loadingV ? <SkeletonRows /> : !visitorStats?.countryBreakdown.length ? (
            <div className="h-32 flex items-center justify-center text-slate-300 text-sm">{t("table.noData", "Kayıt bulunamadı")}</div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {visitorStats.countryBreakdown.map((c, i) => {
                const maxC = visitorStats.countryBreakdown[0].visits;
                const pct = totalVisits > 0 ? (c.visits / totalVisits) * 100 : 0;
                return (
                  <div key={c.country} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-300 w-4 shrink-0 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-700 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-teal-400 shrink-0" />{c.country}
                        </span>
                        <span className="text-xs text-slate-500 ml-1 shrink-0">
                          {c.visits} <span className="text-slate-300">({pct.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <AnimBar pct={(c.visits / maxC) * 100} color="#14b8a6" delay={i * 60} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-violet-500" />
            En Çok Ziyaret Edilen Sayfalar
          </h2>
          {loadingV ? <SkeletonRows /> : !visitorStats?.topPages.length ? (
            <div className="h-32 flex items-center justify-center text-slate-300 text-sm">{t("table.noData", "Kayıt bulunamadı")}</div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {visitorStats.topPages.map((p, i) => {
                const maxP = visitorStats.topPages[0].visits;
                const pct = totalVisits > 0 ? (p.visits / totalVisits) * 100 : 0;
                return (
                  <div key={p.page} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-300 w-4 shrink-0 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-700 truncate max-w-[180px]" title={p.page}>{p.page}</span>
                        <span className="text-xs text-slate-500 ml-1 shrink-0">
                          {p.visits} <span className="text-slate-300">({pct.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <AnimBar pct={(p.visits / maxP) * 100} color="#8b5cf6" delay={i * 60} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Product Performance */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-500" />
            Ürün Performansı — En Çok Satan
          </h2>
          {productSales.length > 0 && (
            <span className="text-xs text-slate-400">{productSales.length} ürün</span>
          )}
        </div>
        {loadingP ? <SkeletonRows n={6} /> : !productSales.length ? (
          <div className="h-32 flex items-center justify-center text-slate-300 text-sm">{t("table.noData", "Kayıt bulunamadı")}</div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {productSales.map((p, i) => {
              const maxRev = productSales[0].totalRevenue;
              const revShare = totalRevenue > 0 ? (p.totalRevenue / totalRevenue) * 100 : 0;
              return (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-300 w-5 shrink-0 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[220px]" title={p.productName}>
                        {p.productName}
                      </span>
                      <div className="flex items-center gap-3 ml-2 shrink-0">
                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                          {p.totalQuantity} adet · {p.orderCount} sip.
                        </span>
                        <span className="text-xs font-semibold text-emerald-700">{formatCurrency(p.totalRevenue)}</span>
                        <span className="text-[10px] text-slate-400 w-8 text-right">{revShare.toFixed(1)}%</span>
                      </div>
                    </div>
                    <AnimBar pct={(p.totalRevenue / maxRev) * 100} color="#10b981" delay={i * 40} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
