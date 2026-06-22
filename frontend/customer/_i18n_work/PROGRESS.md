# Customer i18n Faz 1 — İlerleme Takibi

**Strateji:** Mevcut `.tsx` dosyalarına **hiç dokunulmaz**. Tüm hazırlıklar paralel dosyalarda yapılır.
**Faz 2 başlangıcı:** Kullanıcı onayı + `CustomerLanguageSwitcherEnabled = true` ile tetiklenir.

---

## Key Dosyaları (`frontend/customer/src/lib/i18n/pages/`)

| Dosya | Kapsam | Durum |
|-------|--------|-------|
| `ana-sayfa.ts` | `page.tsx` (ana sayfa) — 3 şablon + kampanya + kategori | ✅ TAMAMLANDI |
| `auth.ts` | `giris/`, `kayit/`, `sifre-sifirla/` | ✅ TAMAMLANDI |
| `sepet.ts` | `sepet/page.tsx` | ✅ TAMAMLANDI |
| `odeme.ts` | `odeme/page.tsx` | ✅ TAMAMLANDI |
| `hesabim.ts` | `hesabim/page.tsx` (profil, güvenlik, 2FA, doğrulama) | ✅ TAMAMLANDI |
| `siparisler.ts` | `hesabim/siparisler/page.tsx` + `[orderNumber]/page.tsx` | ✅ TAMAMLANDI |
| `hesabim-sub.ts` | `adresler`, `favoriler`, `faturalar`, `iadeler`, `kuponlar`, `yorumlar` | ✅ TAMAMLANDI |
| `urunler.ts` | `urunler/page.tsx`, `urun/[slug]/page.tsx`, `AddToCartButton`, `ReviewSection`, `ProductFilters` | ✅ TAMAMLANDI |
| `diger.ts` | kampanyalar, karsilastir, siparis-sorgula, kargo-takibi, iade-degisim, iletisim, sss, hakkimizda, gizlilik, kvkk, common | ✅ TAMAMLANDI |
| `index.ts` | Tüm modüllerin re-export'u + `mergeAllCustomerKeys()` | ✅ TAMAMLANDI |

**Faz 1 toplam: 9 key dosyası + 1 index = TAMAMLANDI**

---

## Tahmini Key Sayıları

| Modül | TR | EN | DE | ES |
|-------|----|----|----|----|
| ana-sayfa | ~65 | ~65 | ~65 | ~65 |
| auth | ~72 | ~72 | ~72 | ~72 |
| sepet | ~30 | ~30 | ~30 | ~30 |
| odeme | ~75 | ~75 | ~75 | ~75 |
| hesabim | ~70 | ~70 | ~70 | ~70 |
| siparisler | ~80 | ~80 | ~80 | ~80 |
| hesabim-sub | ~65 | ~65 | ~65 | ~65 |
| urunler | ~55 | ~55 | ~55 | ~55 |
| diger | ~65 | ~65 | ~65 | ~65 |
| **TOPLAM** | **~577** | **~577** | **~577** | **~577** |

---

## Faz 2 Adımları (Kullanıcı Onayı Gerekli)

1. ✅ `mergeAllCustomerKeys()` çıktısını mevcut `src/lib/i18n.ts`'teki `translations` objesine ekle — TAMAMLANDI (613 yeni key × 4 dil)
2. Sayfa sayfa `t()` çağrıları uygula:
   - [x] `app/page.tsx` → `home2.*` key'leri + `getServerLang()`/`translate()` — TAMAMLANDI (metadata, sp/mp/ts UI string'leri)
   - [x] `app/giris/page.tsx` → `auth2.login.*`, `auth2.2fa.*` — TAMAMLANDI
   - [x] `app/kayit/page.tsx` → `auth2.register.*`, `auth2.verify.*` — TAMAMLANDI
   - [x] `app/sifre-sifirla/page.tsx` → `auth2.forgot.*` — TAMAMLANDI
   - [x] `app/sepet/page.tsx` → `cart.*` — TAMAMLANDI
   - [x] `app/odeme/page.tsx` → `checkout.*` — TAMAMLANDI
   - [x] `app/hesabim/page.tsx` → `account.*` — TAMAMLANDI
   - [x] `app/hesabim/siparisler/page.tsx` → `orders.*` — TAMAMLANDI
   - [x] `app/hesabim/siparisler/[orderNumber]/page.tsx` → `orders.*` — TAMAMLANDI
   - [x] `app/hesabim/adresler/page.tsx` → `addr.*` — TAMAMLANDI
   - [x] `app/hesabim/favoriler/page.tsx` → `wishlist.*` — TAMAMLANDI
   - [x] `app/hesabim/faturalar/page.tsx` → `invoice.*` — TAMAMLANDI
   - [x] `app/hesabim/iadeler/page.tsx` → `returns.*` — TAMAMLANDI
   - [x] `app/hesabim/kuponlar/page.tsx` → `coupons.*` — TAMAMLANDI
   - [x] `app/hesabim/yorumlar/page.tsx` → `reviews.*` — TAMAMLANDI
   - [x] `app/urunler/page.tsx` → `prod2.*` — TAMAMLANDI
   - [x] `app/urun/[slug]/page.tsx` → `prod2.*` — TAMAMLANDI
   - [x] `app/urun/[slug]/AddToCartButton.tsx` → `prod2.cart.*` — TAMAMLANDI
   - [x] `app/urun/[slug]/ReviewSection.tsx` → `prod2.review.*` — TAMAMLANDI
   - [x] `app/urunler/ProductFilters.tsx` → `prod2.filter.*` — TAMAMLANDI
   - [x] `app/kampanyalar/page.tsx` → `campaigns.*` — TAMAMLANDI
   - [x] `app/karsilastir/page.tsx` → `compare.*` — TAMAMLANDI
   - [x] `app/siparis-sorgula/page.tsx` → `track.order.*` — TAMAMLANDI
   - [x] `app/kargo-takibi/page.tsx` → `track.cargo.*` — TAMAMLANDI
   - [x] `app/iade-degisim/page.tsx` → `returns.page.*` — TAMAMLANDI (broken return.* keys fixed)
   - [x] `app/iletisim/page.tsx` + `ContactForm.tsx` → `contact.*` — TAMAMLANDI
   - [x] `app/sss/page.tsx` → `faq.*` — TAMAMLANDI
   - [x] `app/hakkimizda/page.tsx` → `about.*` — TAMAMLANDI
   - [x] `app/gizlilik/page.tsx` → `privacy.*` — TAMAMLANDI
   - [x] `app/kvkk/page.tsx` → `kvkk.*` — TAMAMLANDI
3. Admin > Yönetim > Dil > `CustomerLanguageSwitcherEnabled = true` yap
4. `npm run build` çalıştır ve teyit et

---

## Notlar

- `server-i18n.ts` (`st()` fonksiyonu) — Server Component'larda `ecom_lang` cookie'sinden dil okur
- `useI18n()` → `t()` — Client Component'larda I18nContext'ten
- `home2.*` prefix — mevcut `home.*` key'leriyle çakışmamak için
- `auth2.*` prefix — mevcut `auth.*` key'leriyle çakışmamak için
- `prod2.*` prefix — mevcut `product.*` key'leriyle çakışmamak için
- Diğer tüm prefix'ler (cart, checkout, account, orders, addr, wishlist, invoice, returns, coupons, reviews, campaigns, compare, track, contact, faq, about, privacy, kvkk, common) yeni — çakışma yok
