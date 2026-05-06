import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ödeme Başarılı",
  robots: { index: false },
};

export default function PaymentSuccessPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-zinc-900">Ödemeniz Alındı!</h1>
        <p className="text-zinc-600">
          Siparişiniz başarıyla oluşturuldu. Onay e-postası kısa süre içinde iletilecek.
        </p>
      </div>

      <div className="flex gap-3 justify-center pt-2">
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
