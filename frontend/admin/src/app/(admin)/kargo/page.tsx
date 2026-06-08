"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import {
  Truck, Search, RefreshCw, ExternalLink, CheckCircle,
  Package, Clock, AlertCircle, XCircle, ChevronLeft, ChevronRight,
  Pencil, X,
} from "lucide-react";

interface Shipment {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  cargoCompany: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippingCost: number;
  status: string;
  shippedDate: string | null;
  deliveredDate: string | null;
  createdDate: string;
  dataSource?: string;
}

interface PagedResult {
  items: Shipment[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_META: Record<string, { label: string; bg: string; text: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  NotShipped:     { label: "Kargoya Verilmedi", bg: "bg-slate-100",    text: "text-slate-600",   icon: Package },
  Preparing:      { label: "Hazırlanıyor",       bg: "bg-amber-100",   text: "text-amber-700",   icon: Clock },
  Shipped:        { label: "Kargoya Verildi",    bg: "bg-blue-100",    text: "text-blue-700",    icon: Truck },
  InTransit:      { label: "Yolda",              bg: "bg-violet-100",  text: "text-violet-700",  icon: Truck },
  Delivered:      { label: "Teslim Edildi",      bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle },
  FailedDelivery: { label: "Teslim Başarısız",   bg: "bg-red-100",     text: "text-red-700",     icon: AlertCircle },
  Returned:       { label: "İade Edildi",         bg: "bg-orange-100",  text: "text-orange-700",  icon: XCircle },
};

const ALL_STATUSES = Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label }));

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META["NotShipped"];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${m.bg} ${m.text}`}>
      <Icon size={11} /> {m.label}
    </span>
  );
}

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtCost(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);
}

export default function KargoPage() {
  const { t } = useI18n();
  const [data, setData] = useState<PagedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Edit modal
  const [editTarget, setEditTarget] = useState<Shipment | null>(null);
  const [editForm, setEditForm] = useState({ cargoCompany: "", trackingNumber: "", trackingUrl: "", status: "" });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const result = await api.get<PagedResult>(`/api/admin/shipments?${params}`);
      setData(result);
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  function openEdit(s: Shipment) {
    setEditForm({
      cargoCompany: s.cargoCompany,
      trackingNumber: s.trackingNumber ?? "",
      trackingUrl: s.trackingUrl ?? "",
      status: s.status,
    });
    setEditError("");
    setEditTarget(s);
  }

  async function handleSave() {
    if (!editTarget) return;
    setSaving(true);
    setEditError("");
    try {
      await api.patch(`/api/admin/shipments/${editTarget.id}`, {
        cargoCompany: editForm.cargoCompany,
        trackingNumber: editForm.trackingNumber || null,
        trackingUrl: editForm.trackingUrl || null,
        status: editForm.status,
      });
      setEditTarget(null);
      await load();
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Güncelleme başarısız.");
    } finally {
      setSaving(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  const items = data?.items ?? [];
  const inp = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800";
  const lbl = "block text-xs font-medium text-slate-600 mb-1";

  const delivered = items.filter(s => s.status === "Delivered").length;
  const inTransit = items.filter(s => s.status === "Shipped" || s.status === "InTransit").length;
  const failed    = items.filter(s => s.status === "FailedDelivery").length;
  const preparing = items.filter(s => s.status === "Preparing" || s.status === "NotShipped").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-teal-600" /> {t("page./kargo", "Kargo Takip")}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Tüm sipariş sevkiyatlarını takip edin, durum güncelleyin.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Yenile
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Teslim Edildi", value: delivered, bg: "bg-emerald-50", icon: CheckCircle, color: "text-emerald-600" },
          { label: "Yolda",         value: inTransit, bg: "bg-blue-50",    icon: Truck,        color: "text-blue-600" },
          { label: "Hazırlık",      value: preparing, bg: "bg-amber-50",   icon: Package,      color: "text-amber-600" },
          { label: "Teslim Başarısız", value: failed, bg: "bg-red-50",     icon: AlertCircle,  color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg}`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="font-bold text-slate-800 text-lg leading-none mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Takip no, sipariş no, müşteri, firma..."
              className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition">Ara</button>
          {(search || statusFilter) && (
            <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setStatusFilter(""); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-500 hover:bg-slate-50 transition flex items-center gap-1">
              <X size={13} /> Temizle
            </button>
          )}
        </form>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400">
          <option value="">Tüm Durumlar</option>
          {ALL_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Yükleniyor...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Truck size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Kargo kaydı bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sipariş</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Müşteri</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kargo Firması</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Takip No</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Durum</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarihler</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ücret</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kaynak</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map(s => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{s.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 text-xs">{s.customerName ?? "Misafir"}</p>
                      {s.customerEmail && <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{s.customerEmail}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Truck size={13} className="text-slate-400 shrink-0" />
                        <span className="text-slate-700 font-medium">{s.cargoCompany}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {s.trackingNumber ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-slate-700">{s.trackingNumber}</span>
                          {s.trackingUrl && (
                            <a href={s.trackingUrl} target="_blank" rel="noreferrer"
                              className="text-teal-500 hover:text-teal-700 transition">
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {s.shippedDate && (
                          <p className="text-[11px] text-slate-500">
                            <span className="text-slate-400">Gönderim:</span> {fmtDate(s.shippedDate)}
                          </p>
                        )}
                        {s.deliveredDate && (
                          <p className="text-[11px] text-emerald-600">
                            <span className="text-slate-400">Teslim:</span> {fmtDate(s.deliveredDate)}
                          </p>
                        )}
                        {!s.shippedDate && !s.deliveredDate && (
                          <p className="text-[11px] text-slate-400">{fmtDate(s.createdDate)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700 font-semibold">{fmtCost(s.shippingCost)}</td>
                    <td className="px-4 py-3">
                      {s.dataSource ? <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 whitespace-nowrap">{s.dataSource}</span> : <span className="text-xs text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(s)}
                        className="p-1.5 rounded-lg hover:bg-teal-50 text-slate-400 hover:text-teal-600 transition">
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Toplam <span className="font-semibold">{data.totalCount}</span> kayıt · Sayfa {data.page}/{data.totalPages}
            </p>
            <div className="flex gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Truck size={16} className="text-teal-600" /> Kargo Güncelle
              </h2>
              <button onClick={() => setEditTarget(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-600">
                Sipariş: <span className="font-mono font-semibold text-slate-800">{editTarget.orderNumber}</span>
              </div>
              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{editError}</div>
              )}
              <div>
                <label className={lbl}>Kargo Firması</label>
                <input value={editForm.cargoCompany} onChange={e => setEditForm(f => ({...f, cargoCompany: e.target.value}))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Takip Numarası</label>
                <input value={editForm.trackingNumber} onChange={e => setEditForm(f => ({...f, trackingNumber: e.target.value}))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Takip URL</label>
                <input value={editForm.trackingUrl} onChange={e => setEditForm(f => ({...f, trackingUrl: e.target.value}))} className={inp} placeholder="https://..." />
              </div>
              <div>
                <label className={lbl}>Durum</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({...f, status: e.target.value}))} className={inp}>
                  {ALL_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button onClick={() => setEditTarget(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">
                  İptal
                </button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition disabled:opacity-60">
                  {saving ? "Kaydediliyor..." : "Güncelle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
