"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import type { AdminOrderSummary, PaginatedList } from "@/types";
import { ORDER_STATUS, ORDER_STATUS_COLORS, PAYMENT_STATUS } from "@/types";
import { Search, Download } from "lucide-react";
import { exportToExcel } from "@/lib/excel";

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: "15" });
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
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Siparişler</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{totalCount} sipariş</p>
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Sipariş no veya müşteri..."
              className="pl-8 pr-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 w-56"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition">
            Ara
          </button>
          {(search || statusFilter) && (
            <button
              type="button"
              onClick={() => { setSearch(""); setSearchInput(""); setStatusFilter(""); setPage(1); }}
              className="px-4 py-2 border border-zinc-300 text-zinc-600 text-sm rounded-lg hover:bg-zinc-50 transition"
            >
              Temizle
            </button>
          )}
        </form>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
        >
          <option value="">Tüm Durumlar</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Sipariş No</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Müşteri</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Durum</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Ödeme</th>
                <th className="text-right px-5 py-3 text-zinc-500 font-medium">Tutar</th>
                <th className="text-right px-5 py-3 text-zinc-500 font-medium">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-zinc-400">Yükleniyor...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-zinc-400">Sipariş bulunamadı</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50 transition">
                    <td className="px-5 py-3.5">
                      <Link href={`/siparisler/${order.orderNumber}`} className="font-medium text-zinc-900 hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-zinc-800">{order.customerName}</p>
                      <p className="text-xs text-zinc-400">{order.customerEmail}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status] ?? "bg-zinc-100 text-zinc-700"}`}>
                        {ORDER_STATUS[order.status] ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600 text-xs">{PAYMENT_STATUS[order.paymentStatus] ?? "—"}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-zinc-900">{formatPrice(order.grandTotal)}</td>
                    <td className="px-5 py-3.5 text-right text-zinc-400 text-xs">{formatDate(order.createdDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <button onClick={() => setPage((p) => p - 1)} className="px-4 py-2 rounded-lg border border-zinc-300 text-sm hover:bg-zinc-100">
              ← Önceki
            </button>
          )}
          <span className="px-4 py-2 text-sm text-zinc-500">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <button onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-lg border border-zinc-300 text-sm hover:bg-zinc-100">
              Sonraki →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
