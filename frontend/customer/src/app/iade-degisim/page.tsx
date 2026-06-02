"use client";

// İade & Değişim sayfası: politika metni + giriş yapmış kullanıcılar için
// sipariş numarası girişiyle doğrudan iade talebi formu sunar.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

// İade koşullarını açıklayan politika maddeleri
const POLICY_ITEMS = [
  { icon: "📅", title: "14 Gün İade Hakkı", desc: "Teslim tarihinden itibaren 14 gün içinde iade talebinde bulunabilirsiniz." },
  { icon: "📦", title: "Orijinal Ambalaj", desc: "Ürünlerin orijinal ambalajında ve kullanılmamış durumda olması gerekmektedir." },
  { icon: "🚚", title: "Ücretsiz Kargo", desc: "Onaylanan iadeler için kargo bedeli tarafımızca karşılanır." },
  { icon: "💳", title: "İade Süresi", desc: "İade onayından sonra ödeme 3-7 iş günü içinde hesabınıza aktarılır." },
];

export default function IadeDegisimPage() {
  const { user } = useAuth();
  const router = useRouter();

  // İade talebi formu state'leri (giriş yapmış kullanıcılar için)
  const [orderNumber, setOrderNumber] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ text: string; ok: boolean } | null>(null);

  // Giriş yapmış kullanıcı için sipariş numarasıyla iade talebi gönderir
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setSubmitting(true);
    setResult(null);
    try {
      await api.post(`/api/orders/${orderNumber.trim()}/request-refund`, {
        reason: reason.trim() || undefined,
      });
      setResult({ text: "İade talebiniz alındı. İnceleme sonucunda size dönülecektir.", ok: true });
      setOrderNumber("");
      setReason("");
    } catch (e: unknown) {
      setResult({ text: e instanceof Error ? e.message : "İade talebi gönderilemedi.", ok: false });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Başlık */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">İade & Değişim</h1>
        <p className="text-slate-500">Kolay iade, hızlı geri ödeme. Alışverişinizden memnun kalmazsanız yanınızdayız.</p>
      </div>

      {/* Politika kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {POLICY_ITEMS.map((item) => (
          <div key={item.title} className="bg-white border border-slate-200 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
            <span className="text-2xl shrink-0">{item.icon}</span>
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* İade talebi bölümü */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-base font-semibold text-slate-800">İade Talebi Oluştur</h2>
          <p className="text-xs text-slate-500 mt-0.5">Sipariş numaranızı girin ve iade nedeninizi belirtin.</p>
        </div>

        {user ? (
          // Giriş yapmış kullanıcı: doğrudan iade talebi formu
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Sipariş Numarası *</label>
              <input
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                placeholder="SIP-20260601-000001"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Sipariş numaranızı{" "}
                <Link href="/hesabim/siparisler" className="text-teal-600 underline">siparişlerim</Link>
                {" "}sayfasından bulabilirsiniz.
              </p>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">İade Nedeni (isteğe bağlı)</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder="İade nedeninizi kısaca açıklayın..."
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
              />
            </div>
            {result && (
              <div className={`px-4 py-3 rounded-xl text-sm ${result.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                {result.text}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting || !orderNumber.trim()}
              className="w-full bg-teal-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-50"
            >
              {submitting ? "Gönderiliyor..." : "İade Talebi Gönder"}
            </button>
          </form>
        ) : (
          // Giriş yapmamış kullanıcı: giriş yönlendirmesi
          <div className="p-6 text-center space-y-4">
            <p className="text-sm text-slate-600">
              İade talebi oluşturmak için hesabınıza giriş yapmanız gerekmektedir.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/giris?redirect=/hesabim/siparisler"
                className="bg-teal-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-teal-700 transition"
              >
                Giriş Yap
              </Link>
              <Link
                href="/siparis-sorgula"
                className="border border-slate-300 text-slate-600 text-sm px-6 py-2.5 rounded-xl hover:bg-slate-50 transition"
              >
                Misafir Sipariş Sorgula
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* İptal edilemeyen ürünler */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <p className="text-sm font-semibold text-amber-800 mb-2">İade Edilemeyen Ürünler</p>
        <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
          <li>Kişiye özel üretilen veya kişiselleştirilen ürünler</li>
          <li>Dijital içerikler ve yazılım lisansları</li>
          <li>Ambalajı açılmış kozmetik ve kişisel bakım ürünleri</li>
          <li>Son kullanma tarihi geçmiş gıda ürünleri</li>
        </ul>
      </div>

      {/* Yardım */}
      <p className="text-sm text-slate-500 text-center">
        Sorularınız için{" "}
        <Link href="/iletisim" className="text-teal-600 hover:underline font-medium">
          iletişim sayfamızı
        </Link>{" "}
        ziyaret edin veya siparişinizi{" "}
        <Link href="/siparis-sorgula" className="text-teal-600 hover:underline font-medium">
          sorgulayın
        </Link>.
      </p>
    </div>
  );
}
