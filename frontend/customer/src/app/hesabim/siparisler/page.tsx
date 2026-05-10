"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, formatDate } from "@/lib/utils";
import type { OrderSummary, PaginatedList } from "@/types";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/types";

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/giris");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api
      .get<PaginatedList<OrderSummary>>(`/api/orders/my?page=${page}&pageSize=10`)
      .then((data) => {
        setOrders(data.items);
        setTotalPages(data.totalPages);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user, page]);

  if (authLoading || loading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">Yükleniyor...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Siparişlerim</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 mb-4">Henüz siparişiniz yok</p>
          <Link href="/urunler" className="bg-teal-600 text-white px-6 py-2.5 rounded-xl hover:bg-teal-700 transition text-sm">
            Alışverişe Başla
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/hesabim/siparisler/${order.orderNumber}`}
              className="block bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{formatDate(order.createdDate)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{formatPrice(order.grandTotal)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{order.itemCount} ürün</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                  {ORDER_STATUS[order.status] ?? "Bilinmiyor"}
                </span>
                <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  Ödeme: {PAYMENT_STATUS[order.paymentStatus] ?? "—"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <button onClick={() => setPage((p) => p - 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm hover:bg-slate-100">
              ← Önceki
            </button>
          )}
          {page < totalPages && (
            <button onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm hover:bg-slate-100">
              Sonraki →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
