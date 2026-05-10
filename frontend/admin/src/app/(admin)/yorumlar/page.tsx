"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { PaginatedList } from "@/types";
import { exportToExcel } from "@/lib/excel";
import { Download, Search, CheckCircle, XCircle, Trash2 } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

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
  createdDate: string;
}

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

export default function YorumlarPage() {
  const [reviews, setReviews] = useState<AdminReviewDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isApproved, setIsApproved] = useState<"" | "true" | "false">("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [pageSize, setPageSize] = useState(20);
  const PAGE_SIZES = [20, 50, 100];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (isApproved !== "") params.set("isApproved", isApproved);
      if (search.trim()) params.set("search", search.trim());
      const data = await api.get<PaginatedList<AdminReviewDto>>(`/api/admin/reviews?${params}`);
      setReviews(data.items);
      setTotal(data.totalCount);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, isApproved, search]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(id: string, approved: boolean) {
    try {
      await api.patch(`/api/admin/reviews/${id}/approve`, { approved });
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Hata oluştu.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/api/admin/reviews/${id}`);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Silinemedi.");
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yorumlar</h1>
          {!loading && <p className="text-slate-500 text-sm mt-0.5">{total} yorum</p>}
        </div>
        <button
          onClick={() => exportToExcel(
            reviews.map(r => ({
              "Ürün": r.productName, "Kullanıcı": r.userName, "E-posta": r.userEmail,
              "Puan": r.rating, "Başlık": r.title ?? "", "Yorum": r.body,
              "Onaylı": r.isApproved ? "Evet" : "Hayır", "Onaylı Alış": r.isVerifiedPurchase ? "Evet" : "Hayır",
            })),
            "yorumlar", "Yorumlar"
          )}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition"
        >
          <Download size={14} /> Excel'e Aktar
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <form onSubmit={e => { e.preventDefault(); setPage(1); setSearch(searchInput); }} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Ürün, yorum veya e-posta ara..."
              className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-64 text-slate-900 bg-white"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition">Ara</button>
          {(search || searchInput) && (
            <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
              className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">Temizle</button>
          )}
        </form>
        <select
          value={isApproved}
          onChange={e => { setIsApproved(e.target.value as "" | "true" | "false"); setPage(1); }}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <option value="">Tüm Durumlar</option>
          <option value="false">Onay Bekleyenler</option>
          <option value="true">Onaylananlar</option>
        </select>
        <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s} kayıt</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-slate-400">Yükleniyor...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Ürün / Kullanıcı", "Puan", "Yorum", "Tarih", "Durum", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviews.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">Yorum bulunamadı</td></tr>
              ) : reviews.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 align-top">
                  <td className="px-5 py-3 max-w-[180px]">
                    <p className="text-slate-800 text-xs font-semibold line-clamp-2">{r.productName}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{r.userName}</p>
                    <p className="text-slate-400 text-xs">{r.userEmail}</p>
                    {r.isVerifiedPurchase && (
                      <span className="text-green-600 text-xs">✓ Doğrulanmış</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Stars rating={r.rating} />
                  </td>
                  <td className="px-5 py-3 max-w-[300px]">
                    {r.title && <p className="text-slate-800 text-xs font-semibold mb-0.5">{r.title}</p>}
                    <p className="text-slate-500 text-xs line-clamp-3">{r.body}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(r.createdDate).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      r.isApproved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {r.isApproved ? "Onaylı" : "Bekliyor"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5 items-center">
                      {!r.isApproved ? (
                        <button onClick={() => handleApprove(r.id, true)}
                          title="Onayla"
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-green-50 text-green-600 hover:bg-green-500 hover:text-white shadow-sm hover:shadow-green-200 hover:shadow-md transition-all duration-150 active:scale-95">
                          <CheckCircle size={18} />
                        </button>
                      ) : (
                        <button onClick={() => handleApprove(r.id, false)}
                          title="Onayı Kaldır"
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white shadow-sm hover:shadow-amber-200 hover:shadow-md transition-all duration-150 active:scale-95">
                          <XCircle size={18} />
                        </button>
                      )}
                      <button onClick={() => setConfirmDelete(r.id)}
                        title="Sil"
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white shadow-sm hover:shadow-red-200 hover:shadow-md transition-all duration-150 active:scale-95">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Yorumu Sil"
          message="Bu yorumu kalıcı olarak silmek istediğinizden emin misiniz?"
          confirmLabel="Sil"
          danger
          onConfirm={() => { handleDelete(confirmDelete); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && <button onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">← Önceki</button>}
          <span className="px-4 py-2 text-sm text-slate-500">{page} / {totalPages}</span>
          {page < totalPages && <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">Sonraki →</button>}
        </div>
      )}
    </div>
  );
}
