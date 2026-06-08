"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import type { PaginatedList } from "@/types";
import {
  AlertTriangle, Info, AlertCircle, Search, Filter,
  Server, Monitor, Clock, ChevronDown, ChevronUp, X, Link2,
  ExternalLink, Copy, Check, Activity, MapPin, Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} from "recharts";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtLevel = (v: any, n: any) => [v, n === "error" ? "Hata" : n === "warning" ? "Uyarı" : "Bilgi"] as [any, any];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtCount = (v: any) => [v, "Adet"] as [any, any];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtPair = (v: any, n: any) => [v, n] as [any, any];

interface ErrorLog {
  id: string;
  source: string;
  level: string;
  message: string;
  stackTrace?: string;
  path?: string;
  url?: string;
  exceptionType?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  statusCode?: number;
  createdDate: string;
  requestPayload?: string;
  responsePayload?: string;
}

interface DayStat { date: string; error: number; warning: number; info: number; }
interface TypeStat { exceptionType: string; count: number; }
interface SourceStat { source: string; error: number; warning: number; info: number; }
interface CategoryStat { category: string; count: number; }
interface Stats {
  totalError: number;
  totalWarning: number;
  totalInfo: number;
  byDay: DayStat[];
  byExceptionType: TypeStat[];
  bySource: SourceStat[];
  byCategory: CategoryStat[];
}

const PAGE_SIZES = [20, 30, 50, 100];
const SOURCE_COLORS: Record<string, string[]> = {
  Backend: ["#6d28d9", "#c4b5fd"],
  Frontend: ["#0d9488", "#99f6e4"],
};
const CATEGORY_COLORS: Record<string, string> = {
  "Veritabanı": "#ef4444",
  "HTTP / Ağ": "#f59e0b",
  "Zaman Aşımı": "#f97316",
  "Yetki": "#8b5cf6",
  "Dosya": "#06b6d4",
  "Uygulama": "#ec4899",
  "Doğrulama": "#84cc16",
  "Diğer": "#94a3b8",
};

function levelIcon(level: string) {
  if (level === "Error") return <AlertCircle size={14} className="text-red-500 shrink-0" />;
  if (level === "Warning") return <AlertTriangle size={14} className="text-amber-500 shrink-0" />;
  return <Info size={14} className="text-sky-500 shrink-0" />;
}

function levelBadge(level: string) {
  if (level === "Error") return "bg-red-100 text-red-700 border border-red-200";
  if (level === "Warning") return "bg-amber-100 text-amber-700 border border-amber-200";
  return "bg-sky-100 text-sky-700 border border-sky-200";
}

function levelLabel(level: string) {
  if (level === "Error") return "Hata";
  if (level === "Warning") return "Uyarı";
  return "Bilgi";
}

function sourceBadge(source: string) {
  if (source === "Backend") return "bg-violet-100 text-violet-700 border border-violet-200";
  return "bg-teal-100 text-teal-700 border border-teal-200";
}

function sourceIcon(source: string) {
  if (source === "Backend") return <Server size={11} className="text-violet-500" />;
  return <Monitor size={11} className="text-teal-500" />;
}

function exceptionCategory(exType?: string): string {
  if (!exType) return "";
  const t = exType.toLowerCase();
  if (t.includes("dbupdateexception") || t.includes("sqlexception") || t.includes("dbexception") || t.includes("entityexception")) return "Veritabanı";
  if (t.includes("httprequestexception") || t.includes("socketexception") || t.includes("webexception")) return "HTTP / Ağ";
  if (t.includes("timeoutexception")) return "Zaman Aşımı";
  if (t.includes("unauthorizedaccessexception")) return "Yetki";
  if (t.includes("filenotfoundexception") || t.includes("directorynotfound") || t.includes("ioexception")) return "Dosya";
  if (t.includes("argumentexception") || t.includes("invalidoperationexception") || t.includes("nullreferenceexception")) return "Uygulama";
  if (t.includes("validationexception")) return "Doğrulama";
  return "Diğer";
}

function buildTitle(log: ErrorLog): string {
  const parts: string[] = [levelLabel(log.level), log.source];
  const cat = exceptionCategory(log.exceptionType);
  if (cat) parts.push(cat);
  if (log.exceptionType) parts.push(log.exceptionType);
  return parts.join(" › ");
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function statusCodeColor(code?: number) {
  if (!code) return "text-slate-400";
  if (code >= 500) return "text-red-600 font-bold";
  if (code >= 400) return "text-amber-600 font-semibold";
  return "text-slate-500";
}

export default function TakipPage() {
  const { t } = useI18n();
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sourceFilter, setSourceFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statDays, setStatDays] = useState(7);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const copyToClipboard = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  }, []);

  const fetchStats = useCallback(async (days: number) => {
    try {
      const data = await api.get<Stats>(`/api/admin/error-logs/stats?days=${days}`);
      setStats(data);
    } catch { }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (sourceFilter) qs.set("source", sourceFilter);
      if (levelFilter) qs.set("level", levelFilter);
      if (search) qs.set("search", search);
      if (startDate) qs.set("startDate", new Date(startDate).toISOString());
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        qs.set("endDate", end.toISOString());
      }
      const data = await api.get<PaginatedList<ErrorLog>>(`/api/admin/error-logs?${qs}`);
      setLogs(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (e) {
      setLogs([]);
      setListError(e instanceof Error ? e.message : "Bilinmeyen hata");
    }
    finally { setLoading(false); }
  }, [page, pageSize, sourceFilter, levelFilter, search, startDate, endDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchStats(statDays); }, [fetchStats, statDays]);

  const hasFilter = !!(sourceFilter || levelFilter || search || startDate || endDate);

  const pieData = stats ? [
    { name: "Hata", value: stats.totalError },
    { name: "Uyarı", value: stats.totalWarning },
    { name: "Bilgi", value: stats.totalInfo },
  ].filter(d => d.value > 0) : [];

  const PIE_COLORS = ["#ef4444", "#f59e0b", "#38bdf8"];

  const errorCount = stats?.totalError ?? logs.filter(l => l.level === "Error").length;

  return (
    <div className="space-y-5">
      {/* Distinctive header — red/system-monitoring theme */}
      <div className="rounded-2xl overflow-hidden shadow-sm"
        style={{ background: errorCount > 0
          ? "linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #f97316 100%)"
          : "linear-gradient(135deg, #0f766e 0%, #0d9488 60%, #14b8a6 100%)" }}>
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 shadow">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">{t("page./takip", "Sistem Takibi")}</h1>
              <p className="text-red-100 text-xs mt-0.5">
                Backend &amp; frontend hataları, uyarılar ve bilgi mesajları — gerçek zamanlı izleme
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
            {stats && (
              <>
                {stats.totalError > 0 && (
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1.5">
                    <AlertCircle size={13} className="text-red-200" />
                    <span className="text-white text-xs font-bold">{stats.totalError} hata</span>
                  </div>
                )}
                {stats.totalWarning > 0 && (
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1.5">
                    <AlertTriangle size={13} className="text-amber-200" />
                    <span className="text-white text-xs font-semibold">{stats.totalWarning} uyarı</span>
                  </div>
                )}
              </>
            )}
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5">
              <span className="text-white/70 text-xs">{totalCount} kayıt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ekran karşılaştırma */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800 flex items-center gap-1.5">
              Takip
              <span className="text-[10px] bg-red-200 text-red-700 px-1.5 py-0.5 rounded-full font-bold">Bu ekran</span>
            </p>
            <p className="text-xs text-red-600 mt-1 leading-relaxed">
              Backend ve frontend hataları: exception logları, HTTP 5xx, uyarı mesajları. <strong>Sistem ne zaman, nerede hata verdi?</strong>
            </p>
            <p className="text-[10px] text-red-400 mt-1.5 font-medium">Kaynak: ErrorLog tablosu · Backend + Frontend kaynaklı</p>
          </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
          <Activity size={18} className="text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-indigo-800 flex items-center gap-1.5">
              Hareketler
              <Link href="/hareketler" className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold hover:bg-indigo-200 transition inline-flex items-center gap-0.5">
                <LinkIcon size={8} /> Git
              </Link>
            </p>
            <p className="text-xs text-indigo-600 mt-1 leading-relaxed">
              Kimliği doğrulanmış kullanıcıların işlem geçmişi: giriş/çıkış, kayıt oluşturma/güncelleme/silme, admin eylemleri. <strong>Kim ne yaptı?</strong>
            </p>
            <p className="text-[10px] text-indigo-400 mt-1.5 font-medium">Kaynak: AuditLog tablosu · Yalnızca auth kullanıcılar</p>
          </div>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-start gap-3">
          <MapPin size={18} className="text-teal-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-teal-800 flex items-center gap-1.5">
              Ziyaretçiler
              <Link href="/ziyaretciler" className="text-[10px] bg-teal-100 text-teal-600 px-1.5 py-0.5 rounded-full font-bold hover:bg-teal-200 transition inline-flex items-center gap-0.5">
                <LinkIcon size={8} /> Git
              </Link>
            </p>
            <p className="text-xs text-teal-600 mt-1 leading-relaxed">
              Müşteri sitesine gelen tüm trafik: anonim ziyaretçiler dahil, coğrafi konum, tarayıcı, sayfa. <strong>Kim nereden geldi?</strong>
            </p>
            <p className="text-[10px] text-teal-400 mt-1.5 font-medium">Kaynak: VisitorLog tablosu · Anonim + auth kullanıcılar</p>
          </div>
        </div>
      </div>

      {/* Stat cards row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs text-slate-500">Hata</span>
          <span className="text-base font-bold text-red-600">{stats?.totalError ?? "—"}</span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-xs text-slate-500">Uyarı</span>
          <span className="text-base font-bold text-amber-600">{stats?.totalWarning ?? "—"}</span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-sky-400" />
          <span className="text-xs text-slate-500">Bilgi</span>
          <span className="text-base font-bold text-sky-600">{stats?.totalInfo ?? "—"}</span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
          <Server size={12} className="text-violet-500" />
          <span className="text-xs text-slate-500">Backend</span>
          <span className="text-base font-bold text-violet-700">
            {stats ? (stats.bySource.find(s => s.source === "Backend")?.error ?? 0) + (stats.bySource.find(s => s.source === "Backend")?.warning ?? 0) : "—"}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
          <Monitor size={12} className="text-teal-500" />
          <span className="text-xs text-slate-500">Frontend</span>
          <span className="text-base font-bold text-teal-700">
            {stats ? (stats.bySource.find(s => s.source === "Frontend")?.error ?? 0) + (stats.bySource.find(s => s.source === "Frontend")?.warning ?? 0) : "—"}
          </span>
        </div>
        <select value={statDays} onChange={e => setStatDays(Number(e.target.value))}
          className="text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-600 bg-white focus:outline-none shadow-sm ml-auto">
          <option value={7}>Son 7 gün</option>
          <option value={14}>Son 14 gün</option>
          <option value={30}>Son 30 gün</option>
        </select>
      </div>

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Kaynak dağılımı — Backend / Frontend */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm font-semibold text-slate-700 mb-4">Kaynak Dağılımı</p>
            {stats.bySource.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-slate-300 text-sm">Veri yok</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={stats.bySource} barSize={28} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="source" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                      formatter={fmtLevel} />
                    <Bar dataKey="error" name="Hata" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="warning" name="Uyarı" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="info" name="Bilgi" stackId="a" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  {stats.bySource.map(s => (
                    <div key={s.source} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        {s.source === "Backend" ? <Server size={11} className="text-violet-500" /> : <Monitor size={11} className="text-teal-500" />}
                        <span className="text-slate-600 font-medium">{s.source}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {s.error > 0 && <span className="text-red-600 font-semibold">{s.error} hata</span>}
                        {s.warning > 0 && <span className="text-amber-600">{s.warning} uyarı</span>}
                        {s.info > 0 && <span className="text-sky-500">{s.info} bilgi</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Günlük trend */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:col-span-2">
            <p className="text-sm font-semibold text-slate-700 mb-4">Günlük Dağılım</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.byDay} barSize={8} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                  formatter={fmtLevel} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }}
                  formatter={(v: string) => v === "error" ? "Hata" : v === "warning" ? "Uyarı" : "Bilgi"} />
                <Bar dataKey="error" name="error" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="warning" name="warning" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="info" name="info" fill="#38bdf8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Hata kategorileri + Exception türleri */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:col-span-2">
            <p className="text-sm font-semibold text-slate-700 mb-4">Hata Kategorileri</p>
            {stats.byCategory.length === 0 ? (
              <div className="h-20 flex items-center justify-center text-slate-300 text-sm">Veri yok</div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(120, stats.byCategory.length * 32)}>
                <BarChart data={stats.byCategory} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    formatter={fmtCount} />
                  <Bar dataKey="count" name="count" radius={[0, 4, 4, 0]}>
                    {stats.byCategory.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[entry.category] ?? "#94a3b8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Hata/Uyarı/Bilgi pasta grafiği */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm font-semibold text-slate-700 mb-4">Seviye Dağılımı</p>
            {pieData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-slate-300 text-sm">Veri yok</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={fmtPair} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Exception türleri */}
            {stats.byExceptionType.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {stats.byExceptionType.map(t => (
                  <div key={t.exceptionType} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                    <span className="text-xs text-slate-500 font-mono">{t.exceptionType}</span>
                    <span className="text-xs font-bold text-red-600">{t.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
        <Filter size={14} className="text-slate-400" />
        <form onSubmit={e => { e.preventDefault(); setPage(1); setSearch(searchInput); }} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Mesaj veya path ara..."
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-52 text-slate-900 bg-white" />
          </div>
          <button type="submit" className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition">Ara</button>
        </form>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Kaynak:</label>
          <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-xl px-2 py-1.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="">Tümü</option>
            <option value="Backend">Backend</option>
            <option value="Frontend">Frontend</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Seviye:</label>
          <select value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-xl px-2 py-1.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="">Tümü</option>
            <option value="Error">Hata</option>
            <option value="Warning">Uyarı</option>
            <option value="Info">Bilgi</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Başlangıç:</label>
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-xl px-2 py-1.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Bitiş:</label>
          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-xl px-2 py-1.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
        <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
          className="border border-slate-300 rounded-xl px-2 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s} kayıt</option>)}
        </select>
        {hasFilter && (
          <button onClick={() => {
            setSourceFilter(""); setLevelFilter(""); setSearch(""); setSearchInput("");
            setStartDate(""); setEndDate(""); setPage(1);
          }} className="text-xs text-slate-500 hover:text-slate-700 underline flex items-center gap-1">
            <X size={12} /> Temizle
          </button>
        )}
      </div>

      {/* Log list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Yükleniyor...</div>
        ) : listError ? (
          <div className="py-16 text-center">
            <AlertCircle size={32} className="text-red-300 mx-auto mb-3" />
            <p className="text-red-500 text-sm font-semibold">Kayıtlar yüklenirken hata oluştu</p>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">{listError}</p>
            <button onClick={fetchLogs} className="mt-4 text-xs text-teal-600 hover:underline">Tekrar dene</button>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Kayıt bulunamadı</p>
            {(sourceFilter || levelFilter || search || startDate || endDate) && (
              <p className="text-slate-300 text-xs mt-1">Filtreleri temizleyerek tüm kayıtları görüntüleyebilirsiniz</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map(log => {
              const isExpanded = expanded === log.id;
              const title = buildTitle(log);
              const displayUrl = log.url || null;
              return (
                <div key={log.id} className="hover:bg-slate-50/70 transition">
                  <button onClick={() => setExpanded(isExpanded ? null : log.id)}
                    className="w-full text-left px-5 py-3.5 flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{levelIcon(log.level)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5 mb-1">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${levelBadge(log.level)}`}>
                          {levelLabel(log.level)}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${sourceBadge(log.source)}`}>
                          {sourceIcon(log.source)} {log.source}
                        </span>
                        {exceptionCategory(log.exceptionType) && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            {exceptionCategory(log.exceptionType)}
                          </span>
                        )}
                        {log.exceptionType && (
                          <span className="text-xs text-slate-400 font-mono">{log.exceptionType}</span>
                        )}
                        {log.statusCode && (
                          <span className={`text-xs font-mono ${statusCodeColor(log.statusCode)}`}>HTTP {log.statusCode}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono mb-0.5 truncate" title={title}>{title}</p>
                      <p className="text-sm text-slate-800 font-medium truncate">{log.message}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Clock size={10} />{formatDate(log.createdDate)}</span>
                        {displayUrl ? (
                          <span className="flex items-center gap-1 font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5 max-w-[360px] truncate" title={displayUrl}>
                            <Link2 size={10} className="shrink-0 text-slate-400" />
                            <span className="truncate">{displayUrl}</span>
                          </span>
                        ) : log.path && (
                          <span className="flex items-center gap-1 font-mono text-slate-400">
                            <Link2 size={10} />{log.path}
                          </span>
                        )}
                        {log.userEmail && <span>{log.userEmail}</span>}
                        {log.ipAddress && <span>{log.ipAddress}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 text-slate-300 mt-1">
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4 ml-7 space-y-3">
                      <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                        <p className="text-sm text-slate-800 font-medium flex-1">{log.message}</p>
                        <button onClick={() => copyToClipboard(log.message, `${log.id}-msg`)}
                          title="Kopyala" className="shrink-0 text-slate-400 hover:text-teal-600 transition p-0.5 rounded mt-0.5">
                          {copiedKey === `${log.id}-msg` ? <Check size={13} className="text-teal-500" /> : <Copy size={13} />}
                        </button>
                      </div>
                      {displayUrl && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Tam URL</p>
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                            <p className="text-xs text-slate-700 font-mono break-all flex-1">{displayUrl}</p>
                            <button onClick={() => copyToClipboard(displayUrl, `${log.id}-url`)}
                              title="Kopyala" className="shrink-0 text-slate-400 hover:text-teal-600 transition p-0.5 rounded">
                              {copiedKey === `${log.id}-url` ? <Check size={13} className="text-teal-500" /> : <Copy size={13} />}
                            </button>
                            <a href={displayUrl} target="_blank" rel="noopener noreferrer"
                              className="shrink-0 text-slate-400 hover:text-teal-600 transition" title="Aç">
                              <ExternalLink size={13} />
                            </a>
                          </div>
                        </div>
                      )}
                      {log.stackTrace && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs font-semibold text-slate-500">Stack Trace</p>
                            <button onClick={() => copyToClipboard(log.stackTrace!, `${log.id}-stack`)}
                              title="Kopyala" className="text-slate-400 hover:text-teal-600 transition p-0.5 rounded flex items-center gap-1">
                              {copiedKey === `${log.id}-stack` ? <Check size={13} className="text-teal-500" /> : <Copy size={13} />}
                              <span className="text-xs">{copiedKey === `${log.id}-stack` ? "Kopyalandı" : "Kopyala"}</span>
                            </button>
                          </div>
                          <pre className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
                            {log.stackTrace}
                          </pre>
                        </div>
                      )}
                      {(log.requestPayload || log.responsePayload) && (
                        <div className="space-y-2">
                          {log.requestPayload && (
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-xs font-semibold text-slate-500">İstek (Request) Payload</p>
                                <button onClick={() => copyToClipboard(log.requestPayload!, `${log.id}-req`)}
                                  title="Kopyala" className="text-slate-400 hover:text-teal-600 transition p-0.5 rounded flex items-center gap-1">
                                  {copiedKey === `${log.id}-req` ? <Check size={13} className="text-teal-500" /> : <Copy size={13} />}
                                  <span className="text-xs">{copiedKey === `${log.id}-req` ? "Kopyalandı" : "Kopyala"}</span>
                                </button>
                              </div>
                              <pre className="text-xs text-slate-600 bg-blue-50 border border-blue-200 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                                {log.requestPayload}
                              </pre>
                            </div>
                          )}
                          {log.responsePayload && (
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-xs font-semibold text-slate-500">Yanıt (Response) Payload</p>
                                <button onClick={() => copyToClipboard(log.responsePayload!, `${log.id}-resp`)}
                                  title="Kopyala" className="text-slate-400 hover:text-teal-600 transition p-0.5 rounded flex items-center gap-1">
                                  {copiedKey === `${log.id}-resp` ? <Check size={13} className="text-teal-500" /> : <Copy size={13} />}
                                  <span className="text-xs">{copiedKey === `${log.id}-resp` ? "Kopyalandı" : "Kopyala"}</span>
                                </button>
                              </div>
                              <pre className="text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                                {log.responsePayload}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {log.userAgent && (
                          <div className="col-span-2 md:col-span-4">
                            <p className="text-xs text-slate-400 mb-0.5">User Agent</p>
                            <p className="text-xs text-slate-600 font-mono break-all">{log.userAgent}</p>
                          </div>
                        )}
                        {log.ipAddress && (
                          <div>
                            <p className="text-xs text-slate-400 mb-0.5">IP Adresi</p>
                            <p className="text-xs text-slate-700 font-mono">{log.ipAddress}</p>
                          </div>
                        )}
                        {log.userEmail && (
                          <div>
                            <p className="text-xs text-slate-400 mb-0.5">Kullanıcı</p>
                            <p className="text-xs text-slate-700">{log.userEmail}</p>
                          </div>
                        )}
                        {log.path && (
                          <div>
                            <p className="text-xs text-slate-400 mb-0.5">Path</p>
                            <p className="text-xs text-slate-700 font-mono">{log.path}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-slate-400 mb-0.5">ID</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs text-slate-400 font-mono">{log.id}</p>
                            <button onClick={() => copyToClipboard(log.id, `${log.id}-id`)}
                              title="Kopyala" className="text-slate-300 hover:text-teal-600 transition p-0.5 rounded">
                              {copiedKey === `${log.id}-id` ? <Check size={11} className="text-teal-500" /> : <Copy size={11} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <button onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">← Önceki</button>
          )}
          <span className="px-4 py-2 text-sm text-slate-500">{page} / {totalPages}</span>
          {page < totalPages && (
            <button onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">Sonraki →</button>
          )}
        </div>
      )}
    </div>
  );
}
