import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { getSettings } from "@/lib/settings";
import { getServerLang } from "@/lib/server-i18n";
import { t as translate } from "@/lib/i18n";
import ContactForm from "./ContactForm";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  return {
    title: translate(lang, "contact.title"),
    description: translate(lang, "contact.subtitle"),
  };
}

export default async function IletisimPage() {
  const [settings, lang] = await Promise.all([getSettings(), getServerLang()]);
  const t = (key: string) => translate(lang, key);

  const email = settings.ContactEmail ?? "";
  const phone = settings.ContactPhone ?? "";
  const address = settings.Page_Iletisim_Address ?? "";
  const hours = settings.Page_Iletisim_Hours ?? "";
  const mapUrl = settings.Page_Iletisim_MapUrl ?? "";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">{t("contact.title")}</h1>
      <p className="text-slate-500 mb-8">{t("contact.subtitle")}</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {email && (
            <div className="bg-white border border-teal-100 rounded-2xl shadow-sm p-6">
              <p className="text-xs font-semibold text-teal-500 uppercase tracking-wide mb-1">{t("contact.email_section")}</p>
              <a href={`mailto:${email}`} className="text-slate-700 hover:text-teal-600 transition font-medium">{email}</a>
            </div>
          )}
          {phone && (
            <div className="bg-white border border-teal-100 rounded-2xl shadow-sm p-6">
              <p className="text-xs font-semibold text-teal-500 uppercase tracking-wide mb-1">{t("contact.phone_section")}</p>
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-slate-700 hover:text-teal-600 transition font-medium">{phone}</a>
            </div>
          )}
          {address && (
            <div className="bg-white border border-teal-100 rounded-2xl shadow-sm p-6">
              <p className="text-xs font-semibold text-teal-500 uppercase tracking-wide mb-1">{t("contact.address_section")}</p>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{address}</p>
            </div>
          )}
          {hours && (
            <div className="bg-white border border-teal-100 rounded-2xl shadow-sm p-6">
              <p className="text-xs font-semibold text-teal-500 uppercase tracking-wide mb-1">{t("contact.hours_section")}</p>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{hours}</p>
            </div>
          )}
          {!email && !phone && !address && !hours && (
            <div className="bg-white border border-teal-100 rounded-2xl shadow-sm p-8 text-center text-slate-400">
              {t("contact.no_info")}
            </div>
          )}
        </div>

        {mapUrl && (
          <div className="bg-white border border-teal-100 rounded-2xl shadow-sm overflow-hidden min-h-[300px]">
            <iframe
              src={mapUrl}
              className="w-full h-full min-h-[300px]"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={t("contact.location_title")}
            />
          </div>
        )}
      </div>

      <div className="mt-10 bg-white border border-teal-100 rounded-2xl shadow-sm p-6 md:p-8">
        <h2 className="text-xl font-bold text-slate-700 mb-1">{t("contact.form_title")}</h2>
        <p className="text-slate-400 text-sm mb-6">{t("contact.form_desc")}</p>
        <ContactForm />
      </div>
    </div>
  );
}
