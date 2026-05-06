"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import type { DashboardStats } from "@/types";
import { ORDER_STATUS, ORDER_STATUS_COLORS } from "@/types";
import {
  TrendingUp, ShoppingCart, Clock, AlertTriangle,
  Users, ArrowUpRight, Package,
} from "lucide-react";
import Link from "next/link";

// ── helpers ──────────────────────────────────────────────────────────────────

const MONTH_SHORT: Record<string, string> = {
  "01": "Oca", "02": "Şub", "03": "Mar", "04": "Nis",
  "05": "May", "06": "Haz", "07": "Tem", "08": "Ağu",
  "09": "Eyl", "10": "Eki", "11": "Kas", "12": "Ara",
};
function shortMonth(m: string) {
  const [, mon] = m.split("-");
  return MONTH_SHORT[mon] ?? m;
}

const STATUS_COLORS: Record<number, string> = {
  1: "#94a3b8", 2: "#fbbf24", 3: "#60a5fa",
  4: "#818cf8", 5: "#a78bfa", 6: "#2dd4bf",
  7: "#34d399", 8: "#f87171", 11: "#cbd5e1",
};

// ── SVG Line + Area chart ─────────────────────────────────────────────────────
function AreaChart({ data, valueKey, color, gradient }: {
  data: { month: string; revenue: number; orderCount: number }[];
  valueKey: "revenue" | "orderCount";
  color: string;
  gradient: [string, string];
}) {
  if (data.length < 2) return <div className="h-28 flex items-center justify-center text-slate-300 text-xs">Veri yok</div>;
  const W = 400; const H = 100; const PAD = 4;
  const vals = data.map(d => d[valueKey]);
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals);
  const range = max - min || 1;

  const pts = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((d[valueKey] - min) / range) * (H - PAD * 2);
    return [x, y] as [number, number];
  });

  const linePath = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`;

  const gradId = `g-${valueKey}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradient[0]} stopOpacity="0.35" />
          <stop offset="100%" stopColor={gradient[1]} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill={color} />
      ))}
    </svg>
  );
}

// ── Bar chart (monthly or weekly) ────────────────────────────────────────────
function BarChart({ bars, labels, color }: {
  bars: number[];
  labels: string[];
  color: string;
}) {
  const max = Math.max(...bars, 1);
  return (
    <div className="flex items-end gap-1.5 h-24">
      {bars.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="relative w-full flex flex-col items-center justify-end" style={{ height: "80px" }}>
            <div
              className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-80"
              style={{ height: `${Math.max((v / max) * 100, 3)}%`, background: color }}
            />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
              {v}
            </div>
          </div>
          <span className="text-xs text-slate-400">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ slices }: {
  slices: { label: string; value: number; color: string }[];
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const R = 44; const CX = 56; const CY = 56; const stroke = 16;
  const circ = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg width="112" height="112" className="shrink-0">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        {slices.filter(s => s.value > 0).map((s, i) => {
          const dash = (s.value / total) * circ;
          const gap = circ - dash;
          const el = (
            <circle
              key={i} cx={CX} cy={CY} r={R} fill="none"
              stroke={s.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${CX} ${CY})`}
            />
          );
          offset += dash;
          return el;
        })}
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="11" fill="#64748b">Toplam</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize="16" fontWeight="700" fill="#0f172a">{total}</text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-slate-600 truncate flex-1">{s.label}</span>
            <span className="font-semibold text-slate-800 shrink-0">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Horizontal bar ────────────────────────────────────────────────────────────
function HorizBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 text-slate-600 text-xs truncate shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-slate-700 shrink-0">{value}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<DashboardStats>("/api/admin/dashboard")
      .then(setStats)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Hata"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm animate-pulse">
      Yükleniyor...
    </div>
  );
  if (error) return <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl">{error}</div>;
  if (!stats) return null;

  const statusSlices = (stats.orderStatusBreakdown ?? []).slice(0, 6).map(s => ({
    label: s.label,
    value: s.count,
    color: STATUS_COLORS[s.status] ?? "#94a3b8",
  }));

  const statusMax = Math.max(...(stats.orderStatusBreakdown ?? []).map(s => s.count), 1);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-xs text-slate-400">
          {new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Row 1 — Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Bugün Satış", value: formatPrice(stats.todaySales), sub: `${stats.todayOrderCount} sipariş`, icon: TrendingUp, from: "from-emerald-500", to: "to-teal-400" },
          { label: "Bu Ay Satış", value: formatPrice(stats.monthSales ?? 0), sub: `${stats.monthOrderCount ?? 0} sipariş`, icon: ShoppingCart, from: "from-indigo-500", to: "to-blue-400" },
          { label: "Bekleyen", value: String(stats.pendingOrderCount), sub: "sipariş", icon: Clock, from: "from-amber-500", to: "to-orange-400" },
          { label: "Müşteri", value: String(stats.totalCustomerCount ?? 0), sub: `+${stats.newCustomerCount ?? 0} bu ay`, icon: Users, from: "from-pink-500", to: "to-rose-400" },
        ].map(({ label, value, sub, icon: Icon, from, to }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center shadow`}>
                <Icon size={16} className="text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
            <p className="text-xs text-slate-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Row 2 — Aylık gelir trend + haftalık sipariş */}
      {(stats.monthlySummary?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Gelir area chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="font-bold text-slate-800 text-sm">Aylık Gelir Trendi</h2>
                <p className="text-xs text-slate-400">Son {stats.monthlySummary.length} ay</p>
              </div>
              <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                {formatPrice(stats.monthlySummary.reduce((s, m) => s + m.revenue, 0))}
              </span>
            </div>
            <AreaChart data={stats.monthlySummary} valueKey="revenue" color="#6366f1" gradient={["#6366f1", "#a5b4fc"]} />
            <div className="flex justify-between mt-1">
              {stats.monthlySummary.map(m => (
                <span key={m.month} className="text-xs text-slate-300 flex-1 text-center">{shortMonth(m.month)}</span>
              ))}
            </div>
          </div>

          {/* Aylık sipariş area chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="font-bold text-slate-800 text-sm">Aylık Sipariş Trendi</h2>
                <p className="text-xs text-slate-400">Son {stats.monthlySummary.length} ay</p>
              </div>
              <span className="text-xs bg-sky-100 text-sky-700 font-semibold px-2 py-0.5 rounded-full">
                {stats.monthlySummary.reduce((s, m) => s + m.orderCount, 0)} toplam
              </span>
            </div>
            <AreaChart data={stats.monthlySummary} valueKey="orderCount" color="#0ea5e9" gradient={["#0ea5e9", "#7dd3fc"]} />
            <div className="flex justify-between mt-1">
              {stats.monthlySummary.map(m => (
                <span key={m.month} className="text-xs text-slate-300 flex-1 text-center">{shortMonth(m.month)}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Row 3 — Haftalık + Donut + Status dağılımı */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Haftalık sipariş bar */}
        {(stats.weeklyOrders?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-800 text-sm mb-1">Son 7 Gün — Sipariş</h2>
            <p className="text-xs text-slate-400 mb-4">
              Toplam: {stats.weeklyOrders.reduce((s, d) => s + d.orderCount, 0)} sipariş
            </p>
            <BarChart
              bars={stats.weeklyOrders.map(d => d.orderCount)}
              labels={stats.weeklyOrders.map(d => d.label)}
              color="linear-gradient(to top, #6366f1, #a78bfa)"
            />
          </div>
        )}

        {/* Donut — sipariş durumu */}
        {statusSlices.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-800 text-sm mb-4">Sipariş Durumu Dağılımı</h2>
            <DonutChart slices={statusSlices} />
          </div>
        )}

        {/* Yatay bar — durum sayısı */}
        {(stats.orderStatusBreakdown?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 text-sm">Durum Detayı</h2>
              <Link href="/siparisler" className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium">
                Tümü <ArrowUpRight size={11} />
              </Link>
            </div>
            <div className="space-y-3">
              {stats.orderStatusBreakdown.slice(0, 7).map(s => (
                <HorizBar
                  key={s.status}
                  label={s.label}
                  value={s.count}
                  max={statusMax}
                  color={STATUS_COLORS[s.status] ?? "#94a3b8"}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Row 4 — Aylık tablo + kritik uyarılar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Aylık gelir tablo */}
        {(stats.monthlySummary?.length ?? 0) > 0 && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-800 text-sm mb-4">Aylık Gelir Tablosu</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Ay", "Sipariş", "Gelir", "Ort. Sepet", "Pay"].map(h => (
                      <th key={h} className={`py-2 text-slate-400 font-medium text-xs ${h === "Ay" ? "text-left" : "text-right"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const totalRev = stats.monthlySummary.reduce((s, m) => s + m.revenue, 0) || 1;
                    return stats.monthlySummary.map(m => (
                      <tr key={m.month} className="border-b border-slate-50 hover:bg-slate-50 transition">
                        <td className="py-2.5 font-semibold text-slate-800 text-xs">{shortMonth(m.month)} {m.month.split("-")[0]}</td>
                        <td className="py-2.5 text-right text-slate-500 text-xs">{m.orderCount}</td>
                        <td className="py-2.5 text-right font-bold text-slate-900 text-xs">{formatPrice(m.revenue)}</td>
                        <td className="py-2.5 text-right text-slate-500 text-xs">{m.orderCount > 0 ? formatPrice(m.revenue / m.orderCount) : "—"}</td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400"
                                style={{ width: `${(m.revenue / totalRev) * 100}%` }} />
                            </div>
                            <span className="text-xs text-slate-400 w-7 text-right">{Math.round((m.revenue / totalRev) * 100)}%</span>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Kritik uyarı kartları */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-amber-500" />
              <h3 className="font-bold text-amber-800 text-sm">Bekleyen Sipariş</h3>
            </div>
            <p className="text-3xl font-extrabold text-amber-700">{stats.pendingOrderCount}</p>
            <Link href="/siparisler" className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1 mt-2 font-medium">
              İncele <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-red-500" />
              <h3 className="font-bold text-red-800 text-sm">Kritik Stok</h3>
            </div>
            <p className="text-3xl font-extrabold text-red-600">{stats.criticalStockCount}</p>
            <Link href="/stok" className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mt-2 font-medium">
              Stoka Git <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-indigo-500" />
              <h3 className="font-bold text-indigo-800 text-sm">Bu Ay Sipariş</h3>
            </div>
            <p className="text-3xl font-extrabold text-indigo-700">{stats.monthOrderCount ?? 0}</p>
            <p className="text-xs text-indigo-400 mt-1">{formatPrice(stats.monthSales ?? 0)} gelir</p>
          </div>
        </div>
      </div>

      {/* Row 5 — Son siparişler */}
      {(stats.recentOrders?.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 text-sm">Son Siparişler</h2>
            <Link href="/siparisler" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
              Tümünü Gör <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Sipariş No", "Müşteri", "Durum", "Tutar", "Tarih"].map((h, i) => (
                    <th key={h} className={`py-2 text-slate-400 font-medium text-xs ${i < 2 ? "text-left" : i === 2 ? "text-left" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="py-2.5">
                      <Link href={`/siparisler/${order.orderNumber}`} className="font-semibold text-indigo-700 hover:underline text-xs">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 text-slate-600 text-xs">{order.customerName}</td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ORDER_STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {ORDER_STATUS[order.status] ?? "—"}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-900 text-xs">{formatPrice(order.grandTotal)}</td>
                    <td className="py-2.5 text-right text-slate-400 text-xs">{formatDate(order.createdDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
