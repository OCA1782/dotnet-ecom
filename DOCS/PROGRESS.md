# E-Ticaret Projesi — Geliştirme Durumu

> Bu dosya her adım sonunda güncellenir.
> Yeni bir session başladığında ilk olarak bu dosyayı oku.
> Proje dizini: `C:\PROJECTS\DOTNET\Ecom\`

---

## Proje Özeti

- **Backend:** .NET 10, ASP.NET Core Web API, Clean Architecture
- **Frontend:** TypeScript, Next.js 15
- **Veritabanı:** SQL Server LocalDB (dev) → `EcomDb`
- **Çözüm dosyası:** `C:\PROJECTS\DOTNET\Ecom\backend\Ecom.slnx`
- **API başlatma:** `dotnet run --project src/Ecom.API` (backend dizininden)
- **API portu:** http://localhost:5200 (veya launchSettings'deki port)

---

## Mimari Notlar

```
backend/
├── Ecom.slnx
└── src/
    ├── Ecom.Domain/          # Entity'ler, Enum'lar, BaseEntity
    ├── Ecom.Application/     # Interfaces, MediatR commands/queries, FluentValidation
    ├── Ecom.Infrastructure/  # EF Core DbContext, JWT, BCrypt, Audit, CurrentUser
    └── Ecom.API/             # Controllers, Middleware, Program.cs
```

**Bağımlılık akışı:** Domain ← Application ← Infrastructure ← API

**Kritik iş kuralları (değiştirme):**
- Stok: Sepette düşülmez → sipariş oluşunca rezerve → ödeme başarılıysa kesin düşüm
- Sipariş numarası: `SIP-{YYYYMMDD}-{6 haneli sıra}`
- Sipariş satırı: ürün adı, SKU, fiyat, KDV snapshot olarak kopyalanır
- Adres: siparişe snapshot kopyalanır
- Ürün silinemez, pasif yapılır

---

## ADIM DURUMU

### ✅ ADIM 1 — Backend Altyapı (TAMAMLANDI)

**Tarih:** 2026-05-06

**Ne yapıldı:**
- `Ecom.slnx` solution oluşturuldu
- 4 proje: Domain, Application, Infrastructure, API
- NuGet paketleri: EF Core 9.0.4, MediatR 12.4.1, FluentValidation 11.11.0, BCrypt.Net-Next 4.0.3, JWT Bearer 9.0.4
- Clean Architecture referans zinciri kuruldu

**Domain entity'leri (tümü `src/Ecom.Domain/Entities/`):**
- `User`, `UserRole`, `UserAddress`
- `Category`, `Brand`
- `Product`, `ProductImage`, `ProductVariant`
- `Stock`, `StockMovement`
- `Cart`, `CartItem`
- `Order`, `OrderItem`, `OrderStatusHistory`
- `Payment`, `Shipment`
- `AuditLog`, `SiteSetting`

**Enum'lar (`src/Ecom.Domain/Enums/`):**
- `UserRole`, `OrderStatus`, `PaymentStatus`, `ShipmentStatus`
- `StockMovementType`, `ProductType`, `InvoiceType`, `PaymentMethod`

**Application katmanı:**
- Interfaces: `IApplicationDbContext`, `IJwtService`, `IPasswordService`, `IAuditService`, `ICurrentUserService`
- Models: `Result<T>`, `Result`, `PaginatedList<T>`
- Features: `RegisterCommand`, `LoginCommand` (MediatR + FluentValidation)

**Infrastructure katmanı:**
- `ApplicationDbContext` (EF Core, soft-delete global filter)
- EF Configurations: User, Product, Category, Order, Stock, ProductVariant, Shipment, Payment, OrderItem, CartItem
- Services: `PasswordService` (BCrypt), `JwtService`, `AuditService`, `CurrentUserService`

**API katmanı:**
- `Program.cs`: JWT Bearer, CORS, Authentication/Authorization
- `ValidationExceptionMiddleware`
- `AuthController`: POST `/api/auth/register`, POST `/api/auth/login`

**Veritabanı:**
- EF Core Migration: `InitialCreate` — uygulandı
- LocalDB: `EcomDb` oluşturuldu ve tablolar hazır

**Test:** `POST /api/auth/register` → JWT token döndü ✅

---

### ✅ ADIM 2 — Katalog Modülü (TAMAMLANDI)

**Tarih:** 2026-05-06

**Ne yapıldı:**

**Application Features:**
- `Features/Categories/Queries/GetCategoriesQuery.cs` — ağaç yapısı (recursive BuildTree)
- `Features/Categories/Commands/CreateCategoryCommand.cs` — slug unique check
- `Features/Categories/Commands/UpdateCategoryCommand.cs` — döngüsel parent kontrolü
- `Features/Categories/Commands/DeleteCategoryCommand.cs` — aktif ürün/alt kategori koruması
- `Features/Brands/Queries/GetBrandsQuery.cs` — sayfalı listeleme
- `Features/Brands/Commands/CreateBrandCommand.cs`
- `Features/Brands/Commands/UpdateBrandCommand.cs`
- `Features/Products/Queries/GetProductsQuery.cs` — filtre, sayfalama, admin/public ayrımı
- `Features/Products/Queries/GetProductBySlugQuery.cs` — varyant + stok dahil detay
- `Features/Products/Commands/CreateProductCommand.cs` — otomatik Stock kaydı oluşturur
- `Features/Products/Commands/UpdateProductCommand.cs` — fiyat değişikliği ayrıca loglanır
- `Features/Products/Commands/DeactivateProductCommand.cs` — soft delete

**API Controllers:**
- `CategoriesController`: GET /api/categories, POST, PUT, DELETE
- `BrandsController`: GET /api/brands, POST, PUT
- `ProductsController`: GET /api/products, GET /api/products/{slug}, POST, PUT, DELETE

**Test:** Login + JWT → Category oluşturma (rol kontrolü → 403 Forbidden ✅) → List ✅

**Not:** Test kullanıcısı Customer rolünde. Admin kullanıcı oluşturmak için bkz. Adım 3 notları.

---

### ✅ ADIM 3 — Stok Yönetimi + Admin Seed + ProductVariant API (TAMAMLANDI)

**Tarih:** 2026-05-06

**Ne yapıldı:**
- `DbInitializer.cs` — startup'ta admin seed + SiteSettings seed
- `appsettings.json` — `Seed:AdminEmail` / `Seed:AdminPassword` (admin@ecom.com / Admin1234!)
- `IStockService` interface + `StockService` impl — Reserve/Confirm/Release/Return/Adjust
- `AdjustStockCommand` — MediatR + FluentValidation
- `GetStocksQuery` — sayfalı, kritik stok filtreli
- `GetStockMovementsQuery` — hareket geçmişi
- `CreateVariantCommand` / `UpdateVariantCommand` — otomatik Stock kaydı
- `AddProductImageCommand` / `DeleteProductImageCommand`
- `StocksController`: GET /api/admin/stocks, GET movements, POST adjust
- `ProductVariantsController`: POST/PUT /api/products/{id}/variants
- `ProductImagesController`: POST/DELETE /api/products/{id}/images

**Test:** Admin login ✅, Kategori oluştur ✅, Marka oluştur ✅, Listele ✅, AuditLog ✅

---

### ✅ ADIM 4 — Sepet Yönetimi (TAMAMLANDI)

**Tarih:** 2026-05-06

**Ne yapıldı:**

**Application Features:**
- `Features/Cart/Queries/GetCartQuery.cs` — CartDto: subTotal, taxAmount, shippingAmount (≥500→0 / <500→29.90 TRY), grandTotal
- `Features/Cart/Commands/AddToCartCommand.cs` — ürün geçerliliği + DiscountPrice?Price, aynı ürün varsa adet artır
- `Features/Cart/Commands/UpdateCartItemCommand.cs` — sahiplik (UserId veya SessionId) kontrolü
- `Features/Cart/Commands/RemoveFromCartCommand.cs` — sahiplik kontrolü
- `Features/Cart/Commands/ClearCartCommand.cs` — tüm kalemleri sil
- `Features/Cart/Commands/MergeGuestCartCommand.cs` — login sonrası misafir sepetini kullanıcıya birleştir

**API Controller:**
- `CartController.cs`: GET/POST/PUT/DELETE /api/cart, POST /api/cart/merge
- Misafir sepeti: `guest_session_id` cookie (HttpOnly, 30 gün)
- Otomatik cookie oluşturma + merge sonrası silme

**Test Sonuçları (canlı API):**
- GET /api/cart (misafir) ✅
- POST /api/cart/add — ürün eklendi, cartId döndü ✅
- GET /api/cart — items, lineTotal, subTotal, taxAmount, shippingAmount=0 (≥500 TRY), grandTotal ✅
- PUT /api/cart/update — adet 2→3, lineTotal güncellendi ✅
- POST /api/cart/merge — misafir sepet kullanıcıya taşındı ✅
- DELETE /api/cart/clear — sepet temizlendi, shippingAmount=29.90 görüldü ✅

---

### ✅ ADIM 5 — Sipariş ve Checkout (TAMAMLANDI)

**Tarih:** 2026-05-06

**Ne yapıldı:**

**Application Features:**
- `Features/Addresses/Queries/GetAddressesQuery.cs` — kullanıcının adres listesi
- `Features/Addresses/Commands/CreateAddressCommand.cs` — varsayılan adres yönetimi (tek varsayılan korunur)
- `Features/Addresses/Commands/UpdateAddressCommand.cs`
- `Features/Addresses/Commands/DeleteAddressCommand.cs` — soft delete
- `Features/Orders/Commands/CreateOrderCommand.cs` — stok rezervasyonu, adres snapshot, sepet temizleme, sipariş no üretimi
- `Features/Orders/Commands/CancelOrderCommand.cs` — stok serbest bırakma (ReserveReservationAsync)
- `Features/Orders/Commands/UpdateOrderStatusCommand.cs` — izin verilen geçiş tablosu ile admin durum güncelleme
- `Features/Orders/Queries/GetOrderQuery.cs` — detay (sahiplik kontrolü + admin erişim)
- `Features/Orders/Queries/GetMyOrdersQuery.cs` — sayfalı kullanıcı siparişleri
- `Features/Orders/Queries/GetAdminOrdersQuery.cs` — admin listesi (status/arama filtresi)

**API Controllers:**
- `AddressesController`: GET/POST/PUT/DELETE /api/addresses [Authorize]
- `OrdersController`: POST/GET /api/orders, GET /api/orders/my, POST cancel
- Admin: GET /api/orders/admin/list, GET /api/orders/admin/{orderNumber}, PUT /api/orders/admin/{id}/status, POST cancel

**Kritik düzeltme:** StockService.SaveChangesAsync içindeki batch çakışması → CancelOrderHandler'da önce sipariş kaydet, sonra stok serbest bırak

**Test Sonuçları (canlı API):**
- POST /api/addresses — adres oluşturuldu ✅
- GET /api/addresses — listelendi ✅
- POST /api/orders — sipariş oluştu, SIP-20260506-000001 ✅
- GET /api/orders/SIP-20260506-000001 — detay + statusHistory ✅
- GET /api/orders/my — sayfalı liste ✅
- PUT /api/orders/admin/{id}/status — Created→PaymentPending ✅, geçersiz geçiş engellendi ✅
- POST /api/orders/{id}/cancel — iptal, stok serbest bırakıldı (4→3 rezerve) ✅
- Sipariş sonrası sepet temizlendi ✅
- Stok rezervasyonu: 10 adet, 2 rezerve, 8 kullanılabilir ✅

---

### ✅ ADIM 6 — Ödeme Entegrasyonu (TAMAMLANDI)

**Tarih:** 2026-05-06

**Ne yapıldı:**
- `IPaymentService` interface — InitiateAsync + VerifyCallbackAsync
- `MockPaymentService` — geliştirme ortamı için, gerçek entegrasyon (İyzico/Stripe) buraya
- `InitiatePaymentCommand` — ödeme başlat, Payment kaydı oluştur, idempotency key
- `PaymentCallbackCommand` — idempotent işlem, başarı→StockService.ConfirmAsync, başarısız→ReleaseReservationAsync
- `PaymentsController`: POST /api/payments/initiate [Authorize], POST /api/payments/callback [AllowAnonymous]
- Infrastructure DI: `IPaymentService` → `MockPaymentService` kaydı

**Test Sonuçları (canlı API):**
- POST /api/payments/initiate → transactionId döndü ✅
- POST /api/payments/callback (success) → status=PaymentCompleted, paymentStatus=Paid ✅
- Stok kesin düşüm: 10→9 adet, rezervasyon serbest (4→3) ✅
- POST /api/payments/callback (fail) → status=Failed, paymentStatus=Failed ✅
- Başarısız ödeme stok serbest bırakma: reservedQuantity 4→3 ✅
- Idempotency: aynı txn tekrar gelince işlem tekrar edilmiyor ✅

---

### ✅ ADIM 7 — Admin Panel Backend (TAMAMLANDI)

**Tarih:** 2026-05-06

**Ne yapıldı:**
- `CreateShipmentCommand` — kargo ekle, sipariş durumunu Shipped'e günceller, StatusHistory yazar
- `GetDashboardQuery` — bugünkü satış, sipariş sayısı, bekleyen, kritik stok, aylık özet, son 10 sipariş
- `GetUsersQuery` — sayfalı + arama, her kullanıcının rolleri ile birlikte
- `ShipmentsController` — POST /api/admin/shipments [OrderManager+]
- `DashboardController` — GET /api/admin/dashboard [Admin, FinanceUser]
- `UsersController` — GET /api/admin/users [SuperAdmin, Admin]

**Test Sonuçları:**
- GET /api/admin/dashboard → todaySales=199999.96, 3 sipariş, 2 müşteri ✅
- GET /api/admin/users → 3 kullanıcı, roller dahil ✅
- POST /api/admin/shipments → kargo eklendi, order.status=Shipped(5), shipmentStatus=Shipped(3) ✅

---

### ✅ ADIM 8 — Frontend (Customer) (TAMAMLANDI)

**Tarih:** 2026-05-06

**Ne yapıldı:**
- Next.js 16.2.4 (Next.js 15 uyumlu API'ler, `searchParams` async)
- TailwindCSS + shadcn/ui (components.json manuel oluşturuldu, zinc tema)
- `lib/utils.ts` — cn(), formatPrice(tr-TR), formatDate()
- `lib/api.ts` — Bearer token fetch wrapper, localStorage token
- `types/index.ts` — tüm TypeScript tipleri + ORDER_STATUS/PAYMENT_STATUS map'leri
- `hooks/useAuth.ts` — login/register/logout (localStorage)
- `hooks/useCart.ts` — fetchCart/addToCart/updateItem/removeItem/clearCart
- `components/layout/Header.tsx` — sticky, sepet badge, kullanıcı dropdown, arama
- `components/layout/Footer.tsx` — statik footer
- `app/layout.tsx` — root layout
- `app/page.tsx` — SSR ana sayfa: kategori grid + öne çıkan ürünler
- `app/urunler/page.tsx` — SSR ürün listesi (searchParams), sayfalama
- `app/urunler/ProductFilters.tsx` — Client filtre sidebar (kategori, fiyat, arama)
- `app/urun/[slug]/page.tsx` — SSR ürün detay
- `app/urun/[slug]/AddToCartButton.tsx` — Client sepete ekle (varyant seçimi, adet)
- `app/sepet/page.tsx` — Client sepet sayfası (güncelle/kaldır/checkout)
- `app/giris/page.tsx` — Client login
- `app/kayit/page.tsx` — Client kayıt
- `app/odeme/page.tsx` — Client checkout (adres seç → sipariş oluştur → ödeme → başarı)
- `app/hesabim/siparisler/page.tsx` — Client sipariş listesi
- `app/hesabim/siparisler/[orderNumber]/page.tsx` — Client sipariş detay + iptal
- `app/hesabim/adresler/page.tsx` — Client adres yönetimi (CRUD)
- `.env.local` — NEXT_PUBLIC_API_URL=http://localhost:5124

**API portu notu:** Backend `appsettings.json`'daki porta göre `.env.local` güncelle.

**Dev server:** `npm run dev` → http://localhost:3000

---

### ✅ ADIM 9 — Frontend (Admin Panel) (TAMAMLANDI)

**Tarih:** 2026-05-06

**Ne yapıldı:**
- Next.js 16.2.4 admin app (`frontend/admin/`) — port 3001
- Token: `admin_token` / `admin_user` localStorage (ayrı namespace)
- `lib/api.ts`, `lib/utils.ts`, `types/index.ts`, `hooks/useAdminAuth.ts`
- Route group `(admin)/layout.tsx` — dark sidebar (zinc-900), auth guard, navigasyon
- `app/giris/page.tsx` — admin login (varsayılan email: admin@ecom.com)
- `app/page.tsx` → `/dashboard` redirect
- `(admin)/dashboard/page.tsx` — stat kartları (bugünkü satış, sipariş, bekleyen, kritik stok), aylık özet tablo, son siparişler
- `(admin)/siparisler/page.tsx` — sipariş listesi, arama+durum filtresi, sayfalama
- `(admin)/siparisler/[orderNumber]/page.tsx` — sipariş detay, durum güncelleme (AllowedTransitions), kargo oluşturma
- `(admin)/urunler/page.tsx` — ürün listesi, arama, pasif yapma
- `(admin)/stok/page.tsx` — stok listesi, kritik filtre, modal ile stok düzeltme
- `(admin)/kullanicilar/page.tsx` — kullanıcı listesi, arama, rol badge'leri

**Dev server:** `npm run dev -- --port 3001` → http://localhost:3001

---

### ✅ ADIM 11 — Kupon / İndirim Kodu Sistemi (TAMAMLANDI)

**Tarih:** 2026-05-06

**Ne yapıldı:**

**Domain:**
- `Ecom.Domain/Enums/CouponType.cs` — FixedAmount=1, Percentage=2, FreeShipping=3
- `Ecom.Domain/Entities/Coupon.cs` — Code (unique, uppercase), Type, Value, MinOrderAmount, MaxUsageCount, MaxUsagePerUser, UsageCount, StartDate, EndDate, IsActive
- `Ecom.Domain/Entities/CouponUsage.cs` — CouponId, UserId, OrderId, DiscountApplied
- `Cart.cs` — `CouponCode` alanı eklendi

**Infrastructure:**
- `CouponConfiguration.cs` + `CouponUsageConfiguration.cs` — EF konfigürasyonları
- `IApplicationDbContext` + `ApplicationDbContext` — `DbSet<Coupon>` + `DbSet<CouponUsage>` eklendi
- Migration `AddCouponSystem` — oluşturuldu ve veritabanına uygulandı

**Application:**
- `Features/Coupons/Commands/ApplyCouponCommand.cs` — Kupon doğrulama (aktiflik, tarih, kullanım sayısı, kullanıcı limiti, min tutar), Cart.CouponCode yazma
- `Features/Coupons/Commands/RemoveCouponCommand.cs` — Cart.CouponCode temizleme
- `Features/Admin/Coupons/GetCouponsQuery.cs` — sayfalı liste, IncludeInactive filtresi
- `Features/Admin/Coupons/CreateCouponCommand.cs` — kod normalizasyonu (uppercase), unique check
- `Features/Admin/Coupons/UpdateCouponCommand.cs` — kupon güncelleme
- `Features/Admin/Coupons/DeleteCouponCommand.cs` — soft delete (IsDeleted+IsActive=false)
- `Features/Cart/Queries/GetCartQuery.cs` — CartDto'ya discountAmount+couponCode eklendi, kupon hesaplama, geçersiz kupon auto-clear
- `Features/Orders/Commands/CreateOrderCommand.cs` — sipariş sırasında kupon indirimi hesaplama, CouponUsage kaydı oluşturma, UsageCount++

**API:**
- `CartController.cs` — `POST /api/cart/apply-coupon`, `DELETE /api/cart/remove-coupon`
- `Admin/CouponsController.cs` — `GET/POST /api/admin/coupons`, `PUT/DELETE /api/admin/coupons/{id}`

**Frontend (Customer):**
- `types/index.ts` — Cart tipine `discountAmount` + `couponCode` eklendi
- `hooks/useCart.ts` — `applyCoupon()` + `removeCoupon()` eklendi
- `app/sepet/page.tsx` — Kupon kodu input, uygula/kaldır butonları, sipariş özetinde indirim satırı

**Frontend (Admin):**
- `types/index.ts` — `Coupon` tipi + `COUPON_TYPE_LABEL` map eklendi
- `app/(admin)/layout.tsx` — Sidebar'a "Kuponlar" nav item eklendi
- `app/(admin)/kuponlar/page.tsx` — Kupon listesi tablosu + oluştur/düzenle/sil modal

---

### ✅ ADIM 10 — E-posta Bildirimleri (TAMAMLANDI)

**Tarih:** 2026-05-06

**Ne yapıldı:**

**Backend:**
- `MailKit 4.16.0` — Infrastructure projesine eklendi
- `User` entity — `PasswordResetToken` + `PasswordResetTokenExpiry` alanları eklendi
- Migration `AddPasswordResetToken` — oluşturuldu ve uygulandı
- `IEmailService` (Application/Common/Interfaces) — 4 metot: OrderConfirmation, PaymentSuccess, ShippingNotification, PasswordReset
- `EmailTemplates.cs` (Infrastructure) — HTML wrapper + 4 şablon (inline, responsive)
- `EmailService.cs` (Infrastructure/MailKit) — SMTP gönderim + dev-mode log (SmtpHost boş/default ise sadece loglar)
- `ForgotPasswordCommand` — token üret, DB'e kaydet (24 saat geçerli), email gönder
- `ResetPasswordCommand` — token doğrula, şifreyi güncelle, token temizle
- `CreateOrderCommand` — sipariş oluşunca OrderConfirmation email (try/catch ile)
- `PaymentCallbackCommand` — ödeme başarılıysa PaymentSuccess email
- `CreateShipmentCommand` — kargo eklenince ShippingNotification email
- `AuthController` — POST /api/auth/forgot-password, POST /api/auth/reset-password eklendi
- `appsettings.json` — `Email:` konfigürasyon bölümü eklendi

**Frontend (Customer):**
- `app/sifre-sifirla/page.tsx` — Şifremi unuttum formu (email talep) + şifre sıfırlama formu (token+yeni şifre)
- `app/giris/page.tsx` — "Şifremi Unuttum" bağlantısı eklendi

**Dev modu notu:** `Email:SmtpHost` = "smtp.example.com" olduğunda e-posta gerçekten gönderilmez, sadece `[EMAIL-DEV]` logu yazılır. Gerçek SMTP için `appsettings.json`'daki Email bölümünü doldur.

**Test:**
- POST /api/auth/forgot-password → `{"message":"Şifre sıfırlama bağlantısı gönderildi."}` ✅
- POST /api/auth/reset-password (geçersiz token) → `{"error":"Geçersiz token."}` ✅
- API build hatasız ✅, migration uygulandı ✅

---

### ✅ ADIM 15 — Satış Hedefleri, Hata Takibi, UI Yenileme (TAMAMLANDI)

**Tarih:** 2026-05-10

**Ne yapıldı:**

**Backend:**
- `SalesGoal` entity + `GoalsController` — aylık ciro/sipariş hedefi, GET+PUT upsert
- `ErrorLog` entity + `ErrorLogsController` + `ErrorLoggingMiddleware` — 4xx/5xx otomatik log, frontend log endpoint
- `UploadController` — multipart form ile `wwwroot/uploads/` görsel yükleme, URL dönüşü
- `UpdateAdminUserCommand` + `ToggleUserActiveCommand` — admin kullanıcı güncelleme, aktif/pasif
- `UpdateReviewCommand` — kullanıcı kendi yorumunu düzenleyebilir (onay sıfırlanır)
- `OrderStatus.OnHold = 12` — askıya alma statüsü, geçiş tablosuna eklendi
- `Product.IsFeatured` alanı — `GetProductsQuery` ile `?featured=true` filtresi
- Dashboard: activeCustomerCount, cancelledOrders, abandonedOrders, satisfactionRate, reviewCount, weeklyNewUsers, MonthTargetRevenue/OrderCount
- `GetAuditLogsQuery`: userEmail + startDate/endDate filtresi; `GetCouponsQuery`: search + type filtresi
- `ProductListItemDto` + `ReviewDto`: IsFeatured ve UserId eklendi
- Migrations: `AddProductIsFeatured`, `AddSalesGoals`, `AddErrorLogs` oluşturuldu ve uygulandı
- `Program.cs`: static file serving (wwwroot) + ErrorLoggingMiddleware

**Frontend Admin:**
- Yeni sayfa: `/hedefler` — aylık satış hedefleri, progress ring, inline düzenleme, fiili/hedef karşılaştırma
- Yeni sayfa: `/takip` — hata log listesi, filtreler (kaynak/seviye/tarih/arama), stack trace expander
- Sidebar: Hedefler (Target) + Takip (ShieldAlert) navigasyon öğeleri, lacivert tema (#1c2044)
- Dashboard: count-up animasyonu, live ticker, animated weekly bars, satisfaction gauge, yeni kullanıcı bars, hedef progress ring
- Kullanıcılar: düzenleme modali (ad/soyad/rol), aktivasyon toggle, import/export Excel
- Yorumlar: search filtresi eklendi
- Hareketler: userEmail + tarih aralığı filtresi, Excel export
- Yeni bileşenler: `ImageUpload.tsx` (görsel yükleme), `ConfirmModal.tsx` (onay diyaloğu)
- `api.ts`: FormData upload desteği

**Frontend Customer:**
- Yeni hero bölümü: gradient arka plan, Keyvora logolu, kampanya/alışveriş CTA
- `ProductCard.tsx`: ayrı client bileşen, sepete ekle ile animasyon
- `ProductImageGallery.tsx`: fullscreen lightbox, klavye/swipe navigasyon
- `ReviewSection.tsx`: kendi yorumunu düzenleme akışı (edit butonu UserId ile karşılaştırır)
- Footer: çok kolonlu, linkler, güven rozetleri, sosyal ikonlar
- Tüm sayfalar (sepet, ödeme, hesabım, sipariş detay) UI polish

---

## Önemli Dosya Konumları

| Dosya | Konum |
|-------|-------|
| Solution | `backend/Ecom.slnx` |
| DbContext | `backend/src/Ecom.Infrastructure/Persistence/ApplicationDbContext.cs` |
| Migration | `backend/src/Ecom.Infrastructure/Persistence/Migrations/` |
| appsettings | `backend/src/Ecom.API/appsettings.json` |
| Program.cs | `backend/src/Ecom.API/Program.cs` |
| Auth Commands | `backend/src/Ecom.Application/Features/Auth/Commands/` |
| Category Features | `backend/src/Ecom.Application/Features/Categories/` |
| Brand Features | `backend/src/Ecom.Application/Features/Brands/` |
| Product Features | `backend/src/Ecom.Application/Features/Products/` |
| Categories Controller | `backend/src/Ecom.API/Controllers/CategoriesController.cs` |
| Brands Controller | `backend/src/Ecom.API/Controllers/BrandsController.cs` |
| Products Controller | `backend/src/Ecom.API/Controllers/ProductsController.cs` |
| Cart Features | `backend/src/Ecom.Application/Features/Cart/` |
| Cart Controller | `backend/src/Ecom.API/Controllers/CartController.cs` |
| Address Features | `backend/src/Ecom.Application/Features/Addresses/` |
| Order Features | `backend/src/Ecom.Application/Features/Orders/` |
| Addresses Controller | `backend/src/Ecom.API/Controllers/AddressesController.cs` |
| Orders Controller | `backend/src/Ecom.API/Controllers/OrdersController.cs` |

## Veritabanı Bağlantısı

```
Server=(localdb)\mssqllocaldb;Database=EcomDb;Trusted_Connection=True
```

Migration komutları (backend/ dizininden çalıştır):
```bash
# Yeni migration
dotnet ef migrations add <AdMigration> --project src/Ecom.Infrastructure --startup-project src/Ecom.API --output-dir Persistence/Migrations

# Veritabanına uygula
dotnet ef database update --project src/Ecom.Infrastructure --startup-project src/Ecom.API
```
