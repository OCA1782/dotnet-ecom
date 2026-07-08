"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, formatDate } from "@/lib/utils";
import type { PaginatedList } from "@/types";
import { useI18n } from "@/contexts/I18nContext";

interface CouponUsage {
  usageId: string;
  couponCode: string;
  description?: string;
  type: number;
  value: number;
  discountApplied: number;
  orderNumber: string;
  usedDate: string;
}

function formatDiscount(type: number, value: number): string {
  if (type === 1) return `%${value}`;
  if (type === 2) return formatPrice(value);
  return `${value}`;
}

export default function KuponlarPage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [usages, setUsages] = useState<CouponUsage[]>([]);
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
      .get<PaginatedList<CouponUsage>>(`/api/coupons/my?page=${page}&pageSize=10`)
      .then((data) => { setUsages(data.items); setTotalPages(data.totalPages); })
      .catch(() => setUsages([]))
      .finally(() => setLoading(false));
  }, [user, page]);

  if (authLoading || loading) {
    return (
      <div className="animate-pulse">
        <div className="h-7 bg-gray-200 rounded w-36 mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-100 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-3 bg-gray-100 rounded w-48" />
              </div>
              <div className="h-5 bg-gray-100 rounded-full w-20 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-8">{t("coupons.title")}</h1>

      {usages.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">🎟️</p>
          <p className="text-slate-500">{t("coupons.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {usages.map((u) => (
            <div key={u.usageId} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-teal-700 tracking-wider text-sm font-mono bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                      {u.couponCode}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDiscount(u.type, u.value)} {t("coupons.discount_label")}
                    </span>
                  </div>
                  {u.description && (
                    <p className="text-xs text-slate-400 mt-1">{u.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {t("coupons.order")}: {u.orderNumber} · {formatDate(u.usedDate)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-emerald-600">-{formatPrice(u.discountApplied)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t("coupons.applied")}</p>
                </div>
              </div>
            </div>
          ))}
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
