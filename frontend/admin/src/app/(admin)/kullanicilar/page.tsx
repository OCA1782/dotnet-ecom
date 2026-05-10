"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { exportToExcel, readExcelFile, downloadTemplate } from "@/lib/excel";
import { formatDate } from "@/lib/utils";
import type { AdminUser, PaginatedList } from "@/types";
import { Search, Plus, Upload, Download, X, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

const ROLE_COLORS: Record<string, string> = {
  SuperAdmin: "bg-purple-100 text-purple-800",
  Admin: "bg-red-100 text-red-800",
  ProductManager: "bg-indigo-100 text-indigo-800",
  StockManager: "bg-orange-100 text-orange-800",
  OrderManager: "bg-blue-100 text-blue-800",
  FinanceUser: "bg-green-100 text-green-800",
  CustomerSupport: "bg-teal-100 text-teal-800",
  ContentManager: "bg-pink-100 text-pink-800",
  Customer: "bg-slate-100 text-slate-600",
};

const ALL_ROLES = [
  "Customer", "Admin", "ProductManager", "StockManager",
  "OrderManager", "FinanceUser", "CustomerSupport", "ContentManager", "SuperAdmin",
];

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400";

interface NewUserForm { name: string; surname: string; email: string; password: string; role: string; }
interface EditUserForm { id: string; name: string; surname: string; role: string; profileImageUrl: string; }
const EMPTY_USER: NewUserForm = { name: "", surname: "", email: "", password: "", role: "Customer" };

const PAGE_SIZES = [20, 50, 100];

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewUserForm>(EMPTY_USER);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState<EditUserForm>({ id: "", name: "", surname: "", role: "Customer", profileImageUrl: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) qs.set("search", search);
      const data = await api.get<PaginatedList<AdminUser>>(`/api/admin/users?${qs}`);
      setUsers(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }, [page, pageSize, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleCreate() {
    if (!form.name || !form.surname || !form.email || !form.password) {
      setFormError("Tüm alanlar zorunludur."); return;
    }
    setSaving(true); setFormError("");
    try {
      await api.post("/api/admin/users", form);
      setMsg({ text: "Kullanıcı oluşturuldu.", ok: true });
      setShowModal(false); setForm(EMPTY_USER);
      await fetchUsers();
    } catch (e: unknown) { setFormError(e instanceof Error ? e.message : "Hata"); }
    finally { setSaving(false); }
  }

  function openEdit(u: AdminUser) {
    setEditForm({ id: u.id, name: u.name, surname: u.surname, role: u.roles?.[0] ?? "Customer", profileImageUrl: "" });
    setEditError("");
    setEditModal(true);
  }

  async function handleEdit() {
    if (!editForm.name || !editForm.surname) { setEditError("Ad ve soyad zorunludur."); return; }
    setEditSaving(true); setEditError("");
    try {
      await api.put(`/api/admin/users/${editForm.id}`, { id: editForm.id, name: editForm.name, surname: editForm.surname, role: editForm.role });
      setMsg({ text: "Kullanıcı güncellendi.", ok: true });
      setEditModal(false);
      await fetchUsers();
    } catch (e: unknown) { setEditError(e instanceof Error ? e.message : "Hata"); }
    finally { setEditSaving(false); }
  }

  async function handleToggleActive(u: AdminUser) {
    const endpoint = u.isActive ? "deactivate" : "activate";
    try {
      await api.patch(`/api/admin/users/${u.id}/${endpoint}`, {});
      setMsg({ text: `Kullanıcı ${u.isActive ? "pasife alındı" : "aktive edildi"}.`, ok: true });
      await fetchUsers();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Hata", ok: false });
    }
  }

  function handleExport() {
    exportToExcel(
      users.map(u => ({
        "Ad": u.name, "Soyad": u.surname, "E-posta": u.email,
        "Roller": u.roles?.join(", ") ?? "", "Durum": u.isActive ? "Aktif" : "Pasif",
        "Kayıt Tarihi": formatDate(u.createdDate),
      })),
      "kullanicilar", "Kullanıcılar"
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
          await api.post("/api/admin/users", {
            name: String(row["Ad"] ?? ""), surname: String(row["Soyad"] ?? ""),
            email: String(row["E-posta"] ?? ""), password: String(row["Şifre"] ?? "Ecom1234!"),
            role: String(row["Rol"] ?? "Customer"),
          });
          ok++;
        } catch { fail++; }
      }
      setImportResult(`${ok} kayıt eklendi${fail > 0 ? `, ${fail} hatalı` : ""}.`);
      await fetchUsers();
    } catch { setImportResult("Dosya okunamadı."); }
    finally { setImporting(false); e.target.value = ""; }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kullanıcılar</h1>
          <p className="text-sm text-slate-500 mt-0.5">{totalCount} kullanıcı</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadTemplate(["Ad", "Soyad", "E-posta", "Şifre", "Rol"], "kullanicilar")}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">Şablon İndir</button>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">
            <Download size={14} /> Excel'e Aktar
          </button>
          <label className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition cursor-pointer">
            <Upload size={14} /> {importing ? "Aktarılıyor..." : "İçe Aktar"}
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button onClick={() => { setForm(EMPTY_USER); setFormError(""); setShowModal(true); }}
            className="flex items-center gap-2 bg-[#12304A] hover:bg-[#0d2438] text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow">
            <Plus size={15} /> Yeni Kullanıcı
          </button>
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

      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={e => { e.preventDefault(); setPage(1); setSearch(searchInput); }} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Ad, soyad veya e-posta..."
              className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-64 text-slate-900 bg-white" />
          </div>
          <button type="submit" className="px-4 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition">Ara</button>
          {search && <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
            className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">Temizle</button>}
        </form>
        <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s} kayıt</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Kullanıcı", "E-posta", "Roller", "Durum", "Kayıt Tarihi", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">Yükleniyor...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">Kullanıcı bulunamadı</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className={`hover:bg-slate-50 transition ${!u.isActive ? "opacity-60" : ""}`}>
                  <td className="px-5 py-3.5 font-medium text-slate-900 text-xs">{u.name} {u.surname}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {u.roles?.map(role => (
                        <span key={role} className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[role] ?? "bg-slate-100 text-slate-600"}`}>
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {u.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{formatDate(u.createdDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => openEdit(u)} title="Düzenle"
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white shadow-sm hover:shadow-teal-200 hover:shadow-md transition-all duration-150 active:scale-95">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleToggleActive(u)} title={u.isActive ? "Pasife Çek" : "Aktive Et"}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl shadow-sm transition-all duration-150 active:scale-95 ${u.isActive ? "bg-green-50 text-green-600 hover:bg-green-500 hover:text-white hover:shadow-green-200 hover:shadow-md" : "bg-slate-100 text-slate-500 hover:bg-emerald-500 hover:text-white hover:shadow-emerald-200 hover:shadow-md"}`}>
                        {u.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
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
          <span className="px-4 py-2 text-sm text-slate-500">{page} / {totalPages}</span>
          {page < totalPages && <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm hover:bg-slate-50 text-slate-700">Sonraki →</button>}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-800">Yeni Kullanıcı</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{formError}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ad *</label>
                  <input className={INPUT} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Soyad *</label>
                  <input className={INPUT} value={form.surname} onChange={e => setForm(f => ({ ...f, surname: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">E-posta *</label>
                <input type="email" className={INPUT} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Şifre *</label>
                <input type="password" className={INPUT} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Rol *</label>
                <select className={INPUT} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button onClick={() => setShowModal(false)} className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50">Vazgeç</button>
                <button onClick={handleCreate} disabled={saving}
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
                  {saving ? "Kaydediliyor..." : "Oluştur"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-800">Kullanıcıyı Düzenle</h2>
              <button onClick={() => setEditModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {editError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{editError}</p>}
              <ImageUpload
                value={editForm.profileImageUrl}
                onChange={url => setEditForm(f => ({ ...f, profileImageUrl: url }))}
                label="Profil Fotoğrafı"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ad *</label>
                  <input className={INPUT} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Soyad *</label>
                  <input className={INPUT} value={editForm.surname} onChange={e => setEditForm(f => ({ ...f, surname: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Rol *</label>
                <select className={INPUT} value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                  {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button onClick={() => setEditModal(false)} className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50">Vazgeç</button>
                <button onClick={handleEdit} disabled={editSaving}
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
                  {editSaving ? "Kaydediliyor..." : "Güncelle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
