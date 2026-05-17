import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Bize ulaşın.",
};

export default async function IletisimPage() {
  const settings = await getSettings();

  const email = settings.ContactEmail ?? "";
  const phone = settings.ContactPhone ?? "";
  const address = settings.Page_Iletisim_Address ?? "";
  const hours = settings.Page_Iletisim_Hours ?? "";
  const mapUrl = settings.Page_Iletisim_MapUrl ?? "";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">İletişim</h1>
      <p className="text-slate-500 mb-8">Sorularınız için aşağıdaki kanallardan bize ulaşabilirsiniz.</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {email && (
            <div className="bg-white border border-teal-100 rounded-2xl shadow-sm p-6">
              <p className="text-xs font-semibold text-teal-500 uppercase tracking-wide mb-1">E-posta</p>
              <a href={`mailto:${email}`} className="text-slate-700 hover:text-teal-600 transition font-medium">{email}</a>
            </div>
          )}
          {phone && (
            <div className="bg-white border border-teal-100 rounded-2xl shadow-sm p-6">
              <p className="text-xs font-semibold text-teal-500 uppercase tracking-wide mb-1">Telefon</p>
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-slate-700 hover:text-teal-600 transition font-medium">{phone}</a>
            </div>
          )}
          {address && (
            <div className="bg-white border border-teal-100 rounded-2xl shadow-sm p-6">
              <p className="text-xs font-semibold text-teal-500 uppercase tracking-wide mb-1">Adres</p>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{address}</p>
            </div>
          )}
          {hours && (
            <div className="bg-white border border-teal-100 rounded-2xl shadow-sm p-6">
              <p className="text-xs font-semibold text-teal-500 uppercase tracking-wide mb-1">Çalışma Saatleri</p>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{hours}</p>
            </div>
          )}
          {!email && !phone && !address && !hours && (
            <div className="bg-white border border-teal-100 rounded-2xl shadow-sm p-8 text-center text-slate-400">
              Henüz iletişim bilgisi eklenmemiş.
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
              title="Konum"
            />
          </div>
        )}
      </div>
    </div>
  );
}
