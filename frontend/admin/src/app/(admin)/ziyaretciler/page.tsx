"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { MapPin, Search, RefreshCw, Globe, User, UserX, Monitor, Smartphone, Filter } from "lucide-react";

interface VisitorLog {
  id: string;
  sessionId?: string;
  userId?: string;
  userFullName?: string;
  ipAddress?: string;
  userAgent?: string;
  page?: string;
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  referrer?: string;
  createdDate: string;
}

interface VisitorLogsResult {
  items: VisitorLog[];
  totalCount: number;
}

const PAGE_SIZES = [20, 50, 100];

function formatDate(d: string) {
  return new Date(d).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function browserLabel(ua?: string): { label: string; isMobile: boolean } {
  if (!ua) return { label: "—", isMobile: false };
  const mobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  if (ua.includes("Edg")) return { label: "Edge", isMobile: mobile };
  if (ua.includes("Chrome")) return { label: "Chrome", isMobile: mobile };
  if (ua.includes("Firefox")) return { label: "Firefox", isMobile: mobile };
  if (ua.includes("Safari")) return { label: "Safari", isMobile: mobile };
  return { label: ua.split(" ").slice(-1)[0], isMobile: mobile };
}

export default function ZiyaretcilerPage() {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [ipFilter, setIpFilter] = useState("");
  const [pageFilter, setPageFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (ipFilter) params.set("ipAddress", ipFilter);
      if (pageFilter) params.set("pageFilter", pageFilter);
      const data = await api.get<VisitorLogsResult>(`/api/admin/visitor-logs?${params}`);
      setLogs(data.items);
      setTotal(data.totalCount);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, pageSize, ipFilter, pageFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilter = !!(ipFilter || pageFilter);

  return (
    <div className="space-y-5">
      {/* Distinctive header */}
      <div className="rounded-2xl overflow-hidden shadow-sm"
        style={{ background: "linear-gradient(135deg, #0f766e 0%, #0d9488 60%, #0891b2 100%)" }}>
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 shadow">
              <MapPin size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">Ziyaretçi Logları</h1>
              <p className="text-teal-100 text-xs mt-0.5">
                Müşteri sitesine gelen trafik — sayfa ziyaretleri, konum, tarayıcı bilgisi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5">
              <Globe size={13} className="text-teal-200" />
              <span className="text-white text-xs font-semibold">{total.toLocaleString("tr-TR")} kayıt</span>
            </div>
            <button onClick={load}
              className="flex items-center gap-2 bg-white text-teal-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-teal-50 transition shadow">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Yenile
            </button>
          </div>
        </div>
      </div>

      {/* Fark kartı */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-start gap-3">
          <MapPin size={18} className="text-teal-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-teal-800">Ziyaretçiler (bu ekran)</p>
            <p className="text-xs text-teal-600 mt-0.5 leading-relaxed">
              Müşteri sitesinin ziyaret kaydı. Kim hangi sayfayı, nereden, hangi cihazla ziyaret etti?
              Anonim ziyaretçiler de dahildir. Coğrafi veri + tarayıcı bilgisi içerir.
            </p>
          </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
          <User size={18} className="text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-indigo-800">Hareketler (ayrı ekran)</p>
            <p className="text-xs text-indigo-600 mt-0.5 leading-relaxed">
              Kullanıcı işlem kaydı (audit log). Kim ne değiştirdi, hangi kayıt oluşturuldu/silindi?
              Yalnızca kimliği doğrulanmış kullanıcıları kapsar. Admin eylemlerini içerir.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
        <Filter size={14} className="text-slate-400" />

        <div className="relative flex-1 min-w-36">
          <Globe size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="IP filtrele..."
            value={ipFilter}
            onChange={e => { setIpFilter(e.target.value); setPage(1); }}
            className="pl-8 pr-3 py-1.5 w-full text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-900 bg-white"
          />
        </div>

        <div className="relative flex-1 min-w-36">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Sayfa filtrele..."
            value={pageFilter}
            onChange={e => { setPageFilter(e.target.value); setPage(1); }}
            className="pl-8 pr-3 py-1.5 w-full text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-900 bg-white"
          />
        </div>

        <select
          value={pageSize}
          onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
          className="border border-slate-300 rounded-xl px-2 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s} kayıt</option>)}
        </select>

        {hasFilter && (
          <button onClick={() => { setIpFilter(""); setPageFilter(""); setPage(1); }}
            className="text-xs text-slate-500 hover:text-slate-700 underline">
            Filtreleri Temizle
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Tarih", "Ziyaretçi", "IP Adresi", "Konum", "Sayfa", "Cihaz / Tarayıcı", "Referrer", "Koordinat"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">Yükleniyor...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">Kayıt bulunamadı</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition group">
                  <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(log.createdDate)}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-700">
                    {log.userFullName ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                          <User size={11} className="text-teal-600" />
                        </span>
                        <span className="font-medium text-slate-800">{log.userFullName}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <UserX size={11} className="text-slate-400" />
                        </span>
                        <span className="text-slate-400">Misafir</span>
                      </span>
                    )}
                    {log.userId && <p className="text-[10px] text-slate-400 font-mono mt-0.5 pl-[26px]">{log.userId.slice(0, 8)}…</p>}
                  </td>
                  <td className="px-5 py-3 text-xs font-mono text-slate-800">
                    <span className="inline-flex items-center gap-1.5">
                      <Globe size={11} className="text-slate-400 shrink-0" />
                      {log.ipAddress ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600 whitespace-nowrap">
                    {log.city || log.country ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={11} className="text-teal-500 shrink-0" />
                        {[log.city, log.country].filter(Boolean).join(", ")}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-700 max-w-48 truncate" title={log.page ?? ""}>
                    {log.page ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {(() => {
                      const { label, isMobile } = browserLabel(log.userAgent);
                      return (
                        <span className="inline-flex items-center gap-1.5">
                          {isMobile
                            ? <Smartphone size={11} className="text-violet-400 shrink-0" />
                            : <Monitor size={11} className="text-slate-400 shrink-0" />}
                          {label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400 max-w-36 truncate" title={log.referrer ?? ""}>
                    {log.referrer ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-xs whitespace-nowrap">
                    {log.latitude != null && log.longitude != null ? (
                      <a href={`https://maps.google.com/?q=${log.latitude},${log.longitude}`} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-800 transition">
                        <MapPin size={11} className="shrink-0" />
                        {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <button onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">
              ← Önceki
            </button>
          )}
          <span className="px-4 py-2 text-sm text-slate-500">{page} / {totalPages}</span>
          {page < totalPages && (
            <button onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">
              Sonraki →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
