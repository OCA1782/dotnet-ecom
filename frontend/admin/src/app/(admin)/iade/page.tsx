"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import type { AdminOrderSummary, PaginatedList } from "@/types";
import { ORDER_STATUS_COLORS, PAYMENT_STATUS } from "@/types";
import {
  RotateCcw, CheckCircle2, XCircle, Eye, AlertTriangle,
  Clock, User, Search, Database,
} from "lucide-react";
interface RefundNote { orderId: string; orderNumber: string; note: string }

export default function IadePage() {
  const [seeding, setSeeding] = useState(false);

  async function handleSeedReturns() {
    setSeeding(true);
    try {
      await api.post("/api/admin/seed/returns", {});
      setMsg({ text: "3 test iade kaydı oluşturuldu.", ok: true });
      fetchOrders();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Seed hatası", ok: false });
    } finally { setSeeding(false); }
  }

  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [approveModal, setApproveModal] = useState<RefundNote | null>(null);
  const [rejectModal, setRejectModal] = useState<RefundNote | null>(null);
  const [noteInput, setNoteInput] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: "20", status: "9" });
      if (search) qs.set("search", search);
      const data = await api.get<PaginatedList<AdminOrderSummary>>(`/api/orders/admin/list?${qs}`);
      setOrders(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function confirmApprove() {
    if (!approveModal) return;
    const { orderId, note } = approveModal;
    setApproveModal(null);
    setNoteInput("");
    try {
      await api.put(`/api/orders/admin/${orderId}/status`, { status: 10, note });
      setMsg({ text: "İade onaylandı.", ok: true });
      fetchOrders();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Onaylama başarısız.", ok: false });
    }
  }

  async function confirmReject() {
    if (!rejectModal) return;
    const { orderId, note } = rejectModal;
    setRejectModal(null);
    setNoteInput("");
    try {
      await api.put(`/api/orders/admin/${orderId}/status`, { status: 7, note });
      setMsg({ text: "İade talebi reddedildi, sipariş tamamlandı olarak işaretlendi.", ok: true });
      fetchOrders();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Reddetme başarısız.", ok: false });
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl overflow-hidden shadow-sm"
        style={{ background: totalCount > 0
          ? "linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #f97316 100%)"
          : "linear-gradient(135deg, #0f766e 0%, #0d9488 60%, #14b8a6 100%)" }}>
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 shadow">
              <RotateCcw size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">İade Yönetimi</h1>
              <p className="text-red-100 text-xs mt-0.5">
                Müşterinin iade talep ettiği siparişler — onaylayın veya reddedin
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {totalCount > 0 && (
              <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5">
                <AlertTriangle size={13} className="text-orange-200" />
                <span className="text-white text-xs font-bold">{totalCount} talep</span>
              </div>
            )}
            {totalCount === 0 && !loading && (
              <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5">
                <CheckCircle2 size={13} className="text-white/80" />
                <span className="text-white text-xs font-semibold">Bekleyen talep yok</span>
              </div>
            )}
            <button onClick={handleSeedReturns} disabled={seeding}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition disabled:opacity-50">
              <Database size={13} /> {seeding ? "Oluşturuluyor..." : "Test Verisi"}
            </button>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`text-sm px-4 py-3 rounded-xl flex items-center justify-between ${
          msg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-4 text-xs underline">Kapat</button>
        </div>
      )}

      {/* Arama */}
      <form onSubmit={e => { e.preventDefault(); setPage(1); setSearch(searchInput); }} className="flex gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Sipariş no veya müşteri..."
            className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 w-64 text-slate-900 bg-white"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 transition">Ara</button>
        {(search || searchInput) && (
          <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
            className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">Temizle</button>
        )}
      </form>

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-300" />
            <p className="text-slate-500 font-medium">Bekleyen iade talebi yok</p>
            <p className="text-slate-400 text-sm mt-1">Tüm iade talepleri işlendi.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map(order => (
              <div key={order.id} className="px-5 py-4 flex items-start gap-4 hover:bg-red-50/30 transition-colors">
                {/* Sol: ikon */}
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                  <RotateCcw size={18} className="text-orange-600 animate-pulse" />
                </div>

                {/* Orta: bilgi */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Link href={`/siparisler/${order.orderNumber}`}
                      className="font-bold text-slate-800 hover:text-red-600 font-mono text-sm transition">
                      {order.orderNumber}
                    </Link>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ORDER_STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-600"}`}>
                      İade Talep Edildi
                    </span>
                    <span className="text-xs text-slate-400">{PAYMENT_STATUS[order.paymentStatus] ?? "—"}</span>
                    {order.dataSource && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 whitespace-nowrap">{order.dataSource}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><User size={11} />{order.customerName}</span>
                    <span>{order.customerEmail}</span>
                    <span className="flex items-center gap-1"><Clock size={11} />{formatDate(order.createdDate)}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 mt-1">{formatPrice(order.grandTotal)}</p>
                </div>

                {/* Sağ: aksiyonlar */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Link href={`/siparisler/${order.orderNumber}`}
                    title="Detay"
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white shadow-sm transition-all duration-150 active:scale-95">
                    <Eye size={16} />
                  </Link>
                  <button
                    onClick={() => { setNoteInput(""); setApproveModal({ orderId: order.id, orderNumber: order.orderNumber, note: "" }); }}
                    title="İadeyi Onayla"
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white shadow-sm transition-all duration-150 active:scale-95">
                    <CheckCircle2 size={16} />
                  </button>
                  <button
                    onClick={() => { setNoteInput(""); setRejectModal({ orderId: order.id, orderNumber: order.orderNumber, note: "" }); }}
                    title="İadeyi Reddet"
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white shadow-sm transition-all duration-150 active:scale-95">
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && <button onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">← Önceki</button>}
          <span className="px-4 py-2 text-sm text-slate-500">{page} / {totalPages}</span>
          {page < totalPages && <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">Sonraki →</button>}
        </div>
      )}

      {/* Onay Modalı */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">İadeyi Onayla</h2>
                <p className="text-xs text-slate-500">{approveModal.orderNumber}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Müşterinin iade talebi onaylanacak. Sipariş durumu <strong>İade Edildi</strong> olarak güncellenecek.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Not (isteğe bağlı)</label>
              <textarea
                value={noteInput}
                onChange={e => { setNoteInput(e.target.value); setApproveModal(m => m ? { ...m, note: e.target.value } : m); }}
                placeholder="İade nedeni veya açıklama..."
                rows={3}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={confirmApprove}
                className="flex-1 bg-emerald-600 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-700 transition text-sm">
                Onayla
              </button>
              <button onClick={() => { setApproveModal(null); setNoteInput(""); }}
                className="flex-1 border border-slate-300 text-slate-600 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition text-sm">
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Red Modalı */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <XCircle size={20} className="text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">İadeyi Reddet</h2>
                <p className="text-xs text-slate-500">{rejectModal.orderNumber}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              İade talebi reddedilecek. Sipariş durumu <strong>Tamamlandı</strong> olarak güncellenecek.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Red nedeni (isteğe bağlı)</label>
              <textarea
                value={noteInput}
                onChange={e => { setNoteInput(e.target.value); setRejectModal(m => m ? { ...m, note: e.target.value } : m); }}
                placeholder="Red gerekçesi veya açıklama..."
                rows={3}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={confirmReject}
                className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-xl hover:bg-red-700 transition text-sm">
                Reddet
              </button>
              <button onClick={() => { setRejectModal(null); setNoteInput(""); }}
                className="flex-1 border border-slate-300 text-slate-600 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition text-sm">
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
