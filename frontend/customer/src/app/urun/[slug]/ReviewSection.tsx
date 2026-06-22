"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { ProductReviewsResult, ReviewReplyDto } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/contexts/I18nContext";

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400";

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
        <svg key={s} width={24} height={24} viewBox="0 0 20 20"
          fill={(hovered || value) >= s ? "#f59e0b" : "#d1d5db"}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function HeartIcon({ filled, size = 15 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? "#ef4444" : "none"} stroke={filled ? "#ef4444" : "currentColor"} strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ReplyIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

function ThumbDownIcon({ filled, size = 15 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? "#6366f1" : "none"} stroke={filled ? "#6366f1" : "currentColor"}
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
      <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  );
}

function FlagIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

// ── RepliesPanel ──────────────────────────────────────────────────────────────
function RepliesPanel({
  reviewId, productId, replyCount, user,
}: {
  reviewId: string; productId: string; replyCount: number;
  user: { userId: string; name: string } | null;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<ReviewReplyDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(replyCount);

  const loadReplies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<ReviewReplyDto[]>(
        `/api/products/${productId}/reviews/${reviewId}/replies`
      );
      setReplies(data);
      setCount(data.length);
    } finally {
      setLoading(false);
    }
  }, [productId, reviewId]);

  function handleToggle() {
    if (!open && replies.length === 0 && count > 0) loadReplies();
    setOpen(v => !v);
  }

  async function handleReply() {
    if (!body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/api/products/${productId}/reviews/${reviewId}/replies`, { body });
      setBody("");
      setShowInput(false);
      await loadReplies();
      if (!open) setOpen(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-teal-600 transition"
        >
          <ReplyIcon />
          {count > 0
            ? `${count} yanıt${open ? "ı gizle" : " görüntüle"}`
            : "Yanıtlar"}
        </button>

        {user && (
          <button
            onClick={() => setShowInput(v => !v)}
            className="text-xs text-teal-600 hover:text-teal-800 font-medium transition"
          >
            {showInput ? t("prod2.review.cancel") : t("prod2.review.reply")}
          </button>
        )}
      </div>

      {showInput && (
        <div className="mt-2 flex gap-2 items-start pl-4 border-l-2 border-slate-100">
          <div className="flex-1">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={2}
              placeholder="Yanıtınızı yazın..."
              maxLength={1000}
              className={`${INPUT} resize-none text-xs`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <button
            onClick={handleReply}
            disabled={submitting || !body.trim()}
            className="shrink-0 bg-teal-600 text-white text-xs font-medium px-3 py-2 rounded-xl hover:bg-teal-700 transition disabled:opacity-50 mt-0.5"
          >
            {submitting ? "..." : t("prod2.review.submit_btn")}
          </button>
        </div>
      )}

      {open && (
        <div className="mt-2 pl-4 border-l-2 border-slate-100 space-y-3">
          {loading ? (
            <p className="text-xs text-slate-400">{t("prod2.review.loading")}</p>
          ) : replies.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Henüz yanıt yok.</p>
          ) : (
            replies.map((rep) => (
              <div key={rep.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-600 mt-0.5">
                  {rep.userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">{rep.userName}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rep.createdDate).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{rep.body}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── ReviewSection ─────────────────────────────────────────────────────────────
export default function ReviewSection({ productId }: { productId: string }) {
  const { t } = useI18n();
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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editedIds, setEditedIds] = useState<Set<string>>(new Set());

  type VoteState = { likeCount: number; liked: boolean; dislikeCount: number; disliked: boolean };
  const [voteState, setVoteState] = useState<Record<string, VoteState>>({});
  const [reportModal, setReportModal] = useState<{ reviewId: string } | null>(null);
  const [reportReason, setReportReason] = useState("spam");
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportDone, setReportDone] = useState<Set<string>>(new Set());

  const REPORT_REASONS = [
    { value: "spam",           label: t("prod2.review.report.reason.spam") },
    { value: "inappropriate",  label: t("prod2.review.report.reason.inappropriate") },
    { value: "offensive",      label: t("prod2.review.report.reason.offensive") },
    { value: "misinformation", label: t("prod2.review.report.reason.misinformation") },
    { value: "other",          label: t("prod2.review.report.reason.other") },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<ProductReviewsResult>(
        `/api/products/${productId}/reviews?page=${page}&pageSize=5`
      );
      setData(result);
      const map: Record<string, VoteState> = {};
      result.reviews.items.forEach(r => {
        map[r.id] = {
          likeCount: r.likeCount, liked: r.isLikedByUser,
          dislikeCount: r.dislikeCount, disliked: r.isDislikedByUser,
        };
      });
      setVoteState(prev => ({ ...prev, ...map }));
    } finally {
      setLoading(false);
    }
  }, [productId, page]);

  useEffect(() => { window.setTimeout(() => load(), 0); }, [load]);

  async function handleSubmit() {
    if (rating === 0) { setSubmitError(t("prod2.review.rating_required")); return; }
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

  function startEdit(r: { id: string; rating: number; title?: string; body: string }) {
    setEditingId(r.id);
    setEditRating(r.rating);
    setEditTitle(r.title ?? "");
    setEditBody(r.body);
    setEditError(null);
  }

  function cancelEdit() { setEditingId(null); setEditError(null); }

  async function handleUpdate() {
    if (editRating === 0) { setEditError(t("prod2.review.rating_required")); return; }
    if (!editBody.trim()) { setEditError("Yorum metni zorunludur."); return; }
    setEditSubmitting(true);
    setEditError(null);
    try {
      const id = editingId!;
      await api.put(`/api/products/${productId}/reviews/${id}`, {
        rating: editRating, title: editTitle, body: editBody,
      });
      setEditingId(null);
      setEditedIds(prev => new Set([...prev, id]));
      load();
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Güncelleme başarısız.");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleLike(reviewId: string) {
    if (!user) return;
    const cur = voteState[reviewId] ?? { likeCount: 0, liked: false, dislikeCount: 0, disliked: false };
    setVoteState(prev => ({
      ...prev,
      [reviewId]: {
        likeCount:    cur.liked ? cur.likeCount - 1 : cur.likeCount + 1,
        liked:        !cur.liked,
        dislikeCount: cur.liked ? cur.dislikeCount : (cur.disliked ? cur.dislikeCount - 1 : cur.dislikeCount),
        disliked:     cur.liked ? cur.disliked : false,
      },
    }));
    try {
      await api.post(`/api/products/${productId}/reviews/${reviewId}/like`, {});
    } catch {
      setVoteState(prev => ({ ...prev, [reviewId]: cur }));
    }
  }

  async function handleDislike(reviewId: string) {
    if (!user) return;
    const cur = voteState[reviewId] ?? { likeCount: 0, liked: false, dislikeCount: 0, disliked: false };
    setVoteState(prev => ({
      ...prev,
      [reviewId]: {
        dislikeCount: cur.disliked ? cur.dislikeCount - 1 : cur.dislikeCount + 1,
        disliked:     !cur.disliked,
        likeCount:    cur.disliked ? cur.likeCount : (cur.liked ? cur.likeCount - 1 : cur.likeCount),
        liked:        cur.disliked ? cur.liked : false,
      },
    }));
    try {
      await api.post(`/api/products/${productId}/reviews/${reviewId}/dislike`, {});
    } catch {
      setVoteState(prev => ({ ...prev, [reviewId]: cur }));
    }
  }

  async function handleReport() {
    if (!reportModal) return;
    setReporting(true);
    setReportError(null);
    try {
      await api.post(`/api/products/${productId}/reviews/${reportModal.reviewId}/report`, { reason: reportReason });
      setReportDone(prev => new Set([...prev, reportModal.reviewId]));
      setReportModal(null);
    } catch (e: unknown) {
      setReportError(e instanceof Error ? e.message : "Şikayet gönderilemedi.");
    } finally {
      setReporting(false);
    }
  }

  return (
    <div className="border-t border-slate-200 pt-10 mt-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900">{t("prod2.review.title")}</h2>
        {user && !submitted && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="text-sm text-slate-600 border border-slate-300 rounded-xl px-4 py-1.5 hover:bg-slate-50 transition"
          >
            {showForm ? t("prod2.review.cancel") : t("prod2.review.write_title")}
          </button>
        )}
        {!user && (
          <a href="/giris" className="text-xs text-teal-600 hover:underline">
            {t("prod2.review.login_to_review")}
          </a>
        )}
      </div>

      {/* Rating summary */}
      {data && data.totalCount > 0 && (
        <div className="flex gap-8 mb-8 p-5 bg-slate-50 rounded-xl">
          <div className="text-center">
            <p className="text-4xl font-bold text-slate-900">{data.averageRating.toFixed(1)}</p>
            <Stars rating={Math.round(data.averageRating)} size={18} />
            <p className="text-xs text-slate-500 mt-1">{t("prod2.review.count").replace("{n}", String(data.totalCount))}</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = data.ratingDistribution[star - 1] ?? 0;
              const pct = data.totalCount > 0 ? (count / data.totalCount) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-4">{star}</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-5">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write form */}
      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
          <h3 className="font-medium text-slate-800 mb-4">{t("prod2.review.write_title")}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t("prod2.review.rating_label")}</label>
              <ClickableStars value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t("prod2.review.title_label")}</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                className={INPUT} placeholder="Kısa bir başlık (isteğe bağlı)" maxLength={150} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t("prod2.review.body_label")}</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)}
                rows={4} className={`${INPUT} resize-none`}
                placeholder={t("prod2.review.body_placeholder")} maxLength={2000} />
            </div>
          </div>
          {submitError && <p className="mt-2 text-xs text-red-600">{submitError}</p>}
          <button onClick={handleSubmit} disabled={submitting}
            className="mt-4 bg-teal-600 text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-teal-700 transition disabled:opacity-50">
            {submitting ? t("prod2.review.submitting") : t("prod2.review.submit_btn")}
          </button>
        </div>
      )}

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 mb-6">
          {t("prod2.review.success")}
        </div>
      )}

      {editedIds.size > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 mb-4 flex items-center gap-2">
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Yorumunuz güncellendi ve tekrar onay için gönderildi. Onaylanınca tekrar görünecektir.
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <p className="text-sm text-slate-400">{t("prod2.review.loading")}</p>
      ) : !data || data.totalCount === 0 ? (
        <p className="text-sm text-slate-500">{t("prod2.review.no_reviews")} {t("prod2.review.be_first")}</p>
      ) : (
        <div className="space-y-6">
          {data.reviews.items.map((r) => {
            const isOwn    = user && r.userId === user.userId;
            const isEditing = editingId === r.id;
            const vote = voteState[r.id] ?? {
              likeCount: r.likeCount, liked: r.isLikedByUser,
              dislikeCount: r.dislikeCount, disliked: r.isDislikedByUser,
            };

            return (
              <div key={r.id} className="border-b border-slate-100 pb-5 last:border-b-0">
                {isEditing ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">{t("prod2.review.rating_label")}</label>
                      <ClickableStars value={editRating} onChange={setEditRating} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">{t("prod2.review.title_label")}</label>
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                        className={INPUT} maxLength={150} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">{t("prod2.review.body_label")}</label>
                      <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)}
                        rows={3} className={`${INPUT} resize-none`} maxLength={2000} />
                    </div>
                    {editError && <p className="text-xs text-red-600">{editError}</p>}
                    <div className="flex gap-2">
                      <button onClick={handleUpdate} disabled={editSubmitting}
                        className="bg-teal-600 text-white text-sm font-medium px-4 py-1.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-50">
                        {editSubmitting ? "Kaydediliyor..." : "Kaydet"}
                      </button>
                      <button onClick={cancelEdit}
                        className="text-sm text-slate-600 border border-slate-300 px-4 py-1.5 rounded-xl hover:bg-slate-50 transition">
                        {t("prod2.review.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <Stars rating={r.rating} size={14} />
                        {r.title && <p className="font-medium text-slate-900 text-sm mt-1">{r.title}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-slate-600">{r.userName}</p>
                        <p className="text-xs text-slate-400">{new Date(r.createdDate).toLocaleDateString("tr-TR")}</p>
                        {isOwn && (
                          <button onClick={() => startEdit(r)}
                            className="text-xs text-teal-600 hover:text-teal-800 font-medium mt-1 transition">
                            Düzenle
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed">{r.body}</p>

                    {r.isVerifiedPurchase && (
                      <span className="inline-block mt-1 text-xs text-green-600 font-medium">
                        ✓ {t("prod2.review.verified")}
                      </span>
                    )}

                    <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-slate-100 flex-wrap">
                      <button
                        onClick={() => handleLike(r.id)}
                        disabled={!user}
                        className={`flex items-center gap-1.5 text-xs font-medium transition ${
                          !user ? "text-slate-400 cursor-default"
                            : vote.liked ? "text-red-500 hover:text-red-400"
                            : "text-slate-500 hover:text-red-400"
                        }`}
                      >
                        <HeartIcon filled={vote.liked} size={14} />
                        {vote.likeCount > 0 && <span className="font-semibold">{vote.likeCount}</span>}
                        <span>{t("prod2.review.helpful")}</span>
                      </button>

                      <button
                        onClick={() => handleDislike(r.id)}
                        disabled={!user}
                        className={`flex items-center gap-1.5 text-xs font-medium transition ${
                          !user ? "text-slate-400 cursor-default"
                            : vote.disliked ? "text-indigo-500 hover:text-indigo-400"
                            : "text-slate-500 hover:text-indigo-400"
                        }`}
                      >
                        <ThumbDownIcon filled={vote.disliked} size={14} />
                        {vote.dislikeCount > 0 && <span className="font-semibold">{vote.dislikeCount}</span>}
                        <span>{t("prod2.review.not_helpful")}</span>
                      </button>

                      {user && !isOwn && (
                        <button
                          onClick={() => {
                            setReportModal({ reviewId: r.id });
                            setReportReason("spam");
                            setReportError(null);
                          }}
                          disabled={reportDone.has(r.id)}
                          className={`flex items-center gap-1.5 text-xs font-medium transition ${
                            reportDone.has(r.id)
                              ? "text-amber-500 cursor-default"
                              : "text-slate-400 hover:text-amber-500"
                          }`}
                        >
                          <FlagIcon size={12} />
                          <span>{reportDone.has(r.id) ? "Şikayet edildi" : t("prod2.review.report")}</span>
                        </button>
                      )}

                      {!user && (
                        <a href="/giris"
                          className="text-xs text-teal-600 hover:text-teal-800 hover:underline transition ml-1">
                          Etkileşim için giriş yapın →
                        </a>
                      )}
                    </div>

                    <RepliesPanel
                      reviewId={r.id}
                      productId={productId}
                      replyCount={r.replyCount}
                      user={user}
                    />
                  </>
                )}
              </div>
            );
          })}

          {data.reviews.totalPages > 1 && (
            <div className="flex gap-2 pt-2">
              {Array.from({ length: data.reviews.totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded-xl text-xs transition ${
                    p === page ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <FlagIcon size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{t("prod2.review.report.title")}</h3>
                <p className="text-xs text-slate-400">{t("prod2.review.report.reason")}</p>
              </div>
            </div>

            <div className="space-y-2">
              {REPORT_REASONS.map(r => (
                <label key={r.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reportReason === r.value}
                    onChange={() => setReportReason(r.value)}
                    className="w-4 h-4 text-amber-500 border-slate-300 focus:ring-amber-400"
                  />
                  <span className="text-sm text-slate-700">{r.label}</span>
                </label>
              ))}
            </div>

            {reportError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {reportError}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={handleReport} disabled={reporting}
                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition">
                {reporting ? t("prod2.review.submitting") : t("prod2.review.report.submit")}
              </button>
              <button onClick={() => setReportModal(null)}
                className="flex-1 border border-slate-300 text-slate-600 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition">
                {t("prod2.review.report.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
