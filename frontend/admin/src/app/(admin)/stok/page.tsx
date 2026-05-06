"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { StockItem, PaginatedList } from "@/types";

export default function StockPage() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<StockItem | null>(null);
  const [adjustForm, setAdjustForm] = useState({ quantity: "", movementType: "StockIn", note: "" });
  const [adjusting, setAdjusting] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (criticalOnly) qs.set("criticalOnly", "true");
      const data = await api.get<PaginatedList<StockItem>>(`/api/admin/stocks?${qs}`);
      setStocks(data.items);
      setTotalPages(data.totalPages);
    } catch {
      setStocks([]);
    } finally {
      setLoading(false);
    }
  }, [page, criticalOnly]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  async function handleAdjust() {
    if (!adjustTarget || !adjustForm.quantity) return;
    setAdjusting(true);
    setMsg("");
    try {
      await api.post("/api/admin/stocks/adjust", {
        productId: adjustTarget.productId,
        variantId: adjustTarget.variantId ?? null,
        quantity: Number(adjustForm.quantity),
        movementType: adjustForm.movementType,
        note: adjustForm.note,
      });
      setMsg("Stok güncellendi");
      setAdjustTarget(null);
      setAdjustForm({ quantity: "", movementType: "StockIn", note: "" });
      await fetchStocks();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setAdjusting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Stok Yönetimi</h1>
        <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
          <input
            type="checkbox"
            checked={criticalOnly}
            onChange={(e) => { setCriticalOnly(e.target.checked); setPage(1); }}
            className="rounded"
          />
          Sadece kritik stokları göster
        </label>
      </div>

      {msg && (
        <div className={`text-sm px-4 py-3 rounded-lg border ${msg.includes("güncellendi") ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {msg}
        </div>
      )}

      {/* Adjust modal */}
      {adjustTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-semibold text-zinc-900 mb-1">Stok Güncelle</h2>
            <p className="text-sm text-zinc-500 mb-4">{adjustTarget.productName} · {adjustTarget.sku}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Hareket Tipi</label>
                <select
                  value={adjustForm.movementType}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, movementType: e.target.value }))}
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  <option value="StockIn">Stok Girişi</option>
                  <option value="StockOut">Stok Çıkışı</option>
                  <option value="Adjustment">Düzeltme</option>
                  <option value="Return">İade</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Miktar</label>
                <input
                  type="number"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, quantity: e.target.value }))}
                  placeholder="Adet girin"
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Not</label>
                <input
                  value={adjustForm.note}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="İsteğe bağlı"
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAdjust}
                  disabled={adjusting || !adjustForm.quantity}
                  className="flex-1 bg-zinc-900 text-white font-semibold py-2.5 rounded-lg hover:bg-zinc-700 transition disabled:opacity-50 text-sm"
                >
                  {adjusting ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button
                  onClick={() => setAdjustTarget(null)}
                  className="px-5 border border-zinc-300 text-zinc-600 rounded-lg hover:bg-zinc-50 text-sm"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Ürün</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">SKU</th>
                <th className="text-right px-5 py-3 text-zinc-500 font-medium">Toplam</th>
                <th className="text-right px-5 py-3 text-zinc-500 font-medium">Rezerve</th>
                <th className="text-right px-5 py-3 text-zinc-500 font-medium">Kullanılabilir</th>
                <th className="text-right px-5 py-3 text-zinc-500 font-medium">Kritik Seviye</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-zinc-400">Yükleniyor...</td></tr>
              ) : stocks.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-zinc-400">Stok kaydı bulunamadı</td></tr>
              ) : (
                stocks.map((s, i) => (
                  <tr key={`${s.productId}-${s.variantId ?? i}`} className={`hover:bg-zinc-50 transition ${s.isCritical ? "bg-red-50/30" : ""}`}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-zinc-900 max-w-[220px] truncate">{s.productName}</p>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500 text-xs font-mono">{s.sku}</td>
                    <td className="px-5 py-3.5 text-right text-zinc-700">{s.quantity}</td>
                    <td className="px-5 py-3.5 text-right text-zinc-500">{s.reservedQuantity}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-semibold ${s.availableQuantity === 0 ? "text-red-600" : s.isCritical ? "text-orange-600" : "text-zinc-900"}`}>
                        {s.availableQuantity}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-zinc-400">{s.criticalStockLevel}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setAdjustTarget(s)}
                        className="text-xs text-zinc-600 hover:text-zinc-900 underline transition"
                      >
                        Düzenle
                      </button>
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
