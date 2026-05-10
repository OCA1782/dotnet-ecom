# Todo

Legend: [x] Done  [ ] Pending  [~] In Progress
Priority: 🔴 High  🟡 Medium  🟢 Low

---

## Backend

- [x] Domain, Application, Infrastructure, API katmanları
- [x] Category, Brand, Product, ProductVariant, ProductImage CRUD
- [x] Stok servisi (IStockService, StockService)
- [x] Sepet (AddToCart, UpdateCartItem, RemoveCartItem, ClearCart, MergeGuestCart)
- [x] Sipariş (CreateOrder, CancelOrder, UpdateOrderStatus, adres yönetimi)
- [x] Ödeme — MockPaymentService (InitiatePayment, PaymentCallback)
- [x] Admin: Dashboard, Kargo (CreateShipment), Kullanıcı listesi
- [x] E-posta bildirimleri (MailKit, dev-mode log)
- [x] Kupon/indirim sistemi
- [x] Ürün yorumları (verified purchase, admin approve/delete)
- [x] SEO (generateMetadata, metaTitle/metaDescription)
- [x] İyzico ödeme entegrasyonu (HMAC-SHA256, Checkout Form API)
- [x] SalesGoal, ErrorLog entity'leri, middleware
- [x] UploadController (wwwroot/uploads)
- [x] UpdateAdminUserCommand, ToggleUserActiveCommand
- [x] OrderStatus.OnHold (12), Product.IsFeatured
- [ ] 🟡 Gerçek SMTP entegrasyonu (appsettings.json Email bölümü)
- [ ] 🟡 İyzico sandbox test (ApiKey/SecretKey + ngrok callback)
- [ ] 🟢 Sipariş kargo takip no güncelleme endpoint'i
- [ ] 🟢 Ürün stok uyarısı (eşik altına düşünce bildirim)

## Frontend — Admin Panel (port 3001)

- [x] Layout: dark sidebar, responsive
- [x] Dashboard: SİPARİŞLER / GELİR / MÜŞTERİLER / HEDEFLER / KULLANICILAR bölümleri
- [x] Siparişler listesi: filtreleme, sayfalama, durum renkleri, action icons
- [x] Sipariş detay: ürünler, tutarlar, müşteri, adresler, ödeme, durum geçmişi, kargo
- [x] ConfirmModal: Askıya Al (amber) + İptal Et (red/danger)
- [x] Ürünler: CRUD, çoklu görsel yükleme
- [x] Kategoriler, Markalar: CRUD
- [x] Stok yönetimi
- [x] Kullanıcılar: listeleme, aktif/pasif toggle
- [x] Kuponlar: CRUD, Excel import/export
- [x] Yorumlar: onaylama/silme
- [x] Hareketler (audit log)
- [x] Hedefler (SalesGoal)
- [x] Siparişler listesi: dinamik uyarı satırları (Fragment pattern, satır + liste alarm)
- [x] Dashboard: Stok + Siparişler bölümlerine alarm banner'ları
- [x] Dashboard: bölümler belirgin kart + renkli pill başlık ile ayrıldı
- [x] Stok güncelleme/yeni giriş modallarına kritik eşik alanı eklendi
- [ ] 🟡 Sipariş detayda durum değiştirme ConfirmModal'ı (şu an direkt API çağrısı)
- [ ] 🟢 Dashboard: tarih aralığı filtresi (bugün/bu hafta/bu ay)
- [ ] 🟢 Bildirimler paneli (yeni sipariş, düşük stok)

## Frontend — Customer (port 3000)

- [x] Ana sayfa, ürün listesi, ürün detay, sepet
- [x] Checkout, hesabım, adresler, giriş/kayıt
- [x] Kupon uygulama sepet UI'da
- [x] Yorum bölümü (ReviewSection)
- [x] ProductImageGallery (fullscreen + swipe)
- [ ] 🟡 Müşteri sipariş takip sayfası (kargo durumu)
- [ ] 🟢 Wishlist / Favoriler
- [ ] 🟢 Ürün karşılaştırma

## DevOps / Production

- [ ] 🔴 GitHub repository push (onay bekliyor)
- [ ] 🟡 Docker Compose yapılandırması
- [ ] 🟡 CI/CD pipeline (GitHub Actions)
- [ ] 🟢 Production appsettings şablonu
