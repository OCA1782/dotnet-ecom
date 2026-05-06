"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import type { DashboardStats } from "@/types";
import { ORDER_STATUS, ORDER_STATUS_COLORS } from "@/types";
import { TrendingUp, ShoppingCart, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<DashboardStats>("/api/admin/dashboard")
      .then(setStats)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Hata"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-zinc-400 text-sm">Yükleniyor...</div>;
  if (error) return <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl">{error}</div>;
  if (!stats) return null;

  const statCards = [
    {
      label: "Bugünkü Satış",
      value: formatPrice(stats.todaySales),
      icon: TrendingUp,
      color: "bg-green-50 text-green-700",
    },
    {
      label: "Bugünkü Sipariş",
      value: stats.todayOrderCount,
      icon: ShoppingCart,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Bekleyen Sipariş",
      value: stats.pendingOrderCount,
      icon: Clock,
      color: "bg-yellow-50 text-yellow-700",
    },
    {
      label: "Kritik Stok",
      value: stats.criticalStockCount,
      icon: AlertTriangle,
      color: "bg-red-50 text-red-700",
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-500">{label}</p>
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Monthly Summary */}
      {stats.monthlySummary?.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="font-semibold text-zinc-800 mb-4">Aylık Özet</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left py-2 text-zinc-500 font-medium">Ay</th>
                  <th className="text-right py-2 text-zinc-500 font-medium">Sipariş</th>
                  <th className="text-right py-2 text-zinc-500 font-medium">Gelir</th>
                </tr>
              </thead>
              <tbody>
                {stats.monthlySummary.map((m) => (
                  <tr key={m.month} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="py-2.5 font-medium text-zinc-800">{m.month}</td>
                    <td className="py-2.5 text-right text-zinc-600">{m.orderCount}</td>
                    <td className="py-2.5 text-right font-semibold text-zinc-900">{formatPrice(m.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {stats.recentOrders?.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-800">Son Siparişler</h2>
            <Link href="/siparisler" className="text-sm text-zinc-500 hover:text-zinc-900 underline">
              Tümünü Gör
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left py-2 text-zinc-500 font-medium">Sipariş No</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">Müşteri</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">Durum</th>
                  <th className="text-right py-2 text-zinc-500 font-medium">Tutar</th>
                  <th className="text-right py-2 text-zinc-500 font-medium">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="py-2.5">
                      <Link
                        href={`/siparisler/${order.orderNumber}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 text-zinc-600">{order.customerName}</td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status] ?? "bg-zinc-100 text-zinc-700"}`}>
                        {ORDER_STATUS[order.status] ?? "—"}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-zinc-900">{formatPrice(order.grandTotal)}</td>
                    <td className="py-2.5 text-right text-zinc-400 text-xs">{formatDate(order.createdDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
