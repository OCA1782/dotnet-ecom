"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { exportToExcel, readExcelFile, downloadTemplate } from "@/lib/excel";
import { Plus, Pencil, X, Download, Upload } from "lucide-react";

interface Brand { id: string; name: string; slug: string; logoUrl?: string; isActive: boolean; }
interface BrandForm { id?: string; name: string; slug: string; logoUrl: string; description: string; }

const EMPTY: BrandForm = { name: "", slug: "", logoUrl: "", description: "" };

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400";

export default function MarkalarPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<BrandForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ items: Brand[]; totalPages: number }>(`/api/brands?page=${page}&pageSize=20&onlyActive=false`);
      setBrands(data.items);
      setTotalPages(data.totalPages);
    } catch { setBrands([]); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  function handleExport() {
    exportToExcel(
      brands.map(b => ({
        "Ad": b.name, "Slug": b.slug, "Logo URL": b.logoUrl ?? "",
        "Durum": b.isActive ? "Aktif" : "Pasif",
      })),
      "markalar", "Markalar"
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
          await api.post("/api/brands", {
            name, slug: slugify(name),
            logoUrl: String(row["Logo URL"] ?? "") || null,
            description: String(row["Açıklama"] ?? "") || null,
            metaTitle: null, metaDescription: null,
          });
          ok++;
        } catch { fail++; }
      }
      setImportResult(`${ok} marka eklendi${fail > 0 ? `, ${fail} hatalı` : ""}.`);
      await fetch();
    } catch { setImportResult("Dosya okunamadı."); }
    finally { setImporting(false); e.target.value = ""; }
  }

  function openCreate() { setForm(EMPTY); setError(""); setModal("create"); }
  function openEdit(b: Brand) {
    setForm({ id: b.id, name: b.name, slug: b.slug, logoUrl: b.logoUrl ?? "", description: "" });
    setError(""); setModal("edit");
  }

  async function handleSave() {
    if (!form.name) { setError("Ad zorunludur."); return; }
    setSaving(true); setError("");
    try {
      const body = { name: form.name, slug: form.slug || slugify(form.name), logoUrl: form.logoUrl || null, description: form.description || null, metaTitle: null, metaDescription: null };
      if (modal === "create") {
        await api.post("/api/brands", body);
        setMsg({ text: "Marka oluşturuldu.", ok: true });
      } else {
        await api.put(`/api/brands/${form.id}`, { id: form.id, ...body });
        setMsg({ text: "Marka güncellendi.", ok: true });
      }
      setModal(null); await fetch();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Hata"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Markalar</h1>
        <div className="flex items-center gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">
            <Download size={14} /> Excel
          </button>
          <label className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition cursor-pointer">
            <Upload size={14} /> {importing ? "Aktarılıyor..." : "İçe Aktar"}
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button onClick={() => downloadTemplate(["Ad", "Logo URL", "Açıklama"], "markalar")}
            className="text-xs text-slate-500 hover:text-slate-700 underline px-1">Şablon</button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow">
            <Plus size={16} /> Yeni Marka
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
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Marka", "Slug", "Logo", "Durum", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {brands.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">Marka bulunamadı</td></tr>
              ) : brands.map(b => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-800 text-xs">
                    <div className="flex items-center gap-3">
                      {b.logoUrl
                        ? <img src={b.logoUrl} alt={b.name} className="w-8 h-8 object-contain rounded" /> // eslint-disable-line @next/next/no-img-element
                        : <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-base">🏷️</div>}
                      {b.name}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs font-mono">{b.slug}</td>
                  <td className="px-5 py-3 text-xs text-slate-400">{b.logoUrl ? "Var" : "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${b.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {b.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openEdit(b)} className="text-indigo-500 hover:text-indigo-700"><Pencil size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && <button onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">← Önceki</button>}
          <span className="px-4 py-2 text-sm text-slate-500">{page} / {totalPages}</span>
          {page < totalPages && <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">Sonraki →</button>}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-800">{modal === "create" ? "Yeni Marka" : "Markayı Düzenle"}</h2>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ad *</label>
                <input className={INPUT} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Slug</label>
                <input className={INPUT} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Logo URL</label>
                <input className={INPUT} placeholder="https://..." value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Açıklama</label>
                <input className={INPUT} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
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
