"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { Coupon, PaginatedList } from "@/types";
import { COUPON_TYPE_LABEL } from "@/types";
import { exportToExcel } from "@/lib/excel";
import { Download, Plus, Pencil, Trash2, Search, X } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

type FormState = {
  code: string;
  description: string;
  type: number;
  value: string;
  minOrderAmount: string;
  maxUsageCount: string;
  maxUsagePerUser: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

const empty: FormState = {
  code: "",
  description: "",
  type: 1,
  value: "",
  minOrderAmount: "0",
  maxUsageCount: "",
  maxUsagePerUser: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400";

function toISOLocal(dt: string) {
  if (!dt) return undefined;
  return new Date(dt).toISOString();
}

export default function KuponlarPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [pageSize, setPageSize] = useState(20);
  const PAGE_SIZES = [20, 50, 100];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize), includeInactive: String(includeInactive) });
      if (search) qs.set("search", search);
      if (typeFilter) qs.set("type", typeFilter);
      const data = await api.get<PaginatedList<Coupon>>(`/api/admin/coupons?${qs}`);
      setCoupons(data.items);
      setTotal(data.totalCount);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, includeInactive, search, typeFilter]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditId(null);
    setForm(empty);
    setError(null);
    setShowForm(true);
  }

  function openEdit(c: Coupon) {
    setEditId(c.id);
    setForm({
      code: c.code,
      description: c.description ?? "",
      type: c.type,
      value: String(c.value),
      minOrderAmount: String(c.minOrderAmount),
      maxUsageCount: c.maxUsageCount != null ? String(c.maxUsageCount) : "",
      maxUsagePerUser: c.maxUsagePerUser != null ? String(c.maxUsagePerUser) : "",
      startDate: c.startDate ? c.startDate.slice(0, 16) : "",
      endDate: c.endDate ? c.endDate.slice(0, 16) : "",
      isActive: c.isActive,
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description || undefined,
        type: form.type,
        value: parseFloat(form.value),
        minOrderAmount: parseFloat(form.minOrderAmount || "0"),
        maxUsageCount: form.maxUsageCount ? parseInt(form.maxUsageCount) : undefined,
        maxUsagePerUser: form.maxUsagePerUser ? parseInt(form.maxUsagePerUser) : undefined,
        startDate: toISOLocal(form.startDate),
        endDate: toISOLocal(form.endDate),
        isActive: form.isActive,
      };
      if (editId) {
        await api.put(`/api/admin/coupons/${editId}`, payload);
      } else {
        await api.post("/api/admin/coupons", payload);
      }
      setShowForm(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/api/admin/coupons/${id}`);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Silinemedi.");
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kuponlar</h1>
          {!loading && <p className="text-slate-500 text-sm mt-0.5">{total} kupon</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(
              coupons.map(c => ({
                "Kod": c.code, "Tip": COUPON_TYPE_LABEL[c.type], "Değer": c.value,
                "Min Tutar": c.minOrderAmount, "Kullanım": c.usageCount,
                "Durum": c.isActive ? "Aktif" : "Pasif",
              })),
              "kuponlar", "Kuponlar"
            )}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition"
          >
            <Download size={14} /> Excel'e Aktar
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#12304A] hover:bg-[#0d2438] text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow">
            <Plus size={16} /> Yeni Kupon
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={e => { e.preventDefault(); setPage(1); setSearch(searchInput); }} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Kod veya açıklama..."
              className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-52 text-slate-900 bg-white"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition">Ara</button>
          {(search || searchInput) && (
            <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
              className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">Temizle</button>
          )}
        </form>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <option value="">Tüm Türler</option>
          <option value="1">Sabit Tutar</option>
          <option value="2">Yüzde</option>
          <option value="3">Ücretsiz Kargo</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={includeInactive} onChange={e => { setIncludeInactive(e.target.checked); setPage(1); }} className="rounded" />
          Pasif göster
        </label>
        <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s} kayıt</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-slate-400">Yükleniyor...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Kod", "Tür", "Değer", "Min. Sipariş", "Kullanım", "Bitiş", "Durum", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">Kupon bulunamadı</td></tr>
              ) : coupons.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono font-semibold text-slate-800 text-xs">{c.code}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs">{COUPON_TYPE_LABEL[c.type]}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs">
                    {c.type === 2 ? `%${c.value}` : c.type === 3 ? "—" : `${c.value.toFixed(2)} ₺`}
                  </td>
                  <td className="px-5 py-3 text-slate-600 text-xs">{c.minOrderAmount > 0 ? `${c.minOrderAmount} ₺` : "—"}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs">
                    {c.usageCount}{c.maxUsageCount != null ? ` / ${c.maxUsageCount}` : ""}
                  </td>
                  <td className="px-5 py-3 text-slate-600 text-xs">
                    {c.endDate ? new Date(c.endDate).toLocaleDateString("tr-TR") : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      c.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {c.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(c)} title="Düzenle"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 hover:scale-110 active:scale-95 transition-all duration-150">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setConfirmDelete(c.id)} title="Sil"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:scale-110 active:scale-95 transition-all duration-150">
                        <Trash2 size={13} />
                      </button>
                    </div>
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

      {confirmDelete && (
        <ConfirmModal
          title="Kuponu Sil"
          message="Bu kuponu kalıcı olarak silmek istediğinizden emin misiniz?"
          confirmLabel="Sil"
          danger
          onConfirm={() => { handleDelete(confirmDelete); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-800">{editId ? "Kuponu Düzenle" : "Yeni Kupon"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

              {!editId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kupon Kodu *</label>
                  <input
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className={INPUT + " font-mono uppercase"}
                    placeholder="YAZI2024"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Açıklama</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className={INPUT} placeholder="İsteğe bağlı" />
              </div>

              {!editId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kupon Türü *</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: parseInt(e.target.value) }))} className={INPUT}>
                    <option value={1}>Sabit Tutar (₺)</option>
                    <option value={2}>Yüzde (%)</option>
                    <option value={3}>Ücretsiz Kargo</option>
                  </select>
                </div>
              )}

              {form.type !== 3 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    İndirim Değeri {form.type === 2 ? "(%)" : "(₺)"} *
                  </label>
                  <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                    className={INPUT} min="0" max={form.type === 2 ? 100 : undefined}
                    placeholder={form.type === 2 ? "10" : "50.00"} />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Min. Sipariş Tutarı (₺)</label>
                <input type="number" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                  className={INPUT} min="0" placeholder="0" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Maks. Toplam Kullanım</label>
                  <input type="number" value={form.maxUsageCount} onChange={e => setForm(f => ({ ...f, maxUsageCount: e.target.value }))}
                    className={INPUT} min="1" placeholder="Sınırsız" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kullanıcı Başı Limit</label>
                  <input type="number" value={form.maxUsagePerUser} onChange={e => setForm(f => ({ ...f, maxUsagePerUser: e.target.value }))}
                    className={INPUT} min="1" placeholder="Sınırsız" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Başlangıç Tarihi</label>
                  <input type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={INPUT} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Bitiş Tarihi</label>
                  <input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={INPUT} />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                <span className="text-sm text-slate-700">Aktif</span>
              </label>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50">Vazgeç</button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
                  {saving ? "Kaydediliyor..." : editId ? "Güncelle" : "Oluştur"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
