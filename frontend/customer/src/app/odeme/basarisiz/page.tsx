import Link from "next/link";
import type { Metadata } from "next";
import { st } from "@/lib/server-i18n";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await st("payment.failure.title"),
    robots: { index: false },
  };
}

export default async function PaymentFailurePage() {
  const heading = await st("payment.failure.heading");
  const desc = await st("payment.failure.desc");
  const cart = await st("payment.failure.cart");
  const orders = await st("payment.failure.orders");

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">{heading}</h1>
        <p className="text-slate-600">{desc}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Link
          href="/sepet"
          className="w-full sm:w-auto bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition text-sm font-semibold text-center"
        >
          {cart}
        </Link>
        <Link
          href="/hesabim/siparisler"
          className="w-full sm:w-auto border border-slate-300 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-50 transition text-sm text-center"
        >
          {orders}
        </Link>
      </div>
    </div>
  );
}
