"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, formatDate } from "@/lib/utils";
import type { OrderSummary, PaginatedList } from "@/types";
import { orderStatusStyle, paymentStatusStyle, SHIPMENT_STATUS } from "@/types";

interface PaymentResult {
  transactionId: string;
  requiresRedirect: boolean;
  redirectUrl?: string;
}

function ShipmentBadge({ status }: { status: number }) {
  if (status === 0) return null;
  const map: Record<number, string> = {
    1: "bg-violet-50 text-violet-700",
    2: "bg-indigo-50 text-indigo-700",
    3: "bg-blue-50 text-blue-700",
    4: "bg-emerald-50 text-emerald-700",
    5: "bg-red-50 text-red-700",
    6: "bg-orange-50 text-orange-700",
  };
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${map[status] ?? "bg-slate-100 text-slate-600"}`}>
      🚚 {SHIPMENT_STATUS[status]}
    </span>
  );
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/giris");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    window.setTimeout(() => setLoading(true), 0);
    api
      .get<PaginatedList<OrderSummary>>(`/api/orders/my?page=${page}&pageSize=10`)
      .then((data) => { setOrders(data.items); setTotalPages(data.totalPages); })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user, page]);

  const continuePayment = useCallback(async (orderId: string) => {
    setPayingId(orderId);
    try {
      const payment = await api.post<PaymentResult>("/api/payments/initiate", {
        orderId,
        method: "CreditCard",
      });
      if (payment.requiresRedirect && payment.redirectUrl) {
        window.location.href = payment.redirectUrl;
        return;
      }
      await api.post("/api/payments/callback", {
        transactionId: payment.transactionId,
        payload: JSON.stringify({ success: true }),
        isSuccess: true,
      });
      router.push("/odeme/basarili");
    } catch {
      // silently let detail page handle it
      router.push(`/hesabim/siparisler`);
    } finally {
      setPayingId(null);
    }
  }, [router]);

  if (authLoading || loading) {
    return <div className="py-16 text-center text-slate-400">Yükleniyor...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Siparişlerim</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">📦</p>
          <p className="text-slate-500 mb-5">Henüz siparişiniz yok</p>
          <Link href="/urunler"
            className="inline-block bg-teal-600 text-white px-6 py-2.5 rounded-xl hover:bg-teal-700 transition text-sm font-medium">
            Alışverişe Başla
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const st = orderStatusStyle(order.status);
            const ps = paymentStatusStyle(order.paymentStatus);
            const isPending = order.status === 1 || order.status === 2;
            const leftBorderColor = isPending
              ? "border-l-amber-400"
              : order.status >= 8 ? "border-l-red-300"
              : order.status >= 6 ? "border-l-emerald-400"
              : "border-l-slate-200";

            return (
              <div key={order.id}
                className={`bg-white border border-slate-200 border-l-4 ${leftBorderColor} rounded-xl overflow-hidden ${isPending ? "ring-1 ring-amber-200" : ""}`}>

                {isPending && (
                  <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-amber-800">
                      ⚠ Ödemeniz tamamlanmadı — siparişinizi kaybetmemek için ödemeye devam edin.
                    </span>
                    <button
                      onClick={() => continuePayment(order.id)}
                      disabled={payingId === order.id}
                      className="shrink-0 text-xs font-semibold bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition disabled:opacity-60">
                      {payingId === order.id ? "Yönlendiriliyor..." : "Ödemeye Devam Et →"}
                    </button>
                  </div>
                )}

                <Link href={`/hesabim/siparisler/${order.orderNumber}`} className="block p-4 hover:bg-slate-50/60 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.createdDate)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900">{formatPrice(order.grandTotal)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{order.itemCount} ürün</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${st.cls}`}>
                      {st.label}
                    </span>
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${ps.cls}`}>
                      {ps.label}
                    </span>
                    <ShipmentBadge status={order.shipmentStatus} />
                    <span className="ml-auto text-xs text-slate-400">Detay →</span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <button onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm hover:bg-slate-100 transition">
              ← Önceki
            </button>
          )}
          <span className="px-4 py-2 text-sm text-slate-500">{page} / {totalPages}</span>
          {page < totalPages && (
            <button onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm hover:bg-slate-100 transition">
              Sonraki →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
