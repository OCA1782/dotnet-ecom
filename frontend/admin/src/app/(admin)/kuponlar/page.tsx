"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { Coupon, PaginatedList } from "@/types";
import { COUPON_TYPE_LABEL } from "@/types";
import { exportToExcel } from "@/lib/excel";
import { Download } from "lucide-react";

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

function toISOLocal(dt: string) {
  if (!dt) return undefined;
  return new Date(dt).toISOString();
}

export default function KuponlarPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<PaginatedList<Coupon>>(
        `/api/admin/coupons?page=${page}&pageSize=${PAGE_SIZE}&includeInactive=${includeInactive}`
      );
      setCoupons(data.items);
      setTotal(data.totalCount);
    } finally {
      setLoading(false);
    }
  }, [page, includeInactive]);

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
    if (!confirm("Bu kuponu silmek istediğinizden emin misiniz?")) return;
    try {
      await api.delete(`/api/admin/coupons/${id}`);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Silinemedi.");
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Kuponlar</h1>
          <p className="text-zinc-400 text-sm mt-1">{total} kupon</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => { setIncludeInactive(e.target.checked); setPage(1); }}
              className="rounded"
            />
            Pasif kuponu göster
          </label>
          <button
            onClick={() => exportToExcel(
              coupons.map(c => ({
                "Kod": c.code, "Tip": COUPON_TYPE_LABEL[c.type], "Değer": c.value,
                "Min Tutar": c.minOrderAmount, "Kullanım": c.usageCount,
                "Durum": c.isActive ? "Aktif" : "Pasif",
              })),
              "kuponlar", "Kuponlar"
            )}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition"
          >
            <Download size={14} /> Excel
          </button>
          <button
            onClick={openCreate}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Yeni Kupon
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-700 text-zinc-400 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3">Kod</th>
              <th className="text-left px-4 py-3">Tür</th>
              <th className="text-left px-4 py-3">Değer</th>
              <th className="text-left px-4 py-3">Min. Sipariş</th>
              <th className="text-left px-4 py-3">Kullanım</th>
              <th className="text-left px-4 py-3">Bitiş</th>
              <th className="text-left px-4 py-3">Durum</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center text-zinc-500 py-12">Yükleniyor...</td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-zinc-500 py-12">Kupon bulunamadı</td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="border-b border-zinc-700/50 hover:bg-zinc-700/30 transition">
                  <td className="px-4 py-3 font-mono font-semibold text-white">{c.code}</td>
                  <td className="px-4 py-3 text-zinc-300">{COUPON_TYPE_LABEL[c.type]}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {c.type === 2 ? `%${c.value}` : c.type === 3 ? "—" : `${c.value.toFixed(2)} ₺`}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{c.minOrderAmount > 0 ? `${c.minOrderAmount} ₺` : "—"}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {c.usageCount}{c.maxUsageCount != null ? ` / ${c.maxUsageCount}` : ""}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {c.endDate ? new Date(c.endDate).toLocaleDateString("tr-TR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.isActive ? "bg-green-900/50 text-green-400" : "bg-zinc-700 text-zinc-400"
                    }`}>
                      {c.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-xs text-zinc-400 hover:text-white transition"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                p === page ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-white font-semibold text-lg mb-5">
              {editId ? "Kuponu Düzenle" : "Yeni Kupon"}
            </h2>

            <div className="space-y-4">
              {!editId && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Kupon Kodu *</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
                    placeholder="YAZI2024"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Açıklama</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="İsteğe bağlı"
                />
              </div>

              {!editId && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Kupon Türü *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm(f => ({ ...f, type: parseInt(e.target.value) }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={1}>Sabit Tutar (₺)</option>
                    <option value={2}>Yüzde (%)</option>
                    <option value={3}>Ücretsiz Kargo</option>
                  </select>
                </div>
              )}

              {form.type !== 3 && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    İndirim Değeri {form.type === 2 ? "(%)" : "(₺)"} *
                  </label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    min="0"
                    max={form.type === 2 ? 100 : undefined}
                    placeholder={form.type === 2 ? "10" : "50.00"}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Min. Sipariş Tutarı (₺)</label>
                <input
                  type="number"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  min="0"
                  placeholder="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Maks. Toplam Kullanım</label>
                  <input
                    type="number"
                    value={form.maxUsageCount}
                    onChange={(e) => setForm(f => ({ ...f, maxUsageCount: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    min="1"
                    placeholder="Sınırsız"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Kullanıcı Başı Limit</label>
                  <input
                    type="number"
                    value={form.maxUsagePerUser}
                    onChange={(e) => setForm(f => ({ ...f, maxUsagePerUser: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    min="1"
                    placeholder="Sınırsız"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Başlangıç Tarihi</label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Bitiş Tarihi</label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-zinc-300">Aktif</span>
              </label>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-400 bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition"
              >
                {saving ? "Kaydediliyor..." : editId ? "Güncelle" : "Oluştur"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium py-2.5 rounded-lg transition"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
