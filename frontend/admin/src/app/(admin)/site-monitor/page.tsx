"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Activity, Wifi, WifiOff, Clock, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Loader2, Zap, Globe, ChevronUp, ChevronDown,
  Filter, Shield, Server, Search, X,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5124";

interface MonitorEvent {
  isUp: boolean;
  httpStatusCode: number | null;
  responseTimeMs: number;
  errorMessage: string | null;
  checkedAt: string;
}

interface UptimeLog {
  id: string;
  isUp: boolean;
  httpStatusCode: number | null;
  responseTimeMs: number;
  errorMessage: string | null;
  checkedAt: string;
}

interface LogsResponse {
  total: number;
  page: number;
  pageSize: number;
  logs: UptimeLog[];
  upCount: number;
  totalCount: number;
}

interface NginxEntry {
  remoteAddr: string;
  timeLocal: string;
  method: string;
  path: string;
  statusCode: number;
  bodyBytesSent: number;
  userAgent: string;
  host: string;
  cfIp: string;
}

interface NginxResponse {
  available: boolean;
  error?: string;
  total: number;
  page: number;
  limit: number;
  entries: NginxEntry[];
}

type SortDir = "asc" | "desc";
type UptimeFilter = "all" | "up" | "down";
type ActiveTab = "uptime" | "nginx";

function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function fmtDateTime(dt: string) {
  return new Date(dt).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}
function fmtNginxTime(s: string) {
  try {
    const months: Record<string, string> = { Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12" };
    const [datePart, ...timeParts] = s.split(":");
    const [day, mon, year] = datePart.split("/");
    return `${day}.${months[mon]??mon}.${year} ${timeParts.join(":")}`;
  } catch { return s; }
}
function latencyColor(ms: number) { return ms < 500 ? "text-emerald-600" : ms < 1500 ? "text-amber-600" : "text-red-600"; }
function latencyBg(ms: number) { return ms < 500 ? "bg-emerald-500" : ms < 1500 ? "bg-amber-500" : "bg-red-500"; }
function statusColor(c: number) { return c < 300 ? "text-emerald-600" : c < 400 ? "text-blue-600" : c < 500 ? "text-amber-600" : "text-red-600"; }
function statusBadge(c: number) { return c < 300 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : c < 400 ? "bg-blue-50 text-blue-700 border-blue-200" : c < 500 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"; }
function formatBytes(b: number) { return b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(1)}KB` : `${(b/1048576).toFixed(2)}MB`; }
function getToken() { return typeof window !== "undefined" ? (localStorage.getItem("admin_token") ?? "") : ""; }

function Sparkline({ events }: { events: MonitorEvent[] }) {
  const last = events.slice(-24);
  if (!last.length) return null;
  const max = Math.max(...last.map(e => e.responseTimeMs), 1);
  return (
    <div className="flex items-end gap-0.5 h-10">
      {last.map((e, i) => (
        <div key={i} title={`${e.responseTimeMs}ms`}
          className={`w-2 rounded-sm ${e.isUp ? latencyBg(e.responseTimeMs) : "bg-red-500"}`}
          style={{ height: Math.max(4, Math.round((e.responseTimeMs / max) * 40)) }} />
      ))}
    </div>
  );
}

function SortTh({ label, field, currentSort, currentDir, onSort }: {
  label: string; field: string; currentSort: string; currentDir: SortDir;
  onSort: (f: string, d: SortDir) => void;
}) {
  const active = currentSort === field;
  return (
    <th className="px-4 py-3 text-left cursor-pointer select-none group"
      onClick={() => onSort(field, active && currentDir === "desc" ? "asc" : "desc")}>
      <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 group-hover:text-slate-700 transition">
        {label}
        <span className="flex flex-col ml-0.5">
          <ChevronUp size={10} className={active && currentDir === "asc" ? "text-blue-500" : "text-slate-300"} />
          <ChevronDown size={10} className={active && currentDir === "desc" ? "text-blue-500" : "text-slate-300"} style={{ marginTop: -2 }} />
        </span>
      </div>
    </th>
  );
}

export default function SiteMonitorPage() {
  const [status, setStatus] = useState<MonitorEvent | null>(null);
  const [liveEvents, setLiveEvents] = useState<MonitorEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const lastCheckedAtRef = useRef<string | null>(null);

  const [logs, setLogs] = useState<UptimeLog[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [upCount, setUpCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);
  const [uptimeFilter, setUptimeFilter] = useState<UptimeFilter>("all");
  const [sortBy, setSortBy] = useState("checkedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [nginxLogs, setNginxLogs] = useState<NginxEntry[]>([]);
  const [nginxTotal, setNginxTotal] = useState(0);
  const [nginxPage, setNginxPage] = useState(1);
  const [nginxLimit, setNginxLimit] = useState(100);
  const [nginxLoading, setNginxLoading] = useState(false);
  const [nginxAvailable, setNginxAvailable] = useState<boolean | null>(null);
  const [nginxError, setNginxError] = useState<string | null>(null);
  const [nginxIp, setNginxIp] = useState("");
  const [nginxStatus, setNginxStatus] = useState("");
  const [nginxPath, setNginxPath] = useState("");
  const [nginxIpInput, setNginxIpInput] = useState("");
  const [nginxStatusInput, setNginxStatusInput] = useState("");
  const [nginxPathInput, setNginxPathInput] = useState("");

  const [activeTab, setActiveTab] = useState<ActiveTab>("uptime");
  const sseActiveRef = useRef(false);
  const [countdown, setCountdown] = useState(25);
  const countdownRef = useRef(25);
  const resetCountdown = useCallback(() => {
    countdownRef.current = 25;
    setCountdown(25);
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/site-monitor/status`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const data = await res.json() as { available: boolean } & MonitorEvent;
      if (!data.available) return;
      if (data.checkedAt === lastCheckedAtRef.current) return;
      lastCheckedAtRef.current = data.checkedAt;
      setStatus(data);
      resetCountdown();
      if (!sseActiveRef.current) {
        setLiveEvents(prev => prev.some(e => e.checkedAt === data.checkedAt) ? prev : [data, ...prev].slice(0, 50));
      }
    } catch { /**/ }
  }, [resetCountdown]);

  const fetchLogs = useCallback(async (p: number, ps: number, f: UptimeFilter, sb: string, sd: SortDir) => {
    setLogsLoading(true);
    try {
      const res = await fetch(
        `${API}/api/admin/site-monitor/logs?page=${p}&pageSize=${ps}&filter=${f}&sortBy=${sb}&sortDir=${sd}`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      if (!res.ok) return;
      const data: LogsResponse = await res.json();
      setLogs(data.logs); setTotal(data.total); setUpCount(data.upCount ?? 0); setTotalCount(data.totalCount ?? 0);
    } catch { /**/ } finally { setLogsLoading(false); }
  }, []);

  const fetchNginxLogs = useCallback(async (p: number, lim: number, ip: string, st: string, pt: string) => {
    setNginxLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(lim) });
      if (ip) params.set("ip", ip);
      if (st) params.set("status", st);
      if (pt) params.set("path", pt);
      const res = await fetch(`${API}/api/admin/site-monitor/nginx-logs?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const data: NginxResponse = await res.json();
      setNginxAvailable(data.available ?? true);
      setNginxError(data.error ?? null);
      setNginxLogs(data.entries ?? []);
      setNginxTotal(data.total ?? 0);
    } catch { /**/ } finally { setNginxLoading(false); }
  }, []);

  const handleSort = useCallback((field: string, dir: SortDir) => {
    setSortBy(field); setSortDir(dir); setPage(1);
    fetchLogs(1, pageSize, uptimeFilter, field, dir);
  }, [pageSize, uptimeFilter, fetchLogs]);

  const handleFilterChange = useCallback((f: UptimeFilter) => {
    setUptimeFilter(f); setPage(1);
    fetchLogs(1, pageSize, f, sortBy, sortDir);
  }, [pageSize, sortBy, sortDir, fetchLogs]);

  const handlePageSizeChange = useCallback((ps: number) => {
    setPageSize(ps); setPage(1);
    fetchLogs(1, ps, uptimeFilter, sortBy, sortDir);
  }, [uptimeFilter, sortBy, sortDir, fetchLogs]);

  const applyNginxFilters = useCallback(() => {
    setNginxIp(nginxIpInput); setNginxStatus(nginxStatusInput); setNginxPath(nginxPathInput); setNginxPage(1);
    fetchNginxLogs(1, nginxLimit, nginxIpInput, nginxStatusInput, nginxPathInput);
  }, [nginxIpInput, nginxStatusInput, nginxPathInput, nginxLimit, fetchNginxLogs]);

  const clearNginxFilters = useCallback(() => {
    setNginxIpInput(""); setNginxStatusInput(""); setNginxPathInput("");
    setNginxIp(""); setNginxStatus(""); setNginxPath(""); setNginxPage(1);
    fetchNginxLogs(1, nginxLimit, "", "", "");
  }, [nginxLimit, fetchNginxLogs]);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      while (!ctrl.signal.aborted) {
        try {
          const res = await fetch(`${API}/api/admin/site-monitor/stream`, {
            headers: { Authorization: `Bearer ${getToken()}` }, signal: ctrl.signal,
          });
          if (!res.body) { await new Promise(r => setTimeout(r, 5000)); continue; }
          setConnected(true);
          sseActiveRef.current = true;
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buf = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const parts = buf.split("\n\n");
            buf = parts.pop() ?? "";
            for (const part of parts) {
              const line = part.startsWith("data: ") ? part.slice(6) : part;
              if (!line.trim()) continue;
              try {
                const evt: MonitorEvent = JSON.parse(line);
                lastCheckedAtRef.current = evt.checkedAt;
                setStatus(evt);
                resetCountdown();
                setLiveEvents(prev => [evt, ...prev].slice(0, 50));
                fetchLogs(1, 50, "all", "checkedAt", "desc");
              } catch { /**/ }
            }
          }
        } catch { /**/ }
        setConnected(false);
        sseActiveRef.current = false;
        if (!ctrl.signal.aborted) await new Promise(r => setTimeout(r, 5000));
      }
    })();
    return () => ctrl.abort();
  }, [fetchLogs, resetCountdown]); // eslint-disable-line

  useEffect(() => {
    const id = setInterval(() => {
      fetchStatus();
      fetchLogs(page, pageSize, uptimeFilter, sortBy, sortDir);
      if (activeTab === "nginx") fetchNginxLogs(nginxPage, nginxLimit, nginxIp, nginxStatus, nginxPath);
    }, 27_000);
    return () => clearInterval(id);
  }, [fetchStatus, fetchLogs, fetchNginxLogs, activeTab, page, pageSize, uptimeFilter, sortBy, sortDir, nginxPage, nginxLimit, nginxIp, nginxStatus, nginxPath]);

  useEffect(() => {
    fetchStatus();
    fetchLogs(1, 50, "all", "checkedAt", "desc");
    fetchNginxLogs(1, 100, "", "", "");
  }, []); // eslint-disable-line

  useEffect(() => {
    const id = setInterval(() => {
      const next = Math.max(0, countdownRef.current - 1);
      countdownRef.current = next;
      setCountdown(next);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const uptimePct = totalCount > 0 ? ((upCount / totalCount) * 100).toFixed(2) : null;
  const totalPages = Math.ceil(total / pageSize);
  const nginxTotalPages = Math.ceil(nginxTotal / nginxLimit);
  const hasNginxFilter = !!(nginxIp || nginxStatus || nginxPath);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl"><Globe size={22} className="text-blue-600" /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Site İzleme</h1>
            <p className="text-sm text-slate-500">autoforcepart.com · Her 25 saniyede bir · Cloudflare Real IP aktif</p>
          </div>
        </div>
        {connected ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Canlı
            <span className="font-mono tabular-nums text-emerald-500">{countdown}s</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full">
            <RefreshCw size={11} className="animate-spin" />
            Polling
            <span className="font-mono tabular-nums text-blue-400">{countdown}s</span>
          </span>
        )}
      </div>

      <div className={`rounded-2xl border p-6 flex items-center gap-6 shadow-sm ${!status ? "bg-slate-50 border-slate-200" : status.isUp ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
        <div className={`relative flex items-center justify-center w-20 h-20 rounded-full shrink-0 ${!status ? "bg-slate-200" : status.isUp ? "bg-emerald-500" : "bg-red-500"}`}>
          {!status ? <Loader2 size={32} className="text-white animate-spin" />
            : status.isUp ? (<><Wifi size={32} className="text-white" /><span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" /></>)
            : <WifiOff size={32} className="text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-3xl font-black tracking-tight ${!status ? "text-slate-400" : status.isUp ? "text-emerald-700" : "text-red-700"}`}>
            {!status ? "Bekleniyor..." : status.isUp ? "ÇEVRİMİÇİ" : "ÇEVRİMDIŞI"}
          </div>
          <div className="text-sm text-slate-500 mt-1">{status ? `Son kontrol: ${fmtTime(status.checkedAt)}` : "İlk kontrol bekleniyor (≤10s)"}</div>
          {status?.errorMessage && <div className="mt-1 text-sm text-red-600 font-medium">{status.errorMessage}</div>}
        </div>
        <div className="grid grid-cols-3 gap-8 text-center shrink-0">
          <div>
            <div className={`text-2xl font-bold ${status ? latencyColor(status.responseTimeMs) : "text-slate-400"}`}>{status ? `${status.responseTimeMs}ms` : "—"}</div>
            <div className="text-xs text-slate-500 mt-0.5">Yanıt Süresi</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-700">{status?.httpStatusCode ?? "—"}</div>
            <div className="text-xs text-slate-500 mt-0.5">HTTP Kodu</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${uptimePct && parseFloat(uptimePct) >= 99 ? "text-emerald-600" : "text-amber-600"}`}>{uptimePct ? `${uptimePct}%` : "—"}</div>
            <div className="text-xs text-slate-500 mt-0.5">Uptime</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-slate-500" />
              <span className="font-semibold text-slate-800 text-sm">Canlı Kontroller</span>
              {liveEvents.length > 0 && <span className="text-xs text-slate-400">({liveEvents.length})</span>}
            </div>
            <Sparkline events={[...liveEvents].reverse()} />
          </div>
          <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
            {liveEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Loader2 size={24} className="animate-spin mb-2" /><span className="text-sm">İlk kontrol bekleniyor...</span>
              </div>
            ) : liveEvents.map((evt, i) => (
              <div key={i} className={`flex items-center gap-3 px-5 py-2.5 ${i === 0 ? "bg-blue-50/40" : ""}`}>
                {evt.isUp ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0" /> : <XCircle size={15} className="text-red-500 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold ${evt.isUp ? "text-emerald-700" : "text-red-700"}`}>
                    {evt.isUp ? "Çevrimiçi" : "Çevrimdışı"}
                    {evt.httpStatusCode && <span className="ml-1.5 font-mono text-slate-400">HTTP {evt.httpStatusCode}</span>}
                  </div>
                  {evt.errorMessage && <div className="text-xs text-red-500 truncate">{evt.errorMessage}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-xs font-bold ${latencyColor(evt.responseTimeMs)}`}>{evt.responseTimeMs}ms</div>
                  <div className="text-[10px] text-slate-400">{fmtTime(evt.checkedAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2"><Zap size={16} className="text-slate-500" /><span className="font-semibold text-slate-800 text-sm">İstatistikler</span></div>
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Uptime (tüm zamanlar)</span><span className="font-semibold text-slate-700">{uptimePct ? `${uptimePct}%` : "—"}</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: uptimePct ? `${uptimePct}%` : "0%" }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>{upCount} başarılı</span><span>{totalCount - upCount} başarısız</span></div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-2">Son 10 kontrol</div>
            <div className="flex gap-1.5 flex-wrap">
              {liveEvents.slice(0, 10).map((e, i) => (
                <div key={i} title={`${fmtTime(e.checkedAt)} — ${e.responseTimeMs}ms`}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold cursor-default ${e.isUp ? "bg-emerald-500" : "bg-red-500"}`}>
                  {e.isUp ? "✓" : "✗"}
                </div>
              ))}
              {liveEvents.length === 0 && <span className="text-xs text-slate-400">Henüz veri yok</span>}
            </div>
          </div>
          {liveEvents.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Ort. Yanıt (son {Math.min(liveEvents.length, 50)})</div>
              <div className={`text-2xl font-bold ${latencyColor(Math.round(liveEvents.reduce((s, e) => s + e.responseTimeMs, 0) / liveEvents.length))}`}>
                {Math.round(liveEvents.reduce((s, e) => s + e.responseTimeMs, 0) / liveEvents.length)}ms
              </div>
            </div>
          )}
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between"><span>Hedef URL</span><span className="font-mono text-slate-600">autoforcepart.com</span></div>
            <div className="flex justify-between"><span>Kontrol aralığı</span><span className="font-semibold text-slate-600">25 saniye</span></div>
            <div className="flex justify-between"><span>Zaman aşımı</span><span className="font-semibold text-slate-600">10 saniye</span></div>
            <div className="flex justify-between"><span>Gerçek IP</span><span className="font-semibold text-emerald-600">CF-Connecting-IP ✓</span></div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button onClick={() => setActiveTab("uptime")}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition ${activeTab === "uptime" ? "border-blue-500 text-blue-700 bg-blue-50/40" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
            <Clock size={15} />Uptime Geçmişi
            {totalCount > 0 && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{totalCount.toLocaleString("tr-TR")}</span>}
          </button>
          <button onClick={() => setActiveTab("nginx")}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition ${activeTab === "nginx" ? "border-blue-500 text-blue-700 bg-blue-50/40" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
            <Shield size={15} />Nginx Trafiği
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Gerçek IP</span>
            {nginxTotal > 0 && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{nginxTotal.toLocaleString("tr-TR")}</span>}
          </button>
          <div className="flex-1" />
          <button
            onClick={() => activeTab === "uptime" ? fetchLogs(page, pageSize, uptimeFilter, sortBy, sortDir) : fetchNginxLogs(nginxPage, nginxLimit, nginxIp, nginxStatus, nginxPath)}
            className="px-4 text-slate-400 hover:text-slate-600 transition" title="Yenile">
            <RefreshCw size={14} className={(activeTab === "uptime" ? logsLoading : nginxLoading) ? "animate-spin" : ""} />
          </button>
        </div>

        {activeTab === "uptime" && (<>
          <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5"><Filter size={13} className="text-slate-400" /><span className="text-xs text-slate-500">Durum:</span></div>
            {(["all", "up", "down"] as UptimeFilter[]).map(f => (
              <button key={f} onClick={() => handleFilterChange(f)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${uptimeFilter === f ? f === "up" ? "bg-emerald-500 text-white border-emerald-500" : f === "down" ? "bg-red-500 text-white border-red-500" : "bg-blue-500 text-white border-blue-500" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
                {f === "all" ? "Tümü" : f === "up" ? "✓ Çevrimiçi" : "✗ Çevrimdışı"}
              </button>
            ))}
            <div className="flex-1" />
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Sayfa başı:</span>
              {[25, 50, 100].map(ps => (
                <button key={ps} onClick={() => handlePageSizeChange(ps)}
                  className={`px-2.5 py-1 rounded border font-medium transition ${pageSize === ps ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
                  {ps}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Durum</th>
                  <SortTh label="Tarih / Saat" field="checkedAt" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                  <SortTh label="HTTP" field="httpStatusCode" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                  <SortTh label="Yanıt Süresi" field="responseTimeMs" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Hata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logsLoading ? (
                  <tr><td colSpan={5} className="py-12 text-center"><Loader2 size={20} className="animate-spin text-slate-400 mx-auto" /></td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-slate-400">Kayıt bulunamadı.</td></tr>
                ) : logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-2.5">
                      {log.isUp
                        ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full"><CheckCircle2 size={10} />Çevrimiçi</span>
                        : <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full"><XCircle size={10} />Çevrimdışı</span>}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 font-mono text-xs whitespace-nowrap">{fmtDateTime(log.checkedAt)}</td>
                    <td className="px-4 py-2.5">
                      {log.httpStatusCode ? <span className={`font-mono text-xs font-bold ${statusColor(log.httpStatusCode)}`}>{log.httpStatusCode}</span> : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-bold ${latencyColor(log.responseTimeMs)}`}>{log.responseTimeMs}ms</span>
                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${latencyBg(log.responseTimeMs)}`} style={{ width: `${Math.min(100, (log.responseTimeMs / 2000) * 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-red-500 max-w-xs truncate">{log.errorMessage ?? <span className="text-slate-200">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">{total.toLocaleString("tr-TR")} kayıt · Sayfa {page} / {Math.max(1, totalPages)}</span>
            <div className="flex gap-1 items-center">
              <button onClick={() => { setPage(1); fetchLogs(1, pageSize, uptimeFilter, sortBy, sortDir); }} disabled={page === 1} className="px-2 py-1.5 rounded text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed">«</button>
              <button onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchLogs(p, pageSize, uptimeFilter, sortBy, sortDir); }} disabled={page === 1} className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={14} /></button>
              <span className="px-3 py-1.5 text-xs font-medium text-slate-600">{page}</span>
              <button onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchLogs(p, pageSize, uptimeFilter, sortBy, sortDir); }} disabled={page >= totalPages} className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={14} /></button>
              <button onClick={() => { setPage(totalPages); fetchLogs(totalPages, pageSize, uptimeFilter, sortBy, sortDir); }} disabled={page >= totalPages} className="px-2 py-1.5 rounded text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed">»</button>
            </div>
          </div>
        </>)}

        {activeTab === "nginx" && (<>
          <div className="px-5 py-2.5 bg-emerald-50/60 border-b border-emerald-100 flex items-center gap-2">
            <Shield size={13} className="text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-800">
              <strong>Gerçek Ziyaretçi IP:</strong> Cloudflare proxy sonrası{" "}
              <code className="font-mono bg-emerald-100 px-1 rounded">CF-Connecting-IP</code> → nginx <code className="font-mono bg-emerald-100 px-1 rounded">$remote_addr</code>.
              Son 5.000 satır · 27 saniyede bir otomatik yenileme.
            </p>
          </div>
          <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-1.5 self-center"><Search size={13} className="text-slate-400" /><span className="text-xs text-slate-500">Filtre:</span></div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">IP Adresi</label>
              <input type="text" value={nginxIpInput} onChange={e => setNginxIpInput(e.target.value)} onKeyDown={e => e.key === "Enter" && applyNginxFilters()}
                placeholder="1.2.3.4" className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 w-36 focus:outline-none focus:border-blue-400 font-mono" />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">HTTP Status</label>
              <input type="text" value={nginxStatusInput} onChange={e => setNginxStatusInput(e.target.value)} onKeyDown={e => e.key === "Enter" && applyNginxFilters()}
                placeholder="200 / 4 / 5" className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 w-28 focus:outline-none focus:border-blue-400 font-mono" />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Path</label>
              <input type="text" value={nginxPathInput} onChange={e => setNginxPathInput(e.target.value)} onKeyDown={e => e.key === "Enter" && applyNginxFilters()}
                placeholder="/api/..." className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 w-44 focus:outline-none focus:border-blue-400 font-mono" />
            </div>
            <button onClick={applyNginxFilters} className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium self-end">Uygula</button>
            {hasNginxFilter && <button onClick={clearNginxFilters} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 self-end px-2 py-1.5"><X size={12} />Temizle</button>}
            <div className="flex-1" />
            <div className="flex items-center gap-2 text-xs text-slate-500 self-end">
              <span>Göster:</span>
              {[50, 100, 200].map(lim => (
                <button key={lim} onClick={() => { setNginxLimit(lim); setNginxPage(1); fetchNginxLogs(1, lim, nginxIp, nginxStatus, nginxPath); }}
                  className={`px-2.5 py-1 rounded border font-medium transition ${nginxLimit === lim ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
                  {lim}
                </button>
              ))}
            </div>
          </div>
          {hasNginxFilter && (
            <div className="px-5 py-2 border-b border-slate-100 flex flex-wrap gap-2">
              {nginxIp && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-mono">IP: {nginxIp}</span>}
              {nginxStatus && <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-mono">Status: {nginxStatus}xx</span>}
              {nginxPath && <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full font-mono">Path: {nginxPath}</span>}
            </div>
          )}
          {nginxAvailable === false ? (
            <div className="py-16 text-center space-y-2">
              <Server size={32} className="text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-500">Nginx log dosyasına erişilemiyor</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">{nginxError}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide font-semibold">
                    <th className="px-4 py-3 text-left">Gerçek IP<div className="text-[9px] font-normal text-slate-400 normal-case tracking-normal">CF-Connecting-IP</div></th>
                    <th className="px-4 py-3 text-left">Tarih / Saat</th>
                    <th className="px-4 py-3 text-left">Method</th>
                    <th className="px-4 py-3 text-left">Path</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Boyut</th>
                    <th className="px-4 py-3 text-left">Host</th>
                    <th className="px-4 py-3 text-left">User Agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {nginxLoading ? (
                    <tr><td colSpan={8} className="py-12 text-center"><Loader2 size={20} className="animate-spin text-slate-400 mx-auto" /></td></tr>
                  ) : nginxLogs.length === 0 ? (
                    <tr><td colSpan={8} className="py-12 text-center text-sm text-slate-400">Kayıt bulunamadı.</td></tr>
                  ) : nginxLogs.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="font-mono text-xs font-semibold text-slate-800">{log.remoteAddr}</div>
                        {log.cfIp && log.cfIp !== "-" && log.cfIp !== log.remoteAddr && (
                          <div className="text-[10px] text-slate-400 font-mono">CF: {log.cfIp}</div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500 font-mono whitespace-nowrap">{fmtNginxTime(log.timeLocal)}</td>
                      <td className="px-4 py-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${log.method === "GET" ? "bg-emerald-50 text-emerald-700" : log.method === "POST" ? "bg-blue-50 text-blue-700" : log.method === "OPTIONS" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700"}`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="px-4 py-2 max-w-[200px]">
                        <span className="font-mono text-xs text-slate-700 truncate block" title={log.path}>{log.path}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-block text-xs font-bold font-mono px-2 py-0.5 rounded border ${statusBadge(log.statusCode)}`}>{log.statusCode}</span>
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">{formatBytes(log.bodyBytesSent)}</td>
                      <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">
                        {log.host !== "-" ? log.host : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-2 max-w-[180px]">
                        <span className="text-[10px] text-slate-400 truncate block" title={log.userAgent}>
                          {(log.userAgent.replace(/Mozilla\/5\.0 \([^)]+\)\s*/g, "") || log.userAgent).substring(0, 60)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {nginxAvailable !== false && nginxTotalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">{nginxTotal.toLocaleString("tr-TR")} kayıt · Sayfa {nginxPage} / {nginxTotalPages}</span>
              <div className="flex gap-1 items-center">
                <button onClick={() => { setNginxPage(1); fetchNginxLogs(1, nginxLimit, nginxIp, nginxStatus, nginxPath); }} disabled={nginxPage === 1} className="px-2 py-1.5 rounded text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed">«</button>
                <button onClick={() => { const p = Math.max(1, nginxPage - 1); setNginxPage(p); fetchNginxLogs(p, nginxLimit, nginxIp, nginxStatus, nginxPath); }} disabled={nginxPage === 1} className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={14} /></button>
                <span className="px-3 py-1.5 text-xs font-medium text-slate-600">{nginxPage}</span>
                <button onClick={() => { const p = Math.min(nginxTotalPages, nginxPage + 1); setNginxPage(p); fetchNginxLogs(p, nginxLimit, nginxIp, nginxStatus, nginxPath); }} disabled={nginxPage >= nginxTotalPages} className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={14} /></button>
                <button onClick={() => { setNginxPage(nginxTotalPages); fetchNginxLogs(nginxTotalPages, nginxLimit, nginxIp, nginxStatus, nginxPath); }} disabled={nginxPage >= nginxTotalPages} className="px-2 py-1.5 rounded text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed">»</button>
              </div>
            </div>
          )}
        </>)}
      </div>
    </div>
  );
}
