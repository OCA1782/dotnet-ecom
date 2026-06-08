"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import type { Coupon, PaginatedList } from "@/types";
import { COUPON_TYPE_LABEL } from "@/types";
import { exportToExcel } from "@/lib/excel";
import { Download, Plus, Pencil, Trash2, Search, X, History, Clock, Tag, ShoppingCart, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import { PreviewPanel, PreviewToggleButton } from "@/components/previews/PreviewPanel";
import CouponPreview from "@/components/previews/CouponPreview";
import RichTextEditor from "@/components/RichTextEditor";
import { formatDate, formatPrice } from "@/lib/utils";

type FormState = {
  code: string;
  description: string;
  type: number;
  value: string;
  minOrderAmount: string;
  maxUsageCount: string;
  maxUsagePerUser: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

interface CouponUsage {
  id: string;
  couponId: string;
  couponCode: string;
  orderId: string;
  orderNumber: string;
  grandTotal: number;
  userEmail: string | null;
  discountApplied: number;
  createdDate: string;
}

interface AuditLog {
  id: string;
  userEmail: string;
  action: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  createdDate: string;
}

const COUPON_ACTION_COLORS: Record<string, string> = {
  KuponOluşturuldu: "bg-green-100 text-green-700",
  KuponGüncellendi: "bg-blue-100 text-blue-700",
  KuponSilindi: "bg-red-100 text-red-700",
  "Oluşturuldu — Kupon": "bg-green-100 text-green-700",
  "Güncellendi — Kupon": "bg-blue-100 text-blue-700",
  "Silindi — Kupon": "bg-red-100 text-red-700",
};

const empty: FormState = {
  code: "",
  description: "",
  type: 1,
  value: "",
  minOrderAmount: "0",
  maxUsageCount: "",
  maxUsagePerUser: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400";

type SortField = "createdDate" | "dataSource";
function buildSortKey(field: SortField, dir: "asc" | "desc") { return `${field}-${dir}`; }

function toISOLocal(dt: string) {
  if (!dt) return undefined;
  return new Date(dt).toISOString();
}

export default function KuponlarPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"kuponlar" | "hareketler">("kuponlar");

  // --- Coupon list ---
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [pageSize, setPageSize] = useState(20);
  const PAGE_SIZES = [20, 50, 100];
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronsUpDown size={12} className="opacity-30 ml-1 inline-block" />;
    return sortDir === "asc" ? <ChevronUp size={12} className="text-teal-600 ml-1 inline-block" /> : <ChevronDown size={12} className="text-teal-600 ml-1 inline-block" />;
  }

  // --- Global usages tab ---
  const [usages, setUsages] = useState<CouponUsage[]>([]);
  const [usagesTotalCount, setUsagesTotalCount] = useState(0);
  const [usagesPage, setUsagesPage] = useState(1);
  const [usagesLoading, setUsagesLoading] = useState(false);

  // --- Per-row coupon history ---
  const [historyTarget, setHistoryTarget] = useState<{ id: string; code: string } | null>(null);
  const [historyLogs, setHistoryLogs] = useState<AuditLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize), includeInactive: String(includeInactive) });
      if (search) qs.set("search", search);
      if (typeFilter) qs.set("type", typeFilter);
      if (sortField) qs.set("sortBy", buildSortKey(sortField, sortDir));
      const data = await api.get<PaginatedList<Coupon>>(`/api/admin/coupons?${qs}`);
      setCoupons(data.items);
      setTotal(data.totalCount);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, includeInactive, search, typeFilter, sortField, sortDir]);

  const loadAllUsages = useCallback(async () => {
    setUsagesLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(usagesPage), pageSize: "30" });
      const data = await api.get<PaginatedList<CouponUsage>>(`/api/admin/coupons/usages?${qs}`);
      setUsages(data.items);
      setUsagesTotalCount(data.totalCount);
    } catch { setUsages([]); }
    finally { setUsagesLoading(false); }
  }, [usagesPage]);

  const loadCouponHistory = useCallback(async (couponId: string) => {
    setHistoryLoading(true);
    setHistoryLogs([]);
    try {
      const data = await api.get<{ items: AuditLog[]; totalCount: number }>(`/api/admin/audit-logs/entity/Kupon/${couponId}`);
      setHistoryLogs(data.items);
    } catch { setHistoryLogs([]); }
    finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (activeTab === "hareketler") loadAllUsages(); }, [activeTab, loadAllUsages]);

  function openCreate() {
    setEditId(null);
    setForm(empty);
    setError(null);
    setShowForm(true);
  }

  function openEdit(c: Coupon) {
    setEditId(c.id);
    setForm({
      code: c.code,
      description: c.description ?? "",
      type: c.type,
      value: String(c.value),
      minOrderAmount: String(c.minOrderAmount),
      maxUsageCount: c.maxUsageCount != null ? String(c.maxUsageCount) : "",
      maxUsagePerUser: c.maxUsagePerUser != null ? String(c.maxUsagePerUser) : "",
      startDate: c.startDate ? c.startDate.slice(0, 16) : "",
      endDate: c.endDate ? c.endDate.slice(0, 16) : "",
      isActive: c.isActive,
    });
    setError(null);
    setShowForm(true);
  }

  function openHistory(c: Coupon) {
    setHistoryTarget({ id: c.id, code: c.code });
    loadCouponHistory(c.id);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description || undefined,
        type: form.type,
        value: parseFloat(form.value),
        minOrderAmount: parseFloat(form.minOrderAmount || "0"),
        maxUsageCount: form.maxUsageCount ? parseInt(form.maxUsageCount) : undefined,
        maxUsagePerUser: form.maxUsagePerUser ? parseInt(form.maxUsagePerUser) : undefined,
        startDate: toISOLocal(form.startDate),
        endDate: toISOLocal(form.endDate),
        isActive: form.isActive,
      };
      if (editId) {
        await api.put(`/api/admin/coupons/${editId}`, payload);
      } else {
        await api.post("/api/admin/coupons", payload);
      }
      setShowForm(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/api/admin/coupons/${id}`);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Silinemedi.");
    }
  }

  const totalPages = Math.ceil(total / pageSize);
  const usagesTotalPages = Math.ceil(usagesTotalCount / 30);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("nav./kuponlar", "Kuponlar")}</h1>
          {!loading && <p className="text-slate-500 text-sm mt-0.5">{total} kupon</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              coupons.map(c => ({
                "Kod": c.code, "Tip": COUPON_TYPE_LABEL[c.type], "Değer": c.value,
                "Min Tutar": c.minOrderAmount, "Kullanım": c.usageCount,
                "Durum": c.isActive ? "Aktif" : "Pasif",
              })),
              "kuponlar", "Kuponlar"
            )}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition"
          >
            <Download size={14} /> Excel&apos;e Aktar
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#12304A] hover:bg-[#0d2438] text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow">
            <Plus size={16} /> Yeni Kupon
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(["kuponlar", "hareketler"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-semibold transition rounded-t-xl ${
              activeTab === tab
                ? "bg-white border border-b-white border-slate-200 -mb-px text-teal-700"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}>
            {tab === "kuponlar" ? <span className="flex items-center gap-2"><Tag size={14} />Kuponlar</span>
              : <span className="flex items-center gap-2"><ShoppingCart size={14} />Tüm Hareketler</span>}
          </button>
        ))}
      </div>

      {/* ===== KUPONLAR TAB ===== */}
      {activeTab === "kuponlar" && (
        <>
          <div className="flex flex-wrap gap-3 items-center">
            <form onSubmit={e => { e.preventDefault(); setPage(1); setSearch(searchInput); }} className="flex gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Kod veya açıklama..."
                  className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-52 text-slate-900 bg-white"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition">Ara</button>
              {(search || searchInput) && (
                <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
                  className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">Temizle</button>
              )}
            </form>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">Tüm Türler</option>
              <option value="1">Sabit Tutar</option>
              <option value="2">Yüzde</option>
              <option value="3">Ücretsiz Kargo</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={includeInactive} onChange={e => { setIncludeInactive(e.target.checked); setPage(1); }} className="rounded" />
              Pasif göster
            </label>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s} kayıt</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {loading ? (
              <p className="p-8 text-center text-slate-400">Yükleniyor...</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Kod</th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Tür</th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Değer</th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Min. Sipariş</th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Kullanım</th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Bitiş</th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Durum</th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs"><button onClick={() => handleSort("createdDate")} className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">Oluşturulma Tarihi <SortIcon field="createdDate" /></button></th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs"><button onClick={() => handleSort("dataSource")} className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">Kaynak <SortIcon field="dataSource" /></button></th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Oluşturan</th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.length === 0 ? (
                    <tr><td colSpan={11} className="px-5 py-10 text-center text-slate-400">Kupon bulunamadı</td></tr>
                  ) : coupons.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono font-semibold text-slate-800 text-xs">{c.code}</td>
                      <td className="px-5 py-3 text-slate-600 text-xs">{COUPON_TYPE_LABEL[c.type]}</td>
                      <td className="px-5 py-3 text-slate-600 text-xs">
                        {c.type === 2 ? `%${c.value}` : c.type === 3 ? "—" : `${c.value.toFixed(2)} ₺`}
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs">{c.minOrderAmount > 0 ? `${c.minOrderAmount} ₺` : "—"}</td>
                      <td className="px-5 py-3 text-slate-600 text-xs">
                        {c.usageCount}{c.maxUsageCount != null ? ` / ${c.maxUsageCount}` : ""}
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs">
                        {c.endDate ? new Date(c.endDate).toLocaleDateString("tr-TR") : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          c.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {c.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {c.createdDate ? new Date(c.createdDate).toLocaleDateString("tr-TR") : "—"}
                      </td>
                      <td className="px-5 py-3">
                        {c.dataSource ? <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 whitespace-nowrap">{c.dataSource}</span> : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400 max-w-[140px] truncate" title={c.createdByAdminEmail}>{c.createdByAdminEmail ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => openHistory(c)} title="Geçmiş"
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white shadow-sm transition-all duration-150 active:scale-95">
                            <History size={16} />
                          </button>
                          <button onClick={() => openEdit(c)} title="Düzenle"
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white shadow-sm transition-all duration-150 active:scale-95">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => setConfirmDelete(c.id)} title="Sil"
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white shadow-sm transition-all duration-150 active:scale-95">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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

      {/* ===== HAREKETLER TAB ===== */}
      {activeTab === "hareketler" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{usagesTotalCount} toplam kupon kullanımı</p>
            <button onClick={loadAllUsages} className="text-xs text-teal-600 hover:underline">Yenile</button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {usagesLoading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-7 h-7 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              </div>
            ) : usages.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingCart size={32} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-400 text-sm">Henüz kupon kullanımı yok.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {["Kupon Kodu", "Sipariş No", "Kullanıcı", "Sipariş Tutarı", "İndirim", "Tarih"].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usages.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-mono font-bold text-teal-700 text-xs">{u.couponCode}</td>
                          <td className="px-5 py-3 font-mono text-xs text-slate-700">{u.orderNumber}</td>
                          <td className="px-5 py-3 text-xs text-slate-500">{u.userEmail ?? "—"}</td>
                          <td className="px-5 py-3 text-xs text-slate-600">{formatPrice(u.grandTotal)}</td>
                          <td className="px-5 py-3">
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              -{formatPrice(u.discountApplied)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-400 flex items-center gap-1">
                            <Clock size={11} />{formatDate(u.createdDate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {usagesTotalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400">{usagesTotalCount} kayıt</span>
                    <div className="flex gap-2">
                      <button disabled={usagesPage === 1} onClick={() => setUsagesPage(p => p - 1)}
                        className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition">← Önceki</button>
                      <span className="px-3 py-1.5 text-xs text-slate-500">{usagesPage} / {usagesTotalPages}</span>
                      <button disabled={usagesPage >= usagesTotalPages} onClick={() => setUsagesPage(p => p + 1)}
                        className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition">Sonraki →</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Per-row coupon history modal */}
      {historyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                  <History size={17} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-sm">Kupon Geçmişi</h2>
                  <p className="text-xs text-slate-500 font-mono">{historyTarget.code}</p>
                </div>
              </div>
              <button onClick={() => setHistoryTarget(null)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              {historyLoading ? (
                <div className="py-10 text-center text-slate-400">
                  <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                </div>
              ) : historyLogs.length === 0 ? (
                <p className="p-8 text-center text-slate-400">Bu kupona ait hareket kaydı bulunamadı.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      {["Tarih", "İşlemi Yapan", "Aksiyon", "Detay"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyLogs.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {new Date(l.createdDate).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="px-4 py-3 text-slate-700 text-xs">{l.userEmail}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${COUPON_ACTION_COLORS[l.action] ?? "bg-slate-100 text-slate-600"}`}>
                            {l.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {l.newValue
                            ? l.newValue.split(" | ").map((part, i) => (
                                <div key={i} className="text-xs text-slate-600">{part}</div>
                              ))
                            : l.oldValue
                            ? <span className="text-xs text-slate-400">{l.oldValue}</span>
                            : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex justify-end">
              <button onClick={() => setHistoryTarget(null)} className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50">Kapat</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Kuponu Sil"
          message="Bu kuponu kalıcı olarak silmek istediğinizden emin misiniz?"
          confirmLabel="Sil"
          danger
          onConfirm={() => { handleDelete(confirmDelete); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col transition-all duration-200 ${showPreview ? "max-w-4xl" : "max-w-2xl"}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <h2 className="font-bold text-slate-800">{editId ? "Kuponu Düzenle" : "Yeni Kupon"}</h2>
              <div className="flex items-center gap-2">
                <PreviewToggleButton open={showPreview} onToggle={() => setShowPreview(p => !p)} />
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
              </div>
            </div>
            <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

              {!editId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kupon Kodu *</label>
                  <input
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className={INPUT + " font-mono uppercase"}
                    placeholder="YAZI2024"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Açıklama</label>
                <RichTextEditor
                  value={form.description}
                  onChange={v => setForm(f => ({ ...f, description: v }))}
                  placeholder="Kupon açıklaması / kullanım koşulları (isteğe bağlı)..."
                />
              </div>

              {!editId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kupon Türü *</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: parseInt(e.target.value) }))} className={INPUT}>
                    <option value={1}>Sabit Tutar (₺)</option>
                    <option value={2}>Yüzde (%)</option>
                    <option value={3}>Ücretsiz Kargo</option>
                  </select>
                </div>
              )}

              {form.type !== 3 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    İndirim Değeri {form.type === 2 ? "(%)" : "(₺)"} *
                  </label>
                  <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                    className={INPUT} min="0" max={form.type === 2 ? 100 : undefined}
                    placeholder={form.type === 2 ? "10" : "50.00"} />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Min. Sipariş Tutarı (₺)</label>
                <input type="number" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                  className={INPUT} min="0" placeholder="0" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Maks. Toplam Kullanım</label>
                  <input type="number" value={form.maxUsageCount} onChange={e => setForm(f => ({ ...f, maxUsageCount: e.target.value }))}
                    className={INPUT} min="1" placeholder="Sınırsız" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kullanıcı Başı Limit</label>
                  <input type="number" value={form.maxUsagePerUser} onChange={e => setForm(f => ({ ...f, maxUsagePerUser: e.target.value }))}
                    className={INPUT} min="1" placeholder="Sınırsız" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Başlangıç Tarihi</label>
                  <input type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={INPUT} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Bitiş Tarihi</label>
                  <input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={INPUT} />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                <span className="text-sm text-slate-700">Aktif</span>
              </label>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50">Vazgeç</button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
                  {saving ? "Kaydediliyor..." : editId ? "Güncelle" : "Oluştur"}
                </button>
              </div>
            </div>

            <PreviewPanel open={showPreview}>
              <CouponPreview form={form} />
            </PreviewPanel>

            </div>{/* /flex */}
          </div>
        </div>
      )}
    </div>
  );
}
