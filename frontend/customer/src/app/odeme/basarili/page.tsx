import Link from "next/link";
import type { Metadata } from "next";
import { st } from "@/lib/server-i18n";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await st("payment.success.title"),
    robots: { index: false },
  };
}

export default async function PaymentSuccessPage() {
  const heading = await st("payment.success.heading");
  const desc = await st("payment.success.desc");
  const orders = await st("payment.success.orders");
  const continueLabel = await st("payment.success.continue");

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">{heading}</h1>
        <p className="text-slate-600">{desc}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Link
          href="/hesabim/siparisler"
          className="w-full sm:w-auto bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition text-sm font-semibold text-center"
        >
          {orders}
        </Link>
        <Link
          href="/urunler"
          className="w-full sm:w-auto border border-slate-300 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-50 transition text-sm text-center"
        >
          {continueLabel}
        </Link>
      </div>
    </div>
  );
}
