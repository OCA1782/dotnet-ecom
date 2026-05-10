# Changelog

Format: `[vX.Y.Z] YYYY-MM-DD — Başlık`
Types: Added | Changed | Fixed | Removed | Security | Deprecated

---

## [Unreleased] 2026-05-10 — Admin Panel Uyarı Sistemi & Stok Eşik

### Added
- Stok güncelleme ve yeni giriş modallarına "Kritik Eşik Seviyesi" alanı eklendi; backend `AdjustStockCommand` + `IStockService` + `StockService` güncellendi
- Siparişler listesi: satır seviyesi dinamik uyarı alt-satırı (Fragment pattern) — iade talebi kırmızı, yeni/bekleyen/askıda amber
- Siparişler listesi: liste seviyesi alarm banner — iade/askıda sayım + "Sadece iadeleri göster" butonu
- Dashboard SİPARİŞLER: alarm banner — status 9 (iade) ve 12 (askıda) sayıları, tıklanabilir link

### Changed
- Dashboard Stok alarm metni: dinamik sayım → "Tükenen ürünler var — Acil müdahale gerekiyor!" (sabit)
- Dashboard Stok başlığındaki "Stok Yönetimi" sağ linki kaldırıldı
- Dashboard: tüm bölümler (`space-y-4`) → `bg-slate-50 rounded-2xl border shadow-sm` kart + renkli pill başlık

---

## [Unreleased] 2026-05-10 — Admin Panel UI & Modals

### Added
- Dashboard: MÜŞTERİLER bölümü — SatisfactionGauge + RingMeter (aktiflik / yeni üye oranı) + SegmentBar (aktif/yeni/pasif segmentasyon)
- Dashboard: KULLANICILAR bölümü Hedefler'in altına eklendi
- `RingMeter` SVG bileşeni (animated stroke-dasharray ring chart)
- `SegmentBar` bileşeni (animated horizontal stacked bar with legend)
- Sipariş listesi: "Askıya Al" için ConfirmModal (amber temalı, sipariş no gösterir)
- Sipariş listesi: "İptal Et" için ConfirmModal (red/danger temalı, geri alınamaz uyarısı)
- `ConfirmModal`: `icon`, `cancelLabel`, `children` prop desteği; backdrop-blur; click-outside-to-close; animate-in

### Changed
- Dashboard bölüm sırası: SİPARİŞLER → GELİR → MÜŞTERİLER → HEDEFLER → KULLANICILAR
- Sipariş listesi action butonları: `w-9 h-9 rounded-xl`, size-18 ikonlar, renkli arka plan + hover solid fill + shadow
- Sipariş listesi: `window.confirm()` → `ConfirmModal` (her iki aksiyon için)

### Fixed
- Dashboard: `useCountUp` React hook JSX içinde çağrılıyordu — component top-level'e taşındı

---

## [0.15.0] 2026-05-10 — Satış Hedefleri, Hata Takibi, UI Yenileme

### Added
- `SalesGoal` entity + GoalsController (CRUD)
- `ErrorLog` entity + ErrorLogsController + `ErrorLoggingMiddleware` (4xx/5xx otomatik log)
- `UploadController` — `POST /api/admin/upload`, `wwwroot/uploads/` static file serving
- `UpdateAdminUserCommand`, `ToggleUserActiveCommand`
- `UpdateReviewCommand` (admin review düzenleme)
- `OrderStatus.OnHold` (= 12)
- `Product.IsFeatured` — `GET /api/products?featured=true` filtresi
- Admin: Hedefler sayfası, Takip sayfası
- Admin: `ImageUpload` bileşeni, `ConfirmModal` bileşeni (ilk versiyon)
- Customer: yeni hero bölümü, `ProductCard` bileşeni, `ProductImageGallery` (fullscreen + swipe), Footer yenileme

### Changed
- Dashboard query: geliştirilmiş istatistikler (aylık hedef, yorumlar, aktif kullanıcılar)

### Fixed
- EF migrations uygulandı: AddProductIsFeatured, AddSalesGoals, AddErrorLogs

---

## [0.14.0] 2026-05-10 — İyzico Ödeme Entegrasyonu

### Added
- İyzico Checkout Form API entegrasyonu (HMAC-SHA256 imzalama)
- Conditional DI: ApiKey/SecretKey boşsa MockPaymentService, doluysa IyzicoPaymentService
- `PaymentCallbackController` — idempotent callback handler

---

## [0.13.0] 2026-05-10 — SEO

### Added
- Next.js `generateMetadata` API — ürün ve kategori sayfalarında dinamik meta
- `Product.MetaTitle`, `Product.MetaDescription` alanları

---

## [0.12.0] 2026-05-10 — Ürün Yorumları

### Added
- `ProductReview` entity (verified purchase zorunlu)
- `CreateReview`, `GetProductReviews`, admin `ApproveReview`, `DeleteReview`
- Customer: `ReviewSection` bileşeni
- Admin: Yorumlar yönetim sayfası

---

## [0.11.0] 2026-05-10 — Kupon/İndirim Sistemi

### Added
- `Coupon`, `CouponUsage` entity'leri
- `CouponType` enum: Percentage, FixedAmount, FreeShipping
- `ApplyCoupon`, `RemoveCoupon` komutları
- Admin kupon CRUD + Excel import/export
- Sepet UI'da kupon uygulama

---

## [0.10.0] 2026-05-10 — E-posta Bildirimleri

### Added
- `IEmailService`, `EmailService` (MailKit)
- Dev-mode: gerçek mail yerine logger'a yazar
- ForgotPassword / ResetPassword akışı

---

## [0.9.0] 2026-05-10 — Frontend Admin Panel (ilk versiyon)

### Added
- Next.js 15 admin panel (port 3001)
- Dark sidebar layout
- Dashboard, Siparişler, Ürünler, Stok, Kullanıcılar sayfaları

---

## [0.8.0] 2026-05-10 — Frontend Customer

### Added
- Ana sayfa, ürün listesi, ürün detay, sepet, checkout
- Hesabım, adresler, giriş/kayıt sayfaları

---

## [0.1.0 – 0.7.0] 2026-05-10 — Backend Altyapı

### Added
- Clean Architecture 4-katman kurulumu
- Katalog (Category, Brand, Product, ProductVariant, ProductImage)
- Stok servisi + admin seed (admin@ecom.com / Admin1234!)
- Sepet (cookie-based guest cart + merge)
- Sipariş (CreateOrder, CancelOrder, UpdateOrderStatus, kargo no: SIP-YYYYMMDD-000001)
- Ödeme (MockPaymentService + stok kesin düşüm/serbest bırak)
- Admin backend (Dashboard, Kargo, Kullanıcı listesi)
