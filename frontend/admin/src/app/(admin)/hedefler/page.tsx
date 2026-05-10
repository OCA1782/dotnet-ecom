"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { SalesGoal } from "@/types";
import { Target, TrendingUp, ShoppingCart, Check, Pencil, X } from "lucide-react";

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

interface MonthActual {
  month: string;
  revenue: number;
  orderCount: number;
}

interface DashboardStats {
  monthlySummary: MonthActual[];
}

export default function HedeflerPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [monthFilter, setMonthFilter] = useState(0);
  const [goals, setGoals] = useState<SalesGoal[]>([]);
  const [actuals, setActuals] = useState<MonthActual[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [editRevenue, setEditRevenue] = useState("");
  const [editOrderCount, setEditOrderCount] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [goalsData, statsData] = await Promise.all([
        api.get<SalesGoal[]>(`/api/admin/goals?year=${year}`),
        api.get<DashboardStats>("/api/admin/dashboard"),
      ]);
      setGoals(goalsData);
      setActuals(statsData.monthlySummary ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

  function getGoal(month: number): SalesGoal | undefined {
    return goals.find(g => g.month === month);
  }

  function getActual(month: number): MonthActual | undefined {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    return actuals.find(a => a.month === key);
  }

  function startEdit(month: number) {
    const goal = getGoal(month);
    setEditRevenue(goal ? String(goal.targetRevenue) : "");
    setEditOrderCount(goal ? String(goal.targetOrderCount) : "");
    setEditingMonth(month);
  }

  async function handleSave(month: number) {
    setSaving(true);
    try {
      await api.put(`/api/admin/goals/${year}/${month}`, {
        targetRevenue: parseFloat(editRevenue) || 0,
        targetOrderCount: parseInt(editOrderCount) || 0,
      });
      setMsg({ text: `${MONTHS[month - 1]} hedefi kaydedildi.`, ok: true });
      setEditingMonth(null);
      await load();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Hata oluştu.", ok: false });
    } finally { setSaving(false); }
  }

  const now = new Date();
  const totalTargetRevenue = goals.reduce((s, g) => s + g.targetRevenue, 0);
  const totalTargetOrders = goals.reduce((s, g) => s + g.targetOrderCount, 0);
  const totalActualRevenue = actuals.filter(a => a.month.startsWith(String(year))).reduce((s, a) => s + a.revenue, 0);
  const totalActualOrders = actuals.filter(a => a.month.startsWith(String(year))).reduce((s, a) => s + a.orderCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hedefler</h1>
          <p className="text-sm text-slate-500 mt-0.5">Aylık satış miktarı ve gelir hedeflerini belirleyin</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={monthFilter} onChange={e => setMonthFilter(Number(e.target.value))}
            className="border border-slate-300 rounded-xl px-3 py-1.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value={0}>Tüm Aylar</option>
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <button onClick={() => setYear(y => y - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-300 text-slate-500 hover:bg-slate-50 text-sm transition">‹</button>
            <span className="text-sm font-bold text-slate-800 w-12 text-center">{year}</span>
            <button onClick={() => setYear(y => y + 1)}
              disabled={year >= currentYear}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-300 text-slate-500 hover:bg-slate-50 text-sm transition disabled:opacity-40">›</button>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`text-sm px-4 py-3 rounded-xl flex items-center justify-between ${msg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.text}
          <button onClick={() => setMsg(null)}><X size={14} /></button>
        </div>
      )}

      {totalTargetRevenue > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
                <TrendingUp size={15} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Yıllık Gelir Hedefi</p>
                <p className="text-sm font-bold text-slate-800">{formatPrice(totalTargetRevenue)}</p>
              </div>
            </div>
            <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                style={{ width: `${Math.min((totalActualRevenue / totalTargetRevenue) * 100, 100)}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>{formatPrice(totalActualRevenue)} gerçekleşen</span>
              <span>{Math.round((totalActualRevenue / totalTargetRevenue) * 100)}%</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-400 flex items-center justify-center">
                <ShoppingCart size={15} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Yıllık Sipariş Hedefi</p>
                <p className="text-sm font-bold text-slate-800">{totalTargetOrders.toLocaleString("tr-TR")} sipariş</p>
              </div>
            </div>
            <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-400 transition-all duration-700"
                style={{ width: `${Math.min((totalActualOrders / totalTargetOrders) * 100, 100)}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>{totalActualOrders.toLocaleString("tr-TR")} gerçekleşen</span>
              <span>{Math.round((totalActualOrders / totalTargetOrders) * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MONTHS.filter((_, idx) => monthFilter === 0 || idx + 1 === monthFilter).map((monthName, idx) => {
            const month = monthFilter !== 0 ? monthFilter : idx + 1;
            const goal = getGoal(month);
            const actual = getActual(month);
            const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
            const isPast = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
            const isEditing = editingMonth === month;

            const revPct = goal && actual ? Math.min((actual.revenue / goal.targetRevenue) * 100, 100) : 0;
            const ordPct = goal && actual ? Math.min((actual.orderCount / goal.targetOrderCount) * 100, 100) : 0;

            return (
              <div key={month} className={`bg-white rounded-2xl border shadow-sm p-5 transition ${isCurrentMonth ? "border-teal-300 ring-1 ring-teal-200" : "border-slate-200"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {isCurrentMonth && (
                      <span className="text-xs bg-teal-100 text-teal-700 font-semibold px-2 py-0.5 rounded-full">Bu Ay</span>
                    )}
                    <h3 className="font-bold text-slate-800 text-sm">{monthName}</h3>
                  </div>
                  {!isEditing && (
                    <button onClick={() => startEdit(month)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-teal-100 hover:text-teal-700 transition">
                      <Pencil size={12} />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Gelir Hedefi (₺)</label>
                      <input type="number" value={editRevenue} onChange={e => setEditRevenue(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                        placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Sipariş Hedefi</label>
                      <input type="number" value={editOrderCount} onChange={e => setEditOrderCount(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                        placeholder="0" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleSave(month)} disabled={saving}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-teal-600 text-white text-xs font-semibold py-2 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition">
                        <Check size={13} /> Kaydet
                      </button>
                      <button onClick={() => setEditingMonth(null)}
                        className="px-3 py-2 border border-slate-300 text-slate-500 text-xs rounded-xl hover:bg-slate-50 transition">
                        İptal
                      </button>
                    </div>
                  </div>
                ) : goal ? (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 flex items-center gap-1"><TrendingUp size={11} /> Gelir</span>
                        <span className="font-semibold text-slate-700">{formatPrice(goal.targetRevenue)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${revPct}%`, background: revPct >= 100 ? "#34d399" : revPct >= 75 ? "#6366f1" : revPct >= 50 ? "#fbbf24" : "#f87171" }} />
                      </div>
                      {actual && <p className="text-xs text-slate-400 mt-0.5">{formatPrice(actual.revenue)} · {revPct.toFixed(0)}%</p>}
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 flex items-center gap-1"><ShoppingCart size={11} /> Sipariş</span>
                        <span className="font-semibold text-slate-700">{goal.targetOrderCount}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${ordPct}%`, background: ordPct >= 100 ? "#34d399" : ordPct >= 75 ? "#6366f1" : ordPct >= 50 ? "#fbbf24" : "#f87171" }} />
                      </div>
                      {actual && <p className="text-xs text-slate-400 mt-0.5">{actual.orderCount} sipariş · {ordPct.toFixed(0)}%</p>}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <Target size={22} className="text-slate-200 mb-2" />
                    <p className="text-xs text-slate-400">Hedef belirlenmedi</p>
                    <button onClick={() => startEdit(month)}
                      className="mt-2 text-xs text-teal-600 hover:text-teal-800 font-medium transition">
                      + Hedef Ekle
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
