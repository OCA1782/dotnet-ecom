import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ödeme Başarısız",
  robots: { index: false },
};

export default function PaymentFailurePage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-zinc-900">Ödeme Başarısız</h1>
        <p className="text-zinc-600">
          Ödeme işlemi tamamlanamadı. Kart bilgilerinizi kontrol edip tekrar deneyebilirsiniz.
        </p>
      </div>

      <div className="flex gap-3 justify-center pt-2">
        <Link
          href="/sepet"
          className="bg-zinc-900 text-white px-6 py-2.5 rounded-lg hover:bg-zinc-700 transition text-sm font-semibold"
        >
          Sepete Dön
        </Link>
        <Link
          href="/hesabim/siparisler"
          className="border border-zinc-300 text-zinc-700 px-6 py-2.5 rounded-lg hover:bg-zinc-50 transition text-sm"
        >
          Siparişlerim
        </Link>
      </div>
    </div>
  );
}
