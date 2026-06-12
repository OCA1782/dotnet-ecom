"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import type { PaginatedList } from "@/types";
import { exportToExcel } from "@/lib/excel";
import {
  Download, Search, CheckCircle, XCircle, Trash2,
  MessageSquare, Bell, ThumbsUp, ThumbsDown, Flag,
  MessageCircle, AlertTriangle, X, History, ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import RichTextEditor from "@/components/RichTextEditor";

interface AdminReviewDto {
  id: string;
  productId: string;
  productName: string;
  userName: string;
  userEmail: string;
  rating: number;
  title?: string;
  body: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  rejectionNote?: string;
  createdDate: string;
  likeCount: number;
  dislikeCount: number;
  replyCount: number;
  reportCount: number;
  hasUnresolvedReports: boolean;
  dataSource?: string;
}

interface ReviewReportDto {
  id: string;
  userId: string;
  userName: string;
  reason: string;
  isResolved: boolean;
  createdDate: string;
}

interface ReviewReplyDto {
  id: string;
  userId: string;
  userName: string;
  body: string;
  createdDate: string;
}

interface AuditLog {
  id: string;
  userEmail: string;
  action: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  createdDate: string;
}

type SortField = "createdDate" | "dataSource";
function buildSortKey(field: SortField, dir: "asc" | "desc") { return `${field}-${dir}`; }

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField | null; sortDir: "asc" | "desc" }) {
  if (sortField !== field) return <ChevronsUpDown size={12} className="opacity-30 ml-1 inline-block" />;
  return sortDir === "asc" ? <ChevronUp size={12} className="text-teal-600 ml-1 inline-block" /> : <ChevronDown size={12} className="text-teal-600 ml-1 inline-block" />;
}

interface RejectState { id: string; note: string; notify: boolean }

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={14} height={14} viewBox="0 0 20 20" fill={s <= rating ? "#f59e0b" : "#cbd5e1"}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

const ACTION_COLORS: Record<string, string> = {
  "Onaylandı": "bg-green-100 text-green-700",
  "Reddedildi": "bg-red-100 text-red-700",
  "Silindi": "bg-slate-100 text-slate-600",
  "ApproveReview": "bg-green-100 text-green-700",
  "DeleteReview": "bg-red-100 text-red-700",
  "Güncellendi — Yorum": "bg-blue-100 text-blue-700",
  "Silindi — Yorum": "bg-slate-100 text-slate-600",
};

export default function YorumlarPage() {
  const { t } = useI18n();
  const [reviews, setReviews] = useState<AdminReviewDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isApproved, setIsApproved] = useState<"" | "true" | "false">("");
  const [hasReports, setHasReports] = useState<"" | "true">("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [rejectState, setRejectState] = useState<RejectState | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [pageSize, setPageSize] = useState(20);
  const PAGE_SIZES = [20, 50, 100];
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const REASON_LABELS: Record<string, string> = {
    spam:           t("reason.spam", "Spam / Reklam"),
    inappropriate:  t("reason.inappropriate", "Uygunsuz İçerik"),
    offensive:      t("reason.offensive", "Hakaret / Saldırgan"),
    misinformation: t("reason.misinformation", "Yanlış Bilgi"),
    other:          t("reason.other", "Diğer"),
  };

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  }

  // Şikayet modalı
  const [reportsModal, setReportsModal] = useState<{ reviewId: string; productName: string } | null>(null);
  const [reports, setReports] = useState<ReviewReportDto[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Yanıt modalı
  const [repliesModal, setRepliesModal] = useState<{ reviewId: string; productName: string } | null>(null);
  const [replies, setReplies] = useState<ReviewReplyDto[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);

  // Per-row history modal
  const [historyTarget, setHistoryTarget] = useState<AdminReviewDto | null>(null);
  const [historyLogs, setHistoryLogs] = useState<AuditLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadReviewHistory = useCallback(async (reviewId: string) => {
    setHistoryLoading(true);
    setHistoryLogs([]);
    try {
      const data = await api.get<{ items: AuditLog[]; totalCount: number }>(`/api/admin/audit-logs/entity/Yorum/${reviewId}`);
      setHistoryLogs(data.items);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  function openHistory(r: AdminReviewDto) {
    setHistoryTarget(r);
    loadReviewHistory(r.id);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (isApproved !== "") params.set("isApproved", isApproved);
      if (hasReports !== "") params.set("hasReports", hasReports);
      if (search.trim()) params.set("search", search.trim());
      if (sortField) params.set("sortBy", buildSortKey(sortField, sortDir));
      const data = await api.get<PaginatedList<AdminReviewDto>>(`/api/admin/reviews?${params}`);
      setReviews(data.items);
      setTotal(data.totalCount);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, isApproved, hasReports, search, sortField, sortDir]);

  useEffect(() => {
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  async function handleApprove(id: string, approved: boolean) {
    try {
      await api.patch(`/api/admin/reviews/${id}/approve`, { approved });
      setMsg({ text: approved ? t("msg.reviewApproved", "Yorum onaylandı.") : t("msg.reviewApprovalRemoved", "Yorum onayı kaldırıldı."), ok: approved });
      load();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : t("msg.error", "Hata oluştu."), ok: false });
    }
  }

  async function handleReject() {
    if (!rejectState) return;
    try {
      await api.patch(`/api/admin/reviews/${rejectState.id}/approve`, {
        approved: false,
        rejectionNote: rejectState.note || null,
        notifyUser: rejectState.notify,
      });
      setMsg({ text: rejectState.notify ? t("msg.reviewRejectedNotified", "Yorum reddedildi ve kullanıcıya bildirildi.") : t("msg.reviewRejected", "Yorum reddedildi."), ok: false });
      setRejectState(null);
      load();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : t("msg.operationFailed", "İşlem başarısız."), ok: false });
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/api/admin/reviews/${id}`);
      load();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : t("msg.deleteFailed", "Silinemedi."), ok: false });
    }
  }

  async function openReports(reviewId: string, productName: string) {
    setReportsModal({ reviewId, productName });
    setReportsLoading(true);
    try {
      const data = await api.get<ReviewReportDto[]>(`/api/admin/reviews/${reviewId}/reports`);
      setReports(data);
    } catch {
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  }

  async function openReplies(reviewId: string, productName: string) {
    setRepliesModal({ reviewId, productName });
    setRepliesLoading(true);
    try {
      const data = await api.get<ReviewReplyDto[]>(`/api/admin/reviews/${reviewId}/replies`);
      setReplies(data);
    } catch {
      setReplies([]);
    } finally {
      setRepliesLoading(false);
    }
  }

  async function resolveReport(reviewId: string, reportId: string) {
    try {
      await api.post(`/api/admin/reviews/${reviewId}/reports/${reportId}/resolve`, {});
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, isResolved: true } : r));
      load();
    } catch { }
  }

  const totalPages = Math.ceil(total / pageSize);
  const pendingCount = reviews.filter(r => !r.isApproved && !r.rejectionNote).length;
  const reportedCount = reviews.filter(r => r.hasUnresolvedReports).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl overflow-hidden shadow-sm"
        style={{ background: reportedCount > 0
          ? "linear-gradient(135deg, #b45309 0%, #d97706 60%, #f59e0b 100%)"
          : pendingCount > 0
          ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 60%, #4f46e5 100%)"
          : "linear-gradient(135deg, #0f766e 0%, #0d9488 60%, #14b8a6 100%)" }}>
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 shadow">
              <MessageSquare size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">{t("tab.comments", "Yorumlar")}</h1>
              <p className="text-white/70 text-xs mt-0.5">
                {t("ui.reviewsSubtitle", "Müşteri yorumlarını onayla, reddet, yanıtları ve şikayetleri yönet")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {reportedCount > 0 && (
              <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5">
                <AlertTriangle size={13} className="text-white" />
                <span className="text-white text-xs font-bold">{reportedCount} {t("ui.complaint", "şikayet")}</span>
              </div>
            )}
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5">
                <span className="text-white text-xs font-bold">{pendingCount} {t("status.pending", "Bekliyor").toLowerCase()}</span>
              </div>
            )}
            <button
              onClick={() => exportToExcel(
                reviews.map(r => ({
                  [t("col.product", "Ürün")]: r.productName,
                  [t("col.user", "Kullanıcı")]: r.userName,
                  [t("col.email", "E-posta")]: r.userEmail,
                  [t("col.rating", "Puan")]: r.rating,
                  [t("col.title", "Başlık")]: r.title ?? "",
                  [t("col.comment", "Yorum")]: r.body,
                  [t("status.approved", "Onaylı")]: r.isApproved ? t("action.yes", "Evet") : t("action.no", "Hayır"),
                  [t("ui.rejectionNote", "Red Notu")]: r.rejectionNote ?? "",
                  [t("ui.verifiedPurchase", "Onaylı Alış")]: r.isVerifiedPurchase ? t("action.yes", "Evet") : t("action.no", "Hayır"),
                  [t("ui.likes", "Beğeni")]: r.likeCount,
                  [t("ui.dislikes", "Beğenmeme")]: r.dislikeCount,
                  [t("ui.replies", "Yanıt")]: r.replyCount,
                  [t("ui.complaints", "Şikayet")]: r.reportCount,
                })),
                "yorumlar", t("tab.comments", "Yorumlar")
              )}
              className="flex items-center gap-2 bg-white text-slate-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-slate-50 transition shadow"
            >
              <Download size={14} /> Excel
            </button>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`text-sm px-4 py-3 rounded-xl flex items-center justify-between ${
          msg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-4 text-xs underline">{t("action.close", "Kapat")}</button>
        </div>
      )}

      {/* Filtreler */}
      <div className="flex gap-3 flex-wrap">
        <form onSubmit={e => { e.preventDefault(); setPage(1); setSearch(searchInput); }} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={t("ui.reviewSearchPlaceholder", "Ürün, yorum veya e-posta ara...")}
              className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 w-64 text-slate-900 bg-white"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-violet-600 text-white text-sm rounded-xl hover:bg-violet-700 transition">{t("action.search", "Ara")}</button>
          {(search || searchInput) && (
            <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
              className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">{t("action.clear", "Temizle")}</button>
          )}
        </form>
        <select
          value={isApproved}
          onChange={e => { setIsApproved(e.target.value as "" | "true" | "false"); setPage(1); }}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="">{t("filter.allStatus", "Tüm Durumlar")}</option>
          <option value="false">{t("ui.pendingApproval", "Onay Bekleyenler")}</option>
          <option value="true">{t("ui.approved", "Onaylananlar")}</option>
        </select>
        <button
          onClick={() => { setHasReports(p => p === "true" ? "" : "true"); setPage(1); }}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition ${
            hasReports === "true"
              ? "bg-amber-500 text-white border-amber-500"
              : "bg-white text-slate-600 border-slate-300 hover:bg-amber-50 hover:border-amber-300"
          }`}
        >
          <Flag size={13} /> {t("ui.complained", "Şikayetli")}
        </button>
        <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400">
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s} {t("table.perPage", "kayıt")}</option>)}
        </select>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-slate-400">{t("table.loading", "Yükleniyor...")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">{t("col.product", "Ürün")} / {t("col.user", "Kullanıcı")}</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">{t("col.rating", "Puan")}</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">{t("col.comment", "Yorum")}</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">{t("col.interactions", "Etkileşimler")}</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs"><button onClick={() => handleSort("createdDate")} className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">{t("col.date", "Tarih")} <SortIcon field="createdDate" sortField={sortField} sortDir={sortDir} /></button></th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">{t("col.status", "Durum")}</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs"><button onClick={() => handleSort("dataSource")} className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">{t("col.source", "Kaynak")} <SortIcon field="dataSource" sortField={sortField} sortDir={sortDir} /></button></th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviews.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">{t("table.noData", "Kayıt bulunamadı")}</td></tr>
              ) : reviews.map(r => (
                <tr key={r.id} className={`align-top ${r.hasUnresolvedReports ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-slate-50"}`}>
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="text-slate-800 text-xs font-semibold line-clamp-2">{r.productName}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{r.userName}</p>
                    <p className="text-slate-400 text-xs">{r.userEmail}</p>
                    {r.isVerifiedPurchase && (
                      <span className="text-green-600 text-xs">✓ {t("ui.verifiedPurchaseBadge", "Doğrulanmış")}</span>
                    )}
                    {r.hasUnresolvedReports && (
                      <span className="flex items-center gap-1 text-amber-600 text-xs mt-0.5 font-semibold">
                        <AlertTriangle size={10} /> {t("ui.hasComplaint", "Şikayet var")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Stars rating={r.rating} />
                  </td>
                  <td className="px-4 py-3 max-w-[260px]">
                    {r.title && <p className="text-slate-800 text-xs font-semibold mb-0.5">{r.title}</p>}
                    <p className="text-slate-500 text-xs line-clamp-3">{r.body}</p>
                    {r.rejectionNote && (
                      <p className="mt-1 text-xs text-red-500 bg-red-50 rounded-lg px-2 py-1 line-clamp-2">
                        {t("ui.rejectionNoteLabel", "Red notu")}: {r.rejectionNote}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <ThumbsUp size={11} className="text-red-400" /> {r.likeCount}
                        <ThumbsDown size={11} className="text-indigo-400 ml-1.5" /> {r.dislikeCount}
                      </span>
                      {r.replyCount > 0 ? (
                        <button
                          onClick={() => openReplies(r.id, r.productName)}
                          className="flex items-center gap-1 text-teal-600 font-semibold hover:underline transition"
                        >
                          <MessageCircle size={11} className="text-teal-500" /> {r.replyCount} {t("ui.reply", "yanıt")}
                        </button>
                      ) : (
                        <span className="flex items-center gap-1">
                          <MessageCircle size={11} className="text-teal-500" /> 0 {t("ui.reply", "yanıt")}
                        </span>
                      )}
                      {r.reportCount > 0 && (
                        <button
                          onClick={() => openReports(r.id, r.productName)}
                          className={`flex items-center gap-1 font-semibold transition hover:underline ${
                            r.hasUnresolvedReports ? "text-amber-600" : "text-slate-400"
                          }`}
                        >
                          <Flag size={11} /> {r.reportCount} {t("ui.complaint", "şikayet")}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(r.createdDate).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3">
                    {r.isApproved ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-700">{t("status.approved", "Onaylı")}</span>
                    ) : r.rejectionNote ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700">{t("status.rejected", "Reddedildi")}</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700">{t("status.pending", "Bekliyor")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.dataSource ? <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 whitespace-nowrap">{r.dataSource}</span> : <span className="text-xs text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1.5 items-center">
                      <button onClick={() => openHistory(r)} title={t("tab.history", "Geçmiş")}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white shadow-sm transition-all active:scale-95">
                        <History size={14} />
                      </button>
                      {!r.isApproved ? (
                        <button onClick={() => handleApprove(r.id, true)} title={t("action.approve", "Onayla")}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-green-50 text-green-600 hover:bg-green-500 hover:text-white shadow-sm transition-all active:scale-95">
                          <CheckCircle size={16} />
                        </button>
                      ) : (
                        <button onClick={() => handleApprove(r.id, false)} title={t("ui.removeApproval", "Onayı Kaldır")}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white shadow-sm transition-all active:scale-95">
                          <XCircle size={16} />
                        </button>
                      )}
                      <button onClick={() => setRejectState({ id: r.id, note: "", notify: true })} title={t("ui.rejectAndNotify", "Reddet + Bildir")}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white shadow-sm transition-all active:scale-95">
                        <Bell size={14} />
                      </button>
                      <button onClick={() => setConfirmDelete(r.id)} title={t("action.delete", "Sil")}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white shadow-sm transition-all active:scale-95">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && <button onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">{t("table.prev", "← Önceki")}</button>}
          <span className="px-4 py-2 text-sm text-slate-500">{page} / {totalPages}</span>
          {page < totalPages && <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">{t("table.next", "Sonraki →")}</button>}
        </div>
      )}

      {/* ── Yorum Geçmişi Modalı ── */}
      {historyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div>
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <History size={16} className="text-amber-500" /> {t("ui.reviewHistory", "Yorum Geçmişi")}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{historyTarget.productName} — {historyTarget.userName}</p>
              </div>
              <button onClick={() => setHistoryTarget(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              {historyLoading ? (
                <p className="p-8 text-center text-slate-400">{t("table.loading", "Yükleniyor...")}</p>
              ) : historyLogs.length === 0 ? (
                <p className="p-8 text-center text-slate-400">{t("ui.noHistoryFound", "Bu yoruma ait hareket kaydı bulunamadı.")}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      {[t("col.date", "Tarih"), t("ui.performedBy", "İşlemi Yapan"), t("col.action", "Aksiyon"), t("action.details", "Detaylar")].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyLogs.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {new Date(l.createdDate).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="px-4 py-3 text-slate-700 text-xs">{l.userEmail}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ACTION_COLORS[l.action] ?? "bg-slate-100 text-slate-600"}`}>
                            {l.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {l.newValue
                            ? l.newValue.split(" | ").map((part, i) => (
                                <div key={i} className="text-xs text-slate-600">{part}</div>
                              ))
                            : l.oldValue
                            ? <span className="text-xs text-slate-400">{l.oldValue}</span>
                            : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex justify-end">
              <button onClick={() => setHistoryTarget(null)} className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50">{t("action.close", "Kapat")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Şikayetler Modalı ── */}
      {reportsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Flag size={16} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">{t("ui.complaints", "Şikayetler")}</h2>
                  <p className="text-xs text-slate-400 line-clamp-1">{reportsModal.productName}</p>
                </div>
              </div>
              <button onClick={() => setReportsModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            {reportsLoading ? (
              <p className="text-sm text-slate-400 py-4 text-center">{t("table.loading", "Yükleniyor...")}</p>
            ) : reports.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">{t("ui.noComplaintsFound", "Şikayet bulunamadı.")}</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {reports.map(rep => (
                  <div key={rep.id} className={`flex items-start justify-between gap-3 p-3 rounded-xl border ${
                    rep.isResolved ? "bg-slate-50 border-slate-200 opacity-60" : "bg-amber-50 border-amber-200"
                  }`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">{rep.userName}</span>
                        <span className="text-[10px] text-slate-400">{new Date(rep.createdDate).toLocaleDateString("tr-TR")}</span>
                        {rep.isResolved && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-500 font-semibold">{t("ui.resolved", "Çözüldü")}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {REASON_LABELS[rep.reason] ?? rep.reason}
                      </p>
                    </div>
                    {!rep.isResolved && (
                      <button
                        onClick={() => resolveReport(reportsModal.reviewId, rep.id)}
                        className="shrink-0 text-xs text-teal-600 hover:text-teal-800 font-semibold px-2 py-1 rounded-lg hover:bg-teal-50 transition"
                      >
                        {t("ui.resolve", "Çöz")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setReportsModal(null)}
              className="w-full border border-slate-300 text-slate-600 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition">
              {t("action.close", "Kapat")}
            </button>
          </div>
        </div>
      )}

      {/* ── Yanıtlar Modalı ── */}
      {repliesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                  <MessageCircle size={16} className="text-teal-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">{t("ui.replies", "Yanıtlar")}</h2>
                  <p className="text-xs text-slate-400 line-clamp-1">{repliesModal.productName}</p>
                </div>
              </div>
              <button onClick={() => setRepliesModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            {repliesLoading ? (
              <p className="text-sm text-slate-400 py-4 text-center">{t("table.loading", "Yükleniyor...")}</p>
            ) : replies.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">{t("ui.noRepliesFound", "Yanıt bulunamadı.")}</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {replies.map(rep => (
                  <div key={rep.id} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0 text-[10px] font-bold text-teal-700">
                      {rep.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-slate-700">{rep.userName}</span>
                        <span className="text-[10px] text-slate-400">{new Date(rep.createdDate).toLocaleDateString("tr-TR")}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{rep.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setRepliesModal(null)}
              className="w-full border border-slate-300 text-slate-600 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition">
              {t("action.close", "Kapat")}
            </button>
          </div>
        </div>
      )}

      {/* Reddet + Bildir Modal */}
      {rejectState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Bell size={20} className="text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">{t("ui.rejectReview", "Yorumu Reddet")}</h2>
                <p className="text-xs text-slate-500">{t("ui.rejectReviewSubtitle", "İsteğe bağlı not ekleyebilir ve kullanıcıya bildirim gönderebilirsiniz.")}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">{t("ui.rejectionNoteOptional", "Red Notu (isteğe bağlı)")}</label>
                <RichTextEditor
                  value={rejectState.note}
                  onChange={v => setRejectState(s => s ? { ...s, note: v } : s)}
                  placeholder={t("ui.rejectionNotePlaceholder", "Yorum neden reddedildi? (kullanıcıya gösterilecek)")}
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rejectState.notify}
                  onChange={e => setRejectState(s => s ? { ...s, notify: e.target.checked } : s)}
                  className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-400"
                />
                <span className="text-sm text-slate-700">{t("ui.notifyByEmail", "Kullanıcıya e-posta ile bildir")}</span>
              </label>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
              <button onClick={handleReject}
                className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-xl hover:bg-red-700 transition text-sm">
                {t("action.reject", "Reddet")}
              </button>
              <button onClick={() => setRejectState(null)}
                className="flex-1 border border-slate-300 text-slate-600 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition text-sm">
                {t("action.cancel", "Vazgeç")}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          title={t("ui.deleteReview", "Yorumu Sil")}
          message={t("ui.deleteReviewConfirm", "Bu yorumu kalıcı olarak silmek istediğinizden emin misiniz?")}
          confirmLabel={t("action.delete", "Sil")}
          danger
          onConfirm={() => { handleDelete(confirmDelete); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
