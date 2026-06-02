"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { AdminProduct, PaginatedList } from "@/types";
import { Search, Plus, Pencil, X, Star, Trash2, Download, Upload, ImagePlus, Clock, ChevronUp, ChevronDown, ChevronsUpDown, Filter, Info, CheckSquare, Square, ToggleLeft, ToggleRight, Percent, Loader2 } from "lucide-react";
import { useRef } from "react";
import { exportToExcel, downloadTemplate, readExcelFile } from "@/lib/excel";

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
  id: string; name: string; slug: string; sku: string;
  description?: string; shortDescription?: string;
  price: number; discountPrice?: number; taxRate: number;
  categoryId: string; brandId?: string;
  isActive: boolean; isPublished: boolean; isFeatured: boolean;
  images: ProductImage[];
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
}

const EMPTY_FORM: ProductForm = {
  name: "", slug: "", sku: "", description: "", shortDescription: "",
  price: "", discountPrice: "", taxRate: "18", categoryId: "",
  brandId: "", isPublished: true, isActive: true, isFeatured: false, initialStock: "0",
};

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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <h2 className="font-bold text-slate-800 text-lg">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 mb-1">{label}</div>
      {children}
    </div>
  );
}

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400";
const SELECT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400";

type SortField = "name" | "price" | "stock" | "createdDate" | "dataSource";
type SortDir   = "asc" | "desc";
const PAGE_SIZES = [10, 25, 50] as const;

function buildSortKey(field: SortField, dir: SortDir) { return `${field}-${dir}`; }

export default function AdminProductsPage() {
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

  // Sort
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
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

  // Bulk selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [priceAdjustModal, setPriceAdjustModal] = useState(false);
  const [priceAdjustPercent, setPriceAdjustPercent] = useState("");
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

  // Image management state
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageAlt, setNewImageAlt] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [stagedImages, setStagedImages] = useState<string[]>([]);

  // Computed: how many active filters
  const activeFilterCount = useMemo(() =>
    [search, filterCategoryId, filterBrandId, showInactive ? "1" : ""].filter(Boolean).length,
    [search, filterCategoryId, filterBrandId, showInactive]
  );

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) qs.set("search", search);
      if (!showInactive) qs.set("onlyActive", "true");
      if (filterCategoryId) qs.set("categoryId", filterCategoryId);
      if (filterBrandId) qs.set("brandId", filterBrandId);
      if (sortField) qs.set("sortBy", buildSortKey(sortField, sortDir));
      const data = await api.get<PaginatedList<AdminProduct>>(`/api/products?${qs}`);
      setProducts(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [page, pageSize, search, showInactive, filterCategoryId, filterBrandId, sortField, sortDir]);

  useEffect(() => { fetchProducts(); setSelected(new Set()); }, [fetchProducts]);

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
    setShowInactive(false); setSortField(null); setPage(1);
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
      const verb = action === "delete" ? "silindi" : "güncellendi";
      const msg = `${r.affected} ürün ${verb}${r.errors.length ? ` (${r.errors.length} atlandı)` : ""}`;
      setMsg({ text: msg, ok: true });
      setSelected(new Set());
      await fetchProducts();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "İşlem başarısız", ok: false });
    } finally {
      setBulkLoading(false);
    }
  }

  // Toggle sort: same field → flip direction; different field → set desc
  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronsUpDown size={12} className="opacity-30 ml-1 inline-block" />;
    return sortDir === "asc"
      ? <ChevronUp size={12} className="text-teal-600 ml-1 inline-block" />
      : <ChevronDown size={12} className="text-teal-600 ml-1 inline-block" />;
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
      setImportResult(`${ok} ürün eklendi${fail > 0 ? `, ${fail} hatalı` : ""}.`);
      await fetchProducts();
    } catch { setImportResult("Dosya okunamadı."); }
    finally { setImporting(false); e.target.value = ""; }
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
      id: p.id, name: p.name, slug: p.slug, sku: p.sku,
      description: "", shortDescription: "",
      price: String(p.price), discountPrice: p.discountPrice ? String(p.discountPrice) : "",
      taxRate: String(p.taxRate), categoryId: "", brandId: "",
      isPublished: true, isActive: p.isActive, isFeatured: p.isFeatured, initialStock: "0",
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
      }));
    } catch { setProductImages([]); }
  }

  function setField<K extends keyof ProductForm>(k: K, v: ProductForm[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    if (!form.name || !form.sku || !form.price) { setFormError("Ad, SKU ve Fiyat zorunludur."); return; }
    if (modal === "create" && !form.categoryId) { setFormError("Kategori seçiniz."); return; }
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
        setMsg({ text: "Ürün oluşturuldu.", ok: true });
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
        });
        setMsg({ text: "Ürün güncellendi.", ok: true });
      }
      setModal(null);
      await fetchProducts();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Hata oluştu.");
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
      setFormError(e instanceof Error ? e.message : "Fotoğraf eklenemedi.");
    } finally { setImageLoading(false); }
  }

  async function handleDeleteImage(imageId: string) {
    if (!form.id) return;
    try {
      await api.delete(`/api/products/${form.id}/images/${imageId}`);
      setProductImages(imgs => imgs.filter(i => i.id !== imageId));
      await fetchProducts();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Fotoğraf silinemedi.");
    }
  }

  async function handleSetMainImage(imageId: string) {
    if (!form.id) return;
    try {
      await api.patch(`/api/products/${form.id}/images/${imageId}/set-main`);
      setProductImages(imgs => imgs.map(i => ({ ...i, isMain: i.id === imageId })));
      await fetchProducts();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Ana fotoğraf ayarlanamadı.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/products/${deleteTarget.id}`);
      setMsg({ text: `"${deleteTarget.name}" silindi.`, ok: true });
      setDeleteTarget(null);
      await fetchProducts();
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : "Silinemedi.", ok: false });
      setDeleteTarget(null);
    } finally { setDeleting(false); }
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
      setHistoryError(e instanceof Error ? e.message : "Geçmiş yüklenemedi.");
    } finally { setHistoryLoading(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Ürünler</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadTemplate(["Ad", "SKU", "Fiyat", "İndirimli Fiyat", "Kategori", "Marka", "Stok"], "urunler")}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">Şablon İndir</button>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">
            <Download size={14} /> Excel'e Aktar
          </button>
          <label className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition cursor-pointer">
            <Upload size={14} /> {importing ? "Aktarılıyor..." : "İçe Aktar"}
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-[#12304A] hover:bg-[#0d2438] text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow">
            <Plus size={16} /> Yeni Ürün
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
                placeholder="Ürün adı, SKU veya marka..."
                className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-full text-slate-900 bg-white"
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="submit" className="px-4 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition">Ara</button>
          </form>

          {/* Category filter */}
          <select
            value={filterCategoryId}
            onChange={e => { setFilterCategoryId(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 min-w-[150px]"
          >
            <option value="">Tüm Kategoriler</option>
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
            <option value="">Tüm Markalar</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          {/* Page size */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-slate-500 whitespace-nowrap">Sayfa başı:</span>
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
            Pasif ürünleri dahil et
          </label>

          {sortField && (
            <span className="flex items-center gap-1.5 text-xs bg-teal-50 border border-teal-200 text-teal-700 rounded-lg px-2.5 py-1.5">
              <Filter size={10} />
              Sıralama: {sortField === "name" ? "İsim" : sortField === "price" ? "Fiyat" : sortField === "createdDate" ? "Tarih" : sortField === "dataSource" ? "Kaynak" : "Stok"} {sortDir === "asc" ? "↑" : "↓"}
              <button onClick={() => { setSortField(null); setPage(1); }} className="ml-1 hover:text-red-500"><X size={11} /></button>
            </span>
          )}

          {(activeFilterCount > 0 || sortField) && (
            <button onClick={clearAllFilters}
              className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-2.5 py-1.5 hover:bg-red-50 transition">
              Tüm Filtreleri Temizle
            </button>
          )}

          <span className="ml-auto text-xs text-slate-400">
            {loading ? "Yükleniyor..." : `${totalCount} ürün`}
          </span>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-teal-700 text-white rounded-2xl px-5 py-3 flex items-center gap-3 flex-wrap shadow-md">
          <span className="text-sm font-semibold shrink-0">
            {selected.size} ürün seçili
          </span>
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <button
              onClick={() => handleBulkAction("activate")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-xl transition disabled:opacity-50"
            >
              {bulkLoading ? <Loader2 size={12} className="animate-spin" /> : <ToggleRight size={14} />}
              Etkinleştir
            </button>
            <button
              onClick={() => handleBulkAction("deactivate")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-xl transition disabled:opacity-50"
            >
              <ToggleLeft size={14} /> Devre Dışı
            </button>
            <button
              onClick={() => setPriceAdjustModal(true)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-xl transition disabled:opacity-50"
            >
              <Percent size={12} /> Fiyat Ayarla
            </button>
            <button
              onClick={() => setBulkDeleteModal(true)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/80 hover:bg-red-500 rounded-xl transition disabled:opacity-50"
            >
              <Trash2 size={12} /> Sil
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
                    Ürün <SortIcon field="name" />
                  </button>
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">SKU</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Kategori / Marka</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500">
                  <button onClick={() => handleSort("price")}
                    className="flex items-center gap-0.5 ml-auto hover:text-teal-600 transition select-none">
                    Fiyat <SortIcon field="price" />
                  </button>
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500">
                  <button onClick={() => handleSort("stock")}
                    className="flex items-center gap-0.5 ml-auto hover:text-teal-600 transition select-none">
                    Stok <SortIcon field="stock" />
                  </button>
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Durum</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500"><button onClick={() => handleSort("dataSource")} className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">Kaynak <SortIcon field="dataSource" /></button></th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500"><button onClick={() => handleSort("createdDate")} className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">Tarih <SortIcon field="createdDate" /></button></th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-slate-400">Yükleniyor...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-slate-400">Ürün bulunamadı</td></tr>
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
                        {p.isActive ? "Aktif" : "Pasif"}
                      </span>
                      {p.isFeatured && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700">Öne Çıkan</span>
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => openEdit(p)}
                        title="Düzenle"
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white shadow-sm hover:shadow-teal-200 hover:shadow-md transition-all duration-150 active:scale-95">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => openHistory({ id: p.id, name: p.name })}
                        title="Geçmiş"
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-500 hover:text-white shadow-sm hover:shadow-slate-200 hover:shadow-md transition-all duration-150 active:scale-95">
                        <Clock size={18} />
                      </button>
                      <button onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
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
        </div>
      </div>

      {/* Pagination */}
      {totalPages >= 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          {/* Info */}
          <span className="text-xs text-slate-500 shrink-0">
            {totalCount === 0 ? "Kayıt yok" : (() => {
              const from = (page - 1) * pageSize + 1;
              const to   = Math.min(page * pageSize, totalCount);
              return `${from}–${to} / ${totalCount} ürün`;
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
              <span className="text-xs text-slate-400">Git:</span>
              <input name="gotoPage" type="number" min={1} max={totalPages}
                className="w-16 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 text-center" />
              <button type="submit" className="px-2 py-1 rounded-lg border border-slate-300 text-xs text-slate-600 hover:bg-slate-100 transition">→</button>
            </form>
          )}
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
                <h2 className="font-bold text-slate-800">Toplu Fiyat Ayarla</h2>
                <p className="text-xs text-slate-500">{selected.size} ürün seçili</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Değişim Oranı (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Örn: 10 (artış) veya -5 (indirim)"
                  value={priceAdjustPercent}
                  onChange={e => setPriceAdjustPercent(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 pr-8"
                  autoFocus
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm">%</span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Pozitif = fiyat artışı, negatif = fiyat indirimi. İndirimli fiyatlar da orantılı güncellenir.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => { setPriceAdjustModal(false); setPriceAdjustPercent(""); }}
                className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition"
              >
                Vazgeç
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
                Uygula
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
                <h2 className="font-bold text-slate-800">Toplu Silme</h2>
                <p className="text-xs text-slate-500">{selected.size} ürün seçili</p>
              </div>
            </div>
            <p className="text-sm text-slate-700">
              Seçili <span className="font-semibold text-slate-900">{selected.size} ürünü</span> silmek istediğinizden emin misiniz?
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Aktif siparişi bulunan ürünler atlanacaktır. Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setBulkDeleteModal(false)} disabled={bulkLoading}
                className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
                Vazgeç
              </button>
              <button
                onClick={async () => { setBulkDeleteModal(false); await handleBulkAction("delete"); }}
                disabled={bulkLoading}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50">
                {bulkLoading ? "Siliniyor..." : "Sil"}
              </button>
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
                <h2 className="font-bold text-slate-800">Ürünü Sil</h2>
                <p className="text-xs text-slate-500">Bu işlem geri alınamaz.</p>
              </div>
            </div>
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">&quot;{deleteTarget.name}&quot;</span> ürününü silmek istediğinizden emin misiniz?
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Aktif siparişi bulunan ürünler silinemez. Siparişler tamamlanana kadar ürün pasif yapılabilir.
            </p>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
                Vazgeç
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50">
                {deleting ? "Siliniyor..." : "Sil"}
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
                <h2 className="font-bold text-slate-800">Ürün Geçmişi</h2>
                <p className="text-xs text-slate-500">{historyTarget.name}</p>
              </div>
              <button onClick={() => setHistoryTarget(null)} className="text-slate-400 hover:text-slate-700 transition"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {historyLoading ? (
                <p className="text-sm text-slate-400 text-center py-8">Yükleniyor...</p>
              ) : historyError ? (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{historyError}</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Henüz kayıt bulunamadı.</p>
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
                          <p className="text-xs text-slate-400">{entry.userEmail ?? "Sistem"}</p>
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
        <Modal title={modal === "create" ? "Yeni Ürün" : "Ürünü Düzenle"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{formError}</p>}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Ürün Adı *">
                <input className={INPUT} value={form.name}
                  onChange={e => { setField("name", e.target.value); if (!form.slug || modal === "create") setField("slug", slugify(e.target.value)); }} />
              </Field>
              <Field label={<>Slug * <span title="Slug, ürünün URL adresinde görünen benzersiz kimlik metnidir. Örn: 'erkek-spor-ayakkabisi' → /urun/erkek-spor-ayakkabisi. Türkçe karakter ve boşluk içermez."><Info size={12} className="text-slate-400 cursor-help" /></span></>}>
                <input className={INPUT} value={form.slug} onChange={e => setField("slug", slugify(e.target.value))} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="SKU *">
                <input className={INPUT} value={form.sku} onChange={e => setField("sku", e.target.value)} />
              </Field>
              <Field label="KDV Oranı (%)">
                <input type="number" className={INPUT} value={form.taxRate} onChange={e => setField("taxRate", e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Fiyat (TRY) *">
                <input type="number" step="0.01" className={INPUT} value={form.price} onChange={e => setField("price", e.target.value)} />
              </Field>
              <Field label="İndirimli Fiyat">
                <input type="number" step="0.01" className={INPUT} placeholder="İsteğe bağlı" value={form.discountPrice} onChange={e => setField("discountPrice", e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Kategori *">
                <select className={SELECT} value={form.categoryId} onChange={e => setField("categoryId", e.target.value)}>
                  <option value="">Seçiniz...</option>
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
              <Field label="Marka">
                <select className={SELECT} value={form.brandId} onChange={e => setField("brandId", e.target.value)}>
                  <option value="">Seçiniz...</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Kısa Açıklama">
              <input className={INPUT} value={form.shortDescription} onChange={e => setField("shortDescription", e.target.value)} />
            </Field>

            <Field label="Açıklama">
              <textarea className={INPUT} rows={3} value={form.description} onChange={e => setField("description", e.target.value)} />
            </Field>

            {modal === "create" && (
              <Field label="Başlangıç Stok Adedi">
                <input type="number" className={INPUT} value={form.initialStock} onChange={e => setField("initialStock", e.target.value)} />
              </Field>
            )}

            {modal === "create" && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <p className="text-xs font-semibold text-slate-700">
                  Fotoğraflar <span className="font-normal text-slate-400">(isteğe bağlı)</span>
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
                            <Star size={11} fill="currentColor" /> Ana Fotoğraf
                          </span>
                        )}
                        <button type="button"
                          onClick={() => setStagedImages(imgs => imgs.filter((_, idx) => idx !== i))}
                          className="flex items-center justify-center gap-1 text-red-400 hover:text-red-600 border border-red-100 rounded-lg p-1 hover:bg-red-50 transition w-full text-xs">
                          <Trash2 size={12} /> Kaldır
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    className={INPUT}
                    placeholder="Fotoğraf URL'si veya dosya yükleyin..."
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                  />
                  <label className={`flex items-center gap-1.5 px-3 py-2 border border-teal-300 text-teal-700 text-xs font-semibold rounded-xl hover:bg-teal-50 cursor-pointer transition whitespace-nowrap ${imageLoading ? "opacity-50 cursor-not-allowed" : ""}`}>
                    <ImagePlus size={13} /> Dosyadan
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
                    {imageLoading ? "..." : "Ekle"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.isPublished} onChange={e => setField("isPublished", e.target.checked)} />
                Yayında
              </label>
              {modal === "edit" && (
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setField("isActive", e.target.checked)} />
                  Aktif
                </label>
              )}
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={e => setField("isFeatured", e.target.checked)} />
                Öne Çıkan
              </label>
            </div>

            {/* Image management — edit only */}
            {modal === "edit" && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <p className="text-xs font-semibold text-slate-700">Fotoğraflar</p>

                {productImages.length === 0 ? (
                  <p className="text-xs text-slate-400">Henüz fotoğraf eklenmemiş.</p>
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
                            <Star size={11} fill="currentColor" /> Ana Fotoğraf
                          </span>
                        )}
                        <div className="flex gap-1">
                          {!img.isMain && (
                            <button type="button" onClick={() => handleSetMainImage(img.id)}
                              className="flex-1 text-xs text-teal-600 hover:text-teal-800 border border-teal-200 rounded-lg py-1 hover:bg-teal-50 transition">
                              Ana Yap
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
                    placeholder="Fotoğraf URL'si (https://...)"
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                  />
                  <label className={`flex items-center gap-1.5 px-3 py-2 border border-teal-300 text-teal-700 text-xs font-semibold rounded-xl hover:bg-teal-50 cursor-pointer transition whitespace-nowrap ${imageLoading ? "opacity-50 cursor-not-allowed" : ""}`}>
                    <ImagePlus size={13} /> Dosyadan
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
                    {imageLoading ? "..." : "Ekle"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button onClick={() => setModal(null)} className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition">
                Vazgeç
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition disabled:opacity-50">
                {saving ? "Kaydediliyor..." : modal === "create" ? "Oluştur" : "Güncelle"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
