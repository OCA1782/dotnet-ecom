"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { useI18n } from "@/contexts/I18nContext";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import type { AdminOrderSummary, PaginatedList } from "@/types";
import { ORDER_STATUS, ORDER_STATUS_COLORS, PAYMENT_STATUS } from "@/types";
import { Search, Download, PauseCircle, XCircle, Eye, AlertTriangle, Clock, RotateCcw, CheckCircle2, Trash2, Activity, ShoppingCart, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { exportToExcel } from "@/lib/excel";
import ConfirmModal from "@/components/ConfirmModal";

type OrderWarning = { level: "red" | "amber"; icon: React.ReactNode; text: string } | null;

function getOrderWarning(status: number): OrderWarning {
  switch (status) {
    case 9:
      return { level: "red", icon: <RotateCcw size={13} className="text-red-500 shrink-0 animate-pulse" />, text: "İade talebi var — Müşteri iade talep etti, acil inceleme ve onay gerekiyor!" };
    case 1:
      return { level: "amber", icon: <Clock size={13} className="text-amber-500 shrink-0" />, text: "Yeni sipariş — Henüz işleme alınmadı, onaylanmasını bekliyor." };
    case 2:
      return { level: "amber", icon: <Clock size={13} className="text-amber-500 shrink-0" />, text: "Ödeme bekleniyor — Ödeme alındıktan sonra işleme alınabilir." };
    case 12:
      return { level: "amber", icon: <AlertTriangle size={13} className="text-amber-500 shrink-0" />, text: "Sipariş askıda — İşlem durdurulmuş, nedenini kontrol edin." };
    default:
      return null;
  }
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

const ORDER_ACTION_COLORS: Record<string, string> = {
  "DurumGüncellendi": "bg-blue-100 text-blue-700",
  "AdresGüncellendi": "bg-teal-100 text-teal-700",
  "OrderDeleted": "bg-red-100 text-red-700",
};

const APPROVABLE = new Set([1]);
const CANCELLABLE = new Set([1, 2, 3, 4]);
const HOLDABLE = new Set([1, 2, 3, 4, 5]);
const DELETABLE = new Set([7, 8, 10, 11]); // Completed, Cancelled, Refunded, Failed

const PAGE_SIZES = [15, 30, 50, 100];

type SortField = "createdDate" | "dataSource";
function buildSortKey(field: SortField, dir: "asc" | "desc") { return `${field}-${dir}`; }

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField | null; sortDir: "asc" | "desc" }) {
  if (sortField !== field) return <ChevronsUpDown size={12} className="opacity-30 ml-1 inline-block" />;
  return sortDir === "asc" ? <ChevronUp size={12} className="text-teal-600 ml-1 inline-block" /> : <ChevronDown size={12} className="text-teal-600 ml-1 inline-block" />;
}

type ModalTarget = { orderId: string; orderNumber: string };

export default function OrdersPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"siparisler" | "hareketler">("siparisler");

  // Hareketler
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);
  const logsPageSize = 30;

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(logsPage), pageSize: String(logsPageSize), entityName: "Sipariş" });
      const data = await api.get<{ items: AuditLog[]; totalCount: number }>(`/api/admin/audit-logs?${params}`);
      setLogs(data.items);
      setLogsTotal(data.totalCount);
    } finally {
      setLogsLoading(false);
    }
  }, [logsPage, logsPageSize]);

  useEffect(() => {
    if (activeTab !== "hareketler") return;
    const id = window.setTimeout(() => { void loadLogs(); }, 0);
    return () => window.clearTimeout(id);
  }, [activeTab, loadLogs]);

  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [approveModal, setApproveModal] = useState<ModalTarget | null>(null);
  const [holdModal, setHoldModal] = useState<ModalTarget | null>(null);
  const [cancelModal, setCancelModal] = useState<ModalTarget | null>(null);
  const [deleteModal, setDeleteModal] = useState<ModalTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) qs.set("search", search);
      if (statusFilter) qs.set("status", statusFilter);
      if (sortField) qs.set("sortBy", buildSortKey(sortField, sortDir));
      const data = await api.get<PaginatedList<AdminOrderSummary>>(`/api/orders/admin/list?${qs}`);
      setOrders(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, sortField, sortDir]);

  useEffect(() => {
    const id = window.setTimeout(() => { void fetchOrders(); }, 0);
    return () => window.clearTimeout(id);
  }, [fetchOrders]);

  async function confirmApprove() {
    if (!approveModal) return;
    const { orderId } = approveModal;
    setApproveModal(null);
    try {
      await api.put(`/api/orders/admin/${orderId}/status`, { status: 4 });
      setMsg({ text: t("msg.orderApproved", "Sipariş onaylandı, hazırlanmaya başlandı."), ok: true });
      fetchOrders();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : t("msg.error", "Bir hata oluştu"), ok: false });
    }
  }

  async function confirmHold() {
    if (!holdModal) return;
    const { orderId } = holdModal;
    setHoldModal(null);
    try {
      await api.put(`/api/orders/admin/${orderId}/status`, { status: 12 });
      setMsg({ text: t("msg.orderHeld", "Sipariş askıya alındı."), ok: true });
      fetchOrders();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : t("msg.error", "Bir hata oluştu"), ok: false });
    }
  }

  async function confirmCancel() {
    if (!cancelModal) return;
    const { orderId } = cancelModal;
    setCancelModal(null);
    try {
      await api.post(`/api/orders/admin/${orderId}/cancel`, {});
      setMsg({ text: t("msg.orderCancelled", "Sipariş iptal edildi."), ok: true });
      fetchOrders();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : t("msg.error", "Bir hata oluştu"), ok: false });
    }
  }

  async function confirmDelete() {
    if (!deleteModal) return;
    const { orderId, orderNumber } = deleteModal;
    setDeleteModal(null);
    setDeleting(true);
    try {
      await api.delete(`/api/orders/admin/${orderId}`);
      setMsg({ text: `${orderNumber} ${t("msg.deleted", "Başarıyla silindi")}`, ok: true });
      fetchOrders();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : t("msg.error", "Bir hata oluştu"), ok: false });
    } finally {
      setDeleting(false);
    }
  }

  async function handleCsvExport() {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (statusFilter) qs.set("status", statusFilter);
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5124";
    const res = await fetch(`${API_BASE}/api/orders/admin/export?${qs}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) { setMsg({ text: t("msg.exportFailed", "Dışa aktarma başarısız."), ok: false }); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `siparisler-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("nav./siparisler", "Siparişler")}</h1>
          {!loading && <p className="text-sm text-slate-500 mt-0.5">{totalCount} sipariş</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCsvExport}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow">
            <Download size={15} /> {t("action.downloadCSV", "CSV İndir (Tümü)")}
          </button>
          <button
            onClick={() => exportToExcel(
              orders.map(o => ({
                "Sipariş No": o.orderNumber, "Müşteri": o.customerName,
                "E-posta": o.customerEmail, "Durum": ORDER_STATUS[o.status] ?? o.status,
                "Tutar": o.grandTotal, "Ürün Sayısı": o.itemCount,
                "Tarih": formatDate(o.createdDate),
              })),
              "siparisler", "Siparişler"
            )}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow">
            <Download size={15} /> {t("action.exportExcelPage", "Excel (Sayfa)")}
          </button>
        </div>
      </div>

      {/* Sekme */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("siparisler")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === "siparisler" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <ShoppingCart size={14} /> {t("tab.orders", "Siparişler")}
        </button>
        <button
          onClick={() => setActiveTab("hareketler")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === "hareketler" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Activity size={14} /> {t("tab.activity", "Hareketler")}
        </button>
      </div>

      {msg && (
        <div className={`text-sm px-4 py-3 rounded-xl flex items-center justify-between ${msg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-4 text-xs underline">{t("action.close", "Kapat")}</button>
        </div>
      )}

      {activeTab === "siparisler" && <>
      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={e => { e.preventDefault(); setPage(1); setSearch(searchInput); }} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("ui.searchOrders", "Sipariş no veya müşteri...")}
              className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-56 text-slate-900 bg-white"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition">{t("action.search", "Ara")}</button>
          {(search || statusFilter || searchInput) && (
            <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setStatusFilter(""); setPage(1); }}
              className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">{t("action.clear", "Temizle")}</button>
          )}
        </form>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
          <option value="">{t("filter.allStatus", "Tüm Durumlar")}</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s} {t("table.perPage", "kayıt")}</option>)}
        </select>
      </div>

      {/* Liste-bazlı alarm bandı */}
      {!loading && (() => {
        const refundCount = orders.filter(o => o.status === 9).length;
        const pendingCount = orders.filter(o => o.status === 1 || o.status === 2).length;
        const holdCount = orders.filter(o => o.status === 12).length;
        if (!refundCount && !pendingCount && !holdCount) return null;
        const parts = [
          refundCount > 0 && `${refundCount} iade talebi`,
          pendingCount > 0 && `${pendingCount} bekleyen sipariş`,
          holdCount > 0 && `${holdCount} askıdaki sipariş`,
        ].filter(Boolean).join(", ");
        return (
          <div className={`flex items-center gap-3 rounded-2xl px-5 py-4 shadow-sm border-2 ${
            refundCount > 0
              ? "bg-red-50 border-red-400 shadow-red-100"
              : "bg-amber-50 border-amber-400 shadow-amber-100"
          }`}>
            <span className="relative flex h-5 w-5 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${refundCount > 0 ? "bg-red-400" : "bg-amber-400"}`} />
              <span className={`relative inline-flex rounded-full h-5 w-5 items-center justify-center ${refundCount > 0 ? "bg-red-500" : "bg-amber-500"}`}>
                <AlertTriangle size={11} className="text-white" />
              </span>
            </span>
            <p className={`text-sm font-bold flex-1 ${refundCount > 0 ? "text-red-700" : "text-amber-700"}`}>
              {parts} — İnceleme gerekiyor!
            </p>
            {refundCount > 0 && (
              <button
                onClick={() => { setStatusFilter("9"); setPage(1); }}
                className="shrink-0 text-xs text-red-600 font-semibold border border-red-300 bg-white hover:bg-red-50 px-3 py-1.5 rounded-xl transition">
                {t("ui.showRefunds", "Sadece iadeleri göster")}
              </button>
            )}
          </div>
        );
      })()}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="p-8 text-center text-slate-400">{t("action.loading", "Yükleniyor...")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{t("col.orderNumber", "Sipariş No")}</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{t("col.customer", "Müşteri")}</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{t("col.status", "Durum")}</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{t("col.payment", "Ödeme")}</th>
                  <th className="text-right px-5 py-3 text-slate-500 font-medium text-xs">{t("col.amount", "Tutar")}</th>
                  <th className="text-right px-5 py-3 text-slate-500 font-medium text-xs"><button onClick={() => handleSort("createdDate")} className="flex items-center gap-0.5 ml-auto hover:text-teal-600 transition select-none">{t("col.date", "Tarih")} <SortIcon field="createdDate" sortField={sortField} sortDir={sortDir} /></button></th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs"><button onClick={() => handleSort("dataSource")} className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">{t("col.source", "Kaynak")} <SortIcon field="dataSource" sortField={sortField} sortDir={sortDir} /></button></th>
                  <th className="px-5 py-3 text-slate-500 font-medium text-xs"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">{t("table.noData", "Kayıt bulunamadı")}</td></tr>
                ) : orders.map((order) => {
                  const warning = getOrderWarning(order.status);
                  return (
                    <Fragment key={order.id}>
                      <tr className={`transition-all ${
                        warning?.level === "red"
                          ? "bg-red-50 border-l-4 border-l-red-500 hover:bg-red-100/60"
                          : warning?.level === "amber"
                          ? "bg-amber-50/50 border-l-4 border-l-amber-400 hover:bg-amber-50"
                          : "hover:bg-slate-50"
                      }`}>
                        <td className="px-5 py-3.5">
                          <Link href={`/siparisler/${order.orderNumber}`} className="font-semibold text-slate-800 hover:text-teal-600 text-xs font-mono">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-slate-800 text-xs font-medium">{order.customerName}</p>
                          <p className="text-xs text-slate-400">{order.customerEmail}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ORDER_STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-600"}`}>
                            {ORDER_STATUS[order.status] ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 text-xs">{PAYMENT_STATUS[order.paymentStatus] ?? "—"}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-800 text-xs">{formatPrice(order.grandTotal)}</td>
                        <td className="px-5 py-3.5 text-right text-slate-400 text-xs">{formatDate(order.createdDate)}</td>
                        <td className="px-5 py-3.5">
                          {order.dataSource
                            ? <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 whitespace-nowrap">{order.dataSource}</span>
                            : <span className="text-xs text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 justify-end">
                            {APPROVABLE.has(order.status) && (
                              <button onClick={() => setApproveModal({ orderId: order.id, orderNumber: order.orderNumber })}
                                title={t("action.approve", "Onayla")}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white shadow-sm hover:shadow-emerald-200 hover:shadow-md transition-all duration-150 active:scale-95">
                                <CheckCircle2 size={18} />
                              </button>
                            )}
                            <Link href={`/siparisler/${order.orderNumber}`}
                              title={t("action.details", "Detaylar")}
                              className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white shadow-sm hover:shadow-teal-200 hover:shadow-md transition-all duration-150 active:scale-95">
                              <Eye size={18} />
                            </Link>
                            {HOLDABLE.has(order.status) && order.status !== 12 && (
                              <button onClick={() => setHoldModal({ orderId: order.id, orderNumber: order.orderNumber })}
                                title={t("action.hold", "Askıya Al")}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white shadow-sm hover:shadow-amber-200 hover:shadow-md transition-all duration-150 active:scale-95">
                                <PauseCircle size={18} />
                              </button>
                            )}
                            {CANCELLABLE.has(order.status) && (
                              <button onClick={() => setCancelModal({ orderId: order.id, orderNumber: order.orderNumber })}
                                title={t("action.cancelOrder", "İptal Et")}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white shadow-sm hover:shadow-red-200 hover:shadow-md transition-all duration-150 active:scale-95">
                                <XCircle size={18} />
                              </button>
                            )}
                            {DELETABLE.has(order.status) && (
                              <button onClick={() => setDeleteModal({ orderId: order.id, orderNumber: order.orderNumber })}
                                title={t("action.delete", "Sil")}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-600 hover:text-white shadow-sm transition-all duration-150 active:scale-95">
                                <Trash2 size={17} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {warning && (
                        <tr className={warning.level === "red"
                          ? "bg-red-50 border-l-4 border-l-red-500"
                          : "bg-amber-50/50 border-l-4 border-l-amber-400"}>
                          <td colSpan={7} className="px-5 pb-2.5 pt-0">
                            <div className="flex items-center gap-2">
                              {warning.icon}
                              <span className={`text-xs font-semibold ${warning.level === "red" ? "text-red-600" : "text-amber-700"}`}>
                                {warning.text}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && <button onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">{t("table.prev", "← Önceki")}</button>}
          <span className="px-4 py-2 text-sm text-slate-500">{page} / {totalPages}</span>
          {page < totalPages && <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">{t("table.next", "Sonraki →")}</button>}
        </div>
      )}
      </>}

      {/* ── Hareketler Sekmesi ── */}
      {activeTab === "hareketler" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">Sipariş durum değişiklikleri, adres güncellemeleri ve silme işlemleri.</p>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {logsLoading ? (
              <p className="p-8 text-center text-slate-400">{t("action.loading", "Yükleniyor...")}</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {[t("col.date", "Tarih"), "İşlemi Yapan", "Aksiyon", "Sipariş ID", t("action.details", "Detaylar")].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">{t("table.noData", "Kayıt bulunamadı")}</td></tr>
                  ) : logs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(l.createdDate).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-3 text-slate-700 text-xs">{l.userEmail}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ORDER_ACTION_COLORS[l.action] ?? "bg-slate-100 text-slate-600"}`}>
                          {l.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                        {l.entityId ? l.entityId.slice(0, 8) + "…" : "-"}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {l.oldValue && <span className="text-xs text-slate-500 line-through mr-1">{l.oldValue}</span>}
                        {l.newValue && <span className="text-xs text-slate-700">{l.newValue}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {Math.ceil(logsTotal / logsPageSize) > 1 && (
            <div className="flex justify-center gap-2">
              {logsPage > 1 && <button onClick={() => setLogsPage(p => p - 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">{t("table.prev", "← Önceki")}</button>}
              <span className="px-4 py-2 text-sm text-slate-500">{logsPage} / {Math.ceil(logsTotal / logsPageSize)}</span>
              {logsPage < Math.ceil(logsTotal / logsPageSize) && <button onClick={() => setLogsPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">{t("table.next", "Sonraki →")}</button>}
            </div>
          )}
        </div>
      )}

      {approveModal && (
        <ConfirmModal
          title={t("ui.orderApproveTitle", "Siparişi Onayla")}
          message={`${approveModal.orderNumber} numaralı sipariş onaylanacak ve hazırlanmaya başlanacak. Müşteriye bildirim gönderilecektir.`}
          confirmLabel={t("action.approve", "Onayla")}
          cancelLabel={t("action.cancel", "Vazgeç")}
          icon={<span className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><CheckCircle2 size={18} /></span>}
          onConfirm={confirmApprove}
          onCancel={() => setApproveModal(null)}
        />
      )}

      {holdModal && (
        <ConfirmModal
          title={t("ui.orderHoldTitle", "Siparişi Askıya Al")}
          message={`${holdModal.orderNumber} numaralı sipariş askıya alınacak. Sipariş işleme alınmayacak ve müşteriye bildirim gönderilecektir.`}
          confirmLabel={t("action.hold", "Askıya Al")}
          cancelLabel={t("action.cancel", "Vazgeç")}
          icon={<span className="w-8 h-8 flex items-center justify-center rounded-xl bg-amber-100 text-amber-600"><PauseCircle size={18} /></span>}
          onConfirm={confirmHold}
          onCancel={() => setHoldModal(null)}
        />
      )}

      {cancelModal && (
        <ConfirmModal
          title={t("ui.orderCancelTitle", "Siparişi İptal Et")}
          message={`${cancelModal.orderNumber} numaralı sipariş kalıcı olarak iptal edilecek. ${t("msg.irreversible", "Bu işlem geri alınamaz.")}`}
          confirmLabel={t("action.cancelOrder", "İptal Et")}
          cancelLabel={t("action.cancel", "Vazgeç")}
          danger
          icon={<span className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-100 text-red-600"><XCircle size={18} /></span>}
          onConfirm={confirmCancel}
          onCancel={() => setCancelModal(null)}
        />
      )}

      {deleteModal && (
        <ConfirmModal
          title={t("ui.orderDeleteTitle", "Siparişi Sil")}
          message={`${deleteModal.orderNumber} numaralı sipariş kalıcı olarak silinecek. Silinen siparişler listede görünmez. ${t("msg.irreversible", "Bu işlem geri alınamaz.")}`}
          confirmLabel={deleting ? t("action.saving", "Kaydediliyor...") : t("action.yes", "Evet")}
          cancelLabel={t("action.cancel", "Vazgeç")}
          danger
          icon={<span className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Trash2 size={18} /></span>}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
