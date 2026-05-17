"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { DashboardStats } from "@/types";
import {
  TrendingUp, ShoppingCart, AlertTriangle,
  Users, ArrowUpRight, Star, Clock,
  Ghost, Target, CheckCircle2, Zap, Activity,
  Package, UserCheck, PackageX, Boxes,
} from "lucide-react";
import Link from "next/link";

const STATUS_COLORS: Record<number, string> = {
  1: "#94a3b8", 2: "#fbbf24", 3: "#60a5fa",
  4: "#818cf8", 5: "#a78bfa", 6: "#2dd4bf",
  7: "#34d399", 8: "#f87171", 11: "#cbd5e1", 12: "#94a3b8",
};

function useCountUp(target: number, duration = 1100): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return count;
}

function LiveTicker({ items }: { items: string[] }) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);
  useEffect(() => {
    if (items.length <= 1) return;
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => { setIdx(i => (i + 1) % items.length); setFade(true); }, 350);
    }, 2800);
    return () => clearInterval(iv);
  }, [items.length]);
  if (!items.length) return null;
  return (
    <span style={{ opacity: fade ? 1 : 0, transition: "opacity 350ms ease" }}
      className="text-xs text-slate-500 tabular-nums">
      {items[idx]}
    </span>
  );
}

function AnimatedBar({ pct, color, delay }: { pct: number; color: string; delay: number }) {
  const [h, setH] = useState(0);
  useEffect(() => { const t = setTimeout(() => setH(pct), 120 + delay); return () => clearTimeout(t); }, [pct, delay]);
  return (
    <div className="w-full rounded-t-xl transition-all ease-out overflow-hidden"
      style={{ height: `${Math.max(h, 2)}%`, background: color, transitionDuration: "700ms", transitionDelay: `${delay}ms` }} />
  );
}

function WeeklyBars({ bars, labels, gradient }: { bars: number[]; labels: string[]; gradient: [string, string] }) {
  const max = Math.max(...bars, 1);
  const color = `linear-gradient(to top, ${gradient[0]}, ${gradient[1]})`;
  return (
    <div className="flex items-end gap-2 h-28">
      {bars.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
          <div className="relative w-full flex flex-col justify-end" style={{ height: "90px" }}>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded-lg
              opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10 shadow transition-opacity duration-150">
              {v}
            </div>
            <AnimatedBar pct={(v / max) * 100} color={color} delay={i * 60} />
          </div>
          <span className="text-xs text-slate-400 font-medium">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ slices, total }: { slices: { label: string; value: number; color: string }[]; total: number }) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 200); return () => clearTimeout(t); }, []);
  const R = 76; const CX = 92; const CY = 92; const stroke = 22;
  const circ = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <svg width="184" height="184" className="shrink-0">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        {slices.filter(s => s.value > 0).map((s, i) => {
          const frac = drawn ? s.value / total : 0;
          const dash = frac * circ;
          const gap = circ - dash;
          const el = (
            <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={s.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset}
              strokeLinecap="butt" transform={`rotate(-90 ${CX} ${CY})`}
              style={{ transition: "stroke-dasharray 900ms ease", transitionDelay: `${i * 80}ms` }} />
          );
          offset += (s.value / total) * circ;
          return el;
        })}
        <text x={CX} y={CY - 12} textAnchor="middle" fontSize="11" fill="#94a3b8" fontWeight="500">Toplam</text>
        <text x={CX} y={CY + 16} textAnchor="middle" fontSize="30" fontWeight="800" fill="#0f172a">{total}</text>
      </svg>
      <div className="space-y-2.5 flex-1 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2.5 text-xs group">
            <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ background: s.color }} />
            <span className="text-slate-500 truncate flex-1 group-hover:text-slate-700 transition-colors">{s.label}</span>
            <span className="font-bold text-slate-800 shrink-0 tabular-nums">{s.value}</span>
            <span className="text-slate-300 text-xs shrink-0">{((s.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SatisfactionGauge({ rate, reviewCount }: { rate: number; reviewCount: number }) {
  const [r, setR] = useState(0);
  useEffect(() => { const t = setTimeout(() => setR(rate), 300); return () => clearTimeout(t); }, [rate]);
  const R = 48; const CX = 70; const CY = 68;
  const circ = Math.PI * R;
  const dash = (r / 100) * circ;
  const color = r >= 80 ? "#34d399" : r >= 60 ? "#fbbf24" : "#f87171";
  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="84" viewBox="0 0 140 84">
        <path d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round" />
        <path d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 6px ${color}88)` }} />
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="20" fontWeight="800" fill="#0f172a">{r.toFixed(0)}%</text>
        <text x={CX} y={CY + 14} textAnchor="middle" fontSize="9" fill="#94a3b8">{reviewCount} yorum</text>
      </svg>
      <p className="text-xs font-semibold mt-1" style={{ color }}>
        {r >= 80 ? "Mükemmel" : r >= 60 ? "İyi" : "Geliştirilmeli"}
      </p>
    </div>
  );
}

function ProgressBar({ label, actual, target, gradient, format }: {
  label: string; actual: number; target: number; gradient: string; format: "price" | "count";
}) {
  const [w, setW] = useState(0);
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  const done = pct >= 100;
  useEffect(() => { const t = setTimeout(() => setW(pct), 200); return () => clearTimeout(t); }, [pct]);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          {done && <CheckCircle2 size={12} className="text-emerald-500" />}
          {label}
        </span>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-800">
            {format === "price" ? formatPrice(actual) : actual.toLocaleString("tr-TR")}
          </span>
          <span className="text-xs text-slate-400"> / {format === "price" ? formatPrice(target) : target.toLocaleString("tr-TR")}</span>
        </div>
      </div>
      <div className="h-3 bg-white/30 rounded-full overflow-hidden relative">
        <div className="h-full rounded-full relative overflow-hidden"
          style={{ width: `${w}%`, background: done ? "#34d399" : gradient, transition: "width 900ms cubic-bezier(0.4,0,0.2,1)" }}>
          <div className="absolute inset-0 bg-white/25" style={{
            animation: "shimmer 2s infinite linear",
            backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
          }} />
        </div>
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-white/60">{pct.toFixed(0)}% tamamlandı</span>
        {done && <span className="text-xs text-emerald-300 font-semibold">Hedef aşıldı!</span>}
      </div>
    </div>
  );
}

function RingMeter({ pct, color, label, sub }: { pct: number; color: string; label: string; sub: string }) {
  const [drawn, setDrawn] = useState(0);
  useEffect(() => { const t = setTimeout(() => setDrawn(pct), 250); return () => clearTimeout(t); }, [pct]);
  const R = 38; const CX = 50; const CY = 50; const stroke = 11;
  const circ = 2 * Math.PI * R;
  const dash = (drawn / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" transform={`rotate(-90 ${CX} ${CY})`}
          style={{ transition: "stroke-dasharray 900ms cubic-bezier(0.4,0,0.2,1)" }} />
        <text x={CX} y={CY - 5} textAnchor="middle" fontSize="15" fontWeight="800" fill="#0f172a">{drawn.toFixed(0)}%</text>
        <text x={CX} y={CY + 12} textAnchor="middle" fontSize="8.5" fill="#94a3b8">{sub}</text>
      </svg>
      <p className="text-xs font-semibold text-slate-600 text-center">{label}</p>
    </div>
  );
}

function SegmentBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 300); return () => clearTimeout(t); }, []);
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div>
      <div className="flex rounded-full overflow-hidden h-4 gap-0.5">
        {segments.map((seg, i) => (
          <div key={i} className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: drawn ? `${(seg.value / total) * 100}%` : "0%",
              background: seg.color,
              transitionDelay: `${i * 120}ms`,
            }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
            <span className="text-slate-500">{seg.label}</span>
            <span className="font-bold text-slate-700">{seg.value}</span>
            <span className="text-slate-300">({((seg.value / total) * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroCard({
  value, label, sub, gradient, icon: Icon, alert, link, pulse,
}: {
  value: string; label: string; sub?: string; gradient: string;
  icon: React.ElementType; alert?: boolean; link?: string; pulse?: boolean;
}) {
  const inner = (
    <div className="relative rounded-2xl overflow-hidden p-5 h-full cursor-default group"
      style={{ background: gradient }}>
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-110" />
      <div className="absolute right-4 bottom-4 w-16 h-16 rounded-full bg-white/5" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Icon size={20} className="text-white" />
          </div>
          {pulse && alert && (
            <span className="relative flex h-3 w-3 mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>
          )}
        </div>
        <p className="text-3xl font-extrabold text-white tracking-tight leading-none">{value}</p>
        <p className="text-white/70 text-sm font-semibold mt-2">{label}</p>
        {sub && <p className="text-white/50 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  if (link) return <Link href={link} className="block h-full">{inner}</Link>;
  return inner;
}

type Period = "today" | "week" | "month";
const PERIOD_LABELS: Record<Period, string> = { today: "Bugün", week: "Bu Hafta", month: "Bu Ay" };

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshIn, setRefreshIn] = useState(30);
  const [period, setPeriod] = useState<Period>("today");

  const fetchData = useCallback(async () => {
    try {
      const data = await api.get<DashboardStats>("/api/admin/dashboard");
      setStats(data);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const iv = setInterval(() => {
      setRefreshIn(r => {
        if (r <= 1) { fetchData(); return 30; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const weekSalesRaw = (stats?.weeklyOrders ?? []).reduce((s, d) => s + d.revenue, 0);
  const weekOrdersRaw = (stats?.weeklyOrders ?? []).reduce((s, d) => s + d.orderCount, 0);
  const periodSalesRaw = period === "today" ? (stats?.todaySales ?? 0)
    : period === "week" ? weekSalesRaw
    : (stats?.monthSales ?? 0);
  const periodOrdersRaw = period === "today" ? (stats?.todayOrderCount ?? 0)
    : period === "week" ? weekOrdersRaw
    : (stats?.monthOrderCount ?? 0);

  const periodSalesAnim = useCountUp(periodSalesRaw);
  const periodOrdersAnim = useCountUp(periodOrdersRaw, 800);
  const todaySales = useCountUp(stats?.todaySales ?? 0);
  const monthSales = useCountUp(stats?.monthSales ?? 0);
  const todayOrderCount = useCountUp(stats?.todayOrderCount ?? 0, 800);
  const monthOrderCount = useCountUp(stats?.monthOrderCount ?? 0, 900);
  const pendingCount = useCountUp(stats?.pendingOrderCount ?? 0, 800);
  const criticalCount = useCountUp(stats?.criticalStockCount ?? 0, 800);
  const outOfStockAnim = useCountUp(stats?.outOfStockCount ?? 0, 700);
  const totalProductAnim = useCountUp(stats?.totalProductCount ?? 0, 600);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Yükleniyor...</p>
      </div>
    </div>
  );
  if (error) return <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-4 rounded-2xl">{error}</div>;
  if (!stats) return null;

  const statusSlices = (stats.orderStatusBreakdown ?? []).slice(0, 8).map(s => ({
    label: s.label, value: s.count, color: STATUS_COLORS[s.status] ?? "#94a3b8",
  }));
  const statusTotal = statusSlices.reduce((s, x) => s + x.value, 0) || 1;
  const hasGoal = !!(stats.monthTargetRevenue || stats.monthTargetOrderCount);
  const refundOrderCount = (stats.orderStatusBreakdown ?? []).find(s => s.status === 9)?.count ?? 0;
  const holdOrderCount = (stats.orderStatusBreakdown ?? []).find(s => s.status === 12)?.count ?? 0;
  const totalRevenue12 = (stats.monthlySummary ?? []).reduce((s, m) => s + m.revenue, 0);

  const tickerItems = [
    `Bu ay ${stats.monthOrderCount ?? 0} sipariş`,
    `${stats.activeCustomerCount ?? 0} aktif müşteri`,
    `${stats.reviewCount ?? 0} yorum`,
    `${stats.cancelledOrderCount ?? 0} iptal sipariş`,
    `${(stats.monthlySummary ?? []).length} aylık veri`,
  ];

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Period tabs */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 gap-0.5">
            {(["today", "week", "month"] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === p
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-[160px]">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
            <LiveTicker items={tickerItems} />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <Activity size={13} className="text-teal-500" />
            <span>Canlı</span>
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-slate-300">|</span>
            <span className="tabular-nums">{refreshIn}s</span>
          </div>
        </div>
      </div>

      {/* ── BÖLÜM 0: STOK ───────────────────────────────────────────── */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-violet-100 border border-violet-200 rounded-xl px-3 py-1.5 shrink-0">
            <Boxes size={13} className="text-violet-600" />
            <span className="text-xs font-extrabold text-violet-700 uppercase tracking-wider">Stok</span>
          </div>
          <div className="flex-1 h-px bg-slate-300" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Toplam Ürün */}
          <HeroCard
            value={String(totalProductAnim)}
            label="Toplam Ürün"
            sub="aktif ürün"
            gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
            icon={Package}
            link="/urunler"
          />
          {/* Sağlıklı Stok */}
          <HeroCard
            value={String(Math.max((stats.totalProductCount ?? 0) - (stats.criticalStockCount ?? 0), 0))}
            label="Sağlıklı Stok"
            sub="yeterli stoklu ürün"
            gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
            icon={CheckCircle2}
          />
          {/* Kritik Eşikte */}
          <HeroCard
            value={String(criticalCount)}
            label="Kritik Eşikte"
            sub="eşik altında ürün"
            gradient={stats.criticalStockCount > 0
              ? "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)"
              : "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)"}
            icon={AlertTriangle}
            link="/stok"
            alert={stats.criticalStockCount > 0}
            pulse={stats.criticalStockCount > 0}
          />
          {/* Tükenen */}
          <HeroCard
            value={String(outOfStockAnim)}
            label="Tükenen Ürün"
            sub="stok sıfır"
            gradient={stats.outOfStockCount > 0
              ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
              : "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)"}
            icon={PackageX}
            link="/stok"
            alert={stats.outOfStockCount > 0}
            pulse={stats.outOfStockCount > 0}
          />
        </div>

        {/* Stok alarm bandı */}
        {(stats.outOfStockCount > 0 || stats.criticalStockCount > 0) && (
          <Link href="/stok"
            className="flex items-center gap-3 bg-red-50 border-2 border-red-400 rounded-2xl px-5 py-4 shadow-sm shadow-red-100 hover:bg-red-100 hover:border-red-500 transition-all group">
            <span className="relative flex h-5 w-5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 items-center justify-center">
                <AlertTriangle size={11} className="text-white" />
              </span>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-700">
                Tükenen ürünler var — Acil müdahale gerekiyor!
              </p>
            </div>
            <span className="ml-auto text-xs text-red-500 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all whitespace-nowrap shrink-0">
              Stok Yönetimi <ArrowUpRight size={13} />
            </span>
          </Link>
        )}
      </div>

      {/* ── BÖLÜM 1: SİPARİŞLER ─────────────────────────────────────── */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-indigo-100 border border-indigo-200 rounded-xl px-3 py-1.5 shrink-0">
            <ShoppingCart size={13} className="text-indigo-600" />
            <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">Siparişler</span>
          </div>
          <div className="flex-1 h-px bg-slate-300" />
        </div>

        {/* Sipariş KPI kartları */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <HeroCard
            value={String(periodOrdersAnim)}
            label={`${PERIOD_LABELS[period]} Sipariş`}
            sub="adet"
            gradient="linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)"
            icon={ShoppingCart}
          />
          <HeroCard
            value={String(monthOrderCount)}
            label="Bu Ay Toplam"
            sub={`${stats.todayOrderCount} bugün`}
            gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
            icon={Activity}
          />
          <HeroCard
            value={String(pendingCount)}
            label="Bekleyen Sipariş"
            sub="işlem bekliyor"
            gradient={stats.pendingOrderCount > 0
              ? "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)"
              : "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)"}
            icon={Clock}
            link="/siparisler"
            alert={stats.pendingOrderCount > 0}
            pulse={stats.pendingOrderCount > 0}
          />
        </div>

        {/* Sipariş alarm bandı */}
        {(refundOrderCount > 0 || holdOrderCount > 0) && (
          <Link href={refundOrderCount > 0 ? "/siparisler?status=9" : "/siparisler?status=12"}
            className={`flex items-center gap-3 rounded-2xl px-5 py-4 shadow-sm border-2 transition-all group ${
              refundOrderCount > 0
                ? "bg-red-50 border-red-400 shadow-red-100 hover:bg-red-100 hover:border-red-500"
                : "bg-amber-50 border-amber-400 shadow-amber-100 hover:bg-amber-100 hover:border-amber-500"
            }`}>
            <span className="relative flex h-5 w-5 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${refundOrderCount > 0 ? "bg-red-400" : "bg-amber-400"}`} />
              <span className={`relative inline-flex rounded-full h-5 w-5 items-center justify-center ${refundOrderCount > 0 ? "bg-red-500" : "bg-amber-500"}`}>
                <AlertTriangle size={11} className="text-white" />
              </span>
            </span>
            <p className={`text-sm font-bold flex-1 ${refundOrderCount > 0 ? "text-red-700" : "text-amber-700"}`}>
              {[
                refundOrderCount > 0 && `${refundOrderCount} iade talebi`,
                holdOrderCount > 0 && `${holdOrderCount} askıdaki sipariş`,
              ].filter(Boolean).join(", ")} — İnceleme gerekiyor!
            </p>
            <span className={`ml-auto text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all whitespace-nowrap shrink-0 ${refundOrderCount > 0 ? "text-red-500" : "text-amber-600"}`}>
              Siparişlere Git <ArrowUpRight size={13} />
            </span>
          </Link>
        )}

        {/* Sipariş grafik + durum dağılımı */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {(stats.weeklyOrders?.length ?? 0) > 0 && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <ShoppingCart size={14} className="text-indigo-500" /> Son 7 Gün — Sipariş
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Toplam <span className="font-bold text-indigo-600">{stats.weeklyOrders.reduce((s, d) => s + d.orderCount, 0)}</span>
                </p>
              </div>
              <WeeklyBars
                bars={stats.weeklyOrders.map(d => d.orderCount)}
                labels={stats.weeklyOrders.map(d => d.label)}
                gradient={["#6366f1", "#a78bfa"]}
              />
            </div>
          )}

          {statusSlices.length > 0 && (
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Activity size={14} className="text-teal-500" /> Sipariş Durum Dağılımı
                </h3>
                <Link href="/siparisler" className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1 font-medium transition-colors">
                  Tümü <ArrowUpRight size={11} />
                </Link>
              </div>
              <DonutChart slices={statusSlices} total={statusTotal} />
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <Clock size={13} className="text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs text-amber-600 font-semibold">Bekleyen</p>
                    <p className="text-lg font-extrabold text-amber-700">{stats.pendingOrderCount}</p>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <Ghost size={13} className="text-slate-500 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Yarıda Kalan</p>
                    <p className="text-lg font-extrabold text-slate-600">{stats.abandonedOrderCount ?? 0}</p>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <AlertTriangle size={13} className="text-red-500 shrink-0" />
                  <div>
                    <p className="text-xs text-red-500 font-semibold">İptal</p>
                    <p className="text-lg font-extrabold text-red-600">{stats.cancelledOrderCount ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── BÖLÜM 2: GELİR ───────────────────────────────────────────── */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-100 border border-emerald-200 rounded-xl px-3 py-1.5 shrink-0">
            <TrendingUp size={13} className="text-emerald-600" />
            <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">Gelir</span>
          </div>
          <div className="flex-1 h-px bg-slate-300" />
        </div>

        {/* Gelir KPI kartları */}
        <div className="grid grid-cols-2 gap-4">
          <HeroCard
            value={formatPrice(periodSalesAnim)}
            label={`${PERIOD_LABELS[period]} Geliri`}
            sub={`${periodOrdersRaw} sipariş`}
            gradient="linear-gradient(135deg, #10b981 0%, #14b8a6 100%)"
            icon={Zap}
          />
          <HeroCard
            value={formatPrice(monthSales)}
            label="Bu Ay Toplam"
            sub={`${formatPrice(todaySales)} bugün`}
            gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
            icon={TrendingUp}
          />
        </div>

        {/* 12 Aylık gelir grafiği */}
        {totalRevenue12 > 0 && (
          <div className="rounded-2xl p-5 shadow-sm" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} className="text-emerald-400" />
              <h3 className="font-bold text-white text-sm">12 Aylık Gelir</h3>
            </div>
            <p className="text-2xl font-extrabold text-white">{formatPrice(totalRevenue12)}</p>
            <p className="text-slate-400 text-xs mt-1">son 12 ay toplam</p>
            <div className="mt-3 flex items-end gap-1 h-10">
              {(stats.monthlySummary ?? []).map((m, i) => {
                const maxR = Math.max(...(stats.monthlySummary ?? []).map(x => x.revenue), 1);
                return (
                  <div key={m.month} className="flex-1 rounded-sm"
                    style={{
                      height: `${Math.max((m.revenue / maxR) * 100, 4)}%`,
                      background: `rgba(52, 211, 153, ${0.3 + (i / (stats.monthlySummary.length - 1 || 1)) * 0.7})`,
                    }} />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── BÖLÜM 3: MÜŞTERİLER ─────────────────────────────────────── */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-100 border border-amber-200 rounded-xl px-3 py-1.5 shrink-0">
            <Star size={13} className="text-amber-600" />
            <span className="text-xs font-extrabold text-amber-700 uppercase tracking-wider">Müşteriler</span>
          </div>
          <div className="flex-1 h-px bg-slate-300" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Memnuniyet gauge */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-3 self-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-300 flex items-center justify-center shadow">
                <Star size={15} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-700 text-sm">Müşteri Memnuniyeti</h3>
                <p className="text-xs text-slate-400">yorumlara göre</p>
              </div>
            </div>
            <SatisfactionGauge rate={stats.satisfactionRate ?? 0} reviewCount={stats.reviewCount ?? 0} />
          </div>

          {/* Aktiflik + Ortalama Sipariş ring'leri */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-1.5">
              <UserCheck size={14} className="text-violet-500" /> Müşteri Oranları
            </h3>
            <div className="flex justify-around items-center">
              <RingMeter
                pct={stats.totalCustomerCount ? Math.round((stats.activeCustomerCount ?? 0) / stats.totalCustomerCount * 100) : 0}
                color="#8b5cf6"
                label="Aktiflik Oranı"
                sub="son 30 gün"
              />
              <RingMeter
                pct={stats.totalCustomerCount ? Math.round((stats.newCustomerCount ?? 0) / stats.totalCustomerCount * 100) : 0}
                color="#10b981"
                label="Yeni Üye Oranı"
                sub="bu ay"
              />
            </div>
          </div>

          {/* Ortalama sipariş + müşteri segmentasyonu */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow">
                  <TrendingUp size={13} className="text-white" />
                </div>
                <h3 className="font-bold text-slate-700 text-sm">Ort. Sipariş Tutarı</h3>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {stats.monthOrderCount && stats.monthOrderCount > 0
                  ? formatPrice((stats.monthSales ?? 0) / stats.monthOrderCount)
                  : "—"}
              </p>
              <p className="text-xs text-slate-400">bu ay / sipariş başına</p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2.5 flex items-center gap-1">
                <Users size={11} /> Müşteri Dağılımı
              </p>
              <SegmentBar segments={[
                { label: "Aktif", value: stats.activeCustomerCount ?? 0, color: "#8b5cf6" },
                { label: "Yeni", value: Math.max((stats.newCustomerCount ?? 0) - (stats.activeCustomerCount ?? 0), 0), color: "#10b981" },
                { label: "Pasif", value: Math.max((stats.totalCustomerCount ?? 0) - (stats.activeCustomerCount ?? 0), 0), color: "#e2e8f0" },
              ]} />
            </div>
          </div>
        </div>
      </div>

      {/* ── BÖLÜM 5: HEDEFLER ────────────────────────────────────────── */}
      {hasGoal && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-blue-100 border border-blue-200 rounded-xl px-3 py-1.5 shrink-0">
              <Target size={13} className="text-blue-600" />
              <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">Hedefler</span>
            </div>
            <div className="flex-1 h-px bg-slate-300" />
            <Link href="/hedefler" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold transition-colors">
              Düzenle <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg"
            style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #0f766e 100%)" }}>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <p className="text-white/60 text-xs">{new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" })} hedefleri</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {stats.monthTargetRevenue && stats.monthTargetRevenue > 0 && (
                  <ProgressBar label="Gelir Hedefi" actual={stats.monthSales ?? 0}
                    target={stats.monthTargetRevenue} gradient="linear-gradient(to right, #6366f1, #2dd4bf)" format="price" />
                )}
                {stats.monthTargetOrderCount && stats.monthTargetOrderCount > 0 && (
                  <ProgressBar label="Sipariş Hedefi" actual={stats.monthOrderCount ?? 0}
                    target={stats.monthTargetOrderCount} gradient="linear-gradient(to right, #0ea5e9, #8b5cf6)" format="count" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BÖLÜM 6: KULLANICILAR ────────────────────────────────────── */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-violet-100 border border-violet-200 rounded-xl px-3 py-1.5 shrink-0">
            <Users size={13} className="text-violet-600" />
            <span className="text-xs font-extrabold text-violet-700 uppercase tracking-wider">Kullanıcılar</span>
          </div>
          <div className="flex-1 h-px bg-slate-300" />
          <Link href="/kullanicilar" className="text-xs text-violet-600 hover:text-violet-800 flex items-center gap-1 font-semibold transition-colors">
            Tümü <ArrowUpRight size={11} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Toplam", value: stats.totalCustomerCount ?? 0, color: "text-slate-900" },
                { label: "Aktif (30g)", value: stats.activeCustomerCount ?? 0, color: "text-violet-600" },
                { label: "Yeni (Bu Ay)", value: stats.newCustomerCount ?? 0, color: "text-emerald-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1"><UserCheck size={11} className="text-violet-400" /> Son 30 gün aktif</span>
              <span className="flex items-center gap-1"><Package size={11} className="text-emerald-400" /> Bu ay yeni</span>
            </div>
          </div>

          {(stats.weeklyNewUsers?.length ?? 0) > 0 && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Users size={14} className="text-violet-500" /> Son 7 Gün — Yeni Üye
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Toplam <span className="font-bold text-violet-600">{stats.weeklyNewUsers.reduce((s, d) => s + d.count, 0)}</span>
                </p>
              </div>
              <WeeklyBars
                bars={stats.weeklyNewUsers.map(d => d.count)}
                labels={stats.weeklyNewUsers.map(d => d.label)}
                gradient={["#8b5cf6", "#d8b4fe"]}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
