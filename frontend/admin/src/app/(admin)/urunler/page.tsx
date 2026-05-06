"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { AdminProduct, PaginatedList } from "@/types";
import { Search, Plus } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: "15", admin: "true" });
      if (search) qs.set("search", search);
      if (showInactive) qs.set("includeInactive", "true");
      const data = await api.get<PaginatedList<AdminProduct>>(`/api/products?${qs}`);
      setProducts(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, showInactive]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  async function handleDeactivate(id: string) {
    if (!confirm("Bu ürünü pasif yapmak istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/api/products/${id}`);
      setActionMsg("Ürün pasif yapıldı");
      await fetchProducts();
    } catch (err: unknown) {
      setActionMsg(err instanceof Error ? err.message : "Hata");
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Ürünler</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">{totalCount} ürün</span>
        </div>
      </div>

      {actionMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
          {actionMsg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ürün adı veya SKU..."
              className="pl-8 pr-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 w-56"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition">
            Ara
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
              className="px-4 py-2 border border-zinc-300 text-zinc-600 text-sm rounded-lg hover:bg-zinc-50 transition">
              Temizle
            </button>
          )}
        </form>
        <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => { setShowInactive(e.target.checked); setPage(1); }}
            className="rounded"
          />
          Pasif ürünleri göster
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Ürün</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">SKU</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Kategori / Marka</th>
                <th className="text-right px-5 py-3 text-zinc-500 font-medium">Fiyat</th>
                <th className="text-right px-5 py-3 text-zinc-500 font-medium">Stok</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Durum</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-zinc-400">Yükleniyor...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-zinc-400">Ürün bulunamadı</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className={`hover:bg-zinc-50 transition ${!p.isActive ? "opacity-60" : ""}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt={p.name} className="object-contain w-full h-full p-0.5" /> // eslint-disable-line @next/next/no-img-element
                            : <span className="text-base">📦</span>}
                        </div>
                        <p className="font-medium text-zinc-900 max-w-[200px] truncate">{p.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500 text-xs font-mono">{p.sku}</td>
                    <td className="px-5 py-3.5 text-zinc-500 text-xs">
                      <p>{p.categoryName ?? "—"}</p>
                      <p className="text-zinc-400">{p.brandName ?? "—"}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <p className="font-semibold text-zinc-900">{formatPrice(p.discountPrice ?? p.price)}</p>
                      {p.discountPrice && <p className="text-xs text-zinc-400 line-through">{formatPrice(p.price)}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-medium ${p.availableStock === 0 ? "text-red-600" : p.availableStock <= 5 ? "text-orange-600" : "text-zinc-900"}`}>
                        {p.availableStock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                        {p.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {p.isActive && (
                        <button
                          onClick={() => handleDeactivate(p.id)}
                          className="text-xs text-red-500 hover:text-red-700 transition"
                        >
                          Pasif Yap
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && <button onClick={() => setPage((p) => p - 1)} className="px-4 py-2 rounded-lg border border-zinc-300 text-sm hover:bg-zinc-100">← Önceki</button>}
          <span className="px-4 py-2 text-sm text-zinc-500">{page} / {totalPages}</span>
          {page < totalPages && <button onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-lg border border-zinc-300 text-sm hover:bg-zinc-100">Sonraki →</button>}
        </div>
      )}
    </div>
  );
}
