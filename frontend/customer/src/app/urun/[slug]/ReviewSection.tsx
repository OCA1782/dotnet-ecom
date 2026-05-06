"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { ProductReviewsResult } from "@/types";
import { useAuth } from "@/hooks/useAuth";

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 20 20" fill={s <= rating ? "#f59e0b" : "#d1d5db"}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function ClickableStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <span className="flex gap-1 cursor-pointer">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width={24}
          height={24}
          viewBox="0 0 20 20"
          fill={(hovered || value) >= s ? "#f59e0b" : "#d1d5db"}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default function ReviewSection({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<ProductReviewsResult | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<ProductReviewsResult>(
        `/api/products/${productId}/reviews?page=${page}&pageSize=5`
      );
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [productId, page]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit() {
    if (rating === 0) { setSubmitError("Lütfen bir puan seçin."); return; }
    if (!body.trim()) { setSubmitError("Yorum metni zorunludur."); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/api/products/${productId}/reviews`, { rating, title, body });
      setSubmitted(true);
      setShowForm(false);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-t border-zinc-200 pt-10 mt-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-zinc-900">Müşteri Yorumları</h2>
        {user && !submitted && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="text-sm text-zinc-600 border border-zinc-300 rounded-lg px-4 py-1.5 hover:bg-zinc-50 transition"
          >
            {showForm ? "Vazgeç" : "Yorum Yaz"}
          </button>
        )}
      </div>

      {/* Summary */}
      {data && data.totalCount > 0 && (
        <div className="flex gap-8 mb-8 p-5 bg-zinc-50 rounded-xl">
          <div className="text-center">
            <p className="text-4xl font-bold text-zinc-900">{data.averageRating.toFixed(1)}</p>
            <Stars rating={Math.round(data.averageRating)} size={18} />
            <p className="text-xs text-zinc-500 mt-1">{data.totalCount} yorum</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = data.ratingDistribution[star - 1] ?? 0;
              const pct = data.totalCount > 0 ? (count / data.totalCount) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 w-4">{star}</span>
                  <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-400 w-5">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 mb-6">
          <h3 className="font-medium text-zinc-800 mb-4">Yorumunuzu Yazın</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Puan *</label>
              <ClickableStars value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Başlık</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="Kısa bir başlık (isteğe bağlı)"
                maxLength={150}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Yorum *</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                placeholder="Ürün hakkındaki deneyiminizi paylaşın..."
                maxLength={2000}
              />
            </div>
          </div>
          {submitError && <p className="mt-2 text-xs text-red-600">{submitError}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-4 bg-zinc-900 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-zinc-700 transition disabled:opacity-50"
          >
            {submitting ? "Gönderiliyor..." : "Yorum Gönder"}
          </button>
        </div>
      )}

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 mb-6">
          Yorumunuz alındı. Onaylandıktan sonra görünecektir.
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <p className="text-sm text-zinc-400">Yorumlar yükleniyor...</p>
      ) : !data || data.totalCount === 0 ? (
        <p className="text-sm text-zinc-500">Henüz yorum yapılmamış.</p>
      ) : (
        <div className="space-y-5">
          {data.reviews.items.map((r) => (
            <div key={r.id} className="border-b border-zinc-100 pb-5">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <Stars rating={r.rating} size={14} />
                  {r.title && <p className="font-medium text-zinc-900 text-sm mt-1">{r.title}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-zinc-500">{r.userName}</p>
                  <p className="text-xs text-zinc-400">{new Date(r.createdDate).toLocaleDateString("tr-TR")}</p>
                </div>
              </div>
              <p className="text-sm text-zinc-700 leading-relaxed">{r.body}</p>
              {r.isVerifiedPurchase && (
                <span className="inline-block mt-1 text-xs text-green-600 font-medium">Doğrulanmış Satın Alma</span>
              )}
            </div>
          ))}

          {data.reviews.totalPages > 1 && (
            <div className="flex gap-2 pt-2">
              {Array.from({ length: data.reviews.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded-lg text-xs transition ${
                    p === page ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
