"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import {
  MapPin, Search, RefreshCw, Globe, User, UserX, Monitor, Smartphone,
  Filter, Activity, AlertCircle, Link as LinkIcon, Download, Calendar,
  Users, X,
} from "lucide-react";
import Link from "next/link";

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
  if (ua.includes("Edg"))    return { label: "Edge",    isMobile: mobile };
  if (ua.includes("Chrome")) return { label: "Chrome",  isMobile: mobile };
  if (ua.includes("Firefox"))return { label: "Firefox", isMobile: mobile };
  if (ua.includes("Safari")) return { label: "Safari",  isMobile: mobile };
  return { label: ua.split(" ").slice(-1)[0], isMobile: mobile };
}

function toIsoDay(d: Date): string {
  return d.toISOString().split("T")[0];
}

function exportCsv(logs: VisitorLog[]) {
  const headers = ["Tarih", "Kullanıcı", "IP", "Ülke", "Şehir", "Sayfa", "Tarayıcı", "Referrer"];
  const rows = logs.map(l => [
    formatDate(l.createdDate),
    l.userFullName ?? "Misafir",
    l.ipAddress ?? "",
    l.country ?? "",
    l.city ?? "",
    l.page ?? "",
    browserLabel(l.userAgent).label,
    l.referrer ?? "",
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ziyaretciler-${toIsoDay(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ZiyaretcilerPage() {
  const { t } = useI18n();
  const [logs, setLogs]           = useState<VisitorLog[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(50);
  const [loading, setLoading]     = useState(false);
  const [ipFilter, setIpFilter]   = useState("");
  const [pageFilter, setPageFilter] = useState("");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [knownCountries, setKnownCountries] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (ipFilter)      params.set("ipAddress",  ipFilter);
      if (pageFilter)    params.set("pageFilter", pageFilter);
      if (countryFilter) params.set("country",    countryFilter);
      if (dateFrom) params.set("from", new Date(dateFrom).toISOString());
      if (dateTo)   {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        params.set("to", end.toISOString());
      }
      const data = await api.get<VisitorLogsResult>(`/api/admin/visitor-logs?${params}`);
      setLogs(data.items);
      setTotal(data.totalCount);
      // Accumulate unique countries for the dropdown (only when not filtering by country)
      if (!countryFilter) {
        const fresh = data.items.map(l => l.country).filter((c): c is string => !!c);
        if (fresh.length) {
          setKnownCountries(prev => {
            const combined = [...new Set([...prev, ...fresh])].sort();
            return combined;
          });
        }
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, pageSize, ipFilter, pageFilter, dateFrom, dateTo, countryFilter]);

  useEffect(() => {
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  function setPreset(preset: "today" | "yesterday" | "7d" | "month" | "all") {
    const now = new Date();
    const today = toIsoDay(now);
    if (preset === "today")     { setDateFrom(today); setDateTo(today); }
    if (preset === "yesterday") {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      const yd = toIsoDay(y); setDateFrom(yd); setDateTo(yd);
    }
    if (preset === "7d")  {
      const w = new Date(now); w.setDate(w.getDate() - 7);
      setDateFrom(toIsoDay(w)); setDateTo(today);
    }
    if (preset === "month") {
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      setDateFrom(toIsoDay(m)); setDateTo(today);
    }
    if (preset === "all")  { setDateFrom(""); setDateTo(""); }
    setPage(1);
  }

  const totalPages  = Math.max(1, Math.ceil(total / pageSize));
  const hasFilter   = !!(ipFilter || pageFilter || dateFrom || dateTo || countryFilter);

  /* Stats from current page */
  const pageStats = useMemo(() => {
    const uniqueIps    = new Set(logs.map(l => l.ipAddress).filter(Boolean)).size;
    const authUsers    = logs.filter(l => l.userId).length;
    const guests       = logs.filter(l => !l.userId).length;
    const pageCounts: Record<string, number> = {};
    logs.forEach(l => { if (l.page) pageCounts[l.page] = (pageCounts[l.page] ?? 0) + 1; });
    const topPage = Object.entries(pageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    return { uniqueIps, authUsers, guests, topPage };
  }, [logs]);

  const inp = "border border-slate-300 rounded-xl px-2 py-1.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400";

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="rounded-2xl overflow-hidden shadow-sm"
        style={{ background: "linear-gradient(135deg, #0f766e 0%, #0d9488 60%, #0891b2 100%)" }}>
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 shadow">
              <MapPin size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">{t("page./ziyaretciler", "Ziyaretçi Logları")}</h1>
              <p className="text-teal-100 text-xs mt-0.5">
                {t("ziyaretciler.subtitle", "Müşteri sitesine gelen trafik — sayfa ziyaretleri, konum, tarayıcı bilgisi")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5">
              <Globe size={13} className="text-teal-200" />
              <span className="text-white text-xs font-semibold">{total.toLocaleString("tr-TR")} {t("table.perPage", "kayıt")}</span>
            </div>
            <button onClick={() => exportCsv(logs)} disabled={logs.length === 0}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold px-3 py-2 rounded-xl transition disabled:opacity-40">
              <Download size={14} /> CSV
            </button>
            <button onClick={() => void load()}
              className="flex items-center gap-2 bg-white text-teal-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-teal-50 transition shadow">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {t("action.refresh", "Yenile")}
            </button>
          </div>
        </div>
      </div>

      {/* ── Ekran karşılaştırma ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-teal-50 border-2 border-teal-300 rounded-2xl p-4 flex items-start gap-3">
          <MapPin size={18} className="text-teal-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-teal-800 flex items-center gap-1.5">
              {t("ui.visitors", "Ziyaretçiler")}
              <span className="text-[10px] bg-teal-200 text-teal-700 px-1.5 py-0.5 rounded-full font-bold">{t("ui.thisScreen", "Bu ekran")}</span>
            </p>
            <p className="text-xs text-teal-600 mt-1 leading-relaxed">
              {t("ui.visitorsDesc", "Müşteri sitesine gelen tüm trafik: anonim ziyaretçiler dahil, coğrafi konum, tarayıcı, sayfa.")} <strong>{t("ui.visitorsQuestion", "Kim nereden geldi?")}</strong>
            </p>
          </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
          <Activity size={18} className="text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-indigo-800 flex items-center gap-1.5">
              {t("ui.movements", "Hareketler")}
              <Link href="/hareketler" className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold hover:bg-indigo-200 transition inline-flex items-center gap-0.5">
                <LinkIcon size={8} /> {t("ui.go", "Git")}
              </Link>
            </p>
            <p className="text-xs text-indigo-600 mt-1 leading-relaxed">
              {t("ui.auditDesc", "Kimliği doğrulanmış kullanıcıların işlem geçmişi.")} <strong>{t("ui.auditQuestion", "Kim ne yaptı?")}</strong>
            </p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800 flex items-center gap-1.5">
              {t("ui.tracking", "Takip")}
              <Link href="/takip" className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold hover:bg-red-200 transition inline-flex items-center gap-0.5">
                <LinkIcon size={8} /> {t("ui.go", "Git")}
              </Link>
            </p>
            <p className="text-xs text-red-600 mt-1 leading-relaxed">
              {t("ui.trackingDesc", "Backend ve frontend hataları.")} <strong>{t("ui.trackingQuestion", "Sistem ne zaman, nerede hata verdi?")}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats bar (current page) ── */}
      {!loading && logs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Bu Sayfada Tekil IP</p>
            <p className="text-2xl font-extrabold text-teal-700 mt-0.5">{pageStats.uniqueIps}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Users size={10} /> Üye</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-0.5">{pageStats.authUsers}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Misafir</p>
            <p className="text-2xl font-extrabold text-slate-500 mt-0.5">{pageStats.guests}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm overflow-hidden">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">En Çok Ziyaret</p>
            <p className="text-sm font-bold text-slate-700 mt-0.5 truncate" title={pageStats.topPage ?? "—"}>
              {pageStats.topPage ?? "—"}
            </p>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm space-y-3">

        {/* Quick date presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={13} className="text-slate-400 shrink-0" />
          {(["today", "yesterday", "7d", "month", "all"] as const).map(p => {
            const labels: Record<string, string> = {
              today: "Bugün", yesterday: "Dün", "7d": "Son 7 Gün", month: "Bu Ay", all: "Tümü",
            };
            const active =
              p === "today"     ? dateFrom === toIsoDay(new Date()) && dateTo === toIsoDay(new Date()) :
              p === "yesterday" ? (() => { const y = new Date(); y.setDate(y.getDate() - 1); const yd = toIsoDay(y); return dateFrom === yd && dateTo === yd; })() :
              p === "7d"        ? (() => { const w = new Date(); w.setDate(w.getDate() - 7); return dateFrom === toIsoDay(w) && dateTo === toIsoDay(new Date()); })() :
              p === "month"     ? (() => { const m = new Date(new Date().getFullYear(), new Date().getMonth(), 1); return dateFrom === toIsoDay(m) && dateTo === toIsoDay(new Date()); })() :
              /* all */           !dateFrom && !dateTo;
            return (
              <button key={p} onClick={() => setPreset(p)}
                className={`text-xs px-3 py-1 rounded-lg border font-medium transition ${
                  active
                    ? "bg-teal-600 border-teal-600 text-white"
                    : "border-slate-200 text-slate-600 hover:border-teal-400 hover:text-teal-700"
                }`}>
                {labels[p]}
              </button>
            );
          })}
        </div>

        {/* Filter inputs */}
        <div className="flex flex-wrap gap-3 items-center">
          <Filter size={14} className="text-slate-400 shrink-0" />

          <div className="relative flex-1 min-w-36">
            <Globe size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input type="text" placeholder={t("ziyaretciler.filterIp", "IP filtrele...")}
              value={ipFilter}
              onChange={e => { setIpFilter(e.target.value); setPage(1); }}
              className={`pl-8 pr-3 py-1.5 w-full text-sm ${inp}`} />
          </div>

          <div className="relative flex-1 min-w-36">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input type="text" placeholder={t("ziyaretciler.filterPage", "Sayfa filtrele...")}
              value={pageFilter}
              onChange={e => { setPageFilter(e.target.value); setPage(1); }}
              className={`pl-8 pr-3 py-1.5 w-full text-sm ${inp}`} />
          </div>

          {knownCountries.length > 0 && (
            <select value={countryFilter} onChange={e => { setCountryFilter(e.target.value); setPage(1); }}
              className={inp}>
              <option value="">Tüm Ülkeler</option>
              {knownCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          <div className="flex items-center gap-1.5">
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className={inp} />
            <span className="text-slate-400 text-xs">—</span>
            <input type="date" value={dateTo}   onChange={e => { setDateTo(e.target.value);   setPage(1); }} className={inp} />
          </div>

          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className={inp}>
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s} {t("table.perPage", "kayıt")}</option>)}
          </select>

          {hasFilter && (
            <button onClick={() => { setIpFilter(""); setPageFilter(""); setDateFrom(""); setDateTo(""); setCountryFilter(""); setPage(1); }}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <X size={12} /> {t("filter.clearFilters", "Temizle")}
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[
                  t("col.date", "Tarih"),
                  t("ziyaretciler.colVisitor", "Ziyaretçi"),
                  t("col.ip", "IP Adresi"),
                  t("ziyaretciler.colLocation", "Konum"),
                  t("ziyaretciler.colPage", "Sayfa"),
                  t("ziyaretciler.colDevice", "Cihaz / Tarayıcı"),
                  t("ziyaretciler.colReferrer", "Referrer"),
                  t("ziyaretciler.colCoord", "Koordinat"),
                ].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">{t("action.loading", "Yükleniyor...")}</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">{t("table.noData", "Kayıt bulunamadı")}</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition group">
                  <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(log.createdDate)}</td>
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
                        <span className="text-slate-400">{t("ziyaretciler.guest", "Misafir")}</span>
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
                    ) : <span className="text-slate-300">—</span>}
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
                    ) : <span className="text-slate-300">—</span>}
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
              {t("table.prev", "← Önceki")}
            </button>
          )}
          <span className="px-4 py-2 text-sm text-slate-500">{page} / {totalPages}</span>
          {page < totalPages && (
            <button onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">
              {t("table.next", "Sonraki →")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
