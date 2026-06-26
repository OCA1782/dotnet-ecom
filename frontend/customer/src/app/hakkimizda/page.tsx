import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { getSettings } from "@/lib/settings";
import { getServerLang } from "@/lib/server-i18n";
import { t as translate } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  return {
    title: translate(lang, "about.title"),
    description: translate(lang, "about.title"),
  };
}

export default async function HakkimizdaPage() {
  const [settings, lang] = await Promise.all([getSettings(), getServerLang()]);
  const t = (key: string) => translate(lang, key);
  const content = settings.Page_Hakkimizda ?? "";
  const siteName = settings.SiteName ?? "";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">{t("about.title")}</h1>
      <p className="text-slate-500 mb-8">{siteName} kimdir, ne yapar?</p>

      <div className="bg-white border border-teal-100 rounded-2xl shadow-sm p-8">
        {content ? (
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{content}</p>
        ) : (
          <p className="text-center text-slate-400 py-8">{t("common.no_content")}</p>
        )}
      </div>
    </div>
  );
}
