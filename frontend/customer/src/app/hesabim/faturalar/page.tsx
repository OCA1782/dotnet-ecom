"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, formatDate } from "@/lib/utils";
import type { PaginatedList } from "@/types";
import { useI18n } from "@/contexts/I18nContext";

interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  status: number;
  docType: number;
  totalAmount: number;
  createdDate: string;
}

const STATUS_CLS: Record<number, string> = {
  1: "bg-slate-100 text-slate-600",
  2: "bg-amber-50 text-amber-700",
  3: "bg-emerald-50 text-emerald-700",
  4: "bg-red-50 text-red-600",
  5: "bg-red-100 text-red-700",
};

export default function FaturalarPage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const STATUS_LABEL: Record<number, string> = {
    1: t("invoice.status.draft"),
    2: t("invoice.status.pending"),
    3: t("invoice.status.sent"),
    4: t("invoice.status.cancelled"),
    5: t("invoice.status.error"),
  };

  const DOC_TYPE: Record<number, string> = {
    1: t("invoice.type.archive"),
    2: t("invoice.type.einvoice"),
    3: t("invoice.type.waybill"),
  };

  useEffect(() => {
    if (!authLoading && !user) router.replace("/giris");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    window.setTimeout(() => setLoading(true), 0);
    api
      .get<PaginatedList<Invoice>>(`/api/invoices/my?page=${page}&pageSize=10`)
      .then((data) => { setInvoices(data.items); setTotalPages(data.totalPages); })
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [user, page]);

  if (authLoading || loading) {
    return <div className="py-16 text-center text-slate-400">{t("invoice.loading")}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-8">{t("invoice.title")}</h1>

      {invoices.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">🧾</p>
          <p className="text-slate-500">{t("invoice.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const cls = STATUS_CLS[inv.status] ?? "bg-slate-100 text-slate-500";
            const label = STATUS_LABEL[inv.status] ?? "Bilinmiyor";
            return (
              <div key={inv.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{inv.invoiceNumber}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t("invoice.order")}: {inv.orderNumber} · {formatDate(inv.createdDate)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900">{formatPrice(inv.totalAmount)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{DOC_TYPE[inv.docType] ?? t("invoice.doc_type")}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>
                    {label}
                  </span>
                </div>
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
