"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { PaginatedList } from "@/types";
import {
  AlertTriangle, Info, AlertCircle, Search, Filter,
  Server, Monitor, Clock, ChevronDown, ChevronUp, X,
} from "lucide-react";

interface ErrorLog {
  id: string;
  source: string;
  level: string;
  message: string;
  stackTrace?: string;
  path?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  statusCode?: number;
  createdDate: string;
}

const PAGE_SIZES = [20, 30, 50, 100];

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

function sourceBadge(source: string) {
  if (source === "Backend") return "bg-violet-100 text-violet-700 border border-violet-200";
  return "bg-teal-100 text-teal-700 border border-teal-200";
}

function sourceIcon(source: string) {
  if (source === "Backend") return <Server size={11} className="text-violet-500" />;
  return <Monitor size={11} className="text-teal-500" />;
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
  const [logs, setLogs] = useState<ErrorLog[]>([]);
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

  const fetchLogs = useCallback(async () => {
    setLoading(true);
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
    } catch { setLogs([]); }
    finally { setLoading(false); }
  }, [page, pageSize, sourceFilter, levelFilter, search, startDate, endDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const hasFilter = !!(sourceFilter || levelFilter || search || startDate || endDate);

  const errorCount = logs.filter(l => l.level === "Error").length;
  const warnCount = logs.filter(l => l.level === "Warning").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Takip</h1>
          <p className="text-sm text-slate-500 mt-0.5">{totalCount} kayıt · sistem hata ve uyarı günlüğü</p>
        </div>
        <div className="flex items-center gap-3">
          {errorCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-xl">
              <AlertCircle size={13} /> {errorCount} hata
            </div>
          )}
          {warnCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-xl">
              <AlertTriangle size={13} /> {warnCount} uyarı
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
        <Filter size={14} className="text-slate-400" />

        <form onSubmit={e => { e.preventDefault(); setPage(1); setSearch(searchInput); }} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Mesaj veya path ara..."
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-52 text-slate-900 bg-white"
            />
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

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Yükleniyor...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Kayıt bulunamadı</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map(log => {
              const isExpanded = expanded === log.id;
              return (
                <div key={log.id} className="hover:bg-slate-50/70 transition">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : log.id)}
                    className="w-full text-left px-5 py-3.5 flex items-start gap-3"
                  >
                    <div className="mt-0.5 shrink-0">{levelIcon(log.level)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${levelBadge(log.level)}`}>
                          {log.level === "Error" ? "Hata" : log.level === "Warning" ? "Uyarı" : "Bilgi"}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${sourceBadge(log.source)}`}>
                          {sourceIcon(log.source)} {log.source}
                        </span>
                        {log.statusCode && (
                          <span className={`text-xs font-mono ${statusCodeColor(log.statusCode)}`}>
                            HTTP {log.statusCode}
                          </span>
                        )}
                        {log.path && (
                          <span className="text-xs text-slate-400 font-mono truncate max-w-[240px]">{log.path}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-800 font-medium truncate">{log.message}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Clock size={10} /> {formatDate(log.createdDate)}</span>
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
                      {log.stackTrace && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1.5">Stack Trace</p>
                          <pre className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
                            {log.stackTrace}
                          </pre>
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
                          <p className="text-xs text-slate-400 font-mono">{log.id}</p>
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
