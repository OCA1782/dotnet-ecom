"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { AdminProduct, PaginatedList } from "@/types";
import { Search, Plus, Pencil, X, Star, Trash2, Download, Upload, ImagePlus, ToggleLeft } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import { exportToExcel, downloadTemplate, readExcelFile } from "@/lib/excel";

interface Category { id: string; name: string; slug: string; }
interface Brand { id: string; name: string; }
interface ProductImage { id: string; imageUrl: string; altText?: string; isMain: boolean; sortOrder: number; }

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

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400";
const SELECT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Image management state
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageAlt, setNewImageAlt] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [stagedImages, setStagedImages] = useState<string[]>([]);

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
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [page, search, showInactive]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    api.get<Category[]>("/api/categories?onlyActive=false").then(setCategories).catch(() => {});
    api.get<{ items: Brand[] }>("/api/brands?pageSize=200&onlyActive=false").then(r => setBrands(r.items)).catch(() => {});
  }, []);

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
            name, slug: name.toLowerCase().replace(/\s+/g, "-"),
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

  async function loadProductImages(slug: string) {
    try {
      const detail = await api.get<{ images: ProductImage[] }>(`/api/products/${slug}`);
      setProductImages(detail.images || []);
    } catch { setProductImages([]); }
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
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      description: "",
      shortDescription: "",
      price: String(p.price),
      discountPrice: p.discountPrice ? String(p.discountPrice) : "",
      taxRate: String(p.taxRate),
      categoryId: "",
      brandId: "",
      isPublished: true,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      initialStock: "0",
    });
    setFormError("");
    setNewImageUrl("");
    setNewImageAlt("");
    setProductImages([]);
    setModal("edit");
    await loadProductImages(p.slug);
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
      await loadProductImages(form.slug);
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

  async function handleDeactivate(id: string) {
    try {
      await api.delete(`/api/products/${id}`);
      setMsg({ text: "Ürün pasif yapıldı.", ok: true });
      await fetchProducts();
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : "Hata", ok: false });
    }
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
      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(searchInput); }} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ürün adı veya SKU..."
              className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-56 text-slate-900 bg-white" />
          </div>
          <button type="submit" className="px-4 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition">Ara</button>
          {search && <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
            className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">Temizle</button>}
        </form>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={showInactive} onChange={(e) => { setShowInactive(e.target.checked); setPage(1); }} className="rounded" />
          Pasif ürünleri göster
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Ürün", "SKU", "Kategori / Marka", "Fiyat", "Stok", "Durum", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Yükleniyor...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Ürün bulunamadı</td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className={`hover:bg-slate-50 transition ${!p.isActive ? "opacity-50" : ""}`}>
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => openEdit(p)}
                        title="Düzenle"
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white shadow-sm hover:shadow-teal-200 hover:shadow-md transition-all duration-150 active:scale-95">
                        <Pencil size={18} />
                      </button>
                      {p.isActive && (
                        <button onClick={() => setConfirmDeactivate(p.id)}
                          title="Pasife Al"
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white shadow-sm hover:shadow-orange-200 hover:shadow-md transition-all duration-150 active:scale-95">
                          <ToggleLeft size={18} />
                        </button>
                      )}
                    </div>
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
          <span className="px-4 py-2 text-sm text-slate-500">{page} / {totalPages} — {totalCount} ürün</span>
          {page < totalPages && <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm hover:bg-slate-50 text-slate-700">Sonraki →</button>}
        </div>
      )}

      {confirmDeactivate && (
        <ConfirmModal
          title="Ürünü Pasife Al"
          message="Bu ürünü pasif duruma almak istediğinizden emin misiniz? Pasif ürünler mağazada görünmez."
          confirmLabel="Pasife Al"
          onConfirm={() => { handleDeactivate(confirmDeactivate); setConfirmDeactivate(null); }}
          onCancel={() => setConfirmDeactivate(null)}
        />
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
              <Field label="Slug *">
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
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
