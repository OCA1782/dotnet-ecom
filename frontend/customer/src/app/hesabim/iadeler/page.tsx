"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, formatDate } from "@/lib/utils";
import type { OrderSummary, PaginatedList } from "@/types";
import { orderStatusStyle } from "@/types";
import { useI18n } from "@/contexts/I18nContext";

// Statuses: 8=Cancelled, 9=RefundRequested, 10=Refunded
const RETURN_STATUSES = "8,9,10";

export default function IadelerPage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/giris");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    window.setTimeout(() => setLoading(true), 0);
    api
      .get<PaginatedList<OrderSummary>>(
        `/api/orders/my?page=${page}&pageSize=10&statuses=${RETURN_STATUSES}`
      )
      .then((data) => { setOrders(data.items); setTotalPages(data.totalPages); })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user, page]);

  if (authLoading || loading) {
    return (
      <div className="animate-pulse">
        <div className="h-7 bg-gray-200 rounded w-32 mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-36" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
                <div className="h-6 bg-gray-200 rounded-full w-20 shrink-0" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-8">{t("returns.title")}</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">↩️</p>
          <p className="text-slate-500">{t("returns.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const st = orderStatusStyle(order.status);
            return (
              <Link
                key={order.id}
                href={`/hesabim/siparisler/${order.orderNumber}`}
                className="block bg-white border border-slate-200 rounded-xl p-4 hover:bg-slate-50/60 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.createdDate)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900">{formatPrice(order.grandTotal)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{order.itemCount} {t("returns.item.unit")}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${st.cls}`}>
                    {st.label}
                  </span>
                  <span className="ml-auto text-xs text-slate-400">{t("returns.item.detail")}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <button onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm hover:bg-slate-100 transition">
              {t("orders.page.prev")}
            </button>
          )}
          <span className="px-4 py-2 text-sm text-slate-500">{page} / {totalPages}</span>
          {page < totalPages && (
            <button onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm hover:bg-slate-100 transition">
              {t("orders.page.next")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
