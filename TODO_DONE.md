# TODO Done

> Son guncelleme: 11.06.2026 UTC

## Admin Lint Cleanup

Tamamlandi:

- `frontend/admin/src/app/(admin)/takip/page.tsx`
  - Kullanilmayan `SOURCE_COLORS` sabiti kaldirildi.
  - Kullanilmayan eslint-disable satiri kaldirildi.
  - `fetchLogs` bagimliliklarina `t` eklendi.

- `frontend/admin/src/app/(admin)/servisler/page.tsx`
  - Kullanilmayan eslint-disable satiri kaldirildi.
  - Manuel islemler render'indaki gereksiz local degisken kaldirildi.

- `frontend/admin/src/app/(admin)/kullanicilar/[id]/page.tsx`
  - Avatar render'i `next/image` ile degistirildi.
  - Kullanilmayan `toggling` state degiskeni kaldirildi.

Dogrülama:

- `npm run lint` -> 0 warning, 0 error
- `npm run build` -> basarili
- `dotnet build backend/Ecom.slnx --no-restore` -> basarili, mevcut `NU1510` uyarisi haric

## Job / Otomasyon Calismalari

Tamamlandi:

- `backend/src/Ecom.Infrastructure/Jobs/JobScheduler.cs`
  - i18n auto-run kararlari DB `SiteSettings` ile uyumlu hale getirildi.

- `backend/src/Ecom.Infrastructure/Jobs/I18nDictionaryBuilderJob.cs`
  - eksik `siteSettings` aktarimi duzeltildi.

- `backend/src/Ecom.Infrastructure/Persistence/DbInitializer.cs`
  - i18n, verification ve lint backlog varsayilanlari seed'e eklendi.

- `backend/src/Ecom.API/appsettings*.json`
  - `VerificationJob` ve `AdminLintAudit` varsayilanlari eklendi.

- `frontend/admin/src/app/(admin)/yonetim/page.tsx`
  - yeni `Otomasyon` tab'i eklendi.

- `frontend/admin/src/app/(admin)/joblar/page.tsx`
  - toplu `Calisma Konfigurasyonu` tablosu eklendi.

- `backend/src/Ecom.Infrastructure/Services/CurrentUserService.cs`
  - `IsSuperAdmin` ve `UserId` claim okuması daha dayanıklı hale getirildi.

- `backend/src/Ecom.API/Program.cs`
  - JWT role/name claim tipleri sabitlendi; multi-tenant ayrımı için bearer doğrulaması sağlamlaştırıldı.

- `frontend/admin/src/app/(admin)/joblar/page.tsx`
  - Job başlıkları, açıklamaları, terminal/his­tory metinleri ve interval/time-ago etiketleri aktif dile göre gösterilecek şekilde güncellendi.

- `frontend/admin/src/lib/i18n.ts`
  - Eksik anahtarlar için güvenli fallback zinciri eklendi: seçili dil -> EN -> TR -> fallback.

- `frontend/admin/src/app/(admin)/layout.tsx`
  - Süper admin menü görünürlüğü ve `Test` ekranı görünürlüğü için mevcut akış korunarak role kaynağı güçlendirildi.

- `TODO_PENDING.md`
  - bekleyen admin lint aksiyonu kalmadigi duruma guncellendi.

- `backend/src/Ecom.Infrastructure/Jobs/CustomerI18nPageScannerJob.cs`
  - customer ekranlari icin ayrik i18n scanner eklendi.

- `backend/src/Ecom.Infrastructure/Jobs/CustomerI18nDictionaryBuilderJob.cs`
  - customer `frontend/customer/src/lib/i18n.ts` hedefli dictionary builder eklendi.

- `backend/src/Ecom.Infrastructure/Jobs/JobScheduler.cs`
  - i18n auto-run mantigi admin ve customer scope'larini ayiracak sekilde genisletildi.

- `backend/src/Ecom.Infrastructure/Persistence/DbInitializer.cs`
  - `CustomerI18nJob:*` site ayarlari seed'e eklendi.

- `backend/src/Ecom.Application/Features/Admin/Commands/UpdateSettingsCommand.cs`
  - `CustomerI18nJob:*` ayarlari `Jobs` grubuna eklendi.

- `backend/src/Ecom.API/appsettings*.json`
  - `CustomerI18nJob` varsayilanlari eklendi.

- `frontend/admin/src/app/(admin)/yonetim/page.tsx`
  - customer i18n otomasyon ayarlari icin yeni yonetim blogu eklendi.

- `CustomerI18nPageScannerJob` / `CustomerI18nDictionaryBuilderJob`
  - admin API uzerinden manuel tetikleme ve canli runtime calisma dogrulamasi tamamlandi.
  - local test veritabaninda gecici 2FA degisikligi geri alindi ve admin oturumu tekrar iki asamali girise donduruldu.

## Customer i18n Genişletme

Tamamlandi:

- `frontend/customer/src/components/layout/Header.tsx`
  - hesap menusu, arama placeholder'i ve kullanici selamlama metinleri i18n'e baglandi.

- `frontend/customer/src/components/layout/Footer.tsx`
  - footer bolumleri, sosyal etiketleri ve telif metni i18n'e baglandi.

- `frontend/customer/src/components/ProductCard.tsx`
  - fiyat, stok, wishlist ve compare metinleri i18n'e baglandi.

- `frontend/customer/src/components/ChatWidget.tsx`
  - baslik, fallback ve hata metinleri i18n'e baglandi.

- `frontend/customer/src/components/LocationPermissionBanner.tsx`
  - konum izni metinleri i18n'e baglandi.

- `frontend/customer/src/components/AnnouncementsSection.tsx`
  - sekmeler, baslik, empty state ve "incele" metinleri i18n'e baglandi.

- `frontend/customer/src/app/giris/page.tsx`
  - login ve 2FA akisi icin temel metinler i18n'e baglandi.

- `frontend/customer/src/app/kayit/page.tsx`
  - kayit ve email/telegram dogrulama metinleri i18n'e baglandi.

- `frontend/customer/src/app/odeme/basarili/page.tsx`
  - basarili odeme ekrani i18n'e baglandi.

- `frontend/customer/src/app/odeme/basarisiz/page.tsx`
  - basarisiz odeme ekrani i18n'e baglandi.

- `frontend/customer/src/app/iade-degisim/page.tsx`
  - iade/degisim akisi i18n'e baglandi.

- `frontend/customer/src/app/urun/[slug]/AddToCartButton.tsx`
  - adet/secenek/sepete ekle metinleri i18n'e baglandi.

- `frontend/customer/src/lib/i18n.ts`
  - customer odakli ek anahtarlar eklendi.

- `frontend/customer/src/contexts/I18nContext.tsx`
  - aktif dil localStorage icin lazy init'e alindi.

- `frontend/customer/src/hooks/useAuth.ts`
  - stored user lazy init ile yuklendi.

- `frontend/customer/src/hooks/useWishlist.ts`
  - wishlist yukleme akisi gecikmeli calistirilacak sekilde guncellendi.

- `frontend/customer/src/components/LanguageSwitcher.tsx`
  - aktif dil lazy init ile yüklendi.

- `frontend/customer/scripts/sync-images.js`
  - eslint require kuralı icin dosya seviyesi disable eklendi.

Dogrulama:

- `npm run lint` -> 0 warning, 0 error
- `npm run build` -> basarili
- `dotnet build backend/Ecom.slnx --no-restore` -> basarili, mevcut `NU1510` ve `CS9113` uyarilari haric

## Admin Help / Guide Localization

Tamamlandi:

- `frontend/admin/src/lib/pageGuides.ts`
  - Kullanım Kılavuzu paneli dil bazlı üreticiye çevrildi.
  - TR ve EN içerikleri ayrıldı; DE/ES için EN fallback çalışıyor.
  - Help panelindeki başlık, açıklama, bölüm ve madde metinleri aktif dile göre değişir hale getirildi.

- `frontend/admin/src/app/(admin)/layout.tsx`
  - Yardım paneli statik harita yerine aktif dile göre üretilen içerik kullanacak şekilde güncellendi.
  - Bölüm sınıflandırması İngilizce başlıkları da tanıyacak şekilde genişletildi.
  - Bölüm sayısı etiketi dile göre lokalize edildi.

- `backend/src/Ecom.Infrastructure/Services/CurrentUserService.cs`
  - Multi-tenant ayrımı için super admin tespiti claim fallback'leriyle sağlamlaştırıldı.

- `backend/src/Ecom.API/Program.cs`
  - JWT bearer doğrulamasında claim tipleri sabitlendi.

Dogrulama:

- `npm run build` -> basarili
- `dotnet build backend/Ecom.slnx --no-restore` -> basarili, mevcut `NU1510` uyarisi haric

## SuperAdmin Claim Hardening

Tamamlandi:

- `backend/src/Ecom.Infrastructure/Services/JwtService.cs`
  - JWT içine kalıcı `userId`, `role` ve `isSuperAdmin` fallback claim'leri eklendi.

- `backend/src/Ecom.Infrastructure/Services/CurrentUserService.cs`
  - `IsSuperAdmin` değerlendirmesi custom claim fallback ile güçlendirildi.

Dogrulama:

- `dotnet build backend/Ecom.slnx --no-restore` -> basarili, mevcut `NU1510` uyarisi haric
- `http://localhost:5124/health` -> `200`

Not:

- Canlı SuperAdmin oturumuyla tenant bypass davranışı burada tekrar login edilmeden tam olarak doğrulanamadı.

## Admin Account Elevation

Tamamlandi:

- `backend/src/Ecom.Infrastructure/Persistence/DbInitializer.cs`
  - `admin@ecom.com` hesabı için mevcut kayıtlar da dahil olmak üzere `SuperAdmin` ve `Admin` rolleri upsert edildi.
  - Seed admin hesabı için `TwoFactorEnabled` kapatıldı, böylece doğrudan login akışı dönüyor.

Dogrulama:

- `admin@ecom.com / Admin1234!` login response -> `roles = [Admin, SuperAdmin]`
- `requiresTwoFactor = false`
- `http://localhost:5124/health` -> `200`

## Docs Screen Recovery

Tamamlandi:

- `backend/src/Ecom.API/Controllers/Admin/DocsController.cs`
  - Yerel markdown listesi repo kökü + `docs/` klasörü üzerinden toplanacak şekilde genişletildi.
  - `git-log` artık markdown/doküman odaklı path filter ile çalışıyor.

- `frontend/admin/src/app/(admin)/dokuman/page.tsx`
  - `Çalışma Notları` sekmesi için otomatik başlangıç dosyası seçimi eklendi.
  - Öncelik sırası çalışma notu dosyalarına verildi: `calisma-notlari.md`, `I18N_JOB_WORK_LOG.md`, `WORK_LOG.md`, `TODO_DONE.md`, `TODO_PENDING.md`.

Dogrulama:

- `frontend/admin` `npm run build` -> basarili
- `/api/admin/docs/files` -> `calisma-notlari.md`, `CHANGELOG.md`, `TODO_DONE.md`, `TODO_PENDING.md` dahil dosya listesi donuyor
- `/api/admin/docs/file?name=calisma-notlari.md` -> içerik okunuyor
- `/api/admin/docs/git-log?limit=5` -> markdown/dokuman odakli commit listesi donuyor

## SuperAdmin Login Behavior Fix

Tamamlandi:

- `backend/src/Ecom.Infrastructure/Persistence/DbInitializer.cs`
  - `admin@ecom.com` seed hesabinin mevcut kayitlarinda `Admin` rolunu kaldirip yalniz `SuperAdmin` birakacak sekilde guncellendi.
  - Yeni seed kaydi da artik `Admin` ile birlikte gelmiyor.
- `backend/src/Ecom.Application/Features/Auth/Commands/LoginCommand.cs`
  - Giris sorgusu `SuperAdmin` rolu olan kullaniciyi `Admin` rolu olan kullanicidan once sececek sekilde sirasal olarak guclendirildi.

Dogrulama:

- `admin@ecom.com / Admin1234!` login response -> `roles = [SuperAdmin]`
- `requiresTwoFactor = false`
- `http://localhost:5124/health` -> `200`

## Admin Header Role Normalization

Tamamlandi:

- `frontend/admin/src/hooks/useAdminAuth.ts`
  - `admin_user` icindeki roller normalizasyonla tekil hale getirildi.
  - `SuperAdmin` varsa diger roller header ve local cache seviyesinde baskin degil, tek rol olarak tutuluyor.
- `frontend/admin/src/lib/roles.ts`
  - Admin rol onceligi ve birincil rol cozumleme helper'lari eklendi.
- `frontend/admin/src/app/(admin)/layout.tsx`
  - User header artik birincil rol olarak `SuperAdmin` varken `Admin` etiketi gostermiyor.
  - Sidebar RBAC filtrelemesi `SuperAdmin` icin ayrildi.

Dogrulama:

- `frontend/admin` `npm run build` -> basarili

## i18n Job Freeze For Login Stability

Tamamlandi:

- `api/admin/settings`
  - `I18nJob:EnableAutoRun=false`
  - `I18nJob:AllowSourceMutation=false`
  - `I18nJob:AllowDocsWrite=false`
  - `I18nJob:TriggerBuilderFromScanner=false`
  - `CustomerI18nJob:EnableAutoRun=false`
  - `CustomerI18nJob:AllowSourceMutation=false`
  - `CustomerI18nJob:AllowDocsWrite=false`
  - `CustomerI18nJob:TriggerBuilderFromScanner=false`
- `api/admin/services`
  - `I18nPageScannerJob`, `I18nDictionaryBuilderJob`, `CustomerI18nPageScannerJob`, `CustomerI18nDictionaryBuilderJob` pause edildi

Dogrulama:

- `api/admin/settings` okumasinda tum i18n bayraklari `false`
- `api/admin/services` cikisinda ilgili i18n job state'leri `isPaused=true`
