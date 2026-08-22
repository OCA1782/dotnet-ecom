import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { getSettings } from "@/lib/settings";
import { getServerLang } from "@/lib/server-i18n";
import { t as translate } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, lang] = await Promise.all([getSettings(), getServerLang()]);
  const siteName = settings.SiteName ?? "";
  const title = translate(lang, "about.title");
  return {
    title,
    description: `${siteName} hakkında bilgi edinin. İletişim, politikalar ve daha fazlası.`,
  };
}

export default async function HakkimizdaPage() {
  const [settings, lang] = await Promise.all([getSettings(), getServerLang()]);
  const t = (key: string) => translate(lang, key);
  const content = settings.Page_Hakkimizda ?? "";
  const siteName = settings.SiteName ?? "";
  const email = settings.ContactEmail ?? "";
  const phone = settings.ContactPhone ?? "";
  const address = settings.Page_Iletisim_Address ?? "";

  const defaultContent = [
    `${siteName}, müşterilerine kaliteli ürünler ve güvenilir alışveriş deneyimi sunmayı hedefleyen bir e-ticaret platformudur.`,
    `Geniş ürün yelpazemiz, güvenli ödeme altyapımız ve hızlı kargo hizmetimizle müşteri memnuniyetini her zaman ön planda tutuyoruz.`,
    ``,
    `Tüm siparişlerinizde şeffaf fiyatlandırma, net iade politikası ve 14 gün iade garantisi sunulmaktadır.`,
    ``,
    `Bizimle iletişime geçmek için:`,
    ...(email ? [`E-posta: ${email}`] : []),
    ...(phone ? [`Telefon: ${phone}`] : []),
    ...(address ? [`Adres: ${address}`] : []),
  ].join("\n");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">{t("about.title")}</h1>
      <p className="text-slate-500 mb-8">{siteName} kimdir, ne yapar?</p>

      <div className="bg-white border border-teal-100 rounded-2xl shadow-sm p-8">
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
          {content || defaultContent}
        </p>
      </div>

      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        <div className="bg-white border border-teal-100 rounded-xl p-5 text-center">
          <div className="text-2xl font-bold text-teal-600 mb-1">14</div>
          <p className="text-xs text-slate-500">Gün İade Garantisi</p>
        </div>
        <div className="bg-white border border-teal-100 rounded-xl p-5 text-center">
          <div className="text-2xl font-bold text-teal-600 mb-1">SSL</div>
          <p className="text-xs text-slate-500">Güvenli Ödeme</p>
        </div>
        <div className="bg-white border border-teal-100 rounded-xl p-5 text-center">
          <div className="text-2xl font-bold text-teal-600 mb-1">3-5</div>
          <p className="text-xs text-slate-500">İş Günü Teslimat</p>
        </div>
      </div>
    </div>
  );
}
