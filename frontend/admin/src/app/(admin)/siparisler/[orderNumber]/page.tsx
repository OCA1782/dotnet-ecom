"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import type { AdminOrderDetail } from "@/types";
import { ORDER_STATUS, ORDER_STATUS_COLORS, PAYMENT_STATUS } from "@/types";
import {
  ArrowLeft, Package, User, MapPin, CreditCard, Truck,
  FileText, Clock, ChevronRight, AlertCircle, CheckCircle2,
  Phone, Mail, Hash, Tag, ShoppingBag, Receipt,
} from "lucide-react";

const ALLOWED_TRANSITIONS: Record<number, number[]> = {
  1:  [2, 8, 11, 12],
  2:  [3, 8, 11, 12],
  3:  [4, 8, 12],
  4:  [5, 8, 12],
  5:  [6, 12],
  6:  [7, 9],
  7:  [9],
  9:  [10, 7],
  12: [1, 2, 3, 4, 8],
};

const SHIPMENT_STATUS: Record<number, string> = {
  1: "Kargo Yok",
  2: "Hazırlanıyor",
  3: "Kargoda",
  4: "Teslim Edildi",
  5: "İade",
};

const SHIPMENT_STATUS_COLORS: Record<number, string> = {
  1: "bg-slate-100 text-slate-500",
  2: "bg-blue-100 text-blue-700",
  3: "bg-violet-100 text-violet-700",
  4: "bg-emerald-100 text-emerald-700",
  5: "bg-orange-100 text-orange-700",
};

const PAYMENT_STATUS_COLORS: Record<number, string> = {
  1: "bg-yellow-100 text-yellow-700",
  2: "bg-emerald-100 text-emerald-700",
  3: "bg-red-100 text-red-700",
  4: "bg-slate-100 text-slate-500",
  5: "bg-orange-100 text-orange-700",
};

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400";

function Section({ title, icon: Icon, iconColor, children }: {
  title: string; icon: React.ElementType; iconColor: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon size={13} className="text-white" />
        </div>
        <h2 className="font-semibold text-slate-800 text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400 shrink-0 mt-0.5">{label}</span>
      <span className="text-xs font-medium text-slate-800 text-right">{value}</span>
    </div>
  );
}

interface ParsedAddress {
  firstName?: string; lastName?: string; fullAddress?: string;
  district?: string; city?: string; postalCode?: string;
  phoneNumber?: string; addressTitle?: string;
  companyName?: string; taxNumber?: string; taxOffice?: string;
  invoiceType?: number;
}

function AddressBlock({ json, title, icon: Icon }: { json: string; title: string; icon: React.ElementType }) {
  let addr: ParsedAddress = {};
  try { addr = JSON.parse(json); } catch {}
  if (!Object.keys(addr).length) return null;
  return (
    <Section title={title} icon={Icon} iconColor="bg-indigo-500">
      <div className="p-5 space-y-1.5 text-sm">
        {addr.addressTitle && (
          <p className="text-xs font-semibold text-indigo-600 mb-2">{addr.addressTitle}</p>
        )}
        <p className="font-semibold text-slate-800">
          {addr.firstName} {addr.lastName}
          {addr.companyName && <span className="text-slate-500 font-normal"> · {addr.companyName}</span>}
        </p>
        <p className="text-slate-600">{addr.fullAddress}</p>
        <p className="text-slate-500">{addr.district}{addr.city ? `, ${addr.city}` : ""}{addr.postalCode ? ` ${addr.postalCode}` : ""}</p>
        {addr.phoneNumber && (
          <p className="text-slate-500 flex items-center gap-1.5 mt-1">
            <Phone size={11} className="text-slate-400" />{addr.phoneNumber}
          </p>
        )}
        {addr.invoiceType === 2 && addr.taxNumber && (
          <div className="mt-2 pt-2 border-t border-slate-100 space-y-0.5">
            <p className="text-xs text-slate-400">Kurumsal Fatura</p>
            {addr.taxOffice && <p className="text-xs text-slate-600">Vergi Dairesi: {addr.taxOffice}</p>}
            <p className="text-xs text-slate-600">Vergi No: {addr.taxNumber}</p>
          </div>
        )}
      </div>
    </Section>
  );
}

export default function AdminOrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusNote, setStatusNote] = useState("");
  const [newStatus, setNewStatus] = useState<number | "">("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);
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

  useEffect(() => { fetchOrder(); }, [orderNumber]);

  async function handleStatusUpdate() {
    if (!order || newStatus === "") return;
    setUpdatingStatus(true);
    setStatusMsg(null);
    try {
      await api.put(`/api/orders/admin/${order.id}/status`, { status: Number(newStatus), note: statusNote });
      setStatusMsg({ text: `Durum güncellendi: ${ORDER_STATUS[Number(newStatus)]}`, ok: true });
      setNewStatus(""); setStatusNote("");
      await fetchOrder();
    } catch (err: unknown) {
      setStatusMsg({ text: err instanceof Error ? err.message : "Hata", ok: false });
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

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!order) return (
    <div className="space-y-4">
      <Link href="/siparisler" className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
        <ArrowLeft size={14} /> Siparişler
      </Link>
      <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-2xl p-4">
        <AlertCircle size={16} /> Sipariş bulunamadı.
      </div>
    </div>
  );

  const allowedNext = ALLOWED_TRANSITIONS[order.status] ?? [];
  const discountAmount = (order.totalProductAmount + order.shippingAmount) - order.grandTotal + order.taxAmount
    - ((order.totalProductAmount + order.shippingAmount + order.taxAmount) - order.grandTotal);

  return (
    <div className="space-y-5 max-w-6xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/siparisler" className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 mb-2 transition-colors">
            <ArrowLeft size={12} /> Siparişler
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">{order.orderNumber}</h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <Clock size={11} />{formatDate(order.createdDate)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${ORDER_STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-600"}`}>
            {ORDER_STATUS[order.status] ?? "—"}
          </span>
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${PAYMENT_STATUS_COLORS[order.paymentStatus] ?? "bg-slate-100 text-slate-500"}`}>
            {PAYMENT_STATUS[order.paymentStatus] ?? "—"}
          </span>
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${SHIPMENT_STATUS_COLORS[order.shipmentStatus] ?? "bg-slate-100 text-slate-500"}`}>
            {SHIPMENT_STATUS[order.shipmentStatus] ?? "Kargo Yok"}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Sol kolon ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Ürünler */}
          <Section title="Ürünler" icon={ShoppingBag} iconColor="bg-teal-500">
            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 px-5 py-4">
                  <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.productName} className="object-contain w-full h-full p-1" /> // eslint-disable-line @next/next/no-img-element
                      : <Package size={22} className="text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm leading-snug">{item.productName}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Hash size={9} />{item.sku}</span>
                      {item.variantName && (
                        <span className="text-xs text-slate-400 flex items-center gap-1"><Tag size={9} />{item.variantName}</span>
                      )}
                      <span className="text-xs text-slate-400">KDV: %{item.taxRate}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="font-bold text-slate-900 text-sm">{formatPrice(item.lineTotal)}</p>
                    <p className="text-xs text-slate-400">{formatPrice(item.unitPrice)} × {item.quantity}</p>
                    <p className="text-xs text-slate-300">KDV: {formatPrice(item.taxAmount)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Özet */}
            <div className="border-t border-slate-100 px-5 py-4 space-y-2 bg-slate-50/40">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Ürün Toplamı</span><span>{formatPrice(order.totalProductAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>KDV</span><span>{formatPrice(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Kargo</span>
                <span>{order.shippingAmount === 0 ? <span className="text-emerald-600 font-semibold">Ücretsiz</span> : formatPrice(order.shippingAmount)}</span>
              </div>
              {order.grandTotal < (order.totalProductAmount + order.shippingAmount + order.taxAmount) && (
                <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                  <span>İndirim</span>
                  <span>− {formatPrice((order.totalProductAmount + order.shippingAmount + order.taxAmount) - order.grandTotal)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-slate-900 text-sm pt-2 border-t border-slate-200">
                <span>Genel Toplam</span><span>{formatPrice(order.grandTotal)}</span>
              </div>
            </div>
          </Section>

          {/* Müşteri notu */}
          {order.note && (
            <Section title="Sipariş Notu" icon={FileText} iconColor="bg-amber-500">
              <p className="px-5 py-4 text-sm text-slate-700 italic">"{order.note}"</p>
            </Section>
          )}

          {/* Durum güncelle */}
          <Section title="Durum Güncelle" icon={CheckCircle2} iconColor="bg-indigo-500">
            <div className="p-5">
              {allowedNext.length === 0 ? (
                <p className="text-sm text-slate-400 flex items-center gap-2">
                  <AlertCircle size={14} className="text-slate-300" />
                  Bu durumdan başka duruma geçiş yapılamaz.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <select value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value === "" ? "" : Number(e.target.value))}
                      className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                      <option value="">Yeni durum seçin</option>
                      {allowedNext.map((s) => (
                        <option key={s} value={s}>{ORDER_STATUS[s]}</option>
                      ))}
                    </select>
                    <button onClick={handleStatusUpdate}
                      disabled={updatingStatus || newStatus === ""}
                      className="px-5 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition disabled:opacity-40 font-semibold">
                      {updatingStatus ? "Güncelleniyor..." : "Güncelle"}
                    </button>
                  </div>
                  <input value={statusNote} onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Not (isteğe bağlı)" className={INPUT} />
                  {statusMsg && (
                    <p className={`text-xs px-3 py-2 rounded-lg ${statusMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {statusMsg.text}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Section>

          {/* Kargo */}
          <Section title="Kargo Bilgileri" icon={Truck} iconColor="bg-purple-500">
            <div className="p-5 space-y-3">
              {order.shipments?.length > 0 ? (
                order.shipments.map((s) => (
                  <div key={s.id} className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-purple-800">{s.carrier}</p>
                      <p className="text-xs text-purple-600 font-mono mt-0.5">{s.trackingNumber}</p>
                    </div>
                    <p className="text-xs text-purple-400 shrink-0">{formatDate(s.shippedAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">Henüz kargo kaydı yok.</p>
              )}

              {order.status === 4 && (
                <button onClick={() => setShowShipmentForm((v) => !v)}
                  className="text-sm text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1 transition-colors">
                  + Kargo Ekle
                </button>
              )}

              {showShipmentForm && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input value={shipmentForm.trackingNumber}
                      onChange={(e) => setShipmentForm((f) => ({ ...f, trackingNumber: e.target.value }))}
                      placeholder="Takip numarası" className={INPUT} />
                    <input value={shipmentForm.carrier}
                      onChange={(e) => setShipmentForm((f) => ({ ...f, carrier: e.target.value }))}
                      placeholder="Kargo firması" className={INPUT} />
                  </div>
                  <button onClick={handleCreateShipment}
                    disabled={creatingShipment || !shipmentForm.trackingNumber}
                    className="px-5 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition disabled:opacity-40 font-semibold">
                    {creatingShipment ? "Kaydediliyor..." : "Kargo Kaydını Oluştur"}
                  </button>
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* ── Sağ kolon ── */}
        <div className="space-y-5">

          {/* Müşteri */}
          <Section title="Müşteri" icon={User} iconColor="bg-violet-500">
            <div className="p-5 space-y-2">
              <p className="font-semibold text-slate-800 text-sm">{order.customerName}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Mail size={11} className="text-slate-400" />{order.customerEmail}
              </p>
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <InfoRow label="Sipariş No" value={<span className="font-mono text-teal-700">{order.orderNumber}</span>} />
                <InfoRow label="Sipariş Tarihi" value={formatDate(order.createdDate)} />
                <InfoRow label="Ürün Sayısı" value={`${order.itemCount} kalem`} />
              </div>
            </div>
          </Section>

          {/* Ödeme */}
          <Section title="Ödeme Bilgisi" icon={CreditCard} iconColor="bg-emerald-500">
            <div className="p-5 space-y-1.5">
              <InfoRow label="Ödeme Durumu" value={
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PAYMENT_STATUS_COLORS[order.paymentStatus] ?? ""}`}>
                  {PAYMENT_STATUS[order.paymentStatus] ?? "—"}
                </span>
              } />
              <InfoRow label="Sipariş Durumu" value={
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ORDER_STATUS_COLORS[order.status] ?? ""}`}>
                  {ORDER_STATUS[order.status] ?? "—"}
                </span>
              } />
              <InfoRow label="Kargo Durumu" value={
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SHIPMENT_STATUS_COLORS[order.shipmentStatus] ?? ""}`}>
                  {SHIPMENT_STATUS[order.shipmentStatus] ?? "—"}
                </span>
              } />
              <div className="pt-2 border-t border-slate-100 mt-2">
                <InfoRow label="Ürün Toplamı" value={formatPrice(order.totalProductAmount)} />
                <InfoRow label="KDV" value={formatPrice(order.taxAmount)} />
                <InfoRow label="Kargo" value={order.shippingAmount === 0 ? "Ücretsiz" : formatPrice(order.shippingAmount)} />
                {order.grandTotal < (order.totalProductAmount + order.shippingAmount + order.taxAmount) && (
                  <InfoRow label="İndirim" value={
                    <span className="text-emerald-600">− {formatPrice((order.totalProductAmount + order.shippingAmount + order.taxAmount) - order.grandTotal)}</span>
                  } />
                )}
                <InfoRow label="Genel Toplam" value={<span className="font-extrabold text-slate-900 text-sm">{formatPrice(order.grandTotal)}</span>} />
              </div>
            </div>
          </Section>

          {/* Teslimat adresi */}
          {order.shippingAddressSnapshot && (
            <AddressBlock json={order.shippingAddressSnapshot} title="Teslimat Adresi" icon={MapPin} />
          )}

          {/* Fatura adresi — yalnızca teslimat farklıysa */}
          {order.billingAddressSnapshot && order.billingAddressSnapshot !== order.shippingAddressSnapshot && (
            <AddressBlock json={order.billingAddressSnapshot} title="Fatura Adresi" icon={Receipt} />
          )}

          {/* Durum geçmişi */}
          {order.statusHistory?.length > 0 && (
            <Section title="Durum Geçmişi" icon={Clock} iconColor="bg-slate-500">
              <div className="p-5">
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-100" />
                  <div className="space-y-4 pl-8">
                    {[...order.statusHistory].reverse().map((h, i) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-5 top-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-slate-300 ring-1 ring-slate-200" />
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {h.fromStatus > 0 && (
                            <>
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ORDER_STATUS_COLORS[h.fromStatus] ?? "bg-slate-100 text-slate-500"}`}>
                                {ORDER_STATUS[h.fromStatus] ?? "—"}
                              </span>
                              <ChevronRight size={10} className="text-slate-300" />
                            </>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ORDER_STATUS_COLORS[h.toStatus] ?? "bg-slate-100 text-slate-500"}`}>
                            {ORDER_STATUS[h.toStatus] ?? "—"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(h.changedAt)}</p>
                        {h.note && <p className="text-xs text-slate-500 italic mt-0.5">"{h.note}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
