"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, formatDate } from "@/lib/utils";
import type { OrderDetail } from "@/types";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/types";

export default function OrderDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/giris");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get<OrderDetail>(`/api/orders/${orderNumber}`)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [user, orderNumber]);

  async function cancelOrder() {
    if (!order) return;
    setCancelling(true);
    try {
      await api.post(`/api/orders/${order.id}/cancel`, { reason: "Müşteri talebi" });
      const updated = await api.get<OrderDetail>(`/api/orders/${orderNumber}`);
      setOrder(updated);
    } catch {
      // ignore
    } finally {
      setCancelling(false);
    }
  }

  if (authLoading || loading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">Yükleniyor...</div>;
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">Sipariş bulunamadı</p>
        <Link href="/hesabim/siparisler" className="mt-4 inline-block text-sm underline text-slate-700">
          Siparişlerime Dön
        </Link>
      </div>
    );
  }

  let shippingAddr: Record<string, string> = {};
  try {
    shippingAddr = JSON.parse(order.shippingAddressSnapshot);
  } catch {
    shippingAddr = {};
  }

  const canCancel = [1, 2].includes(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/hesabim/siparisler" className="text-sm text-slate-500 hover:text-slate-800">
            ← Siparişlerim
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{order.orderNumber}</h1>
          <p className="text-sm text-slate-500">{formatDate(order.createdDate)}</p>
        </div>
        <div className="text-right">
          <span className="inline-block text-sm px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 font-medium">
            {ORDER_STATUS[order.status] ?? "—"}
          </span>
          <p className="text-xs text-slate-500 mt-1">Ödeme: {PAYMENT_STATUS[order.paymentStatus] ?? "—"}</p>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Ürünler</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4">
              <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.productName} className="object-contain w-full h-full p-1" />
                ) : (
                  <span className="text-xl">📦</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{item.productName}</p>
                {item.variantName && <p className="text-xs text-slate-500">{item.variantName}</p>}
                <p className="text-xs text-slate-400">SKU: {item.sku}</p>
              </div>
              <div className="text-right text-sm shrink-0">
                <p className="font-medium text-slate-900">{formatPrice(item.lineTotal)}</p>
                <p className="text-xs text-slate-500">
                  {formatPrice(item.unitPrice)} × {item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 px-5 py-4 space-y-1.5">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Ara Toplam</span>
            <span>{formatPrice(order.totalProductAmount)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>KDV</span>
            <span>{formatPrice(order.taxAmount)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Kargo</span>
            <span>{order.shippingAmount === 0 ? "Ücretsiz" : formatPrice(order.shippingAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
            <span>Toplam</span>
            <span>{formatPrice(order.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      {Object.keys(shippingAddr).length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Teslimat Adresi</h2>
          <p className="text-sm text-slate-700">
            {shippingAddr.firstName} {shippingAddr.lastName}
          </p>
          <p className="text-sm text-slate-500">{shippingAddr.fullAddress}</p>
          <p className="text-sm text-slate-500">
            {shippingAddr.district}, {shippingAddr.city}
          </p>
          {shippingAddr.phoneNumber && (
            <p className="text-sm text-slate-500">{shippingAddr.phoneNumber}</p>
          )}
        </div>
      )}

      {/* Shipment tracking */}
      {order.shipments?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <span className="text-lg">🚚</span>
            <h2 className="font-semibold text-slate-800">Kargo Bilgisi</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {order.shipments.map((s) => (
              <div key={s.id} className="px-5 py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">{s.carrier}</span>
                  {s.shippedAt && (
                    <span className="text-xs text-slate-400">{formatDate(s.shippedAt)}</span>
                  )}
                </div>
                {s.trackingNumber && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Takip No:</span>
                    <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded">
                      {s.trackingNumber}
                    </span>
                  </div>
                )}
                {s.trackingUrl && (
                  <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-medium underline">
                    Kargo takip sayfasını aç →
                  </a>
                )}
                {s.deliveredAt && (
                  <p className="text-xs text-emerald-600 font-medium">
                    ✓ Teslim edildi: {formatDate(s.deliveredAt)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status History */}
      {order.statusHistory?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Durum Geçmişi</h2>
          <div className="space-y-3">
            {order.statusHistory.map((h, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="text-slate-400 shrink-0 text-xs mt-0.5">{formatDate(h.changedAt)}</span>
                <span className="text-slate-600">
                  {ORDER_STATUS[h.fromStatus] ?? "—"} → <span className="font-medium text-slate-800">{ORDER_STATUS[h.toStatus] ?? "—"}</span>
                  {h.note && <span className="text-slate-400"> · {h.note}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {canCancel && (
        <div className="flex justify-end">
          <button
            onClick={cancelOrder}
            disabled={cancelling}
            className="px-5 py-2.5 border border-red-300 text-red-600 text-sm rounded-xl hover:bg-red-50 transition disabled:opacity-50"
          >
            {cancelling ? "İptal ediliyor..." : "Siparişi İptal Et"}
          </button>
        </div>
      )}
    </div>
  );
}
