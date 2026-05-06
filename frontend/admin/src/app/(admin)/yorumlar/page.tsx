"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { PaginatedList } from "@/types";

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
        <svg key={s} width={14} height={14} viewBox="0 0 20 20" fill={s <= rating ? "#f59e0b" : "#4b5563"}>
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
  const [loading, setLoading] = useState(false);

  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (isApproved !== "") params.set("isApproved", isApproved);
      if (search.trim()) params.set("search", search.trim());

      const data = await api.get<PaginatedList<AdminReviewDto>>(`/api/admin/reviews?${params}`);
      setReviews(data.items);
      setTotal(data.totalCount);
    } finally {
      setLoading(false);
    }
  }, [page, isApproved, search]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(id: string, approved: boolean) {
    try {
      await api.put(`/api/admin/reviews/${id}/approve`, { approved });
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Hata oluştu.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu yorumu silmek istediğinizden emin misiniz?")) return;
    try {
      await api.delete(`/api/admin/reviews/${id}`);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Silinemedi.");
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Yorumlar</h1>
          <p className="text-zinc-400 text-sm mt-1">{total} yorum</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Ürün, yorum veya e-posta ara..."
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64"
        />
        <select
          value={isApproved}
          onChange={(e) => { setIsApproved(e.target.value as "" | "true" | "false"); setPage(1); }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Tüm Durumlar</option>
          <option value="false">Onay Bekleyenler</option>
          <option value="true">Onaylananlar</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-700 text-zinc-400 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3">Ürün / Kullanıcı</th>
              <th className="text-left px-4 py-3">Puan</th>
              <th className="text-left px-4 py-3">Yorum</th>
              <th className="text-left px-4 py-3">Tarih</th>
              <th className="text-left px-4 py-3">Durum</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center text-zinc-500 py-12">Yükleniyor...</td>
              </tr>
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-zinc-500 py-12">Yorum bulunamadı</td>
              </tr>
            ) : (
              reviews.map((r) => (
                <tr key={r.id} className="border-b border-zinc-700/50 hover:bg-zinc-700/30 transition align-top">
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="text-white text-xs font-medium line-clamp-2">{r.productName}</p>
                    <p className="text-zinc-400 text-xs mt-0.5">{r.userName}</p>
                    <p className="text-zinc-500 text-xs">{r.userEmail}</p>
                    {r.isVerifiedPurchase && (
                      <span className="text-green-500 text-xs">✓ Doğrulanmış</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Stars rating={r.rating} />
                  </td>
                  <td className="px-4 py-3 max-w-[300px]">
                    {r.title && <p className="text-white text-xs font-medium mb-0.5">{r.title}</p>}
                    <p className="text-zinc-400 text-xs line-clamp-3">{r.body}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                    {new Date(r.createdDate).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.isApproved
                        ? "bg-green-900/50 text-green-400"
                        : "bg-yellow-900/50 text-yellow-400"
                    }`}>
                      {r.isApproved ? "Onaylı" : "Bekliyor"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 flex-col items-end">
                      {!r.isApproved ? (
                        <button
                          onClick={() => handleApprove(r.id, true)}
                          className="text-xs text-green-400 hover:text-green-300 transition"
                        >
                          Onayla
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApprove(r.id, false)}
                          className="text-xs text-yellow-400 hover:text-yellow-300 transition"
                        >
                          Onayı Kaldır
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                p === page ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
