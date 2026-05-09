"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { exportToExcel, readExcelFile, downloadTemplate } from "@/lib/excel";
import type { StockItem, PaginatedList } from "@/types";
import { Plus, Download, Upload, X, Search } from "lucide-react";

const MOVEMENT_TYPES = [
  { value: "StockIn", label: "Stok Girişi" },
  { value: "StockOut", label: "Stok Çıkışı" },
  { value: "Adjustment", label: "Düzeltme" },
  { value: "Return", label: "İade" },
];

interface ProductOption { id: string; name: string; sku: string; }

export default function StockPage() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Adjust existing stock
  const [adjustTarget, setAdjustTarget] = useState<StockItem | null>(null);
  const [adjustForm, setAdjustForm] = useState({ quantity: "", movementType: "StockIn", note: "" });
  const [adjusting, setAdjusting] = useState(false);

  // New stock entry modal
  const [showNew, setShowNew] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const [newForm, setNewForm] = useState({ quantity: "", movementType: "StockIn", note: "" });
  const [newSaving, setNewSaving] = useState(false);

  // Excel import
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (criticalOnly) qs.set("criticalOnly", "true");
      const data = await api.get<PaginatedList<StockItem>>(`/api/admin/stocks?${qs}`);
      setStocks(data.items);
      setTotalPages(data.totalPages);
    } catch { setStocks([]); }
    finally { setLoading(false); }
  }, [page, criticalOnly]);

  useEffect(() => { fetchStocks(); }, [fetchStocks]);

  // Search products for new stock entry
  useEffect(() => {
    if (!productSearch || productSearch.length < 2) { setProductOptions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const data = await api.get<{ items: ProductOption[] }>(`/api/products?search=${encodeURIComponent(productSearch)}&pageSize=10&admin=true`);
        setProductOptions(data.items || []);
      } catch { setProductOptions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  async function handleAdjust() {
    if (!adjustTarget || !adjustForm.quantity) return;
    setAdjusting(true);
    try {
      await api.post("/api/admin/stocks/adjust", {
        productId: adjustTarget.productId,
        variantId: adjustTarget.variantId ?? null,
        quantity: Number(adjustForm.quantity),
        movementType: adjustForm.movementType,
        note: adjustForm.note,
      });
      setMsg({ text: "Stok güncellendi.", ok: true });
      setAdjustTarget(null);
      setAdjustForm({ quantity: "", movementType: "StockIn", note: "" });
      await fetchStocks();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Hata", ok: false });
    } finally { setAdjusting(false); }
  }

  async function handleNewStock() {
    if (!selectedProduct || !newForm.quantity) return;
    setNewSaving(true);
    try {
      await api.post("/api/admin/stocks/adjust", {
        productId: selectedProduct.id,
        variantId: null,
        quantity: Number(newForm.quantity),
        movementType: newForm.movementType,
        note: newForm.note || null,
      });
      setMsg({ text: `${selectedProduct.name} için stok güncellendi.`, ok: true });
      setShowNew(false);
      setSelectedProduct(null); setProductSearch("");
      setNewForm({ quantity: "", movementType: "StockIn", note: "" });
      await fetchStocks();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Hata", ok: false });
    } finally { setNewSaving(false); }
  }

  function handleExport() {
    exportToExcel(
      stocks.map(s => ({
        "Ürün": s.productName, "SKU": s.sku,
        "Toplam": s.quantity, "Rezerve": s.reservedQuantity,
        "Kullanılabilir": s.availableQuantity, "Kritik Seviye": s.criticalStockLevel,
        "Kritik": s.isCritical ? "Evet" : "Hayır",
      })),
      "stok", "Stok"
    );
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true); setImportResult(null);
    let ok = 0, fail = 0;
    try {
      const rows = await readExcelFile(file);
      for (const row of rows) {
        try {
          const productId = String(row["Ürün ID"] ?? "");
          if (!productId) { fail++; continue; }
          await api.post("/api/admin/stocks/adjust", {
            productId,
            variantId: null,
            quantity: Number(row["Miktar"] ?? 0),
            movementType: String(row["Tip"] ?? "StockIn"),
            note: String(row["Not"] ?? ""),
          });
          ok++;
        } catch { fail++; }
      }
      setImportResult(`${ok} kayıt işlendi${fail > 0 ? `, ${fail} hatalı` : ""}.`);
      await fetchStocks();
    } catch { setImportResult("Dosya okunamadı."); }
    finally { setImporting(false); e.target.value = ""; }
  }

  const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Stok Yönetimi</h1>
        <div className="flex items-center gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">
            <Download size={14} /> Excel
          </button>
          <label className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition cursor-pointer">
            <Upload size={14} /> {importing ? "Aktarılıyor..." : "İçe Aktar"}
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button onClick={() => downloadTemplate(["Ürün ID", "Miktar", "Tip", "Not"], "stok")}
            className="text-xs text-slate-500 hover:text-slate-700 underline px-1">Şablon</button>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow">
            <Plus size={15} /> Yeni Stok Girişi
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={criticalOnly}
            onChange={e => { setCriticalOnly(e.target.checked); setPage(1); }} className="rounded" />
          Sadece kritik stokları göster
        </label>
      </div>

      {msg && (
        <div className={`text-sm px-4 py-3 rounded-xl flex items-center justify-between ${msg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.text} <button onClick={() => setMsg(null)}><X size={14} /></button>
        </div>
      )}
      {importResult && (
        <div className="text-sm px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-between">
          {importResult} <button onClick={() => setImportResult(null)}><X size={14} /></button>
        </div>
      )}

      {/* Adjust modal */}
      {adjustTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-800">Stok Güncelle</h2>
                <p className="text-xs text-slate-500 mt-0.5">{adjustTarget.productName} · {adjustTarget.sku}</p>
              </div>
              <button onClick={() => setAdjustTarget(null)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hareket Tipi</label>
                <select value={adjustForm.movementType}
                  onChange={e => setAdjustForm(f => ({ ...f, movementType: e.target.value }))}
                  className={INPUT}>
                  {MOVEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Miktar</label>
                <input type="number" className={INPUT} value={adjustForm.quantity}
                  onChange={e => setAdjustForm(f => ({ ...f, quantity: e.target.value }))} placeholder="Adet" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Not</label>
                <input className={INPUT} value={adjustForm.note}
                  onChange={e => setAdjustForm(f => ({ ...f, note: e.target.value }))} placeholder="İsteğe bağlı" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleAdjust} disabled={adjusting || !adjustForm.quantity}
                  className="flex-1 bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-sm">
                  {adjusting ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button onClick={() => setAdjustTarget(null)}
                  className="px-5 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 text-sm">İptal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New stock entry modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800">Yeni Stok Girişi</h2>
              <button onClick={() => { setShowNew(false); setSelectedProduct(null); setProductSearch(""); }}
                className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ürün Ara</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                  <input className="pl-8 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={selectedProduct ? selectedProduct.name : productSearch}
                    onChange={e => { setProductSearch(e.target.value); setSelectedProduct(null); }}
                    placeholder="Ürün adı veya SKU..." />
                </div>
                {productOptions.length > 0 && !selectedProduct && (
                  <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {productOptions.map(p => (
                      <button key={p.id} type="button"
                        onClick={() => { setSelectedProduct(p); setProductOptions([]); setProductSearch(p.name); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 border-b border-slate-100 last:border-0">
                        <span className="font-medium text-slate-800">{p.name}</span>
                        <span className="text-slate-400 text-xs ml-2">{p.sku}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hareket Tipi</label>
                <select value={newForm.movementType} onChange={e => setNewForm(f => ({ ...f, movementType: e.target.value }))} className={INPUT}>
                  {MOVEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Miktar</label>
                <input type="number" className={INPUT} value={newForm.quantity}
                  onChange={e => setNewForm(f => ({ ...f, quantity: e.target.value }))} placeholder="Adet" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Not</label>
                <input className={INPUT} value={newForm.note}
                  onChange={e => setNewForm(f => ({ ...f, note: e.target.value }))} placeholder="İsteğe bağlı" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleNewStock} disabled={newSaving || !selectedProduct || !newForm.quantity}
                  className="flex-1 bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-sm">
                  {newSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button onClick={() => { setShowNew(false); setSelectedProduct(null); setProductSearch(""); }}
                  className="px-5 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 text-sm">İptal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Ürün", "SKU", "Toplam", "Rezerve", "Kullanılabilir", "Kritik Seviye", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Yükleniyor...</td></tr>
              ) : stocks.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Stok kaydı bulunamadı</td></tr>
              ) : stocks.map((s, i) => (
                <tr key={`${s.productId}-${s.variantId ?? i}`} className={`hover:bg-slate-50 transition ${s.isCritical ? "bg-red-50/30" : ""}`}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-900 max-w-[220px] truncate text-xs">{s.productName}</p>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs font-mono">{s.sku}</td>
                  <td className="px-5 py-3.5 text-right text-slate-700 text-xs">{s.quantity}</td>
                  <td className="px-5 py-3.5 text-right text-slate-500 text-xs">{s.reservedQuantity}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`font-semibold text-xs ${s.availableQuantity === 0 ? "text-red-600" : s.isCritical ? "text-orange-600" : "text-slate-900"}`}>
                      {s.availableQuantity}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-400 text-xs">{s.criticalStockLevel}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => { setAdjustTarget(s); setAdjustForm({ quantity: "", movementType: "StockIn", note: "" }); }}
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition">Düzenle</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && <button onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm hover:bg-slate-50 text-slate-700">← Önceki</button>}
          <span className="px-4 py-2 text-sm text-slate-500">{page} / {totalPages}</span>
          {page < totalPages && <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm hover:bg-slate-50 text-slate-700">Sonraki →</button>}
        </div>
      )}
    </div>
  );
}
