import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { getSettings } from "@/lib/settings";
import { getServerLang } from "@/lib/server-i18n";
import { t as translate } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  return {
    title: translate(lang, "shipping.policy.title"),
    description: translate(lang, "shipping.policy.subtitle"),
  };
}

const DEFAULT_CONTENT = `Kargo ve Teslimat Politikası

1. TESLİMAT SÜRELERİ
Siparişleriniz, ödeme onayından sonra 1-2 iş günü içinde kargoya verilir. Teslimat süresi kargo firmasına ve bulunduğunuz bölgeye göre 2-3 iş günü arasında değişmektedir. Yurt içi kargo için ortalama toplam 3-5 iş günü öngörülmektedir.

2. KARGO ÜCRETLERİ
Belirli bir tutar üzerindeki siparişlerde kargo ücretsizdir. Ücretsiz kargo limiti kampanya dönemlerinde değişebilir. Standart kargo ücreti, sipariş tamamlama ekranında ayrıca gösterilmektedir.

3. KARGO FİRMALARI
Siparişleriniz Yurtiçi Kargo, MNG Kargo veya Aras Kargo aracılığıyla teslim edilmektedir. Kargo firması seçimi sipariş lokasyonuna göre belirlenir.

4. KARGO TAKİBİ
Siparişiniz kargoya verildikten sonra kayıtlı e-posta adresinize takip numarası gönderilir. Kargo takibini hesabım > siparişlerim bölümünden veya kargo firmasının web sitesinden yapabilirsiniz.

5. HASARLI VEYA EKSİK ÜRÜN
Kargo teslimatında ürünün hasarlı veya eksik geldiğini fark ederseniz kargo görevlisi ile birlikte tutanak tutunuz. Tutanak tutulmadan teslim alınan ürünler için hasar talebi oluşturulamaz. Sorun yaşamanız durumunda 24 saat içinde müşteri hizmetlerimize başvurunuz.

6. TESLİMAT ADRESİ
Sipariş verildikten sonra teslimat adresi değişikliği için müşteri hizmetlerimizle iletişime geçiniz. Kargoya verilmiş siparişlerde adres değişikliği mümkün olmayabilir.

7. OEM VE AFTERMARKET PARÇALAR
Yedek parça siparişlerinde ürünün aracınıza uyumluluğunu sipariş vermeden önce teyit etmeniz gerekmektedir. Yanlış ürün siparişlerinde iade koşullarımız geçerlidir.

8. İLETİŞİM
Teslimat ile ilgili sorularınız için iletisim sayfamızdan veya müşteri hizmetlerimizden destek alabilirsiniz.`;

export default async function TeslimatPolitikasiPage() {
  const [settings, lang] = await Promise.all([getSettings(), getServerLang()]);
  const t = (key: string) => translate(lang, key);
  const content = (settings as Record<string, string | undefined>).Page_TeslimatPolitikasi ?? DEFAULT_CONTENT;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">{t("shipping.policy.title")}</h1>
      <p className="text-slate-500 mb-8">{t("shipping.policy.subtitle")}</p>

      <div className="bg-white border border-teal-100 rounded-2xl shadow-sm p-8">
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{content}</p>
      </div>
    </div>
  );
}
