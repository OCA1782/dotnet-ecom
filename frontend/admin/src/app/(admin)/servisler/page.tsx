"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import {
  Activity, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  Database, Mail, Wifi, Server, Clock, Radio, TrendingUp,
  BarChart2, Info, ChevronDown, ChevronUp,
  AlertOctagon, Shield, Zap, Play, Loader2, Monitor, ExternalLink,
} from "lucide-react";
import Link from "next/link";

// ── Tipler ──────────────────────────────────────────────────────────────────

interface ServiceMeta {
  typeLabel?: string;
  url?: string;
  provider?: string;
  database?: string;
  port?: string;
  extra?: string;
}

interface ServiceItem {
  name: string;
  status: "ok" | "warn" | "down" | "info" | "unknown";
  value?: string;
  detail?: string;
}

interface ServiceStatus {
  name: string;
  status: "ok" | "degraded" | "down" | "unknown";
  responseMs?: number;
  detail?: string;
  meta?: ServiceMeta;
  checkedAt: string;
  items?: ServiceItem[];
}

interface HealthReport {
  services: ServiceStatus[];
  overallStatus: "ok" | "degraded" | "down";
  checkedAt: string;
}

interface ServiceStats {
  min: number; max: number; avg: number; p95: number;
  uptimePct: string; checks: number;
}

interface IncidentEntry {
  ts: Date; service: string; from: string; to: string;
}

type LatencyPoint = number | null;
const MAX_HISTORY    = 30;
const REFRESH_INTERVAL = 5;

// ── Konfigürasyon ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  ok:       { label: "Sağlıklı",   color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", icon: CheckCircle2 },
  degraded: { label: "Yavaş",      color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",   dot: "bg-amber-500",   icon: AlertTriangle },
  down:     { label: "Çevrimdışı", color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",     dot: "bg-red-500",     icon: XCircle },
  unknown:  { label: "Bilinmiyor", color: "text-slate-400",   bg: "bg-slate-50",   border: "border-slate-200",   dot: "bg-slate-300",   icon: AlertTriangle },
};

const ITEM_STATUS = {
  ok:      { dot: "bg-emerald-400", label: "text-emerald-600" },
  warn:    { dot: "bg-amber-400",   label: "text-amber-600" },
  down:    { dot: "bg-red-500",     label: "text-red-600" },
  info:    { dot: "bg-slate-300",   label: "text-slate-500" },
  unknown: { dot: "bg-slate-200",   label: "text-slate-400" },
};

const INCIDENT_COLORS: Record<string, string> = {
  ok:      "text-emerald-600 bg-emerald-50 border-emerald-200",
  degraded:"text-amber-600 bg-amber-50 border-amber-200",
  down:    "text-red-600 bg-red-50 border-red-200",
  unknown: "text-slate-400 bg-slate-50 border-slate-200",
};

// Hangi admin/müşteri ekranları bu servisden besleniyor
const SERVICE_SCREENS: Record<string, { href: string; label: string; note?: string }[]> = {
  "API": [
    { href: "/dashboard",    label: "Dashboard",     note: "tüm KPI sorgular" },
    { href: "/urunler",      label: "Ürünler",       note: "CRUD işlemleri" },
    { href: "/siparisler",   label: "Siparişler",    note: "liste, detay, durum" },
    { href: "/kullanicilar", label: "Kullanıcılar",  note: "liste, düzenleme" },
    { href: "/stok",         label: "Stok",          note: "güncelleme, hareketler" },
    { href: "/odemeler",     label: "Ödemeler",      note: "liste ve detay" },
    { href: "/yorumlar",     label: "Yorumlar",      note: "onaylama, red" },
    { href: "/kargo",        label: "Kargo",         note: "durum güncelleme" },
    { href: "/dogrulama",    label: "Doğrulama",     note: "endpoint kontrolleri" },
  ],
  "Veritabanı": [
    { href: "/dashboard",    label: "Dashboard",     note: "istatistik sorguları" },
    { href: "/urunler",      label: "Ürünler",       note: "katalog yönetimi" },
    { href: "/siparisler",   label: "Siparişler",    note: "tüm sipariş işlemleri" },
    { href: "/kullanicilar", label: "Kullanıcılar",  note: "hesap yönetimi" },
    { href: "/stok",         label: "Stok",          note: "stok takibi" },
    { href: "/hareketler",   label: "Hareketler",    note: "audit log okuma" },
    { href: "/faturalar",    label: "Faturalar",     note: "fatura kayıtları" },
    { href: "/kuponlar",     label: "Kuponlar",      note: "kupon CRUD" },
    { href: "/yonetim",      label: "Yönetim → Lisans", note: "lisans atamaları" },
  ],
  "Redis": [
    { href: "/dashboard",    label: "Dashboard",     note: "istatistik cache (12s TTL)" },
    { href: "/urunler",      label: "Ürünler",       note: "ürün listesi cache" },
    { href: "/kategoriler",  label: "Kategoriler",   note: "kategori cache" },
    { href: "/markalar",     label: "Markalar",      note: "marka cache" },
    { href: "/raporlar",     label: "Raporlar",      note: "satış raporu cache" },
    { href: "/dogrulama",    label: "Doğrulama",     note: "job sonuç cache (13s TTL)" },
    { href: "/yonetim",      label: "Yönetim → Lisans", note: "lisans doğrulama cache (5d)" },
  ],
  "RabbitMQ": [
    { href: "/siparisler",   label: "Siparişler",    note: "sipariş oluşturulunca event gönderilir" },
    { href: "/odemeler",     label: "Ödemeler",      note: "ödeme onaylanınca event gönderilir" },
    { href: "/siparisler",   label: "Sipariş Durumu",note: "durum değişiminde event gönderilir" },
    { href: "/kuyruklar",    label: "Kuyruklar",     note: "mesaj kuyruk yönetimi" },
  ],
  "E-posta": [
    { href: "/siparisler",   label: "Siparişler",    note: "sipariş onayı gönderilir" },
    { href: "/odemeler",     label: "Ödemeler",      note: "ödeme başarılı bildirimi" },
    { href: "/kargo",        label: "Kargo",         note: "kargo bildirim e-postası" },
    { href: "/yorumlar",     label: "Yorumlar",      note: "yorum red bildirimi" },
    { href: "/stok",         label: "Stok",          note: "düşük stok uyarısı (admin'e)" },
    { href: "/yonetim",      label: "Yönetim → SMTP",note: "test e-postası, lisans atama" },
  ],
};

// Her e-posta şablonunu hangi admin aksiyonu tetikler
const EMAIL_TRIGGERS: Record<string, { screen: string; href: string; action: string }> = {
  "SendOrderConfirmationAsync":    { screen: "Siparişler",  href: "/siparisler",  action: "Sipariş oluşturulduğunda" },
  "SendPaymentSuccessAsync":       { screen: "Ödemeler",    href: "/odemeler",    action: "Ödeme onaylandığında" },
  "SendShippingNotificationAsync": { screen: "Kargo",       href: "/kargo",       action: "Kargo bilgisi girildiğinde" },
  "SendPasswordResetAsync":        { screen: "Müşteri Giriş", href: "/",          action: "Müşteri şifremi unuttum" },
  "SendEmailVerificationAsync":    { screen: "Kayıt",       href: "/",            action: "Yeni müşteri kaydolduğunda" },
  "SendLowStockAlertAsync":        { screen: "Stok",        href: "/stok",        action: "Kritik stok eşiği aşıldığında" },
  "SendReviewRejectionAsync":      { screen: "Yorumlar",    href: "/yorumlar",    action: "Yorum reddedildiğinde" },
};

// RabbitMQ consumer → tetikleyici ekran
const RABBITMQ_TRIGGERS: Record<string, { screen: string; href: string; action: string }> = {
  "OrderCreatedConsumer":       { screen: "Siparişler",   href: "/siparisler",  action: "Sipariş oluşturulduğunda (CreateOrder)" },
  "PaymentCompletedConsumer":   { screen: "Ödemeler",     href: "/odemeler",    action: "Ödeme callback'i onaylandığında" },
  "OrderStatusChangedConsumer": { screen: "Siparişler",   href: "/siparisler",  action: "Sipariş durumu güncellendiğinde" },
  "OrderProcessingSaga":        { screen: "Siparişler",   href: "/siparisler",  action: "Sipariş akışı state machine" },
};

const SERVICE_META: Record<string, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  thresholdOk: number; thresholdWarn: number; sla: string;
  actions: { id: string; label: string; variant?: "primary" | "danger" }[];
}> = {
  "API":        { icon: Server,   description: "HTTP API sunucusu. Tüm admin ve müşteri istekleri bu katmandan geçer. JWT doğrulama, CORS, rate limiting ve hata loglama middleware'leri burada çalışır.",             thresholdOk: 100,  thresholdWarn: 300,  sla: "99.9%",  actions: [{ id: "ping-db",    label: "DB Ping Testi" }] },
  "Veritabanı": { icon: Database, description: "SQL veritabanı (geliştirme: SQL Server LocalDB, prod: PostgreSQL). Tüm varlık verileri, denetim kayıtları ve iş akışı verileri burada saklanır.",   thresholdOk: 50,   thresholdWarn: 200,  sla: "99.95%", actions: [{ id: "ping-db",    label: "Bağlantı Testi" }] },
  "Redis":      { icon: Wifi,     description: "Dağıtık önbellek (Redis veya InMemory). Dashboard istatistikleri, ürün listeleri, lisans doğrulama sonuçları ve job çıktıları burada cache'lenir.",     thresholdOk: 10,   thresholdWarn: 50,   sla: "99.9%",  actions: [{ id: "ping-cache", label: "Önbellek Testi" }, { id: "flush-cache", label: "Test Anahtarını Temizle", variant: "danger" }] },
  "RabbitMQ":   { icon: Activity, description: "Mesaj kuyruğu (MassTransit + RabbitMQ veya InMemory). Sipariş oluşturma, ödeme onayı ve durum değişikliği eventleri asenkron olarak işlenir. Outbox pattern ile güvenli mesaj teslimatı sağlanır.",        thresholdOk: 20,   thresholdWarn: 100,  sla: "99.5%",  actions: [{ id: "ping-rabbitmq", label: "Bus Testi" }] },
  "E-posta":    { icon: Mail,     description: "SMTP e-posta servisi (MailKit). Sipariş onayı, kargo bildirimi, şifre sıfırlama, düşük stok uyarısı ve doğrulama e-postaları bu servis üzerinden gönderilir. Yapılandırılmamışsa geliştirme modunda log'a yazılır.", thresholdOk: 500, thresholdWarn: 2000, sla: "99.0%",  actions: [{ id: "ping-smtp", label: "SMTP TCP Testi" }, { id: "send-test-email", label: "Test E-postası Gönder", variant: "primary" }] },
};

// ── Yardımcı bileşenler ──────────────────────────────────────────────────────

function computeStats(hist: LatencyPoint[]): ServiceStats | null {
  const pts = hist.filter((p): p is number => p !== null);
  if (pts.length === 0) return null;
  const sorted = [...pts].sort((a, b) => a - b);
  return {
    min: sorted[0], max: sorted[sorted.length - 1],
    avg: Math.round(pts.reduce((a, b) => a + b, 0) / pts.length),
    p95: sorted[Math.min(Math.floor(sorted.length * 0.95), sorted.length - 1)],
    uptimePct: ((hist.filter(p => p !== null).length / hist.length) * 100).toFixed(1),
    checks: hist.length,
  };
}

function Sparkline({ points, color }: { points: LatencyPoint[]; color: string }) {
  const valid = points.filter((p): p is number => p !== null);
  if (valid.length < 2) return null;
  const max = Math.max(...valid, 1);
  const w = 80; const h = 24;
  const pts = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = p !== null ? h - (p / max) * h : h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="inline-block align-middle">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function LatencyBar({ ms, ok, warn }: { ms: number; ok: number; warn: number }) {
  const pct   = Math.min((ms / (warn * 2)) * 100, 100);
  const color = ms <= ok ? "bg-emerald-400" : ms <= warn ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function HealthRing({ score }: { score: number }) {
  const r = 30; const circ = 2 * Math.PI * r;
  const fill  = Math.max(0, Math.min(score / 100, 1)) * circ;
  const color = score >= 90 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={72} height={72} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={6} />
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.7s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold text-white leading-none">{score}</span>
        <span className="text-[9px] text-white/70 font-semibold uppercase tracking-wide">skor</span>
      </div>
    </div>
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

function StatCell({ label, value, unit = "ms", highlight }: { label: string; value: number; unit?: string; highlight?: "green" | "red" | "amber" }) {
  const colors = { green: "text-emerald-600", red: "text-red-500", amber: "text-amber-600" };
  return (
    <div className="text-center">
      <p className={`text-sm font-extrabold tabular-nums ${highlight ? colors[highlight] : "text-slate-700"}`}>
        {value}<span className="text-[10px] font-normal text-slate-400 ml-0.5">{unit}</span>
      </p>
      <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

// ── Ana bileşen ──────────────────────────────────────────────────────────────

export default function ServislerPage() {
  const { t } = useI18n();
  const [report, setReport]           = useState<HealthReport | null>(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [countdown, setCountdown]     = useState(REFRESH_INTERVAL);
  const [history, setHistory]         = useState<Record<string, LatencyPoint[]>>({});
  const [upSince, setUpSince]         = useState<Date | null>(null);
  const [flashMap, setFlashMap]       = useState<Record<string, string>>({});
  const [incidents, setIncidents]     = useState<IncidentEntry[]>([]);
  const [expandedSvc, setExpandedSvc] = useState<string | null>(null);

  // Manuel tetikleme
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionResult, setActionResult]   = useState<Record<string, { ok: boolean; message: string }>>({});

  const prevStatusRef  = useRef<Record<string, string>>({});
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else if (!report) setLoading(true);
    try {
      const data = await api.get<HealthReport>("/api/admin/health");
      const changed: Record<string, string> = {};
      data.services.forEach(svc => {
        const prev = prevStatusRef.current[svc.name];
        if (prev !== undefined && prev !== svc.status) changed[svc.name] = svc.status;
        prevStatusRef.current[svc.name] = svc.status;
      });
      if (Object.keys(changed).length > 0) {
        setIncidents(prev => [
          ...Object.entries(changed).map(([svc, to]) => ({
            ts: new Date(), service: svc, from: prevStatusRef.current[svc] ?? "unknown", to,
          })),
          ...prev,
        ].slice(0, 40));
        setFlashMap(changed);
        setTimeout(() => setFlashMap({}), 1000);
      }
      setReport(data);
      setLastRefresh(new Date());
      if (!upSince) setUpSince(new Date());
      setHistory(prev => {
        const next = { ...prev };
        data.services.forEach(svc => {
          const existing = next[svc.name] ?? [];
          next[svc.name] = [...existing, svc.responseMs ?? null].slice(-MAX_HISTORY);
        });
        return next;
      });
    } catch {
      if (!report) setReport(null);
    } finally {
      setLoading(false); setRefreshing(false); setCountdown(REFRESH_INTERVAL);
    }
  }, [report, upSince]); // eslint-disable-line react-hooks/exhaustive-deps

  function startAutoRefresh() {
    intervalRef.current  = setInterval(() => load(false), REFRESH_INTERVAL * 1000);
    countdownRef.current = setInterval(() => setCountdown(c => c <= 1 ? REFRESH_INTERVAL : c - 1), 1000);
  }
  function stopAutoRefresh() {
    if (intervalRef.current)  clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }

  useEffect(() => { load(); startAutoRefresh(); return stopAutoRefresh; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleManualRefresh() { stopAutoRefresh(); load(true).then(() => startAutoRefresh()); }

  async function runAction(actionId: string, svcName: string) {
    const key = `${svcName}:${actionId}`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    setActionResult(prev => { const n = { ...prev }; delete n[key]; return n; });
    try {
      const data = await api.post<{ message?: string; error?: string }>(
        `/api/admin/health/actions/${actionId}`
      );
      setActionResult(prev => ({ ...prev, [key]: { ok: true, message: data?.message ?? "Başarılı" } }));
      // E-posta gönderildiyse log'a da yazdır (opsiyonel refresh)
      if (actionId === "send-test-email") handleManualRefresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Hata oluştu";
      setActionResult(prev => ({ ...prev, [key]: { ok: false, message: msg } }));
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  }

  const overall       = report?.overallStatus ?? "unknown";
  const overallCfg    = STATUS_CONFIG[overall];
  const OverallIcon   = overallCfg.icon;
  const okCount       = report?.services.filter(s => s.status === "ok").length ?? 0;
  const warnCount     = report?.services.filter(s => s.status === "degraded").length ?? 0;
  const downCount     = report?.services.filter(s => s.status === "down").length ?? 0;

  const healthScore   = report ? Math.round(
    report.services.reduce((sum, svc) => sum + (svc.status === "ok" ? 100 : svc.status === "degraded" ? 45 : 0), 0)
    / report.services.length
  ) : 0;

  const uptimeStr = upSince ? (() => {
    const diff = Math.floor((Date.now() - upSince.getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}d ${diff % 60}s`;
    return `${Math.floor(diff / 3600)}sa ${Math.floor((diff % 3600) / 60)}d`;
  })() : null;

  return (
    <div className="space-y-6">

      {/* ── Başlık ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden shadow-sm"
        style={{ background: overall === "down"
          ? "linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)"
          : overall === "degraded"
          ? "linear-gradient(135deg, #b45309 0%, #d97706 100%)"
          : "linear-gradient(135deg, #0f766e 0%, #0891b2 100%)" }}>
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <HealthRing score={healthScore} />
            <div>
              <h1 className="text-xl font-extrabold text-white">{t("page./servisler", "Servis Durumu")}</h1>
              <p className="text-teal-100 text-xs mt-0.5">API, veritabanı ve bağlı servislerin gerçek zamanlı sağlık kontrolü</p>
              {report && (
                <div className="flex items-center gap-3 mt-1.5 text-xs">
                  <span className="text-emerald-200 font-semibold">{okCount} sağlıklı</span>
                  {warnCount > 0 && <span className="text-amber-200 font-semibold">{warnCount} yavaş</span>}
                  {downCount > 0 && <span className="text-red-200 font-semibold">{downCount} çevrimdışı</span>}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <PulseIndicator />
            {uptimeStr && (
              <div className="hidden md:flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1.5">
                <TrendingUp size={13} className="text-white/70" />
                <span className="text-white text-xs font-semibold">Uptime {uptimeStr}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-white/70 bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg">
              <Radio size={11} className="text-teal-300" />
              <span>{countdown}s</span>
            </div>
            <button onClick={handleManualRefresh} disabled={refreshing}
              className="flex items-center gap-2 bg-white text-teal-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-teal-50 transition shadow disabled:opacity-50">
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Yenile
            </button>
          </div>
        </div>
      </div>

      {/* ── Genel Durum Bandı ────────────────────────────────────────────── */}
      {report && (
        <div className={`flex items-center justify-between gap-3 p-4 rounded-2xl border ${overallCfg.bg} ${overallCfg.border}`}>
          <div className="flex items-center gap-3">
            <OverallIcon size={22} className={overallCfg.color} />
            <div>
              <p className={`text-sm font-bold ${overallCfg.color}`}>
                {overall === "ok"       ? "Tüm servisler normal çalışıyor" :
                 overall === "degraded" ? "Bazı servisler yavaş yanıt veriyor" :
                                          "Kritik servis sorunu tespit edildi"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <Clock size={11} /> Son kontrol: {new Date(report.checkedAt).toLocaleTimeString("tr-TR")}
                {lastRefresh && <> &bull; Güncellendi: {lastRefresh.toLocaleTimeString("tr-TR")}</>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className={`text-lg font-extrabold ${healthScore >= 90 ? "text-emerald-600" : healthScore >= 60 ? "text-amber-600" : "text-red-600"}`}>
                {healthScore}/100
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Sağlık Skoru</p>
            </div>
            <div className="text-xs text-slate-500">
              {okCount}/{report.services.length} sağlıklı
              {incidents.length > 0 && <p className="text-amber-600 font-semibold">{incidents.length} olay bu oturumda</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Servis Kartları ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-24 mb-3" />
              <div className="h-6 bg-slate-100 rounded w-16 mb-4" />
              <div className="h-3 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : report ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.services.map(svc => {
            const meta = SERVICE_META[svc.name] ?? {
              icon: Server, description: "", thresholdOk: 100, thresholdWarn: 300, sla: "—", actions: [],
            };
            const Icon       = meta.icon;
            const cfg        = STATUS_CONFIG[svc.status];
            const hist       = history[svc.name] ?? [];
            const stats      = computeStats(hist);
            const avgMs      = stats?.avg ?? 0;
            const sparkColor = svc.status === "ok" ? "#10b981" : svc.status === "degraded" ? "#f59e0b" : "#ef4444";
            const flashStatus = flashMap[svc.name];
            const flashRing  = flashStatus === "ok"       ? "ring-2 ring-emerald-400 ring-offset-1" :
                               flashStatus === "down"     ? "ring-2 ring-red-400 ring-offset-1"     :
                               flashStatus === "degraded" ? "ring-2 ring-amber-400 ring-offset-1"   : "";
            const isExpanded = expandedSvc === svc.name;

            return (
              <div key={svc.name}
                className={`bg-white rounded-2xl border shadow-sm transition-all duration-300 ${
                  svc.status === "down"     ? "border-red-200 ring-1 ring-red-100" :
                  svc.status === "degraded" ? "border-amber-200"                  : "border-slate-200"
                } ${flashRing}`}>

                {/* ── Kart başlığı ── */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
                        <Icon size={18} className={cfg.color} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{svc.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${cfg.dot} ${svc.status === "ok" ? "animate-pulse" : ""}`} />
                          <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                        </div>
                      </div>
                    </div>
                    {svc.responseMs !== undefined && (
                      <div className="text-right">
                        <p className={`text-base font-extrabold tabular-nums ${
                          svc.responseMs > meta.thresholdWarn ? "text-red-600" :
                          svc.responseMs > meta.thresholdOk   ? "text-amber-600" : "text-emerald-600"
                        }`}>{svc.responseMs}ms</p>
                        {avgMs > 0 && <p className="text-xs text-slate-400">ort. {avgMs}ms</p>}
                      </div>
                    )}
                  </div>

                  {svc.responseMs !== undefined && (
                    <LatencyBar ms={svc.responseMs} ok={meta.thresholdOk} warn={meta.thresholdWarn} />
                  )}

                  {/* ── Items listesi (her zaman görünür) ── */}
                  {svc.items && svc.items.length > 0 && (
                    <div className="mt-3 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                      <div className="divide-y divide-slate-100">
                        {svc.items.map((item, i) => {
                          const iCfg = ITEM_STATUS[item.status] ?? ITEM_STATUS.info;
                          return (
                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/70 transition-colors">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${iCfg.dot}`} />
                              <span className="text-xs text-slate-600 flex-1 min-w-0 truncate font-medium">{item.name}</span>
                              {item.value && (
                                <span className={`text-[11px] font-mono shrink-0 ${iCfg.label}`}>{item.value}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Detaylar toggle ── */}
                  <button
                    onClick={() => setExpandedSvc(prev => prev === svc.name ? null : svc.name)}
                    className="mt-3 w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-600 transition group">
                    <span className="font-medium group-hover:text-slate-600">Metrikler & İşlemler</span>
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>

                {/* ── Expanded panel ── */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 space-y-4">

                    {/* Açıklama */}
                    <div className="flex items-start gap-1.5">
                      <Info size={12} className="text-slate-300 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-500 leading-relaxed">{meta.description}</p>
                    </div>

                    {/* ── Bu Servisi Kullanan Ekranlar ── */}
                    {SERVICE_SCREENS[svc.name] && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Monitor size={11} /> Bu Servisi Kullanan Ekranlar
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {SERVICE_SCREENS[svc.name].map((screen, idx) => (
                            <Link key={idx} href={screen.href}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition group">
                              <ExternalLink size={9} />
                              <span>{screen.label}</span>
                              {screen.note && (
                                <span className="text-indigo-300 group-hover:text-indigo-400">· {screen.note}</span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── E-posta Şablonları ── */}
                    {svc.name === "E-posta" && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">E-posta Şablonları</p>
                        <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                          {Object.entries(EMAIL_TRIGGERS).map(([fn, trigger]) => (
                            <div key={fn} className="flex items-start gap-2 px-3 py-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-mono text-slate-600 truncate">{fn}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{trigger.action}</p>
                              </div>
                              <Link href={trigger.href}
                                className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-teal-50 text-teal-600 border border-teal-100 hover:bg-teal-100 transition">
                                <ExternalLink size={8} />{trigger.screen}
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── RabbitMQ Tüketiciler ── */}
                    {svc.name === "RabbitMQ" && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mesaj Tüketiciler</p>
                        <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                          {Object.entries(RABBITMQ_TRIGGERS).map(([consumer, trigger]) => (
                            <div key={consumer} className="flex items-start gap-2 px-3 py-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-mono text-slate-600 truncate">{consumer}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{trigger.action}</p>
                              </div>
                              <Link href={trigger.href}
                                className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition">
                                <ExternalLink size={8} />{trigger.screen}
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sparkline */}
                    {hist.length >= 3 && (
                      <div className="flex items-center gap-2">
                        <BarChart2 size={12} className="text-slate-300 shrink-0" />
                        <Sparkline points={hist} color={sparkColor} />
                        <span className="text-xs text-slate-400">son {hist.length} ölçüm</span>
                      </div>
                    )}

                    {/* Hız istatistikleri */}
                    {stats && (
                      <div className="grid grid-cols-4 gap-1 bg-white rounded-xl border border-slate-100 px-2 py-2">
                        <StatCell label="Min" value={stats.min} highlight="green" />
                        <StatCell label="Ort." value={stats.avg} />
                        <StatCell label="P95" value={stats.p95} highlight={stats.p95 > meta.thresholdWarn ? "red" : stats.p95 > meta.thresholdOk ? "amber" : undefined} />
                        <StatCell label="Max" value={stats.max} highlight={stats.max > meta.thresholdWarn ? "red" : undefined} />
                      </div>
                    )}

                    {/* Uptime / SLA */}
                    {stats && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-xl border border-slate-200 px-3 py-2.5">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Oturum Uptime</p>
                          <p className={`text-lg font-extrabold mt-0.5 ${parseFloat(stats.uptimePct) >= 99 ? "text-emerald-600" : parseFloat(stats.uptimePct) >= 90 ? "text-amber-600" : "text-red-600"}`}>
                            %{stats.uptimePct}
                          </p>
                          <p className="text-[10px] text-slate-400">{stats.checks} kontrol</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 px-3 py-2.5">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Hedef SLA</p>
                          <p className="text-lg font-extrabold text-slate-700 mt-0.5">{meta.sla}</p>
                          <p className="text-[10px] text-slate-400">eşik: &lt;{meta.thresholdWarn}ms</p>
                        </div>
                      </div>
                    )}

                    {/* Meta bilgisi */}
                    {svc.meta && (
                      <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-100">
                        {svc.meta.typeLabel && <MetaRow label="Tür"       value={svc.meta.typeLabel} />}
                        {svc.meta.provider  && <MetaRow label="Sağlayıcı" value={svc.meta.provider}  mono />}
                        {svc.meta.url       && <MetaRow label="URL"       value={svc.meta.url}        mono />}
                        {svc.meta.database  && <MetaRow label={svc.name === "E-posta" ? "Gönderici" : "Veritabanı"} value={svc.meta.database} mono />}
                        {svc.meta.port      && <MetaRow label="Port"      value={svc.meta.port}       mono />}
                        {svc.meta.extra     && <MetaRow label="Güvenlik"  value={svc.meta.extra}      mono />}
                      </div>
                    )}

                    {/* Hata detayı */}
                    {svc.detail && (
                      <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs ${
                        svc.status === "down"     ? "bg-red-50 border-red-200 text-red-700"       :
                        svc.status === "degraded" ? "bg-amber-50 border-amber-200 text-amber-700" :
                                                    "bg-slate-50 border-slate-200 text-slate-600"
                      }`}>
                        <Info size={12} className="shrink-0 mt-0.5" />
                        <span>{svc.detail}</span>
                      </div>
                    )}

                    {/* ── Manuel Tetikleme ── */}
                    {meta.actions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manuel İşlemler</p>
                        <div className="flex flex-wrap gap-2">
                          {meta.actions.map(action => {
                            const key     = `${svc.name}:${action.id}`;
                            const isLoading = actionLoading[key];
                            const result  = actionResult[key];
                            return (
                              <button key={action.id}
                                onClick={() => runAction(action.id, svc.name)}
                                disabled={isLoading}
                                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50 border ${
                                  action.variant === "primary"
                                    ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
                                    : action.variant === "danger"
                                    ? "bg-white text-red-600 border-red-200 hover:bg-red-50"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}>
                                {isLoading
                                  ? <Loader2 size={12} className="animate-spin" />
                                  : <Play size={11} />}
                                {action.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Aksiyon sonuçları */}
                        {meta.actions.map(action => {
                          const key    = `${svc.name}:${action.id}`;
                          const result = actionResult[key];
                          if (!result) return null;
                          return (
                            <div key={action.id}
                              className={`text-xs px-3 py-2 rounded-lg border ${result.ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                              <span className="font-semibold">{action.label}:</span> {result.message}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Eşik açıklaması */}
                    <div className="flex gap-4 text-xs text-slate-400 pt-1 border-t border-slate-100">
                      <span className="text-emerald-600">✓ Hızlı: &lt;{meta.thresholdOk}ms</span>
                      <span className="text-amber-600">⚠ Yavaş: &lt;{meta.thresholdWarn}ms</span>
                      <span className="text-red-500">✗ Kritik: &gt;{meta.thresholdWarn}ms</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <XCircle size={32} className="text-red-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Sağlık kontrolü başarısız</p>
          <p className="text-xs text-slate-400 mt-1">API sunucusuna ulaşılamıyor.</p>
          <button onClick={handleManualRefresh}
            className="mt-4 px-4 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition">
            Tekrar Dene
          </button>
        </div>
      )}

      {/* ── Servis Karşılaştırma Tablosu ────────────────────────────────── */}
      {report && report.services.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Shield size={16} className="text-teal-600" />
            <h2 className="text-sm font-semibold text-slate-700">Servis Karşılaştırması</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Servis</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">Durum</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Yanıt</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Min</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Ort.</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">P95</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Uptime</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">SLA Hedefi</th>
                </tr>
              </thead>
              <tbody>
                {report.services.map(svc => {
                  const m    = SERVICE_META[svc.name] ?? { sla: "—", thresholdOk: 100, thresholdWarn: 300, actions: [] };
                  const cfg  = STATUS_CONFIG[svc.status];
                  const st   = computeStats(history[svc.name] ?? []);
                  return (
                    <tr key={svc.name} className="border-t border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-5 py-3 font-medium text-slate-800">{svc.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className={`font-bold ${svc.responseMs !== undefined && svc.responseMs > m.thresholdWarn ? "text-red-600" : svc.responseMs !== undefined && svc.responseMs > m.thresholdOk ? "text-amber-600" : "text-emerald-600"}`}>
                          {svc.responseMs !== undefined ? `${svc.responseMs}ms` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-emerald-600 font-semibold">{st ? `${st.min}ms` : "—"}</td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-slate-600 font-semibold">{st ? `${st.avg}ms` : "—"}</td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums">
                        <span className={st && st.p95 > m.thresholdWarn ? "text-red-600 font-bold" : "text-slate-600 font-semibold"}>{st ? `${st.p95}ms` : "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums">
                        <span className={st ? (parseFloat(st.uptimePct) >= 99 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold") : "text-slate-400"}>
                          {st ? `%${st.uptimePct}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-500 font-semibold">{m.sla}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Olay Günlüğü ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon size={16} className={incidents.length > 0 ? "text-amber-500" : "text-slate-300"} />
            <h2 className="text-sm font-semibold text-slate-700">Olay Günlüğü (Bu Oturum)</h2>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${incidents.length > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"}`}>
            {incidents.length} olay
          </span>
        </div>
        {incidents.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 size={28} className="text-emerald-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Bu oturumda durum değişikliği yok</p>
            <p className="text-xs text-slate-300 mt-0.5">Servis durumları değiştiğinde burada görünür</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {incidents.map((inc, i) => {
              const fromCfg = STATUS_CONFIG[inc.from as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.unknown;
              const toCfg   = STATUS_CONFIG[inc.to   as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.unknown;
              return (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center border text-xs shrink-0 ${INCIDENT_COLORS[inc.to] ?? "bg-slate-50 border-slate-200 text-slate-400"}`}>
                    <Zap size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{inc.service}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${fromCfg.bg} ${fromCfg.color} ${fromCfg.border}`}>{fromCfg.label}</span>
                      <span className="text-slate-300">→</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${toCfg.bg} ${toCfg.color} ${toCfg.border}`}>{toCfg.label}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">{inc.ts.toLocaleTimeString("tr-TR")}</p>
                    <p className="text-[10px] text-slate-300">{inc.ts.toLocaleDateString("tr-TR")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1.5">
        <Radio size={11} className="text-teal-400" />
        Her {REFRESH_INTERVAL} saniyede bir otomatik güncelleme · Son {MAX_HISTORY} ölçüm saklanır
      </p>
    </div>
  );
}

// ── Küçük yardımcı bileşen ────────────────────────────────────────────────────

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2 px-3 py-1.5">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">{label}</span>
      <span className={`text-xs text-right break-all leading-relaxed ${mono ? "font-mono text-slate-600" : "text-slate-700 font-medium"}`}>{value}</span>
    </div>
  );
}
