"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";
import { orderStatusStyle } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function parseAddr(snapshot: string): Record<string, string> {
  try {
    const raw = JSON.parse(snapshot) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k.charAt(0).toLowerCase() + k.slice(1), String(v ?? "")])
    );
  } catch { return {}; }
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: number;
  paymentStatus: number;
  shipmentStatus: number;
  grandTotal: number;
  shippingAmount: number;
  discountAmount: number;
  taxAmount: number;
  createdDate: string;
  shippingAddressSnapshot: string;
  items: {
    productName: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    imageUrl?: string;
  }[];
  shipments: {
    carrier: string;
    trackingNumber?: string;
    trackingUrl?: string;
    shippedAt?: string;
    deliveredAt?: string;
  }[];
}

export default function SiparisSorgulaPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState("");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOrder(null);
    if (!orderNumber.trim() || !email.trim()) {
      setError("Sipariş numarası ve e-posta zorunludur.");
      return;
    }
    setLoading(true);
    try {
      const qs = new URLSearchParams({ orderNumber: orderNumber.trim(), email: email.trim() });
      const res = await fetch(`${API_BASE}/api/orders/track?${qs}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Sipariş bulunamadı.");
        return;
      }
      const data: OrderDetail = await res.json();
      setOrder(data);
    } catch {
      setError("Bir hata oluştu, lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  const inp = "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white";

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sipariş Sorgula</h1>
        <p className="text-sm text-slate-500 mt-1">
          Misafir olarak verdiğiniz siparişi sipariş numaranız ve e-postanızla sorgulayabilirsiniz.
        </p>
      </div>

      <form onSubmit={search} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Sipariş Numarası</label>
          <input
            value={orderNumber}
            onChange={e => setOrderNumber(e.target.value)}
            placeholder="örn: ORD-20240101-001"
            className={inp}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">E-posta Adresi</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="sipariş verirken kullandığınız e-posta"
            className={inp}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition disabled:opacity-50 text-sm"
        >
          {loading ? "Sorgulanıyor..." : "Sorgula"}
        </button>
      </form>

      {order && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">Sipariş No</p>
                <p className="font-bold text-slate-900 text-lg">{order.orderNumber}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.createdDate)}</p>
              </div>
              {(() => { const st = orderStatusStyle(order.status); return (
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${st.cls}`}>{st.label}</span>
              );})()}
            </div>

            {/* Items */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.productName} className="w-12 h-12 rounded-xl object-cover border border-slate-100" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.productName}</p>
                    {item.variantName && <p className="text-xs text-slate-500">{item.variantName}</p>}
                    <p className="text-xs text-slate-400">×{item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 shrink-0">{formatPrice(item.lineTotal)}</p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-slate-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Kargo</span>
                <span>{order.shippingAmount === 0 ? "Ücretsiz" : formatPrice(order.shippingAmount)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>İndirim</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 text-base border-t border-slate-200 pt-2 mt-1">
                <span>Toplam</span>
                <span>{formatPrice(order.grandTotal)}</span>
              </div>
            </div>

            {/* Shipping address */}
            {order.shippingAddressSnapshot && (() => {
              const addr = parseAddr(order.shippingAddressSnapshot);
              if (!addr.firstName && !addr.fullAddress) return null;
              return (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Teslimat Adresi</p>
                  <p className="text-sm text-slate-700">{addr.firstName} {addr.lastName}</p>
                  <p className="text-xs text-slate-500">{addr.fullAddress}</p>
                  <p className="text-xs text-slate-500">{addr.district}, {addr.city}</p>
                </div>
              );
            })()}

            {/* Shipment */}
            {order.shipments.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold text-slate-500 mb-1">Kargo Bilgisi</p>
                {order.shipments.map((s, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-sm text-slate-700">{s.carrier} — {s.trackingNumber ?? "Takip numarası bekleniyor"}</p>
                    {s.trackingUrl && s.trackingNumber && (
                      <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-teal-600 underline">Kargo takip et →</a>
                    )}
                    {s.shippedAt && <p className="text-xs text-slate-400">Kargoya verildi: {formatDate(s.shippedAt)}</p>}
                    {s.deliveredAt && <p className="text-xs text-slate-400">Teslim edildi: {formatDate(s.deliveredAt)}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-center text-sm text-slate-500">
            Daha kolay takip için{" "}
            <Link href="/kayit" className="text-teal-600 underline font-medium">üye olun</Link>
            {" "}veya{" "}
            <Link href="/giris" className="text-teal-600 underline font-medium">giriş yapın</Link>.
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        Üye hesabınız varsa{" "}
        <Link href="/hesabim/siparisler" className="text-teal-600 underline">hesabınızdan</Link>{" "}
        siparişlerinizi görebilirsiniz.
      </p>
    </div>
  );
}
