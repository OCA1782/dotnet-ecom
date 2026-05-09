"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { exportToExcel, readExcelFile, downloadTemplate } from "@/lib/excel";
import { Plus, Pencil, Trash2, X, Download, Upload } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentCategoryId?: string;
  parentCategoryName?: string;
  sortOrder: number;
  showInMenu: boolean;
  isActive: boolean;
  productCount?: number;
}

interface CatForm {
  id?: string;
  name: string;
  slug: string;
  parentCategoryId: string;
  description: string;
  sortOrder: string;
  showInMenu: boolean;
}

const EMPTY: CatForm = { name: "", slug: "", parentCategoryId: "", description: "", sortOrder: "0", showInMenu: true };

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400";

export default function KategorilerPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<CatForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Category[]>("/api/categories?onlyActive=false");
      setCategories(data);
    } catch { setCategories([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  function openCreate() { setForm(EMPTY); setError(""); setModal("create"); }
  function openEdit(c: Category) {
    setForm({ id: c.id, name: c.name, slug: c.slug, parentCategoryId: c.parentCategoryId ?? "", description: "", sortOrder: String(c.sortOrder), showInMenu: c.showInMenu });
    setError(""); setModal("edit");
  }

  async function handleSave() {
    if (!form.name) { setError("Ad zorunludur."); return; }
    setSaving(true); setError("");
    try {
      const body = { name: form.name, slug: form.slug || slugify(form.name), parentCategoryId: form.parentCategoryId || null, description: form.description || null, imageUrl: null, sortOrder: parseInt(form.sortOrder) || 0, showInMenu: form.showInMenu, metaTitle: null, metaDescription: null };
      if (modal === "create") {
        await api.post("/api/categories", body);
        setMsg({ text: "Kategori oluşturuldu.", ok: true });
      } else {
        await api.put(`/api/categories/${form.id}`, { id: form.id, ...body });
        setMsg({ text: "Kategori güncellendi.", ok: true });
      }
      setModal(null); await fetch();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Hata"); }
    finally { setSaving(false); }
  }

  function handleExport() {
    exportToExcel(
      categories.map(c => ({
        "Ad": c.name, "Slug": c.slug,
        "Üst Kategori": c.parentCategoryName ?? "",
        "Sıra": c.sortOrder, "Menüde": c.showInMenu ? "Evet" : "Hayır",
        "Durum": c.isActive ? "Aktif" : "Pasif",
      })),
      "kategoriler", "Kategoriler"
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
          const name = String(row["Ad"] ?? ""); if (!name) { fail++; continue; }
          await api.post("/api/categories", {
            name, slug: slugify(name),
            parentCategoryId: null, description: String(row["Açıklama"] ?? "") || null,
            imageUrl: null, sortOrder: Number(row["Sıra"] ?? 0),
            showInMenu: String(row["Menüde"] ?? "Evet") === "Evet",
            metaTitle: null, metaDescription: null,
          });
          ok++;
        } catch { fail++; }
      }
      setImportResult(`${ok} kategori eklendi${fail > 0 ? `, ${fail} hatalı` : ""}.`);
      await fetch();
    } catch { setImportResult("Dosya okunamadı."); }
    finally { setImporting(false); e.target.value = ""; }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" kategorisini silmek istediğinize emin misiniz?`)) return;
    try {
      await api.delete(`/api/categories/${id}`);
      setMsg({ text: "Kategori silindi.", ok: true }); await fetch();
    } catch (e: unknown) { setMsg({ text: e instanceof Error ? e.message : "Silinemedi", ok: false }); }
  }

  const roots = categories.filter(c => !c.parentCategoryId);
  const children = (parentId: string) => categories.filter(c => c.parentCategoryId === parentId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Kategoriler</h1>
        <div className="flex items-center gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">
            <Download size={14} /> Excel
          </button>
          <label className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition cursor-pointer">
            <Upload size={14} /> {importing ? "Aktarılıyor..." : "İçe Aktar"}
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button onClick={() => downloadTemplate(["Ad", "Açıklama", "Sıra", "Menüde"], "kategoriler")}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-3 py-2 rounded-xl transition border border-slate-200">Şablon İndir</button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow">
            <Plus size={16} /> Yeni Kategori
          </button>
        </div>
      </div>

      {importResult && (
        <div className="text-sm px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-between">
          {importResult} <button onClick={() => setImportResult(null)}><X size={14} /></button>
        </div>
      )}

      {msg && (
        <div className={`text-sm px-4 py-3 rounded-xl flex items-center justify-between ${msg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.text} <button onClick={() => setMsg(null)}><X size={14} /></button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-slate-400">Yükleniyor...</p>
        ) : roots.length === 0 ? (
          <p className="p-8 text-center text-slate-400">Henüz kategori yok</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Kategori", "Slug", "Menüde", "Durum", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roots.map(cat => (
                <>
                  <tr key={cat.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-800 text-xs">{cat.name}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs font-mono">{cat.slug}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cat.showInMenu ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                        {cat.showInMenu ? "Evet" : "Hayır"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cat.isActive !== false ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        Aktif
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 justify-end">
                        <button onClick={() => openEdit(cat)} className="text-indigo-500 hover:text-indigo-700"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(cat.id, cat.name)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                  {children(cat.id).map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-50 bg-slate-50/50">
                      <td className="px-5 py-2.5 text-xs text-slate-600 pl-10">↳ {sub.name}</td>
                      <td className="px-5 py-2.5 text-slate-400 text-xs font-mono">{sub.slug}</td>
                      <td className="px-5 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sub.showInMenu ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                          {sub.showInMenu ? "Evet" : "Hayır"}
                        </span>
                      </td>
                      <td className="px-5 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Aktif</span>
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3 justify-end">
                          <button onClick={() => openEdit(sub)} className="text-indigo-500 hover:text-indigo-700"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(sub.id, sub.name)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-800">{modal === "create" ? "Yeni Kategori" : "Kategoriyi Düzenle"}</h2>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ad *</label>
                <input className={INPUT} value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) })); }} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Slug</label>
                <input className={INPUT} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Üst Kategori</label>
                <select className={INPUT} value={form.parentCategoryId} onChange={e => setForm(f => ({ ...f, parentCategoryId: e.target.value }))}>
                  <option value="">Ana Kategori</option>
                  {categories.filter(c => c.id !== form.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sıra</label>
                  <input type="number" className={INPUT} value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={form.showInMenu} onChange={e => setForm(f => ({ ...f, showInMenu: e.target.checked }))} />
                    Menüde Göster
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button onClick={() => setModal(null)} className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50">Vazgeç</button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? "Kaydediliyor..." : modal === "create" ? "Oluştur" : "Güncelle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
