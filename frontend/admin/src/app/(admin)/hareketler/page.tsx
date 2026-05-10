"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { exportToExcel } from "@/lib/excel";
import type { AuditLog, PaginatedList } from "@/types";
import { Download, Filter, Search } from "lucide-react";

const ENTITY_OPTIONS = [
  "Tümü", "Kullanıcı", "Ürün", "Kategori", "Marka", "Stok",
  "Kupon", "Sipariş", "Yorum", "Kargo", "Ürün Görseli",
];

const ACTION_OPTIONS = [
  "Tümü", "Oluşturuldu", "Güncellendi", "Silindi",
];

const PAGE_SIZES = [20, 30, 50, 100];

function actionBadge(action: string) {
  if (action.includes("Oluşturuldu")) return "bg-green-100 text-green-700";
  if (action.includes("Silindi")) return "bg-red-100 text-red-700";
  if (action.includes("Güncellendi")) return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-600";
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function HareketlerPage() {
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
    } catch { setLogs([]); }
    finally { setLoading(false); }
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
        "İşlem": l.action,
        "Varlık": l.entityName,
        "ID": l.entityId ?? "",
        "IP": l.ipAddress ?? "",
      })),
      "hareketler",
      "Hareketler"
    );
  }

  const hasFilter = !!(entityFilter || actionFilter || userSearch || startDate || endDate);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hareketler</h1>
          <p className="text-sm text-slate-500 mt-0.5">{totalCount} kayıt</p>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow">
          <Download size={15} /> Excel'e Aktar
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
        <Filter size={14} className="text-slate-400" />

        <form onSubmit={e => { e.preventDefault(); setPage(1); setUserSearch(userSearchInput); }} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={userSearchInput}
              onChange={e => setUserSearchInput(e.target.value)}
              placeholder="E-posta ara..."
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-44 text-slate-900 bg-white"
            />
          </div>
          <button type="submit" className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition">Ara</button>
        </form>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Varlık:</label>
          <select
            value={entityFilter}
            onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-xl px-2 py-1.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="">Tümü</option>
            {ENTITY_OPTIONS.slice(1).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">İşlem:</label>
          <select
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
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
          <button onClick={() => {
            setEntityFilter(""); setActionFilter(""); setUserSearch(""); setUserSearchInput("");
            setStartDate(""); setEndDate(""); setPage(1);
          }}
            className="text-xs text-slate-500 hover:text-slate-700 underline">
            Filtreleri Temizle
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Tarih", "Kullanıcı", "İşlem", "Varlık", "ID", "IP"].map(h => (
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
                <tr key={l.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(l.createdDate)}</td>
                  <td className="px-5 py-3 text-xs text-slate-700">{l.userEmail}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${actionBadge(l.action)}`}>
                      {l.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs font-semibold text-slate-700">{l.entityName}</td>
                  <td className="px-5 py-3 text-xs text-slate-400 font-mono max-w-[120px] truncate">{l.entityId ?? "—"}</td>
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
    </div>
  );
}
