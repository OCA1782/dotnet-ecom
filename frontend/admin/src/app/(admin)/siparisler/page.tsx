"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import type { AdminOrderSummary, PaginatedList } from "@/types";
import { ORDER_STATUS, ORDER_STATUS_COLORS, PAYMENT_STATUS } from "@/types";
import { Search, Download, PauseCircle, XCircle, Eye, AlertTriangle, Clock, RotateCcw } from "lucide-react";
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

const CANCELLABLE = new Set([1, 2, 3, 4]);
const HOLDABLE = new Set([1, 2, 3, 4, 5]);

const PAGE_SIZES = [15, 30, 50, 100];

type ModalTarget = { orderId: string; orderNumber: string };

export default function OrdersPage() {
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
  const [holdModal, setHoldModal] = useState<ModalTarget | null>(null);
  const [cancelModal, setCancelModal] = useState<ModalTarget | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) qs.set("search", search);
      if (statusFilter) qs.set("status", statusFilter);
      const data = await api.get<PaginatedList<AdminOrderSummary>>(`/api/orders/admin/list?${qs}`);
      setOrders(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function confirmHold() {
    if (!holdModal) return;
    const { orderId } = holdModal;
    setHoldModal(null);
    try {
      await api.put(`/api/orders/admin/${orderId}/status`, { status: 12 });
      setMsg({ text: "Sipariş askıya alındı.", ok: true });
      fetchOrders();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Hata oluştu.", ok: false });
    }
  }

  async function confirmCancel() {
    if (!cancelModal) return;
    const { orderId } = cancelModal;
    setCancelModal(null);
    try {
      await api.post(`/api/orders/admin/${orderId}/cancel`, {});
      setMsg({ text: "Sipariş iptal edildi.", ok: true });
      fetchOrders();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "İptal başarısız.", ok: false });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Siparişler</h1>
          {!loading && <p className="text-sm text-slate-500 mt-0.5">{totalCount} sipariş</p>}
        </div>
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
          <Download size={15} /> Excel'e Aktar
        </button>
      </div>

      {msg && (
        <div className={`text-sm px-4 py-3 rounded-xl flex items-center justify-between ${msg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-4 text-xs underline">Kapat</button>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={e => { e.preventDefault(); setPage(1); setSearch(searchInput); }} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Sipariş no veya müşteri..."
              className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-56 text-slate-900 bg-white"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition">Ara</button>
          {(search || statusFilter || searchInput) && (
            <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setStatusFilter(""); setPage(1); }}
              className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">Temizle</button>
          )}
        </form>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
          <option value="">Tüm Durumlar</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s} kayıt</option>)}
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
                Sadece iadeleri göster
              </button>
            )}
          </div>
        );
      })()}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="p-8 text-center text-slate-400">Yükleniyor...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Sipariş No</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Müşteri</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Durum</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Ödeme</th>
                  <th className="text-right px-5 py-3 text-slate-500 font-medium text-xs">Tutar</th>
                  <th className="text-right px-5 py-3 text-slate-500 font-medium text-xs">Tarih</th>
                  <th className="px-5 py-3 text-slate-500 font-medium text-xs"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Sipariş bulunamadı</td></tr>
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
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Link href={`/siparisler/${order.orderNumber}`}
                              title="Detay"
                              className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white shadow-sm hover:shadow-teal-200 hover:shadow-md transition-all duration-150 active:scale-95">
                              <Eye size={18} />
                            </Link>
                            {HOLDABLE.has(order.status) && order.status !== 12 && (
                              <button onClick={() => setHoldModal({ orderId: order.id, orderNumber: order.orderNumber })}
                                title="Askıya Al"
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white shadow-sm hover:shadow-amber-200 hover:shadow-md transition-all duration-150 active:scale-95">
                                <PauseCircle size={18} />
                              </button>
                            )}
                            {CANCELLABLE.has(order.status) && (
                              <button onClick={() => setCancelModal({ orderId: order.id, orderNumber: order.orderNumber })}
                                title="İptal Et"
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white shadow-sm hover:shadow-red-200 hover:shadow-md transition-all duration-150 active:scale-95">
                                <XCircle size={18} />
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
          {page > 1 && <button onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">← Önceki</button>}
          <span className="px-4 py-2 text-sm text-slate-500">{page} / {totalPages}</span>
          {page < totalPages && <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">Sonraki →</button>}
        </div>
      )}

      {holdModal && (
        <ConfirmModal
          title="Siparişi Askıya Al"
          message={`${holdModal.orderNumber} numaralı sipariş askıya alınacak. Sipariş işleme alınmayacak ve müşteriye bildirim gönderilecektir.`}
          confirmLabel="Askıya Al"
          cancelLabel="Vazgeç"
          icon={<span className="w-8 h-8 flex items-center justify-center rounded-xl bg-amber-100 text-amber-600"><PauseCircle size={18} /></span>}
          onConfirm={confirmHold}
          onCancel={() => setHoldModal(null)}
        />
      )}

      {cancelModal && (
        <ConfirmModal
          title="Siparişi İptal Et"
          message={`${cancelModal.orderNumber} numaralı sipariş kalıcı olarak iptal edilecek. Bu işlem geri alınamaz.`}
          confirmLabel="İptal Et"
          cancelLabel="Vazgeç"
          danger
          icon={<span className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-100 text-red-600"><XCircle size={18} /></span>}
          onConfirm={confirmCancel}
          onCancel={() => setCancelModal(null)}
        />
      )}
    </div>
  );
}
