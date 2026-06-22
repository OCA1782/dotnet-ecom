"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import type { PaginatedList } from "@/types";
import { useI18n } from "@/contexts/I18nContext";

interface MyReview {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  rating: number;
  title?: string;
  body: string;
  isApproved: boolean;
  isVerifiedPurchase: boolean;
  createdDate: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-sm">
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

export default function YorumlarPage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<MyReview[]>([]);
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
      .get<PaginatedList<MyReview>>(`/api/reviews/my?page=${page}&pageSize=10`)
      .then((data) => { setReviews(data.items); setTotalPages(data.totalPages); })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [user, page]);

  if (authLoading || loading) {
    return <div className="py-16 text-center text-slate-400">{t("reviews.loading")}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-8">{t("reviews.title")}</h1>

      {reviews.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">💬</p>
          <p className="text-slate-500">{t("reviews.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/urunler/${r.productSlug}`}
                    className="font-semibold text-slate-900 text-sm hover:text-teal-700 transition line-clamp-1"
                  >
                    {r.productName}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={r.rating} />
                    {r.title && (
                      <span className="text-xs font-medium text-slate-700">{r.title}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-3">{r.body}</p>
                </div>
                <div className="text-right shrink-0">
                  {r.isApproved ? (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      {t("reviews.approved")}
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      {t("reviews.pending")}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                <span>{formatDate(r.createdDate)}</span>
                {r.isVerifiedPurchase && (
                  <span className="text-emerald-600 font-medium">✓ {t("reviews.verified")}</span>
                )}
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
              {t("reviews.page.prev")}
            </button>
          )}
          <span className="px-4 py-2 text-sm text-slate-500">{page} / {totalPages}</span>
          {page < totalPages && (
            <button onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm hover:bg-slate-100 transition">
              {t("reviews.page.next")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
