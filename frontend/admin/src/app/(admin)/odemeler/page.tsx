"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  CreditCard, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  Clock, ChevronRight, X, FileText, Search, Filter,
  CheckCheck, PauseCircle, Ban,
} from "lucide-react";

interface Payment {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  paymentProvider: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: string;
  transactionId: string | null;
  paidDate: string | null;
  errorMessage: string | null;
  createdDate: string;
}

interface PaymentLog {
  id: string;
  fromStatus: string;
  toStatus: string;
  note: string | null;
  createdDate: string;
}

interface PaymentListResponse {
  items: Payment[];
  total: number;
  page: number;
  pageSize: number;
}

interface LogsResponse {
  orderNumber: string;
  logs: PaymentLog[];
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  Pending:           { label: "Bekliyor",           color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200", icon: Clock },
  Paid:              { label: "Ödendi",              color: "text-emerald-700",bg: "bg-emerald-50",border: "border-emerald-200",icon: CheckCircle2 },
  Failed:            { label: "Başarısız",           color: "text-red-700",   bg: "bg-red-50",    border: "border-red-200",   icon: XCircle },
  Cancelled:         { label: "İptal Edildi",        color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", icon: Ban },
  Refunded:          { label: "İade Edildi",         color: "text-violet-700",bg: "bg-violet-50", border: "border-violet-200",icon: CheckCheck },
  PartiallyRefunded: { label: "Kısmi İade",          color: "text-orange-700",bg: "bg-orange-50", border: "border-orange-200",icon: AlertTriangle },
};

const METHOD_MAP: Record<string, string> = {
  CreditCard:     "Kredi Kartı",
  DebitCard:      "Banka Kartı",
  BankTransfer:   "Havale/EFT",
  CashOnDelivery: "Kapıda Ödeme",
};

const STATUS_FILTERS = [
  { value: "", label: "Tümü" },
  { value: "Pending",   label: "Bekliyor" },
  { value: "Paid",      label: "Ödendi" },
  { value: "Failed",    label: "Başarısız" },
  { value: "Cancelled", label: "İptal Edildi" },
  { value: "Refunded",  label: "İade Edildi" },
];

const PAGE_SIZE = 20;

export default function OdemelerPage() {
  const [data, setData] = useState<PaymentListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Action modal
  const [actionTarget, setActionTarget] = useState<Payment | null>(null);
  const [actionType, setActionType] = useState<"approve" | "suspend" | "reject" | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  // Logs drawer
  const [logsTarget, setLogsTarget] = useState<Payment | null>(null);
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  async function load(p = page, status = statusFilter, manual = false) {
    if (manual) setRefreshing(true); else setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(PAGE_SIZE) });
      if (status) params.set("status", status);
      const res = await api.get<PaymentListResponse>(`/api/admin/payments?${params}`);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  function applyFilter(status: string) {
    setStatusFilter(status);
    setPage(1);
    load(1, status);
  }

  function gotoPage(p: number) {
    setPage(p);
    load(p, statusFilter);
  }

  async function openLogs(payment: Payment) {
    setLogsTarget(payment);
    setLogsLoading(true);
    setLogs([]);
    try {
      const res = await api.get<LogsResponse>(`/api/admin/payments/${payment.id}/logs`);
      setLogs(res.logs);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }

  function openAction(payment: Payment, type: "approve" | "suspend" | "reject") {
    setActionTarget(payment);
    setActionType(type);
    setActionNote("");
    setActionError("");
  }

  async function submitAction() {
    if (!actionTarget || !actionType) return;
    setActionLoading(true);
    setActionError("");
    try {
      await api.put(`/api/admin/payments/${actionTarget.id}/${actionType}`, { note: actionNote || null });
      setActionTarget(null);
      setActionType(null);
      load(page, statusFilter, true);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setActionLoading(false);
    }
  }

  const filtered = data?.items.filter(p =>
    !search ||
    p.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.customerName.toLowerCase().includes(search.toLowerCase()) ||
    (p.customerEmail ?? "").toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_MAP[status] ?? { label: status, color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", icon: Clock };
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
        <Icon size={11} /> {cfg.label}
      </span>
    );
  }

  const actionConfig = {
    approve: { title: "Ödemeyi Onayla", color: "bg-emerald-600 hover:bg-emerald-700", icon: CheckCheck, desc: "Bu ödemeyi manuel olarak onaylıyorsunuz. Siparişin durumu 'Ödendi' olarak güncellenecek." },
    suspend: { title: "Askıya Al",       color: "bg-amber-600 hover:bg-amber-700",   icon: PauseCircle, desc: "Bu sipariş 'Askıya Alındı' durumuna geçecek. Ödeme durumu değişmez." },
    reject:  { title: "Reddet",          color: "bg-red-600 hover:bg-red-700",       icon: Ban,         desc: "Ödeme iptal edilecek ve sipariş 'İptal Edildi' durumuna geçecek." },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-teal-600" />
            Ödemeler
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Tüm ödeme işlemlerini izleyin, onaylayın veya askıya alın</p>
        </div>
        <button
          onClick={() => load(page, statusFilter, true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          Yenile
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Sipariş no, müşteri ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => applyFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === f.value
                    ? "bg-teal-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-slate-400">Yükleniyor...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <CreditCard size={28} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Ödeme kaydı bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Sipariş</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Müşteri</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Yöntem</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Tutar</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Durum</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Tarih</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-xs font-semibold text-slate-800">{p.orderNumber}</div>
                      {p.transactionId && (
                        <div className="text-xs text-slate-400 truncate max-w-[140px]">TXN: {p.transactionId}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-800 text-xs">{p.customerName}</div>
                      {p.customerEmail && <div className="text-xs text-slate-400">{p.customerEmail}</div>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-xs text-slate-600">{METHOD_MAP[p.paymentMethod] ?? p.paymentMethod}</div>
                      <div className="text-xs text-slate-400">{p.paymentProvider}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-semibold text-slate-900 text-sm">
                        {p.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {p.currency}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={p.status} />
                      {p.errorMessage && (
                        <div className="text-xs text-red-500 mt-0.5 max-w-[160px] truncate" title={p.errorMessage}>
                          {p.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      <div>{new Date(p.createdDate).toLocaleDateString("tr-TR")}</div>
                      <div className="text-slate-400">{new Date(p.createdDate).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openLogs(p)}
                          title="Logları Görüntüle"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        >
                          <FileText size={14} />
                        </button>
                        {(p.status === "Pending" || p.status === "Failed") && (
                          <button
                            onClick={() => openAction(p, "approve")}
                            title="Onayla"
                            className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                          >
                            <CheckCheck size={14} />
                          </button>
                        )}
                        {p.status === "Pending" && (
                          <button
                            onClick={() => openAction(p, "suspend")}
                            title="Askıya Al"
                            className="p-1.5 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-50 transition"
                          >
                            <PauseCircle size={14} />
                          </button>
                        )}
                        {(p.status === "Pending" || p.status === "Failed") && (
                          <button
                            onClick={() => openAction(p, "reject")}
                            title="Reddet"
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                          >
                            <Ban size={14} />
                          </button>
                        )}
                        <ChevronRight size={14} className="text-slate-300" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.total > PAGE_SIZE && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">{data.total} kayıttan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.total)} gösteriliyor</span>
            <div className="flex gap-1">
              <button
                onClick={() => gotoPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Önceki
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => gotoPage(p)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition ${p === page ? "bg-teal-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => gotoPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionTarget && actionType && (() => {
        const cfg = actionConfig[actionType];
        const Icon = cfg.icon;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Icon size={18} className="text-slate-600" /> {cfg.title}
                </h2>
                <button onClick={() => { setActionTarget(null); setActionType(null); }}
                  className="text-slate-400 hover:text-slate-600 transition"><X size={18} /></button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="bg-slate-50 rounded-xl p-3 text-sm">
                  <p className="font-semibold text-slate-700">{actionTarget.orderNumber}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{actionTarget.customerName} · {actionTarget.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {actionTarget.currency}</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{cfg.desc}</p>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Not (isteğe bağlı)</label>
                  <textarea
                    rows={3}
                    value={actionNote}
                    onChange={e => setActionNote(e.target.value)}
                    placeholder="Açıklama ekleyin..."
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                </div>
                {actionError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">{actionError}</div>
                )}
              </div>
              <div className="flex gap-2 px-6 pb-5">
                <button
                  onClick={() => { setActionTarget(null); setActionType(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  İptal
                </button>
                <button
                  onClick={submitAction}
                  disabled={actionLoading}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60 ${cfg.color}`}
                >
                  {actionLoading ? "İşleniyor..." : cfg.title}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Logs Drawer */}
      {logsTarget && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm" onClick={() => setLogsTarget(null)}>
          <div className="bg-white w-full max-w-md h-full shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-800">Sipariş Geçmişi</h2>
                <p className="text-xs text-slate-500">{logsTarget.orderNumber}</p>
              </div>
              <button onClick={() => setLogsTarget(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {logsLoading ? (
                <div className="text-center py-10 text-slate-400 text-sm">Yükleniyor...</div>
              ) : logs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">Log kaydı bulunamadı.</div>
              ) : (
                <ol className="relative border-l border-slate-200 ml-2 space-y-5">
                  {logs.map((log) => (
                    <li key={log.id} className="ml-5">
                      <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-teal-100 ring-4 ring-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                      </span>
                      <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <span className="text-slate-400">{log.fromStatus}</span>
                          <ChevronRight size={12} className="text-slate-300" />
                          <span className="text-teal-700">{log.toStatus}</span>
                        </div>
                        {log.note && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{log.note}</p>}
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(log.createdDate).toLocaleString("tr-TR")}
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
    </div>
  );
}
