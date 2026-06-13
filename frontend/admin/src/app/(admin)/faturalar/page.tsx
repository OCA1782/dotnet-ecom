"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import { exportToExcel } from "@/lib/excel";
import {
  FileText, Plus, RefreshCw, Search, Eye, CheckCircle, XCircle,
  Clock, AlertCircle, Send, ChevronDown, Database,
  ChevronsUpDown, ChevronUp, CheckSquare, Square, Loader2, Download,
} from "lucide-react";

interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string | null;
  docType: number;    // 1=eArchive 2=eInvoice 3=eDispatch
  status: number;     // 1=Draft 2=Pending 3=Sent 4=Cancelled 5=Error
  totalAmount: number;
  createdDate: string;
  sentDate: string | null;
  providerInvoiceId: string | null;
  errorMessage: string | null;
  dataSource?: string;
}

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  customerEmail: string | null;
  docType: number;
  status: number;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  billingAddressSnapshot: string | null;
  providerInvoiceId: string | null;
  providerResponse: string | null;
  sentDate: string | null;
  notes: string | null;
  errorMessage: string | null;
  createdDate: string;
  items: {
    id: string; productName: string; sku: string | null; variantName: string | null;
    quantity: number; unitPrice: number; taxRate: number; taxAmount: number; lineTotal: number;
  }[];
}

interface PagedResult {
  items: InvoiceListItem[];
  total: number;
  page: number;
  pageSize: number;
}

const DOC_TYPE: Record<number, { label: string; color: string }> = {
  1: { label: "e-Arşiv", color: "bg-teal-100 text-teal-700" },
  2: { label: "e-Fatura", color: "bg-violet-100 text-violet-700" },
  3: { label: "e-İrsaliye", color: "bg-blue-100 text-blue-700" },
};

const STATUS_MAP: Record<number, { label: string; color: string; icon: React.ComponentType<{size?:number;className?:string}> }> = {
  1: { label: "Taslak",  color: "bg-slate-100 text-slate-600",   icon: Clock },
  2: { label: "Bekliyor",color: "bg-amber-100 text-amber-700",   icon: Clock },
  3: { label: "Gönderildi",color:"bg-emerald-100 text-emerald-700", icon: CheckCircle },
  4: { label: "İptal",   color: "bg-red-100 text-red-700",       icon: XCircle },
  5: { label: "Hata",    color: "bg-red-100 text-red-700",       icon: AlertCircle },
};

type SortField = "total" | "createdDate" | "dataSource";
type SortDir = "asc" | "desc";
function buildSortKey(f: SortField, d: SortDir) { return `${f}-${d}`; }

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField | null; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronsUpDown size={12} className="opacity-40" />;
  return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
}

function fmt(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const PAGE_SIZES = [20, 50, 100] as const;

export default function FaturalarPage() {
  const { t } = useI18n();
  const [seeding, setSeeding] = useState(false);

  async function handleSeedInvoices() {
    setSeeding(true);
    try {
      await api.post("/api/admin/seed/invoices", {});
      await load();
    } catch { /* ignore */ }
    finally { setSeeding(false); }
  }

  const [data, setData] = useState<PagedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZES[number]>(20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | "">("");
  const [docTypeFilter, setDocTypeFilter] = useState<number | "">("");

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  }

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [createModal, setCreateModal] = useState(false);
  const [createOrderNumber, setCreateOrderNumber] = useState("");
  const [createDocType, setCreateDocType] = useState(1);
  const [createNotes, setCreateNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [detailModal, setDetailModal] = useState<InvoiceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), pageSize: String(pageSize),
        ...(search && { search }),
        ...(statusFilter !== "" && { status: String(statusFilter) }),
        ...(docTypeFilter !== "" && { docType: String(docTypeFilter) }),
        ...(sortField && { sortBy: buildSortKey(sortField, sortDir) }),
      });
      const result = await api.get<PagedResult>(`/api/admin/invoices?${params}`);
      setData(result);
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, [page, pageSize, search, statusFilter, docTypeFilter, sortField, sortDir]);

  useEffect(() => {
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  // Reset page on filter/sort/pageSize change
  useEffect(() => {
    const id = window.setTimeout(() => setPage(1), 0);
    return () => window.clearTimeout(id);
  }, [search, statusFilter, docTypeFilter, sortField, sortDir, pageSize]);

  // Clear selection on page change
  useEffect(() => {
    const id = window.setTimeout(() => setSelectedIds(new Set()), 0);
    return () => window.clearTimeout(id);
  }, [page]);

  const allPageIds = data?.items.map(i => i.id) ?? [];
  const allSelected = allPageIds.length > 0 && allPageIds.every(id => selectedIds.has(id));
  const someSelected = allPageIds.some(id => selectedIds.has(id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allPageIds));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleBulkMarkSent() {
    const ids = [...selectedIds].filter(id => {
      const inv = data?.items.find(i => i.id === id);
      return inv && inv.status !== 3 && inv.status !== 4;
    });
    if (ids.length === 0) { setMsg({ text: "Seçili faturalar zaten gönderildi veya iptal edildi.", ok: false }); return; }
    setBulkLoading(true);
    const results = await Promise.allSettled(ids.map(id => api.patch(`/api/admin/invoices/${id}/status`, { status: 3 })));
    const ok = results.filter(r => r.status === "fulfilled").length;
    const fail = results.length - ok;
    setSelectedIds(new Set());
    setMsg({ text: `${ok} fatura gönderildi işaretlendi${fail > 0 ? `, ${fail} başarısız` : ""}.`, ok: fail === 0 });
    setBulkLoading(false);
    void load();
  }

  async function handleBulkCancel() {
    const ids = [...selectedIds].filter(id => {
      const inv = data?.items.find(i => i.id === id);
      return inv && inv.status !== 4;
    });
    if (ids.length === 0) { setMsg({ text: "Seçili faturalar zaten iptal edildi.", ok: false }); return; }
    setBulkLoading(true);
    const results = await Promise.allSettled(ids.map(id => api.patch(`/api/admin/invoices/${id}/status`, { status: 4 })));
    const ok = results.filter(r => r.status === "fulfilled").length;
    const fail = results.length - ok;
    setSelectedIds(new Set());
    setMsg({ text: `${ok} fatura iptal edildi${fail > 0 ? `, ${fail} başarısız` : ""}.`, ok: fail === 0 });
    setBulkLoading(false);
    void load();
  }

  function handleExport() {
    const items = data?.items ?? [];
    exportToExcel(
      items.map(inv => ({
        "Fatura No": inv.invoiceNumber,
        "Sipariş": inv.orderNumber,
        "Müşteri": inv.customerEmail ?? "",
        "Tür": DOC_TYPE[inv.docType]?.label ?? "",
        "Durum": STATUS_MAP[inv.status]?.label ?? "",
        "Tutar": inv.totalAmount,
        "Tarih": fmtDate(inv.createdDate),
        "Kaynak": inv.dataSource ?? "",
      })),
      "faturalar", "Faturalar"
    );
  }

  async function openDetail(id: string) {
    setLoadingDetail(true);
    try {
      const d = await api.get<InvoiceDetail>(`/api/admin/invoices/${id}`);
      setDetailModal(d);
    } catch { /* empty */ }
    finally { setLoadingDetail(false); }
  }

  async function handleCreate() {
    if (!createOrderNumber.trim()) { setCreateError(t("ui.orderNumberRequired", "Sipariş numarası zorunludur.")); return; }
    setCreating(true);
    setCreateError("");
    try {
      await api.post("/api/admin/invoices", { orderNumber: createOrderNumber, docType: createDocType, notes: createNotes || null });
      setCreateModal(false);
      setCreateOrderNumber("");
      setCreateDocType(1);
      setCreateNotes("");
      await load();
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : t("ui.invoiceCreateFailed", "Fatura oluşturulamadı."));
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusUpdate(id: string, status: number) {
    try {
      await api.patch(`/api/admin/invoices/${id}/status`, { status });
      await load();
      if (detailModal?.id === id) {
        await openDetail(id);
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : t("msg.error", "Bir hata oluştu"));
    }
  }

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;
  const inp = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-600" /> {t("page./faturalar", "Fatura Yönetimi")}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {t("ui.faturalarSubtitle", "e-Arşiv / e-Fatura / e-İrsaliye belgelerini yönetin.")}
            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-semibold">{t("ui.testMode", "Test Modu")}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">
            <Download size={14} /> {t("action.exportExcel", "Excel")}
          </button>
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">
            <RefreshCw size={14} /> {t("action.refresh", "Yenile")}
          </button>
          <button onClick={handleSeedInvoices} disabled={seeding}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
            <Database size={14} /> {seeding ? t("ui.creating", "Oluşturuluyor...") : t("ui.testData", "Test Verisi")}
          </button>
          <button onClick={() => { setCreateModal(true); setCreateError(""); }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition">
            <Plus size={16} /> {t("ui.createInvoice", "Fatura Oluştur")}
          </button>
        </div>
      </div>

      {/* Test mode notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-sm text-amber-700 flex items-start gap-2">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <div>
          <strong>{t("ui.testEnvironment", "Test Ortamı")}:</strong> {t("ui.testEnvironmentDesc", "e-Arşiv/e-Fatura/e-İrsaliye işlemleri simüle edilmektedir.")}
          {t("ui.testEnvironmentDesc2", " Gerçek entegrasyon için")} <code className="bg-amber-100 px-1 rounded">IInvoiceService</code> {t("ui.testEnvironmentDesc3", "arayüzünü uygulayan bir servis (ör. Logo, Mikro, EFinans) DI container'a kayıt edilmelidir.")}
        </div>
      </div>

      {/* Msg banner */}
      {msg && (
        <div className={`text-sm px-4 py-3 rounded-xl flex items-center justify-between ${msg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-4 text-xs underline">{t("action.close", "Kapat")}</button>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-slate-800 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-white text-sm font-semibold">{selectedIds.size} fatura seçildi</span>
          <div className="flex gap-2 ml-auto">
            <button onClick={handleBulkMarkSent} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition">
              {bulkLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
              Gönderildi İşaretle
            </button>
            <button onClick={handleBulkCancel} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition">
              {bulkLoading ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
              İptal Et
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 border border-slate-600 text-slate-300 text-xs rounded-lg hover:bg-slate-700 transition">
              Temizle
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("ui.faturalarSearchPlaceholder", "Fatura no, sipariş no, e-posta...")}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value === "" ? "" : +e.target.value); setPage(1); }}
            className="pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white appearance-none">
            <option value="">{t("filter.allStatus", "Tüm Durumlar")}</option>
            {Object.entries(STATUS_MAP).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-3 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={docTypeFilter} onChange={e => { setDocTypeFilter(e.target.value === "" ? "" : +e.target.value); setPage(1); }}
            className="pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white appearance-none">
            <option value="">{t("filter.allTypes", "Tüm Türler")}</option>
            {Object.entries(DOC_TYPE).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-3 text-slate-400 pointer-events-none" />
        </div>
        {/* Page size */}
        <div className="flex items-center gap-1 border border-slate-200 rounded-xl overflow-hidden">
          {PAGE_SIZES.map(s => (
            <button key={s} onClick={() => setPageSize(s)}
              className={`px-3 py-2 text-xs font-medium transition ${pageSize === s ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">{t("action.loading", "Yükleniyor...")}</div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">{t("ui.noInvoices", "Henüz fatura bulunmuyor.")}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-3 py-3 w-10">
                      <button onClick={toggleSelectAll} className="flex items-center justify-center text-slate-400 hover:text-teal-600 transition">
                        {allSelected ? <CheckSquare size={16} className="text-teal-600" /> : someSelected ? <CheckSquare size={16} className="text-slate-400 opacity-50" /> : <Square size={16} />}
                      </button>
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("col.invoiceNo", "Fatura No")}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("col.orderNumber", "Sipariş")}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("col.customer", "Müşteri")}</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("col.type", "Tür")}</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("col.status", "Durum")}</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <button onClick={() => handleSort("total")} className="flex items-center gap-1 ml-auto hover:text-teal-600 transition">
                        {t("col.amount", "Tutar")} <SortIcon field="total" sortField={sortField} sortDir={sortDir} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <button onClick={() => handleSort("createdDate")} className="flex items-center gap-1 hover:text-teal-600 transition">
                        {t("col.date", "Tarih")} <SortIcon field="createdDate" sortField={sortField} sortDir={sortDir} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <button onClick={() => handleSort("dataSource")} className="flex items-center gap-1 hover:text-teal-600 transition">
                        {t("ui.source", "Kaynak")} <SortIcon field="dataSource" sortField={sortField} sortDir={sortDir} />
                      </button>
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map(inv => {
                    const st = STATUS_MAP[inv.status] ?? STATUS_MAP[1];
                    const dt = DOC_TYPE[inv.docType] ?? DOC_TYPE[1];
                    const selected = selectedIds.has(inv.id);
                    return (
                      <tr key={inv.id} className={`border-b border-slate-50 transition ${selected ? "bg-teal-50" : "hover:bg-slate-50/50"}`}>
                        <td className="px-3 py-3">
                          <button onClick={() => toggleSelect(inv.id)} className="flex items-center justify-center text-slate-400 hover:text-teal-600 transition">
                            {selected ? <CheckSquare size={15} className="text-teal-600" /> : <Square size={15} />}
                          </button>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{inv.orderNumber}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{inv.customerEmail ?? "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dt.color}`}>{dt.label}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>
                            <st.icon size={10} /> {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmt(inv.totalAmount)}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(inv.createdDate)}</td>
                        <td className="px-4 py-3">
                          {inv.dataSource ? <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 whitespace-nowrap">{inv.dataSource}</span> : <span className="text-xs text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => openDetail(inv.id)}
                            className="p-1.5 rounded-lg hover:bg-teal-50 text-slate-400 hover:text-teal-600 transition">
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">{data.total} {t("ui.invoiceCount", "fatura")}</span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p-1)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition">
                    {t("table.prev", "← Önceki")}
                  </button>
                  <span className="px-3 py-1.5 text-xs text-slate-500">{page} / {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p+1)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition">
                    {t("table.next", "Sonraki →")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-teal-600" /> {t("ui.createInvoice", "Fatura Oluştur")}
              </h2>
              <button onClick={() => setCreateModal(false)} className="text-slate-400 hover:text-slate-700 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{createError}</div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t("ui.orderNumber", "Sipariş Numarası")} <span className="text-red-500">*</span></label>
                <input value={createOrderNumber} onChange={e => setCreateOrderNumber(e.target.value)} className={inp} placeholder="SIP-20260601-000001" />
                <p className="text-xs text-slate-400 mt-1">{t("ui.orderNumberHint", "Sipariş listesindeki numarayı girin.")}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t("ui.docType", "Belge Türü")}</label>
                <div className="relative">
                  <select value={createDocType} onChange={e => setCreateDocType(+e.target.value)}
                    className={inp + " appearance-none"}>
                    <option value={1}>{t("ui.eArchive", "e-Arşiv Fatura")}</option>
                    <option value={2}>{t("ui.eInvoice", "e-Fatura")}</option>
                    <option value={3}>{t("ui.eDispatch", "e-İrsaliye")}</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t("ui.noteOptional", "Not (opsiyonel)")}</label>
                <textarea rows={2} value={createNotes} onChange={e => setCreateNotes(e.target.value)} className={inp + " resize-none"} />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                {t("ui.testInvoiceNote", "Test ortamında fatura mock servis ile oluşturulur ve otomatik \"Gönderildi\" durumuna geçer.")}
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setCreateModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition">{t("action.cancel", "İptal")}</button>
                <button onClick={handleCreate} disabled={creating} className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition disabled:opacity-60">
                  <Send size={14} /> {creating ? t("ui.creating", "Oluşturuluyor...") : t("action.create", "Oluştur")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {(detailModal || loadingDetail) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-teal-600" />
                {detailModal?.invoiceNumber ?? t("action.loading", "Yükleniyor...")}
              </h2>
              <button onClick={() => setDetailModal(null)} className="text-slate-400 hover:text-slate-700 text-xl">×</button>
            </div>
            {loadingDetail ? (
              <div className="p-12 text-center text-slate-400 text-sm">{t("action.loading", "Yükleniyor...")}</div>
            ) : detailModal && (
              <div className="p-6 space-y-5">
                {/* Meta */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: t("ui.order", "Sipariş"), value: detailModal.orderNumber },
                    { label: t("col.customer", "Müşteri"), value: detailModal.customerEmail ?? "—" },
                    { label: t("col.type", "Tür"), value: DOC_TYPE[detailModal.docType]?.label },
                    { label: t("col.status", "Durum"), value: STATUS_MAP[detailModal.status]?.label },
                    { label: t("ui.createdAt", "Oluşturulma"), value: fmtDate(detailModal.createdDate) },
                    { label: t("ui.sentDate", "Gönderilme"), value: detailModal.sentDate ? fmtDate(detailModal.sentDate) : "—" },
                  ].map(m => (
                    <div key={m.label} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-0.5">{m.label}</p>
                      <p className="text-sm font-semibold text-slate-700">{m.value}</p>
                    </div>
                  ))}
                </div>

                {detailModal.providerInvoiceId && (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
                    <p className="text-xs text-teal-600 font-semibold mb-1">{t("ui.providerInvoiceId", "Sağlayıcı Fatura ID")}</p>
                    <p className="font-mono text-sm text-teal-800">{detailModal.providerInvoiceId}</p>
                  </div>
                )}

                {detailModal.errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-xs text-red-600 font-semibold mb-1">{t("ui.errorMessage", "Hata Mesajı")}</p>
                    <p className="text-sm text-red-700">{detailModal.errorMessage}</p>
                  </div>
                )}

                {/* Items */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">{t("ui.invoiceItems", "Fatura Kalemleri")}</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left px-3 py-2 font-semibold text-slate-500">{t("ui.product", "Ürün")}</th>
                          <th className="text-center px-3 py-2 font-semibold text-slate-500">{t("ui.quantity", "Adet")}</th>
                          <th className="text-right px-3 py-2 font-semibold text-slate-500">{t("ui.unitPrice", "Birim Fiyat")}</th>
                          <th className="text-right px-3 py-2 font-semibold text-slate-500">{t("ui.vatRate", "KDV %")}</th>
                          <th className="text-right px-3 py-2 font-semibold text-slate-500">{t("ui.vat", "KDV")}</th>
                          <th className="text-right px-3 py-2 font-semibold text-slate-500">{t("col.total", "Toplam")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailModal.items.map(it => (
                          <tr key={it.id} className="border-b border-slate-100">
                            <td className="px-3 py-2">
                              <p className="font-medium text-slate-700">{it.productName}</p>
                              {it.variantName && <p className="text-slate-400">{it.variantName}</p>}
                              {it.sku && <p className="font-mono text-slate-400">{it.sku}</p>}
                            </td>
                            <td className="px-3 py-2 text-center text-slate-600">{it.quantity}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{fmt(it.unitPrice)}</td>
                            <td className="px-3 py-2 text-right text-slate-500">%{it.taxRate}</td>
                            <td className="px-3 py-2 text-right text-slate-500">{fmt(it.taxAmount)}</td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-800">{fmt(it.lineTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50">
                          <td colSpan={4} className="px-3 py-2" />
                          <td className="px-3 py-2 text-right text-xs font-semibold text-slate-500">{t("ui.vat", "KDV")}: {fmt(detailModal.taxAmount)}</td>
                          <td className="px-3 py-2 text-right text-sm font-bold text-slate-900">{fmt(detailModal.totalAmount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                  {detailModal.status !== 3 && detailModal.status !== 4 && (
                    <button onClick={() => handleStatusUpdate(detailModal.id, 3)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition">
                      <CheckCircle size={13} /> {t("ui.markSent", "Gönderildi İşaretle")}
                    </button>
                  )}
                  {detailModal.status !== 4 && (
                    <button onClick={() => handleStatusUpdate(detailModal.id, 4)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-semibold hover:bg-red-200 transition">
                      <XCircle size={13} /> {t("ui.cancelInvoice", "İptal Et")}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
