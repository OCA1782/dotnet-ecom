AşağAşağıdaki dokümanı ana analiz dokümanı olarak kullanabilirsin. Bunu e-ticaret projesinin modül bazlı ürün kapsamı + geliştirme rehberi + MVP ayrımı gibi düşün. Teknik mimari detayına girmeden, ama yazılım geliştirmeye doğrudan yön verecek netlikte hazırladım.

E-Ticaret Sitesi Ana Analiz Dokümanı
1. Projenin Genel Amacı
Amaç; ürünlerin online olarak listelendiği, kullanıcıların ürünleri sepete ekleyip sipariş verebildiği, ödeme yapabildiği, siparişlerini takip edebildiği ve yönetim paneli üzerinden tüm operasyonun kontrol edilebildiği kapsamlı bir e-ticaret platformu geliştirmektir.
Bu sistem sadece “ürün göster - sepete ekle - ödeme al” seviyesinde düşünülmemelidir. Sağlıklı bir e-ticaret sistemi; ürün yönetimi, stok yönetimi, fiyat yönetimi, kampanya yönetimi, sipariş yönetimi, ödeme yönetimi, kargo yönetimi, müşteri yönetimi, iade/iptal süreçleri, raporlama ve operasyonel yönetim gibi birçok modülden oluşmalıdır.

2. Ana Kullanıcı Tipleri
2.1. Ziyaretçi Kullanıcı
Sisteme giriş yapmadan siteyi gezen kullanıcıdır.
Yapabilecekleri:
Ürünleri listeleyebilir.
Ürün detayını görebilir.
Kategori bazlı gezinebilir.
Arama yapabilir.
Kampanyaları görebilir.
Sepete ürün ekleyebilir.
Üye olmadan sipariş opsiyonu varsa alışveriş yapabilir.

2.2. Üye Kullanıcı / Müşteri
Sisteme kayıt olmuş kullanıcıdır.
Yapabilecekleri:
Giriş yapabilir.
Profilini yönetebilir.
Adreslerini yönetebilir.
Favori ürünlerini görebilir.
Sepetini yönetebilir.
Sipariş oluşturabilir.
Sipariş geçmişini görebilir.
İade/iptal talebi oluşturabilir.
Kupon/kampanya kullanabilir.
Ürün yorumları yapabilir.

2.3. Admin / Yönetici
Sistemin tüm operasyonunu yöneten kullanıcıdır.
Yapabilecekleri:
Ürünleri yönetir.
Kategorileri yönetir.
Stokları yönetir.
Siparişleri takip eder.
Sipariş durumlarını günceller.
Kampanya ve kupon tanımlar.
Kullanıcıları yönetir.
İade/iptal süreçlerini yönetir.
Raporları inceler.
Sistem ayarlarını yönetir.

2.4. Operasyon Kullanıcısı
Admin kadar geniş yetkisi olmayan, günlük operasyonları yöneten kullanıcıdır.
Örnek roller:
Sipariş operasyon sorumlusu
Depo/stok sorumlusu
Müşteri hizmetleri
Muhasebe/finans kullanıcısı
İçerik yöneticisi

3. Ana Modül Listesi
E-ticaret sitesi aşağıdaki ana modüllerden oluşmalıdır:
No
Modül
Öncelik
1
Kullanıcı Yönetimi
MVP
2
Yetki ve Rol Yönetimi
MVP
3
Ürün Yönetimi
MVP
4
Kategori Yönetimi
MVP
5
Stok Yönetimi
MVP
6
Fiyat Yönetimi
MVP
7
Sepet Yönetimi
MVP
8
Sipariş Yönetimi
MVP
9
Ödeme Yönetimi
MVP
10
Kargo/Teslimat Yönetimi
MVP
11
Adres Yönetimi
MVP
12
Kampanya/Kupon Yönetimi
Faz 2
13
İade/İptal Yönetimi
Faz 2
14
Favori/İstek Listesi
Faz 2
15
Yorum ve Puanlama
Faz 2
16
Bildirim Yönetimi
Faz 2
17
Raporlama ve Dashboard
Faz 2
18
İçerik/CMS Yönetimi
Faz 2
19
SEO Yönetimi
Faz 2
20
Entegrasyon Yönetimi
Faz 2 / Faz 3
21
Muhasebe/Fatura Yönetimi
Faz 2 / Faz 3
22
Pazaryeri Entegrasyonları
Faz 3
23
Çoklu Satıcı / Marketplace
Faz 3
24
Müşteri Hizmetleri Modülü
Faz 3
25
Denetim / Log / Audit Modülü
MVP / Faz 2


4. Modül Bazlı Detaylı Analiz

4.1. Kullanıcı Yönetimi Modülü
Amaç
Müşteri, admin ve operasyon kullanıcılarının sisteme kayıt olması, giriş yapması, profil bilgilerinin yönetilmesi ve hesap güvenliğinin sağlanmasıdır.
Alt Özellikler
Müşteri Tarafı
Kayıt olma
Giriş yapma
Şifremi unuttum
Şifre değiştirme
Profil bilgisi güncelleme
Telefon/e-posta doğrulama
Hesap silme veya pasifleştirme
KVKK / açık rıza onayları
Ticari ileti izni
Admin Tarafı
Kullanıcı listeleme
Kullanıcı arama/filtreleme
Kullanıcı detay görüntüleme
Kullanıcıyı aktif/pasif yapma
Kullanıcı siparişlerini görüntüleme
Kullanıcı adreslerini görüntüleme
Kullanıcı rollerini yönetme
Temel Veri Alanları
Alan
Açıklama
Id
Kullanıcı benzersiz kimliği
Name
Ad
Surname
Soyad
Email
E-posta
PhoneNumber
Telefon
PasswordHash
Şifrelenmiş parola
IsActive
Aktif/pasif durumu
EmailConfirmed
E-posta doğrulandı mı
PhoneConfirmed
Telefon doğrulandı mı
CreatedDate
Oluşturma tarihi
LastLoginDate
Son giriş tarihi

Dikkat Edilmesi Gerekenler
Şifre düz metin saklanmamalı.
E-posta benzersiz olmalı.
Telefon benzersiz yapılabilir ama zorunlu olmayabilir.
Admin ve müşteri hesapları rol bazlı ayrılmalı.
KVKK ve ticari ileti izinleri ayrıca tutulmalı.

4.2. Rol ve Yetki Yönetimi Modülü
Amaç
Admin panelinde kimin hangi işlemi yapabileceğini kontrol etmektir.
Roller
Örnek roller:
Rol
Açıklama
SuperAdmin
Tüm sisteme erişir
Admin
Genel yönetim yetkisine sahiptir
ProductManager
Ürün ve kategori yönetir
StockManager
Stok süreçlerini yönetir
OrderManager
Siparişleri yönetir
CustomerSupport
Müşteri ve sipariş destek süreçlerini yönetir
FinanceUser
Ödeme, fatura ve finansal raporları görür
ContentManager
Banner, sayfa ve içerikleri yönetir

Yetki Örnekleri
Product.Create
Product.Update
Product.Delete
Product.View
Order.View
Order.ChangeStatus
Stock.Update
Campaign.Create
User.Manage
Report.View
Dikkat Edilmesi Gerekenler
Bu modül baştan doğru tasarlanmalı. Sonradan admin paneline rol/yetki eklemek maliyetlidir.

4.3. Ürün Yönetimi Modülü
Amaç
Satılacak ürünlerin yönetilmesini sağlar. E-ticaret sisteminin merkez modülüdür.
Alt Özellikler
Ürün oluşturma
Ürün güncelleme
Ürün silme/pasifleştirme
Ürün listeleme
Ürün detay görüntüleme
Ürün görsel yönetimi
Ürün varyant yönetimi
Ürün özellik yönetimi
Ürün marka bilgisi
Ürün barkod/SKU yönetimi
Ürün SEO bilgileri
Ürün yayın durumu yönetimi
Ürün Tipleri
Başlangıçta şu ürün tipleri desteklenebilir:
Ürün Tipi
Açıklama
Basit Ürün
Tekil ürün, varyantsız
Varyantlı Ürün
Renk, beden, numara gibi seçenekleri olan ürün
Dijital Ürün
Dosya, lisans, eğitim gibi fiziksel olmayan ürün
Paket Ürün
Birden fazla ürünün paket halinde satılması

MVP için Basit Ürün + Varyantlı Ürün yeterlidir.
Temel Ürün Alanları
Alan
Açıklama
Id
Ürün kimliği
Name
Ürün adı
Slug
SEO uyumlu URL
Description
Ürün açıklaması
ShortDescription
Kısa açıklama
SKU
Stok kodu
Barcode
Barkod
BrandId
Marka
CategoryId
Kategori
Price
Satış fiyatı
DiscountPrice
İndirimli fiyat
Currency
Para birimi
TaxRate
KDV oranı
StockQuantity
Stok miktarı
IsActive
Aktif/pasif
IsPublished
Yayında mı
CreatedDate
Oluşturma tarihi

Ürün Görselleri
Her ürünün birden fazla görseli olabilir.
Alanlar:
Alan
Açıklama
ProductId
Ürün
ImageUrl
Görsel yolu
SortOrder
Sıralama
IsMain
Ana görsel mi

Ürün Varyantları
Örnek:
Tişört
Renk: Siyah
Beden: M
SKU: TSHIRT-BLACK-M
Stok: 15
Fiyat: 499 TL
Varyant alanları:
Alan
Açıklama
ProductId
Ana ürün
VariantName
Varyant adı
SKU
Varyant stok kodu
Barcode
Barkod
Price
Varyant fiyatı
StockQuantity
Stok
Attributes
Renk, beden, numara gibi bilgiler

Dikkat Edilmesi Gerekenler
Ürün silme yerine pasifleştirme tercih edilmeli.
Siparişe konu olmuş ürünler fiziksel olarak silinmemeli.
Ürün fiyatı değişse bile eski siparişin fiyatı değişmemeli.
Sipariş satırında ürün adı, fiyatı, KDV, SKU gibi bilgiler snapshot olarak saklanmalı.
Stok varyant bazlı yönetilmelidir.
SEO için slug benzersiz olmalıdır.

4.4. Kategori Yönetimi Modülü
Amaç
Ürünlerin hiyerarşik şekilde gruplanmasını sağlar.
Özellikler
Kategori oluşturma
Alt kategori oluşturma
Kategori güncelleme
Kategori silme/pasifleştirme
Kategori sıralama
Kategori görseli
Menüde göster/gizle
SEO bilgileri
Kategori Yapısı
Örnek:
Kadın
 ├── Giyim
 │    ├── Elbise
 │    ├── Pantolon
 │    └── Gömlek
 └── Ayakkabı
      ├── Spor Ayakkabı
      └── Bot

Temel Alanlar
Alan
Açıklama
Id
Kategori kimliği
ParentCategoryId
Üst kategori
Name
Kategori adı
Slug
SEO URL
Description
Açıklama
ImageUrl
Görsel
SortOrder
Sıralama
IsActive
Aktif/pasif
ShowInMenu
Menüde gösterilsin mi

Dikkat Edilmesi Gerekenler
Kategori ağacı sınırsız derinlikte tasarlanabilir ama pratikte 3-4 seviye yeterlidir.
İçinde aktif ürün bulunan kategori doğrudan silinmemeli.
SEO URL’leri benzersiz olmalı.
Menü performansı için kategori ağacı cache’lenebilir.

4.5. Marka Yönetimi Modülü
Amaç
Ürünlerin markaya göre yönetilmesini sağlar.
Özellikler
Marka ekleme
Marka güncelleme
Marka pasifleştirme
Marka logosu
Marka açıklaması
Marka SEO sayfası
Markaya göre ürün listeleme
Alanlar
Alan
Açıklama
Id
Marka kimliği
Name
Marka adı
Slug
SEO URL
LogoUrl
Logo
Description
Açıklama
IsActive
Aktif/pasif


4.6. Stok Yönetimi Modülü
Amaç
Ürünlerin satışa uygun stok miktarlarının doğru şekilde yönetilmesini sağlar.
Stok İşlem Tipleri
İşlem
Açıklama
StockIn
Stok girişi
StockOut
Stok çıkışı
Reservation
Sipariş sırasında stok rezervasyonu
ReleaseReservation
Sipariş iptalinde rezervasyon iadesi
Adjustment
Manuel stok düzeltme
Return
İade sonrası stok artışı
Damage
Hasarlı ürün düşümü

Temel Özellikler
Ürün/varyant bazlı stok takibi
Stok giriş/çıkış hareketleri
Kritik stok seviyesi
Stok rezervasyonu
Stok geçmişi
Depo bazlı stok yönetimi
Manuel stok düzeltme
Stok raporu
Stok Alanları
Alan
Açıklama
ProductId
Ürün
ProductVariantId
Varyant
WarehouseId
Depo
Quantity
Mevcut stok
ReservedQuantity
Rezerve stok
AvailableQuantity
Satılabilir stok
CriticalStockLevel
Kritik stok seviyesi

Satılabilir Stok Formülü
Satılabilir Stok = Mevcut Stok - Rezerve Stok

Kritik İş Kuralları
Sepete ekleme sırasında stok düşülmemeli.
Sipariş oluşturulurken stok rezerve edilmeli.
Ödeme başarılı olursa stok kesin düşülmeli.
Ödeme başarısız olursa rezervasyon serbest bırakılmalı.
Sipariş iptal edilirse stok geri alınmalı.
Aynı ürünü aynı anda birçok kullanıcı alabilir; concurrency kontrolü şarttır.
Dikkat Edilmesi Gerekenler
Stok yönetimi e-ticarette en riskli modüllerden biridir. Yanlış tasarlanırsa:
Olmayan ürün satılır.
Aynı stok iki kişiye satılır.
İptal/iade sonrası stok hatalı görünür.
Depo operasyonu ile sistem tutarsız hale gelir.
Bu yüzden stok hareketleri mutlaka loglanmalı ve mümkünse transactional yönetilmelidir.

4.7. Depo Yönetimi Modülü
Amaç
Birden fazla depo veya mağaza stoğu yönetilecekse kullanılır.
Özellikler
Depo tanımlama
Depo adresi
Depo aktif/pasif durumu
Depo bazlı stok
Depolar arası stok transferi
Siparişin hangi depodan karşılanacağı
MVP İçin Durum
Tek depolu yapı varsa basit tutulabilir. Ancak ileride büyüme ihtimali varsa veri modeli depo destekli kurulmalıdır.

4.8. Fiyat Yönetimi Modülü
Amaç
Ürün fiyatlarının, indirimli fiyatların, para biriminin ve KDV bilgilerinin yönetilmesini sağlar.
Özellikler
Normal satış fiyatı
İndirimli fiyat
KDV oranı
Para birimi
Fiyat geçerlilik tarihi
Varyant bazlı fiyat
Müşteri grubuna özel fiyat
Kampanya bazlı fiyat
Fiyat Alanları
Alan
Açıklama
ProductId
Ürün
VariantId
Varyant
ListPrice
Liste fiyatı
SalePrice
Satış fiyatı
DiscountPrice
İndirimli fiyat
TaxRate
KDV oranı
Currency
Para birimi
StartDate
Başlangıç tarihi
EndDate
Bitiş tarihi

Kritik İş Kuralları
Sipariş verildiği anda ürün fiyatı sipariş satırına kopyalanmalıdır.
Ürün fiyatı sonradan değişse bile geçmiş sipariş etkilenmemelidir.
KDV oranı sipariş satırında saklanmalıdır.
Kampanya uygulanmışsa kampanya indirimi ayrıca görünmelidir.

4.9. Sepet Yönetimi Modülü
Amaç
Kullanıcının satın almak istediği ürünleri geçici olarak tuttuğu yapıdır.
Özellikler
Sepete ürün ekleme
Sepetten ürün çıkarma
Ürün adedi artırma/azaltma
Sepeti görüntüleme
Sepeti temizleme
Kupon uygulama
Kargo tutarı hesaplama
Sepet toplamı hesaplama
Misafir kullanıcı sepeti
Üye olduktan sonra misafir sepetini kullanıcıya bağlama
Sepet Alanları
Alan
Açıklama
CartId
Sepet kimliği
UserId
Kullanıcı
SessionId
Misafir kullanıcı oturumu
ProductId
Ürün
VariantId
Varyant
Quantity
Adet
UnitPrice
Birim fiyat
TotalPrice
Toplam fiyat

Sepet Hesaplama Kalemleri
Kalem
Açıklama
Ürün toplamı
Ürünlerin toplam tutarı
İndirim toplamı
Kampanya/kupon indirimi
KDV toplamı
Vergi toplamı
Kargo tutarı
Teslimat ücreti
Genel toplam
Ödenecek net tutar

Kritik İş Kuralları
Sepette ürün olması stok garantisi anlamına gelmez.
Stok kontrolü ödeme/sipariş aşamasında tekrar yapılmalıdır.
Fiyat değişmişse kullanıcı checkout öncesi bilgilendirilmelidir.
Sepet belirli süre sonra expire edilebilir.
Misafir sepeti cookie/session ile yönetilebilir.

4.10. Sipariş Yönetimi Modülü
Amaç
Kullanıcının satın alma işlemini temsil eder. E-ticaret sisteminin en kritik operasyon modülüdür.
Sipariş Durumları
Önerilen sipariş yaşam döngüsü:
Created
PaymentPending
PaymentCompleted
Preparing
Shipped
Delivered
Completed
Cancelled
RefundRequested
Refunded
Failed

Durum Açıklamaları
Durum
Açıklama
Created
Sipariş oluşturuldu
PaymentPending
Ödeme bekleniyor
PaymentCompleted
Ödeme başarılı
Preparing
Sipariş hazırlanıyor
Shipped
Kargoya verildi
Delivered
Teslim edildi
Completed
Sipariş tamamlandı
Cancelled
İptal edildi
RefundRequested
İade talebi oluşturuldu
Refunded
Ücret iadesi yapıldı
Failed
Sipariş başarısız

Sipariş Özellikleri
Sipariş oluşturma
Sipariş detay görüntüleme
Sipariş listeleme
Sipariş durum güncelleme
Sipariş iptal etme
Sipariş kargo bilgisi
Sipariş ödeme bilgisi
Sipariş fatura bilgisi
Sipariş notları
Admin sipariş yönetimi
Müşteri sipariş geçmişi
Sipariş Ana Alanları
Alan
Açıklama
Id
Sipariş kimliği
OrderNumber
Sipariş numarası
UserId
Müşteri
Status
Sipariş durumu
TotalProductAmount
Ürün toplamı
DiscountAmount
İndirim toplamı
ShippingAmount
Kargo tutarı
TaxAmount
KDV toplamı
GrandTotal
Genel toplam
PaymentStatus
Ödeme durumu
ShippingStatus
Kargo durumu
BillingAddressId
Fatura adresi
ShippingAddressId
Teslimat adresi
CreatedDate
Sipariş tarihi

Sipariş Satır Alanları
Alan
Açıklama
OrderId
Sipariş
ProductId
Ürün
VariantId
Varyant
ProductName
Sipariş anındaki ürün adı
SKU
Sipariş anındaki SKU
Quantity
Adet
UnitPrice
Birim fiyat
DiscountAmount
Satır indirimi
TaxRate
KDV oranı
TaxAmount
KDV tutarı
LineTotal
Satır toplamı

Kritik İş Kuralları
Sipariş numarası benzersiz olmalı.
Ürün bilgileri snapshot olarak sipariş satırında tutulmalı.
Sipariş oluşturma, stok rezervasyonu ve ödeme süreci tutarlı yönetilmeli.
Sipariş durum geçişleri kontrolsüz olmamalı.
Her sipariş durum değişikliği loglanmalı.
Admin sipariş durumunu değiştirdiğinde kimin değiştirdiği tutulmalı.

4.11. Ödeme Yönetimi Modülü
Amaç
Kullanıcının sipariş bedelini güvenli şekilde ödemesini sağlar.
Ödeme Yöntemleri
Başlangıç için:
Kredi kartı
Banka kartı
Havale/EFT
Kapıda ödeme
Cüzdan/bakiye sistemi — ileri faz
Sanal POS Entegrasyonları
Türkiye pazarı için muhtemel entegrasyonlar:
Iyzico
PayTR
Param
Stripe — global kullanım için
Banka sanal POS sistemleri
Ödeme Durumları
Durum
Açıklama
Pending
Ödeme bekleniyor
Paid
Ödeme başarılı
Failed
Ödeme başarısız
Cancelled
Ödeme iptal edildi
Refunded
İade edildi
PartiallyRefunded
Kısmi iade edildi

Ödeme Alanları
Alan
Açıklama
OrderId
Sipariş
PaymentProvider
Ödeme sağlayıcı
PaymentMethod
Ödeme yöntemi
TransactionId
Sağlayıcı işlem numarası
Amount
Tutar
Currency
Para birimi
Status
Ödeme durumu
PaidDate
Ödeme tarihi
ErrorCode
Hata kodu
ErrorMessage
Hata mesajı

Kritik İş Kuralları
Kart bilgisi sistemde saklanmamalı.
3D Secure desteklenmeli.
Ödeme callback/webhook mekanizması olmalı.
Ödeme başarılı olmadan sipariş kesinleşmemeli.
Ödeme başarısızsa stok rezervasyonu serbest bırakılmalı.
Provider response detayları loglanmalı.
Aynı ödeme callback’i birden fazla kez gelebilir; idempotent yapı kurulmalı.

4.12. Kargo ve Teslimat Yönetimi Modülü
Amaç
Siparişlerin müşteriye teslim edilme sürecini yönetir.
Özellikler
Kargo firması tanımlama
Kargo fiyatı hesaplama
Kargo takip numarası
Kargoya verildi bilgisi
Teslim edildi bilgisi
Kargo durum sorgulama
Ücretsiz kargo limiti
Desi/ağırlık bazlı kargo fiyatı
Bölge bazlı teslimat kısıtları
Kargo Durumları
Durum
Açıklama
NotShipped
Kargoya verilmedi
Preparing
Hazırlanıyor
Shipped
Kargoya verildi
InTransit
Taşımada
Delivered
Teslim edildi
FailedDelivery
Teslim edilemedi
Returned
Geri döndü

Kargo Alanları
Alan
Açıklama
OrderId
Sipariş
CargoCompany
Kargo firması
TrackingNumber
Takip numarası
TrackingUrl
Takip linki
ShippingCost
Kargo ücreti
ShippedDate
Kargoya veriliş tarihi
DeliveredDate
Teslim tarihi

Dikkat Edilmesi Gerekenler
Kargo takip numarası siparişe bağlanmalı.
Müşteriye kargo bilgilendirme mail/SMS gönderilmeli.
Admin panelinden manuel kargo bilgisi girilebilmeli.
İleri fazda kargo API entegrasyonu yapılabilir.

4.13. Adres Yönetimi Modülü
Amaç
Kullanıcının teslimat ve fatura adreslerini yönetmesini sağlar.
Özellikler
Adres ekleme
Adres güncelleme
Adres silme
Varsayılan teslimat adresi
Varsayılan fatura adresi
İl/ilçe/mahalle seçimi
Kurumsal/bireysel fatura adresi
Adres Alanları
Alan
Açıklama
UserId
Kullanıcı
AddressTitle
Adres başlığı
FirstName
Ad
LastName
Soyad
PhoneNumber
Telefon
Country
Ülke
City
İl
District
İlçe
Neighborhood
Mahalle
FullAddress
Açık adres
PostalCode
Posta kodu
IsDefaultShipping
Varsayılan teslimat
IsDefaultBilling
Varsayılan fatura
InvoiceType
Bireysel/kurumsal
TaxNumber
Vergi no
TaxOffice
Vergi dairesi
CompanyName
Firma adı

Kritik İş Kuralları
Sipariş oluşturulduğunda adres bilgisi siparişe snapshot olarak kopyalanmalıdır.
Kullanıcı adresini sonradan değiştirdiğinde eski sipariş adresi değişmemelidir.
Kurumsal fatura için vergi no, vergi dairesi ve firma adı alınmalıdır.

4.14. Kampanya ve Kupon Yönetimi Modülü
Amaç
Satışları artırmak için indirim, promosyon ve kupon mekanizmalarının yönetilmesini sağlar.
Kampanya Türleri
Kampanya
Açıklama
Sepette indirim
Sepet toplamına göre indirim
Ürün indirimi
Belirli ürünlerde indirim
Kategori indirimi
Belirli kategorilerde indirim
Marka indirimi
Belirli markalarda indirim
Kupon kodu
Kullanıcının kod girerek indirim alması
Ücretsiz kargo
Belirli tutar üstü ücretsiz kargo
2 al 1 öde
Çoklu ürün kampanyası
İlk alışveriş indirimi
Yeni müşteriye özel

Kupon Alanları
Alan
Açıklama
Code
Kupon kodu
DiscountType
Tutar/yüzde
DiscountValue
İndirim değeri
MinOrderAmount
Minimum sipariş tutarı
MaxDiscountAmount
Maksimum indirim
UsageLimit
Toplam kullanım limiti
UserUsageLimit
Kullanıcı bazlı limit
StartDate
Başlangıç
EndDate
Bitiş
IsActive
Aktif/pasif

Kritik İş Kuralları
Kupon kullanım limiti kontrol edilmeli.
Aynı kupon aynı kullanıcı tarafından sınırsız kullanılmamalı.
Kampanya çakışmaları net yönetilmeli.
Sepet tutarı değişirse kupon uygunluğu tekrar hesaplanmalı.
İptal/iade durumunda kupon kullanım hakkı geri verilip verilmeyeceği belirlenmeli.

4.15. İade ve İptal Yönetimi Modülü
Amaç
Müşterinin sipariş iptali veya ürün iadesi süreçlerini yönetir.
İptal Süreci
Sipariş henüz kargoya verilmediyse iptal edilebilir.
İptal durumunda:
Sipariş durumu Cancelled yapılır.
Stok geri alınır.
Ödeme alındıysa iade süreci başlatılır.
Müşteriye bilgilendirme gönderilir.
İade Süreci
Sipariş teslim edildikten sonra müşteri iade talebi oluşturabilir.
İade nedenleri:
Ürün hasarlı
Yanlış ürün gönderildi
Ürünü beğenmedim
Beden/numara uymadı
Eksik ürün
Diğer
İade Durumları
Durum
Açıklama
Requested
İade talep edildi
Approved
İade onaylandı
Rejected
İade reddedildi
WaitingForProduct
Ürün bekleniyor
ProductReceived
Ürün teslim alındı
RefundCompleted
Para iadesi tamamlandı

Kritik İş Kuralları
İade süresi belirlenmeli.
Bazı ürünler iade edilemeyebilir.
Kısmi iade desteklenmeli.
İade edilen ürün stoklara geri alınacak mı, hasarlı stoğa mı gidecek netleşmeli.
Para iadesi ödeme provider üzerinden yapılmalı.
İade/iptal operasyonları audit log ile takip edilmeli.

4.16. Favori / İstek Listesi Modülü
Amaç
Kullanıcıların beğendiği ürünleri daha sonra erişmek üzere kaydetmesini sağlar.
Özellikler
Favoriye ekleme
Favoriden çıkarma
Favori ürünleri listeleme
Favori ürün stokta yoksa bilgilendirme
Favori ürün indirime girerse bildirim
MVP Durumu
MVP için zorunlu değildir ama kullanıcı bağlılığı için değerlidir.

4.17. Ürün Yorum ve Puanlama Modülü
Amaç
Kullanıcıların satın aldıkları ürünler hakkında yorum yapmasını sağlar.
Özellikler
Ürün puanlama
Ürün yorumu
Görselli yorum
Yorum onay mekanizması
Yorumu yayından kaldırma
Kullanıcı yorumu düzenleme
Satın alan kullanıcı rozeti
Kritik İş Kuralları
Sadece ürünü satın alan kullanıcı yorum yapmalı.
Yorumlar admin onayından sonra yayınlanabilir.
Hakaret/küfür filtresi kullanılabilir.
Sahte yorum engellenmelidir.

4.18. Bildirim Yönetimi Modülü
Amaç
Kullanıcılara sistem olayları hakkında bilgi gönderilmesini sağlar.
Bildirim Kanalları
E-posta
SMS
Push notification
WhatsApp — ileri faz
Site içi bildirim
Bildirim Olayları
Olay
Bildirim
Üyelik oluşturuldu
Hoş geldiniz e-postası
Sipariş alındı
Sipariş onayı
Ödeme başarılı
Ödeme bilgilendirmesi
Sipariş kargoya verildi
Kargo takip bilgisi
Sipariş teslim edildi
Teslim bilgisi
İade talebi alındı
İade bilgilendirmesi
Şifre sıfırlama
Şifre reset linki
Stok geldi
Stok bildirimi
Fiyat düştü
Fiyat alarmı

Kritik İş Kuralları
Bildirim gönderimleri loglanmalı.
Başarısız bildirimler tekrar denenebilir olmalı.
Kullanıcının ticari ileti izni yoksa pazarlama bildirimi gönderilmemeli.
Transactional bildirimler ile pazarlama bildirimleri ayrılmalı.

4.19. Raporlama ve Dashboard Modülü
Amaç
Yönetim ekibinin satış, sipariş, stok ve müşteri performansını takip etmesini sağlar.
Dashboard Göstergeleri
Günlük satış tutarı
Günlük sipariş sayısı
Ortalama sepet tutarı
En çok satan ürünler
En çok görüntülenen ürünler
Stokta azalan ürünler
İptal edilen siparişler
İade oranı
Yeni müşteri sayısı
Ödeme başarısızlık oranı
Kargo bekleyen sipariş sayısı
Rapor Türleri
Rapor
Açıklama
Satış Raporu
Günlük/haftalık/aylık satışlar
Sipariş Raporu
Sipariş durumları
Ürün Raporu
Ürün performansı
Stok Raporu
Stok seviyesi
Müşteri Raporu
Müşteri davranışları
Kampanya Raporu
Kampanya performansı
İade Raporu
İade nedenleri ve oranları
Ödeme Raporu
Başarılı/başarısız ödemeler

MVP Durumu
Başlangıçta basit dashboard yeterli. Ancak sistem canlıya çıktıktan sonra raporlama çok kritik hale gelir.

4.20. İçerik / CMS Yönetimi Modülü
Amaç
Site içerisindeki statik ve pazarlama içeriklerinin yönetilmesini sağlar.
Yönetilecek İçerikler
Ana sayfa bannerları
Slider görselleri
Kampanya alanları
Hakkımızda sayfası
İletişim sayfası
SSS sayfası
KVKK sayfası
Mesafeli satış sözleşmesi
İade ve değişim politikası
Gizlilik politikası
Footer linkleri
Menü yönetimi
Özellikler
Sayfa oluşturma
Sayfa güncelleme
Sayfa yayınlama/pasifleştirme
Banner ekleme
Banner sıralama
Mobil/desktop görsel ayrımı
Yayın başlangıç/bitiş tarihi

4.21. SEO Yönetimi Modülü
Amaç
Arama motorlarında görünürlüğü artırmak için SEO bilgilerinin yönetilmesini sağlar.
SEO Alanları
Ürün, kategori, marka ve statik sayfalar için:
Alan
Açıklama
MetaTitle
SEO başlığı
MetaDescription
SEO açıklaması
MetaKeywords
Anahtar kelimeler
Slug
SEO URL
CanonicalUrl
Canonical link
OpenGraphTitle
Sosyal medya başlığı
OpenGraphImage
Sosyal medya görseli

Teknik SEO İhtiyaçları
Sitemap.xml
Robots.txt
Canonical URL
SEO dostu URL
Breadcrumb
Structured data
301 yönlendirme
404 sayfası
Sayfa hız optimizasyonu
Dikkat Edilmesi Gerekenler
SEO sonradan eklenebilir ama URL yapısı baştan doğru kurulmalıdır. Yanlış URL tasarımı ileride ciddi maliyet çıkarır.

4.22. Fatura ve Muhasebe Yönetimi Modülü
Amaç
Siparişlerin mali ve yasal belgelerinin yönetilmesini sağlar.
Özellikler
Fatura bilgisi oluşturma
Bireysel fatura
Kurumsal fatura
E-fatura / e-arşiv entegrasyonu
Fatura PDF görüntüleme
Fatura iptali
İade faturası
Muhasebe sistemine aktarım
Alanlar
Alan
Açıklama
OrderId
Sipariş
InvoiceNumber
Fatura numarası
InvoiceType
Bireysel/kurumsal
TaxNumber
Vergi no
TaxOffice
Vergi dairesi
CompanyName
Firma
InvoiceDate
Fatura tarihi
InvoiceStatus
Fatura durumu
InvoiceUrl
PDF/link

Dikkat Edilmesi Gerekenler
Türkiye’de gerçek satış yapılacaksa fatura/e-arşiv/e-fatura süreci net tasarlanmalıdır. Bu modül yasal uyumluluk açısından önemlidir.

4.23. Entegrasyon Yönetimi Modülü
Amaç
Sistemin dış servislerle kontrollü şekilde çalışmasını sağlar.
Muhtemel Entegrasyonlar
Entegrasyon
Amaç
Ödeme sağlayıcı
Online ödeme almak
Kargo firması
Kargo takip ve gönderi oluşturma
SMS sağlayıcı
SMS bildirimi
E-posta servisi
E-posta gönderimi
E-fatura sağlayıcı
Fatura oluşturma
ERP
Stok, ürün, muhasebe
CRM
Müşteri ilişkileri
Pazaryeri
Trendyol, Hepsiburada, N11 vb.
Analytics
Kullanıcı davranış analizi

Kritik İş Kuralları
Her entegrasyon response/request loglanmalı.
Entegrasyon hataları retry mekanizmasına sahip olmalı.
Timeout süreleri belirlenmeli.
Dış servis hatası tüm sistemi kilitlememeli.
Ödeme ve fatura gibi kritik entegrasyonlarda idempotency uygulanmalı.

4.24. Pazaryeri Entegrasyonları Modülü
Amaç
Ürünlerin ve siparişlerin farklı pazaryerleriyle senkronize edilmesini sağlar.
Pazaryeri Örnekleri
Trendyol
Hepsiburada
N11
Amazon
ÇiçekSepeti
Pazarama
Özellikler
Ürün gönderimi
Stok senkronizasyonu
Fiyat senkronizasyonu
Sipariş çekme
Sipariş durum güncelleme
Kargo takip gönderimi
İptal/iade senkronizasyonu
Faz Durumu
Başlangıç MVP kapsamına alınmamalı. Sistemin çekirdek e-ticaret yapısı oturduktan sonra eklenmelidir.

4.25. Çoklu Satıcı / Marketplace Modülü
Amaç
Sistemde birden fazla satıcının ürün satabilmesini sağlar.
Özellikler
Satıcı başvurusu
Satıcı onayı
Satıcı paneli
Satıcı ürün yönetimi
Satıcı stok yönetimi
Komisyon yönetimi
Satıcı ödeme/hesaplaşma
Satıcı performans raporu
Faz Durumu
Bu modül projeyi ciddi büyütür. İlk versiyonda önerilmez. Önce klasik B2C e-ticaret sistemi kurulmalı, sonra marketplace’e evrilmelidir.

4.26. Müşteri Hizmetleri Modülü
Amaç
Müşteri destek süreçlerini yönetir.
Özellikler
Sipariş bazlı destek talebi
Genel destek talebi
Talep kategorisi
Talep durumu
Admin cevaplama
Kullanıcı mesaj geçmişi
Dosya/görsel ekleme
Talep kapatma
SLA takibi
Destek Talep Durumları
Durum
Açıklama
Open
Açık
WaitingCustomer
Müşteri yanıtı bekleniyor
WaitingSupport
Destek yanıtı bekleniyor
Resolved
Çözüldü
Closed
Kapandı


4.27. Denetim / Log / Audit Modülü
Amaç
Sistemde yapılan kritik işlemlerin izlenmesini sağlar.
Loglanması Gereken İşlemler
Admin girişleri
Ürün fiyat değişiklikleri
Stok değişiklikleri
Sipariş durum değişiklikleri
Ödeme işlemleri
İade/iptal işlemleri
Kullanıcı rol değişiklikleri
Entegrasyon request/response kayıtları
Hatalar
Güvenlik ihlali denemeleri
Temel Alanlar
Alan
Açıklama
UserId
İşlemi yapan kullanıcı
Action
Yapılan işlem
EntityName
Etkilenen tablo/entity
EntityId
Etkilenen kayıt
OldValue
Eski değer
NewValue
Yeni değer
IpAddress
IP adresi
UserAgent
Tarayıcı bilgisi
CreatedDate
İşlem tarihi

Net Tavsiye
Bu modül MVP’den itibaren olmalı. Özellikle fiyat, stok, sipariş ve ödeme işlemlerinde log olmadan üretime çıkmak ciddi operasyonel risktir.

5. Müşteri Arayüzü Sayfaları
5.1. Ana Sayfa
İçerikler:
Slider/banner
Öne çıkan kategoriler
Kampanyalı ürünler
Çok satan ürünler
Yeni gelen ürünler
Markalar
Avantaj alanları: hızlı kargo, güvenli ödeme, kolay iade

5.2. Ürün Listeleme Sayfası
Özellikler:
Kategoriye göre listeleme
Arama sonucu listeleme
Filtreleme
Sıralama
Sayfalama
Ürün kartı
Favoriye ekleme
Sepete hızlı ekleme
Filtre örnekleri:
Fiyat aralığı
Marka
Kategori
Renk
Beden
Numara
Stokta var
İndirimli ürünler
Puan

5.3. Ürün Detay Sayfası
İçerikler:
Ürün görselleri
Ürün adı
Marka
Fiyat
İndirimli fiyat
Stok durumu
Varyant seçimi
Adet seçimi
Sepete ekle
Favoriye ekle
Ürün açıklaması
Teknik özellikler
Teslimat bilgisi
İade bilgisi
Yorumlar
Benzer ürünler

5.4. Sepet Sayfası
İçerikler:
Sepetteki ürünler
Adet güncelleme
Ürün çıkarma
Kupon kodu
Kargo hesaplama
Sepet özeti
Ödemeye geç butonu

5.5. Checkout / Ödeme Sayfası
Adımlar:
Giriş / üyelik / misafir devam
Teslimat adresi
Fatura adresi
Kargo seçimi
Ödeme yöntemi
Sipariş özeti
Siparişi tamamla

5.6. Sipariş Sonuç Sayfası
İçerikler:
Sipariş başarılı/başarısız bilgisi
Sipariş numarası
Ödeme sonucu
Sipariş detayına git
Alışverişe devam et

5.7. Hesabım Sayfaları
Sayfalar:
Profil bilgilerim
Adreslerim
Siparişlerim
Sipariş detay
İade taleplerim
Favorilerim
Şifre değiştir
Bildirim tercihleri

6. Admin Panel Modülleri
Admin panel, e-ticaret sisteminin operasyon merkezidir.
6.1. Dashboard
Göstergeler:
Bugünkü satış
Bugünkü sipariş
Bekleyen siparişler
Kargoya verilecek siparişler
Kritik stok ürünleri
Son siparişler
Ödeme hataları
İade talepleri

6.2. Ürün Yönetimi
Ekranlar:
Ürün listesi
Ürün ekle
Ürün düzenle
Ürün görselleri
Ürün varyantları
Ürün fiyatları
Ürün stok bilgileri
Ürün SEO bilgileri

6.3. Kategori Yönetimi
Ekranlar:
Kategori ağacı
Kategori ekle
Kategori düzenle
Kategori sıralama
Kategori SEO

6.4. Sipariş Yönetimi
Ekranlar:
Sipariş listesi
Sipariş detay
Sipariş durum güncelleme
Kargo bilgisi girme
Ödeme bilgisi görüntüleme
İptal işlemi
İade işlemi
Sipariş notları

6.5. Stok Yönetimi
Ekranlar:
Stok listesi
Stok hareketleri
Manuel stok düzeltme
Kritik stok raporu
Depo bazlı stok
Stok transferi

6.6. Kampanya Yönetimi
Ekranlar:
Kampanya listesi
Kampanya ekle
Kampanya düzenle
Kupon listesi
Kupon oluştur
Kampanya performansı

6.7. Kullanıcı Yönetimi
Ekranlar:
Müşteri listesi
Müşteri detay
Müşteri siparişleri
Admin kullanıcıları
Rol ve yetki yönetimi

6.8. İçerik Yönetimi
Ekranlar:
Banner yönetimi
Sayfa yönetimi
Menü yönetimi
Footer yönetimi
SSS yönetimi

6.9. Raporlar
Ekranlar:
Satış raporu
Sipariş raporu
Stok raporu
Ürün performans raporu
Müşteri raporu
Kampanya raporu
İade raporu

6.10. Sistem Ayarları
Ayarlar:
Site adı
Logo
Para birimi
KDV ayarları
Kargo ayarları
Ödeme sağlayıcı ayarları
E-posta ayarları
SMS ayarları
Bakım modu
Sözleşme metinleri

7. Temel İş Akışları

7.1. Ürün Satın Alma Akışı
Ürün listeleme
    ↓
Ürün detay görüntüleme
    ↓
Sepete ekleme
    ↓
Sepet kontrolü
    ↓
Adres seçimi
    ↓
Kargo seçimi
    ↓
Ödeme bilgisi
    ↓
Sipariş oluşturma
    ↓
Stok rezervasyonu
    ↓
Ödeme alma
    ↓
Ödeme başarılıysa sipariş onayı
    ↓
Stok kesin düşümü
    ↓
Bildirim gönderimi


7.2. Ödeme Başarısız Akışı
Sipariş oluşturulur
    ↓
Stok rezerve edilir
    ↓
Ödeme denenir
    ↓
Ödeme başarısız olur
    ↓
Sipariş Failed veya PaymentFailed yapılır
    ↓
Stok rezervasyonu serbest bırakılır
    ↓
Kullanıcı bilgilendirilir


7.3. Sipariş İptal Akışı
Müşteri/Admin iptal talebi oluşturur
    ↓
Sipariş durumu kontrol edilir
    ↓
Kargoya verilmediyse iptal edilir
    ↓
Stok iade edilir
    ↓
Ödeme varsa iade süreci başlatılır
    ↓
Müşteriye bildirim gönderilir


7.4. İade Akışı
Müşteri iade talebi oluşturur
    ↓
Admin talebi inceler
    ↓
Talep onaylanır veya reddedilir
    ↓
Onaylandıysa müşteri ürünü gönderir
    ↓
Ürün depoya ulaşır
    ↓
Kontrol edilir
    ↓
Para iadesi yapılır
    ↓
Stok durumu güncellenir


8. MVP Kapsamı
İlk canlıya çıkış için önerilen minimum kapsam aşağıdaki gibi olmalı.
MVP’de Olması Gerekenler
Modül
Durum
Kullanıcı kaydı/girişi
Olmalı
Ürün yönetimi
Olmalı
Kategori yönetimi
Olmalı
Marka yönetimi
Olmalı
Stok yönetimi
Olmalı
Sepet
Olmalı
Sipariş
Olmalı
Ödeme
Olmalı
Adres yönetimi
Olmalı
Kargo bilgisi
Olmalı
Admin panel
Olmalı
Basit raporlama
Olmalı
Log/Audit
Olmalı
E-posta bildirimi
Olmalı
Temel SEO
Olmalı
KVKK/sözleşme sayfaları
Olmalı


MVP Dışında Bırakılabilecekler
Modül
Faz
Gelişmiş kampanya motoru
Faz 2
Kupon sistemi
Faz 2
Yorum/puanlama
Faz 2
Favoriler
Faz 2
Gelişmiş raporlama
Faz 2
SMS bildirimi
Faz 2
Pazaryeri entegrasyonu
Faz 3
Çoklu satıcı sistemi
Faz 3
Mobil uygulama
Faz 3
Sadakat puanı
Faz 3
Gelişmiş öneri sistemi
Faz 3


9. Önerilen Geliştirme Fazları
Faz 1 — Çekirdek E-Ticaret MVP
Hedef: Satış yapılabilir minimum sistem.
Kapsam:
Kullanıcı yönetimi
Ürün yönetimi
Kategori yönetimi
Stok yönetimi
Sepet
Sipariş
Ödeme
Adres
Kargo bilgisi
Admin panel
Temel bildirim
Temel raporlama
Temel SEO

Faz 2 — Operasyonel Güçlendirme
Hedef: Sistemi daha yönetilebilir ve satış odaklı hale getirmek.
Kapsam:
Kampanya yönetimi
Kupon yönetimi
İade/iptal geliştirmeleri
Ürün yorumları
Favoriler
Gelişmiş dashboard
SMS/e-posta şablonları
CMS yönetimi
Gelişmiş SEO
E-fatura/e-arşiv entegrasyonu

Faz 3 — Ölçekleme ve Entegrasyon
Hedef: Sistemi büyütmek, otomasyon ve dış entegrasyonları artırmak.
Kapsam:
Pazaryeri entegrasyonları
ERP entegrasyonu
Kargo API entegrasyonu
Çoklu depo
Çoklu satıcı
Sadakat sistemi
Ürün öneri sistemi
Gelişmiş müşteri segmentasyonu
Mobil uygulama
B2B satış modülü

10. Veri Modeli Ana Entity Listesi
Başlangıç için ana tablolar/entity’ler:
Kullanıcı
User
Role
Permission
UserRole
UserAddress
UserConsent
Ürün
Product
ProductVariant
ProductImage
ProductAttribute
ProductAttributeValue
Category
Brand
ProductCategory
ProductPrice
ProductSeo
Stok
Stock
StockMovement
Warehouse
StockReservation
Sepet
Cart
CartItem
CartCoupon
Sipariş
Order
OrderItem
OrderAddress
OrderStatusHistory
OrderNote
Ödeme
Payment
PaymentTransaction
PaymentRefund
PaymentLog
Kargo
Shipment
ShipmentTracking
CargoCompany
Kampanya
Campaign
Coupon
CouponUsage
CampaignProduct
CampaignCategory
İade/İptal
ReturnRequest
ReturnRequestItem
Refund
CancelRequest
İçerik
Page
Banner
Menu
MenuItem
Faq
SiteSetting
Raporlama / Log
AuditLog
IntegrationLog
ErrorLog
NotificationLog

11. Kritik Teknik Olmayan Kararlar
Bu kararlar baştan netleşmeli.
11.1. Üyelik Zorunlu mu?
Seçenekler:
Sadece üyeler alışveriş yapabilir.
Misafir alışveriş desteklenir.
Misafir alışveriş sonrası otomatik hesap oluşturulur.
Net öneri: Misafir alışveriş desteklenebilir ama sipariş takibi için e-posta/telefon doğrulaması iyi tasarlanmalı.

11.2. Stok Ne Zaman Düşülecek?
Seçenekler:
Sepete ekleyince stok düş.
Sipariş oluşunca rezerve et.
Ödeme başarılı olunca düş.
Net öneri:
Sepette stok düşülmez.
Sipariş oluşturulurken stok rezerve edilir.
Ödeme başarılı olunca stok kesin düşülür.
Ödeme başarısız olursa rezervasyon bırakılır.


11.3. Sipariş Numarası Nasıl Üretilecek?
Örnek formatlar:
ORD-20260506-000001
ECM-20260506-123456
SIP-2026-0000001

Net öneri:
SIP-{YYYYMMDD}-{Sıralı Numara}

Örnek:
SIP-20260506-000123


11.4. Ürün Silme Nasıl Olacak?
Net öneri:
Siparişe konu olmuş ürün fiziksel olarak silinmemeli.
Ürün pasif hale getirilmeli.
Admin panelde “silindi/pasif” olarak gösterilmeli.
Veri bütünlüğü korunmalı.

11.5. Fiyat Değişikliği Eski Siparişleri Etkiler mi?
Hayır.
Net kural:
Sipariş satırında ürün adı, SKU, fiyat, KDV, indirim bilgisi snapshot olarak tutulur.
Ürün fiyatı sonradan değişirse eski sipariş değişmez.

12. Güvenlik İhtiyaçları
Minimum Güvenlik Gereksinimleri
Şifre hashleme
JWT/session güvenliği
Admin panel yetkilendirme
Rol bazlı erişim
Rate limiting
CAPTCHA — kritik formlar için
CSRF koruması
XSS koruması
SQL injection koruması
Dosya yükleme güvenliği
Ödeme bilgisi saklamama
Admin işlem logları
IP bazlı anomali takibi
Kritik Nokta
Admin panel, ödeme callback endpointleri, stok güncelleme endpointleri ve sipariş durum güncelleme endpointleri özellikle korunmalıdır.

13. Performans İhtiyaçları
E-ticaret sisteminde performans doğrudan satışa etki eder.
Kritik Performans Alanları
Ürün listeleme
Ürün arama
Kategori sayfaları
Sepet işlemleri
Checkout akışı
Ödeme dönüşleri
Admin sipariş listesi
Raporlama ekranları
Öneriler
Ürün listeleme cache’lenebilir.
Kategori ağacı cache’lenebilir.
Ana sayfa blokları cache’lenebilir.
Arama için ileride Elasticsearch/OpenSearch kullanılabilir.
Görseller CDN üzerinden servis edilebilir.
Sayfalama zorunlu olmalı.
Admin listelerinde filtreleme/sayfalama olmalı.
Raporlama sorguları ana transaction tablolarını yormamalı.

14. Operasyonel Riskler
En Kritik Riskler
Risk
Etki
Stok tutarsızlığı
Olmayan ürün satılır
Ödeme callback hatası
Ödeme alınıp sipariş oluşmayabilir
Kargo entegrasyon hatası
Teslimat takibi bozulur
Fiyat hatası
Zararına satış yapılabilir
Admin yetki hatası
Yanlış kişiler kritik işlem yapabilir
Log eksikliği
Sorunlar geriye dönük izlenemez
İade süreci belirsizliği
Operasyonel karmaşa oluşur
SEO yapısının yanlış kurulması
Organik trafik kaybı olur


15. Başlangıç İçin Net Önerilen MVP Backlog
Aşağıdaki sırayla geliştirme mantıklı olur.
1. Altyapı ve Temel Yönetim
Kullanıcı modeli
Rol/yetki modeli
Admin giriş sistemi
Sistem ayarları
Audit log altyapısı
2. Katalog Yönetimi
Kategori yönetimi
Marka yönetimi
Ürün yönetimi
Ürün görselleri
Ürün varyantları
Ürün fiyatları
Ürün stokları
3. Müşteri Arayüzü
Ana sayfa
Kategori sayfası
Ürün listeleme
Ürün detay
Arama
Sepete ekleme
4. Sepet ve Checkout
Sepet yönetimi
Adres yönetimi
Teslimat seçimi
Sipariş özeti
Sipariş oluşturma
5. Ödeme
Ödeme sağlayıcı entegrasyonu
Ödeme başarılı/başarısız dönüşleri
Payment log
Sipariş ödeme durumu güncelleme
6. Sipariş Operasyonu
Admin sipariş listesi
Sipariş detay
Sipariş durum güncelleme
Kargo takip bilgisi
Müşteri sipariş geçmişi
7. Bildirimler
Sipariş alındı e-postası
Ödeme başarılı e-postası
Kargo e-postası
Şifre sıfırlama e-postası
8. Temel Raporlama
Günlük sipariş sayısı
Günlük satış tutarı
Bekleyen siparişler
Kritik stok ürünleri

16. Nihai Modül Önceliklendirme Tablosu
Modül
MVP
Faz 2
Faz 3
Not
Kullanıcı Yönetimi
✅




Zorunlu
Rol/Yetki Yönetimi
✅




Admin güvenliği için şart
Ürün Yönetimi
✅




Çekirdek modül
Kategori Yönetimi
✅




Çekirdek modül
Marka Yönetimi
✅




Tavsiye edilir
Stok Yönetimi
✅




Kritik
Depo Yönetimi
Basit
✅


Tek depo ile başlanabilir
Fiyat Yönetimi
✅
✅


Kampanya ile gelişir
Sepet Yönetimi
✅




Zorunlu
Sipariş Yönetimi
✅




Zorunlu
Ödeme Yönetimi
✅




Zorunlu
Kargo Yönetimi
✅
✅


İlk faz manuel olabilir
Adres Yönetimi
✅




Zorunlu
Kampanya Yönetimi


✅


Satış artırır
Kupon Yönetimi


✅


Faz 2
İade/İptal
Basit
✅


MVP’de basit iptal olmalı
Favoriler


✅


Kullanıcı deneyimi
Yorum/Puanlama


✅


Güven artırır
Bildirim
✅
✅


E-posta MVP’de şart
Raporlama
Basit
✅


Fazla geç kalmamalı
CMS
Basit
✅


Banner/sayfa yönetimi
SEO
Temel
✅


URL yapısı baştan doğru olmalı
Fatura
Basit
✅
✅
İş modeline göre kritik
Pazaryeri




✅
Sonra
Marketplace




✅
İlk fazda önermem
Mobil App




✅
Web oturmadan başlanmamalı


17. En Net Stratejik Tavsiye
Bu projeye doğrudan “her şeyi olan e-ticaret” olarak başlamak yanlış olur. Sağlam yaklaşım şu:
Önce satış yapabilen çekirdek sistem.
Sonra operasyonu güçlendiren modüller.
Sonra pazarlama, entegrasyon ve ölçekleme modülleri.

Yani doğru sıra:
Ürün → Stok → Sepet → Sipariş → Ödeme → Kargo → Admin Operasyon → Raporlama → Kampanya → Entegrasyon

İlk sürümün hedefi “çok özellik” olmamalı. İlk sürümün hedefi:
Doğru stok yönetimi
Hatasız ödeme akışı
Tutarlı sipariş yönetimi
Yönetilebilir admin paneli
Geriye dönük izlenebilir log yapısı
olmalı.
Bunlar sağlam kurulursa üzerine kampanya, pazaryeri, mobil uygulama, marketplace gibi modüller güvenle eklenir. Bunlar zayıf kurulursa proje büyüdükçe operasyon bozulur.
ıdaki dokümanı ana analiz dokümanı olarak kullanabilirsin. Bunu e-ticaret projesinin modül bazlı ürün kapsamı + geliştirme rehberi + MVP ayrımı gibi düşün. Teknik mimari detayına girmeden, ama yazılım geliştirmeye doğrudan yön verecek netlikte hazırladım.

E-Ticaret Sitesi Ana Analiz Dokümanı
1. Projenin Genel Amacı
Amaç; ürünlerin online olarak listelendiği, kullanıcıların ürünleri sepete ekleyip sipariş verebildiği, ödeme yapabildiği, siparişlerini takip edebildiği ve yönetim paneli üzerinden tüm operasyonun kontrol edilebildiği kapsamlı bir e-ticaret platformu geliştirmektir.
Bu sistem sadece “ürün göster - sepete ekle - ödeme al” seviyesinde düşünülmemelidir. Sağlıklı bir e-ticaret sistemi; ürün yönetimi, stok yönetimi, fiyat yönetimi, kampanya yönetimi, sipariş yönetimi, ödeme yönetimi, kargo yönetimi, müşteri yönetimi, iade/iptal süreçleri, raporlama ve operasyonel yönetim gibi birçok modülden oluşmalıdır.

2. Ana Kullanıcı Tipleri
2.1. Ziyaretçi Kullanıcı
Sisteme giriş yapmadan siteyi gezen kullanıcıdır.
Yapabilecekleri:
Ürünleri listeleyebilir.
Ürün detayını görebilir.
Kategori bazlı gezinebilir.
Arama yapabilir.
Kampanyaları görebilir.
Sepete ürün ekleyebilir.
Üye olmadan sipariş opsiyonu varsa alışveriş yapabilir.

2.2. Üye Kullanıcı / Müşteri
Sisteme kayıt olmuş kullanıcıdır.
Yapabilecekleri:
Giriş yapabilir.
Profilini yönetebilir.
Adreslerini yönetebilir.
Favori ürünlerini görebilir.
Sepetini yönetebilir.
Sipariş oluşturabilir.
Sipariş geçmişini görebilir.
İade/iptal talebi oluşturabilir.
Kupon/kampanya kullanabilir.
Ürün yorumları yapabilir.

2.3. Admin / Yönetici
Sistemin tüm operasyonunu yöneten kullanıcıdır.
Yapabilecekleri:
Ürünleri yönetir.
Kategorileri yönetir.
Stokları yönetir.
Siparişleri takip eder.
Sipariş durumlarını günceller.
Kampanya ve kupon tanımlar.
Kullanıcıları yönetir.
İade/iptal süreçlerini yönetir.
Raporları inceler.
Sistem ayarlarını yönetir.

2.4. Operasyon Kullanıcısı
Admin kadar geniş yetkisi olmayan, günlük operasyonları yöneten kullanıcıdır.
Örnek roller:
Sipariş operasyon sorumlusu
Depo/stok sorumlusu
Müşteri hizmetleri
Muhasebe/finans kullanıcısı
İçerik yöneticisi

3. Ana Modül Listesi
E-ticaret sitesi aşağıdaki ana modüllerden oluşmalıdır:
No
Modül
Öncelik
1
Kullanıcı Yönetimi
MVP
2
Yetki ve Rol Yönetimi
MVP
3
Ürün Yönetimi
MVP
4
Kategori Yönetimi
MVP
5
Stok Yönetimi
MVP
6
Fiyat Yönetimi
MVP
7
Sepet Yönetimi
MVP
8
Sipariş Yönetimi
MVP
9
Ödeme Yönetimi
MVP
10
Kargo/Teslimat Yönetimi
MVP
11
Adres Yönetimi
MVP
12
Kampanya/Kupon Yönetimi
Faz 2
13
İade/İptal Yönetimi
Faz 2
14
Favori/İstek Listesi
Faz 2
15
Yorum ve Puanlama
Faz 2
16
Bildirim Yönetimi
Faz 2
17
Raporlama ve Dashboard
Faz 2
18
İçerik/CMS Yönetimi
Faz 2
19
SEO Yönetimi
Faz 2
20
Entegrasyon Yönetimi
Faz 2 / Faz 3
21
Muhasebe/Fatura Yönetimi
Faz 2 / Faz 3
22
Pazaryeri Entegrasyonları
Faz 3
23
Çoklu Satıcı / Marketplace
Faz 3
24
Müşteri Hizmetleri Modülü
Faz 3
25
Denetim / Log / Audit Modülü
MVP / Faz 2


4. Modül Bazlı Detaylı Analiz

4.1. Kullanıcı Yönetimi Modülü
Amaç
Müşteri, admin ve operasyon kullanıcılarının sisteme kayıt olması, giriş yapması, profil bilgilerinin yönetilmesi ve hesap güvenliğinin sağlanmasıdır.
Alt Özellikler
Müşteri Tarafı
Kayıt olma
Giriş yapma
Şifremi unuttum
Şifre değiştirme
Profil bilgisi güncelleme
Telefon/e-posta doğrulama
Hesap silme veya pasifleştirme
KVKK / açık rıza onayları
Ticari ileti izni
Admin Tarafı
Kullanıcı listeleme
Kullanıcı arama/filtreleme
Kullanıcı detay görüntüleme
Kullanıcıyı aktif/pasif yapma
Kullanıcı siparişlerini görüntüleme
Kullanıcı adreslerini görüntüleme
Kullanıcı rollerini yönetme
Temel Veri Alanları
Alan
Açıklama
Id
Kullanıcı benzersiz kimliği
Name
Ad
Surname
Soyad
Email
E-posta
PhoneNumber
Telefon
PasswordHash
Şifrelenmiş parola
IsActive
Aktif/pasif durumu
EmailConfirmed
E-posta doğrulandı mı
PhoneConfirmed
Telefon doğrulandı mı
CreatedDate
Oluşturma tarihi
LastLoginDate
Son giriş tarihi

Dikkat Edilmesi Gerekenler
Şifre düz metin saklanmamalı.
E-posta benzersiz olmalı.
Telefon benzersiz yapılabilir ama zorunlu olmayabilir.
Admin ve müşteri hesapları rol bazlı ayrılmalı.
KVKK ve ticari ileti izinleri ayrıca tutulmalı.

4.2. Rol ve Yetki Yönetimi Modülü
Amaç
Admin panelinde kimin hangi işlemi yapabileceğini kontrol etmektir.
Roller
Örnek roller:
Rol
Açıklama
SuperAdmin
Tüm sisteme erişir
Admin
Genel yönetim yetkisine sahiptir
ProductManager
Ürün ve kategori yönetir
StockManager
Stok süreçlerini yönetir
OrderManager
Siparişleri yönetir
CustomerSupport
Müşteri ve sipariş destek süreçlerini yönetir
FinanceUser
Ödeme, fatura ve finansal raporları görür
ContentManager
Banner, sayfa ve içerikleri yönetir

Yetki Örnekleri
Product.Create
Product.Update
Product.Delete
Product.View
Order.View
Order.ChangeStatus
Stock.Update
Campaign.Create
User.Manage
Report.View
Dikkat Edilmesi Gerekenler
Bu modül baştan doğru tasarlanmalı. Sonradan admin paneline rol/yetki eklemek maliyetlidir.

4.3. Ürün Yönetimi Modülü
Amaç
Satılacak ürünlerin yönetilmesini sağlar. E-ticaret sisteminin merkez modülüdür.
Alt Özellikler
Ürün oluşturma
Ürün güncelleme
Ürün silme/pasifleştirme
Ürün listeleme
Ürün detay görüntüleme
Ürün görsel yönetimi
Ürün varyant yönetimi
Ürün özellik yönetimi
Ürün marka bilgisi
Ürün barkod/SKU yönetimi
Ürün SEO bilgileri
Ürün yayın durumu yönetimi
Ürün Tipleri
Başlangıçta şu ürün tipleri desteklenebilir:
Ürün Tipi
Açıklama
Basit Ürün
Tekil ürün, varyantsız
Varyantlı Ürün
Renk, beden, numara gibi seçenekleri olan ürün
Dijital Ürün
Dosya, lisans, eğitim gibi fiziksel olmayan ürün
Paket Ürün
Birden fazla ürünün paket halinde satılması

MVP için Basit Ürün + Varyantlı Ürün yeterlidir.
Temel Ürün Alanları
Alan
Açıklama
Id
Ürün kimliği
Name
Ürün adı
Slug
SEO uyumlu URL
Description
Ürün açıklaması
ShortDescription
Kısa açıklama
SKU
Stok kodu
Barcode
Barkod
BrandId
Marka
CategoryId
Kategori
Price
Satış fiyatı
DiscountPrice
İndirimli fiyat
Currency
Para birimi
TaxRate
KDV oranı
StockQuantity
Stok miktarı
IsActive
Aktif/pasif
IsPublished
Yayında mı
CreatedDate
Oluşturma tarihi

Ürün Görselleri
Her ürünün birden fazla görseli olabilir.
Alanlar:
Alan
Açıklama
ProductId
Ürün
ImageUrl
Görsel yolu
SortOrder
Sıralama
IsMain
Ana görsel mi

Ürün Varyantları
Örnek:
Tişört
Renk: Siyah
Beden: M
SKU: TSHIRT-BLACK-M
Stok: 15
Fiyat: 499 TL
Varyant alanları:
Alan
Açıklama
ProductId
Ana ürün
VariantName
Varyant adı
SKU
Varyant stok kodu
Barcode
Barkod
Price
Varyant fiyatı
StockQuantity
Stok
Attributes
Renk, beden, numara gibi bilgiler

Dikkat Edilmesi Gerekenler
Ürün silme yerine pasifleştirme tercih edilmeli.
Siparişe konu olmuş ürünler fiziksel olarak silinmemeli.
Ürün fiyatı değişse bile eski siparişin fiyatı değişmemeli.
Sipariş satırında ürün adı, fiyatı, KDV, SKU gibi bilgiler snapshot olarak saklanmalı.
Stok varyant bazlı yönetilmelidir.
SEO için slug benzersiz olmalıdır.

4.4. Kategori Yönetimi Modülü
Amaç
Ürünlerin hiyerarşik şekilde gruplanmasını sağlar.
Özellikler
Kategori oluşturma
Alt kategori oluşturma
Kategori güncelleme
Kategori silme/pasifleştirme
Kategori sıralama
Kategori görseli
Menüde göster/gizle
SEO bilgileri
Kategori Yapısı
Örnek:
Kadın
 ├── Giyim
 │    ├── Elbise
 │    ├── Pantolon
 │    └── Gömlek
 └── Ayakkabı
      ├── Spor Ayakkabı
      └── Bot

Temel Alanlar
Alan
Açıklama
Id
Kategori kimliği
ParentCategoryId
Üst kategori
Name
Kategori adı
Slug
SEO URL
Description
Açıklama
ImageUrl
Görsel
SortOrder
Sıralama
IsActive
Aktif/pasif
ShowInMenu
Menüde gösterilsin mi

Dikkat Edilmesi Gerekenler
Kategori ağacı sınırsız derinlikte tasarlanabilir ama pratikte 3-4 seviye yeterlidir.
İçinde aktif ürün bulunan kategori doğrudan silinmemeli.
SEO URL’leri benzersiz olmalı.
Menü performansı için kategori ağacı cache’lenebilir.

4.5. Marka Yönetimi Modülü
Amaç
Ürünlerin markaya göre yönetilmesini sağlar.
Özellikler
Marka ekleme
Marka güncelleme
Marka pasifleştirme
Marka logosu
Marka açıklaması
Marka SEO sayfası
Markaya göre ürün listeleme
Alanlar
Alan
Açıklama
Id
Marka kimliği
Name
Marka adı
Slug
SEO URL
LogoUrl
Logo
Description
Açıklama
IsActive
Aktif/pasif


4.6. Stok Yönetimi Modülü
Amaç
Ürünlerin satışa uygun stok miktarlarının doğru şekilde yönetilmesini sağlar.
Stok İşlem Tipleri
İşlem
Açıklama
StockIn
Stok girişi
StockOut
Stok çıkışı
Reservation
Sipariş sırasında stok rezervasyonu
ReleaseReservation
Sipariş iptalinde rezervasyon iadesi
Adjustment
Manuel stok düzeltme
Return
İade sonrası stok artışı
Damage
Hasarlı ürün düşümü

Temel Özellikler
Ürün/varyant bazlı stok takibi
Stok giriş/çıkış hareketleri
Kritik stok seviyesi
Stok rezervasyonu
Stok geçmişi
Depo bazlı stok yönetimi
Manuel stok düzeltme
Stok raporu
Stok Alanları
Alan
Açıklama
ProductId
Ürün
ProductVariantId
Varyant
WarehouseId
Depo
Quantity
Mevcut stok
ReservedQuantity
Rezerve stok
AvailableQuantity
Satılabilir stok
CriticalStockLevel
Kritik stok seviyesi

Satılabilir Stok Formülü
Satılabilir Stok = Mevcut Stok - Rezerve Stok

Kritik İş Kuralları
Sepete ekleme sırasında stok düşülmemeli.
Sipariş oluşturulurken stok rezerve edilmeli.
Ödeme başarılı olursa stok kesin düşülmeli.
Ödeme başarısız olursa rezervasyon serbest bırakılmalı.
Sipariş iptal edilirse stok geri alınmalı.
Aynı ürünü aynı anda birçok kullanıcı alabilir; concurrency kontrolü şarttır.
Dikkat Edilmesi Gerekenler
Stok yönetimi e-ticarette en riskli modüllerden biridir. Yanlış tasarlanırsa:
Olmayan ürün satılır.
Aynı stok iki kişiye satılır.
İptal/iade sonrası stok hatalı görünür.
Depo operasyonu ile sistem tutarsız hale gelir.
Bu yüzden stok hareketleri mutlaka loglanmalı ve mümkünse transactional yönetilmelidir.

4.7. Depo Yönetimi Modülü
Amaç
Birden fazla depo veya mağaza stoğu yönetilecekse kullanılır.
Özellikler
Depo tanımlama
Depo adresi
Depo aktif/pasif durumu
Depo bazlı stok
Depolar arası stok transferi
Siparişin hangi depodan karşılanacağı
MVP İçin Durum
Tek depolu yapı varsa basit tutulabilir. Ancak ileride büyüme ihtimali varsa veri modeli depo destekli kurulmalıdır.

4.8. Fiyat Yönetimi Modülü
Amaç
Ürün fiyatlarının, indirimli fiyatların, para biriminin ve KDV bilgilerinin yönetilmesini sağlar.
Özellikler
Normal satış fiyatı
İndirimli fiyat
KDV oranı
Para birimi
Fiyat geçerlilik tarihi
Varyant bazlı fiyat
Müşteri grubuna özel fiyat
Kampanya bazlı fiyat
Fiyat Alanları
Alan
Açıklama
ProductId
Ürün
VariantId
Varyant
ListPrice
Liste fiyatı
SalePrice
Satış fiyatı
DiscountPrice
İndirimli fiyat
TaxRate
KDV oranı
Currency
Para birimi
StartDate
Başlangıç tarihi
EndDate
Bitiş tarihi

Kritik İş Kuralları
Sipariş verildiği anda ürün fiyatı sipariş satırına kopyalanmalıdır.
Ürün fiyatı sonradan değişse bile geçmiş sipariş etkilenmemelidir.
KDV oranı sipariş satırında saklanmalıdır.
Kampanya uygulanmışsa kampanya indirimi ayrıca görünmelidir.

4.9. Sepet Yönetimi Modülü
Amaç
Kullanıcının satın almak istediği ürünleri geçici olarak tuttuğu yapıdır.
Özellikler
Sepete ürün ekleme
Sepetten ürün çıkarma
Ürün adedi artırma/azaltma
Sepeti görüntüleme
Sepeti temizleme
Kupon uygulama
Kargo tutarı hesaplama
Sepet toplamı hesaplama
Misafir kullanıcı sepeti
Üye olduktan sonra misafir sepetini kullanıcıya bağlama
Sepet Alanları
Alan
Açıklama
CartId
Sepet kimliği
UserId
Kullanıcı
SessionId
Misafir kullanıcı oturumu
ProductId
Ürün
VariantId
Varyant
Quantity
Adet
UnitPrice
Birim fiyat
TotalPrice
Toplam fiyat

Sepet Hesaplama Kalemleri
Kalem
Açıklama
Ürün toplamı
Ürünlerin toplam tutarı
İndirim toplamı
Kampanya/kupon indirimi
KDV toplamı
Vergi toplamı
Kargo tutarı
Teslimat ücreti
Genel toplam
Ödenecek net tutar

Kritik İş Kuralları
Sepette ürün olması stok garantisi anlamına gelmez.
Stok kontrolü ödeme/sipariş aşamasında tekrar yapılmalıdır.
Fiyat değişmişse kullanıcı checkout öncesi bilgilendirilmelidir.
Sepet belirli süre sonra expire edilebilir.
Misafir sepeti cookie/session ile yönetilebilir.

4.10. Sipariş Yönetimi Modülü
Amaç
Kullanıcının satın alma işlemini temsil eder. E-ticaret sisteminin en kritik operasyon modülüdür.
Sipariş Durumları
Önerilen sipariş yaşam döngüsü:
Created
PaymentPending
PaymentCompleted
Preparing
Shipped
Delivered
Completed
Cancelled
RefundRequested
Refunded
Failed

Durum Açıklamaları
Durum
Açıklama
Created
Sipariş oluşturuldu
PaymentPending
Ödeme bekleniyor
PaymentCompleted
Ödeme başarılı
Preparing
Sipariş hazırlanıyor
Shipped
Kargoya verildi
Delivered
Teslim edildi
Completed
Sipariş tamamlandı
Cancelled
İptal edildi
RefundRequested
İade talebi oluşturuldu
Refunded
Ücret iadesi yapıldı
Failed
Sipariş başarısız

Sipariş Özellikleri
Sipariş oluşturma
Sipariş detay görüntüleme
Sipariş listeleme
Sipariş durum güncelleme
Sipariş iptal etme
Sipariş kargo bilgisi
Sipariş ödeme bilgisi
Sipariş fatura bilgisi
Sipariş notları
Admin sipariş yönetimi
Müşteri sipariş geçmişi
Sipariş Ana Alanları
Alan
Açıklama
Id
Sipariş kimliği
OrderNumber
Sipariş numarası
UserId
Müşteri
Status
Sipariş durumu
TotalProductAmount
Ürün toplamı
DiscountAmount
İndirim toplamı
ShippingAmount
Kargo tutarı
TaxAmount
KDV toplamı
GrandTotal
Genel toplam
PaymentStatus
Ödeme durumu
ShippingStatus
Kargo durumu
BillingAddressId
Fatura adresi
ShippingAddressId
Teslimat adresi
CreatedDate
Sipariş tarihi

Sipariş Satır Alanları
Alan
Açıklama
OrderId
Sipariş
ProductId
Ürün
VariantId
Varyant
ProductName
Sipariş anındaki ürün adı
SKU
Sipariş anındaki SKU
Quantity
Adet
UnitPrice
Birim fiyat
DiscountAmount
Satır indirimi
TaxRate
KDV oranı
TaxAmount
KDV tutarı
LineTotal
Satır toplamı

Kritik İş Kuralları
Sipariş numarası benzersiz olmalı.
Ürün bilgileri snapshot olarak sipariş satırında tutulmalı.
Sipariş oluşturma, stok rezervasyonu ve ödeme süreci tutarlı yönetilmeli.
Sipariş durum geçişleri kontrolsüz olmamalı.
Her sipariş durum değişikliği loglanmalı.
Admin sipariş durumunu değiştirdiğinde kimin değiştirdiği tutulmalı.

4.11. Ödeme Yönetimi Modülü
Amaç
Kullanıcının sipariş bedelini güvenli şekilde ödemesini sağlar.
Ödeme Yöntemleri
Başlangıç için:
Kredi kartı
Banka kartı
Havale/EFT
Kapıda ödeme
Cüzdan/bakiye sistemi — ileri faz
Sanal POS Entegrasyonları
Türkiye pazarı için muhtemel entegrasyonlar:
Iyzico
PayTR
Param
Stripe — global kullanım için
Banka sanal POS sistemleri
Ödeme Durumları
Durum
Açıklama
Pending
Ödeme bekleniyor
Paid
Ödeme başarılı
Failed
Ödeme başarısız
Cancelled
Ödeme iptal edildi
Refunded
İade edildi
PartiallyRefunded
Kısmi iade edildi

Ödeme Alanları
Alan
Açıklama
OrderId
Sipariş
PaymentProvider
Ödeme sağlayıcı
PaymentMethod
Ödeme yöntemi
TransactionId
Sağlayıcı işlem numarası
Amount
Tutar
Currency
Para birimi
Status
Ödeme durumu
PaidDate
Ödeme tarihi
ErrorCode
Hata kodu
ErrorMessage
Hata mesajı

Kritik İş Kuralları
Kart bilgisi sistemde saklanmamalı.
3D Secure desteklenmeli.
Ödeme callback/webhook mekanizması olmalı.
Ödeme başarılı olmadan sipariş kesinleşmemeli.
Ödeme başarısızsa stok rezervasyonu serbest bırakılmalı.
Provider response detayları loglanmalı.
Aynı ödeme callback’i birden fazla kez gelebilir; idempotent yapı kurulmalı.

4.12. Kargo ve Teslimat Yönetimi Modülü
Amaç
Siparişlerin müşteriye teslim edilme sürecini yönetir.
Özellikler
Kargo firması tanımlama
Kargo fiyatı hesaplama
Kargo takip numarası
Kargoya verildi bilgisi
Teslim edildi bilgisi
Kargo durum sorgulama
Ücretsiz kargo limiti
Desi/ağırlık bazlı kargo fiyatı
Bölge bazlı teslimat kısıtları
Kargo Durumları
Durum
Açıklama
NotShipped
Kargoya verilmedi
Preparing
Hazırlanıyor
Shipped
Kargoya verildi
InTransit
Taşımada
Delivered
Teslim edildi
FailedDelivery
Teslim edilemedi
Returned
Geri döndü

Kargo Alanları
Alan
Açıklama
OrderId
Sipariş
CargoCompany
Kargo firması
TrackingNumber
Takip numarası
TrackingUrl
Takip linki
ShippingCost
Kargo ücreti
ShippedDate
Kargoya veriliş tarihi
DeliveredDate
Teslim tarihi

Dikkat Edilmesi Gerekenler
Kargo takip numarası siparişe bağlanmalı.
Müşteriye kargo bilgilendirme mail/SMS gönderilmeli.
Admin panelinden manuel kargo bilgisi girilebilmeli.
İleri fazda kargo API entegrasyonu yapılabilir.

4.13. Adres Yönetimi Modülü
Amaç
Kullanıcının teslimat ve fatura adreslerini yönetmesini sağlar.
Özellikler
Adres ekleme
Adres güncelleme
Adres silme
Varsayılan teslimat adresi
Varsayılan fatura adresi
İl/ilçe/mahalle seçimi
Kurumsal/bireysel fatura adresi
Adres Alanları
Alan
Açıklama
UserId
Kullanıcı
AddressTitle
Adres başlığı
FirstName
Ad
LastName
Soyad
PhoneNumber
Telefon
Country
Ülke
City
İl
District
İlçe
Neighborhood
Mahalle
FullAddress
Açık adres
PostalCode
Posta kodu
IsDefaultShipping
Varsayılan teslimat
IsDefaultBilling
Varsayılan fatura
InvoiceType
Bireysel/kurumsal
TaxNumber
Vergi no
TaxOffice
Vergi dairesi
CompanyName
Firma adı

Kritik İş Kuralları
Sipariş oluşturulduğunda adres bilgisi siparişe snapshot olarak kopyalanmalıdır.
Kullanıcı adresini sonradan değiştirdiğinde eski sipariş adresi değişmemelidir.
Kurumsal fatura için vergi no, vergi dairesi ve firma adı alınmalıdır.

4.14. Kampanya ve Kupon Yönetimi Modülü
Amaç
Satışları artırmak için indirim, promosyon ve kupon mekanizmalarının yönetilmesini sağlar.
Kampanya Türleri
Kampanya
Açıklama
Sepette indirim
Sepet toplamına göre indirim
Ürün indirimi
Belirli ürünlerde indirim
Kategori indirimi
Belirli kategorilerde indirim
Marka indirimi
Belirli markalarda indirim
Kupon kodu
Kullanıcının kod girerek indirim alması
Ücretsiz kargo
Belirli tutar üstü ücretsiz kargo
2 al 1 öde
Çoklu ürün kampanyası
İlk alışveriş indirimi
Yeni müşteriye özel

Kupon Alanları
Alan
Açıklama
Code
Kupon kodu
DiscountType
Tutar/yüzde
DiscountValue
İndirim değeri
MinOrderAmount
Minimum sipariş tutarı
MaxDiscountAmount
Maksimum indirim
UsageLimit
Toplam kullanım limiti
UserUsageLimit
Kullanıcı bazlı limit
StartDate
Başlangıç
EndDate
Bitiş
IsActive
Aktif/pasif

Kritik İş Kuralları
Kupon kullanım limiti kontrol edilmeli.
Aynı kupon aynı kullanıcı tarafından sınırsız kullanılmamalı.
Kampanya çakışmaları net yönetilmeli.
Sepet tutarı değişirse kupon uygunluğu tekrar hesaplanmalı.
İptal/iade durumunda kupon kullanım hakkı geri verilip verilmeyeceği belirlenmeli.

4.15. İade ve İptal Yönetimi Modülü
Amaç
Müşterinin sipariş iptali veya ürün iadesi süreçlerini yönetir.
İptal Süreci
Sipariş henüz kargoya verilmediyse iptal edilebilir.
İptal durumunda:
Sipariş durumu Cancelled yapılır.
Stok geri alınır.
Ödeme alındıysa iade süreci başlatılır.
Müşteriye bilgilendirme gönderilir.
İade Süreci
Sipariş teslim edildikten sonra müşteri iade talebi oluşturabilir.
İade nedenleri:
Ürün hasarlı
Yanlış ürün gönderildi
Ürünü beğenmedim
Beden/numara uymadı
Eksik ürün
Diğer
İade Durumları
Durum
Açıklama
Requested
İade talep edildi
Approved
İade onaylandı
Rejected
İade reddedildi
WaitingForProduct
Ürün bekleniyor
ProductReceived
Ürün teslim alındı
RefundCompleted
Para iadesi tamamlandı

Kritik İş Kuralları
İade süresi belirlenmeli.
Bazı ürünler iade edilemeyebilir.
Kısmi iade desteklenmeli.
İade edilen ürün stoklara geri alınacak mı, hasarlı stoğa mı gidecek netleşmeli.
Para iadesi ödeme provider üzerinden yapılmalı.
İade/iptal operasyonları audit log ile takip edilmeli.

4.16. Favori / İstek Listesi Modülü
Amaç
Kullanıcıların beğendiği ürünleri daha sonra erişmek üzere kaydetmesini sağlar.
Özellikler
Favoriye ekleme
Favoriden çıkarma
Favori ürünleri listeleme
Favori ürün stokta yoksa bilgilendirme
Favori ürün indirime girerse bildirim
MVP Durumu
MVP için zorunlu değildir ama kullanıcı bağlılığı için değerlidir.

4.17. Ürün Yorum ve Puanlama Modülü
Amaç
Kullanıcıların satın aldıkları ürünler hakkında yorum yapmasını sağlar.
Özellikler
Ürün puanlama
Ürün yorumu
Görselli yorum
Yorum onay mekanizması
Yorumu yayından kaldırma
Kullanıcı yorumu düzenleme
Satın alan kullanıcı rozeti
Kritik İş Kuralları
Sadece ürünü satın alan kullanıcı yorum yapmalı.
Yorumlar admin onayından sonra yayınlanabilir.
Hakaret/küfür filtresi kullanılabilir.
Sahte yorum engellenmelidir.

4.18. Bildirim Yönetimi Modülü
Amaç
Kullanıcılara sistem olayları hakkında bilgi gönderilmesini sağlar.
Bildirim Kanalları
E-posta
SMS
Push notification
WhatsApp — ileri faz
Site içi bildirim
Bildirim Olayları
Olay
Bildirim
Üyelik oluşturuldu
Hoş geldiniz e-postası
Sipariş alındı
Sipariş onayı
Ödeme başarılı
Ödeme bilgilendirmesi
Sipariş kargoya verildi
Kargo takip bilgisi
Sipariş teslim edildi
Teslim bilgisi
İade talebi alındı
İade bilgilendirmesi
Şifre sıfırlama
Şifre reset linki
Stok geldi
Stok bildirimi
Fiyat düştü
Fiyat alarmı

Kritik İş Kuralları
Bildirim gönderimleri loglanmalı.
Başarısız bildirimler tekrar denenebilir olmalı.
Kullanıcının ticari ileti izni yoksa pazarlama bildirimi gönderilmemeli.
Transactional bildirimler ile pazarlama bildirimleri ayrılmalı.

4.19. Raporlama ve Dashboard Modülü
Amaç
Yönetim ekibinin satış, sipariş, stok ve müşteri performansını takip etmesini sağlar.
Dashboard Göstergeleri
Günlük satış tutarı
Günlük sipariş sayısı
Ortalama sepet tutarı
En çok satan ürünler
En çok görüntülenen ürünler
Stokta azalan ürünler
İptal edilen siparişler
İade oranı
Yeni müşteri sayısı
Ödeme başarısızlık oranı
Kargo bekleyen sipariş sayısı
Rapor Türleri
Rapor
Açıklama
Satış Raporu
Günlük/haftalık/aylık satışlar
Sipariş Raporu
Sipariş durumları
Ürün Raporu
Ürün performansı
Stok Raporu
Stok seviyesi
Müşteri Raporu
Müşteri davranışları
Kampanya Raporu
Kampanya performansı
İade Raporu
İade nedenleri ve oranları
Ödeme Raporu
Başarılı/başarısız ödemeler

MVP Durumu
Başlangıçta basit dashboard yeterli. Ancak sistem canlıya çıktıktan sonra raporlama çok kritik hale gelir.

4.20. İçerik / CMS Yönetimi Modülü
Amaç
Site içerisindeki statik ve pazarlama içeriklerinin yönetilmesini sağlar.
Yönetilecek İçerikler
Ana sayfa bannerları
Slider görselleri
Kampanya alanları
Hakkımızda sayfası
İletişim sayfası
SSS sayfası
KVKK sayfası
Mesafeli satış sözleşmesi
İade ve değişim politikası
Gizlilik politikası
Footer linkleri
Menü yönetimi
Özellikler
Sayfa oluşturma
Sayfa güncelleme
Sayfa yayınlama/pasifleştirme
Banner ekleme
Banner sıralama
Mobil/desktop görsel ayrımı
Yayın başlangıç/bitiş tarihi

4.21. SEO Yönetimi Modülü
Amaç
Arama motorlarında görünürlüğü artırmak için SEO bilgilerinin yönetilmesini sağlar.
SEO Alanları
Ürün, kategori, marka ve statik sayfalar için:
Alan
Açıklama
MetaTitle
SEO başlığı
MetaDescription
SEO açıklaması
MetaKeywords
Anahtar kelimeler
Slug
SEO URL
CanonicalUrl
Canonical link
OpenGraphTitle
Sosyal medya başlığı
OpenGraphImage
Sosyal medya görseli

Teknik SEO İhtiyaçları
Sitemap.xml
Robots.txt
Canonical URL
SEO dostu URL
Breadcrumb
Structured data
301 yönlendirme
404 sayfası
Sayfa hız optimizasyonu
Dikkat Edilmesi Gerekenler
SEO sonradan eklenebilir ama URL yapısı baştan doğru kurulmalıdır. Yanlış URL tasarımı ileride ciddi maliyet çıkarır.

4.22. Fatura ve Muhasebe Yönetimi Modülü
Amaç
Siparişlerin mali ve yasal belgelerinin yönetilmesini sağlar.
Özellikler
Fatura bilgisi oluşturma
Bireysel fatura
Kurumsal fatura
E-fatura / e-arşiv entegrasyonu
Fatura PDF görüntüleme
Fatura iptali
İade faturası
Muhasebe sistemine aktarım
Alanlar
Alan
Açıklama
OrderId
Sipariş
InvoiceNumber
Fatura numarası
InvoiceType
Bireysel/kurumsal
TaxNumber
Vergi no
TaxOffice
Vergi dairesi
CompanyName
Firma
InvoiceDate
Fatura tarihi
InvoiceStatus
Fatura durumu
InvoiceUrl
PDF/link

Dikkat Edilmesi Gerekenler
Türkiye’de gerçek satış yapılacaksa fatura/e-arşiv/e-fatura süreci net tasarlanmalıdır. Bu modül yasal uyumluluk açısından önemlidir.

4.23. Entegrasyon Yönetimi Modülü
Amaç
Sistemin dış servislerle kontrollü şekilde çalışmasını sağlar.
Muhtemel Entegrasyonlar
Entegrasyon
Amaç
Ödeme sağlayıcı
Online ödeme almak
Kargo firması
Kargo takip ve gönderi oluşturma
SMS sağlayıcı
SMS bildirimi
E-posta servisi
E-posta gönderimi
E-fatura sağlayıcı
Fatura oluşturma
ERP
Stok, ürün, muhasebe
CRM
Müşteri ilişkileri
Pazaryeri
Trendyol, Hepsiburada, N11 vb.
Analytics
Kullanıcı davranış analizi

Kritik İş Kuralları
Her entegrasyon response/request loglanmalı.
Entegrasyon hataları retry mekanizmasına sahip olmalı.
Timeout süreleri belirlenmeli.
Dış servis hatası tüm sistemi kilitlememeli.
Ödeme ve fatura gibi kritik entegrasyonlarda idempotency uygulanmalı.

4.24. Pazaryeri Entegrasyonları Modülü
Amaç
Ürünlerin ve siparişlerin farklı pazaryerleriyle senkronize edilmesini sağlar.
Pazaryeri Örnekleri
Trendyol
Hepsiburada
N11
Amazon
ÇiçekSepeti
Pazarama
Özellikler
Ürün gönderimi
Stok senkronizasyonu
Fiyat senkronizasyonu
Sipariş çekme
Sipariş durum güncelleme
Kargo takip gönderimi
İptal/iade senkronizasyonu
Faz Durumu
Başlangıç MVP kapsamına alınmamalı. Sistemin çekirdek e-ticaret yapısı oturduktan sonra eklenmelidir.

4.25. Çoklu Satıcı / Marketplace Modülü
Amaç
Sistemde birden fazla satıcının ürün satabilmesini sağlar.
Özellikler
Satıcı başvurusu
Satıcı onayı
Satıcı paneli
Satıcı ürün yönetimi
Satıcı stok yönetimi
Komisyon yönetimi
Satıcı ödeme/hesaplaşma
Satıcı performans raporu
Faz Durumu
Bu modül projeyi ciddi büyütür. İlk versiyonda önerilmez. Önce klasik B2C e-ticaret sistemi kurulmalı, sonra marketplace’e evrilmelidir.

4.26. Müşteri Hizmetleri Modülü
Amaç
Müşteri destek süreçlerini yönetir.
Özellikler
Sipariş bazlı destek talebi
Genel destek talebi
Talep kategorisi
Talep durumu
Admin cevaplama
Kullanıcı mesaj geçmişi
Dosya/görsel ekleme
Talep kapatma
SLA takibi
Destek Talep Durumları
Durum
Açıklama
Open
Açık
WaitingCustomer
Müşteri yanıtı bekleniyor
WaitingSupport
Destek yanıtı bekleniyor
Resolved
Çözüldü
Closed
Kapandı


4.27. Denetim / Log / Audit Modülü
Amaç
Sistemde yapılan kritik işlemlerin izlenmesini sağlar.
Loglanması Gereken İşlemler
Admin girişleri
Ürün fiyat değişiklikleri
Stok değişiklikleri
Sipariş durum değişiklikleri
Ödeme işlemleri
İade/iptal işlemleri
Kullanıcı rol değişiklikleri
Entegrasyon request/response kayıtları
Hatalar
Güvenlik ihlali denemeleri
Temel Alanlar
Alan
Açıklama
UserId
İşlemi yapan kullanıcı
Action
Yapılan işlem
EntityName
Etkilenen tablo/entity
EntityId
Etkilenen kayıt
OldValue
Eski değer
NewValue
Yeni değer
IpAddress
IP adresi
UserAgent
Tarayıcı bilgisi
CreatedDate
İşlem tarihi

Net Tavsiye
Bu modül MVP’den itibaren olmalı. Özellikle fiyat, stok, sipariş ve ödeme işlemlerinde log olmadan üretime çıkmak ciddi operasyonel risktir.

5. Müşteri Arayüzü Sayfaları
5.1. Ana Sayfa
İçerikler:
Slider/banner
Öne çıkan kategoriler
Kampanyalı ürünler
Çok satan ürünler
Yeni gelen ürünler
Markalar
Avantaj alanları: hızlı kargo, güvenli ödeme, kolay iade

5.2. Ürün Listeleme Sayfası
Özellikler:
Kategoriye göre listeleme
Arama sonucu listeleme
Filtreleme
Sıralama
Sayfalama
Ürün kartı
Favoriye ekleme
Sepete hızlı ekleme
Filtre örnekleri:
Fiyat aralığı
Marka
Kategori
Renk
Beden
Numara
Stokta var
İndirimli ürünler
Puan

5.3. Ürün Detay Sayfası
İçerikler:
Ürün görselleri
Ürün adı
Marka
Fiyat
İndirimli fiyat
Stok durumu
Varyant seçimi
Adet seçimi
Sepete ekle
Favoriye ekle
Ürün açıklaması
Teknik özellikler
Teslimat bilgisi
İade bilgisi
Yorumlar
Benzer ürünler

5.4. Sepet Sayfası
İçerikler:
Sepetteki ürünler
Adet güncelleme
Ürün çıkarma
Kupon kodu
Kargo hesaplama
Sepet özeti
Ödemeye geç butonu

5.5. Checkout / Ödeme Sayfası
Adımlar:
Giriş / üyelik / misafir devam
Teslimat adresi
Fatura adresi
Kargo seçimi
Ödeme yöntemi
Sipariş özeti
Siparişi tamamla

5.6. Sipariş Sonuç Sayfası
İçerikler:
Sipariş başarılı/başarısız bilgisi
Sipariş numarası
Ödeme sonucu
Sipariş detayına git
Alışverişe devam et

5.7. Hesabım Sayfaları
Sayfalar:
Profil bilgilerim
Adreslerim
Siparişlerim
Sipariş detay
İade taleplerim
Favorilerim
Şifre değiştir
Bildirim tercihleri

6. Admin Panel Modülleri
Admin panel, e-ticaret sisteminin operasyon merkezidir.
6.1. Dashboard
Göstergeler:
Bugünkü satış
Bugünkü sipariş
Bekleyen siparişler
Kargoya verilecek siparişler
Kritik stok ürünleri
Son siparişler
Ödeme hataları
İade talepleri

6.2. Ürün Yönetimi
Ekranlar:
Ürün listesi
Ürün ekle
Ürün düzenle
Ürün görselleri
Ürün varyantları
Ürün fiyatları
Ürün stok bilgileri
Ürün SEO bilgileri

6.3. Kategori Yönetimi
Ekranlar:
Kategori ağacı
Kategori ekle
Kategori düzenle
Kategori sıralama
Kategori SEO

6.4. Sipariş Yönetimi
Ekranlar:
Sipariş listesi
Sipariş detay
Sipariş durum güncelleme
Kargo bilgisi girme
Ödeme bilgisi görüntüleme
İptal işlemi
İade işlemi
Sipariş notları

6.5. Stok Yönetimi
Ekranlar:
Stok listesi
Stok hareketleri
Manuel stok düzeltme
Kritik stok raporu
Depo bazlı stok
Stok transferi

6.6. Kampanya Yönetimi
Ekranlar:
Kampanya listesi
Kampanya ekle
Kampanya düzenle
Kupon listesi
Kupon oluştur
Kampanya performansı

6.7. Kullanıcı Yönetimi
Ekranlar:
Müşteri listesi
Müşteri detay
Müşteri siparişleri
Admin kullanıcıları
Rol ve yetki yönetimi

6.8. İçerik Yönetimi
Ekranlar:
Banner yönetimi
Sayfa yönetimi
Menü yönetimi
Footer yönetimi
SSS yönetimi

6.9. Raporlar
Ekranlar:
Satış raporu
Sipariş raporu
Stok raporu
Ürün performans raporu
Müşteri raporu
Kampanya raporu
İade raporu

6.10. Sistem Ayarları
Ayarlar:
Site adı
Logo
Para birimi
KDV ayarları
Kargo ayarları
Ödeme sağlayıcı ayarları
E-posta ayarları
SMS ayarları
Bakım modu
Sözleşme metinleri

7. Temel İş Akışları

7.1. Ürün Satın Alma Akışı
Ürün listeleme
    ↓
Ürün detay görüntüleme
    ↓
Sepete ekleme
    ↓
Sepet kontrolü
    ↓
Adres seçimi
    ↓
Kargo seçimi
    ↓
Ödeme bilgisi
    ↓
Sipariş oluşturma
    ↓
Stok rezervasyonu
    ↓
Ödeme alma
    ↓
Ödeme başarılıysa sipariş onayı
    ↓
Stok kesin düşümü
    ↓
Bildirim gönderimi


7.2. Ödeme Başarısız Akışı
Sipariş oluşturulur
    ↓
Stok rezerve edilir
    ↓
Ödeme denenir
    ↓
Ödeme başarısız olur
    ↓
Sipariş Failed veya PaymentFailed yapılır
    ↓
Stok rezervasyonu serbest bırakılır
    ↓
Kullanıcı bilgilendirilir


7.3. Sipariş İptal Akışı
Müşteri/Admin iptal talebi oluşturur
    ↓
Sipariş durumu kontrol edilir
    ↓
Kargoya verilmediyse iptal edilir
    ↓
Stok iade edilir
    ↓
Ödeme varsa iade süreci başlatılır
    ↓
Müşteriye bildirim gönderilir


7.4. İade Akışı
Müşteri iade talebi oluşturur
    ↓
Admin talebi inceler
    ↓
Talep onaylanır veya reddedilir
    ↓
Onaylandıysa müşteri ürünü gönderir
    ↓
Ürün depoya ulaşır
    ↓
Kontrol edilir
    ↓
Para iadesi yapılır
    ↓
Stok durumu güncellenir


8. MVP Kapsamı
İlk canlıya çıkış için önerilen minimum kapsam aşağıdaki gibi olmalı.
MVP’de Olması Gerekenler
Modül
Durum
Kullanıcı kaydı/girişi
Olmalı
Ürün yönetimi
Olmalı
Kategori yönetimi
Olmalı
Marka yönetimi
Olmalı
Stok yönetimi
Olmalı
Sepet
Olmalı
Sipariş
Olmalı
Ödeme
Olmalı
Adres yönetimi
Olmalı
Kargo bilgisi
Olmalı
Admin panel
Olmalı
Basit raporlama
Olmalı
Log/Audit
Olmalı
E-posta bildirimi
Olmalı
Temel SEO
Olmalı
KVKK/sözleşme sayfaları
Olmalı


MVP Dışında Bırakılabilecekler
Modül
Faz
Gelişmiş kampanya motoru
Faz 2
Kupon sistemi
Faz 2
Yorum/puanlama
Faz 2
Favoriler
Faz 2
Gelişmiş raporlama
Faz 2
SMS bildirimi
Faz 2
Pazaryeri entegrasyonu
Faz 3
Çoklu satıcı sistemi
Faz 3
Mobil uygulama
Faz 3
Sadakat puanı
Faz 3
Gelişmiş öneri sistemi
Faz 3


9. Önerilen Geliştirme Fazları
Faz 1 — Çekirdek E-Ticaret MVP
Hedef: Satış yapılabilir minimum sistem.
Kapsam:
Kullanıcı yönetimi
Ürün yönetimi
Kategori yönetimi
Stok yönetimi
Sepet
Sipariş
Ödeme
Adres
Kargo bilgisi
Admin panel
Temel bildirim
Temel raporlama
Temel SEO

Faz 2 — Operasyonel Güçlendirme
Hedef: Sistemi daha yönetilebilir ve satış odaklı hale getirmek.
Kapsam:
Kampanya yönetimi
Kupon yönetimi
İade/iptal geliştirmeleri
Ürün yorumları
Favoriler
Gelişmiş dashboard
SMS/e-posta şablonları
CMS yönetimi
Gelişmiş SEO
E-fatura/e-arşiv entegrasyonu

Faz 3 — Ölçekleme ve Entegrasyon
Hedef: Sistemi büyütmek, otomasyon ve dış entegrasyonları artırmak.
Kapsam:
Pazaryeri entegrasyonları
ERP entegrasyonu
Kargo API entegrasyonu
Çoklu depo
Çoklu satıcı
Sadakat sistemi
Ürün öneri sistemi
Gelişmiş müşteri segmentasyonu
Mobil uygulama
B2B satış modülü

10. Veri Modeli Ana Entity Listesi
Başlangıç için ana tablolar/entity’ler:
Kullanıcı
User
Role
Permission
UserRole
UserAddress
UserConsent
Ürün
Product
ProductVariant
ProductImage
ProductAttribute
ProductAttributeValue
Category
Brand
ProductCategory
ProductPrice
ProductSeo
Stok
Stock
StockMovement
Warehouse
StockReservation
Sepet
Cart
CartItem
CartCoupon
Sipariş
Order
OrderItem
OrderAddress
OrderStatusHistory
OrderNote
Ödeme
Payment
PaymentTransaction
PaymentRefund
PaymentLog
Kargo
Shipment
ShipmentTracking
CargoCompany
Kampanya
Campaign
Coupon
CouponUsage
CampaignProduct
CampaignCategory
İade/İptal
ReturnRequest
ReturnRequestItem
Refund
CancelRequest
İçerik
Page
Banner
Menu
MenuItem
Faq
SiteSetting
Raporlama / Log
AuditLog
IntegrationLog
ErrorLog
NotificationLog

11. Kritik Teknik Olmayan Kararlar
Bu kararlar baştan netleşmeli.
11.1. Üyelik Zorunlu mu?
Seçenekler:
Sadece üyeler alışveriş yapabilir.
Misafir alışveriş desteklenir.
Misafir alışveriş sonrası otomatik hesap oluşturulur.
Net öneri: Misafir alışveriş desteklenebilir ama sipariş takibi için e-posta/telefon doğrulaması iyi tasarlanmalı.

11.2. Stok Ne Zaman Düşülecek?
Seçenekler:
Sepete ekleyince stok düş.
Sipariş oluşunca rezerve et.
Ödeme başarılı olunca düş.
Net öneri:
Sepette stok düşülmez.
Sipariş oluşturulurken stok rezerve edilir.
Ödeme başarılı olunca stok kesin düşülür.
Ödeme başarısız olursa rezervasyon bırakılır.


11.3. Sipariş Numarası Nasıl Üretilecek?
Örnek formatlar:
ORD-20260506-000001
ECM-20260506-123456
SIP-2026-0000001

Net öneri:
SIP-{YYYYMMDD}-{Sıralı Numara}

Örnek:
SIP-20260506-000123


11.4. Ürün Silme Nasıl Olacak?
Net öneri:
Siparişe konu olmuş ürün fiziksel olarak silinmemeli.
Ürün pasif hale getirilmeli.
Admin panelde “silindi/pasif” olarak gösterilmeli.
Veri bütünlüğü korunmalı.

11.5. Fiyat Değişikliği Eski Siparişleri Etkiler mi?
Hayır.
Net kural:
Sipariş satırında ürün adı, SKU, fiyat, KDV, indirim bilgisi snapshot olarak tutulur.
Ürün fiyatı sonradan değişirse eski sipariş değişmez.

12. Güvenlik İhtiyaçları
Minimum Güvenlik Gereksinimleri
Şifre hashleme
JWT/session güvenliği
Admin panel yetkilendirme
Rol bazlı erişim
Rate limiting
CAPTCHA — kritik formlar için
CSRF koruması
XSS koruması
SQL injection koruması
Dosya yükleme güvenliği
Ödeme bilgisi saklamama
Admin işlem logları
IP bazlı anomali takibi
Kritik Nokta
Admin panel, ödeme callback endpointleri, stok güncelleme endpointleri ve sipariş durum güncelleme endpointleri özellikle korunmalıdır.

13. Performans İhtiyaçları
E-ticaret sisteminde performans doğrudan satışa etki eder.
Kritik Performans Alanları
Ürün listeleme
Ürün arama
Kategori sayfaları
Sepet işlemleri
Checkout akışı
Ödeme dönüşleri
Admin sipariş listesi
Raporlama ekranları
Öneriler
Ürün listeleme cache’lenebilir.
Kategori ağacı cache’lenebilir.
Ana sayfa blokları cache’lenebilir.
Arama için ileride Elasticsearch/OpenSearch kullanılabilir.
Görseller CDN üzerinden servis edilebilir.
Sayfalama zorunlu olmalı.
Admin listelerinde filtreleme/sayfalama olmalı.
Raporlama sorguları ana transaction tablolarını yormamalı.

14. Operasyonel Riskler
En Kritik Riskler
Risk
Etki
Stok tutarsızlığı
Olmayan ürün satılır
Ödeme callback hatası
Ödeme alınıp sipariş oluşmayabilir
Kargo entegrasyon hatası
Teslimat takibi bozulur
Fiyat hatası
Zararına satış yapılabilir
Admin yetki hatası
Yanlış kişiler kritik işlem yapabilir
Log eksikliği
Sorunlar geriye dönük izlenemez
İade süreci belirsizliği
Operasyonel karmaşa oluşur
SEO yapısının yanlış kurulması
Organik trafik kaybı olur


15. Başlangıç İçin Net Önerilen MVP Backlog
Aşağıdaki sırayla geliştirme mantıklı olur.
1. Altyapı ve Temel Yönetim
Kullanıcı modeli
Rol/yetki modeli
Admin giriş sistemi
Sistem ayarları
Audit log altyapısı
2. Katalog Yönetimi
Kategori yönetimi
Marka yönetimi
Ürün yönetimi
Ürün görselleri
Ürün varyantları
Ürün fiyatları
Ürün stokları
3. Müşteri Arayüzü
Ana sayfa
Kategori sayfası
Ürün listeleme
Ürün detay
Arama
Sepete ekleme
4. Sepet ve Checkout
Sepet yönetimi
Adres yönetimi
Teslimat seçimi
Sipariş özeti
Sipariş oluşturma
5. Ödeme
Ödeme sağlayıcı entegrasyonu
Ödeme başarılı/başarısız dönüşleri
Payment log
Sipariş ödeme durumu güncelleme
6. Sipariş Operasyonu
Admin sipariş listesi
Sipariş detay
Sipariş durum güncelleme
Kargo takip bilgisi
Müşteri sipariş geçmişi
7. Bildirimler
Sipariş alındı e-postası
Ödeme başarılı e-postası
Kargo e-postası
Şifre sıfırlama e-postası
8. Temel Raporlama
Günlük sipariş sayısı
Günlük satış tutarı
Bekleyen siparişler
Kritik stok ürünleri

16. Nihai Modül Önceliklendirme Tablosu
Modül
MVP
Faz 2
Faz 3
Not
Kullanıcı Yönetimi
✅




Zorunlu
Rol/Yetki Yönetimi
✅




Admin güvenliği için şart
Ürün Yönetimi
✅




Çekirdek modül
Kategori Yönetimi
✅




Çekirdek modül
Marka Yönetimi
✅




Tavsiye edilir
Stok Yönetimi
✅




Kritik
Depo Yönetimi
Basit
✅


Tek depo ile başlanabilir
Fiyat Yönetimi
✅
✅


Kampanya ile gelişir
Sepet Yönetimi
✅




Zorunlu
Sipariş Yönetimi
✅




Zorunlu
Ödeme Yönetimi
✅




Zorunlu
Kargo Yönetimi
✅
✅


İlk faz manuel olabilir
Adres Yönetimi
✅




Zorunlu
Kampanya Yönetimi


✅


Satış artırır
Kupon Yönetimi


✅


Faz 2
İade/İptal
Basit
✅


MVP’de basit iptal olmalı
Favoriler


✅


Kullanıcı deneyimi
Yorum/Puanlama


✅


Güven artırır
Bildirim
✅
✅


E-posta MVP’de şart
Raporlama
Basit
✅


Fazla geç kalmamalı
CMS
Basit
✅


Banner/sayfa yönetimi
SEO
Temel
✅


URL yapısı baştan doğru olmalı
Fatura
Basit
✅
✅
İş modeline göre kritik
Pazaryeri




✅
Sonra
Marketplace




✅
İlk fazda önermem
Mobil App




✅
Web oturmadan başlanmamalı


17. En Net Stratejik Tavsiye
Bu projeye doğrudan “her şeyi olan e-ticaret” olarak başlamak yanlış olur. Sağlam yaklaşım şu:
Önce satış yapabilen çekirdek sistem.
Sonra operasyonu güçlendiren modüller.
Sonra pazarlama, entegrasyon ve ölçekleme modülleri.

Yani doğru sıra:
Ürün → Stok → Sepet → Sipariş → Ödeme → Kargo → Admin Operasyon → Raporlama → Kampanya → Entegrasyon

İlk sürümün hedefi “çok özellik” olmamalı. İlk sürümün hedefi:
Doğru stok yönetimi
Hatasız ödeme akışı
Tutarlı sipariş yönetimi
Yönetilebilir admin paneli
Geriye dönük izlenebilir log yapısı
olmalı.
Bunlar sağlam kurulursa üzerine kampanya, pazaryeri, mobil uygulama, marketplace gibi modüller güvenle eklenir. Bunlar zayıf kurulursa proje büyüdükçe operasyon bozulur.

