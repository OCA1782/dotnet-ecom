import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular",
  description: "Merak ettiğiniz sorular ve cevapları.",
};

type FaqItem = { q: string; a: string };

export default async function SSSPage() {
  const settings = await getSettings();
  let items: FaqItem[] = [];
  try { items = JSON.parse(settings.Page_SSS ?? "[]"); } catch { items = []; }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Sıkça Sorulan Sorular</h1>
      <p className="text-slate-500 mb-8">En çok sorulan soruları ve cevaplarını aşağıda bulabilirsiniz.</p>

      {items.length === 0 ? (
        <p className="text-center text-slate-400 py-16">Henüz içerik eklenmemiş.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <details key={i} className="group bg-white border border-teal-100 rounded-2xl overflow-hidden shadow-sm">
              <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer font-semibold text-slate-800 hover:text-teal-700 transition-colors [list-style:none] [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <span className="shrink-0 text-teal-500 group-open:rotate-180 transition-transform duration-200 text-lg leading-none">▾</span>
              </summary>
              <div className="px-6 pb-5 pt-4 text-sm text-slate-600 leading-relaxed whitespace-pre-line border-t border-teal-50">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
