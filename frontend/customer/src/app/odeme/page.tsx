"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";
import type { Address } from "@/types";

type Step = "address" | "done";

interface PaymentResult {
  transactionId: string;
  requiresRedirect: boolean;
  redirectUrl?: string;
}

interface GuestForm {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  district: string;
  fullAddress: string;
  postalCode: string;
}

const emptyGuest: GuestForm = {
  email: "", firstName: "", lastName: "", phone: "",
  city: "", district: "", fullAddress: "", postalCode: "",
};

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart, fetchCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [guestForm, setGuestForm] = useState<GuestForm>(emptyGuest);
  const [step, setStep] = useState<Step>("address");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isGuest = !authLoading && !user;

  const fetchAddresses = useCallback(async () => {
    try {
      const data = await api.get<Address[]>("/api/addresses");
      setAddresses(data);
      const def = data.find((a) => a.isDefaultShipping) ?? data[0];
      if (def) setSelectedAddressId(def.id);
    } catch {
      setAddresses([]);
    }
  }, []);

  useEffect(() => {
    fetchCart();
    if (user) fetchAddresses();
  }, [user, fetchCart, fetchAddresses]);

  function setGuest(field: keyof GuestForm, value: string) {
    setGuestForm((prev) => ({ ...prev, [field]: value }));
  }

  async function placeOrder() {
    setError("");

    if (user) {
      if (!selectedAddressId) { setError("Lütfen bir teslimat adresi seçin."); return; }
    } else {
      const { email, firstName, lastName, phone, city, district, fullAddress } = guestForm;
      if (!email || !firstName || !lastName || !phone || !city || !district || !fullAddress) {
        setError("Lütfen tüm zorunlu alanları doldurun.");
        return;
      }
    }

    setSubmitting(true);
    try {
      let orderId: string;
      let orderNum: string;

      if (user) {
        const order = await api.post<{ id: string; orderNumber: string }>("/api/orders", {
          shippingAddressId: selectedAddressId,
          billingAddressId: selectedAddressId,
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

      setOrderNumber(orderNum);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sipariş oluşturulamadı.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">Yükleniyor...</div>;
  }

  if (step === "done") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-6">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold text-slate-900">Siparişiniz Alındı!</h1>
        <p className="text-slate-600">
          Sipariş numaranız: <span className="font-semibold text-slate-900">{orderNumber}</span>
        </p>
        {isGuest ? (
          <>
            <p className="text-sm text-slate-500">
              Sipariş onayı <strong>{guestForm.email}</strong> adresinize gönderildi.
            </p>
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-700 text-left">
              <p className="font-semibold mb-1">Siparişinizi takip etmek ister misiniz?</p>
              <p className="text-xs mb-3 text-teal-600">Üye olursanız siparişlerinizi hesabınızdan kolayca takip edebilirsiniz.</p>
              <Link
                href={`/kayit?email=${encodeURIComponent(guestForm.email)}`}
                className="inline-block bg-teal-600 text-white font-semibold text-sm px-5 py-2 rounded-xl hover:bg-teal-700 transition"
              >
                Üye Ol →
              </Link>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">Siparişinizi hesabınızdan takip edebilirsiniz.</p>
        )}
        <div className="flex gap-3 justify-center">
          {!isGuest && (
            <Link href="/hesabim/siparisler"
              className="bg-teal-600 text-white px-6 py-2.5 rounded-xl hover:bg-teal-700 transition text-sm font-semibold">
              Siparişlerim
            </Link>
          )}
          <Link href="/urunler"
            className="border border-slate-300 text-slate-700 px-6 py-2.5 rounded-xl hover:bg-slate-50 transition text-sm">
            Alışverişe Devam
          </Link>
        </div>
      </div>
    );
  }

  const inp = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Siparişi Tamamla</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sol: Adres + Ödeme */}
        <div className="lg:col-span-2 space-y-6">

          {/* Giriş yapmamış kullanıcı bildirimi */}
          {isGuest && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex items-start gap-3">
              <span className="text-xl">ℹ️</span>
              <div className="text-sm text-blue-800">
                <p className="font-semibold">Üye olarak devam etmek ister misiniz?</p>
                <p className="text-xs mt-0.5 text-blue-600">
                  <Link href="/giris" className="underline font-medium">Giriş yapın</Link>
                  {" "}veya{" "}
                  <Link href="/kayit" className="underline font-medium">üye olun</Link>
                  {" "}— ya da aşağıdan misafir olarak devam edin.
                </p>
              </div>
            </div>
          )}

          {/* Teslimat adresi */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Teslimat Adresi</h2>

            {user ? (
              /* Üye: kayıtlı adresler */
              <>
                {addresses.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Kayıtlı adresiniz yok.{" "}
                    <Link href="/hesabim/adresler" className="underline text-slate-700">Adres ekleyin</Link>
                  </p>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <label key={addr.id}
                        className={`flex gap-3 p-4 border rounded-xl cursor-pointer transition ${
                          selectedAddressId === addr.id ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-slate-400"
                        }`}>
                        <input type="radio" name="address" value={addr.id}
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-slate-900">{addr.addressTitle}</p>
                          <p className="text-slate-600 mt-0.5">{addr.firstName} {addr.lastName}</p>
                          <p className="text-slate-500">{addr.fullAddress}</p>
                          <p className="text-slate-500">{addr.district}, {addr.city}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <Link href="/hesabim/adresler"
                  className="mt-4 inline-block text-sm text-slate-500 hover:text-slate-800 underline">
                  + Yeni adres ekle
                </Link>
              </>
            ) : (
              /* Misafir: inline form */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">E-posta <span className="text-red-500">*</span></label>
                  <input type="email" value={guestForm.email} onChange={e => setGuest("email", e.target.value)}
                    placeholder="ornek@email.com" className={inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Ad <span className="text-red-500">*</span></label>
                    <input value={guestForm.firstName} onChange={e => setGuest("firstName", e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Soyad <span className="text-red-500">*</span></label>
                    <input value={guestForm.lastName} onChange={e => setGuest("lastName", e.target.value)} className={inp} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Telefon <span className="text-red-500">*</span></label>
                  <input type="tel" value={guestForm.phone} onChange={e => setGuest("phone", e.target.value)}
                    placeholder="05xx xxx xx xx" className={inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Şehir <span className="text-red-500">*</span></label>
                    <input value={guestForm.city} onChange={e => setGuest("city", e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">İlçe <span className="text-red-500">*</span></label>
                    <input value={guestForm.district} onChange={e => setGuest("district", e.target.value)} className={inp} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Açık Adres <span className="text-red-500">*</span></label>
                  <textarea rows={2} value={guestForm.fullAddress} onChange={e => setGuest("fullAddress", e.target.value)}
                    className={inp + " resize-none"} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Posta Kodu</label>
                  <input value={guestForm.postalCode} onChange={e => setGuest("postalCode", e.target.value)} className={inp} />
                </div>
              </div>
            )}
          </div>

          {/* Ödeme yöntemi */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="font-semibold text-slate-900 mb-2">Ödeme Yöntemi</h2>
            <div className="flex items-center gap-3 p-4 border border-teal-500 bg-teal-50 rounded-xl">
              <span className="text-xl">💳</span>
              <span className="text-sm font-medium text-slate-800">Kredi / Banka Kartı</span>
            </div>
          </div>
        </div>

        {/* Sağ: Sipariş özeti */}
        <div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 sticky top-24 space-y-3">
            <h2 className="font-semibold text-slate-900 mb-2">Sipariş Özeti</h2>
            {cart && (
              <>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item.cartItemId} className="flex justify-between text-xs text-slate-600">
                      <span className="line-clamp-1 flex-1 mr-2">{item.productName} ×{item.quantity}</span>
                      <span className="shrink-0">{formatPrice(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Ara Toplam</span><span>{formatPrice(cart.subTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>KDV</span><span>{formatPrice(cart.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Kargo</span>
                    <span>{cart.shippingAmount === 0 ? "Ücretsiz" : formatPrice(cart.shippingAmount)}</span>
                  </div>
                  {cart.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>İndirim</span><span>-{formatPrice(cart.discountAmount)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                    <span>Toplam</span><span>{formatPrice(cart.grandTotal)}</span>
                  </div>
                </div>
              </>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
            )}

            <button
              onClick={placeOrder}
              disabled={submitting || !cart || cart.items.length === 0}
              className="w-full py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition disabled:opacity-50 text-sm"
            >
              {submitting ? "İşleniyor..." : "Siparişi Onayla ve Öde"}
            </button>
            <p className="text-xs text-slate-400 text-center">256-bit SSL ile güvenli ödeme</p>
          </div>
        </div>
      </div>
    </div>
  );
}
