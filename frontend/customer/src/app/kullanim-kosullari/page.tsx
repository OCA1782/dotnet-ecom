import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { getSettings } from "@/lib/settings";
import { getServerLang } from "@/lib/server-i18n";
import { t as translate } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  return {
    title: translate(lang, "terms.title"),
    description: translate(lang, "terms.subtitle"),
  };
}

const DEFAULT_CONTENT = `Kullanım Koşulları

Son Güncelleme: Ağustos 2024

Bu web sitesini kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız. Lütfen dikkatlice okuyun.

1. GENEL
Bu site, otomotiv yedek parça satışı amacıyla işletilmektedir. Sitemizde sunulan içerik, ürün ve hizmetler Türkiye Cumhuriyeti yasalarına tabidir.

2. ÜRÜN UYUMLULUĞU
Satın almadan önce yedek parçanın aracınızın markası, modeli, yılı ve motor tipine uygun olduğundan emin olmanız kullanıcının sorumluluğundadır. Ürün uyumsuzluğundan kaynaklanan sorunlarda site sorumluluğu kabul etmez. Uyumluluk konusunda emin değilseniz ürün açıklamasını veya müşteri hizmetlerimizi inceleyiniz.

3. FİYATLAR VE STOK
Ürün fiyatları ve stok durumu önceden bildirim yapılmaksızın değiştirilebilir. Sipariş oluşturulduktan sonra fiyat değişikliği yapılmaz. Stok tükenmesi durumunda sipariş iptal edilebilir ve ücret iade edilir.

4. KULLANICI HESABI
Hesap güvenliğinden kullanıcı sorumludur. Şüpheli bir durum tespit ettiğinizde derhal şifrenizi değiştirip bize bildirmeniz gerekmektedir. Yanıltıcı bilgi ile oluşturulan hesaplar silinebilir.

5. FİKRİ MÜLKİYET
Sitede yer alan tüm içerik, logo, görsel ve metinler telif hakkı kapsamındadır. İzinsiz kopyalanması, dağıtılması veya ticari amaçla kullanılması yasaktır.

6. SORUMLULUK SINIRLAMASI
Siteyi kullanımınızdan doğabilecek doğrudan veya dolaylı zararlardan, yasal olarak zorunlu haller dışında, sorumluluk kabul edilmez. Site içeriğinin doğruluğu için azami özen gösterilmekle birlikte mutlak doğruluk garanti edilmez.

7. UYGULANACAK HUKUK
Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.

8. DEĞİŞİKLİKLER
Bu kullanım koşulları önceden haber vermeksizin güncellenebilir. Güncel koşullar her zaman bu sayfada yayımlanmaktadır.

9. İLETİŞİM
Kullanım koşullarına ilişkin sorularınız için iletisim sayfamızdan bize ulaşabilirsiniz.`;

export default async function KullanimKosullariPage() {
  const [settings, lang] = await Promise.all([getSettings(), getServerLang()]);
  const t = (key: string) => translate(lang, key);
  const content = (settings as Record<string, string | undefined>).Page_KullanimKosullari ?? DEFAULT_CONTENT;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">{t("terms.title")}</h1>
      <p className="text-slate-500 mb-8">{t("terms.subtitle")}</p>

      <div className="bg-white border border-teal-100 rounded-2xl shadow-sm p-8">
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{content}</p>
      </div>
    </div>
  );
}
