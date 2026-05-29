"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { exportToExcel } from "@/lib/excel";
import type { PaginatedList } from "@/types";
import {
  Download, Filter, Search, Activity, Users, Clock as ClockIcon,
  RefreshCw, AlertCircle, ShoppingCart, FileText, Zap,
} from "lucide-react";

interface AuditLog {
  id: string;
  userId?: string;
  userEmail: string;
  action: string;
  entityName: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  createdDate: string;
}

interface ActivityItem {
  type: string;
  action: string;
  detail: string | null;
  timestamp: string;
}

const ENTITY_OPTIONS = [
  "Tümü", "Kullanıcı", "Ürün", "Kategori", "Marka", "Stok",
  "Kupon", "Sipariş", "Yorum", "Kargo", "Ürün Görseli",
];

const ACTION_OPTIONS = [
  "Tümü", "Oluşturuldu", "Güncellendi", "Silindi",
  "Login", "LoginFailed", "Register", "CreateUser", "UpdateUser", "DeleteUser",
  "ActivateUser", "DeactivateUser", "VerifyEmail", "VerifyTelegram",
];

const PAGE_SIZES = [20, 30, 50, 100];

const ACTION_LABELS: Record<string, string> = {
  Login: "Giriş",
  LoginFailed: "Başarısız Giriş",
  Register: "Kayıt",
  CreateUser: "Kullanıcı Oluşturuldu",
  UpdateUser: "Kullanıcı Güncellendi",
  DeleteUser: "Kullanıcı Silindi",
  ActivateUser: "Kullanıcı Aktif Edildi",
  DeactivateUser: "Kullanıcı Pasif Edildi",
  VerifyEmail: "E-posta Doğrulandı",
  VerifyTelegram: "Telegram Doğrulandı",
};

function translateAction(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function actionBadge(action: string) {
  if (action === "LoginFailed") return "bg-red-100 text-red-700 font-semibold";
  if (action === "DeleteUser" || action.includes("Silindi")) return "bg-red-100 text-red-700";
  if (action === "CreateUser" || action === "Register" || action.includes("Oluşturuldu")) return "bg-green-100 text-green-700";
  if (action === "UpdateUser" || action.includes("Güncellendi")) return "bg-blue-100 text-blue-700";
  if (action === "Login") return "bg-violet-100 text-violet-700";
  if (action === "ActivateUser") return "bg-emerald-100 text-emerald-700";
  if (action === "DeactivateUser") return "bg-orange-100 text-orange-700";
  if (action === "VerifyEmail" || action === "VerifyTelegram") return "bg-sky-100 text-sky-700";
  return "bg-slate-100 text-slate-600";
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ─── Canlı Akış ──────────────────────────────────────────────────────── */
const ACTIVITY_TYPE_META: Record<string, { label: string; bg: string; text: string; dot: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  AuditLog:    { label: "Kullanıcı",  bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500",  icon: Users },
  ErrorLog:    { label: "Hata",        bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500",     icon: AlertCircle },
  OrderStatus: { label: "Sipariş",     bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500",    icon: ShoppingCart },
  Invoice:     { label: "Fatura",      bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", icon: FileText },
};

function CanlıAkis() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ items: ActivityItem[] }>("/api/admin/docs/activity?limit=100");
      setItems(data.items ?? []);
      setLastUpdated(new Date());
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch();
    const timer = setInterval(fetch, 10_000);
    return () => clearInterval(timer);
  }, [fetch]);

  const relTime = (ts: string) => {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s önce`;
    if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
    return new Date(ts).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  };

  const counts = Object.fromEntries(
    Object.keys(ACTIVITY_TYPE_META).map(k => [k, items.filter(i => i.type === k).length])
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(ACTIVITY_TYPE_META).map(([k, m]) => {
          const Icon = m.icon;
          return (
            <div key={k} className={`rounded-2xl border p-4 flex items-center gap-3 ${m.bg} border-transparent`}>
              <Icon size={18} className={m.text} />
              <div>
                <p className={`text-xs font-semibold ${m.text}`}>{m.label}</p>
                <p className={`text-xl font-bold ${m.text}`}>{counts[k] ?? 0}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-sm font-bold text-slate-800 flex-1">Canlı Sistem Aktivitesi</span>
          {lastUpdated && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <ClockIcon size={10} /> Son: {lastUpdated.toLocaleTimeString("tr-TR")} — 10s'de bir otomatik yenilenir
            </span>
          )}
          <button onClick={fetch}
            className={`p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition ${loading ? "animate-spin" : ""}`}>
            <RefreshCw size={13} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="px-5 py-12 text-center text-xs text-slate-400">
            {loading ? "Yükleniyor…" : "Henüz aktivite yok"}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {items.map((item, i) => {
              const meta = ACTIVITY_TYPE_META[item.type] ?? ACTIVITY_TYPE_META["AuditLog"];
              const Icon = meta.icon;
              return (
                <div key={i} className="flex items-start gap-3 px-5 py-2.5 hover:bg-slate-50/60 transition">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${meta.bg}`}>
                    <Icon size={13} className={meta.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
                        {meta.label}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">{item.action}</span>
                    </div>
                    {item.detail && (
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{item.detail}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap mt-0.5">
                    {relTime(item.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */
type HareketTab = "audit" | "canli";

export default function HareketlerPage() {
  const [activeTab, setActiveTab] = useState<HareketTab>("audit");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userSearchInput, setUserSearchInput] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (entityFilter) qs.set("entityName", entityFilter);
      if (actionFilter) qs.set("action", actionFilter);
      if (userSearch) qs.set("userEmail", userSearch);
      if (startDate) qs.set("startDate", new Date(startDate).toISOString());
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        qs.set("endDate", end.toISOString());
      }
      const data = await api.get<PaginatedList<AuditLog>>(`/api/admin/audit-logs?${qs}`);
      setLogs(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch { setLogs([]); } finally { setLoading(false); }
  }, [page, pageSize, entityFilter, actionFilter, userSearch, startDate, endDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  async function handleExport() {
    const qs = new URLSearchParams({ page: "1", pageSize: "5000" });
    if (entityFilter) qs.set("entityName", entityFilter);
    if (actionFilter) qs.set("action", actionFilter);
    if (userSearch) qs.set("userEmail", userSearch);
    if (startDate) qs.set("startDate", new Date(startDate).toISOString());
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      qs.set("endDate", end.toISOString());
    }
    const data = await api.get<PaginatedList<AuditLog>>(`/api/admin/audit-logs?${qs}`);
    exportToExcel(
      data.items.map(l => ({
        "Tarih": formatDate(l.createdDate),
        "Kullanıcı": l.userEmail,
        "İşlem": translateAction(l.action),
        "Varlık": l.entityName,
        "ID": l.entityId ?? "",
        "IP": l.ipAddress ?? "",
      })),
      "hareketler", "Hareketler"
    );
  }

  const hasFilter = !!(entityFilter || actionFilter || userSearch || startDate || endDate);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl overflow-hidden shadow-sm"
        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #6d28d9 100%)" }}>
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 shadow">
              <Activity size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">Hareketler</h1>
              <p className="text-indigo-200 text-xs mt-0.5">Kullanıcı işlem geçmişi ve canlı sistem aktivitesi</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5">
              <Users size={13} className="text-indigo-200" />
              <span className="text-white text-xs font-semibold">{totalCount} audit kaydı</span>
            </div>
            <button onClick={handleExport}
              className="flex items-center gap-2 bg-white text-indigo-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-indigo-50 transition shadow">
              <Download size={14} /> Excel
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5">
        {[
          { id: "audit" as HareketTab, label: "Audit Log", icon: Users },
          { id: "canli" as HareketTab, label: "Canlı Akış", icon: Zap },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition ${
              activeTab === t.id
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
            }`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Audit Log ── */}
      {activeTab === "audit" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
              <Activity size={18} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-indigo-800">Hareketler (bu sekme)</p>
                <p className="text-xs text-indigo-600 mt-0.5 leading-relaxed">
                  Kimliği doğrulanmış kullanıcıların sistem işlemleri: giriş/çıkış, kayıt oluşturma/güncelleme/silme, admin eylemleri.
                </p>
              </div>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-start gap-3">
              <Users size={18} className="text-teal-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-teal-800">Ziyaretçiler (ayrı ekran)</p>
                <p className="text-xs text-teal-600 mt-0.5 leading-relaxed">
                  Müşteri sitesine gelen tüm trafik: anonim dahil, coğrafi konum, tarayıcı, hangi sayfa ziyaret edildi.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
            <Filter size={14} className="text-slate-400" />
            <form onSubmit={e => { e.preventDefault(); setPage(1); setUserSearch(userSearchInput); }} className="flex gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input value={userSearchInput} onChange={e => setUserSearchInput(e.target.value)}
                  placeholder="E-posta ara..."
                  className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-44 text-slate-900 bg-white" />
              </div>
              <button type="submit" className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition">Ara</button>
            </form>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">Varlık:</label>
              <select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
                className="border border-slate-300 rounded-xl px-2 py-1.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="">Tümü</option>
                {ENTITY_OPTIONS.slice(1).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">İşlem:</label>
              <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                className="border border-slate-300 rounded-xl px-2 py-1.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="">Tümü</option>
                {ACTION_OPTIONS.slice(1).map(o => <option key={o} value={o}>{o}</option>)}
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
              <button onClick={() => { setEntityFilter(""); setActionFilter(""); setUserSearch(""); setUserSearchInput(""); setStartDate(""); setEndDate(""); setPage(1); }}
                className="text-xs text-slate-500 hover:text-slate-700 underline">Filtreleri Temizle</button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Tarih", "Kullanıcı", "İşlem", "Varlık", "Detay", "IP"].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">Yükleniyor...</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">Kayıt bulunamadı</td></tr>
                  ) : logs.map(l => (
                    <tr key={l.id} className={`transition ${l.action === "LoginFailed" ? "bg-red-50 hover:bg-red-100" : "hover:bg-slate-50"}`}>
                      <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(l.createdDate)}</td>
                      <td className="px-5 py-3 text-xs text-slate-700">{l.userEmail}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${actionBadge(l.action)}`}>
                          {translateAction(l.action)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-slate-700">{l.entityName}</td>
                      <td className="px-5 py-3 text-xs text-slate-600 max-w-[220px]">
                        {l.newValue
                          ? <span title={l.newValue} className="truncate block">{l.newValue}</span>
                          : l.oldValue
                          ? <span title={l.oldValue} className="truncate block text-slate-400 line-through">{l.oldValue}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">{l.ipAddress ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {page > 1 && <button onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">← Önceki</button>}
              <span className="px-4 py-2 text-sm text-slate-500">{page} / {totalPages}</span>
              {page < totalPages && <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">Sonraki →</button>}
            </div>
          )}
        </>
      )}

      {/* ── Canlı Akış ── */}
      {activeTab === "canli" && <CanlıAkis />}
    </div>
  );
}
