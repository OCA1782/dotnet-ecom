"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, formatDate } from "@/lib/utils";
import type { OrderDetail, Address } from "@/types";
import { orderStatusStyle, paymentStatusStyle } from "@/types";
import { useI18n } from "@/contexts/I18nContext";
import Image from "next/image";

// ─── Progress stepper ─────────────────────────────────────────────────────────
function OrderStepper({ status }: { status: number }) {
  const { t } = useI18n();
  const nl = (key: string) => t(key).replace(/\\n/g, "\n");
  const STEPS = [
    { label: nl("orders.step.received"),  minStatus: 1 },
    { label: nl("orders.step.payment"),   minStatus: 3 },
    { label: nl("orders.step.preparing"), minStatus: 4 },
    { label: nl("orders.step.shipped"),   minStatus: 5 },
    { label: nl("orders.step.delivered"), minStatus: 6 },
  ];

  if (status === 8 || status === 11)
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <span className="text-red-500">✕</span>
        <span className="text-sm font-medium text-red-700">
          {status === 8 ? t("orders.status.cancelled") : t("orders.status.failed")}
        </span>
      </div>
    );
  if (status === 9 || status === 10)
    return (
      <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
        <span className="text-orange-500">↩</span>
        <span className="text-sm font-medium text-orange-700">
          {status === 9 ? t("orders.status.refund_pending") : t("orders.status.refund_done")}
        </span>
      </div>
    );
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 overflow-x-auto">
      <div className="flex items-center min-w-[420px]">
        {STEPS.map((step, i) => {
          const active = status >= step.minStatus;
          return (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  active ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  {active ? "✓" : i + 1}
                </div>
                <span className={`text-[10px] text-center leading-tight whitespace-pre-line ${
                  active ? "text-teal-700 font-semibold" : "text-slate-400"
                }`}>{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-4 ${status > step.minStatus ? "bg-teal-500" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Address block ────────────────────────────────────────────────────────────
function parseAddr(snapshot: string): Record<string, string> {
  try {
    const raw = JSON.parse(snapshot) as Record<string, unknown>;
    // Normalize to camelCase — handles both legacy PascalCase DB rows and new camelCase
    return Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k.charAt(0).toLowerCase() + k.slice(1), String(v ?? "")])
    );
  } catch { return {}; }
}

function AddressBlock({ snapshot, title, icon }: { snapshot: string; title: string; icon: string }) {
  const addr = parseAddr(snapshot);
  if (!addr.firstName && !addr.fullAddress) return null;
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base leading-none">{icon}</span>
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{title}</span>
      </div>
      <p className="text-sm font-semibold text-slate-900 leading-snug">{addr.firstName} {addr.lastName}</p>
      {addr.companyName && <p className="text-xs text-slate-500 mt-0.5">{addr.companyName}</p>}
      <p className="text-sm text-slate-600 mt-1 leading-relaxed">{addr.fullAddress}</p>
      <p className="text-xs text-slate-500 mt-0.5">
        {[addr.neighborhood, addr.district, addr.city].filter(Boolean).join(" / ")}
        {addr.postalCode ? <span className="text-slate-400"> · {addr.postalCode}</span> : null}
      </p>
      {addr.phoneNumber && (
        <p className="text-xs text-slate-400 mt-2 border-t border-slate-200 pt-2">{addr.phoneNumber}</p>
      )}
    </div>
  );
}

function hasAddress(snapshot: string | undefined | null): boolean {
  if (!snapshot) return false;
  const a = parseAddr(snapshot);
  return !!(a.firstName || a.fullAddress);
}

// ─── Address modal ────────────────────────────────────────────────────────────
const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400";

interface AddrForm {
  firstName: string; lastName: string; phone: string;
  city: string; district: string; fullAddress: string; postalCode: string;
}
const emptyForm: AddrForm = {
  firstName: "", lastName: "", phone: "", city: "", district: "", fullAddress: "", postalCode: "",
};

interface AddressPickerProps {
  title: string;
  addresses: Address[];
  selected: string;
  onSelect: (id: string) => void;
  tab: "list" | "new";
  onTabChange: (t: "list" | "new") => void;
  form: AddrForm;
  onFormChange: (field: keyof AddrForm, val: string) => void;
}

function AddressPicker({ title, addresses, selected, onSelect, tab, onTabChange, form, onFormChange }: AddressPickerProps) {
  const { t } = useI18n();
  return (
    <div>
      <p className="text-xs font-semibold text-slate-700 mb-2">{title}</p>
      {addresses.length > 0 && (
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-3">
          {(["list", "new"] as const).map((tabKey) => (
            <button key={tabKey} onClick={() => onTabChange(tabKey)}
              className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition ${
                tab === tabKey ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              {tabKey === "list" ? t("orders.addr_modal.saved_tab") : t("orders.addr_modal.new_tab")}
            </button>
          ))}
        </div>
      )}
      {tab === "list" ? (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {addresses.map((a) => (
            <label key={a.id}
              className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition ${
                selected === a.id ? "border-teal-400 bg-teal-50" : "border-slate-200 hover:border-slate-300"
              }`}>
              <input type="radio" className="mt-0.5 accent-teal-600" name={`addr-${title}`}
                checked={selected === a.id} onChange={() => onSelect(a.id)} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800">{a.addressTitle}</p>
                <p className="text-xs text-slate-600">{a.firstName} {a.lastName}</p>
                <p className="text-xs text-slate-500 truncate">{a.fullAddress}, {a.district} / {a.city}</p>
                <p className="text-xs text-slate-400">{a.phoneNumber}</p>
              </div>
              {a.isDefaultShipping && (
                <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full self-start shrink-0">
                  {t("orders.addr_modal.default_badge")}
                </span>
              )}
            </label>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">{t("orders.addr_form.name")}</label>
              <input className={INPUT} value={form.firstName} onChange={(e) => onFormChange("firstName", e.target.value)} placeholder="Adınız" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">{t("orders.addr_form.surname")}</label>
              <input className={INPUT} value={form.lastName} onChange={(e) => onFormChange("lastName", e.target.value)} placeholder="Soyadınız" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">{t("orders.addr_form.phone")}</label>
            <input className={INPUT} value={form.phone} onChange={(e) => onFormChange("phone", e.target.value)} placeholder="05XX XXX XX XX" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">{t("orders.addr_form.city")}</label>
              <input className={INPUT} value={form.city} onChange={(e) => onFormChange("city", e.target.value)} placeholder="İstanbul" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">{t("orders.addr_form.district")}</label>
              <input className={INPUT} value={form.district} onChange={(e) => onFormChange("district", e.target.value)} placeholder="Kadıköy" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">{t("orders.addr_form.full_address")}</label>
            <textarea className={INPUT} rows={2} value={form.fullAddress}
              onChange={(e) => onFormChange("fullAddress", e.target.value)}
              placeholder="Mahalle, sokak, bina no, daire no..." />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">{t("orders.addr_form.postal_code")}</label>
            <input className={INPUT} value={form.postalCode} onChange={(e) => onFormChange("postalCode", e.target.value)} placeholder="34710" />
          </div>
        </div>
      )}
    </div>
  );
}

interface AddressModalProps {
  orderId: string;
  onSaved: () => void;
  onClose: () => void;
}

function AddressModal({ orderId, onSaved, onClose }: AddressModalProps) {
  const { t } = useI18n();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddrs, setLoadingAddrs] = useState(true);

  // Shipping
  const [shipTab, setShipTab]       = useState<"list" | "new">("list");
  const [shipSelected, setShipSelected] = useState<string>("");
  const [shipForm, setShipForm]     = useState<AddrForm>(emptyForm);

  // Billing
  const [diffBilling, setDiffBilling] = useState(false);
  const [billTab, setBillTab]         = useState<"list" | "new">("list");
  const [billSelected, setBillSelected] = useState<string>("");
  const [billForm, setBillForm]       = useState<AddrForm>(emptyForm);

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    api.get<Address[]>("/api/addresses")
      .then((data) => {
        setAddresses(data);
        const def = data.find((a) => a.isDefaultShipping) ?? data[0];
        if (def) { setShipSelected(def.id); setBillSelected(def.id); }
        if (!def) setShipTab("new");
      })
      .catch(() => setShipTab("new"))
      .finally(() => setLoadingAddrs(false));
  }, []);

  function setShipF(f: keyof AddrForm, v: string) { setShipForm((p) => ({ ...p, [f]: v })); }
  function setBillF(f: keyof AddrForm, v: string) { setBillForm((p) => ({ ...p, [f]: v })); }

  async function save() {
    setError("");

    if (shipTab === "list" && !shipSelected) { setError(t("orders.addr_modal.err_ship_select")); return; }
    if (shipTab === "new") {
      const { firstName, lastName, phone, city, district, fullAddress } = shipForm;
      if (!firstName || !lastName || !phone || !city || !district || !fullAddress) {
        setError(t("orders.addr_modal.err_ship_fill")); return;
      }
    }

    if (diffBilling) {
      if (billTab === "list" && !billSelected) { setError(t("orders.addr_modal.err_bill_select")); return; }
      if (billTab === "new") {
        const { firstName, lastName, phone, city, district, fullAddress } = billForm;
        if (!firstName || !lastName || !phone || !city || !district || !fullAddress) {
          setError(t("orders.addr_modal.err_bill_fill")); return;
        }
      }
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {};

      if (shipTab === "list") {
        body.shippingAddressId = shipSelected;
      } else {
        body.firstName    = shipForm.firstName;
        body.lastName     = shipForm.lastName;
        body.phone        = shipForm.phone;
        body.city         = shipForm.city;
        body.district     = shipForm.district;
        body.fullAddress  = shipForm.fullAddress;
        body.postalCode   = shipForm.postalCode || null;
      }

      if (diffBilling) {
        if (billTab === "list") {
          body.billingAddressId = billSelected;
        } else {
          body.billingFirstName   = billForm.firstName;
          body.billingLastName    = billForm.lastName;
          body.billingPhone       = billForm.phone;
          body.billingCity        = billForm.city;
          body.billingDistrict    = billForm.district;
          body.billingFullAddress = billForm.fullAddress;
          body.billingPostalCode  = billForm.postalCode || null;
        }
      }

      await api.patch(`/api/orders/${orderId}/address`, body);
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("orders.addr_modal.err_save"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-base font-semibold text-slate-900">{t("orders.addr_modal.title")}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">&times;</button>
        </div>

        {error && (
          <div className="px-5 pt-4">
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          </div>
        )}

        <div className="p-5 space-y-5">
          {loadingAddrs ? (
            <p className="text-sm text-slate-400 text-center py-6">{t("orders.addr_modal.loading")}</p>
          ) : (
            <>
              <AddressPicker
                title={t("orders.addr_modal.ship_title")}
                addresses={addresses}
                selected={shipSelected}
                onSelect={setShipSelected}
                tab={shipTab}
                onTabChange={setShipTab}
                form={shipForm}
                onFormChange={setShipF}
              />

              <div className="border-t border-slate-100 pt-4">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" className="w-4 h-4 accent-teal-600 rounded"
                    checked={diffBilling} onChange={(e) => setDiffBilling(e.target.checked)} />
                  <span className="text-sm text-slate-700">{t("orders.addr_modal.diff_billing")}</span>
                </label>

                {diffBilling && (
                  <div className="mt-4">
                    <AddressPicker
                      title={t("orders.addr_modal.bill_title")}
                      addresses={addresses}
                      selected={billSelected}
                      onSelect={setBillSelected}
                      tab={billTab}
                      onTabChange={setBillTab}
                      form={billForm}
                      onFormChange={setBillF}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-100 sticky bottom-0 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition">
            {t("orders.addr_modal.cancel")}
          </button>
          <button onClick={save} disabled={saving || loadingAddrs}
            className="px-5 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition disabled:opacity-60">
            {saving ? t("orders.addr_modal.saving") : t("orders.addr_modal.save_btn")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cancel confirmation modal ────────────────────────────────────────────────
interface CancelModalProps {
  onConfirm: (reason: string) => void;
  onClose: () => void;
  loading: boolean;
  error?: string;
}

function CancelModal({ onConfirm, onClose, loading, error }: CancelModalProps) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <span className="text-base leading-none">✕</span>
            </div>
            <h2 className="text-base font-semibold text-slate-900">{t("orders.cancel.title")}</h2>
          </div>
          <button onClick={onClose} disabled={loading}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none disabled:opacity-40">&times;</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-sm text-red-800 font-medium">{t("orders.cancel.confirm")}</p>
            <p className="text-xs text-red-600 mt-0.5">{t("orders.cancel.irreversible")}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">
              {t("orders.cancel.reason_label")} <span className="text-slate-400 font-normal">{t("orders.cancel.reason_optional")}</span>
            </label>
            <textarea
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              rows={3}
              placeholder={t("orders.cancel.reason_placeholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div className="px-5 pb-3">
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition disabled:opacity-40">
            {t("orders.cancel.cancel")}
          </button>
          <button onClick={() => onConfirm(reason)} disabled={loading}
            className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition disabled:opacity-60">
            {loading ? t("orders.detail.cancelling") : t("orders.cancel.yes")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Payment helper ───────────────────────────────────────────────────────────
interface PaymentResult {
  transactionId: string;
  requiresRedirect: boolean;
  redirectUrl?: string;
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder]         = useState<OrderDetail | null>(null);
  const [loading, setLoading]     = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [paying, setPaying]       = useState(false);
  const [payError, setPayError]   = useState("");
  const [showAddr, setShowAddr]   = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/giris");
  }, [authLoading, user, router]);

  const loadOrder = useCallback(() => {
    if (!user) return;
    setLoading(true);
    api.get<OrderDetail>(`/api/orders/${orderNumber}`)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [user, orderNumber]);

  useEffect(() => { window.setTimeout(() => loadOrder(), 0); }, [loadOrder]);

  async function cancelOrder(reason: string) {
    if (!order) return;
    setCancelling(true);
    setCancelError("");
    try {
      await api.post(`/api/orders/${order.id}/cancel`, { reason: reason || "Müşteri talebi" });
      setShowCancel(false);
      loadOrder();
    } catch (e: unknown) {
      setCancelError(e instanceof Error ? e.message : t("orders.cancel.fail"));
    } finally { setCancelling(false); }
  }

  async function continuePayment() {
    if (!order) return;
    setPayError("");
    setPaying(true);
    try {
      const payment = await api.post<PaymentResult>("/api/payments/initiate", {
        orderId: order.id,
        method: "CreditCard",
      });
      if (payment.requiresRedirect && payment.redirectUrl) {
        window.location.href = payment.redirectUrl;
        return;
      }
      await api.post("/api/payments/callback", {
        transactionId: payment.transactionId,
        payload: JSON.stringify({ success: true }),
        isSuccess: true,
      });
      loadOrder();
    } catch (e: unknown) {
      setPayError(e instanceof Error ? e.message : "Ödeme başlatılamadı. Lütfen tekrar deneyin.");
    } finally {
      setPaying(false);
    }
  }

  async function requestRefund() {
    if (!order) return;
    setRefunding(true);
    setRefundError("");
    try {
      await api.post(`/api/orders/${order.orderNumber}/request-refund`, { reason: refundReason || undefined });
      setShowRefund(false);
      setRefundReason("");
      loadOrder();
    } catch (e: unknown) {
      setRefundError(e instanceof Error ? e.message : t("orders.refund.fail"));
    } finally { setRefunding(false); }
  }

  if (authLoading || loading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">{t("orders.loading")}</div>;
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500 mb-4">{t("orders.detail.not_found")}</p>
        <Link href="/hesabim/siparisler" className="text-sm text-teal-700 underline">{t("orders.detail.back_list")}</Link>
      </div>
    );
  }

  const st          = orderStatusStyle(order.status);
  const ps          = paymentStatusStyle(order.paymentStatus);
  const isPending   = order.status === 1 || order.status === 2;
  const canCancel   = [1, 2].includes(order.status);
  const canRefund   = [6, 7].includes(order.status);
  const shipment    = order.shipments?.[0];
  const addrOk      = hasAddress(order.shippingAddressSnapshot);
  const billingDiff = order.billingAddressSnapshot && order.billingAddressSnapshot !== order.shippingAddressSnapshot;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-5">

      {showAddr && (
        <AddressModal
          orderId={order.id}
          onSaved={() => { setShowAddr(false); loadOrder(); }}
          onClose={() => setShowAddr(false)}
        />
      )}

      {showCancel && (
        <CancelModal
          onConfirm={cancelOrder}
          onClose={() => { setShowCancel(false); setCancelError(""); }}
          loading={cancelling}
          error={cancelError}
        />
      )}

      {showRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">{t("orders.refund.title")}</h3>
              <button onClick={() => { setShowRefund(false); setRefundReason(""); setRefundError(""); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition text-lg leading-none">×</button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-slate-600">
                <strong>{order.orderNumber}</strong> {t("orders.refund.desc_prefix")}
              </p>
              <div>
                <label className="block text-xs text-slate-500 mb-1">{t("orders.refund.reason_label")}</label>
                <textarea
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  rows={3}
                  placeholder={t("orders.refund.reason_placeholder")}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
              </div>
              {refundError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{refundError}</p>
              )}
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => { setShowRefund(false); setRefundReason(""); setRefundError(""); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 font-medium hover:bg-slate-50 transition">
                {t("orders.refund.cancel")}
              </button>
              <button onClick={requestRefund} disabled={refunding}
                className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition disabled:opacity-50">
                {refunding ? t("orders.refund.submitting") : t("orders.refund.submit_btn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <Link href="/hesabim/siparisler" className="text-sm text-slate-400 hover:text-slate-700 transition">
          {t("orders.detail.back")}
        </Link>
        <div className="flex items-start justify-between mt-2 gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{order.orderNumber}</h1>
            <p className="text-sm text-slate-500">{formatDate(order.createdDate)}</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${st.cls}`}>{st.label}</span>
            <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${ps.cls}`}>{ps.label}</span>
          </div>
        </div>
      </div>

      {/* Address missing warning */}
      {isPending && !addrOk && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl shrink-0">📍</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-900">{t("orders.detail.addr_missing_title")}</p>
            <p className="text-xs text-orange-700 mt-0.5">{t("orders.detail.addr_missing_desc")}</p>
          </div>
          <button onClick={() => setShowAddr(true)}
            className="shrink-0 bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-orange-600 transition">
            {t("orders.detail.addr_add_btn")}
          </button>
        </div>
      )}

      {/* Payment CTA */}
      {isPending && addrOk && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">{t("orders.detail.pay_title")}</p>
              <p className="text-xs text-amber-700 mt-0.5">{t("orders.detail.pay_desc")}</p>
              {payError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 mt-2">{payError}</p>
              )}
            </div>
            <button onClick={continuePayment} disabled={paying}
              className="shrink-0 bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-amber-600 transition disabled:opacity-60 whitespace-nowrap">
              {paying ? t("orders.detail.paying") : t("orders.detail.pay_btn")}
            </button>
          </div>
        </div>
      )}

      {/* Progress stepper */}
      <OrderStepper status={order.status} />

      {/* Address section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">{t("orders.detail.addr_title")}</h2>
          {isPending && addrOk && (
            <button onClick={() => setShowAddr(true)}
              className="text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1 rounded-lg transition">
              {t("orders.detail.addr_edit")}
            </button>
          )}
        </div>
        {addrOk ? (
          <div className={`p-4 grid gap-3 ${billingDiff ? "grid-cols-1 sm:grid-cols-2" : ""}`}>
            <AddressBlock snapshot={order.shippingAddressSnapshot} title={t("orders.detail.ship_addr")} icon="📍" />
            {billingDiff && (
              <AddressBlock snapshot={order.billingAddressSnapshot!} title={t("orders.detail.bill_addr")} icon="🧾" />
            )}
          </div>
        ) : (
          <div className="py-8 px-5 flex flex-col items-center gap-3 text-center">
            <div className="w-11 h-11 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center">
              <span className="text-xl leading-none">📍</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">{t("orders.detail.addr_none")}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t("orders.detail.addr_none_desc")}</p>
            </div>
            {isPending && (
              <button onClick={() => setShowAddr(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition">
                {t("orders.detail.addr_add_btn")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">
            {t("orders.detail.items_title").replace("{n}", String(order.items.length))}
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3 p-4">
              <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                {item.imageUrl
                  ? <Image src={item.imageUrl} alt={item.productName} width={56} height={56} className="w-full h-full object-contain p-1" />
                  : <span className="text-xl">📦</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 leading-snug">{item.productName}</p>
                {item.variantName && <p className="text-xs text-slate-500">{item.variantName}</p>}
                <p className="text-xs text-slate-400 mt-0.5">SKU: {item.sku}</p>
              </div>
              <div className="text-right text-sm shrink-0">
                <p className="font-semibold text-slate-900">{formatPrice(item.lineTotal)}</p>
                <p className="text-xs text-slate-400">{formatPrice(item.unitPrice)} × {item.quantity}</p>
                {item.taxRate > 0 && (
                  <p className="text-xs text-slate-400">
                    {t("orders.detail.tax_rate").replace("{n}", String(Math.round(item.taxRate * 100)))}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 space-y-1.5">
          <div className="flex justify-between text-sm text-slate-600">
            <span>{t("orders.detail.subtotal")}</span><span>{formatPrice(order.totalProductAmount)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-emerald-700">
              <span>{t("orders.detail.discount")}</span><span>−{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-slate-600">
            <span>{t("orders.detail.tax")}</span><span>{formatPrice(order.taxAmount)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>{t("orders.detail.shipping")}</span>
            <span>{order.shippingAmount === 0
              ? <span className="text-emerald-600 font-medium">{t("orders.detail.shipping_free")}</span>
              : formatPrice(order.shippingAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-base">
            <span>{t("orders.detail.grand_total")}</span><span>{formatPrice(order.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Order note */}
      {order.note && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t("orders.detail.note_title")}</h3>
          <p className="text-sm text-slate-700">{order.note}</p>
        </div>
      )}

      {/* Shipment */}
      {shipment && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <span>🚚</span>
            <h2 className="text-sm font-semibold text-slate-800">{t("orders.detail.shipment_title")}</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">{shipment.carrier}</span>
                {shipment.shippedAt && <span className="text-xs text-slate-400">{formatDate(shipment.shippedAt)}</span>}
              </div>
              {shipment.deliveredAt && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  {t("orders.detail.delivered_at")} {formatDate(shipment.deliveredAt)}
                </span>
              )}
            </div>
            {shipment.trackingNumber && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500">{t("orders.detail.tracking_no")}</span>
                <code className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                  {shipment.trackingNumber}
                </code>
                {shipment.trackingUrl && (
                  <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-teal-600 hover:text-teal-800 font-medium underline">
                    {t("orders.detail.track_link")}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status history */}
      {order.statusHistory?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">{t("orders.detail.history_title")}</h2>
          <div className="relative pl-5 space-y-4">
            <div className="absolute left-1.5 top-2 bottom-2 w-px bg-slate-200" />
            {order.statusHistory.map((h, i) => {
              const toSt = orderStatusStyle(h.toStatus);
              return (
                <div key={i} className="relative flex gap-3 items-start">
                  <div className={`absolute -left-[15px] w-2.5 h-2.5 rounded-full border-2 border-white mt-1 ${
                    i === 0 ? "bg-teal-500" : "bg-slate-300"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${toSt.cls}`}>
                        {toSt.label}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(h.changedAt)}</span>
                    </div>
                    {h.note && <p className="text-xs text-slate-500 mt-0.5">{h.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      {(canCancel || canRefund) && (
        <div className="flex justify-end gap-3 pt-2">
          {canRefund && (
            <button onClick={() => setShowRefund(true)}
              className="px-5 py-2.5 border border-orange-300 text-orange-600 text-sm rounded-xl hover:bg-orange-50 transition">
              {t("orders.detail.refund_btn")}
            </button>
          )}
          {canCancel && (
            <button onClick={() => setShowCancel(true)} disabled={cancelling}
              className="px-5 py-2.5 border border-red-300 text-red-600 text-sm rounded-xl hover:bg-red-50 transition disabled:opacity-50">
              {t("orders.detail.cancel_btn")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
