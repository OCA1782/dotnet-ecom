"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";
import type { Address } from "@/types";
import { useI18n } from "@/contexts/I18nContext";

type PayMethod = "CreditCard" | "BankTransfer" | "CashOnDelivery";

interface PaymentResult {
  transactionId: string;
  requiresRedirect: boolean;
  redirectUrl?: string;
}

interface GuestForm {
  email: string; firstName: string; lastName: string; phone: string;
  city: string; district: string; fullAddress: string; postalCode: string;
}

interface CardForm { number: string; expiry: string; cvv: string; name: string; }

const emptyGuest: GuestForm = {
  email: "", firstName: "", lastName: "", phone: "",
  city: "", district: "", fullAddress: "", postalCode: "",
};

function fmtCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function fmtExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

const INP = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800 bg-white";
const LABEL = "block text-xs font-medium text-slate-600 mb-1";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function AddressList({
  addresses, selected, onSelect, onAdd, t,
}: {
  addresses: Address[]; selected: string;
  onSelect: (id: string) => void; onAdd: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-2">
      {addresses.map((addr) => (
        <label key={addr.id}
          className={`flex gap-3 p-4 border rounded-xl cursor-pointer transition ${
            selected === addr.id ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-slate-400"
          }`}>
          <input type="radio" name="address" checked={selected === addr.id}
            onChange={() => onSelect(addr.id)} className="mt-0.5 shrink-0 accent-teal-600" />
          <div className="flex-1 min-w-0 text-sm">
            <p className="font-semibold text-slate-900">{addr.addressTitle}</p>
            <p className="text-slate-600 mt-0.5">{addr.firstName} {addr.lastName}</p>
            <p className="text-slate-500 text-xs mt-0.5">{addr.fullAddress}</p>
            <p className="text-slate-500 text-xs">{addr.district} / {addr.city}</p>
          </div>
          {addr.isDefaultShipping && (
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full self-start shrink-0">
              {t("checkout.shipping.default_badge")}
            </span>
          )}
        </label>
      ))}
      <button onClick={onAdd}
        className="w-full mt-1 py-2.5 border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50 transition font-medium">
        {t("checkout.shipping.add_btn")}
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const { cart, fetchCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [guestForm, setGuestForm] = useState<GuestForm>(emptyGuest);

  const [diffBilling, setDiffBilling] = useState(false);
  const [selectedBillingId, setSelectedBillingId] = useState<string>("");

  const [payMethod, setPayMethod] = useState<PayMethod>("CreditCard");
  const [cardForm, setCardForm] = useState<CardForm>({ number: "", expiry: "", cvv: "", name: "" });

  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const isGuest = !authLoading && !user;

  const fetchAddresses = useCallback(async () => {
    try {
      const data = await api.get<Address[]>("/api/addresses");
      setAddresses(data);
      const def = data.find((a) => a.isDefaultShipping) ?? data[0];
      if (def) { setSelectedAddressId(def.id); setSelectedBillingId(def.id); }
    } catch { setAddresses([]); }
  }, []);

  useEffect(() => {
    fetchCart();
    if (user) window.setTimeout(() => fetchAddresses(), 0);
  }, [user, fetchCart, fetchAddresses]);

  function setGuest(f: keyof GuestForm, v: string) { setGuestForm((p) => ({ ...p, [f]: v })); }
  function setCard(f: keyof CardForm, v: string) { setCardForm((p) => ({ ...p, [f]: v })); }

  async function placeOrder() {
    setError("");

    if (user) {
      if (!selectedAddressId) { setError(t("checkout.error.no_shipping")); return; }
      if (diffBilling && !selectedBillingId) { setError(t("checkout.error.no_billing")); return; }
    } else {
      const { email, firstName, lastName, phone, city, district, fullAddress } = guestForm;
      if (!email || !firstName || !lastName || !phone || !city || !district || !fullAddress) {
        setError(t("checkout.error.guest_required")); return;
      }
    }

    if (payMethod === "CreditCard") {
      if (!cardForm.number || !cardForm.expiry || !cardForm.cvv || !cardForm.name) {
        setError(t("checkout.error.card_required")); return;
      }
    }

    setSubmitting(true);
    try {
      let orderId: string;
      let orderNum: string;

      if (user) {
        const order = await api.post<{ id: string; orderNumber: string }>("/api/orders", {
          shippingAddressId: selectedAddressId,
          billingAddressId: diffBilling ? selectedBillingId : selectedAddressId,
          note: "",
        });
        orderId = order.id;
        orderNum = order.orderNumber;
      } else {
        const order = await api.post<{ id: string; orderNumber: string }>("/api/orders/guest", {
          guestEmail: guestForm.email,
          firstName: guestForm.firstName,
          lastName: guestForm.lastName,
          phone: guestForm.phone,
          city: guestForm.city,
          district: guestForm.district,
          fullAddress: guestForm.fullAddress,
          postalCode: guestForm.postalCode || null,
          note: "",
        });
        orderId = order.id;
        orderNum = order.orderNumber;
      }

      const payment = await api.post<PaymentResult>("/api/payments/initiate", {
        orderId,
        method: payMethod,
      });

      if (payment.requiresRedirect && payment.redirectUrl) {
        window.location.href = payment.redirectUrl;
        return;
      }

      if (payMethod === "CreditCard") {
        await api.post("/api/payments/callback", {
          transactionId: payment.transactionId,
          payload: JSON.stringify({ success: true }),
          isSuccess: true,
        });
      }

      setOrderNumber(orderNum);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("checkout.error.order_failed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">{t("checkout.loading")}</div>;
  }

  if (done) {
    const isPaid = payMethod === "CreditCard";
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-6">
        <div className="text-5xl">{isPaid ? t("checkout.success.paid_emoji") : t("checkout.success.order_emoji")}</div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isPaid ? t("checkout.success.paid_title") : t("checkout.success.order_title")}
        </h1>
        <p className="text-slate-600">
          {t("checkout.success.order_number")} <span className="font-semibold font-mono text-slate-900">{orderNumber}</span>
        </p>
        {payMethod === "BankTransfer" && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-left space-y-2">
            <p className="text-sm font-semibold text-blue-900">{t("checkout.success.bank_title")}</p>
            <p className="text-xs text-blue-700">{t("checkout.success.bank_desc")}</p>
            <div className="bg-white rounded-xl border border-blue-100 px-4 py-3 space-y-1 text-xs text-slate-700 font-mono">
              <p><span className="text-slate-400 font-sans">{t("checkout.success.bank_iban_label")}</span> TR00 0001 2345 6789 0123 4567 89</p>
              <p><span className="text-slate-400 font-sans">{t("checkout.success.bank_name_label")}</span> Ecom Ticaret A.Ş.</p>
              <p><span className="text-slate-400 font-sans">{t("checkout.success.bank_desc_label")}</span> {orderNumber}</p>
            </div>
          </div>
        )}
        {payMethod === "CashOnDelivery" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
            {t("checkout.success.cod_note")}
          </div>
        )}
        {isGuest && isPaid && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-700 text-left">
            <p className="font-semibold mb-1">{t("checkout.success.guest_cta_title")}</p>
            <p className="text-xs mb-3 text-teal-600">{t("checkout.success.guest_cta_desc")}</p>
            <Link href={`/kayit?email=${encodeURIComponent(guestForm.email)}`}
              className="inline-block bg-teal-600 text-white font-semibold text-sm px-5 py-2 rounded-xl hover:bg-teal-700 transition">
              {t("checkout.success.guest_cta_btn")}
            </Link>
          </div>
        )}
        <div className="flex gap-3 justify-center pt-2">
          {!isGuest && (
            <Link href="/hesabim/siparisler"
              className="bg-teal-600 text-white px-6 py-2.5 rounded-xl hover:bg-teal-700 transition text-sm font-semibold">
              {t("checkout.success.orders_btn")}
            </Link>
          )}
          <Link href="/urunler"
            className="border border-slate-300 text-slate-700 px-6 py-2.5 rounded-xl hover:bg-slate-50 transition text-sm font-medium">
            {t("checkout.success.continue_btn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">{t("checkout.title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Sol: Adres + Ödeme ── */}
        <div className="lg:col-span-2 space-y-5">

          {isGuest && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex items-start gap-3">
              <span className="text-xl shrink-0">ℹ️</span>
              <div className="text-sm text-blue-800">
                <p className="font-semibold">{t("checkout.guest.notice")}</p>
                <p className="text-xs mt-1 text-blue-600">
                  <Link href="/giris" className="underline font-semibold">{t("checkout.guest.login")}</Link>
                  {" veya "}
                  <Link href="/kayit" className="underline font-semibold">{t("checkout.guest.register")}</Link>
                  {" "}— {t("checkout.guest.notice_desc")}
                </p>
              </div>
            </div>
          )}

          {/* ── Teslimat Adresi ── */}
          <SectionCard title={t("checkout.shipping.title")}>
            {user ? (
              addresses.length === 0 ? (
                <div className="text-center py-6 space-y-3">
                  <p className="text-sm text-slate-500">{t("checkout.shipping.no_address")}</p>
                  <Link href="/hesabim/adresler"
                    className="inline-block bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-700 transition">
                    {t("checkout.shipping.add_link")}
                  </Link>
                </div>
              ) : (
                <AddressList
                  addresses={addresses}
                  selected={selectedAddressId}
                  onSelect={setSelectedAddressId}
                  onAdd={() => window.open("/hesabim/adresler", "_blank")}
                  t={t}
                />
              )
            ) : (
              <div className="space-y-3">
                <div>
                  <label className={LABEL}>{t("checkout.guest.email")} <span className="text-red-500">{t("checkout.required")}</span></label>
                  <input type="email" value={guestForm.email} onChange={(e) => setGuest("email", e.target.value)}
                    placeholder="ornek@email.com" className={INP} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>{t("checkout.guest.first_name")} <span className="text-red-500">{t("checkout.required")}</span></label>
                    <input value={guestForm.firstName} onChange={(e) => setGuest("firstName", e.target.value)} className={INP} />
                  </div>
                  <div>
                    <label className={LABEL}>{t("checkout.guest.last_name")} <span className="text-red-500">{t("checkout.required")}</span></label>
                    <input value={guestForm.lastName} onChange={(e) => setGuest("lastName", e.target.value)} className={INP} />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>{t("checkout.guest.phone")} <span className="text-red-500">{t("checkout.required")}</span></label>
                  <input type="tel" value={guestForm.phone} onChange={(e) => setGuest("phone", e.target.value)}
                    placeholder="05xx xxx xx xx" className={INP} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>{t("checkout.guest.city")} <span className="text-red-500">{t("checkout.required")}</span></label>
                    <input value={guestForm.city} onChange={(e) => setGuest("city", e.target.value)} className={INP} />
                  </div>
                  <div>
                    <label className={LABEL}>{t("checkout.guest.district")} <span className="text-red-500">{t("checkout.required")}</span></label>
                    <input value={guestForm.district} onChange={(e) => setGuest("district", e.target.value)} className={INP} />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>{t("checkout.guest.full_address")} <span className="text-red-500">{t("checkout.required")}</span></label>
                  <textarea rows={2} value={guestForm.fullAddress}
                    onChange={(e) => setGuest("fullAddress", e.target.value)}
                    className={INP + " resize-none"} />
                </div>
                <div>
                  <label className={LABEL}>{t("checkout.guest.postal_code")}</label>
                  <input value={guestForm.postalCode} onChange={(e) => setGuest("postalCode", e.target.value)} className={INP} />
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── Fatura Adresi (sadece üyeler) ── */}
          {user && (
            <SectionCard title={t("checkout.billing.title")}>
              <label className="flex items-center gap-2.5 cursor-pointer select-none mb-4">
                <input type="checkbox" className="w-4 h-4 accent-teal-600 rounded"
                  checked={diffBilling} onChange={(e) => setDiffBilling(e.target.checked)} />
                <span className="text-sm text-slate-700">{t("checkout.billing.same_checkbox")}</span>
              </label>
              {!diffBilling ? (
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                  <span className="text-slate-400 text-sm">✓</span>
                  <span className="text-sm text-slate-500">{t("checkout.billing.same_as_shipping")}</span>
                </div>
              ) : (
                addresses.length === 0 ? (
                  <p className="text-sm text-slate-500">{t("checkout.billing.no_address")}</p>
                ) : (
                  <AddressList
                    addresses={addresses}
                    selected={selectedBillingId}
                    onSelect={setSelectedBillingId}
                    onAdd={() => window.open("/hesabim/adresler", "_blank")}
                    t={t}
                  />
                )
              )}
            </SectionCard>
          )}

          {/* ── Ödeme Yöntemi ── */}
          <SectionCard title={t("checkout.payment.title")}>
            <div className="space-y-3">

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(
                  [
                    { key: "CreditCard",      icon: "💳", label: t("checkout.payment.credit_card") },
                    { key: "BankTransfer",    icon: "🏦", label: t("checkout.payment.bank_transfer") },
                    { key: "CashOnDelivery",  icon: "📦", label: t("checkout.payment.cash_on_delivery") },
                  ] as const
                ).map(({ key, icon, label }) => (
                  <button key={key} onClick={() => setPayMethod(key)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition ${
                      payMethod === key
                        ? "border-teal-500 bg-teal-50 text-teal-800"
                        : "border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                    }`}>
                    <span className="text-base">{icon}</span>
                    <span className="leading-tight">{label}</span>
                  </button>
                ))}
              </div>

              {payMethod === "CreditCard" && (
                <div className="mt-2 space-y-3 pt-4 border-t border-slate-100">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-xs text-amber-700 flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">🧪</span>
                    <span>
                      <strong>{t("checkout.card.test_hint")}</strong> 4111 1111 1111 1111 &nbsp;·&nbsp; Son kullanma: 12/26 &nbsp;·&nbsp; CVV: 123
                    </span>
                  </div>

                  <div>
                    <label className={LABEL}>{t("checkout.card.name")} <span className="text-red-500">{t("checkout.required")}</span></label>
                    <input value={cardForm.name} onChange={(e) => setCard("name", e.target.value)}
                      placeholder="AD SOYAD" className={INP} />
                  </div>
                  <div>
                    <label className={LABEL}>{t("checkout.card.number")} <span className="text-red-500">{t("checkout.required")}</span></label>
                    <input
                      value={cardForm.number}
                      onChange={(e) => setCard("number", fmtCard(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      inputMode="numeric"
                      className={INP + " font-mono tracking-widest"}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>{t("checkout.card.expiry")} <span className="text-red-500">{t("checkout.required")}</span></label>
                      <input
                        value={cardForm.expiry}
                        onChange={(e) => setCard("expiry", fmtExpiry(e.target.value))}
                        placeholder="AA/YY"
                        maxLength={5}
                        inputMode="numeric"
                        className={INP + " font-mono"}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>{t("checkout.card.cvv")} <span className="text-red-500">{t("checkout.required")}</span></label>
                      <input
                        value={cardForm.cvv}
                        onChange={(e) => setCard("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="•••"
                        maxLength={4}
                        inputMode="numeric"
                        className={INP + " font-mono"}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                    <span>🔒</span>
                    <span>{t("checkout.card.ssl_notice")}</span>
                  </div>
                </div>
              )}

              {payMethod === "BankTransfer" && (
                <div className="mt-2 pt-4 border-t border-slate-100 space-y-3">
                  <p className="text-sm text-slate-600">{t("checkout.bank.info_desc")}</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-100 text-sm">
                    {[
                      [t("checkout.bank.bank_name"),    "Türkiye İş Bankası"],
                      [t("checkout.bank.account_name"), "Ecom Ticaret A.Ş."],
                      [t("checkout.bank.iban"),         "TR00 0001 2345 6789 0123 4567 89"],
                      [t("checkout.bank.description"),  t("checkout.bank.order_number")],
                    ].map(([lbl, val]) => (
                      <div key={lbl} className="flex items-center justify-between px-4 py-2.5 gap-4">
                        <span className="text-xs text-slate-400 shrink-0">{lbl}</span>
                        <span className={`font-medium text-slate-800 text-right ${lbl === t("checkout.bank.iban") ? "font-mono text-xs" : ""}`}>{val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <span className="shrink-0">ℹ️</span>
                    <span>{t("checkout.bank.processing_note")}</span>
                  </div>
                </div>
              )}

              {payMethod === "CashOnDelivery" && (
                <div className="mt-2 pt-4 border-t border-slate-100 space-y-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-100 text-sm">
                    {[
                      [t("checkout.cod.method"),  t("checkout.cod.method_val")],
                      [t("checkout.cod.timing"),  t("checkout.cod.timing_val")],
                    ].map(([lbl, val]) => (
                      <div key={lbl} className="flex items-center justify-between px-4 py-2.5 gap-4">
                        <span className="text-xs text-slate-400 shrink-0">{lbl}</span>
                        <span className="font-medium text-slate-800 text-right">{val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <span className="shrink-0">ℹ️</span>
                    <span>{t("checkout.cod.note")}</span>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* ── Sağ: Sipariş Özeti ── */}
        <div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sticky top-24 space-y-4">
            <h2 className="font-semibold text-slate-900">{t("checkout.summary.title")}</h2>

            {cart ? (
              <>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {cart.items.filter(i => i.isSelected).map((item) => (
                    <div key={item.cartItemId} className="flex justify-between gap-2 text-xs text-slate-600">
                      <span className="line-clamp-2 flex-1">{item.productName}
                        <span className="text-slate-400"> ×{item.quantity}</span>
                      </span>
                      <span className="shrink-0 font-medium">{formatPrice(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>{t("checkout.summary.subtotal")}</span><span>{formatPrice(cart.subTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>{t("checkout.summary.tax")}</span><span>{formatPrice(cart.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>{t("checkout.summary.shipping")}</span>
                    <span className={cart.shippingAmount === 0 ? "text-emerald-600 font-medium" : ""}>
                      {cart.shippingAmount === 0 ? t("checkout.summary.shipping_free") : formatPrice(cart.shippingAmount)}
                    </span>
                  </div>
                  {cart.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>{t("checkout.summary.discount")}</span><span>−{formatPrice(cart.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-200">
                    <span>{t("checkout.summary.total")}</span><span>{formatPrice(cart.grandTotal)}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">{t("checkout.summary.loading")}</p>
            )}

            {cart && cart.items.length > 0 && !cart.items.some(i => i.isSelected) && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                {t("checkout.summary.no_selected")}
              </p>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">{error}</p>
            )}

            <button
              onClick={placeOrder}
              disabled={submitting || !cart || cart.items.length === 0 || !cart.items.some(i => i.isSelected)}
              className="w-full py-3.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 active:scale-[.98] transition disabled:opacity-50 text-sm">
              {submitting ? t("checkout.summary.processing") : payMethod === "CreditCard" ? t("checkout.summary.submit_pay") : t("checkout.summary.submit_create")}
            </button>

            <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1">
              <span>🔒</span>
              {payMethod === "CreditCard" ? t("checkout.summary.ssl_pay") : t("checkout.summary.ssl_order")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
