"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import {
  MapPin, Search, RefreshCw, Globe, User, UserX, Monitor, Smartphone,
  Filter, Activity, AlertCircle, Link as LinkIcon, Download, Calendar,
  Users, X, ArrowUpDown, ArrowUp, ArrowDown, Wifi,
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

type SortField = "createdDate" | "ipAddress" | "page" | "country" | "city" | "userFullName";
type SortDir = "asc" | "desc";

const PAGE_SIZES = [20, 50, 100];
const AUTO_REFRESH_MS = 240_000;

function formatDate(d: string) {
  return new Date(d).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function browserLabel(ua?: string): { label: string; isMobile: boolean } {
  if (!ua) return { label: "—", isMobile: false };
  const mobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  if (ua.includes("Edg"))     return { label: "Edge",    isMobile: mobile };
  if (ua.includes("Chrome"))  return { label: "Chrome",  isMobile: mobile };
  if (ua.includes("Firefox")) return { label: "Firefox", isMobile: mobile };
  if (ua.includes("Safari"))  return { label: "Safari",  isMobile: mobile };
  return { label: ua.split(" ").slice(-1)[0], isMobile: mobile };
}

function toIsoDay(d: Date): string {
  return d.toISOString().split("T")[0];
}

function exportCsv(logs: VisitorLog[]) {
  const headers = ["Tarih","Kullanıcı","IP","Ülke","Şehir","Sayfa","Tarayıcı","Referrer","Enlem","Boylam"];
  const rows = logs.map(l => [
    formatDate(l.createdDate),
    l.userFullName ?? "Misafir",
    l.ipAddress ?? "",
    l.country ?? "",
    l.city ?? "",
    l.page ?? "",
    browserLabel(l.userAgent).label,
    l.referrer ?? "",
    l.latitude?.toFixed(6) ?? "",
    l.longitude?.toFixed(6) ?? "",
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

function SortIcon({ field, sortBy, sortDir }: { field: SortField; sortBy: SortField; sortDir: SortDir }) {
  if (sortBy !== field) return <ArrowUpDown size={11} className="text-slate-300 ml-1 inline" />;
  return sortDir === "asc"
    ? <ArrowUp size={11} className="text-teal-500 ml-1 inline" />
    : <ArrowDown size={11} className="text-teal-500 ml-1 inline" />;
}

export default function ZiyaretcilerPage() {
  const { t } = useI18n();
  const [logs, setLogs]               = useState<VisitorLog[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState(50);
  const [loading, setLoading]         = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [countdown, setCountdown]     = useState(AUTO_REFRESH_MS / 1000);

  /* Filters */
  const [ipFilter, setIpFilter]           = useState("");
  const [pageFilter, setPageFilter]       = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [cityFilter, setCityFilter]       = useState("");
  const [userFilter, setUserFilter]       = useState("");
  const [referrerFilter, setReferrerFilter] = useState("");
  const [dateFrom, setDateFrom]           = useState("");
  const [dateTo, setDateTo]               = useState("");

  /* Sort */
  const [sortBy, setSortBy]   = useState<SortField>("createdDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  /* Known dropdown values */
  const [knownCountries, setKnownCountries] = useState<string[]>([]);
  const [knownCities, setKnownCities]       = useState<string[]>([]);

  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sortBy, sortDir });
      if (ipFilter)       params.set("ipAddress",    ipFilter);
      if (pageFilter)     params.set("pageFilter",   pageFilter);
      if (countryFilter)  params.set("country",      countryFilter);
      if (cityFilter)     params.set("city",         cityFilter);
      if (userFilter)     params.set("userFullName", userFilter);
      if (referrerFilter) params.set("referrer",     referrerFilter);
      if (dateFrom) params.set("from", new Date(dateFrom).toISOString());
      if (dateTo) {
        const end = new Date(dateTo); end.setHours(23, 59, 59, 999);
        params.set("to", end.toISOString());
      }
      const data = await api.get<VisitorLogsResult>(`/api/admin/visitor-logs?${params}`);
      setLogs(data.items);
      setTotal(data.totalCount);
      setLastRefresh(new Date());
      setCountdown(AUTO_REFRESH_MS / 1000);
      if (!countryFilter) {
        const fresh = data.items.map(l => l.country).filter((c): c is string => !!c);
        if (fresh.length) setKnownCountries(prev => [...new Set([...prev, ...fresh])].sort());
      }
      if (!cityFilter) {
        const fresh = data.items.map(l => l.city).filter((c): c is string => !!c);
        if (fresh.length) setKnownCities(prev => [...new Set([...prev, ...fresh])].sort());
      }
    } catch { /* ignore */ }
    finally { setLoading(false); loadingRef.current = false; }
  }, [page, pageSize, ipFilter, pageFilter, countryFilter, cityFilter, userFilter, referrerFilter, dateFrom, dateTo, sortBy, sortDir]);

  /* Initial + filter-change load */
  useEffect(() => {
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  /* Auto-refresh every 10 s */
  useEffect(() => {
    const interval = setInterval(() => { void load(); }, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  /* Countdown ticker */
  useEffect(() => {
    const tick = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(tick);
  }, [lastRefresh]);

  function toggleSort(field: SortField) {
    if (sortBy === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("desc"); }
    setPage(1);
  }

  function setPreset(preset: "today" | "yesterday" | "7d" | "month" | "all") {
    const now = new Date(); const today = toIsoDay(now);
    if (preset === "today")     { setDateFrom(today); setDateTo(today); }
    if (preset === "yesterday") { const y = new Date(now); y.setDate(y.getDate() - 1); const yd = toIsoDay(y); setDateFrom(yd); setDateTo(yd); }
    if (preset === "7d")  { const w = new Date(now); w.setDate(w.getDate() - 7); setDateFrom(toIsoDay(w)); setDateTo(today); }
    if (preset === "month") { setDateFrom(toIsoDay(new Date(now.getFullYear(), now.getMonth(), 1))); setDateTo(today); }
    if (preset === "all")   { setDateFrom(""); setDateTo(""); }
    setPage(1);
  }

  function clearFilters() {
    setIpFilter(""); setPageFilter(""); setCountryFilter(""); setCityFilter("");
    setUserFilter(""); setReferrerFilter(""); setDateFrom(""); setDateTo(""); setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilter  = !!(ipFilter || pageFilter || countryFilter || cityFilter || userFilter || referrerFilter || dateFrom || dateTo);

  const pageStats = useMemo(() => {
    const uniqueIps = new Set(logs.map(l => l.ipAddress).filter(Boolean)).size;
    const authUsers = logs.filter(l => l.userId).length;
    const guests    = logs.filter(l => !l.userId).length;
    const pageCounts: Record<string, number> = {};
    logs.forEach(l => { if (l.page) pageCounts[l.page] = (pageCounts[l.page] ?? 0) + 1; });
    const topPage = Object.entries(pageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    return { uniqueIps, authUsers, guests, topPage };
  }, [logs]);

  const inp = "border border-slate-300 rounded-xl px-2 py-1.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400";

  const SortTh = ({ field, label }: { field: SortField; label: string }) => (
    <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none hover:text-teal-600 whitespace-nowrap"
      onClick={() => toggleSort(field)}>
      {label}<SortIcon field={field} sortBy={sortBy} sortDir={sortDir} />
    </th>
  );

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="rounded-2xl overflow-hidden shadow-sm"
        style={{ background: "linear-gradient(135deg, #0f766e 0%, #0d9488 60%, #0891b2 100%)" }}>
        <div className="px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
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
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {/* Live indicator */}
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5">
              <Wifi size={12} className="text-green-300 animate-pulse" />
              <span className="text-white text-xs font-semibold">{countdown}s</span>
            </div>
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5">
              <Globe size={13} className="text-teal-200" />
              <span className="text-white text-xs font-semibold">{total.toLocaleString("tr-TR")} kayıt</span>
            </div>
            <button onClick={() => exportCsv(logs)} disabled={logs.length === 0}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold px-3 py-2 rounded-xl transition disabled:opacity-40">
              <Download size={14} /> CSV
            </button>
            <button onClick={() => { setPage(1); void load(); }}
              className="flex items-center gap-2 bg-white text-teal-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-teal-50 transition shadow">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {t("action.refresh", "Yenile")}
            </button>
          </div>
        </div>

        {/* Live refresh bar */}
        <div className="h-0.5 bg-white/10">
          <div className="h-full bg-white/40 transition-all duration-1000"
            style={{ width: `${(countdown / (AUTO_REFRESH_MS / 1000)) * 100}%` }} />
        </div>
      </div>

      {/* ── Info cards ── */}
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

      {/* ── Stats ── */}
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
            <p className="text-sm font-bold text-slate-700 mt-0.5 truncate" title={pageStats.topPage ?? "—"}>{pageStats.topPage ?? "—"}</p>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm space-y-3">

        {/* Date presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={13} className="text-slate-400 shrink-0" />
          {(["today","yesterday","7d","month","all"] as const).map(p => {
            const labels: Record<string,string> = { today:"Bugün", yesterday:"Dün", "7d":"Son 7 Gün", month:"Bu Ay", all:"Tümü" };
            const now = new Date(); const today = toIsoDay(now);
            const y = new Date(now); y.setDate(y.getDate()-1); const yd = toIsoDay(y);
            const w = new Date(now); w.setDate(w.getDate()-7);
            const m = new Date(now.getFullYear(), now.getMonth(), 1);
            const active =
              p==="today"     ? dateFrom===today && dateTo===today :
              p==="yesterday" ? dateFrom===yd && dateTo===yd :
              p==="7d"        ? dateFrom===toIsoDay(w) && dateTo===today :
              p==="month"     ? dateFrom===toIsoDay(m) && dateTo===today :
              !dateFrom && !dateTo;
            return (
              <button key={p} onClick={() => setPreset(p)}
                className={`text-xs px-3 py-1 rounded-lg border font-medium transition ${active ? "bg-teal-600 border-teal-600 text-white" : "border-slate-200 text-slate-600 hover:border-teal-400 hover:text-teal-700"}`}>
                {labels[p]}
              </button>
            );
          })}
          <div className="flex items-center gap-1.5 ml-auto">
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className={inp} />
            <span className="text-slate-400 text-xs">—</span>
            <input type="date" value={dateTo}   onChange={e => { setDateTo(e.target.value);   setPage(1); }} className={inp} />
          </div>
        </div>

        {/* Filter row 1: IP, Page, Country, City */}
        <div className="flex flex-wrap gap-3 items-center">
          <Filter size={14} className="text-slate-400 shrink-0" />

          <div className="relative flex-1 min-w-32">
            <Globe size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input type="text" placeholder="IP filtrele..." value={ipFilter}
              onChange={e => { setIpFilter(e.target.value); setPage(1); }}
              className={`pl-8 pr-3 py-1.5 w-full text-sm ${inp}`} />
          </div>

          <div className="relative flex-1 min-w-32">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input type="text" placeholder="Sayfa filtrele..." value={pageFilter}
              onChange={e => { setPageFilter(e.target.value); setPage(1); }}
              className={`pl-8 pr-3 py-1.5 w-full text-sm ${inp}`} />
          </div>

          {knownCountries.length > 0 ? (
            <select value={countryFilter} onChange={e => { setCountryFilter(e.target.value); setPage(1); }} className={inp}>
              <option value="">Tüm Ülkeler</option>
              {knownCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <input type="text" placeholder="Ülke..." value={countryFilter}
              onChange={e => { setCountryFilter(e.target.value); setPage(1); }}
              className={`px-3 py-1.5 text-sm min-w-28 ${inp}`} />
          )}

          {knownCities.length > 0 ? (
            <select value={cityFilter} onChange={e => { setCityFilter(e.target.value); setPage(1); }} className={inp}>
              <option value="">Tüm Şehirler</option>
              {knownCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <input type="text" placeholder="Şehir..." value={cityFilter}
              onChange={e => { setCityFilter(e.target.value); setPage(1); }}
              className={`px-3 py-1.5 text-sm min-w-28 ${inp}`} />
          )}
        </div>

        {/* Filter row 2: User, Referrer, page size, clear */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="w-[14px] shrink-0" />

          <div className="relative flex-1 min-w-40">
            <User size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input type="text" placeholder="Kullanıcı adı..." value={userFilter}
              onChange={e => { setUserFilter(e.target.value); setPage(1); }}
              className={`pl-8 pr-3 py-1.5 w-full text-sm ${inp}`} />
          </div>

          <div className="relative flex-1 min-w-40">
            <LinkIcon size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input type="text" placeholder="Referrer filtrele..." value={referrerFilter}
              onChange={e => { setReferrerFilter(e.target.value); setPage(1); }}
              className={`pl-8 pr-3 py-1.5 w-full text-sm ${inp}`} />
          </div>

          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className={inp}>
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s} kayıt</option>)}
          </select>

          {hasFilter && (
            <button onClick={clearFilters}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 border border-slate-200 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition">
              <X size={12} /> Filtreleri Temizle
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
                <SortTh field="createdDate"  label="Tarih" />
                <SortTh field="userFullName" label="Ziyaretçi" />
                <SortTh field="ipAddress"    label="IP Adresi" />
                <SortTh field="country"      label="Ülke" />
                <SortTh field="city"         label="Şehir" />
                <SortTh field="page"         label="Sayfa" />
                <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">Cihaz</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">Referrer</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">Koordinat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-slate-400">Yükleniyor...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-slate-400">Kayıt bulunamadı</td></tr>
              ) : logs.map(log => {
                const { label: browser, isMobile } = browserLabel(log.userAgent);
                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(log.createdDate)}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">
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
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-800 whitespace-nowrap">
                      <button onClick={() => { setIpFilter(log.ipAddress ?? ""); setPage(1); }}
                        className="inline-flex items-center gap-1 hover:text-teal-600 transition" title="Bu IP'yi filtrele">
                        <Globe size={11} className="text-slate-400" />
                        {log.ipAddress ?? "—"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {log.country ? (
                        <button onClick={() => { setCountryFilter(log.country!); setPage(1); }}
                          className="hover:text-teal-600 transition" title="Bu ülkeyi filtrele">
                          {log.country}
                        </button>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {log.city ? (
                        <button onClick={() => { setCityFilter(log.city!); setPage(1); }}
                          className="hover:text-teal-600 transition" title="Bu şehri filtrele">
                          {log.city}
                        </button>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 max-w-44 truncate" title={log.page ?? ""}>
                      {log.page ? (
                        <button onClick={() => { setPageFilter(log.page!); setPage(1); }}
                          className="hover:text-teal-600 transition text-left truncate max-w-full" title={`Bu sayfayı filtrele: ${log.page}`}>
                          {log.page}
                        </button>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        {isMobile
                          ? <Smartphone size={11} className="text-violet-400 shrink-0" />
                          : <Monitor size={11} className="text-slate-400 shrink-0" />}
                        {browser}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-36 truncate" title={log.referrer ?? ""}>
                      {log.referrer ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {log.latitude != null && log.longitude != null ? (
                        <a href={`https://maps.google.com/?q=${log.latitude},${log.longitude}`}
                          target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-800 transition">
                          <MapPin size={11} />
                          {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                        </a>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Paging ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-slate-500">
          Toplam <strong>{total.toLocaleString("tr-TR")}</strong> kayıt — Sayfa <strong>{page}</strong> / <strong>{totalPages}</strong>
          {lastRefresh && <span className="ml-2 text-slate-400">· Son yenileme: {formatDate(lastRefresh.toISOString())}</span>}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(1)} disabled={page === 1}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40">«</button>
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40">← Önceki</button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
            const p = start + i;
            return p <= totalPages ? (
              <button key={p} onClick={() => setPage(p)}
                className={`px-3 py-2 rounded-xl border text-sm transition ${p === page ? "bg-teal-600 border-teal-600 text-white font-bold" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
                {p}
              </button>
            ) : null;
          })}

          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40">Sonraki →</button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40">»</button>
        </div>
      </div>

    </div>
  );
}
