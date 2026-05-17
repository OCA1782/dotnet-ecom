import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Kargo Takibi",
  description: "Kargo takibi ve teslimat hakkında bilgi alın.",
};

export default async function KargoTakibiPage() {
  const settings = await getSettings();
  const content = settings.Page_KargoTakibi ?? "";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Kargo Takibi</h1>
      <p className="text-slate-500 mb-8">Siparişinizin kargo durumunu takip etme ve teslimat süreçleri.</p>

      <div className="bg-white border border-teal-100 rounded-2xl shadow-sm p-8">
        {content ? (
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{content}</p>
        ) : (
          <p className="text-center text-slate-400 py-8">Henüz içerik eklenmemiş.</p>
        )}
      </div>
    </div>
  );
}
