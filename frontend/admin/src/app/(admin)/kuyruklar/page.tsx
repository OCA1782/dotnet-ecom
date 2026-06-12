"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import {
  RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle,
  ArrowRightCircle, Radio, Server, Database, GitBranch, Info,
  Package, Zap, Hash, TrendingUp, BarChart2, Layers, Cpu,
  AlertOctagon, ShoppingCart, CreditCard, RotateCcw,
  ArrowRight, ChevronRight, Loader2, Trash2, RotateCw, Ban,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface ByTypeItem {
  shortName: string;
  fullName: string;
  total: number;
  processed: number;
  pending: number;
  failed: number;
  successRate: number;
  lastActivity: string;
}

interface SagaStateItem {
  state: string;
  count: number;
  percent: number;
}

interface FailedMessage {
  Id: string;
  Type: string;
  RetryCount: number;
  Error: string | null;
  CreatedAt: string;
  ShortType: string;
}

interface PendingMessage {
  Id: string;
  Type: string;
  RetryCount: number;
  CreatedAt: string;
  ShortType: string;
}

interface CancelledJob {
  id: string;
  sourceName: string;
  targetEntity: string;
  totalRows: number;
  processedRows: number;
  errorMessage: string | null;
  completedAt: string;
}

interface QueueData {
  stats: { total: number; processed: number; pending: number; failed: number };
  byType: ByTypeItem[];
  sagaStates: SagaStateItem[];
  totalSagas: number;
  recentFailed: FailedMessage[];
  recentPending: PendingMessage[];
  cancelledCount: number;
  cancelledJobs: CancelledJob[];
  broker: { provider: string; host: string; port: string; virtualHost: string; username: string; isConfigured: boolean };
  outboxProcessor: { batchSize: number; intervalSecs: number; maxRetries: number };
  checkedAt: string;
}

interface QueueSnapshot { ts: Date; processed: number; pending: number; }

type LatencyPoint = number | null;

const REFRESH_INTERVAL = 5;
const MAX_HISTORY = 24;

// ── Static data ────────────────────────────────────────────────────────────

const EVENT_TYPES_STATIC: Array<{
  name: string; queue: string; descKey: string; descFallback: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string; bgColor: string; borderColor: string;
}> = [
  { name: "OrderCreated",       queue: "order-created",        descKey: "auto.eventDesc.orderCreated",       descFallback: "Yeni sipariş oluşturulduğunda tetiklenir. E-posta bildirimi ve saga başlatır.",      icon: ShoppingCart,     color: "text-teal-700",    bgColor: "bg-teal-50",    borderColor: "border-teal-200" },
  { name: "PaymentCompleted",   queue: "payment-completed",    descKey: "auto.eventDesc.paymentCompleted",   descFallback: "Ödeme başarıyla tamamlandığında. Siparişi işleniyor durumuna alır.",                   icon: CreditCard,       color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
  { name: "OrderStatusChanged", queue: "order-status-changed", descKey: "auto.eventDesc.orderStatusChanged", descFallback: "Sipariş durumu güncellendiğinde. Müşteriye bildirim gönderir.",                       icon: ArrowRightCircle, color: "text-blue-700",    bgColor: "bg-blue-50",    borderColor: "border-blue-200" },
  { name: "OrderCancelled",     queue: "order-cancelled",      descKey: "auto.eventDesc.orderCancelled",     descFallback: "Sipariş iptal edildiğinde. Stoku geri iade eder, ödeme iadesini başlatır.",           icon: XCircle,          color: "text-amber-700",   bgColor: "bg-amber-50",   borderColor: "border-amber-200" },
  { name: "StockAlert",         queue: "stock-alert",          descKey: "auto.eventDesc.stockAlert",         descFallback: "Stok kritik eşiğin altına düştüğünde. Admin'e uyarı e-postası gönderir.",            icon: Package,          color: "text-red-700",     bgColor: "bg-red-50",     borderColor: "border-red-200" },
  { name: "ReturnRequested",    queue: "return-requested",     descKey: "auto.eventDesc.returnRequested",    descFallback: "İade talebi oluşturulduğunda. Admin onayı bekletir, e-posta bildirir.",               icon: RotateCcw,        color: "text-violet-700",  bgColor: "bg-violet-50",  borderColor: "border-violet-200" },
];

const CONSUMERS_STATIC = [
  { name: "OrderCreatedConsumer",       event: "OrderCreated",       descKey: "auto.consumerDesc.orderCreated",       descFallback: "Sipariş kaydı + stok düşürme + e-posta" },
  { name: "PaymentCompletedConsumer",   event: "PaymentCompleted",   descKey: "auto.consumerDesc.paymentCompleted",   descFallback: "Sipariş statüsü güncelleme" },
  { name: "OrderStatusChangedConsumer", event: "OrderStatusChanged", descKey: "auto.consumerDesc.orderStatusChanged", descFallback: "Müşteri bildirim e-postası" },
  { name: "OrderProcessingSaga",        event: "Saga State Machine", descKey: "auto.consumerDesc.orderProcessingSaga",descFallback: "Sipariş → Ödeme → Kargo → Teslim akışı" },
];

const SAGA_BADGE: Record<string, string> = {
  WaitingForPayment: "bg-amber-50 border-amber-200 text-amber-700",
  Processing:        "bg-teal-50 border-teal-200 text-teal-700",
  Shipped:           "bg-violet-50 border-violet-200 text-violet-700",
  Completed:         "bg-emerald-50 border-emerald-200 text-emerald-700",
  Cancelled:         "bg-red-50 border-red-200 text-red-700",
};
const SAGA_BAR: Record<string, string> = {
  WaitingForPayment: "bg-amber-400",
  Processing:        "bg-teal-400",
  Shipped:           "bg-violet-400",
  Completed:         "bg-emerald-400",
  Cancelled:         "bg-red-400",
};

// ── Helper components ──────────────────────────────────────────────────────

function Sparkline({ points, color }: { points: LatencyPoint[]; color: string }) {
  const valid = points.filter((p): p is number => p !== null);
  if (valid.length < 2) return null;
  const max = Math.max(...valid, 1);
  const w = 120; const h = 28;
  const pts = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = p !== null ? h - (p / max) * (h - 2) : h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="inline-block align-middle">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function PulseIndicator() {
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      CANLI
    </span>
  );
}

function FlowNode({ icon: Icon, label, sub, color }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string; sub?: string;
  color: "teal" | "violet" | "emerald" | "amber" | "red" | "slate";
}) {
  const cfg = {
    teal:    "bg-teal-50 border-teal-200 text-teal-700",
    violet:  "bg-violet-50 border-violet-200 text-violet-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber:   "bg-amber-50 border-amber-200 text-amber-700",
    red:     "bg-red-50 border-red-200 text-red-700",
    slate:   "bg-slate-50 border-slate-200 text-slate-600",
  };
  return (
    <div className="flex flex-col items-center gap-1 min-w-[80px]">
      <div className={`flex flex-col items-center gap-1.5 border rounded-xl px-3 py-2.5 ${cfg[color]}`}>
        <Icon size={16} />
        <span className="text-[11px] font-semibold text-center leading-tight">{label}</span>
      </div>
      {sub && <span className="text-[9px] text-slate-400 text-center">{sub}</span>}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function KuyrukPage() {
  const { t } = useI18n();

  const SAGA_LABEL: Record<string, string> = {
    WaitingForPayment: t("auto.saga.waitingForPayment", "Ödeme Bekleniyor"),
    Processing:        t("auto.saga.processing", "İşleniyor"),
    Shipped:           t("auto.saga.shipped", "Kargoya Verildi"),
    Completed:         t("auto.saga.completed", "Tamamlandı"),
    Cancelled:         t("auto.saga.cancelled", "İptal Edildi"),
  };

  const EVENT_TYPES = EVENT_TYPES_STATIC.map(e => ({ ...e, desc: t(e.descKey, e.descFallback) }));
  const CONSUMERS   = CONSUMERS_STATIC.map(c => ({ ...c, desc: t(c.descKey, c.descFallback) }));

  const [data, setData]             = useState<QueueData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [countdown, setCountdown]   = useState(REFRESH_INTERVAL);
  const [history, setHistory]       = useState<QueueSnapshot[]>([]);
  const [throughput, setThroughput] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionResult,  setActionResult]  = useState<Record<string, { ok: boolean; message: string }>>({});
  const lastSnapRef = useRef<QueueSnapshot | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadedRef = useRef(false);

  async function load(manual = false) {
    if (manual) setRefreshing(true);
    else if (!loadedRef.current) setLoading(true);
    try {
      const res = await api.get<QueueData>("/api/admin/queues");
      const now = new Date();
      if (lastSnapRef.current) {
        const prev = lastSnapRef.current;
        const elapsedMin = (now.getTime() - prev.ts.getTime()) / 60000;
        const delta = res.stats.processed - prev.processed;
        if (delta >= 0 && elapsedMin > 0) setThroughput(Math.round(delta / elapsedMin));
      }
      const snap: QueueSnapshot = { ts: now, processed: res.stats.processed, pending: res.stats.pending };
      lastSnapRef.current = snap;
      setHistory(prev => [...prev, snap].slice(-MAX_HISTORY));
      setData(res);
      setLastRefresh(now);
      loadedRef.current = true;
    } catch {
      // keep existing data on error
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(REFRESH_INTERVAL);
    }
  }

  function startAuto() {
    intervalRef.current  = setInterval(() => load(false), REFRESH_INTERVAL * 1000);
    countdownRef.current = setInterval(() => setCountdown(c => (c <= 1 ? REFRESH_INTERVAL : c - 1)), 1000);
  }
  function stopAuto() {
    if (intervalRef.current)  clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
      startAuto();
    }, 0);
    return () => {
      window.clearTimeout(id);
      stopAuto();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRefresh() { stopAuto(); load(true).then(() => startAuto()); }

  async function runAction(key: string, fn: () => Promise<{ message?: string } | undefined>) {
    setActionLoading(prev => ({ ...prev, [key]: true }));
    setActionResult(prev => { const n = { ...prev }; delete n[key]; return n; });
    try {
      const res = await fn();
      setActionResult(prev => ({ ...prev, [key]: { ok: true, message: res?.message ?? t("status.success", "Başarılı") } }));
      load(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("msg.error", "Bir hata oluştu");
      setActionResult(prev => ({ ...prev, [key]: { ok: false, message: msg } }));
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  }

  const stats      = data?.stats;
  const hasFailed  = (stats?.failed  ?? 0) > 0;
  const hasPending = (stats?.pending ?? 0) > 100;
  const successRate = stats && stats.total > 0
    ? ((stats.processed / stats.total) * 100).toFixed(1) : null;
  const processedHist: LatencyPoint[] = history.map(s => s.processed);
  const pendingHist:   LatencyPoint[] = history.map(s => s.pending);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden shadow-sm"
        style={{ background: hasFailed
          ? "linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)"
          : hasPending
          ? "linear-gradient(135deg, #b45309 0%, #d97706 100%)"
          : "linear-gradient(135deg, #0f766e 0%, #0891b2 100%)" }}>
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 shadow">
              <Cpu size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">{t("page./kuyruklar", "Kuyruk İzleme")}</h1>
              <p className="text-teal-100 text-xs mt-0.5">{t("auto.kuyrukSubtitle", "Outbox mesajları, saga durumları ve event consumer'ların anlık izlenmesi")}</p>
              {stats && (
                <div className="flex items-center gap-3 mt-1.5 text-xs">
                  <span className="text-emerald-200 font-semibold">{stats.processed.toLocaleString("tr-TR")} {t("auto.islendi", "işlendi")}</span>
                  {stats.pending > 0 && <span className="text-amber-200 font-semibold">{stats.pending} {t("auto.bekliyor", "bekliyor")}</span>}
                  {stats.failed  > 0 && <span className="text-red-200 font-semibold">{stats.failed} {t("status.failed", "başarısız")}</span>}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <PulseIndicator />
            <div className="flex items-center gap-1.5 text-xs text-white/70 bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg">
              <Radio size={11} className="text-teal-300" />
              <span>{countdown}s</span>
            </div>
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-2 bg-white text-teal-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-teal-50 transition shadow disabled:opacity-50">
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> {t("action.refresh", "Yenile")}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Alerts ─────────────────────────────────────────────────── */}
      {hasFailed && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertOctagon size={20} className="text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-700">{t("auto.basarisizMesajlarVar", "Başarısız mesajlar var")}</p>
            <p className="text-xs text-red-500 mt-0.5">
              {stats?.failed} {t("auto.basarisizMesajAciklama", "mesaj 5+ kez denendi ve işlenemedi. Aşağıdaki listeden inceleyip yeniden kuyruğa alabilirsiniz.")}
            </p>
          </div>
        </div>
      )}
      {hasPending && !hasFailed && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle size={20} className="text-amber-500 shrink-0" />
          <p className="text-sm font-semibold text-amber-700">{t("auto.yuksekBekleyenMesaj", "Yüksek bekleyen mesaj sayısı")}: {stats?.pending}. {t("auto.islemHiziDusuk", "İşlem hızı düşük olabilir.")}</p>
        </div>
      )}

      {/* ─── KPI Cards ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
              <div className="h-3 bg-slate-100 rounded w-20 mb-3" /><div className="h-8 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t("col.pending", "Bekleyen")}</p>
            <p className={`text-3xl font-extrabold ${stats.pending > 50 ? "text-amber-600" : "text-slate-900"}`}>
              {stats.pending.toLocaleString("tr-TR")}
            </p>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1"><Clock size={11} /> {t("auto.islenmesiBekleyen", "İşlenmesini bekleyen")}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t("col.processed", "İşlenen")}</p>
            <p className="text-3xl font-extrabold text-emerald-600">{stats.processed.toLocaleString("tr-TR")}</p>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1"><CheckCircle2 size={11} /> {t("auto.basariylaBasarilan", "Başarıyla tamamlanan")}</p>
          </div>
          <div className={`bg-white rounded-2xl border shadow-sm p-5 ${stats.failed > 0 ? "border-red-200" : "border-slate-200"}`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t("col.failed", "Başarısız")}</p>
            <p className={`text-3xl font-extrabold ${stats.failed > 0 ? "text-red-600" : "text-slate-900"}`}>
              {stats.failed.toLocaleString("tr-TR")}
            </p>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1"><XCircle size={11} /> {t("auto.dlqTasınan", "DLQ'ya taşınan")}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Throughput</p>
            <p className={`text-3xl font-extrabold ${throughput !== null && throughput > 0 ? "text-teal-600" : "text-slate-400"}`}>
              {throughput !== null ? throughput : "—"}
            </p>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1"><TrendingUp size={11} /> Mesaj / dakika</p>
          </div>
        </div>
      ) : null}

      {/* ─── Success Rate + Sparklines ──────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {successRate && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-600">{t("auto.genelBasariOrani", "Genel Başarı Oranı")}</p>
                <span className={`text-sm font-bold ${parseFloat(successRate) >= 95 ? "text-emerald-600" : parseFloat(successRate) >= 80 ? "text-amber-600" : "text-red-600"}`}>
                  %{successRate}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all duration-700 ${parseFloat(successRate) >= 95 ? "bg-emerald-400" : parseFloat(successRate) >= 80 ? "bg-amber-400" : "bg-red-400"}`}
                  style={{ width: `${successRate}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div><p className="text-slate-400">{t("auto.toplam", "Toplam")}</p><p className="font-bold text-slate-700">{stats.total.toLocaleString("tr-TR")}</p></div>
                <div><p className="text-slate-400">{t("col.processed", "İşlendi")}</p><p className="font-bold text-emerald-600">{stats.processed.toLocaleString("tr-TR")}</p></div>
                <div><p className="text-slate-400">{t("col.failed", "Başarısız")}</p><p className={`font-bold ${stats.failed > 0 ? "text-red-600" : "text-slate-400"}`}>{stats.failed.toLocaleString("tr-TR")}</p></div>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-600 mb-3">{t("auto.kuyrukTarihcesi", "Kuyruk Tarihçesi")} ({t("auto.son", "Son")} {history.length} {t("auto.olcum", "ölçüm")})</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 w-16 shrink-0">{t("col.processed", "İşlenen")}</span>
                <Sparkline points={processedHist} color="#10b981" />
                <span className="text-xs text-emerald-600 font-semibold tabular-nums">{stats.processed}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 w-16 shrink-0">{t("col.pending", "Bekleyen")}</span>
                <Sparkline points={pendingHist} color={stats.pending > 50 ? "#f59e0b" : "#94a3b8"} />
                <span className={`text-xs font-semibold tabular-nums ${stats.pending > 50 ? "text-amber-600" : "text-slate-400"}`}>{stats.pending}</span>
              </div>
              {history.length < 3 && <p className="text-[10px] text-slate-300 italic">{t("auto.grafikIcinOlcum", "Grafik için en az 3 ölçüm gerekiyor...")}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ─── Event Tipi Dağılımı ─────────────────────────────────────── */}
      {data && data.byType.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <BarChart2 size={16} className="text-teal-600" />
            <h2 className="text-sm font-semibold text-slate-700">{t("auto.eventTipiDagilimi", "Event Tipi Dağılımı")}</h2>
            <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
              {lastRefresh && <><Clock size={11} /> {lastRefresh.toLocaleTimeString("tr-TR")}</>}
            </span>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-500">{t("auto.eventTipi", "Event Tipi")}</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-500">{t("auto.toplam", "Toplam")}</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-500">{t("col.processed", "İşlenen")}</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-500">{t("col.pending", "Bekleyen")}</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-500">{t("col.failed", "Başarısız")}</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-500">{t("auto.basari", "Başarı")}</th>
                <th className="text-right px-5 py-3 font-semibold text-slate-500 hidden md:table-cell">{t("auto.sonAktivite", "Son Aktivite")}</th>
              </tr>
            </thead>
            <tbody>
              {data.byType.map(row => (
                <tr key={row.shortName} className="border-t border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-5 py-3">
                    <span className="font-mono font-bold text-slate-800">{row.shortName}</span>
                    <div className="mt-1 h-1 bg-slate-100 rounded-full overflow-hidden w-28">
                      <div className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                        style={{ width: `${row.total > 0 ? (row.processed / row.total) * 100 : 0}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 font-medium tabular-nums">{row.total.toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-600 tabular-nums">{row.processed.toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className={`font-semibold ${row.pending > 0 ? "text-amber-600" : "text-slate-400"}`}>{row.pending.toLocaleString("tr-TR")}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className={`font-semibold ${row.failed > 0 ? "text-red-600" : "text-slate-400"}`}>{row.failed.toLocaleString("tr-TR")}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${row.successRate >= 95 ? "text-emerald-600" : row.successRate >= 80 ? "text-amber-600" : row.total === 0 ? "text-slate-400" : "text-red-600"}`}>
                      {row.total > 0 ? `%${row.successRate}` : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-[11px] text-slate-400 hidden md:table-cell">{fmtDate(row.lastActivity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Saga Durumları ──────────────────────────────────────────── */}
      {data && data.sagaStates.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <GitBranch size={16} className="text-violet-500" />
            <h2 className="text-sm font-semibold text-slate-700">{t("auto.siparisSagaDurumlari", "Sipariş Saga Durumları")}</h2>
            <span className="ml-auto text-xs text-slate-400">{data.totalSagas.toLocaleString("tr-TR")} {t("auto.toplamSaga", "toplam saga")}</span>
          </div>
          <div className="px-5 py-4 space-y-3">
            {data.sagaStates.map(s => (
              <div key={s.state} className="flex items-center gap-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border w-36 text-center shrink-0 ${SAGA_BADGE[s.state] ?? "bg-slate-50 border-slate-200 text-slate-700"}`}>
                  {SAGA_LABEL[s.state] ?? s.state}
                </span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${SAGA_BAR[s.state] ?? "bg-slate-400"}`}
                    style={{ width: `${s.percent}%` }} />
                </div>
                <span className="text-xs font-semibold text-slate-700 tabular-nums w-8 text-right">{s.count}</span>
                <span className="text-[10px] text-slate-400 tabular-nums w-10 text-right">%{s.percent}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Başarısız Mesajlar ──────────────────────────────────────── */}
      {data && (
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${hasFailed ? "border-red-200" : "border-slate-200"}`}>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 flex-wrap">
            <AlertOctagon size={16} className={hasFailed ? "text-red-500" : "text-slate-300"} />
            <h2 className="text-sm font-semibold text-slate-700">{t("auto.basarisizMesajlar", "Başarısız Mesajlar")}</h2>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${hasFailed ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-400"}`}>
              {data.recentFailed.length} {t("auto.gosteriliyor", "gösteriliyor")} (max 20)
            </span>
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              {["retry-all","delete-all"].map(k => actionResult[k] && (
                <span key={k} className={`text-xs px-2 py-0.5 rounded-full ${actionResult[k].ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {actionResult[k].message}
                </span>
              ))}
              {hasFailed && (
                <>
                  <button
                    onClick={() => runAction("retry-all", () => api.post<{ message: string }>("/api/admin/queues/retry-failed"))}
                    disabled={actionLoading["retry-all"]}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition disabled:opacity-50">
                    {actionLoading["retry-all"] ? <Loader2 size={12} className="animate-spin" /> : <RotateCw size={12} />}
                    {t("auto.tumunuYenidenDene", "Tümünü Yeniden Dene")}
                  </button>
                  <button
                    onClick={() => runAction("delete-all", () => api.delete<{ message: string }>("/api/admin/queues/failed"))}
                    disabled={actionLoading["delete-all"]}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition disabled:opacity-50">
                    {actionLoading["delete-all"] ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    {t("action.delete", "Sil")} {t("auto.tumunu", "Tümünü")}
                  </button>
                </>
              )}
            </div>
          </div>
          {data.recentFailed.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <CheckCircle2 size={24} className="text-emerald-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">{t("auto.basarisizMesajYok", "Başarısız mesaj yok.")}</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500">{t("auto.eventTipi", "Event Tipi")}</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-500">{t("auto.deneme", "Deneme")}</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 hidden md:table-cell">{t("col.error", "Hata")}</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-500 hidden md:table-cell">{t("col.date", "Tarih")}</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500">{t("col.action", "Aksiyon")}</th>
                </tr>
              </thead>
              <tbody>
                {data.recentFailed.map(m => {
                  const rk = `retry:${m.Id}`;
                  const dk = `delete:${m.Id}`;
                  return (
                    <tr key={m.Id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-5 py-3">
                        <span className="font-mono font-bold text-red-700">{m.ShortType}</span>
                        <span className="ml-2 text-[10px] text-slate-400 font-mono hidden lg:inline">{m.Id.substring(0,8)}…</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">{m.RetryCount}×</span>
                      </td>
                      <td className="px-4 py-3 max-w-xs hidden md:table-cell">
                        {m.Error && (
                          <span className="text-slate-500 truncate block" title={m.Error}>
                            {m.Error.length > 60 ? m.Error.substring(0, 60) + "…" : m.Error}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 hidden md:table-cell">{fmtDate(m.CreatedAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {actionResult[rk] && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${actionResult[rk].ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                              {actionResult[rk].ok ? "✓" : "✗"}
                            </span>
                          )}
                          {actionResult[dk] && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${actionResult[dk].ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                              {actionResult[dk].ok ? t("msg.deleted", "Başarıyla silindi").split(" ")[0] : "✗"}
                            </span>
                          )}
                          <button
                            onClick={() => runAction(rk, () => api.post<{ message: string }>(`/api/admin/queues/messages/${m.Id}/retry`))}
                            disabled={actionLoading[rk] || actionLoading[dk]}
                            title={t("action.retry", "Tekrar Dene")}
                            className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition disabled:opacity-50">
                            {actionLoading[rk] ? <Loader2 size={12} className="animate-spin" /> : <RotateCw size={12} />}
                          </button>
                          <button
                            onClick={() => runAction(dk, () => api.delete<{ message: string }>(`/api/admin/queues/messages/${m.Id}`))}
                            disabled={actionLoading[rk] || actionLoading[dk]}
                            title={t("action.delete", "Sil")}
                            className="p-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition disabled:opacity-50">
                            {actionLoading[dk] ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ─── Bekleyen Mesajlar ───────────────────────────────────────── */}
      {data && data.recentPending.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Clock size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-700">{t("auto.bekleyenMesajlar", "Bekleyen Mesajlar")}</h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 ml-1">
              {data.recentPending.length} {t("auto.onizleme", "önizleme")} · {t("auto.enEskiOnce", "en eski önce")}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentPending.map(m => (
              <div key={m.Id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 transition">
                <Clock size={11} className="text-amber-400 shrink-0" />
                <span className="font-mono text-xs font-bold text-slate-700 w-36 shrink-0">{m.ShortType}</span>
                <span className="text-[10px] text-slate-400 font-mono">{m.Id.substring(0,8)}…</span>
                <span className="ml-auto text-[10px] text-slate-400">{m.RetryCount > 0 ? `${m.RetryCount} ${t("auto.deneme", "deneme")}` : t("auto.yeni", "Yeni")}</span>
                <span className="text-[10px] text-slate-400">{fmtDate(m.CreatedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── İptal Edilenler ─────────────────────────────────────────── */}
      {data && (data.cancelledCount > 0 || data.cancelledJobs.length > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Ban size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">{t("auto.iptalEdilenler", "İptal Edilenler")}</h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 ml-1">
              {data.cancelledCount.toLocaleString("tr-TR")} {t("auto.toplam", "toplam")} · {t("auto.son20", "son 20")}
            </span>
          </div>
          {data.cancelledJobs.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <CheckCircle2 size={24} className="text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">{t("auto.iptalEdilenIslemYok", "İptal edilen işlem yok.")}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.cancelledJobs.map(j => {
                const targetLabel: Record<string, string> = { Product: t("auto.target.product", "Ürünler"), Category: t("auto.target.category", "Kategoriler"), Brand: t("auto.target.brand", "Markalar"), Stock: t("auto.target.stock", "Stok") };
                const byUser = j.errorMessage === "Kullanıcı tarafından iptal edildi.";
                const byDelete = j.errorMessage === "Kaynak silindi.";
                const progress = j.totalRows > 0 ? Math.round((j.processedRows / j.totalRows) * 100) : 0;
                return (
                  <div key={j.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition flex-wrap">
                    <Ban size={11} className="text-slate-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-700 truncate">{j.sourceName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium shrink-0">
                          {targetLabel[j.targetEntity] ?? j.targetEntity}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                          byUser   ? "bg-amber-50 text-amber-600 border border-amber-200" :
                          byDelete ? "bg-red-50 text-red-500 border border-red-200" :
                                     "bg-slate-50 text-slate-400 border border-slate-200"
                        }`}>
                          {byUser ? t("auto.kullaniciIptali", "Kullanıcı iptali") : byDelete ? t("auto.kaynakSilindi", "Kaynak silindi") : t("status.cancelled", "İptal Edildi")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-400">
                      <span className="tabular-nums">{j.processedRows.toLocaleString("tr-TR")} / {j.totalRows.toLocaleString("tr-TR")} {t("auto.satir", "satır")}</span>
                      <span className="font-semibold text-slate-500">%{progress}</span>
                      <span>{fmtDate(j.completedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Mesaj Akışı ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Layers size={16} className="text-teal-600" />
          <h2 className="text-sm font-semibold text-slate-700">{t("auto.mesajAkisi", "Mesaj Akışı")}</h2>
        </div>
        <div className="px-5 py-5">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-2">
            <FlowNode icon={Zap}          label={t("auto.flow.eventUretilir", "Event Üretilir")} sub="Domain event"        color="slate"   />
            <ArrowRight size={14} className="text-slate-300 shrink-0" />
            <FlowNode icon={Database}     label="Outbox DB"     sub={t("auto.flow.onceDbYaz", "Önce DB'ye yaz")}      color="teal"    />
            <ArrowRight size={14} className="text-slate-300 shrink-0" />
            <FlowNode icon={Server}       label="MassTransit"   sub={t("auto.flow.rabbitmqPublish", "RabbitMQ'ya publish")} color="violet"  />
            <ArrowRight size={14} className="text-slate-300 shrink-0" />
            <FlowNode icon={Cpu}          label="Consumer"      sub={t("auto.flow.handlerCalisir", "Handler çalışır")}     color="emerald" />
            <ArrowRight size={14} className="text-slate-300 shrink-0" />
            <FlowNode icon={CheckCircle2} label={t("status.completed", "Tamamlandı")}    sub="Processed=true"      color="emerald" />
          </div>
          <div className="flex items-center gap-1.5 mt-3 pl-[84px]">
            <span className="text-xs text-slate-300 flex items-center gap-1"><ChevronRight size={11} />5+ {t("auto.hata", "hata")}</span>
            <ArrowRight size={12} className="text-red-300 ml-1" />
            <FlowNode icon={AlertOctagon} label="DLQ" sub={t("auto.flow.manuelInceleme", "Manuel inceleme")} color="red" />
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            {t("auto.outboxGaranti", "Outbox pattern garantisi: event önce veritabanına yazılır; broker geçici olarak kapansa bile yeniden publish edilir.")}
          </p>
        </div>
      </div>

      {/* ─── Tanımlı Event Tipleri ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Zap size={16} className="text-violet-500" />
          <h2 className="text-sm font-semibold text-slate-700">{t("auto.tanimliEventTipleri", "Tanımlı Event Tipleri")}</h2>
          <span className="ml-auto text-xs text-slate-400">{EVENT_TYPES.length} {t("auto.eventTipi", "event tipi")}</span>
        </div>
        <div className="divide-y divide-slate-100">
          {EVENT_TYPES.map(evt => {
            const Icon = evt.icon;
            const live = data?.byType.find(row => row.shortName === evt.name);
            return (
              <div key={evt.name} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${evt.bgColor} ${evt.borderColor}`}>
                  <Icon size={15} className={evt.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800 font-mono">{evt.name}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${evt.bgColor} ${evt.color} ${evt.borderColor}`}>
                      {evt.queue}
                    </span>
                    {live && live.total > 0 && (
                      <span className="text-[10px] text-slate-400">{live.total} {t("auto.mesaj", "mesaj")} · %{live.successRate} {t("auto.basari", "başarı")}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{evt.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Consumer Listesi ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Cpu size={16} className="text-emerald-600" />
          <h2 className="text-sm font-semibold text-slate-700">{t("auto.tanimliConsumerlar", "Tanımlı Consumer'lar")}</h2>
          <span className="ml-auto text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
            {CONSUMERS.length} consumer
          </span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Consumer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Event / Tip</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 hidden md:table-cell">{t("auto.gorev", "Görev")}</th>
            </tr>
          </thead>
          <tbody>
            {CONSUMERS.map(c => (
              <tr key={c.name} className="border-t border-slate-100 hover:bg-slate-50 transition">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="font-mono text-xs font-semibold text-slate-800">{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full font-mono">
                    {c.event}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-slate-500 hidden md:table-cell">{c.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── DLQ + Broker + Outbox ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`bg-white rounded-2xl border shadow-sm p-5 ${hasFailed ? "border-red-200" : "border-slate-200"}`}>
          <div className="flex items-center gap-2 mb-4">
            <AlertOctagon size={16} className={hasFailed ? "text-red-500" : "text-slate-300"} />
            <h3 className="text-sm font-semibold text-slate-700">Dead Letter Queue</h3>
            <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${hasFailed ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"}`}>
              {stats?.failed ?? 0} {t("auto.mesaj", "mesaj")}
            </span>
          </div>
          <div className="space-y-2">
            {[
              [t("auto.dlq.maxDeneme", "Max Deneme"),      `${data?.outboxProcessor.maxRetries ?? 5} ${t("auto.kez", "kez")}`],
              [t("auto.dlq.batchBoyutu", "Batch Boyutu"),  `${data?.outboxProcessor.batchSize ?? 20} ${t("auto.mesaj", "mesaj")}`],
              [t("auto.dlq.kontrolAraligi", "Kontrol Aralığı"), `${data?.outboxProcessor.intervalSecs ?? 10}s`],
              [t("auto.dlq.yenidenGonder", "Yeniden Gönder"), "Manuel / Admin"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-400">{k}</span>
                <span className="text-xs font-mono text-slate-700">{v}</span>
              </div>
            ))}
          </div>
          {hasFailed && (
            <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              <strong>{stats?.failed}</strong> {t("auto.dlqUyari", "mesaj DLQ'da. Yukarıdaki listeden inceleyip yeniden kuyruğa alabilirsiniz.")}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server size={16} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-700">{t("auto.mesajBroker", "Mesaj Broker")}</h3>
            {data?.broker && (
              <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${data.broker.isConfigured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {data.broker.isConfigured ? t("auto.yapilandirildi", "Yapılandırıldı") : t("auto.varsayilan", "Varsayılan")}
              </span>
            )}
          </div>
          {data?.broker ? (
            <div className="space-y-2">
              {[
                [<Zap key="z" size={11} />,        t("auto.broker.saglayici", "Sağlayıcı"),    data.broker.provider],
                [<Server key="s" size={11} />,     "Host",         data.broker.host],
                [<Hash key="h" size={11} />,       "Port",         data.broker.port],
                [<GitBranch key="g" size={11} />,  "Virtual Host", data.broker.virtualHost],
              ].map(([icon, label, val]) => (
                <div key={String(label)} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">{icon}{label}</span>
                  <span className="text-xs font-mono text-slate-700">{String(val)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-slate-400">{t("action.loading", "Yükleniyor...")}</p>}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database size={16} className="text-violet-500" />
            <h3 className="text-sm font-semibold text-slate-700">{t("auto.outboxTablosu", "Outbox Tablosu")}</h3>
          </div>
          <div className="space-y-2">
            {[
              [<Package key="p" size={11} />,          t("auto.outbox.tablo", "Tablo"),         "OutboxMessages"],
              [<Info key="i" size={11} />,              "Pattern",      "Transactional Outbox"],
              [<ArrowRightCircle key="a" size={11} />,  t("auto.dlq.maxDeneme", "Max Deneme"),  `${data?.outboxProcessor.maxRetries ?? 5} ${t("auto.kez", "kez")}`],
              [<Zap key="z" size={11} />,               t("auto.eventTipleri", "Event Tipleri"), `${EVENT_TYPES.length} ${t("auto.tipTanimli", "tip tanımlı")}`],
            ].map(([icon, label, val]) => (
              <div key={String(label)} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">{icon}{label}</span>
                <span className="text-xs font-mono text-slate-700">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1.5">
        <Radio size={11} className="text-teal-400" />
        {t("auto.otomatikGuncelleme", "Her")} {REFRESH_INTERVAL}s {t("auto.otomatikGuncellemeDevam", "otomatik güncelleme")} · Outbox processor {t("auto.her", "her")} {data?.outboxProcessor.intervalSecs ?? 10}s&apos;{t("auto.deKontrolEder", "de kontrol eder")}
      </p>

    </div>
  );
}
