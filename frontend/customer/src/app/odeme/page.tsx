"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  checkoutFormContent?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { cart, fetchCart } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [step, setStep] = useState<Step>("address");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    if (!authLoading && !user) {
      router.replace("/giris");
      return;
    }
    if (user) {
      fetchCart();
      fetchAddresses();
    }
  }, [authLoading, user, fetchCart, fetchAddresses, router]);

  async function placeOrder() {
    if (!selectedAddressId) {
      setError("Lütfen bir adres seçin");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      // 1. Create order
      const order = await api.post<{ id: string; orderNumber: string }>("/api/orders", {
        shippingAddressId: selectedAddressId,
        billingAddressId: selectedAddressId,
        note: "",
      });

      // 2. Initiate payment
      const payment = await api.post<PaymentResult>("/api/payments/initiate", {
        orderId: order.id,
        method: "CreditCard",
      });

      // 3a. İyzico: redirect to hosted payment page
      if (payment.requiresRedirect && payment.redirectUrl) {
        window.location.href = payment.redirectUrl;
        return;
      }

      // 3b. Mock provider: simulate successful callback
      await api.post("/api/payments/callback", {
        transactionId: payment.transactionId,
        payload: JSON.stringify({ success: true }),
        isSuccess: true,
      });

      setOrderNumber(order.orderNumber);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sipariş oluşturulamadı");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-zinc-400">Yükleniyor...</div>;
  }

  if (step === "done") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-6">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold text-zinc-900">Siparişiniz Alındı!</h1>
        <p className="text-zinc-600">
          Sipariş numaranız: <span className="font-semibold text-zinc-900">{orderNumber}</span>
        </p>
        <p className="text-sm text-zinc-500">Ödemeniz başarıyla alındı. Siparişinizi hesabınızdan takip edebilirsiniz.</p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/hesabim/siparisler"
            className="bg-zinc-900 text-white px-6 py-2.5 rounded-lg hover:bg-zinc-700 transition text-sm font-semibold"
          >
            Siparişlerim
          </Link>
          <Link
            href="/urunler"
            className="border border-zinc-300 text-zinc-700 px-6 py-2.5 rounded-lg hover:bg-zinc-50 transition text-sm"
          >
            Alışverişe Devam
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-zinc-900 mb-8">Siparişi Tamamla</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Address + payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Address selection */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <h2 className="font-semibold text-zinc-900 mb-4">Teslimat Adresi</h2>
            {addresses.length === 0 ? (
              <div className="text-sm text-zinc-500">
                Kayıtlı adresiniz yok.{" "}
                <Link href="/hesabim/adresler" className="underline text-zinc-700">
                  Adres ekleyin
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex gap-3 p-4 border rounded-xl cursor-pointer transition ${
                      selectedAddressId === addr.id
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200 hover:border-zinc-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 shrink-0"
                    />
                    <div className="text-sm">
                      <p className="font-medium text-zinc-900">{addr.addressTitle}</p>
                      <p className="text-zinc-600 mt-0.5">
                        {addr.firstName} {addr.lastName}
                      </p>
                      <p className="text-zinc-500">{addr.fullAddress}</p>
                      <p className="text-zinc-500">
                        {addr.district}, {addr.city}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <Link
              href="/hesabim/adresler"
              className="mt-4 inline-block text-sm text-zinc-500 hover:text-zinc-800 underline"
            >
              + Yeni adres ekle
            </Link>
          </div>

          {/* Payment method */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <h2 className="font-semibold text-zinc-900 mb-2">Ödeme Yöntemi</h2>
            <div className="flex items-center gap-3 p-4 border border-zinc-900 bg-zinc-50 rounded-xl">
              <span className="text-xl">💳</span>
              <span className="text-sm font-medium text-zinc-800">Kredi / Banka Kartı</span>
            </div>
          </div>
        </div>

        {/* Right: Cart summary */}
        <div>
          <div className="bg-white border border-zinc-200 rounded-xl p-6 sticky top-24 space-y-3">
            <h2 className="font-semibold text-zinc-900 mb-2">Sipariş Özeti</h2>

            {cart && (
              <>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item.cartItemId} className="flex justify-between text-xs text-zinc-600">
                      <span className="line-clamp-1 flex-1 mr-2">
                        {item.productName} ×{item.quantity}
                      </span>
                      <span className="shrink-0">{formatPrice(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-zinc-100 pt-3 space-y-2">
                  <div className="flex justify-between text-sm text-zinc-600">
                    <span>Ara Toplam</span>
                    <span>{formatPrice(cart.subTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-zinc-600">
                    <span>KDV</span>
                    <span>{formatPrice(cart.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-zinc-600">
                    <span>Kargo</span>
                    <span>{cart.shippingAmount === 0 ? "Ücretsiz" : formatPrice(cart.shippingAmount)}</span>
                  </div>
                  {cart.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>İndirim</span>
                      <span>-{formatPrice(cart.discountAmount)}</span>
                    </div>
                  )}
                  <div className="border-t border-zinc-200 pt-2 flex justify-between font-bold text-zinc-900">
                    <span>Toplam</span>
                    <span>{formatPrice(cart.grandTotal)}</span>
                  </div>
                </div>
              </>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              onClick={placeOrder}
              disabled={submitting || !selectedAddressId || !cart || cart.items.length === 0}
              className="w-full py-3 bg-zinc-900 text-white font-semibold rounded-xl hover:bg-zinc-700 transition disabled:opacity-50 text-sm"
            >
              {submitting ? "Yönlendiriliyor..." : "Siparişi Onayla ve Öde"}
            </button>

            <p className="text-xs text-zinc-400 text-center">
              256-bit SSL ile güvenli ödeme
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
