"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import type { AdminOrderDetail } from "@/types";
import { ORDER_STATUS, ORDER_STATUS_COLORS, PAYMENT_STATUS } from "@/types";

const ALLOWED_TRANSITIONS: Record<number, number[]> = {
  1: [2, 8],
  2: [3, 8],
  3: [4],
  4: [5],
  5: [6],
  6: [7],
};

export default function AdminOrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusNote, setStatusNote] = useState("");
  const [newStatus, setNewStatus] = useState<number | "">("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [showShipmentForm, setShowShipmentForm] = useState(false);
  const [shipmentForm, setShipmentForm] = useState({ trackingNumber: "", carrier: "Yurtiçi Kargo" });
  const [creatingShipment, setCreatingShipment] = useState(false);

  async function fetchOrder() {
    try {
      const data = await api.get<AdminOrderDetail>(`/api/orders/admin/${orderNumber}`);
      setOrder(data);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrder();
  }, [orderNumber]);

  async function handleStatusUpdate() {
    if (!order || newStatus === "") return;
    setUpdatingStatus(true);
    setStatusMsg("");
    try {
      await api.put(`/api/orders/admin/${order.id}/status`, {
        newStatus: Number(newStatus),
        note: statusNote,
      });
      setStatusMsg("Durum güncellendi");
      setNewStatus("");
      setStatusNote("");
      await fetchOrder();
    } catch (err: unknown) {
      setStatusMsg(err instanceof Error ? err.message : "Hata");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleCreateShipment() {
    if (!order) return;
    setCreatingShipment(true);
    try {
      await api.post("/api/admin/shipments", {
        orderId: order.id,
        trackingNumber: shipmentForm.trackingNumber,
        carrier: shipmentForm.carrier,
      });
      setShowShipmentForm(false);
      setShipmentForm({ trackingNumber: "", carrier: "Yurtiçi Kargo" });
      await fetchOrder();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Kargo oluşturulamadı");
    } finally {
      setCreatingShipment(false);
    }
  }

  if (loading) return <div className="text-zinc-400 text-sm">Yükleniyor...</div>;
  if (!order) return (
    <div>
      <Link href="/siparisler" className="text-sm text-zinc-500 hover:text-zinc-800">← Siparişler</Link>
      <p className="mt-4 text-zinc-500">Sipariş bulunamadı.</p>
    </div>
  );

  const allowedNext = ALLOWED_TRANSITIONS[order.status] ?? [];
  let shippingAddr: Record<string, string> = {};
  try { shippingAddr = JSON.parse(order.shippingAddressSnapshot); } catch {}

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/siparisler" className="text-sm text-zinc-500 hover:text-zinc-800">← Siparişler</Link>
          <h1 className="text-2xl font-bold text-zinc-900 mt-1">{order.orderNumber}</h1>
          <p className="text-sm text-zinc-500">{formatDate(order.createdDate)} · {order.customerName} ({order.customerEmail})</p>
        </div>
        <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status] ?? "bg-zinc-100 text-zinc-700"}`}>
          {ORDER_STATUS[order.status] ?? "—"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Items */}
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 font-semibold text-zinc-800">Ürünler</div>
            <div className="divide-y divide-zinc-100">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 text-sm">
                  <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.productName} className="object-contain w-full h-full p-1" /> // eslint-disable-line @next/next/no-img-element
                      : <span>📦</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 truncate">{item.productName}</p>
                    <p className="text-xs text-zinc-400">SKU: {item.sku}{item.variantName ? ` · ${item.variantName}` : ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-zinc-900">{formatPrice(item.lineTotal)}</p>
                    <p className="text-xs text-zinc-400">{formatPrice(item.unitPrice)} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-zinc-100 px-5 py-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-zinc-600"><span>Ara Toplam</span><span>{formatPrice(order.totalProductAmount)}</span></div>
              <div className="flex justify-between text-zinc-600"><span>KDV</span><span>{formatPrice(order.taxAmount)}</span></div>
              <div className="flex justify-between text-zinc-600"><span>Kargo</span><span>{order.shippingAmount === 0 ? "Ücretsiz" : formatPrice(order.shippingAmount)}</span></div>
              <div className="flex justify-between font-bold text-zinc-900 pt-2 border-t border-zinc-100"><span>Toplam</span><span>{formatPrice(order.grandTotal)}</span></div>
            </div>
          </div>

          {/* Status update */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <h2 className="font-semibold text-zinc-800 mb-4">Durum Güncelle</h2>
            {allowedNext.length === 0 ? (
              <p className="text-sm text-zinc-400">Bu durumdan başka duruma geçiş yapılamaz.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value === "" ? "" : Number(e.target.value))}
                    className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  >
                    <option value="">Yeni durum seçin</option>
                    {allowedNext.map((s) => (
                      <option key={s} value={s}>{ORDER_STATUS[s]}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updatingStatus || newStatus === ""}
                    className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition disabled:opacity-50"
                  >
                    {updatingStatus ? "Güncelleniyor..." : "Güncelle"}
                  </button>
                </div>
                <input
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Not (isteğe bağlı)"
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
                {statusMsg && <p className="text-sm text-green-600">{statusMsg}</p>}
              </div>
            )}
          </div>

          {/* Shipment */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-zinc-800">Kargo</h2>
              {order.status === 4 && (
                <button
                  onClick={() => setShowShipmentForm((v) => !v)}
                  className="text-sm text-zinc-600 hover:text-zinc-900 underline"
                >
                  + Kargo Ekle
                </button>
              )}
            </div>
            {order.shipments?.length > 0 ? (
              <div className="space-y-2">
                {order.shipments.map((s) => (
                  <div key={s.id} className="text-sm">
                    <span className="font-medium text-zinc-800">{s.carrier}</span>
                    <span className="mx-2 text-zinc-300">·</span>
                    <span className="text-zinc-600">{s.trackingNumber}</span>
                    <span className="mx-2 text-zinc-300">·</span>
                    <span className="text-zinc-400 text-xs">{formatDate(s.shippedAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">Henüz kargo kaydı yok.</p>
            )}

            {showShipmentForm && (
              <div className="mt-4 pt-4 border-t border-zinc-100 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={shipmentForm.trackingNumber}
                    onChange={(e) => setShipmentForm((f) => ({ ...f, trackingNumber: e.target.value }))}
                    placeholder="Takip numarası"
                    className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  />
                  <input
                    value={shipmentForm.carrier}
                    onChange={(e) => setShipmentForm((f) => ({ ...f, carrier: e.target.value }))}
                    placeholder="Kargo firması"
                    className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  />
                </div>
                <button
                  onClick={handleCreateShipment}
                  disabled={creatingShipment || !shipmentForm.trackingNumber}
                  className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition disabled:opacity-50"
                >
                  {creatingShipment ? "Kaydediliyor..." : "Kargo Kaydını Oluştur"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Order info */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 text-sm space-y-2">
            <h2 className="font-semibold text-zinc-800 mb-3">Sipariş Bilgisi</h2>
            <div className="flex justify-between"><span className="text-zinc-500">Ödeme Durumu</span><span className="font-medium">{PAYMENT_STATUS[order.paymentStatus] ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Ürün Sayısı</span><span className="font-medium">{order.itemCount}</span></div>
          </div>

          {/* Shipping address */}
          {Object.keys(shippingAddr).length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-xl p-5 text-sm">
              <h2 className="font-semibold text-zinc-800 mb-3">Teslimat Adresi</h2>
              <p className="text-zinc-700">{shippingAddr.firstName} {shippingAddr.lastName}</p>
              <p className="text-zinc-500">{shippingAddr.fullAddress}</p>
              <p className="text-zinc-500">{shippingAddr.district}, {shippingAddr.city}</p>
              {shippingAddr.phoneNumber && <p className="text-zinc-500">{shippingAddr.phoneNumber}</p>}
            </div>
          )}

          {/* Status history */}
          {order.statusHistory?.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-xl p-5">
              <h2 className="font-semibold text-zinc-800 mb-3">Durum Geçmişi</h2>
              <div className="space-y-2">
                {order.statusHistory.map((h, i) => (
                  <div key={i} className="text-xs text-zinc-500">
                    <span className="font-medium text-zinc-700">{ORDER_STATUS[h.toStatus] ?? "—"}</span>
                    <span className="mx-1">·</span>
                    <span>{formatDate(h.changedAt)}</span>
                    {h.note && <><span className="mx-1">·</span><span className="text-zinc-400">{h.note}</span></>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
