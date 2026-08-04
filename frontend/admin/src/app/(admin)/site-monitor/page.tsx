"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Activity, Wifi, WifiOff, Clock, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, AlertTriangle, Loader2, Zap, Globe,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5124";

// ── Types ──────────────────────────────────────────────────────────────────

interface MonitorEvent {
  isUp: boolean;
  httpStatusCode: number | null;
  responseTimeMs: number;
  errorMessage: string | null;
  checkedAt: string;
}

interface UptimeLog {
  id: string;
  url: string;
  isUp: boolean;
  httpStatusCode: number | null;
  responseTimeMs: number;
  errorMessage: string | null;
  checkedAt: string;
}

interface LogsResponse {
  total: number;
  page: number;
  logs: UptimeLog[];
  upCount: number;
  totalCount: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString("tr-TR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function fmtDateTime(dt: string) {
  return new Date(dt).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function latencyColor(ms: number) {
  if (ms < 500) return "text-emerald-600";
  if (ms < 1500) return "text-amber-600";
  return "text-red-600";
}

function latencyBg(ms: number) {
  if (ms < 500) return "bg-emerald-500";
  if (ms < 1500) return "bg-amber-500";
  return "bg-red-500";
}

// ── Mini latency sparkline ─────────────────────────────────────────────────

function Sparkline({ events }: { events: MonitorEvent[] }) {
  const last = events.slice(-20);
  if (last.length === 0) return null;
  const max = Math.max(...last.map(e => e.responseTimeMs), 1);
  return (
    <div className="flex items-end gap-0.5 h-10">
      {last.map((e, i) => {
        const h = Math.max(4, Math.round((e.responseTimeMs / max) * 40));
        return (
          <div
            key={i}
            title={`${e.responseTimeMs}ms`}
            className={`w-2 rounded-sm ${e.isUp ? latencyBg(e.responseTimeMs) : "bg-red-500"}`}
            style={{ height: h }}
          />
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function SiteMonitorPage() {
  const [status, setStatus] = useState<MonitorEvent | null>(null);
  const [liveEvents, setLiveEvents] = useState<MonitorEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<UptimeLog[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [upCount, setUpCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);
  const streamRef = useRef<AbortController | null>(null);
  const logListRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async (p: number) => {
    setLogsLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
      const res = await fetch(`${API}/api/admin/site-monitor/logs?page=${p}`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (!res.ok) return;
      const data: LogsResponse = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
      setUpCount(data.upCount ?? 0);
      setTotalCount(data.totalCount ?? 0);
    } catch {
      // ignore
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
      const res = await fetch(`${API}/api/admin/site-monitor/status`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (!res.ok) return;
      const data = await res.json() as { available: boolean } & MonitorEvent;
      if (data.available) setStatus(data);
    } catch {
      // ignore
    }
  }, []);

  // SSE stream
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    const ctrl = new AbortController();
    streamRef.current = ctrl;

    (async () => {
      try {
        const res = await fetch(`${API}/api/admin/site-monitor/stream`, {
          headers: { Authorization: `Bearer ${token ?? ""}` },
          signal: ctrl.signal,
        });
        if (!res.body) return;
        setConnected(true);

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
              setStatus(evt);
              setLiveEvents(prev => [evt, ...prev].slice(0, 50));
              // Silently refresh logs after each check
              fetchLogs(1);
            } catch {
              // ignore parse errors
            }
          }
        }
      } catch {
        // ignore
      } finally {
        setConnected(false);
      }
    })();

    return () => ctrl.abort();
  }, [fetchLogs]);

  // Initial data load
  useEffect(() => {
    fetchStatus();
    fetchLogs(1);
  }, [fetchStatus, fetchLogs]);

  useEffect(() => {
    fetchLogs(page);
  }, [page, fetchLogs]);

  const totalPages = Math.ceil(total / 50);
  const uptimePct = totalCount > 0 ? ((upCount / totalCount) * 100).toFixed(2) : null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl">
            <Globe size={22} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Site İzleme</h1>
            <p className="text-sm text-slate-500">autoforcepart.com · Her 25 saniyede bir kontrol</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Canlı
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Bağlanıyor...
            </span>
          )}
        </div>
      </div>

      {/* Status Card */}
      <div className={`rounded-2xl border p-6 flex items-center gap-6 shadow-sm ${
        status === null
          ? "bg-slate-50 border-slate-200"
          : status.isUp
            ? "bg-emerald-50 border-emerald-200"
            : "bg-red-50 border-red-200"
      }`}>
        <div className={`relative flex items-center justify-center w-20 h-20 rounded-full ${
          status === null ? "bg-slate-200" : status.isUp ? "bg-emerald-500" : "bg-red-500"
        }`}>
          {status === null ? (
            <Loader2 size={32} className="text-white animate-spin" />
          ) : status.isUp ? (
            <>
              <Wifi size={32} className="text-white" />
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />
            </>
          ) : (
            <WifiOff size={32} className="text-white" />
          )}
        </div>

        <div className="flex-1">
          <div className={`text-3xl font-black tracking-tight ${
            status === null ? "text-slate-400" : status.isUp ? "text-emerald-700" : "text-red-700"
          }`}>
            {status === null ? "Bekleniyor..." : status.isUp ? "ÇEVRIMIÇI" : "ÇEVRIMDIŞI"}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            {status
              ? `Son kontrol: ${fmtTime(status.checkedAt)}`
              : "İlk kontrol bekleniyor (≤10s)"}
          </div>
          {status?.errorMessage && (
            <div className="mt-1 text-sm text-red-600 font-medium">{status.errorMessage}</div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className={`text-2xl font-bold ${status ? latencyColor(status.responseTimeMs) : "text-slate-400"}`}>
              {status ? `${status.responseTimeMs}ms` : "—"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Yanıt Süresi</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-700">
              {status?.httpStatusCode ?? "—"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">HTTP Kodu</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${uptimePct && parseFloat(uptimePct) >= 99 ? "text-emerald-600" : "text-amber-600"}`}>
              {uptimePct ? `${uptimePct}%` : "—"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Uptime</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Events */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-slate-500" />
              <span className="font-semibold text-slate-800 text-sm">Canlı Kontroller</span>
            </div>
            <Sparkline events={[...liveEvents].reverse()} />
          </div>

          <div
            ref={logListRef}
            className="divide-y divide-slate-50 max-h-80 overflow-y-auto"
          >
            {liveEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Loader2 size={24} className="animate-spin mb-2" />
                <span className="text-sm">İlk kontrol bekleniyor...</span>
              </div>
            ) : (
              liveEvents.map((evt, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-5 py-3 ${i === 0 ? "bg-blue-50/40" : ""}`}
                >
                  {evt.isUp ? (
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle size={15} className="text-red-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold ${evt.isUp ? "text-emerald-700" : "text-red-700"}`}>
                      {evt.isUp ? "Çevrimiçi" : "Çevrimdışı"}
                      {evt.httpStatusCode && (
                        <span className="ml-1.5 font-mono text-slate-500">HTTP {evt.httpStatusCode}</span>
                      )}
                    </div>
                    {evt.errorMessage && (
                      <div className="text-xs text-red-500 truncate">{evt.errorMessage}</div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-xs font-bold ${latencyColor(evt.responseTimeMs)}`}>
                      {evt.responseTimeMs}ms
                    </div>
                    <div className="text-[10px] text-slate-400">{fmtTime(evt.checkedAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-slate-500" />
            <span className="font-semibold text-slate-800 text-sm">İstatistikler</span>
          </div>

          {/* Uptime bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Uptime (tüm zamanlar)</span>
              <span className="font-semibold text-slate-700">{uptimePct ? `${uptimePct}%` : "—"}</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: uptimePct ? `${uptimePct}%` : "0%" }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>{upCount} başarılı</span>
              <span>{totalCount - upCount} başarısız</span>
            </div>
          </div>

          {/* Last 10 checks mini grid */}
          <div>
            <div className="text-xs text-slate-500 mb-2">Son 10 kontrol</div>
            <div className="flex gap-1.5 flex-wrap">
              {liveEvents.slice(0, 10).map((e, i) => (
                <div
                  key={i}
                  title={`${fmtTime(e.checkedAt)} — ${e.responseTimeMs}ms${e.errorMessage ? ` — ${e.errorMessage}` : ""}`}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold cursor-default ${
                    e.isUp ? "bg-emerald-500" : "bg-red-500"
                  }`}
                >
                  {e.isUp ? "✓" : "✗"}
                </div>
              ))}
              {liveEvents.length === 0 && (
                <span className="text-xs text-slate-400">Henüz veri yok</span>
              )}
            </div>
          </div>

          {/* Avg latency */}
          {liveEvents.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Ortalama Yanıt (son {Math.min(liveEvents.length, 50)} kontrol)</div>
              <div className={`text-2xl font-bold ${latencyColor(
                Math.round(liveEvents.reduce((s, e) => s + e.responseTimeMs, 0) / liveEvents.length)
              )}`}>
                {Math.round(liveEvents.reduce((s, e) => s + e.responseTimeMs, 0) / liveEvents.length)}ms
              </div>
            </div>
          )}

          {/* Target info */}
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Hedef URL</span>
              <span className="font-mono text-slate-600">autoforcepart.com</span>
            </div>
            <div className="flex justify-between">
              <span>Kontrol aralığı</span>
              <span className="font-semibold text-slate-600">25 saniye</span>
            </div>
            <div className="flex justify-between">
              <span>Zaman aşımı</span>
              <span className="font-semibold text-slate-600">10 saniye</span>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-slate-500" />
            <span className="font-semibold text-slate-800 text-sm">Kontrol Geçmişi</span>
            {total > 0 && (
              <span className="text-xs text-slate-400">({total.toLocaleString("tr-TR")} kayıt)</span>
            )}
          </div>
          <button
            onClick={() => fetchLogs(page)}
            className="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-slate-100"
            title="Yenile"
          >
            <RefreshCw size={14} className={logsLoading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Durum</th>
                <th className="px-5 py-3 text-left">Tarih / Saat</th>
                <th className="px-5 py-3 text-left">HTTP</th>
                <th className="px-5 py-3 text-left">Yanıt Süresi</th>
                <th className="px-5 py-3 text-left">Hata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logsLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 size={20} className="animate-spin text-slate-400 mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                    Henüz kayıt yok. İlk kontrol bekleniyor...
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      {log.isUp ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          <CheckCircle2 size={11} /> Çevrimiçi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                          <XCircle size={11} /> Çevrimdışı
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                      {fmtDateTime(log.checkedAt)}
                    </td>
                    <td className="px-5 py-3">
                      {log.httpStatusCode ? (
                        <span className={`font-mono text-xs font-bold ${
                          log.httpStatusCode < 300 ? "text-emerald-600" :
                          log.httpStatusCode < 400 ? "text-blue-600" :
                          log.httpStatusCode < 500 ? "text-amber-600" : "text-red-600"
                        }`}>{log.httpStatusCode}</span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`font-mono text-xs font-bold ${latencyColor(log.responseTimeMs)}`}>
                        {log.responseTimeMs}ms
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-red-500 max-w-xs truncate">
                      {log.errorMessage ?? <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Sayfa {page} / {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
