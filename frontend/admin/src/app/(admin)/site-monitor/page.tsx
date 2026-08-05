"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Activity, Wifi, WifiOff, Clock, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Loader2, Zap, Globe, ChevronUp, ChevronDown,
  Filter, Shield, Server, Search, X, AlertTriangle, Users, Eye,
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
type NginxView = "list" | "ips";

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

function detectBot(ua: string): string | null {
  if (!ua || ua === "-") return null;
  const bots: [RegExp, string][] = [
    [/googlebot/i, "Googlebot"], [/bingbot/i, "Bingbot"], [/ahrefsbot/i, "AhrefsBot"],
    [/semrushbot/i, "SemrushBot"], [/dotbot/i, "DotBot"], [/petalbot/i, "PetalBot"],
    [/yandexbot/i, "YandexBot"], [/mj12bot/i, "MJ12Bot"], [/sogou/i, "Sogou"],
    [/python-requests/i, "Python"], [/go-http-client/i, "Go HTTP"],
    [/curl\//i, "curl"], [/wget\//i, "wget"], [/okhttp/i, "OkHttp"],
    [/postmanruntime/i, "Postman"], [/facebookexternalhit/i, "Facebook"],
    [/twitterbot/i, "Twitter"], [/linkedinbot/i, "LinkedIn"],
    [/bot|crawler|spider|scraper/i, "Bot"],
  ];
  for (const [re, name] of bots) if (re.test(ua)) return name;
  return null;
}

function detectThreat(path: string): { level: "high" | "medium" | null; reason: string } {
  const high: [RegExp, string][] = [
    [/\.\.\//g, "Directory traversal girişimi"],
    [/select.{0,20}from|union.{0,10}select|drop.{0,10}table/i, "SQL injection girişimi"],
    [/<script|javascript:|onerror=/i, "XSS girişimi"],
    [/\/etc\/passwd|\/etc\/shadow/i, "Sistem dosyası erişimi"],
    [/\/shell|exec\(|eval\(/i, "Shell erişim girişimi"],
    [/\.git\/config|\.git\/HEAD/i, ".git yapılandırma ifşası"],
  ];
  const med: [RegExp, string][] = [
    [/\.env(\b|$)/i, ".env dosyası taraması"],
    [/wp-admin|wp-login|xmlrpc\.php/i, "WordPress güvenlik taraması"],
    [/phpmyadmin/i, "phpMyAdmin taraması"],
    [/\.php$/i, "PHP dosyası taraması"],
    [/\.git\//i, ".git dizin taraması"],
    [/\.bak$|\.sql$|backup/i, "Yedek dosya taraması"],
    [/\/etc\/|\/proc\//i, "Sistem dizin taraması"],
  ];
  for (const [re, reason] of high) if (re.test(path)) return { level: "high", reason };
  for (const [re, reason] of med) if (re.test(path)) return { level: "medium", reason };
  return { level: null, reason: "" };
}

function parseUA(ua: string): string {
  if (!ua || ua === "-") return "—";
  const bot = detectBot(ua);
  if (bot) return bot;
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\/|Opera\//i.test(ua)) return "Opera";
  if (/Chrome\//i.test(ua)) return "Chrome";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  return ua.substring(0, 30);
}

function categorizeError(log: UptimeLog): { label: string; color: "red" | "amber" | "slate" } {
  if (log.isUp) return { label: "", color: "slate" };
  const msg = (log.errorMessage ?? "").toLowerCase();
  if (msg.includes("timeout") || msg.includes("timed out")) return { label: "Zaman Aşımı", color: "amber" };
  if (msg.includes("refused") || msg.includes("connection")) return { label: "Bağlantı Reddedildi", color: "red" };
  if (msg.includes("dns") || msg.includes("resolve") || msg.includes("host")) return { label: "DNS Hatası", color: "red" };
  if (msg.includes("ssl") || msg.includes("tls") || msg.includes("cert")) return { label: "SSL/TLS Hatası", color: "red" };
  if (log.httpStatusCode && log.httpStatusCode >= 500) return { label: "Sunucu Hatası", color: "red" };
  if (log.httpStatusCode && log.httpStatusCode >= 400) return { label: "İstemci Hatası", color: "amber" };
  return { label: "Ağ Hatası", color: "red" };
}

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
  const [nginxView, setNginxView] = useState<NginxView>("list");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

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
  }, [fetchLogs, resetCountdown]);

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

  const nginxStats = useMemo(() => {
    if (!nginxLogs.length) return null;
    let s2 = 0, s3 = 0, s4 = 0, s5 = 0, bots = 0, threats = 0;
    const ipMap: Record<string, { count: number; errors: number; last: string; isBot: boolean; agents: Set<string> }> = {};
    const pathCounts: Record<string, number> = {};
    for (const e of nginxLogs) {
      const sc = e.statusCode;
      if (sc < 300) s2++; else if (sc < 400) s3++; else if (sc < 500) s4++; else s5++;
      const bot = detectBot(e.userAgent);
      if (bot) bots++;
      const { level } = detectThreat(e.path);
      if (level) threats++;
      const ip = (e.cfIp && e.cfIp !== "-") ? e.cfIp : e.remoteAddr;
      if (!ipMap[ip]) ipMap[ip] = { count: 0, errors: 0, last: e.timeLocal, isBot: !!bot, agents: new Set() };
      ipMap[ip].count++;
      if (sc >= 400) ipMap[ip].errors++;
      ipMap[ip].agents.add(parseUA(e.userAgent));
      pathCounts[e.path] = (pathCounts[e.path] || 0) + 1;
    }
    const topIps = Object.entries(ipMap).sort((a, b) => b[1].count - a[1].count).slice(0, 15);
    const topPaths = Object.entries(pathCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { s2, s3, s4, s5, bots, threats, uniqueIps: Object.keys(ipMap).length, topIps, topPaths };
  }, [nginxLogs]);

  const uptimePct = totalCount > 0 ? ((upCount / totalCount) * 100).toFixed(2) : null;
  const totalPages = Math.ceil(total / pageSize);
  const nginxTotalPages = Math.ceil(nginxTotal / nginxLimit);
  const hasNginxFilter = !!(nginxIp || nginxStatus || nginxPath);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
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

      {/* Status card */}
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

      {/* Live events + stats */}
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

      {/* Tabs */}
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
            {nginxStats && nginxStats.threats > 0 && (
              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <AlertTriangle size={9} />{nginxStats.threats}
              </span>
            )}
          </button>
          <div className="flex-1" />
          <button
            onClick={() => activeTab === "uptime" ? fetchLogs(page, pageSize, uptimeFilter, sortBy, sortDir) : fetchNginxLogs(nginxPage, nginxLimit, nginxIp, nginxStatus, nginxPath)}
            className="px-4 text-slate-400 hover:text-slate-600 transition" title="Yenile">
            <RefreshCw size={14} className={(activeTab === "uptime" ? logsLoading : nginxLoading) ? "animate-spin" : ""} />
          </button>
        </div>

        {/* ── UPTIME TAB ── */}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-32">Durum</th>
                  <SortTh label="Tarih / Saat" field="checkedAt" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                  <SortTh label="HTTP" field="httpStatusCode" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                  <SortTh label="Yanıt Süresi" field="responseTimeMs" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Hata Detayı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logsLoading ? (
                  <tr><td colSpan={5} className="py-12 text-center"><Loader2 size={20} className="animate-spin text-slate-400 mx-auto" /></td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-slate-400">Kayıt bulunamadı.</td></tr>
                ) : logs.map(log => {
                  const errCat = categorizeError(log);
                  return (
                    <tr key={log.id} className={`transition-colors ${!log.isUp ? "bg-red-50/30 hover:bg-red-50/50" : "hover:bg-slate-50/60"}`}>
                      <td className="px-4 py-2.5">
                        {log.isUp
                          ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full"><CheckCircle2 size={10} />Çevrimiçi</span>
                          : <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full"><XCircle size={10} />Çevrimdışı</span>}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 font-mono text-xs whitespace-nowrap">{fmtDateTime(log.checkedAt)}</td>
                      <td className="px-4 py-2.5">
                        {log.httpStatusCode
                          ? <span className={`font-mono text-xs font-bold ${statusColor(log.httpStatusCode)}`}>{log.httpStatusCode}</span>
                          : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs font-bold ${latencyColor(log.responseTimeMs)}`}>{log.responseTimeMs}ms</span>
                          <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${latencyBg(log.responseTimeMs)}`} style={{ width: `${Math.min(100, (log.responseTimeMs / 2000) * 100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {!log.isUp ? (
                          <div className="space-y-1">
                            {errCat.label && (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                errCat.color === "red" ? "bg-red-100 text-red-700" : errCat.color === "amber" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                              }`}>
                                <AlertTriangle size={9} />{errCat.label}
                              </span>
                            )}
                            {log.errorMessage && (
                              <div className="text-xs text-red-600 max-w-sm leading-relaxed">{log.errorMessage}</div>
                            )}
                            {!log.errorMessage && !errCat.label && <span className="text-slate-300 text-xs">—</span>}
                          </div>
                        ) : <span className="text-slate-200 text-xs">—</span>}
                      </td>
                    </tr>
                  );
                })}
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

        {/* ── NGINX TAB ── */}
        {activeTab === "nginx" && (<>

          {/* Info bar */}
          <div className="px-5 py-2.5 bg-emerald-50/60 border-b border-emerald-100 flex items-center gap-2">
            <Shield size={13} className="text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-800">
              <strong>Gerçek Ziyaretçi IP:</strong> Cloudflare proxy → <code className="font-mono bg-emerald-100 px-1 rounded">CF-Connecting-IP</code> → nginx <code className="font-mono bg-emerald-100 px-1 rounded">$remote_addr</code>. Son 5.000 satır · 27s otomatik yenileme.
            </p>
          </div>

          {/* Stats panel */}
          {nginxStats && (
            <div className="px-5 py-3 border-b border-slate-100 grid grid-cols-7 gap-2">
              {[
                { label: "Toplam İstek", value: nginxTotal.toLocaleString("tr-TR"), cls: "bg-slate-50 border-slate-200 text-slate-700" },
                { label: "Benzersiz IP", value: nginxStats.uniqueIps, cls: "bg-blue-50 border-blue-200 text-blue-700" },
                { label: "2xx Başarılı", value: nginxStats.s2, cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
                { label: "3xx Yönlendirme", value: nginxStats.s3, cls: "bg-sky-50 border-sky-200 text-sky-700" },
                { label: "4xx İstemci", value: nginxStats.s4, cls: "bg-amber-50 border-amber-200 text-amber-700" },
                { label: "5xx Sunucu", value: nginxStats.s5, cls: nginxStats.s5 > 0 ? "bg-red-50 border-red-300 text-red-700" : "bg-slate-50 border-slate-200 text-slate-400" },
                { label: nginxStats.threats > 0 ? "⚠ Tehdit" : "Tehdit Yok", value: nginxStats.threats, cls: nginxStats.threats > 0 ? "bg-red-50 border-red-300 text-red-700" : "bg-slate-50 border-slate-200 text-slate-400" },
              ].map(({ label, value, cls }) => (
                <div key={label} className={`rounded-xl border p-2.5 text-center ${cls}`}>
                  <div className="text-base font-bold">{value}</div>
                  <div className="text-[10px] mt-0.5 opacity-70">{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Top paths (when data available) */}
          {nginxStats && nginxStats.topPaths.length > 0 && (
            <div className="px-5 py-2.5 border-b border-slate-100 flex items-center gap-4 overflow-x-auto">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium shrink-0">En çok hit:</span>
              {nginxStats.topPaths.map(([path, count]) => (
                <button key={path} onClick={() => { setNginxPathInput(path); setNginxPath(path); setNginxPage(1); setNginxView("list"); fetchNginxLogs(1, nginxLimit, nginxIp, nginxStatus, path); }}
                  className="flex items-center gap-1.5 text-[10px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-2.5 py-1 rounded-full transition shrink-0 font-mono">
                  <span className="truncate max-w-[160px]">{path}</span>
                  <span className="bg-white text-slate-500 px-1.5 rounded-full font-sans">{count}</span>
                </button>
              ))}
            </div>
          )}

          {/* View toggle + filters */}
          <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-end gap-3">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden self-end shrink-0">
              <button onClick={() => setNginxView("list")}
                className={`text-xs px-3 py-1.5 flex items-center gap-1.5 font-medium transition ${nginxView === "list" ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                <Eye size={11} />Liste
              </button>
              <button onClick={() => setNginxView("ips")}
                className={`text-xs px-3 py-1.5 flex items-center gap-1.5 font-medium transition ${nginxView === "ips" ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                <Users size={11} />IP Özeti{nginxStats ? ` (${nginxStats.uniqueIps})` : ""}
              </button>
            </div>

            {nginxView === "list" && (<>
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
            </>)}

            <div className="flex-1" />
            {nginxView === "list" && (
              <div className="flex items-center gap-2 text-xs text-slate-500 self-end">
                <span>Göster:</span>
                {[50, 100, 200].map(lim => (
                  <button key={lim} onClick={() => { setNginxLimit(lim); setNginxPage(1); fetchNginxLogs(1, lim, nginxIp, nginxStatus, nginxPath); }}
                    className={`px-2.5 py-1 rounded border font-medium transition ${nginxLimit === lim ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
                    {lim}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active filter chips */}
          {hasNginxFilter && nginxView === "list" && (
            <div className="px-5 py-2 border-b border-slate-100 flex flex-wrap gap-2">
              {nginxIp && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-mono">IP: {nginxIp}</span>}
              {nginxStatus && <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-mono">Status: {nginxStatus}xx</span>}
              {nginxPath && <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full font-mono">Path: {nginxPath}</span>}
            </div>
          )}

          {/* Content */}
          {nginxAvailable === false ? (
            <div className="py-16 text-center space-y-2">
              <Server size={32} className="text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-500">Nginx log dosyasına erişilemiyor</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">{nginxError}</p>
            </div>

          ) : nginxView === "ips" ? (
            /* IP Özeti */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide font-semibold">
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">IP Adresi</th>
                    <th className="px-4 py-3 text-right">İstek</th>
                    <th className="px-4 py-3 text-right">Hata</th>
                    <th className="px-4 py-3 text-right">Hata %</th>
                    <th className="px-4 py-3 text-left">Tip</th>
                    <th className="px-4 py-3 text-left">Kullanıcı Ajanı</th>
                    <th className="px-4 py-3 text-left">Son İstek</th>
                    <th className="px-4 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {nginxStats ? nginxStats.topIps.map(([ip, d], i) => {
                    const errorPct = d.count > 0 ? (d.errors / d.count * 100) : 0;
                    return (
                      <tr key={i} className={`transition-colors hover:bg-slate-50/60 ${errorPct > 50 ? "bg-red-50/40" : errorPct > 20 ? "bg-amber-50/30" : ""}`}>
                        <td className="px-4 py-2.5 text-xs text-slate-400 font-mono">{i + 1}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-slate-800">{ip}</span>
                            {i === 0 && <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">En aktif</span>}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`font-mono text-xs font-bold ${d.count > 200 ? "text-orange-600" : d.count > 50 ? "text-amber-600" : "text-slate-700"}`}>
                            {d.count.toLocaleString("tr-TR")}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`font-mono text-xs font-bold ${d.errors > 0 ? "text-red-600" : "text-slate-300"}`}>{d.errors}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`text-xs font-bold ${errorPct > 50 ? "text-red-600" : errorPct > 20 ? "text-amber-600" : "text-slate-400"}`}>
                            {errorPct.toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {d.isBot
                            ? <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">Bot</span>
                            : <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">İnsan</span>}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[160px] truncate">
                          {Array.from(d.agents).join(", ")}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-400 font-mono whitespace-nowrap">{fmtNginxTime(d.last)}</td>
                        <td className="px-4 py-2.5">
                          <button
                            onClick={() => { setNginxIpInput(ip); setNginxIp(ip); setNginxPage(1); setNginxView("list"); fetchNginxLogs(1, nginxLimit, ip, nginxStatus, nginxPath); }}
                            className="text-[10px] text-blue-600 hover:underline whitespace-nowrap">
                            Filtrele →
                          </button>
                        </td>
                      </tr>
                    );
                  }) : <tr><td colSpan={9} className="py-8 text-center text-slate-400 text-sm">Veri yok</td></tr>}
                </tbody>
              </table>
            </div>

          ) : (
            /* Liste görünümü */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide font-semibold">
                    <th className="px-4 py-3 text-left">
                      Gerçek IP
                      <div className="text-[9px] font-normal text-slate-400 normal-case tracking-normal">CF-Connecting-IP</div>
                    </th>
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
                  ) : nginxLogs.map((log, i) => {
                    const bot = detectBot(log.userAgent);
                    const threat = detectThreat(log.path);
                    const isExpanded = expandedRow === i;
                    const rowBg = threat.level === "high"
                      ? "bg-red-50/80 hover:bg-red-100/60"
                      : threat.level === "medium"
                      ? "bg-amber-50/50 hover:bg-amber-50/80"
                      : log.statusCode >= 500
                      ? "bg-red-50/40 hover:bg-red-50/60"
                      : log.statusCode >= 400
                      ? "bg-amber-50/30 hover:bg-amber-50/50"
                      : "hover:bg-slate-50/60";
                    return (
                      <>
                        <tr key={`r${i}`}
                          className={`cursor-pointer transition-colors ${rowBg}`}
                          onClick={() => setExpandedRow(isExpanded ? null : i)}>
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
                            <div className="flex items-center gap-1.5">
                              {threat.level === "high" && <span title={threat.reason}><AlertTriangle size={12} className="text-red-500 shrink-0" /></span>}
                              {threat.level === "medium" && <span title={threat.reason}><AlertTriangle size={12} className="text-amber-400 shrink-0" /></span>}
                              <span className="font-mono text-xs text-slate-700 truncate" title={log.path}>{log.path}</span>
                            </div>
                            {threat.level && (
                              <div className={`text-[9px] mt-0.5 font-medium ${threat.level === "high" ? "text-red-600" : "text-amber-600"}`}>{threat.reason}</div>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`inline-block text-xs font-bold font-mono px-2 py-0.5 rounded border ${statusBadge(log.statusCode)}`}>{log.statusCode}</span>
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">{formatBytes(log.bodyBytesSent)}</td>
                          <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">
                            {log.host !== "-" ? log.host : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-2 max-w-[180px]">
                            <div className="flex items-center gap-1.5">
                              {bot && <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-medium shrink-0">{bot}</span>}
                              <span className="text-[10px] text-slate-400 truncate" title={log.userAgent}>
                                {parseUA(log.userAgent)}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr key={`e${i}`} className={rowBg}>
                            <td colSpan={8} className="px-5 pb-3 pt-0">
                              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                {threat.level && (
                                  <div className={`flex items-start gap-2.5 px-4 py-3 ${threat.level === "high" ? "bg-red-50 border-b border-red-200" : "bg-amber-50 border-b border-amber-200"}`}>
                                    <AlertTriangle size={15} className={`mt-0.5 shrink-0 ${threat.level === "high" ? "text-red-600" : "text-amber-600"}`} />
                                    <div>
                                      <span className={`text-xs font-bold ${threat.level === "high" ? "text-red-700" : "text-amber-700"}`}>
                                        {threat.level === "high" ? "YÜKSEK TEHDİT" : "ORTA TEHDİT"}
                                      </span>
                                      <span className={`text-xs ml-2 ${threat.level === "high" ? "text-red-600" : "text-amber-600"}`}>{threat.reason}</span>
                                      {threat.level === "high" && (
                                        <p className="text-[10px] text-red-500 mt-0.5">Bu IP&apos;yi IP Özeti görünümünde inceleyip engellemek için sunucu tarafında firewall kuralı ekleyebilirsiniz.</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-0 divide-x divide-slate-100">
                                  <div className="p-4 space-y-3">
                                    <div>
                                      <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1">Tam Path</div>
                                      <code className="font-mono text-xs text-slate-800 break-all bg-slate-50 px-2 py-1 rounded block">{log.path}</code>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1">User Agent (tam)</div>
                                      <span className="text-xs text-slate-600 break-all leading-relaxed">{log.userAgent}</span>
                                      {bot && <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{bot} · Otomatik istemci</span>}
                                    </div>
                                  </div>
                                  <div className="p-4 space-y-3">
                                    <div>
                                      <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1">IP Bilgisi</div>
                                      <div className="space-y-1 text-xs">
                                        <div className="flex items-center justify-between">
                                          <span className="text-slate-500">nginx $remote_addr</span>
                                          <code className="font-mono text-slate-800">{log.remoteAddr}</code>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-slate-500">CF-Connecting-IP</span>
                                          <code className={`font-mono ${log.cfIp !== "-" ? "text-slate-800" : "text-slate-300"}`}>{log.cfIp !== "-" ? log.cfIp : "—"}</code>
                                        </div>
                                        {log.cfIp && log.cfIp !== "-" && log.cfIp === log.remoteAddr && (
                                          <p className="text-[10px] text-emerald-600">✓ Cloudflare Real IP başarıyla çözümlendi</p>
                                        )}
                                        {log.cfIp && log.cfIp !== "-" && log.cfIp !== log.remoteAddr && (
                                          <p className="text-[10px] text-amber-600">⚠ $remote_addr Cloudflare proxy IP&apos;si; gerçek kaynak CF-Connecting-IP</p>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1">İstek Detayları</div>
                                      <div className="space-y-1 text-xs">
                                        <div className="flex items-center justify-between">
                                          <span className="text-slate-500">Host</span><span className="text-slate-700">{log.host}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-slate-500">Method</span>
                                          <span className={`font-mono font-bold ${log.method === "GET" ? "text-emerald-600" : log.method === "POST" ? "text-blue-600" : "text-amber-600"}`}>{log.method}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-slate-500">HTTP Status</span>
                                          <span className={`font-mono font-bold ${statusColor(log.statusCode)}`}>{log.statusCode}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-slate-500">Yanıt boyutu</span><span className="text-slate-700">{formatBytes(log.bodyBytesSent)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-slate-500">Zaman</span><span className="text-slate-700 font-mono">{fmtNginxTime(log.timeLocal)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {nginxAvailable !== false && nginxView === "list" && nginxTotalPages > 1 && (
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
