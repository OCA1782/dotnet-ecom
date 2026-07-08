"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import { exportToExcel, readExcelFile, downloadTemplate } from "@/lib/excel";
import type { StockItem, PaginatedList } from "@/types";
import { Plus, Download, Upload, X, Search, Pencil, AlertTriangle, PackageX, History, Package, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, CheckSquare, Square, Loader2 } from "lucide-react";

const MOVEMENT_TYPES = [
  { value: "StockIn", label: "Stok Girişi" },
  { value: "StockOut", label: "Stok Çıkışı" },
  { value: "Adjustment", label: "Düzeltme" },
  { value: "Return", label: "İade" },
];

interface ProductOption { id: string; name: string; sku: string; }

interface StockMovementRow {
  id: string; productId: string; productName: string; sku: string;
  movementType: string; quantity: number; quantityBefore: number; quantityAfter: number;
  orderId?: string; note?: string; createdDate: string;
}

interface AuditLog {
  id: string;
  userEmail: string;
  action: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  createdDate: string;
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  StockIn: "Stok Girişi", StockOut: "Stok Çıkışı",
  Adjustment: "Düzeltme", Return: "İade",
};

type SortField = "createdDate" | "dataSource";
function buildSortKey(field: SortField, dir: "asc" | "desc") { return `${field}-${dir}`; }

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField | null; sortDir: "asc" | "desc" }) {
  if (sortField !== field) return <ChevronsUpDown size={12} className="opacity-30 ml-1 inline-block" />;
  return sortDir === "asc" ? <ChevronUp size={12} className="text-teal-600 ml-1 inline-block" /> : <ChevronDown size={12} className="text-teal-600 ml-1 inline-block" />;
}

export default function StockPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"stok" | "hareketler">("stok");

  // Per-row item history
  const [itemHistoryTarget, setItemHistoryTarget] = useState<StockItem | null>(null);
  const [itemHistoryTab, setItemHistoryTab] = useState<"hareketler" | "audit">("hareketler");
  const [itemMovements, setItemMovements] = useState<StockMovementRow[]>([]);
  const [itemMovementsLoading, setItemMovementsLoading] = useState(false);
  const [itemAuditLogs, setItemAuditLogs] = useState<AuditLog[]>([]);
  const [itemAuditLoading, setItemAuditLoading] = useState(false);

  const loadItemMovements = useCallback(async (productId: string) => {
    setItemMovementsLoading(true);
    setItemMovements([]);
    try {
      const qs = new URLSearchParams({ page: "1", pageSize: "50", productId });
      const data = await api.get<PaginatedList<StockMovementRow>>(`/api/admin/stocks/movements?${qs}`);
      setItemMovements(data.items);
    } finally {
      setItemMovementsLoading(false);
    }
  }, []);

  const loadItemAuditLogs = useCallback(async (productId: string) => {
    setItemAuditLoading(true);
    setItemAuditLogs([]);
    try {
      const data = await api.get<{ items: AuditLog[]; totalCount: number }>(
        `/api/admin/audit-logs/entity/Stok/${productId}`
      );
      setItemAuditLogs(data.items);
    } catch { setItemAuditLogs([]); }
    finally { setItemAuditLoading(false); }
  }, []);

  function openItemHistory(s: StockItem) {
    setItemHistoryTarget(s);
    setItemHistoryTab("hareketler");
    loadItemMovements(s.productId);
    loadItemAuditLogs(s.productId);
  }

  // Movement history
  const [movements, setMovements] = useState<StockMovementRow[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsTotalPages, setMovementsTotalPages] = useState(1);
  const [movementsTypeFilter, setMovementsTypeFilter] = useState("");
  const [movFilProdInput, setMovFilProdInput] = useState("");
  const [movFilProdOptions, setMovFilProdOptions] = useState<ProductOption[]>([]);
  const [movFilProdId, setMovFilProdId] = useState("");
  const [movFilProdName, setMovFilProdName] = useState("");

  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [stockPageSize, setStockPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [stockSearch, setStockSearch] = useState("");
  const [stockSearchInput, setStockSearchInput] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  }

  // Adjust existing stock
  const [adjustTarget, setAdjustTarget] = useState<StockItem | null>(null);
  const [adjustForm, setAdjustForm] = useState({ quantity: "", movementType: "StockIn", note: "", criticalStockLevel: "" });
  const [adjusting, setAdjusting] = useState(false);

  // New stock entry modal
  const [showNew, setShowNew] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const [newForm, setNewForm] = useState({ quantity: "", movementType: "StockIn", note: "", criticalStockLevel: "" });
  const [newSaving, setNewSaving] = useState(false);

  // Delete stock entry
  const [deleteTarget, setDeleteTarget] = useState<StockItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Bulk stock update (seçili)
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkForm, setBulkForm] = useState({ quantity: "", movementType: "StockIn", note: "", criticalStockLevel: "" });
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

  // Koşullu stok güncelleme
  const [showCondUpdate, setShowCondUpdate] = useState(false);
  const [condForm, setCondForm] = useState({ minStock: "", maxStock: "", quantity: "", movementType: "StockIn", note: "", criticalStockLevel: "" });
  const [condPreviewCount, setCondPreviewCount] = useState<number | null>(null);
  const [condPreviewLoading, setCondPreviewLoading] = useState(false);
  const [condUpdating, setCondUpdating] = useState(false);

  async function handleDeleteStock() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/stocks/${deleteTarget.productId}`);
      setMsg({ text: `"${deleteTarget.productName}" stok kaydı silindi.`, ok: true });
      setDeleteTarget(null);
      await fetchStocks();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Silme hatası", ok: false });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  // Excel import
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(stockPageSize) });
      if (criticalOnly) qs.set("onlyCritical", "true");
      if (stockSearch) qs.set("search", stockSearch);
      if (sortField) qs.set("sortBy", buildSortKey(sortField, sortDir));
      const data = await api.get<PaginatedList<StockItem>>(`/api/admin/stocks?${qs}`);
      setStocks(data.items);
      setTotalPages(data.totalPages);
    } catch { setStocks([]); }
    finally { setLoading(false); }
  }, [page, stockPageSize, criticalOnly, stockSearch, sortField, sortDir]);

  useEffect(() => {
    const id = window.setTimeout(() => { void fetchStocks(); }, 0);
    return () => window.clearTimeout(id);
  }, [fetchStocks]);

  const fetchMovements = useCallback(async () => {
    setMovementsLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(movementsPage), pageSize: "30" });
      if (movementsTypeFilter) qs.set("movementType", movementsTypeFilter);
      if (movFilProdId) qs.set("productId", movFilProdId);
      const data = await api.get<PaginatedList<StockMovementRow>>(`/api/admin/stocks/movements?${qs}`);
      setMovements(data.items);
      setMovementsTotalPages(data.totalPages);
    } catch { setMovements([]); }
    finally { setMovementsLoading(false); }
  }, [movementsPage, movementsTypeFilter, movFilProdId]);

  useEffect(() => {
    if (tab !== "hareketler") return;
    const id = window.setTimeout(() => { void fetchMovements(); }, 0);
    return () => window.clearTimeout(id);
  }, [tab, fetchMovements]);

  // Search products for new stock entry
  useEffect(() => {
    if (!productSearch || productSearch.length < 2) {
      const id = window.setTimeout(() => setProductOptions([]), 0);
      return () => window.clearTimeout(id);
    }
    const timer = setTimeout(async () => {
      try {
        const data = await api.get<{ items: ProductOption[] }>(`/api/products?search=${encodeURIComponent(productSearch)}&pageSize=10&admin=true`);
        setProductOptions(data.items || []);
      } catch { setProductOptions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Product search for movements filter
  useEffect(() => {
    if (!movFilProdInput || movFilProdInput.length < 2) {
      const id = window.setTimeout(() => setMovFilProdOptions([]), 0);
      return () => window.clearTimeout(id);
    }
    const timer = setTimeout(async () => {
      try {
        const data = await api.get<{ items: ProductOption[] }>(`/api/products?search=${encodeURIComponent(movFilProdInput)}&pageSize=10&admin=true`);
        setMovFilProdOptions(data.items || []);
      } catch { setMovFilProdOptions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [movFilProdInput]);

  async function handleAdjust() {
    if (!adjustTarget || !adjustForm.quantity) return;
    setAdjusting(true);
    try {
      await api.post("/api/admin/stocks/adjust", {
        productId: adjustTarget.productId,
        variantId: adjustTarget.variantId ?? null,
        quantity: Number(adjustForm.quantity),
        movementType: adjustForm.movementType,
        note: adjustForm.note || null,
        criticalStockLevel: adjustForm.criticalStockLevel !== "" ? Number(adjustForm.criticalStockLevel) : null,
      });
      setMsg({ text: "Stok güncellendi.", ok: true });
      setAdjustTarget(null);
      setAdjustForm({ quantity: "", movementType: "StockIn", note: "", criticalStockLevel: "" });
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
        criticalStockLevel: newForm.criticalStockLevel !== "" ? Number(newForm.criticalStockLevel) : null,
      });
      setMsg({ text: `${selectedProduct.name} için stok güncellendi.`, ok: true });
      setShowNew(false);
      setSelectedProduct(null); setProductSearch("");
      setNewForm({ quantity: "", movementType: "StockIn", note: "", criticalStockLevel: "" });
      await fetchStocks();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Hata", ok: false });
    } finally { setNewSaving(false); }
  }

  function toggleSelectStock(id: string) {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  async function handleBulkDeleteStock() {
    setBulkDeleting(true);
    const results = await Promise.allSettled([...selectedIds].map(id => api.delete(`/api/admin/stocks/${id}`)));
    const ok = results.filter(r => r.status === "fulfilled").length;
    const fail = results.filter(r => r.status === "rejected").length;
    setMsg({ text: `${ok} stok kaydı silindi${fail > 0 ? `, ${fail} hatalı` : ""}.`, ok: fail === 0 });
    setSelectedIds(new Set());
    setBulkDeleting(false);
    await fetchStocks();
  }

  async function fetchCondPreview() {
    if (!condForm.minStock && !condForm.maxStock) { setCondPreviewCount(null); return; }
    setCondPreviewLoading(true);
    try {
      const qs = new URLSearchParams();
      if (condForm.minStock !== "") qs.set("minStock", condForm.minStock);
      if (condForm.maxStock !== "") qs.set("maxStock", condForm.maxStock);
      const data = await api.get<{ count: number }>(`/api/admin/stocks/condition-preview?${qs}`);
      setCondPreviewCount(data.count);
    } catch { setCondPreviewCount(null); }
    finally { setCondPreviewLoading(false); }
  }

  async function handleCondUpdate() {
    if (!condForm.quantity) return;
    if (!condForm.minStock && !condForm.maxStock) return;
    setCondUpdating(true);
    try {
      const result = await api.post<{ succeeded: number; failed: number; errors: string[] }>(
        "/api/admin/stocks/bulk-adjust-by-condition",
        {
          minStock: condForm.minStock !== "" ? Number(condForm.minStock) : null,
          maxStock: condForm.maxStock !== "" ? Number(condForm.maxStock) : null,
          quantity: Number(condForm.quantity),
          movementType: condForm.movementType,
          note: condForm.note || null,
          criticalStockLevel: condForm.criticalStockLevel !== "" ? Number(condForm.criticalStockLevel) : null,
        }
      );
      setMsg({
        text: `${result.succeeded} ürün stoku güncellendi${result.failed > 0 ? `, ${result.failed} hatalı` : ""}.`,
        ok: result.failed === 0,
      });
      setShowCondUpdate(false);
      setCondForm({ minStock: "", maxStock: "", quantity: "", movementType: "StockIn", note: "", criticalStockLevel: "" });
      setCondPreviewCount(null);
      await fetchStocks();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Koşullu güncelleme hatası", ok: false });
    } finally { setCondUpdating(false); }
  }

  async function handleBulkUpdate() {
    if (!bulkForm.quantity) return;
    setBulkUpdating(true);
    const ids = [...selectedIds];
    setBulkProgress({ done: 0, total: ids.length });
    try {
      const result = await api.post<{ succeeded: number; failed: number; errors: string[] }>(
        "/api/admin/stocks/bulk-adjust",
        {
          productIds: ids,
          quantity: Number(bulkForm.quantity),
          movementType: bulkForm.movementType,
          note: bulkForm.note || null,
          criticalStockLevel: bulkForm.criticalStockLevel !== "" ? Number(bulkForm.criticalStockLevel) : null,
        }
      );
      setBulkProgress({ done: result.succeeded + result.failed, total: ids.length });
      setMsg({
        text: `${result.succeeded} ürün güncellendi${result.failed > 0 ? `, ${result.failed} hatalı` : ""}.`,
        ok: result.failed === 0,
      });
      setShowBulkUpdate(false);
      setSelectedIds(new Set());
      setBulkForm({ quantity: "", movementType: "StockIn", note: "", criticalStockLevel: "" });
      await fetchStocks();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Toplu güncelleme hatası", ok: false });
    } finally {
      setBulkUpdating(false);
      setBulkProgress(null);
    }
  }

  function handleExport() {
    exportToExcel(
      stocks.map(s => ({
        [t("col.product", "Ürün")]: s.productName, "SKU": s.sku,
        "Toplam": s.quantity, "Rezerve": s.reservedQuantity,
        "Kullanılabilir": s.availableQuantity, "Kritik Seviye": s.criticalStockLevel,
        "Kritik": s.isCritical ? t("action.yes", "Evet") : t("action.no", "Hayır"),
      })),
      "stok", t("col.stock", "Stok")
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

  const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <h1 className="text-2xl font-bold text-slate-900">{t("page./stok", "Stok Yönetimi")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadTemplate(["Ürün ID", "Miktar", "Tip", "Not"], "stok")}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">{t("action.downloadTemplate", "Şablon İndir")}</button>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">
            <Download size={14} /> {t("action.exportExcel", "Excel'e Aktar")}
          </button>
          <label className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition cursor-pointer">
            <Upload size={14} /> {importing ? t("action.importing", "Aktarılıyor...") : t("action.importFile", "İçe Aktar")}
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button onClick={() => { setShowCondUpdate(true); setCondForm({ minStock: "", maxStock: "", quantity: "", movementType: "StockIn", note: "", criticalStockLevel: "" }); setCondPreviewCount(null); }}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">
            <AlertTriangle size={14} /> Koşullu Güncelle
          </button>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-[#12304A] hover:bg-[#0d2438] text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow">
            <Plus size={15} /> Yeni Stok Girişi
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button onClick={() => setTab("stok")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${tab === "stok" ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
          <Package size={14} /> Stok Listesi
        </button>
        <button onClick={() => setTab("hareketler")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${tab === "hareketler" ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
          <History size={14} /> Tüm Hareketler
        </button>
      </div>

      {tab === "hareketler" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-start gap-3">
            <select value={movementsTypeFilter} onChange={e => { setMovementsTypeFilter(e.target.value); setMovementsPage(1); }}
              className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
              <option value="">Tüm Hareket Tipleri</option>
              {MOVEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>

            {/* Product search autocomplete */}
            <div className="relative">
              {movFilProdId ? (
                <div className="flex items-center gap-2 border border-teal-400 bg-teal-50 rounded-xl px-3 py-2 text-sm text-teal-800">
                  <Search size={13} className="text-teal-500 shrink-0" />
                  <span className="max-w-[200px] truncate font-medium">{movFilProdName}</span>
                  <button onClick={() => { setMovFilProdId(""); setMovFilProdName(""); setMovFilProdInput(""); setMovementsPage(1); }}
                    className="ml-1 text-teal-500 hover:text-teal-700"><X size={13} /></button>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      value={movFilProdInput}
                      onChange={e => { setMovFilProdInput(e.target.value); if (!e.target.value) setMovFilProdOptions([]); }}
                      placeholder="Ürüne göre filtrele..."
                      className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-52 text-slate-900 bg-white"
                    />
                  </div>
                  {movFilProdOptions.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 w-64 max-h-48 overflow-y-auto">
                      {movFilProdOptions.map(o => (
                        <button key={o.id} onClick={() => {
                          setMovFilProdId(o.id);
                          setMovFilProdName(o.name);
                          setMovFilProdInput("");
                          setMovFilProdOptions([]);
                          setMovementsPage(1);
                        }} className="w-full text-left px-3 py-2 text-sm hover:bg-teal-50 text-slate-800 border-b border-slate-100 last:border-0">
                          <p className="font-medium truncate">{o.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{o.sku}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {(movementsTypeFilter || movFilProdId) && (
              <button onClick={() => { setMovementsTypeFilter(""); setMovFilProdId(""); setMovFilProdName(""); setMovFilProdInput(""); setMovementsPage(1); }}
                className="px-3 py-2 border border-slate-300 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">{t("action.clear", "Temizle")}</button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">{t("col.date", "Tarih")}</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">{t("col.product", "Ürün")}</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">SKU</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Tip</th>
                    <th className="text-right px-4 py-3 text-slate-500 font-medium text-xs">Miktar</th>
                    <th className="text-right px-4 py-3 text-slate-500 font-medium text-xs">Önceki</th>
                    <th className="text-right px-4 py-3 text-slate-500 font-medium text-xs">Sonraki</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Not</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movementsLoading ? (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">{t("action.loading", "Yükleniyor...")}</td></tr>
                  ) : movements.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">{t("table.noData", "Kayıt bulunamadı")}</td></tr>
                  ) : movements.map(m => {
                    const typeColor = m.movementType === "StockIn" || m.movementType === "Return"
                      ? "bg-emerald-100 text-emerald-700"
                      : m.movementType === "StockOut"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700";
                    const qtySign = (m.movementType === "StockIn" || m.movementType === "Return") ? "+" : "-";
                    return (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(m.createdDate).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-800 max-w-[180px] truncate">{m.productName}</td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-500">{m.sku}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>
                            {MOVEMENT_TYPE_LABELS[m.movementType] ?? m.movementType}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right text-xs font-bold ${m.movementType === "StockOut" ? "text-red-600" : "text-emerald-600"}`}>
                          {m.movementType === "Adjustment" ? m.quantity : `${qtySign}${m.quantity}`}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-slate-400">{m.quantityBefore}</td>
                        <td className="px-4 py-3 text-right text-xs text-slate-700 font-medium">{m.quantityAfter}</td>
                        <td className="px-4 py-3 text-xs text-slate-400 max-w-[140px] truncate">{m.note ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {movementsTotalPages > 1 && (
            <div className="flex justify-center gap-2">
              {movementsPage > 1 && <button onClick={() => setMovementsPage(p => p - 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm hover:bg-slate-50 text-slate-700">{t("table.prev", "← Önceki")}</button>}
              <span className="px-4 py-2 text-sm text-slate-500">{movementsPage} / {movementsTotalPages}</span>
              {movementsPage < movementsTotalPages && <button onClick={() => setMovementsPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm hover:bg-slate-50 text-slate-700">{t("table.next", "Sonraki →")}</button>}
            </div>
          )}
        </div>
      )}

      {tab === "stok" && <>
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={e => { e.preventDefault(); setPage(1); setStockSearch(stockSearchInput); }} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input value={stockSearchInput} onChange={e => setStockSearchInput(e.target.value)}
              placeholder="Ürün adı veya SKU ara..."
              className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-60 text-slate-900 bg-white" />
          </div>
          <button type="submit" className="px-4 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition">{t("action.search", "Ara")}</button>
          {(stockSearch || stockSearchInput) && (
            <button type="button" onClick={() => { setStockSearch(""); setStockSearchInput(""); setPage(1); }}
              className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">{t("action.clear", "Temizle")}</button>
          )}
        </form>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={criticalOnly}
            onChange={e => { setCriticalOnly(e.target.checked); setPage(1); }} className="rounded" />
          Sadece kritik stoklar
        </label>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">{t("auto.sayfaBasi", "Sayfa başı:")} </span>
          {([20, 50, 100] as const).map(n => (
            <button key={n} onClick={() => { setStockPageSize(n); setPage(1); }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${stockPageSize === n ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {n}
            </button>
          ))}
        </div>
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

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm flex-wrap">
          <span className="font-semibold">{selectedIds.size} seçili</span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => { setShowBulkUpdate(true); setBulkForm({ quantity: "", movementType: "StockIn", note: "", criticalStockLevel: "" }); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-semibold transition">
              <Pencil size={13} /> Toplu Stok Güncelle
            </button>
            <button onClick={handleBulkDeleteStock} disabled={bulkDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold transition disabled:opacity-50">
              {bulkDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Seçilenleri Sil
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs transition">
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {/* Liste-bazlı alarm bandı */}
      {!loading && (() => {
        const outOfStock = stocks.filter(s => s.availableQuantity === 0).length;
        const critical = stocks.filter(s => s.isCritical && s.availableQuantity > 0).length;
        if (!outOfStock && !critical) return null;
        const parts = [
          outOfStock > 0 && `${outOfStock} ürün tükendi`,
          critical > 0 && `${critical} ürün kritik stok seviyesinin altında`,
        ].filter(Boolean).join(", ");
        return (
          <div className="flex items-center gap-3 bg-red-50 border-2 border-red-400 rounded-2xl px-5 py-4 shadow-sm shadow-red-100">
            <span className="relative flex h-5 w-5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 items-center justify-center">
                <AlertTriangle size={11} className="text-white" />
              </span>
            </span>
            <p className="text-sm font-bold text-red-700 flex-1">
              {parts} — Acil müdahale gerekiyor!
            </p>
            {(outOfStock > 0 || critical > 0) && (
              <button
                onClick={() => { setCriticalOnly(true); setPage(1); }}
                className="shrink-0 text-xs text-red-600 font-semibold border border-red-300 bg-white hover:bg-red-50 px-3 py-1.5 rounded-xl transition">
                Sadece kritikleri göster
              </button>
            )}
          </div>
        );
      })()}

      {/* Bulk stock update modal */}
      {showBulkUpdate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-800">Toplu Stok Güncelle</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selectedIds.size} ürün seçili — aynı hareket tüm seçilenlere uygulanır</p>
              </div>
              <button onClick={() => setShowBulkUpdate(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hareket Tipi</label>
                <select value={bulkForm.movementType}
                  onChange={e => setBulkForm(f => ({ ...f, movementType: e.target.value }))}
                  className={INPUT}>
                  {MOVEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Miktar</label>
                <input type="number" min={1} className={INPUT} value={bulkForm.quantity}
                  onChange={e => setBulkForm(f => ({ ...f, quantity: e.target.value }))} placeholder="Adet" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Kritik Eşik Seviyesi
                  <span className="ml-1 text-slate-400 font-normal">(boş bırakırsanız değişmez)</span>
                </label>
                <input type="number" min={0} className={INPUT} value={bulkForm.criticalStockLevel}
                  onChange={e => setBulkForm(f => ({ ...f, criticalStockLevel: e.target.value }))}
                  placeholder="İsteğe bağlı" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Not</label>
                <input className={INPUT} value={bulkForm.note}
                  onChange={e => setBulkForm(f => ({ ...f, note: e.target.value }))} placeholder="İsteğe bağlı" />
              </div>
              {bulkProgress && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
                  <div className="flex justify-between text-xs font-semibold text-teal-700 mb-1.5">
                    <span>İşleniyor...</span>
                    <span>{bulkProgress.done} / {bulkProgress.total}</span>
                  </div>
                  <div className="h-1.5 bg-teal-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full transition-all"
                      style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }} />
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={handleBulkUpdate} disabled={bulkUpdating || !bulkForm.quantity}
                  className="flex-1 bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                  {bulkUpdating ? <><Loader2 size={14} className="animate-spin" /> İşleniyor...</> : `${selectedIds.size} Ürünü Güncelle`}
                </button>
                <button onClick={() => setShowBulkUpdate(false)} disabled={bulkUpdating}
                  className="px-5 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 text-sm disabled:opacity-50">{t("action.cancel", "İptal")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Koşullu stok güncelleme modali */}
      {showCondUpdate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-violet-500" /> Koşullu Stok Güncelle
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Belirlenen stok aralığındaki tüm ürünlere aynı hareket uygulanır</p>
              </div>
              <button onClick={() => setShowCondUpdate(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>

            {/* Hızlı ön ayarlar */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">Hızlı Koşul</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Tükenenler (= 0)", min: "0", max: "0" },
                  { label: "Kritik (1–5)", min: "1", max: "5" },
                  { label: "Düşük (1–10)", min: "1", max: "10" },
                  { label: "Stoklu (> 0)", min: "1", max: "" },
                ].map(p => (
                  <button key={p.label}
                    onClick={() => { setCondForm(f => ({ ...f, minStock: p.min, maxStock: p.max })); setCondPreviewCount(null); }}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition ${condForm.minStock === p.min && condForm.maxStock === p.max ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-600 border-slate-300 hover:border-violet-400 hover:text-violet-600"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Minimum Stok (≥)</label>
                <input type="number" min={0} className={INPUT} value={condForm.minStock}
                  onChange={e => { setCondForm(f => ({ ...f, minStock: e.target.value })); setCondPreviewCount(null); }}
                  placeholder="Boş = sınırsız" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Maksimum Stok (≤)</label>
                <input type="number" min={0} className={INPUT} value={condForm.maxStock}
                  onChange={e => { setCondForm(f => ({ ...f, maxStock: e.target.value })); setCondPreviewCount(null); }}
                  placeholder="Boş = sınırsız" />
              </div>
            </div>

            {/* Preview */}
            <div className="mb-4">
              <button onClick={fetchCondPreview} disabled={condPreviewLoading || (!condForm.minStock && !condForm.maxStock)}
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 transition disabled:opacity-40">
                {condPreviewLoading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                Kaç ürün etkilenecek?
              </button>
              {condPreviewCount !== null && (
                <p className="mt-2 text-sm font-semibold text-violet-700">
                  → <span className="text-lg">{condPreviewCount}</span> ürün bu koşula uyuyor
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hareket Tipi</label>
                <select value={condForm.movementType} onChange={e => setCondForm(f => ({ ...f, movementType: e.target.value }))} className={INPUT}>
                  {MOVEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Miktar</label>
                <input type="number" min={1} className={INPUT} value={condForm.quantity}
                  onChange={e => setCondForm(f => ({ ...f, quantity: e.target.value }))} placeholder="Adet" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kritik Eşik <span className="font-normal text-slate-400">(opsiyonel)</span></label>
                  <input type="number" min={0} className={INPUT} value={condForm.criticalStockLevel}
                    onChange={e => setCondForm(f => ({ ...f, criticalStockLevel: e.target.value }))} placeholder="Değişmez" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Not <span className="font-normal text-slate-400">(opsiyonel)</span></label>
                  <input className={INPUT} value={condForm.note}
                    onChange={e => setCondForm(f => ({ ...f, note: e.target.value }))} placeholder="Açıklama" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={handleCondUpdate}
                disabled={condUpdating || !condForm.quantity || (!condForm.minStock && !condForm.maxStock)}
                className="flex-1 bg-violet-600 text-white font-semibold py-2.5 rounded-xl hover:bg-violet-700 disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                {condUpdating ? <><Loader2 size={14} className="animate-spin" /> Uygulanıyor...</> : condPreviewCount !== null ? `${condPreviewCount} Ürünü Güncelle` : "Uygula"}
              </button>
              <button onClick={() => setShowCondUpdate(false)} disabled={condUpdating}
                className="px-5 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 text-sm disabled:opacity-50">{t("action.cancel", "İptal")}</button>
            </div>
          </div>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Kritik Eşik Seviyesi
                  <span className="ml-1 text-slate-400 font-normal">(mevcut: {adjustTarget?.criticalStockLevel})</span>
                </label>
                <input type="number" min={0} className={INPUT} value={adjustForm.criticalStockLevel}
                  onChange={e => setAdjustForm(f => ({ ...f, criticalStockLevel: e.target.value }))}
                  placeholder="Boş bırakırsanız değişmez" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Not</label>
                <input className={INPUT} value={adjustForm.note}
                  onChange={e => setAdjustForm(f => ({ ...f, note: e.target.value }))} placeholder="İsteğe bağlı" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleAdjust} disabled={adjusting || !adjustForm.quantity}
                  className="flex-1 bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-50 text-sm">
                  {adjusting ? t("action.saving", "Kaydediliyor...") : t("action.save", "Kaydet")}
                </button>
                <button onClick={() => setAdjustTarget(null)}
                  className="px-5 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 text-sm">{t("action.cancel", "İptal")}</button>
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
                  <input className="pl-8 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                    value={selectedProduct ? selectedProduct.name : productSearch}
                    onChange={e => { setProductSearch(e.target.value); setSelectedProduct(null); }}
                    placeholder="Ürün adı veya SKU..." />
                </div>
                {productOptions.length > 0 && !selectedProduct && (
                  <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {productOptions.map(p => (
                      <button key={p.id} type="button"
                        onClick={() => { setSelectedProduct(p); setProductOptions([]); setProductSearch(p.name); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-teal-50 border-b border-slate-100 last:border-0">
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Kritik Eşik Seviyesi
                  <span className="ml-1 text-slate-400 font-normal">(alarm için minimum stok)</span>
                </label>
                <input type="number" min={0} className={INPUT} value={newForm.criticalStockLevel}
                  onChange={e => setNewForm(f => ({ ...f, criticalStockLevel: e.target.value }))}
                  placeholder="Varsayılan: 5" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Not</label>
                <input className={INPUT} value={newForm.note}
                  onChange={e => setNewForm(f => ({ ...f, note: e.target.value }))} placeholder="İsteğe bağlı" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleNewStock} disabled={newSaving || !selectedProduct || !newForm.quantity}
                  className="flex-1 bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-50 text-sm">
                  {newSaving ? t("action.saving", "Kaydediliyor...") : t("action.save", "Kaydet")}
                </button>
                <button onClick={() => { setShowNew(false); setSelectedProduct(null); setProductSearch(""); }}
                  className="px-5 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 text-sm">{t("action.cancel", "İptal")}</button>
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
                <th className="px-3 py-3 w-8">
                  <button
                    onClick={() => {
                      const allIds = stocks.map(s => s.productId);
                      const allSelected = allIds.every(id => selectedIds.has(id));
                      setSelectedIds(allSelected ? new Set() : new Set(allIds));
                    }}
                    className="text-slate-400 hover:text-teal-600 transition"
                  >
                    {stocks.length > 0 && stocks.every(s => selectedIds.has(s.productId))
                      ? <CheckSquare size={15} className="text-teal-600" />
                      : <Square size={15} />
                    }
                  </button>
                </th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{t("col.product", "Ürün")}</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">SKU</th>
                <th className="text-right px-5 py-3 text-slate-500 font-medium text-xs">Toplam</th>
                <th className="text-right px-5 py-3 text-slate-500 font-medium text-xs">Rezerve</th>
                <th className="text-right px-5 py-3 text-slate-500 font-medium text-xs">Kullanılabilir</th>
                <th className="text-right px-5 py-3 text-slate-500 font-medium text-xs">Kritik Seviye</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs"><button onClick={() => handleSort("createdDate")} className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">{t("col.createdAt", "Oluşturma")} <SortIcon field="createdDate" sortField={sortField} sortDir={sortDir} /></button></th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs"><button onClick={() => handleSort("dataSource")} className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">Kaynak <SortIcon field="dataSource" sortField={sortField} sortDir={sortDir} /></button></th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-slate-400">{t("action.loading", "Yükleniyor...")}</td></tr>
              ) : stocks.length === 0 ? (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-slate-400">{t("table.noData", "Kayıt bulunamadı")}</td></tr>
              ) : stocks.map((s, i) => (
                <Fragment key={`${s.productId}-${s.variantId ?? i}`}>
                  <tr className={`transition-all ${
                    s.availableQuantity === 0
                      ? "bg-red-50 border-l-4 border-l-red-500 hover:bg-red-100/60"
                      : s.isCritical
                      ? "bg-amber-50/50 border-l-4 border-l-amber-400 hover:bg-amber-50"
                      : "hover:bg-slate-50"
                  }`}>
                    <td className="px-3 py-3.5">
                      <button onClick={() => toggleSelectStock(s.productId)} className="text-slate-400 hover:text-teal-600 transition">
                        {selectedIds.has(s.productId) ? <CheckSquare size={15} className="text-teal-600" /> : <Square size={15} />}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-medium text-slate-900 max-w-[200px] truncate text-xs">{s.productName}</p>
                        {s.availableQuantity === 0 && (
                          <span className="shrink-0 text-xs bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-md animate-pulse">TÜKENDI</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs font-mono">{s.sku}</td>
                    <td className="px-5 py-3.5 text-right text-slate-700 text-xs">{s.quantity}</td>
                    <td className="px-5 py-3.5 text-right text-slate-500 text-xs">{s.reservedQuantity}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-bold text-xs ${
                        s.availableQuantity === 0
                          ? "text-red-600 text-sm"
                          : s.isCritical
                          ? "text-amber-600"
                          : "text-slate-900"
                      }`}>
                        {s.availableQuantity}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`text-xs ${s.availableQuantity === 0 ? "text-red-400 font-semibold" : s.isCritical ? "text-amber-500 font-semibold" : "text-slate-400"}`}>
                        {s.criticalStockLevel}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {s.createdDate ? new Date(s.createdDate).toLocaleDateString("tr-TR") : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {s.dataSource ? <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 whitespace-nowrap">{s.dataSource}</span> : <span className="text-xs text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openItemHistory(s)} title="Stok Geçmişi"
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white shadow-sm hover:shadow-amber-200 hover:shadow-md transition-all duration-150 active:scale-95">
                          <History size={16} />
                        </button>
                        <button onClick={() => { setAdjustTarget(s); setAdjustForm({ quantity: "", movementType: "StockIn", note: "", criticalStockLevel: String(s.criticalStockLevel) }); }}
                          title="Stok Güncelle"
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white shadow-sm hover:shadow-teal-200 hover:shadow-md transition-all duration-150 active:scale-95">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => setDeleteTarget(s)} title={t("action.delete", "Sil")}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white shadow-sm hover:shadow-red-200 hover:shadow-md transition-all duration-150 active:scale-95">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {(s.availableQuantity === 0 || s.isCritical) && (
                    <tr className={s.availableQuantity === 0
                      ? "bg-red-50 border-l-4 border-l-red-500"
                      : "bg-amber-50/50 border-l-4 border-l-amber-400"}>
                      <td colSpan={10} className="px-5 pb-3 pt-0">
                        <div className="flex items-center gap-2">
                          {s.availableQuantity === 0 ? (
                            <>
                              <PackageX size={13} className="text-red-500 shrink-0 animate-pulse" />
                              <span className="text-xs font-semibold text-red-600">
                                Stok tamamen tükendi — Satış yapılamıyor. Acil stok girişi yapınız!
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                              <span className="text-xs font-semibold text-amber-700">
                                Kritik stok seviyesinin altında ({s.availableQuantity} adet kaldı, eşik: {s.criticalStockLevel}) — Yakında tükenebilir. Stok girişi önerilir.
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && <button onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm hover:bg-slate-50 text-slate-700">{t("table.prev", "← Önceki")}</button>}
          <span className="px-4 py-2 text-sm text-slate-500">{page} / {totalPages}</span>
          {page < totalPages && <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm hover:bg-slate-50 text-slate-700">{t("table.next", "Sonraki →")}</button>}
        </div>
      )}
      </>}

      {/* Item Stock History Modal */}
      {itemHistoryTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div>
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <History size={16} className="text-amber-500" /> Stok Geçmişi
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{itemHistoryTarget.productName} · {itemHistoryTarget.sku}</p>
              </div>
              <button onClick={() => setItemHistoryTarget(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-3 pb-0 shrink-0 border-b border-slate-100">
              {(["hareketler", "audit"] as const).map(t => (
                <button key={t} onClick={() => setItemHistoryTab(t)}
                  className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors ${itemHistoryTab === t ? "bg-white border border-b-white border-slate-200 text-slate-800 -mb-px" : "text-slate-500 hover:text-slate-700"}`}>
                  {t === "hareketler" ? "Stok Hareketleri" : "Audit Log"}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1">
              {itemHistoryTab === "hareketler" ? (
                itemMovementsLoading ? (
                  <p className="p-8 text-center text-slate-400">{t("action.loading", "Yükleniyor...")}</p>
                ) : itemMovements.length === 0 ? (
                  <p className="p-8 text-center text-slate-400">Bu ürüne ait stok hareketi bulunamadı.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                      <tr>
                        {[t("col.date", "Tarih"), "Tip", "Miktar", "Önceki", "Sonraki", "Not"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itemMovements.map(m => {
                        const typeColor = m.movementType === "StockIn" || m.movementType === "Return"
                          ? "bg-emerald-100 text-emerald-700"
                          : m.movementType === "StockOut"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700";
                        return (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                              {new Date(m.createdDate).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>
                                {MOVEMENT_TYPE_LABELS[m.movementType] ?? m.movementType}
                              </span>
                            </td>
                            <td className={`px-4 py-3 text-xs font-bold ${m.movementType === "StockOut" ? "text-red-600" : "text-emerald-600"}`}>
                              {m.movementType === "StockOut" ? `-${m.quantity}` : m.movementType === "Adjustment" ? m.quantity : `+${m.quantity}`}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400">{m.quantityBefore}</td>
                            <td className="px-4 py-3 text-xs text-slate-700 font-medium">{m.quantityAfter}</td>
                            <td className="px-4 py-3 text-xs text-slate-400 max-w-[160px] truncate">{m.note ?? "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              ) : (
                itemAuditLoading ? (
                  <p className="p-8 text-center text-slate-400">{t("action.loading", "Yükleniyor...")}</p>
                ) : itemAuditLogs.length === 0 ? (
                  <p className="p-8 text-center text-slate-400">Bu ürüne ait audit kaydı bulunamadı.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                      <tr>
                        {[t("col.date", "Tarih"), "İşlem", t("col.user", "Kullanıcı"), t("action.details", "Detaylar")].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itemAuditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                            {new Date(log.createdDate).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">{log.userEmail}</td>
                          <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px] truncate">
                            {log.newValue ?? log.oldValue ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex justify-end">
              <button onClick={() => setItemHistoryTarget(null)} className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50">{t("action.close", "Kapat")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete stock confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Stok Kaydını Sil</h3>
                <p className="text-sm text-slate-500 mt-1">
                  <span className="font-medium text-slate-700">{deleteTarget.productName}</span> ürününe ait stok kaydı silinecek. {t("msg.irreversible", "Bu işlem geri alınamaz.")}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition disabled:opacity-50">
                {t("action.cancel", "İptal")}
              </button>
              <button onClick={handleDeleteStock} disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition disabled:opacity-50">
                {deleting ? t("action.deleting", "Siliniyor...") : t("action.delete", "Sil")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
