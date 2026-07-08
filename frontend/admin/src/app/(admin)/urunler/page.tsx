"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { AdminProduct, PaginatedList } from "@/types";
import { Search, Plus, Pencil, X, Star, Trash2, Download, Upload, ImagePlus, Clock, ChevronUp, ChevronDown, ChevronsUpDown, Filter, Info, CheckSquare, Square, ToggleLeft, ToggleRight, Percent, Loader2, Copy, Eye, EyeOff, AlertTriangle, FolderInput, Tag, Package } from "lucide-react";
import { useRef } from "react";
import { exportToExcel, downloadTemplate, readExcelFile } from "@/lib/excel";
import RichTextEditor from "@/components/RichTextEditor";
import { PreviewPanel, PreviewToggleButton } from "@/components/previews/PreviewPanel";
import ProductPreview from "@/components/previews/ProductPreview";
import { useI18n } from "@/contexts/I18nContext";

interface Category { id: string; name: string; slug: string; parentCategoryId?: string; subCategories?: Category[]; }

function flattenCategories(cats: Category[]): Category[] {
  const result: Category[] = [];
  for (const c of cats) {
    result.push(c);
    if (c.subCategories?.length) result.push(...flattenCategories(c.subCategories));
  }
  return result;
}
interface Brand { id: string; name: string; }
interface ProductImage { id: string; imageUrl: string; altText?: string; isMain: boolean; sortOrder: number; }
interface ProductDetail {
  id: string; name: string; slug: string; sku: string | null;
  description?: string; shortDescription?: string;
  price: number; discountPrice?: number; taxRate: number;
  categoryId: string; brandId?: string;
  isActive: boolean; isPublished: boolean; isFeatured: boolean;
  images: ProductImage[];
  oemPartNumber?: string;
  chassis?: string;
}
interface ProductHistoryEntry {
  eventType: "audit" | "stock";
  action: string;
  detail?: string;
  oldValue?: string;
  newValue?: string;
  userEmail?: string;
  occurredAt: string;
}

interface ProductForm {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: string;
  discountPrice: string;
  taxRate: string;
  categoryId: string;
  brandId: string;
  isPublished: boolean;
  isActive: boolean;
  isFeatured: boolean;
  initialStock: string;
  oemPartNumber: string;
  chassis: string;
}

const EMPTY_FORM: ProductForm = {
  name: "", slug: "", sku: "", description: "", shortDescription: "",
  price: "", discountPrice: "", taxRate: "18", categoryId: "",
  brandId: "", isPublished: true, isActive: true, isFeatured: false, initialStock: "0",
  oemPartNumber: "", chassis: "",
};

interface DupProduct {
  id: string; name: string; price: number; discountPrice?: number; sku: string | null;
  isActive: boolean; isPublished: boolean; createdDate: string;
  imageUrl?: string; stock: number;
}
interface DupGroup { name: string; price: number; count: number; products: DupProduct[]; }

const TR: Record<string, string> = {
  "ğ":"g","Ğ":"g", // ğ Ğ
  "ü":"u","Ü":"u", // ü Ü
  "ş":"s","Ş":"s", // ş Ş
  "ı":"i","İ":"i", // ı İ
  "ö":"o","Ö":"o", // ö Ö
  "ç":"c","Ç":"c", // ç Ç
};
function slugify(s: string) {
  return [...s].map(c => TR[c] ?? c).join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function Modal({ title, onClose, children, preview, showPreview, onTogglePreview }: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  preview?: React.ReactNode;
  showPreview?: boolean;
  onTogglePreview?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col transition-all duration-200 ${showPreview ? "max-w-5xl" : "max-w-3xl"}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <h2 className="font-bold text-slate-800 text-lg">{title}</h2>
          <div className="flex items-center gap-2">
            {onTogglePreview && (
              <PreviewToggleButton open={!!showPreview} onToggle={onTogglePreview} />
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition"><X size={20} /></button>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
          <PreviewPanel open={!!showPreview}>{preview}</PreviewPanel>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: React.ReactNode; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 mb-1">{label}</div>
      {children}
      {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400";
const SELECT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400";

type SortField = "name" | "price" | "stock" | "createdDate" | "dataSource";
type SortDir   = "asc" | "desc";
const PAGE_SIZES = [10, 25, 50] as const;

function buildSortKey(field: SortField, dir: SortDir) { return `${field}-${dir}`; }

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField | null; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronsUpDown size={12} className="opacity-30 ml-1 inline-block" />;
  return sortDir === "asc"
    ? <ChevronUp size={12} className="text-teal-600 ml-1 inline-block" />
    : <ChevronDown size={12} className="text-teal-600 ml-1 inline-block" />;
}

export default function AdminProductsPage() {
  const { t } = useI18n();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Search: local input state + committed search string
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filters
  const [showInactive, setShowInactive] = useState(false);
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterBrandId, setFilterBrandId] = useState("");
  const [filterDataSource, setFilterDataSource] = useState("");

  // Sort
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<{ id: string; name: string } | null>(null);
  const [history, setHistory] = useState<ProductHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const [duplicating, setDuplicating] = useState<string | null>(null);

  // Bulk selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [priceAdjustModal, setPriceAdjustModal] = useState(false);
  const [priceAdjustPercent, setPriceAdjustPercent] = useState("");
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

  // Toplu fiyat güncelle modal
  const [bulkPriceModal, setBulkPriceModal] = useState(false);
  const [bpTarget, setBpTarget] = useState<"selected" | "category" | "brand">("selected");
  const [bpCategoryId, setBpCategoryId] = useState("");
  const [bpBrandId, setBpBrandId] = useState("");
  const [bpOperation, setBpOperation] = useState<"percent" | "amount" | "set">("percent");
  const [bpValue, setBpValue] = useState("");
  const [bpPreviewCount, setBpPreviewCount] = useState<number | null>(null);
  const [bpPreviewLoading, setBpPreviewLoading] = useState(false);
  const [bpApplying, setBpApplying] = useState(false);

  // Toplu kategori/marka değiştir modal
  const [bulkAssignModal, setBulkAssignModal] = useState<"category" | "brand" | null>(null);
  const [bulkAssignId, setBulkAssignId] = useState("");
  const [bulkAssigning, setBulkAssigning] = useState(false);

  // Toplu stok güncelle modal (seçili)
  const [bulkStockModal, setBulkStockModal] = useState(false);
  const [bulkStockForm, setBulkStockForm] = useState({ quantity: "", movementType: "StockIn", note: "", criticalStockLevel: "" });
  const [bulkStockUpdating, setBulkStockUpdating] = useState(false);

  // Koşullu stok güncelle modal
  const [condStockModal, setCondStockModal] = useState(false);
  const [condStockForm, setCondStockForm] = useState({ minStock: "", maxStock: "", quantity: "", movementType: "StockIn", note: "", criticalStockLevel: "" });
  const [condStockPreview, setCondStockPreview] = useState<number | null>(null);
  const [condStockPreviewLoading, setCondStockPreviewLoading] = useState(false);
  const [condStockUpdating, setCondStockUpdating] = useState(false);

  // Duplicate products panel
  const [dupGroups, setDupGroups] = useState<DupGroup[] | null>(null);
  const [loadingDups, setLoadingDups] = useState(false);
  const [showDupPanel, setShowDupPanel] = useState(false);
  const [selectedDups, setSelectedDups] = useState<Set<string>>(new Set());
  const [deletingDups, setDeletingDups] = useState(false);

  // Image management state
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageAlt, setNewImageAlt] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [stagedImages, setStagedImages] = useState<string[]>([]);

  // Computed: how many active filters
  const activeFilterCount = useMemo(() =>
    [search, filterCategoryId, filterBrandId, filterDataSource, showInactive ? "1" : ""].filter(Boolean).length,
    [search, filterCategoryId, filterBrandId, filterDataSource, showInactive]
  );

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) qs.set("search", search);
      if (!showInactive) qs.set("onlyActive", "true");
      if (filterCategoryId) qs.set("categoryId", filterCategoryId);
      if (filterBrandId) qs.set("brandId", filterBrandId);
      if (filterDataSource) qs.set("dataSource", filterDataSource);
      if (sortField) qs.set("sortBy", buildSortKey(sortField, sortDir));
      const data = await api.get<PaginatedList<AdminProduct>>(`/api/products?${qs}`);
      setProducts(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [page, pageSize, search, showInactive, filterCategoryId, filterBrandId, filterDataSource, sortField, sortDir]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetchProducts();
      setSelected(new Set());
    }, 0);
    return () => window.clearTimeout(id);
  }, [fetchProducts]);

  useEffect(() => {
    api.get<Category[]>("/api/categories?onlyActive=false").then(data => setCategories(flattenCategories(data))).catch(() => {});
    api.get<{ items: Brand[] }>("/api/brands?pageSize=200&onlyActive=false").then(r => setBrands(r.items)).catch(() => {});
  }, []);

  // Debounced search: commit after 400ms idle
  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 400);
  }

  function commitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearch(searchInput);
    setPage(1);
  }

  function clearAllFilters() {
    setSearchInput(""); setSearch(""); setFilterCategoryId(""); setFilterBrandId("");
    setFilterDataSource(""); setShowInactive(false); setSortField(null); setPage(1);
  }

  // Bulk selection helpers
  const allPageIds = products.map(p => p.id);
  const allSelected = allPageIds.length > 0 && allPageIds.every(id => selected.has(id));
  const someSelected = allPageIds.some(id => selected.has(id)) && !allSelected;

  function toggleSelectAll() {
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) allPageIds.forEach(id => next.delete(id));
      else allPageIds.forEach(id => next.add(id));
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleBulkAction(action: string, pricePercent?: number) {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const body: Record<string, unknown> = { productIds: [...selected], action };
      if (pricePercent !== undefined) body.priceAdjustPercent = pricePercent;
      const r = await api.post<{ affected: number; errors: string[] }>("/api/products/bulk", body);
      const verb = action === "delete" ? t("auto.silindi", "silindi") : t("auto.guncellendi", "güncellendi");
      const allSkipped = r.affected === 0 && r.errors.length > 0;
      const msg = allSkipped
        ? `${t("auto.hicbirUrunSilmedi", "Hiçbir ürün silinemedi")} — ${r.errors[0] ?? t("auto.aktifSiparisliAtlanir", "aktif siparişi var")}`
        : `${r.affected} ${t("auto.urun", "ürün")} ${verb}${r.errors.length ? ` (${r.errors.length} ${t("auto.atlandı", "atlandı")})` : ""}`;
      setMsg({ text: msg, ok: !allSkipped });
      setSelected(new Set());
      await fetchProducts();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : t("auto.islemBasarisiz", "İşlem başarısız"), ok: false });
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkAssign() {
    if (selected.size === 0 || !bulkAssignId || !bulkAssignModal) return;
    setBulkAssigning(true);
    try {
      const body: Record<string, unknown> = {
        productIds: [...selected],
        action: bulkAssignModal === "category" ? "set-category" : "set-brand",
        ...(bulkAssignModal === "category" ? { newCategoryId: bulkAssignId } : { newBrandId: bulkAssignId }),
      };
      const r = await api.post<{ affected: number; errors: string[] }>("/api/products/bulk", body);
      const label = bulkAssignModal === "category" ? "kategorisi" : "markası";
      setMsg({ text: `${r.affected} ürünün ${label} güncellendi${r.errors.length ? ` (${r.errors.length} atlandı)` : ""}`, ok: true });
      setBulkAssignModal(null);
      setBulkAssignId("");
      setSelected(new Set());
      await fetchProducts();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "İşlem başarısız", ok: false });
    } finally {
      setBulkAssigning(false);
    }
  }

  function buildBpBody() {
    const body: Record<string, unknown> = {};
    if (bpTarget === "selected") body.productIds = [...selected];
    else if (bpTarget === "category") body.categoryId = bpCategoryId;
    else if (bpTarget === "brand") body.brandId = bpBrandId;
    return body;
  }

  async function fetchBpPreview() {
    setBpPreviewLoading(true);
    setBpPreviewCount(null);
    try {
      const r = await api.post<{ count: number }>("/api/products/bulk-price-preview", buildBpBody());
      setBpPreviewCount(r.count);
    } catch { setBpPreviewCount(null); }
    finally { setBpPreviewLoading(false); }
  }

  async function handleBulkPriceApply() {
    const val = parseFloat(bpValue);
    if (isNaN(val)) return;
    setBpApplying(true);
    try {
      const body = { ...buildBpBody() } as Record<string, unknown>;
      if (bpOperation === "percent") { body.action = "price-adjust"; body.priceAdjustPercent = val; }
      else if (bpOperation === "amount") { body.action = "price-adjust-amount"; body.priceAdjustAmount = val; }
      else { body.action = "price-set"; body.priceSetValue = val; }
      const r = await api.post<{ affected: number; errors: string[] }>("/api/products/bulk", body);
      setMsg({ text: `${r.affected} ürün fiyatı güncellendi${r.errors.length ? ` (${r.errors.length} atlandı)` : ""}`, ok: true });
      setBulkPriceModal(false);
      setBpValue(""); setBpPreviewCount(null);
      await fetchProducts();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "İşlem başarısız", ok: false });
    } finally { setBpApplying(false); }
  }

  // Toggle sort: same field → flip direction; different field → set desc
  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  }

  function handleExport() {
    exportToExcel(
      products.map(p => ({
        "Ad": p.name, "SKU": p.sku, "Slug": p.slug,
        "Fiyat": p.price, "İndirimli Fiyat": p.discountPrice ?? "",
        "Kategori": p.categoryName ?? "", "Marka": p.brandName ?? "",
        "Stok": p.availableStock, "Durum": p.isActive ? "Aktif" : "Pasif",
      })),
      "urunler", "Ürünler"
    );
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true); setImportResult(null);
    let ok = 0, fail = 0;
    const cats = await api.get<{id:string;name:string}[]>("/api/categories?onlyActive=false").catch(() => []);
    const brds = await api.get<{items:{id:string;name:string}[]}>("/api/brands?pageSize=500&onlyActive=false").then(r => r.items).catch(() => []);
    try {
      const rows = await readExcelFile(file);
      for (const row of rows) {
        try {
          const name = String(row["Ad"] ?? ""); if (!name) { fail++; continue; }
          const catName = String(row["Kategori"] ?? "");
          const brandName = String(row["Marka"] ?? "");
          const cat = cats.find(c => c.name === catName);
          const brand = brds.find(b => b.name === brandName);
          await api.post("/api/products", {
            name, slug: slugify(name),
            sku: String(row["SKU"] ?? name.substring(0,8).toUpperCase()),
            description: null, shortDescription: null, barcode: null, productType: 1,
            categoryId: cat?.id ?? cats[0]?.id ?? "00000000-0000-0000-0000-000000000000",
            brandId: brand?.id ?? null,
            price: Number(row["Fiyat"] ?? 0),
            discountPrice: row["İndirimli Fiyat"] ? Number(row["İndirimli Fiyat"]) : null,
            currency: "TRY", taxRate: 18, isPublished: true,
            metaTitle: null, metaDescription: null,
            initialStock: Number(row["Stok"] ?? 0),
          });
          ok++;
        } catch { fail++; }
      }
      setImportResult(`${ok} ${t("auto.urunEklendi", "ürün eklendi")}${fail > 0 ? `, ${fail} ${t("auto.hatali", "hatalı")}` : ""}.`);
      await fetchProducts();
    } catch { setImportResult(t("auto.dosyaOkunamadi", "Dosya okunamadı.")); }
    finally { setImporting(false); e.target.value = ""; }
  }

  async function loadDuplicates() {
    setLoadingDups(true);
    try {
      const data = await api.get<DupGroup[]>("/api/products/duplicates");
      setDupGroups(data);
      setShowDupPanel(true);
      setSelectedDups(new Set());
    } catch { setMsg({ text: "Mükerrer ürünler yüklenemedi.", ok: false }); }
    finally { setLoadingDups(false); }
  }

  async function fetchCondStockPreview() {
    if (!condStockForm.minStock && !condStockForm.maxStock) { setCondStockPreview(null); return; }
    setCondStockPreviewLoading(true);
    try {
      const qs = new URLSearchParams();
      if (condStockForm.minStock !== "") qs.set("minStock", condStockForm.minStock);
      if (condStockForm.maxStock !== "") qs.set("maxStock", condStockForm.maxStock);
      const data = await api.get<{ count: number }>(`/api/admin/stocks/condition-preview?${qs}`);
      setCondStockPreview(data.count);
    } catch { setCondStockPreview(null); }
    finally { setCondStockPreviewLoading(false); }
  }

  async function handleCondStockUpdate() {
    if (!condStockForm.quantity) return;
    if (!condStockForm.minStock && !condStockForm.maxStock) return;
    setCondStockUpdating(true);
    try {
      const result = await api.post<{ succeeded: number; failed: number }>(
        "/api/admin/stocks/bulk-adjust-by-condition",
        {
          minStock: condStockForm.minStock !== "" ? Number(condStockForm.minStock) : null,
          maxStock: condStockForm.maxStock !== "" ? Number(condStockForm.maxStock) : null,
          quantity: Number(condStockForm.quantity),
          movementType: condStockForm.movementType,
          note: condStockForm.note || null,
          criticalStockLevel: condStockForm.criticalStockLevel !== "" ? Number(condStockForm.criticalStockLevel) : null,
        }
      );
      setMsg({ text: `${result.succeeded} ürün stoku güncellendi${result.failed > 0 ? `, ${result.failed} hatalı` : ""}.`, ok: result.failed === 0 });
      setCondStockModal(false);
      setCondStockForm({ minStock: "", maxStock: "", quantity: "", movementType: "StockIn", note: "", criticalStockLevel: "" });
      setCondStockPreview(null);
      await fetchProducts();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Hata", ok: false });
    } finally { setCondStockUpdating(false); }
  }

  async function handleBulkStockUpdate() {
    if (!bulkStockForm.quantity || selected.size === 0) return;
    setBulkStockUpdating(true);
    try {
      const result = await api.post<{ succeeded: number; failed: number; errors: string[] }>(
        "/api/admin/stocks/bulk-adjust",
        {
          productIds: [...selected],
          quantity: Number(bulkStockForm.quantity),
          movementType: bulkStockForm.movementType,
          note: bulkStockForm.note || null,
          criticalStockLevel: bulkStockForm.criticalStockLevel !== "" ? Number(bulkStockForm.criticalStockLevel) : null,
        }
      );
      setMsg({
        text: `${result.succeeded} ürün stoku güncellendi${result.failed > 0 ? `, ${result.failed} hatalı` : ""}.`,
        ok: result.failed === 0,
      });
      setBulkStockModal(false);
      setSelected(new Set());
      setBulkStockForm({ quantity: "", movementType: "StockIn", note: "", criticalStockLevel: "" });
      await fetchProducts();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Toplu stok güncelleme hatası", ok: false });
    } finally { setBulkStockUpdating(false); }
  }

  async function handleDeleteDups() {
    if (selectedDups.size === 0) return;
    // Safety: never delete the canonical (first) product in each group
    const canonicalIds = new Set(dupGroups?.map(g => g.products[0]?.id).filter(Boolean) ?? []);
    const toDelete = [...selectedDups].filter(id => !canonicalIds.has(id));
    if (toDelete.length === 0) { setMsg({ text: "Silinecek fazla kopya seçilmedi.", ok: false }); return; }
    setDeletingDups(true);
    try {
      const r = await api.post<{ affected: number; errors: string[] }>("/api/products/bulk", {
        productIds: toDelete, action: "delete",
      });
      setMsg({ text: `${r.affected} mükerrer ürün silindi${r.errors.length ? ` (${r.errors.length} atlandı)` : ""}.`, ok: true });
      setSelectedDups(new Set());
      await loadDuplicates();
      await fetchProducts();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Silme başarısız", ok: false });
    } finally { setDeletingDups(false); }
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError("");
    setProductImages([]);
    setNewImageUrl("");
    setNewImageAlt("");
    setStagedImages([]);
    setModal("create");
  }

  async function openEdit(p: AdminProduct) {
    setForm({
      id: p.id, name: p.name, slug: p.slug, sku: p.sku ?? "",
      description: "", shortDescription: "",
      price: String(p.price), discountPrice: p.discountPrice ? String(p.discountPrice) : "",
      taxRate: String(p.taxRate), categoryId: "", brandId: "",
      isPublished: true, isActive: p.isActive, isFeatured: p.isFeatured, initialStock: "0",
      oemPartNumber: "", chassis: "",
    });
    setFormError("");
    setNewImageUrl("");
    setNewImageAlt("");
    setProductImages([]);
    setModal("edit");
    try {
      const detail = await api.get<ProductDetail>(`/api/products/${p.id}`);
      setProductImages(detail.images ?? []);
      setForm(f => ({
        ...f,
        description: detail.description ?? "",
        shortDescription: detail.shortDescription ?? "",
        categoryId: detail.categoryId ?? "",
        brandId: detail.brandId ?? "",
        isPublished: detail.isPublished,
        isFeatured: detail.isFeatured,
        taxRate: String(detail.taxRate),
        oemPartNumber: detail.oemPartNumber ?? "",
        chassis: detail.chassis ?? "",
      }));
    } catch { setProductImages([]); }
  }

  function setField<K extends keyof ProductForm>(k: K, v: ProductForm[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    if (!form.name || !form.sku || !form.price) { setFormError(t("auto.adSkuFiyatZorunlu", "Ad, SKU ve Fiyat zorunludur.")); return; }
    if (modal === "create" && !form.categoryId) { setFormError(t("auto.kategoriSeciniz", "Kategori seçiniz.")); return; }
    setSaving(true); setFormError("");
    try {
      if (modal === "create") {
        const created = await api.post<{ id: string }>("/api/products", {
          name: form.name,
          slug: form.slug || slugify(form.name),
          sku: form.sku,
          description: form.description || null,
          shortDescription: form.shortDescription || null,
          barcode: null,
          productType: 1,
          categoryId: form.categoryId,
          brandId: form.brandId || null,
          price: parseFloat(form.price),
          discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null,
          currency: "TRY",
          taxRate: parseFloat(form.taxRate) || 18,
          isPublished: form.isPublished,
          isFeatured: form.isFeatured,
          metaTitle: null,
          metaDescription: null,
          initialStock: parseInt(form.initialStock) || 0,
          oemPartNumber: form.oemPartNumber || null,
          chassis: form.chassis || null,
        });
        if (created?.id && stagedImages.length > 0) {
          for (let i = 0; i < stagedImages.length; i++) {
            try {
              await api.post(`/api/products/${created.id}/images`, {
                productId: created.id,
                imageUrl: stagedImages[i],
                sortOrder: i,
                isMain: i === 0,
                altText: null,
              });
            } catch { /* resim eklenemedi ama ürün oluşturuldu */ }
          }
        }
        setMsg({ text: t("auto.urunOlusturuldu", "Ürün oluşturuldu."), ok: true });
      } else {
        await api.put(`/api/products/${form.id}`, {
          id: form.id,
          name: form.name,
          slug: form.slug,
          sku: form.sku,
          description: form.description || null,
          shortDescription: form.shortDescription || null,
          barcode: null,
          categoryId: form.categoryId || "00000000-0000-0000-0000-000000000000",
          brandId: form.brandId || null,
          price: parseFloat(form.price),
          discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null,
          taxRate: parseFloat(form.taxRate) || 18,
          isActive: form.isActive,
          isPublished: form.isPublished,
          isFeatured: form.isFeatured,
          metaTitle: null,
          metaDescription: null,
          oemPartNumber: form.oemPartNumber || null,
          chassis: form.chassis || null,
        });
        setMsg({ text: t("auto.urunGuncellendi", "Ürün güncellendi."), ok: true });
      }
      setModal(null);
      await fetchProducts();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : t("auto.hataOlustu", "Hata oluştu."));
    } finally { setSaving(false); }
  }

  async function handleAddImage() {
    if (!newImageUrl || !form.id) return;
    setImageLoading(true);
    try {
      await api.post(`/api/products/${form.id}/images`, {
        productId: form.id,
        imageUrl: newImageUrl,
        sortOrder: productImages.length,
        isMain: productImages.length === 0,
        altText: newImageAlt || null,
      });
      setNewImageUrl("");
      setNewImageAlt("");
      const refreshed = await api.get<ProductDetail>(`/api/products/${form.id}`);
      setProductImages(refreshed.images ?? []);
      await fetchProducts();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : t("auto.fotografEklenemedi", "Fotoğraf eklenemedi."));
    } finally { setImageLoading(false); }
  }

  async function handleDeleteImage(imageId: string) {
    if (!form.id) return;
    try {
      await api.delete(`/api/products/${form.id}/images/${imageId}`);
      setProductImages(imgs => imgs.filter(i => i.id !== imageId));
      await fetchProducts();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : t("auto.fotografSilinemedi", "Fotoğraf silinemedi."));
    }
  }

  async function handleSetMainImage(imageId: string) {
    if (!form.id) return;
    try {
      await api.patch(`/api/products/${form.id}/images/${imageId}/set-main`);
      setProductImages(imgs => imgs.map(i => ({ ...i, isMain: i.id === imageId })));
      await fetchProducts();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : t("auto.anaFotografAyarlanamadi", "Ana fotoğraf ayarlanamadı."));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/products/${deleteTarget.id}`);
      setMsg({ text: `"${deleteTarget.name}" ${t("auto.silindi", "silindi")}.`, ok: true });
      setDeleteTarget(null);
      await fetchProducts();
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : t("auto.silinemedi", "Silinemedi."), ok: false });
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  }

  async function handleDuplicate(p: AdminProduct) {
    setDuplicating(p.id);
    try {
      const detail = await api.get<ProductDetail>(`/api/products/${p.id}`);
      const newName = `${p.name} (Kopya)`;
      const baseSku = p.sku ?? "";
      const newSku = baseSku.length > 20 ? baseSku.substring(0, 18) + "-K" : baseSku ? `${baseSku}-K` : "";
      const created = await api.post<{ id: string }>("/api/products", {
        name: newName,
        slug: slugify(newName),
        sku: newSku,
        description: detail.description || null,
        shortDescription: detail.shortDescription || null,
        barcode: null,
        productType: 1,
        categoryId: detail.categoryId,
        brandId: detail.brandId || null,
        price: p.price,
        discountPrice: p.discountPrice || null,
        currency: "TRY",
        taxRate: detail.taxRate,
        isPublished: false,
        isFeatured: false,
        metaTitle: null,
        metaDescription: null,
        initialStock: 0,
      });
      if (created?.id && detail.images?.length > 0) {
        for (let i = 0; i < detail.images.length; i++) {
          try {
            await api.post(`/api/products/${created.id}/images`, {
              productId: created.id,
              imageUrl: detail.images[i].imageUrl,
              sortOrder: detail.images[i].sortOrder,
              isMain: detail.images[i].isMain,
              altText: detail.images[i].altText || null,
            });
          } catch { /* resim kopyalanamadı, devam */ }
        }
      }
      setMsg({ text: `"${newName}" oluşturuldu (taslak, yayınlanmadı).`, ok: true });
      await fetchProducts();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : t("auto.cogaltmaBasarisiz", "Çoğaltma başarısız."), ok: false });
    } finally {
      setDuplicating(null);
    }
  }

  async function openHistory(p: { id: string; name: string }) {
    setHistoryTarget(p);
    setHistory([]);
    setHistoryError(null);
    setHistoryLoading(true);
    try {
      const data = await api.get<ProductHistoryEntry[]>(`/api/products/${p.id}/history`);
      setHistory(data ?? []);
    } catch (e: unknown) {
      setHistoryError(e instanceof Error ? e.message : t("auto.gecmisYuklenemedi", "Geçmiş yüklenemedi."));
    } finally { setHistoryLoading(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t("auto.urunler", "Ürünler")}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadTemplate(["Ad", "SKU", "Fiyat", "İndirimli Fiyat", "Kategori", "Marka", "Stok"], "urunler")}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">{t("action.downloadTemplate", "Şablon İndir")}</button>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">
            <Download size={14} /> {t("action.exportExcel", "Excel'e Aktar")}
          </button>
          <label className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition cursor-pointer">
            <Upload size={14} /> {importing ? t("action.importing", "Aktarılıyor...") : t("action.importFile", "İçe Aktar")}
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button
            onClick={() => { setBulkPriceModal(true); setBpTarget(selected.size > 0 ? "selected" : "category"); setBpPreviewCount(null); setBpValue(""); }}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition"
          >
            <Percent size={14} /> {t("ui.bulkPriceUpdate", "Toplu Fiyat")}
          </button>
          <button
            onClick={() => { setCondStockModal(true); setCondStockForm({ minStock: "", maxStock: "", quantity: "", movementType: "StockIn", note: "", criticalStockLevel: "" }); setCondStockPreview(null); }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition"
          >
            <Package size={14} /> Koşullu Stok
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-[#12304A] hover:bg-[#0d2438] text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow">
            <Plus size={16} /> {t("ui.newProduct", "Yeni Ürün")}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`text-sm px-4 py-3 rounded-xl flex items-center justify-between ${msg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.text}
          <button onClick={() => setMsg(null)}><X size={14} /></button>
        </div>
      )}
      {importResult && (
        <div className="text-sm px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-between">
          {importResult} <button onClick={() => setImportResult(null)}><X size={14} /></button>
        </div>
      )}

      {/* Mükerrer Ürünler Kartı */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <span className="text-sm font-semibold text-slate-800">Mükerrer Ürünler</span>
            {dupGroups !== null && (
              <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                {dupGroups.length} grup · {dupGroups.reduce((s, g) => s + g.count, 0)} ürün
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedDups.size > 0 && (
              <button
                onClick={handleDeleteDups}
                disabled={deletingDups}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition disabled:opacity-50"
              >
                {deletingDups ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                {selectedDups.size} seçiliyi sil
              </button>
            )}
            <button
              onClick={() => { if (dupGroups === null) loadDuplicates(); else setShowDupPanel(p => !p); }}
              disabled={loadingDups}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl transition disabled:opacity-50"
            >
              {loadingDups ? <Loader2 size={12} className="animate-spin" /> : null}
              {dupGroups === null ? "Tara" : showDupPanel ? "Gizle" : "Göster"}
            </button>
            {dupGroups !== null && (
              <button onClick={loadDuplicates} disabled={loadingDups} title="Yenile"
                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition disabled:opacity-50">
                <ChevronDown size={14} className={loadingDups ? "animate-spin" : ""} />
              </button>
            )}
          </div>
        </div>

        {showDupPanel && dupGroups !== null && dupGroups.length === 0 && (
          <div className="px-5 pb-4 text-xs text-slate-400">Mükerrer ürün bulunamadı.</div>
        )}

        {showDupPanel && dupGroups !== null && dupGroups.length > 0 && (
          <div className="border-t border-amber-100 divide-y divide-amber-50 max-h-96 overflow-y-auto">
            {dupGroups.map((group, gi) => {
              const extras = group.products.slice(1); // all except canonical (first)
              const groupSelected = extras.length > 0 && extras.every(p => selectedDups.has(p.id));
              const groupSome = extras.some(p => selectedDups.has(p.id));
              return (
                <div key={gi} className="px-5 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => {
                        setSelectedDups(prev => {
                          const next = new Set(prev);
                          if (groupSelected) extras.forEach(p => next.delete(p.id));
                          else extras.forEach(p => next.add(p.id));
                          return next;
                        });
                      }}
                      className="text-slate-400 hover:text-amber-600 transition shrink-0"
                    >
                      {groupSelected ? <CheckSquare size={14} className="text-amber-500" /> : groupSome ? <CheckSquare size={14} className="text-slate-300" /> : <Square size={14} />}
                    </button>
                    <span className="text-xs font-semibold text-slate-700 truncate flex-1">{group.name}</span>
                    <span className="text-xs text-slate-500 shrink-0">{group.price.toLocaleString("tr-TR")} ₺</span>
                    <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full shrink-0">{group.count}x</span>
                  </div>
                  <div className="space-y-1 pl-5">
                    {group.products.map((p, pi) => {
                      const isCanonical = pi === 0;
                      return (
                        <div key={p.id} className="flex items-center gap-2 text-xs text-slate-600">
                          {isCanonical ? (
                            <span className="shrink-0 w-[13px]" title="Bu ürün tutulacak">
                              <Square size={13} className="text-slate-200" />
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedDups(prev => {
                                const next = new Set(prev);
                                if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                                return next;
                              })}
                              className="shrink-0 text-slate-300 hover:text-amber-500 transition"
                            >
                              {selectedDups.has(p.id) ? <CheckSquare size={13} className="text-amber-500" /> : <Square size={13} />}
                            </button>
                          )}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {p.imageUrl && <img src={p.imageUrl} alt="" className="w-7 h-7 object-cover rounded-lg border border-slate-100 shrink-0" />}
                          <span className="flex-1 truncate">{p.sku ? <span className="font-mono text-slate-400 mr-1">{p.sku}</span> : null}{p.name}</span>
                          {isCanonical && <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded shrink-0">Tut</span>}
                          <span className="text-slate-400 shrink-0">Stok: {p.stock}</span>
                          <span className={`shrink-0 ${p.isActive ? "text-green-600" : "text-slate-400"}`}>{p.isActive ? "Aktif" : "Pasif"}</span>
                          <span className="text-slate-400 shrink-0">{new Date(p.createdDate).toLocaleDateString("tr-TR")}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-10 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <form onSubmit={commitSearch} className="flex gap-2 flex-1 min-w-[220px]">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                value={searchInput}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder={t("filter.search", "Ara...")}
                className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-full text-slate-900 bg-white"
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="submit" className="px-4 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition">{t("action.search", "Ara")}</button>
          </form>

          {/* Category filter */}
          <select
            value={filterCategoryId}
            onChange={e => { setFilterCategoryId(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 min-w-[150px]"
          >
            <option value="">{t("filter.allCategories", "Tüm Kategoriler")}</option>
            {categories.filter(c => !c.parentCategoryId).map(parent => {
              const subs = categories.filter(c => c.parentCategoryId === parent.id);
              return subs.length > 0 ? (
                <optgroup key={parent.id} label={parent.name}>
                  <option value={parent.id}>{parent.name}</option>
                  {subs.map(sub => <option key={sub.id} value={sub.id}>↳ {sub.name}</option>)}
                </optgroup>
              ) : (
                <option key={parent.id} value={parent.id}>{parent.name}</option>
              );
            })}
          </select>

          {/* Brand filter */}
          <select
            value={filterBrandId}
            onChange={e => { setFilterBrandId(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 min-w-[130px]"
          >
            <option value="">{t("filter.allBrands", "Tüm Markalar")}</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          {/* DataSource filter */}
          <select
            value={filterDataSource}
            onChange={e => { setFilterDataSource(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 min-w-[140px]"
          >
            <option value="">{t("filter.allSources", "Tüm Kaynaklar")}</option>
            <option value="__manual__">{t("filter.manual", "Manuel Giriş")}</option>
            <option value="catalogiq">CatalogIQ</option>
            <option value="test">Test</option>
          </select>

          {/* Page size */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-slate-500 whitespace-nowrap">{t("auto.sayfaBasi", "Sayfa başı:")} </span>
            {PAGE_SIZES.map(n => (
              <button key={n} onClick={() => { setPageSize(n); setPage(1); }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${pageSize === n ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Second row: toggles + active filter chips */}
        <div className="flex flex-wrap gap-2 items-center">
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-100 transition">
            <input type="checkbox" checked={showInactive} onChange={e => { setShowInactive(e.target.checked); setPage(1); }} className="rounded" />
            {t("auto.pasifUrunleriDahilEt", "Pasif ürünleri dahil et")}
          </label>

          {sortField && (
            <span className="flex items-center gap-1.5 text-xs bg-teal-50 border border-teal-200 text-teal-700 rounded-lg px-2.5 py-1.5">
              <Filter size={10} />
              {t("auto.siralama", "Sıralama")}: {sortField === "name" ? t("col.name", "Ad") : sortField === "price" ? t("col.price", "Fiyat") : sortField === "createdDate" ? t("col.date", "Tarih") : sortField === "dataSource" ? t("auto.kaynak", "Kaynak") : t("col.stock", "Stok")} {sortDir === "asc" ? "↑" : "↓"}
              <button onClick={() => { setSortField(null); setPage(1); }} className="ml-1 hover:text-red-500"><X size={11} /></button>
            </span>
          )}

          {(activeFilterCount > 0 || sortField) && (
            <button onClick={clearAllFilters}
              className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-2.5 py-1.5 hover:bg-red-50 transition">
              {t("filter.clearFilters", "Filtreleri Temizle")}
            </button>
          )}

          <span className="ml-auto text-xs text-slate-400">
            {loading ? t("table.loading", "Yükleniyor...") : `${totalCount} ${t("auto.urun", "ürün")}`}
          </span>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-teal-700 text-white rounded-2xl px-5 py-3 flex items-center gap-3 flex-wrap shadow-md">
          <span className="text-sm font-semibold shrink-0">
            {selected.size} {t("auto.urunSecili", "ürün seçili")}
          </span>
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <button
              onClick={() => handleBulkAction("activate")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-xl transition disabled:opacity-50"
            >
              {bulkLoading ? <Loader2 size={12} className="animate-spin" /> : <ToggleRight size={14} />}
              {t("action.activate", "Aktifleştir")}
            </button>
            <button
              onClick={() => handleBulkAction("deactivate")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-xl transition disabled:opacity-50"
            >
              <ToggleLeft size={14} /> {t("action.deactivate", "Deaktive Et")}
            </button>
            <button
              onClick={() => handleBulkAction("publish")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-xl transition disabled:opacity-50"
            >
              <Eye size={13} /> Yayınla
            </button>
            <button
              onClick={() => handleBulkAction("unpublish")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-xl transition disabled:opacity-50"
            >
              <EyeOff size={13} /> Yayından Kaldır
            </button>
            <button
              onClick={() => setPriceAdjustModal(true)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-xl transition disabled:opacity-50"
            >
              <Percent size={12} /> {t("ui.priceAdjust", "Fiyat Ayarla")}
            </button>
            <button
              onClick={() => { setBulkAssignModal("category"); setBulkAssignId(""); }}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-xl transition disabled:opacity-50"
            >
              <FolderInput size={12} /> Kategori Değiştir
            </button>
            <button
              onClick={() => { setBulkAssignModal("brand"); setBulkAssignId(""); }}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-xl transition disabled:opacity-50"
            >
              <Tag size={12} /> Marka Değiştir
            </button>
            <button
              onClick={() => { setBulkStockModal(true); setBulkStockForm({ quantity: "", movementType: "StockIn", note: "", criticalStockLevel: "" }); }}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600/80 hover:bg-emerald-600 rounded-xl transition disabled:opacity-50"
            >
              <Package size={12} /> Toplu Stok
            </button>
            <button
              onClick={() => setBulkDeleteModal(true)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/80 hover:bg-red-500 rounded-xl transition disabled:opacity-50"
            >
              <Trash2 size={12} /> {t("action.delete", "Sil")}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-teal-600 transition">
                    {allSelected ? <CheckSquare size={16} className="text-teal-600" /> : someSelected ? <CheckSquare size={16} className="text-slate-400 opacity-60" /> : <Square size={16} />}
                  </button>
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">
                  <button onClick={() => handleSort("name")}
                    className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">
                    {t("auto.urun", "Ürün")} <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">SKU</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">{t("col.category", "Kategori")} / {t("col.brand", "Marka")}</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500">
                  <button onClick={() => handleSort("price")}
                    className="flex items-center gap-0.5 ml-auto hover:text-teal-600 transition select-none">
                    {t("col.price", "Fiyat")} <SortIcon field="price" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500">
                  <button onClick={() => handleSort("stock")}
                    className="flex items-center gap-0.5 ml-auto hover:text-teal-600 transition select-none">
                    {t("col.stock", "Stok")} <SortIcon field="stock" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">{t("col.status", "Durum")}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500"><button onClick={() => handleSort("dataSource")} className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">{t("ui.source", "Kaynak")} <SortIcon field="dataSource" sortField={sortField} sortDir={sortDir} /></button></th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500"><button onClick={() => handleSort("createdDate")} className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">{t("col.date", "Tarih")} <SortIcon field="createdDate" sortField={sortField} sortDir={sortDir} /></button></th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">{t("ui.createdBy", "Oluşturan")}</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={11} className="px-5 py-10 text-center text-slate-400">{t("action.loading", "Yükleniyor...")}</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={11} className="px-5 py-10 text-center text-slate-400">{t("table.noResults", "Sonuç bulunamadı")}</td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className={`hover:bg-slate-50 transition ${!p.isActive ? "opacity-60" : ""} ${selected.has(p.id) ? "bg-teal-50/50" : ""}`}>
                  <td className="px-4 py-3 w-10">
                    <button onClick={() => toggleSelect(p.id)} className="text-slate-400 hover:text-teal-600 transition">
                      {selected.has(p.id) ? <CheckSquare size={15} className="text-teal-600" /> : <Square size={15} />}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt={p.name} className="object-contain w-full h-full p-0.5" /> // eslint-disable-line @next/next/no-img-element
                          : <span className="text-base">📦</span>}
                      </div>
                      <p className="font-medium text-slate-900 max-w-[180px] truncate text-xs">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs font-mono">{p.sku}</td>
                  <td className="px-5 py-3 text-xs">
                    <p className="text-slate-700">{p.categoryName ?? "—"}</p>
                    <p className="text-slate-400">{p.brandName ?? "—"}</p>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <p className="font-bold text-teal-700 text-xs">{formatPrice(p.discountPrice ?? p.price)}</p>
                    {p.discountPrice && <p className="text-xs text-slate-400 line-through">{formatPrice(p.price)}</p>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`font-semibold text-xs ${p.availableStock === 0 ? "text-red-600 animate-pulse" : p.availableStock <= 5 ? "text-orange-500" : "text-slate-900"}`}>
                      {p.availableStock}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {p.isActive ? t("status.active", "Aktif") : t("status.passive", "Pasif")}
                      </span>
                      {p.isFeatured && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700">{t("status.featured", "Öne Çıkan")}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {p.dataSource
                      ? <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 whitespace-nowrap">{p.dataSource}</span>
                      : p.importedFromSourceName
                      ? <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 whitespace-nowrap">{p.importedFromSourceName}</span>
                      : <span className="text-xs text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">{p.createdDate ? new Date(p.createdDate).toLocaleDateString("tr-TR") : "—"}</td>
                  <td className="px-5 py-3 text-xs text-slate-400 max-w-[140px] truncate" title={p.createdByAdminEmail}>{p.createdByAdminEmail ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => openEdit(p)}
                        title={t("action.edit", "Düzenle")}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white shadow-sm hover:shadow-teal-200 hover:shadow-md transition-all duration-150 active:scale-95">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDuplicate(p)}
                        title={t("action.duplicate", "Çoğalt")}
                        disabled={duplicating === p.id}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-500 hover:text-white shadow-sm hover:shadow-violet-200 hover:shadow-md transition-all duration-150 active:scale-95 disabled:opacity-50">
                        {duplicating === p.id ? <Loader2 size={18} className="animate-spin" /> : <Copy size={18} />}
                      </button>
                      <button onClick={() => openHistory({ id: p.id, name: p.name })}
                        title={t("auto.gecmis", "Geçmiş")}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-500 hover:text-white shadow-sm hover:shadow-slate-200 hover:shadow-md transition-all duration-150 active:scale-95">
                        <Clock size={18} />
                      </button>
                      <button onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                        title={t("action.delete", "Sil")}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white shadow-sm hover:shadow-red-200 hover:shadow-md transition-all duration-150 active:scale-95">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages >= 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          {/* Info */}
          <span className="text-xs text-slate-500 shrink-0">
            {totalCount === 0 ? t("table.noData", "Kayıt bulunamadı") : (() => {
              const from = (page - 1) * pageSize + 1;
              const to   = Math.min(page * pageSize, totalCount);
              return `${from}–${to} / ${totalCount} ${t("auto.urun", "ürün")}`;
            })()}
          </span>

          {/* Page buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {/* First */}
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition text-slate-700">
                «
              </button>
              {/* Prev */}
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition text-slate-700">
                ‹
              </button>

              {/* Numbered pages */}
              {(() => {
                const pages: (number | "…")[] = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (page > 3) pages.push("…");
                  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
                  if (page < totalPages - 2) pages.push("…");
                  pages.push(totalPages);
                }
                return pages.map((p, i) =>
                  p === "…" ? (
                    <span key={`e${i}`} className="px-2 text-xs text-slate-400 select-none">…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)}
                      className={`min-w-[30px] h-[30px] rounded-lg text-xs font-medium transition border ${
                        p === page
                          ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                          : "border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}>
                      {p}
                    </button>
                  )
                );
              })()}

              {/* Next */}
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition text-slate-700">
                ›
              </button>
              {/* Last */}
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition text-slate-700">
                »
              </button>
            </div>
          )}

          {/* Go to page input */}
          {totalPages > 5 && (
            <form onSubmit={e => {
              e.preventDefault();
              const val = Number((e.currentTarget.elements.namedItem("gotoPage") as HTMLInputElement).value);
              if (val >= 1 && val <= totalPages) { setPage(val); (e.currentTarget.elements.namedItem("gotoPage") as HTMLInputElement).value = ""; }
            }} className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">{t("auto.git", "Git:")} </span>
              <input name="gotoPage" type="number" min={1} max={totalPages}
                className="w-16 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 text-center" />
              <button type="submit" className="px-2 py-1 rounded-lg border border-slate-300 text-xs text-slate-600 hover:bg-slate-100 transition">→</button>
            </form>
          )}
        </div>
      )}

      {/* Toplu Fiyat Güncelle Modal */}
      {bulkPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <Percent size={20} className="text-violet-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">Toplu Fiyat Güncelle</h2>
                  <p className="text-xs text-slate-500">Kategori, marka veya seçili ürünlere fiyat güncelleme</p>
                </div>
              </div>
              <button onClick={() => setBulkPriceModal(false)} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
            </div>

            {/* Hedef */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Hedef</p>
              <div className="flex gap-2 flex-wrap">
                {([["selected", `Seçili (${selected.size})`], ["category", "Kategoriye Göre"], ["brand", "Markaya Göre"]] as const).map(([val, label]) => (
                  <button key={val}
                    onClick={() => { setBpTarget(val); setBpPreviewCount(null); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${bpTarget === val ? "bg-violet-600 text-white border-violet-600" : "border-slate-300 text-slate-600 hover:border-violet-400"}`}
                  >{label}</button>
                ))}
              </div>
              {bpTarget === "category" && (
                <select value={bpCategoryId} onChange={e => { setBpCategoryId(e.target.value); setBpPreviewCount(null); }}
                  className="mt-2 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400">
                  <option value="">— Kategori Seçin —</option>
                  {flattenCategories(categories).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              {bpTarget === "brand" && (
                <select value={bpBrandId} onChange={e => { setBpBrandId(e.target.value); setBpPreviewCount(null); }}
                  className="mt-2 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400">
                  <option value="">— Marka Seçin —</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              )}
            </div>

            {/* İşlem */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">İşlem Tipi</p>
              <div className="flex gap-2 flex-wrap">
                {([["percent", "% Artış/Azalış"], ["amount", "± Sabit Tutar (₺)"], ["set", "= Belirli Fiyat (₺)"]] as const).map(([val, label]) => (
                  <button key={val}
                    onClick={() => setBpOperation(val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${bpOperation === val ? "bg-teal-600 text-white border-teal-600" : "border-slate-300 text-slate-600 hover:border-teal-400"}`}
                  >{label}</button>
                ))}
              </div>
              <div className="mt-2 relative">
                <input
                  type="number"
                  step={bpOperation === "percent" ? "0.1" : "1"}
                  placeholder={bpOperation === "percent" ? "Örn: 20 (artış) veya -10 (indirim)" : bpOperation === "amount" ? "Örn: 100 (ekle) veya -50 (çıkar)" : "Yeni fiyat değeri"}
                  value={bpValue}
                  onChange={e => setBpValue(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 pr-10"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-medium">
                  {bpOperation === "percent" ? "%" : "₺"}
                </span>
              </div>
              {bpOperation === "percent" && <p className="text-xs text-slate-400 mt-1">Pozitif = artış, negatif = indirim. İndirimli fiyat da orantılı güncellenir.</p>}
              {bpOperation === "amount" && <p className="text-xs text-slate-400 mt-1">Pozitif = ekle, negatif = çıkar. İndirimli fiyat da orantılı güncellenir. Minimum 0₺.</p>}
              {bpOperation === "set" && <p className="text-xs text-slate-400 mt-1">Seçili tüm ürünlerin fiyatı bu değere ayarlanır. İndirimli fiyat korunur.</p>}
            </div>

            {/* Önizleme */}
            <div className="flex items-center gap-3">
              <button
                onClick={fetchBpPreview}
                disabled={bpPreviewLoading || (bpTarget === "selected" && selected.size === 0) || (bpTarget === "category" && !bpCategoryId) || (bpTarget === "brand" && !bpBrandId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
              >
                {bpPreviewLoading ? <Loader2 size={12} className="animate-spin" /> : <Info size={12} />}
                Kaç Ürün Etkilenecek?
              </button>
              {bpPreviewCount !== null && (
                <span className="text-sm font-semibold text-violet-700 bg-violet-50 px-3 py-1 rounded-xl">
                  {bpPreviewCount} ürün etkilenecek
                </span>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-1 border-t border-slate-100">
              <button onClick={() => setBulkPriceModal(false)}
                className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition">
                Vazgeç
              </button>
              <button
                onClick={handleBulkPriceApply}
                disabled={bpApplying || !bpValue || isNaN(parseFloat(bpValue)) || (bpTarget === "selected" && selected.size === 0) || (bpTarget === "category" && !bpCategoryId) || (bpTarget === "brand" && !bpBrandId)}
                className="px-5 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {bpApplying && <Loader2 size={14} className="animate-spin" />}
                Fiyatları Güncelle
              </button>
            </div>
          </div>
        </div>
      )}

      {priceAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                <Percent size={20} className="text-teal-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">{t("auto.topluFiyatAyarla", "Toplu Fiyat Ayarla")}</h2>
                <p className="text-xs text-slate-500">{selected.size} {t("auto.urunSecili", "ürün seçili")}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">{t("auto.degisimOrani", "Değişim Oranı")} (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  placeholder={t("auto.ornFiyatAyar", "Örn: 10 (artış) veya -5 (indirim)")}
                  value={priceAdjustPercent}
                  onChange={e => setPriceAdjustPercent(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 pr-8"
                  autoFocus
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm">%</span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                {t("auto.pozitifFiyatArtisi", "Pozitif = fiyat artışı, negatif = fiyat indirimi. İndirimli fiyatlar da orantılı güncellenir.")}
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => { setPriceAdjustModal(false); setPriceAdjustPercent(""); }}
                className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition"
              >
                {t("action.cancel", "Vazgeç")}
              </button>
              <button
                onClick={async () => {
                  const v = parseFloat(priceAdjustPercent);
                  if (isNaN(v) || v === 0) return;
                  setPriceAdjustModal(false);
                  setPriceAdjustPercent("");
                  await handleBulkAction("price-adjust", v);
                }}
                disabled={!priceAdjustPercent || isNaN(parseFloat(priceAdjustPercent)) || parseFloat(priceAdjustPercent) === 0}
                className="px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition disabled:opacity-50"
              >
                {t("action.apply", "Uygula")}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">{t("auto.topluIslem", "Toplu İşlem")}</h2>
                <p className="text-xs text-slate-500">{selected.size} {t("auto.urunSecili", "ürün seçili")}</p>
              </div>
            </div>
            <p className="text-sm text-slate-700">
              {t("msg.confirmDelete", "Silmek istediğinizden emin misiniz?")} (<span className="font-semibold text-slate-900">{selected.size} {t("auto.urun", "Ürün")}</span>)
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              {t("auto.aktifSiparisliAtlanir", "Aktif siparişi bulunan ürünler atlanacaktır.")} {t("msg.irreversible", "Bu işlem geri alınamaz.")}
            </p>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setBulkDeleteModal(false)} disabled={bulkLoading}
                className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
                {t("action.cancel", "Vazgeç")}
              </button>
              <button
                onClick={async () => { setBulkDeleteModal(false); await handleBulkAction("delete"); }}
                disabled={bulkLoading}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50">
                {bulkLoading ? t("action.deleting", "Siliniyor...") : t("action.delete", "Sil")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toplu Kategori / Marka Değiştir Modal */}
      {bulkAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bulkAssignModal === "category" ? "bg-teal-100" : "bg-indigo-100"}`}>
                {bulkAssignModal === "category"
                  ? <FolderInput size={20} className="text-teal-600" />
                  : <Tag size={20} className="text-indigo-600" />}
              </div>
              <div>
                <h2 className="font-bold text-slate-800">
                  {bulkAssignModal === "category" ? "Kategori Değiştir" : "Marka Değiştir"}
                </h2>
                <p className="text-xs text-slate-500">{selected.size} ürün seçili</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                {bulkAssignModal === "category" ? "Yeni Kategori" : "Yeni Marka"}
              </label>
              {bulkAssignModal === "category" ? (
                <select
                  className={SELECT}
                  value={bulkAssignId}
                  onChange={e => setBulkAssignId(e.target.value)}
                >
                  <option value="">— Kategori seçin —</option>
                  {flattenCategories(categories).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.parentCategoryId ? `  ↳ ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  className={SELECT}
                  value={bulkAssignId}
                  onChange={e => setBulkAssignId(e.target.value)}
                >
                  <option value="">— Marka seçin —</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => { setBulkAssignModal(null); setBulkAssignId(""); }}
                disabled={bulkAssigning}
                className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                onClick={handleBulkAssign}
                disabled={bulkAssigning || !bulkAssignId}
                className={`px-5 py-2 rounded-xl text-white text-sm font-semibold transition disabled:opacity-50 ${bulkAssignModal === "category" ? "bg-teal-600 hover:bg-teal-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
              >
                {bulkAssigning ? "Uygulanıyor..." : "Uygula"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toplu Stok Güncelle Modal */}
      {bulkStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Package size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">Toplu Stok Güncelle</h2>
                  <p className="text-xs text-slate-500">{selected.size} ürün seçili</p>
                </div>
              </div>
              <button onClick={() => setBulkStockModal(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hareket Tipi</label>
                <select value={bulkStockForm.movementType}
                  onChange={e => setBulkStockForm(f => ({ ...f, movementType: e.target.value }))}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="StockIn">Stok Girişi</option>
                  <option value="StockOut">Stok Çıkışı</option>
                  <option value="Adjustment">Düzeltme</option>
                  <option value="Return">İade</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Miktar</label>
                <input type="number" min={1}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                  value={bulkStockForm.quantity}
                  onChange={e => setBulkStockForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder="Adet" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Kritik Eşik <span className="text-slate-400 font-normal">(boş bırakırsanız değişmez)</span>
                </label>
                <input type="number" min={0}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                  value={bulkStockForm.criticalStockLevel}
                  onChange={e => setBulkStockForm(f => ({ ...f, criticalStockLevel: e.target.value }))}
                  placeholder="İsteğe bağlı" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Not</label>
                <input
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                  value={bulkStockForm.note}
                  onChange={e => setBulkStockForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="İsteğe bağlı" />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={handleBulkStockUpdate} disabled={bulkStockUpdating || !bulkStockForm.quantity}
                className="flex-1 bg-emerald-600 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                {bulkStockUpdating ? <><Loader2 size={14} className="animate-spin" /> İşleniyor...</> : `${selected.size} Ürünü Güncelle`}
              </button>
              <button onClick={() => setBulkStockModal(false)} disabled={bulkStockUpdating}
                className="px-5 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 text-sm disabled:opacity-50">İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Koşullu Stok Güncelleme Modali */}
      {condStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <Package size={16} className="text-emerald-600" /> Koşullu Stok Güncelle
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Belirlenen stok aralığındaki tüm ürünlere aynı hareket uygulanır</p>
              </div>
              <button onClick={() => setCondStockModal(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Hızlı Koşul</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Tükenenler (= 0)", min: "0", max: "0" },
                  { label: "Kritik (1–5)", min: "1", max: "5" },
                  { label: "Düşük (1–10)", min: "1", max: "10" },
                  { label: "Stoklu (> 0)", min: "1", max: "" },
                ].map(p => (
                  <button key={p.label}
                    onClick={() => { setCondStockForm(f => ({ ...f, minStock: p.min, maxStock: p.max })); setCondStockPreview(null); }}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition ${condStockForm.minStock === p.min && condStockForm.maxStock === p.max ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-300 hover:border-emerald-400 hover:text-emerald-700"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Minimum Stok (≥)</label>
                <input type="number" min={0}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                  value={condStockForm.minStock}
                  onChange={e => { setCondStockForm(f => ({ ...f, minStock: e.target.value })); setCondStockPreview(null); }}
                  placeholder="Boş = sınırsız" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Maksimum Stok (≤)</label>
                <input type="number" min={0}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                  value={condStockForm.maxStock}
                  onChange={e => { setCondStockForm(f => ({ ...f, maxStock: e.target.value })); setCondStockPreview(null); }}
                  placeholder="Boş = sınırsız" />
              </div>
            </div>

            <div>
              <button onClick={fetchCondStockPreview} disabled={condStockPreviewLoading || (!condStockForm.minStock && !condStockForm.maxStock)}
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-40">
                {condStockPreviewLoading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                Kaç ürün etkilenecek?
              </button>
              {condStockPreview !== null && (
                <p className="mt-2 text-sm font-semibold text-emerald-700">
                  → <span className="text-lg">{condStockPreview}</span> ürün bu koşula uyuyor
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hareket Tipi</label>
                <select value={condStockForm.movementType}
                  onChange={e => setCondStockForm(f => ({ ...f, movementType: e.target.value }))}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="StockIn">Stok Girişi</option>
                  <option value="StockOut">Stok Çıkışı</option>
                  <option value="Adjustment">Düzeltme</option>
                  <option value="Return">İade</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Miktar</label>
                  <input type="number" min={1}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                    value={condStockForm.quantity}
                    onChange={e => setCondStockForm(f => ({ ...f, quantity: e.target.value }))} placeholder="Adet" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kritik Eşik <span className="font-normal text-slate-400">(opsiyonel)</span></label>
                  <input type="number" min={0}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                    value={condStockForm.criticalStockLevel}
                    onChange={e => setCondStockForm(f => ({ ...f, criticalStockLevel: e.target.value }))} placeholder="Değişmez" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Not <span className="font-normal text-slate-400">(opsiyonel)</span></label>
                <input
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                  value={condStockForm.note}
                  onChange={e => setCondStockForm(f => ({ ...f, note: e.target.value }))} placeholder="Açıklama" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleCondStockUpdate}
                disabled={condStockUpdating || !condStockForm.quantity || (!condStockForm.minStock && !condStockForm.maxStock)}
                className="flex-1 bg-emerald-600 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                {condStockUpdating ? <><Loader2 size={14} className="animate-spin" /> Uygulanıyor...</> : condStockPreview !== null ? `${condStockPreview} Ürünü Güncelle` : "Uygula"}
              </button>
              <button onClick={() => setCondStockModal(false)} disabled={condStockUpdating}
                className="px-5 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 text-sm disabled:opacity-50">İptal</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">{t("ui.deleteProduct", "Ürünü Sil")}</h2>
                <p className="text-xs text-slate-500">{t("msg.irreversible", "Bu işlem geri alınamaz.")}</p>
              </div>
            </div>
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">&quot;{deleteTarget.name}&quot;</span> {t("msg.confirmDelete", "Silmek istediğinizden emin misiniz?")}
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              {t("auto.aktifSiparisliSilinemez", "Aktif siparişi bulunan ürünler silinemez. Siparişler tamamlanana kadar ürün pasif yapılabilir.")}
            </p>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
                {t("action.cancel", "Vazgeç")}
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50">
                {deleting ? t("action.deleting", "Siliniyor...") : t("action.delete", "Sil")}
              </button>
            </div>
          </div>
        </div>
      )}

      {historyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div>
                <h2 className="font-bold text-slate-800">{t("ui.productHistory", "Ürün Geçmişi")}</h2>
                <p className="text-xs text-slate-500">{historyTarget.name}</p>
              </div>
              <button onClick={() => setHistoryTarget(null)} className="text-slate-400 hover:text-slate-700 transition"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {historyLoading ? (
                <p className="text-sm text-slate-400 text-center py-8">{t("action.loading", "Yükleniyor...")}</p>
              ) : historyError ? (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{historyError}</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">{t("table.noData", "Kayıt bulunamadı")}</p>
              ) : (
                <ol className="relative border-l border-slate-200 space-y-6 ml-2">
                  {history.map((entry, i) => (
                    <li key={i} className="ml-4">
                      <span className={`absolute -left-1.5 w-3 h-3 rounded-full border-2 border-white ${entry.eventType === "stock" ? "bg-teal-500" : "bg-slate-400"}`} />
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                            {entry.eventType === "stock" ? "📦 " : "📝 "}
                            {entry.action}
                          </p>
                          {entry.detail && <p className="text-sm text-slate-600">{entry.detail}</p>}
                          {(entry.oldValue || entry.newValue) && (
                            <p className="text-xs text-slate-500">
                              {entry.oldValue && <span className="line-through text-red-400 mr-1">{entry.oldValue}</span>}
                              {entry.newValue && <span className="text-green-600">{entry.newValue}</span>}
                            </p>
                          )}
                          <p className="text-xs text-slate-400">{entry.userEmail ?? t("auto.sistem", "Sistem")}</p>
                        </div>
                        <p className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                          {new Date(entry.occurredAt).toLocaleString("tr-TR")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <Modal
          title={modal === "create" ? t("ui.newProduct", "Yeni Ürün") : t("ui.editProduct", "Ürünü Düzenle")}
          onClose={() => setModal(null)}
          showPreview={showPreview}
          onTogglePreview={() => setShowPreview(p => !p)}
          preview={
            <ProductPreview
              form={form}
              images={modal === "edit" ? productImages : stagedImages.map((url, i) => ({ imageUrl: url, isMain: i === 0 }))}
              brands={brands}
              initialStock={form.initialStock}
            />
          }
        >
          <div className="space-y-4">
            {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{formError}</p>}

            <div className="grid grid-cols-2 gap-4">
              <Field label={`${t("label.name", "Ad")} *`}>
                <input className={INPUT} value={form.name}
                  onChange={e => { setField("name", e.target.value); if (!form.slug || modal === "create") setField("slug", slugify(e.target.value)); }} />
              </Field>
              <Field label={<>Slug * <span title={t("auto.slugAciklama", "Slug, ürünün URL adresinde görünen benzersiz kimlik metnidir. Örn: 'erkek-spor-ayakkabisi' → /urun/erkek-spor-ayakkabisi. Türkçe karakter ve boşluk içermez.")}><Info size={12} className="text-slate-400 cursor-help" /></span></>}>
                <input className={INPUT} value={form.slug} onChange={e => setField("slug", slugify(e.target.value))} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="SKU *">
                <input className={INPUT} value={form.sku} onChange={e => setField("sku", e.target.value)} />
              </Field>
              <Field label={t("label.tax", "Vergi") + " (%)"}>
                <input type="number" className={INPUT} value={form.taxRate} onChange={e => setField("taxRate", e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="OEM / Parça No" hint="Orijinal üretici parça numarası (örn: 55599958)">
                <input className={INPUT} value={form.oemPartNumber} onChange={e => setField("oemPartNumber", e.target.value)} placeholder="Örn: PSA 55599958" />
              </Field>
              <Field label="Şasi / Model" hint="Uyumlu araç şasi veya model bilgisi">
                <input className={INPUT} value={form.chassis} onChange={e => setField("chassis", e.target.value)} placeholder="Örn: Audi A3 8V" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label={`${t("label.price", "Fiyat")} (TRY) *`}>
                <input type="number" step="0.01" className={INPUT} value={form.price} onChange={e => setField("price", e.target.value)} />
              </Field>
              <Field label={t("label.discount", "İndirim")}>
                <input type="number" step="0.01" className={INPUT} placeholder={t("auto.istegeBagliPlaceholder", "İsteğe bağlı")} value={form.discountPrice} onChange={e => setField("discountPrice", e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label={`${t("auto.kategoriSec", "Kategori Seç")} *`}>
                <select className={SELECT} value={form.categoryId} onChange={e => setField("categoryId", e.target.value)}>
                  <option value="">{t("auto.seciniz", "Seçiniz...")}</option>
                  {categories.filter(c => !c.parentCategoryId).map(parent => {
                    const subs = categories.filter(c => c.parentCategoryId === parent.id);
                    return subs.length > 0 ? (
                      <optgroup key={parent.id} label={parent.name}>
                        <option value={parent.id}>{parent.name}</option>
                        {subs.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                      </optgroup>
                    ) : (
                      <option key={parent.id} value={parent.id}>{parent.name}</option>
                    );
                  })}
                </select>
              </Field>
              <Field label={t("auto.markaSec", "Marka Seç")}>
                <select className={SELECT} value={form.brandId} onChange={e => setField("brandId", e.target.value)}>
                  <option value="">{t("auto.seciniz", "Seçiniz...")}</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
            </div>

            <Field label={t("auto.kisaAciklama", "Kısa Açıklama")}>
              <input className={INPUT} value={form.shortDescription} onChange={e => setField("shortDescription", e.target.value)} />
            </Field>

            <Field label={t("label.description", "Açıklama")}>
              <RichTextEditor
                value={form.description}
                onChange={v => setField("description", v)}
                placeholder={t("auto.urunAciklamasiYazin", "Ürün açıklaması yazın…")}
                minHeight={160}
              />
            </Field>

            {modal === "create" && (
              <Field label={t("auto.baslangicStok", "Başlangıç Stok Adedi")}>
                <input type="number" className={INPUT} value={form.initialStock} onChange={e => setField("initialStock", e.target.value)} />
              </Field>
            )}

            {modal === "create" && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <p className="text-xs font-semibold text-slate-700">
                  {t("auto.fotograflar", "Fotoğraflar")} <span className="font-normal text-slate-400">({t("auto.istegeBagli", "isteğe bağlı")})</span>
                </p>

                {stagedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {stagedImages.map((url, i) => (
                      <div key={i} className={`rounded-xl border p-2 flex flex-col gap-1.5 ${i === 0 ? "border-teal-400 bg-teal-50" : "border-slate-200 bg-white"}`}>
                        <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="object-contain w-full h-full p-1" />
                        </div>
                        {i === 0 && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-teal-600">
                            <Star size={11} fill="currentColor" /> {t("auto.anaFotograf", "Ana Fotoğraf")}
                          </span>
                        )}
                        <button type="button"
                          onClick={() => setStagedImages(imgs => imgs.filter((_, idx) => idx !== i))}
                          className="flex items-center justify-center gap-1 text-red-400 hover:text-red-600 border border-red-100 rounded-lg p-1 hover:bg-red-50 transition w-full text-xs">
                          <Trash2 size={12} /> {t("auto.kaldir", "Kaldır")}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    className={INPUT}
                    placeholder={t("auto.fotografUrlPlaceholder", "Fotoğraf URL'si veya dosya yükleyin...")}
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                  />
                  <label className={`flex items-center gap-1.5 px-3 py-2 border border-teal-300 text-teal-700 text-xs font-semibold rounded-xl hover:bg-teal-50 cursor-pointer transition whitespace-nowrap ${imageLoading ? "opacity-50 cursor-not-allowed" : ""}`}>
                    <ImagePlus size={13} /> {t("auto.dosyadan", "Dosyadan")}
                    <input type="file" accept="image/*" className="hidden" disabled={imageLoading}
                      onChange={async e => {
                        const file = e.target.files?.[0]; if (!file) return;
                        setImageLoading(true);
                        try {
                          const { url } = await api.upload(file);
                          setNewImageUrl(url);
                        } catch { /* ignore */ }
                        finally { setImageLoading(false); e.target.value = ""; }
                      }} />
                  </label>
                  <button type="button"
                    onClick={() => { if (!newImageUrl) return; setStagedImages(imgs => [...imgs, newImageUrl]); setNewImageUrl(""); }}
                    disabled={imageLoading || !newImageUrl}
                    className="px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-50 whitespace-nowrap transition">
                    {imageLoading ? "..." : t("action.add", "Ekle")}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.isPublished} onChange={e => setField("isPublished", e.target.checked)} />
                {t("status.published", "Yayında")}
              </label>
              {modal === "edit" && (
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setField("isActive", e.target.checked)} />
                  {t("status.active", "Aktif")}
                </label>
              )}
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={e => setField("isFeatured", e.target.checked)} />
                {t("status.featured", "Öne Çıkan")}
              </label>
            </div>

            {/* Image management — edit only */}
            {modal === "edit" && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <p className="text-xs font-semibold text-slate-700">{t("auto.fotograflar", "Fotoğraflar")}</p>

                {productImages.length === 0 ? (
                  <p className="text-xs text-slate-400">{t("auto.henuzFotografEklenmemis", "Henüz fotoğraf eklenmemiş.")}</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {productImages.map(img => (
                      <div key={img.id} className={`rounded-xl border p-2 flex flex-col gap-1.5 ${img.isMain ? "border-teal-400 bg-teal-50" : "border-slate-200 bg-white"}`}>
                        <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.imageUrl} alt={img.altText || ""} className="object-contain w-full h-full p-1" />
                        </div>
                        {img.isMain && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-teal-600">
                            <Star size={11} fill="currentColor" /> {t("auto.anaFotograf", "Ana Fotoğraf")}
                          </span>
                        )}
                        <div className="flex gap-1">
                          {!img.isMain && (
                            <button type="button" onClick={() => handleSetMainImage(img.id)}
                              className="flex-1 text-xs text-teal-600 hover:text-teal-800 border border-teal-200 rounded-lg py-1 hover:bg-teal-50 transition">
                              {t("auto.anaYap", "Ana Yap")}
                            </button>
                          )}
                          <button type="button" onClick={() => handleDeleteImage(img.id)}
                            className="flex items-center justify-center text-red-400 hover:text-red-600 border border-red-100 rounded-lg p-1 hover:bg-red-50 transition">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new image — file upload or URL */}
                <div className="flex gap-2">
                  <input
                    className={INPUT}
                    placeholder={t("auto.fotografUrlHttps", "Fotoğraf URL'si (https://...)")}
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                  />
                  <label className={`flex items-center gap-1.5 px-3 py-2 border border-teal-300 text-teal-700 text-xs font-semibold rounded-xl hover:bg-teal-50 cursor-pointer transition whitespace-nowrap ${imageLoading ? "opacity-50 cursor-not-allowed" : ""}`}>
                    <ImagePlus size={13} /> {t("auto.dosyadan", "Dosyadan")}
                    <input type="file" accept="image/*" className="hidden" disabled={imageLoading}
                      onChange={async e => {
                        const file = e.target.files?.[0]; if (!file) return;
                        setImageLoading(true);
                        try {
                          const { url } = await api.upload(file);
                          setNewImageUrl(url);
                        } catch { /* ignore, keep input */ }
                        finally { setImageLoading(false); e.target.value = ""; }
                      }} />
                  </label>
                  <button type="button" onClick={handleAddImage}
                    disabled={imageLoading || !newImageUrl}
                    className="px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-50 whitespace-nowrap transition">
                    {imageLoading ? "..." : t("action.add", "Ekle")}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button onClick={() => setModal(null)} className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition">
                {t("action.cancel", "Vazgeç")}
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition disabled:opacity-50">
                {saving ? t("auto.kaydediliyor", "Kaydediliyor...") : modal === "create" ? t("action.create", "Oluştur") : t("action.update", "Güncelle")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
