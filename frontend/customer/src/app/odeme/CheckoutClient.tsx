"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useCart, clearCartState } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";
import type { Address } from "@/types";
import { useI18n } from "@/contexts/I18nContext";

type PayMethod = "CreditCard" | "BankTransfer" | "CashOnDelivery";

interface PaymentResult {
  transactionId: string;
  requiresRedirect: boolean;
  redirectUrl?: string;
  checkoutFormContent?: string;
}

interface QnbSession {
  sessionId: string;
  amount: string;
}

interface PayforForwardResult {
  type: "redirect" | "html" | "qnb_error";
  url?: string;
  html?: string;
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

export default function CheckoutClient({
  codEnabled,
  sanalPosEnabled,
  havaleEnabled,
  havaleIban,
  havalebankName,
  havaleAccountName,
}: {
  codEnabled: boolean;
  sanalPosEnabled: boolean;
  havaleEnabled: boolean;
  havaleIban: string;
  havalebankName: string;
  havaleAccountName: string;
}) {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const { cart, fetchCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [guestForm, setGuestForm] = useState<GuestForm>(emptyGuest);

  const [diffBilling, setDiffBilling] = useState(false);
  const [selectedBillingId, setSelectedBillingId] = useState<string>("");

  const defaultPayMethod: PayMethod = sanalPosEnabled ? "CreditCard" : havaleEnabled ? "BankTransfer" : "CashOnDelivery";
  const [payMethod, setPayMethod] = useState<PayMethod>(defaultPayMethod);
  const [cardForm, setCardForm] = useState<CardForm>({ number: "", expiry: "", cvv: "", name: "" });

  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [qnbIframeUrl, setQnbIframeUrl] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [qnbSession, setQnbSession] = useState<QnbSession | null>(null);
  const [qnbCard, setQnbCard] = useState({ pan: "", holderName: "", month: "", year: "", cvv: "" });
  const [qnbSubmitting, setQnbSubmitting] = useState(false);
  const [qnbError, setQnbError] = useState("");
  const [qnbTimeLeft, setQnbTimeLeft] = useState(15 * 60);
  const [cvvFocused, setCvvFocused] = useState(false);

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

  // If COD was selected but then disabled, fall back to CreditCard
  useEffect(() => {
    if (!codEnabled && payMethod === "CashOnDelivery") {
      setPayMethod("CreditCard");
    }
  }, [codEnabled, payMethod]);

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

      // QNB Payfor 3DHost — custom card form + server proxy
      if (payment.checkoutFormContent?.includes('"type":"payfor_3dhost"')) {
        const parsed = JSON.parse(payment.checkoutFormContent) as { type: string; sessionId: string; amount: string };
        setQnbCard({ pan: "", holderName: "", month: "", year: "", cvv: "" });
        setQnbError("");
        setCvvFocused(false);
        setQnbTimeLeft(15 * 60);
        setQnbSession({ sessionId: parsed.sessionId, amount: parsed.amount });
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
      clearCartState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("checkout.error.order_failed"));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitQnbCard() {
    if (!qnbSession) return;
    const { pan, holderName, month, year, cvv } = qnbCard;
    if (!pan || pan.replace(/\s/g, "").length < 13) { setQnbError("Geçerli bir kart numarası girin."); return; }
    if (!holderName.trim()) { setQnbError("Kart üzerindeki ismi girin."); return; }
    if (!month || !year) { setQnbError("Son kullanım tarihini seçin."); return; }
    if (!cvv || cvv.length < 3) { setQnbError("CVV/CVC kodunu girin."); return; }

    setQnbError("");
    setQnbSubmitting(true);
    try {
      const res = await api.post<PayforForwardResult>("/api/payments/payfor-forward", {
        sessionId: qnbSession.sessionId,
        pan: pan.replace(/\s/g, ""),
        cardHolderName: holderName.trim(),
        expiryMonth: month,
        expiryYear: year,
        cvv2: cvv,
      });

      if (res.type === "redirect" && res.url) {
        window.location.href = res.url;
      } else if (res.type === "html" && res.html) {
        // 3DS challenge page — show in iframe overlay
        const blob = new Blob([res.html], { type: "text/html; charset=utf-8" });
        setIframeLoading(true);
        setQnbIframeUrl(URL.createObjectURL(blob));
        setQnbSession(null);
      } else if (res.type === "qnb_error") {
        setQnbError("Ödeme reddedildi. Kart bilgilerini kontrol edip tekrar deneyin veya farklı bir kart kullanın.");
      } else {
        setQnbError("Beklenmeyen yanıt. Lütfen tekrar deneyin.");
      }
    } catch (err: unknown) {
      setQnbError(err instanceof Error ? err.message : "Ödeme işlemi sırasında hata oluştu.");
    } finally {
      setQnbSubmitting(false);
    }
  }

  // Countdown timer for QNB card form
  useEffect(() => {
    if (!qnbSession) return;
    const interval = setInterval(() => {
      setQnbTimeLeft(t => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qnbSession?.sessionId]);

  useEffect(() => {
    if (qnbTimeLeft === 0 && qnbSession) {
      setQnbSession(null);
      setError("Ödeme oturumu süresi doldu. Lütfen siparişi tekrar başlatın.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qnbTimeLeft]);

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
        <div className="h-7 bg-gray-200 rounded w-40 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-10 bg-gray-100 rounded-xl" />
                <div className="h-10 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3 lg:self-start">
            <div className="h-4 bg-gray-200 rounded w-28" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                <div className="h-3.5 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
            <div className="h-11 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // QNB custom card form — shown after initiate returns payfor_3dhost
  if (qnbSession) {
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 12 }, (_, i) => String(currentYear + i));
    const rawPan = qnbCard.pan.replace(/\s/g, "");
    const isVisa = rawPan.startsWith("4");
    const isMC   = /^5[1-5]/.test(rawPan) || /^2[2-7]/.test(rawPan);

    // Pad rawPan digits (not the already-spaced string) to 16, then split into fixed groups of 4
    const padded = rawPan.padEnd(16, "•");
    const displayPan = `${padded.slice(0,4)} ${padded.slice(4,8)} ${padded.slice(8,12)} ${padded.slice(12,16)}`;

    const timerMM = String(Math.floor(qnbTimeLeft / 60)).padStart(2, "0");
    const timerSS = String(qnbTimeLeft % 60).padStart(2, "0");
    const timerExpiring = qnbTimeLeft <= 120;

    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-slate-100 bg-white shadow-sm shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 border border-green-200 shrink-0">
            <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 leading-tight">Güvenli 3D Ödeme</p>
            <p className="text-[11px] text-slate-400 leading-tight">QNB Finansbank 3D Secure koruması aktif</p>
          </div>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {/* Countdown timer */}
            <span className={`inline-flex items-center gap-1 text-[11px] rounded-full px-2.5 py-1 font-mono font-bold border ${
              timerExpiring
                ? "text-red-700 bg-red-50 border-red-200 animate-pulse"
                : "text-slate-600 bg-slate-50 border-slate-200"
            }`}>
              {timerMM}:{timerSS}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1 font-medium">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              SSL 256-bit
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 font-medium">3DS</span>
          </div>
        </div>

        {/* Card form */}
        <div className="flex-1 overflow-y-auto bg-slate-50 flex items-start justify-center py-6 px-4">
          <div className="w-full max-w-sm space-y-4">

            {/* Animated card — flips to back when CVV is focused */}
            <div style={{ perspective: "1000px" }} className="relative h-44 w-full select-none">
              <div style={{
                position: "relative", width: "100%", height: "100%",
                transformStyle: "preserve-3d",
                transform: cvvFocused ? "rotateY(180deg)" : "rotateY(0deg)",
                transition: "transform 0.55s ease",
              }}>
                {/* Front face */}
                <div style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                  className="absolute inset-0 rounded-2xl shadow-lg bg-gradient-to-br from-teal-600 to-teal-800 text-white px-6 py-5">
                  <div className="flex justify-between items-start">
                    <svg className="h-8 w-8 opacity-70" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 5H4V8h16v1z" />
                    </svg>
                    {isVisa && <span className="text-xl font-black italic tracking-tighter opacity-90">VISA</span>}
                    {isMC && (
                      <div className="flex">
                        <div className="h-7 w-7 rounded-full bg-red-500 opacity-90" />
                        <div className="h-7 w-7 rounded-full bg-yellow-400 opacity-90 -ml-3" />
                      </div>
                    )}
                    {!isVisa && !isMC && <div className="h-7" />}
                  </div>
                  <p className="mt-4 text-lg font-mono tracking-widest">{displayPan}</p>
                  <div className="mt-3 flex justify-between text-xs opacity-80">
                    <div>
                      <p className="text-[10px] uppercase opacity-70">Kart Sahibi</p>
                      <p className="font-semibold truncate max-w-[140px]">{qnbCard.holderName || "AD SOYAD"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase opacity-70">Son Kul. Tar.</p>
                      <p className="font-semibold">{qnbCard.month && qnbCard.year ? `${qnbCard.month}/${qnbCard.year.slice(-2)}` : "AA/YY"}</p>
                    </div>
                  </div>
                </div>

                {/* Back face */}
                <div style={{
                  backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
                  className="absolute inset-0 rounded-2xl shadow-lg bg-gradient-to-br from-slate-700 to-slate-900">
                  <div className="w-full h-11 bg-black mt-7" />
                  <div className="mx-5 mt-4">
                    <div className="bg-white/90 rounded-lg px-4 py-2 flex items-center justify-end gap-3">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="font-mono text-slate-800 tracking-[0.35em] text-sm font-semibold">
                        {qnbCard.cvv || "•••"}
                      </span>
                    </div>
                    <p className="text-right text-[10px] text-slate-400 mt-1.5">CVV / CVC</p>
                  </div>
                  <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                    <p className="text-[10px] text-white/50">Kart bilgileri şifrelenerek iletilir</p>
                    {isVisa && <span className="text-white text-lg font-black italic tracking-tighter opacity-70">VISA</span>}
                    {isMC && (
                      <div className="flex">
                        <div className="h-6 w-6 rounded-full bg-red-500 opacity-70" />
                        <div className="h-6 w-6 rounded-full bg-yellow-400 opacity-70 -ml-3" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Timer warning */}
            {timerExpiring && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-700 font-medium">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Oturum süresi dolmak üzere! Lütfen kart bilgilerini girin.
              </div>
            )}

            {/* Fields */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div>
                <label className={LABEL}>Kart Numarası</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  value={qnbCard.pan}
                  onChange={(e) => setQnbCard(p => ({ ...p, pan: fmtCard(e.target.value) }))}
                  className={INP + " font-mono tracking-widest"}
                />
              </div>
              <div>
                <label className={LABEL}>Kart Üzerindeki İsim</label>
                <input
                  type="text"
                  placeholder="AD SOYAD"
                  value={qnbCard.holderName}
                  onChange={(e) => setQnbCard(p => ({ ...p, holderName: e.target.value.toUpperCase() }))}
                  className={INP + " uppercase"}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Son Kullanım</label>
                  <div className="flex gap-1">
                    <select value={qnbCard.month}
                      onChange={(e) => setQnbCard(p => ({ ...p, month: e.target.value }))}
                      className={INP + " px-2"}>
                      <option value="">AA</option>
                      {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={qnbCard.year}
                      onChange={(e) => setQnbCard(p => ({ ...p, year: e.target.value }))}
                      className={INP + " px-2"}>
                      <option value="">YYYY</option>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={LABEL}>CVV / CVC</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    placeholder="•••"
                    maxLength={4}
                    value={qnbCard.cvv}
                    onFocus={() => setCvvFocused(true)}
                    onBlur={() => setCvvFocused(false)}
                    onChange={(e) => setQnbCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    className={INP + " font-mono"}
                  />
                </div>
              </div>
            </div>

            {qnbError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{qnbError}</p>
            )}

            <div className="text-center text-xs text-slate-400">
              Ödeme tutarı: <span className="font-semibold text-slate-700">{qnbSession.amount}</span>
            </div>

            <button
              onClick={submitQnbCard}
              disabled={qnbSubmitting}
              className="w-full py-3.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 active:scale-[.98] transition disabled:opacity-50 text-sm">
              {qnbSubmitting ? "İşleniyor…" : "Ödemeyi Tamamla"}
            </button>

            <button
              onClick={() => setQnbSession(null)}
              disabled={qnbSubmitting}
              className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition">
              ← Geri Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (qnbIframeUrl) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
        {/* Branded security header */}
        <div className="flex items-center gap-3 px-5 h-14 border-b border-slate-100 bg-white shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 border border-green-200 shrink-0">
              <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 leading-tight">Güvenli 3D Ödeme</p>
              <p className="text-[11px] text-slate-400 leading-tight">QNB Finansbank 3D Secure koruması aktif</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1 font-medium">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              SSL 256-bit
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 font-medium">
              3DS
            </span>
          </div>
        </div>

        {/* iframe */}
        <div className="flex-1 relative overflow-hidden bg-slate-50">
          {iframeLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white gap-4 z-10">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-500 border-t-transparent" />
              <p className="text-sm text-slate-500">Banka güvenli sayfası yükleniyor…</p>
            </div>
          )}
          <iframe
            src={qnbIframeUrl}
            className="w-full h-full border-none"
            title="QNB Finansbank Güvenli Ödeme"
            onLoad={(e) => {
              setIframeLoading(false);
              try {
                const href = (e.target as HTMLIFrameElement).contentWindow?.location.href;
                // Only navigate parent when iframe lands on our payment result pages.
                // Avoid navigating for blob:, about:blank, or any other same-origin path
                // that might appear during QNB's 3DS flow (e.g. relative URLs resolving to our domain).
                if (href && (href.includes('/odeme/basarili') || href.includes('/odeme/basarisiz'))) {
                  window.location.href = href;
                }
              } catch {
                // Cross-origin (QNB/bank domain during 3DS) — expected, ignore
              }
            }}
          />
        </div>
      </div>
    );
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
              <p><span className="text-slate-400 font-sans">{t("checkout.success.bank_iban_label")}</span> {havaleIban}</p>
              <p><span className="text-slate-400 font-sans">{t("checkout.success.bank_name_label")}</span> {havaleAccountName}</p>
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

  const paymentMethods = [
    ...(sanalPosEnabled ? [{ key: "CreditCard" as const,   icon: "💳", label: t("checkout.payment.credit_card") }] : []),
    ...(havaleEnabled   ? [{ key: "BankTransfer" as const, icon: "🏦", label: t("checkout.payment.bank_transfer") }] : []),
    ...(codEnabled      ? [{ key: "CashOnDelivery" as const, icon: "📦", label: t("checkout.payment.cash_on_delivery") }] : []),
  ];

  // Compute selected-only totals (cart.subTotal/grandTotal include ALL items)
  const selectedItems = cart?.items.filter(i => i.isSelected) ?? [];
  const selectedSubTotal = selectedItems.reduce((s, i) => s + i.lineTotal, 0);
  const selectedTax = selectedItems.reduce((s, i) => s + i.lineTotal * i.taxRate / 100, 0);
  const selectedShipping = cart ? (selectedSubTotal >= cart.freeShippingLimit ? 0 : cart.shippingCost) : 0;
  const selectedGrandTotal = Math.max(0, selectedSubTotal + selectedShipping - (cart?.discountAmount ?? 0));

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
                {paymentMethods.map(({ key, icon, label }) => (
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
                <div className="mt-2 pt-4 border-t border-slate-100 space-y-3">
                  <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-4 flex items-start gap-3">
                    <span className="text-xl shrink-0 mt-0.5">🔒</span>
                    <div>
                      <p className="text-sm font-semibold text-teal-800">Güvenli 3D Ödeme</p>
                      <p className="text-xs text-teal-600 mt-1">
                        &quot;Ödeme Yap&quot; butonuna tıkladığınızda banka&apos;nın güvenli ödeme sayfasına
                        yönlendirileceksiniz. Kart bilgileriniz yalnızca banka güvenceli ortamda alınır,
                        sitemize iletilmez.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 px-1">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span>✓</span> SSL / 256-bit şifreleme
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span>✓</span> 3D Secure (3DS)
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span>✓</span> Taksit seçeneği (banka sayfasında)
                    </span>
                  </div>
                </div>
              )}

              {payMethod === "BankTransfer" && (
                <div className="mt-2 pt-4 border-t border-slate-100 space-y-3">
                  <p className="text-sm text-slate-600">{t("checkout.bank.info_desc")}</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-100 text-sm">
                    {[
                      [t("checkout.bank.bank_name"),    havalebankName],
                      [t("checkout.bank.account_name"), havaleAccountName],
                      [t("checkout.bank.iban"),         havaleIban],
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
          <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:sticky lg:top-6 space-y-4">
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
                    <span>{t("checkout.summary.subtotal")}</span><span>{formatPrice(selectedSubTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>{t("checkout.summary.tax")}</span><span>{formatPrice(selectedTax)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>{t("checkout.summary.shipping")}</span>
                    <span className={selectedShipping === 0 ? "text-emerald-600 font-medium" : ""}>
                      {selectedShipping === 0 ? t("checkout.summary.shipping_free") : formatPrice(selectedShipping)}
                    </span>
                  </div>
                  {cart.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>{t("checkout.summary.discount")}</span><span>−{formatPrice(cart.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-200">
                    <span>{t("checkout.summary.total")}</span><span>{formatPrice(selectedGrandTotal)}</span>
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

            {paymentMethods.length === 0 && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                Şu anda aktif ödeme yöntemi bulunmamaktadır. Lütfen yönetici ile iletişime geçin.
              </p>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">{error}</p>
            )}

            <button
              onClick={placeOrder}
              disabled={submitting || !cart || cart.items.length === 0 || !cart.items.some(i => i.isSelected) || paymentMethods.length === 0}
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
