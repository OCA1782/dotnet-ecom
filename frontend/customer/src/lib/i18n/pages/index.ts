// Customer i18n sayfa key'leri — merkezi re-export
// Faz 1: Paralel hazırlık dosyaları (mevcut .tsx dosyalarına dokunulmaz)
// Faz 2: Bu key'ler mevcut i18n.ts'e merge edilir ve .tsx dosyaları güncellenir

export { anaSayfaKeys } from "./ana-sayfa";
export { authKeys } from "./auth";
export { sepetKeys } from "./sepet";
export { odemeKeys } from "./odeme";
export { hesabimKeys } from "./hesabim";
export { siparislerKeys } from "./siparisler";
export { hesabimSubKeys } from "./hesabim-sub";
export { urunlerKeys } from "./urunler";
export { digerKeys } from "./diger";

// Tüm key'leri birleştiren yardımcı — Faz 2 entegrasyonunda kullanılır
import { anaSayfaKeys } from "./ana-sayfa";
import { authKeys } from "./auth";
import { sepetKeys } from "./sepet";
import { odemeKeys } from "./odeme";
import { hesabimKeys } from "./hesabim";
import { siparislerKeys } from "./siparisler";
import { hesabimSubKeys } from "./hesabim-sub";
import { urunlerKeys } from "./urunler";
import { digerKeys } from "./diger";

export type Lang = "tr" | "en" | "de" | "es";

const SOURCES = [
  anaSayfaKeys,
  authKeys,
  sepetKeys,
  odemeKeys,
  hesabimKeys,
  siparislerKeys,
  hesabimSubKeys,
  urunlerKeys,
  digerKeys,
];

export function mergeAllCustomerKeys(): Record<Lang, Record<string, string>> {
  const langs: Lang[] = ["tr", "en", "de", "es"];
  const merged: Record<Lang, Record<string, string>> = { tr: {}, en: {}, de: {}, es: {} };
  for (const source of SOURCES) {
    for (const lang of langs) {
      Object.assign(merged[lang], source[lang]);
    }
  }
  return merged;
}
