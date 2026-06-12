import type { Lang } from "@/lib/i18n";

export interface GuideSection {
  title: string;
  items: string[];
}

export interface PageGuide {
  title: string;
  description: string;
  sections: GuideSection[];
}

type GuideMap = Record<string, PageGuide>;

function guide(title: string, description: string, sections: GuideSection[]): PageGuide {
  return { title, description, sections };
}

const TR_GUIDES: GuideMap = {
  "/dashboard": guide(
    "Dashboard",
    "Platformun anlık genel görünümüdür. Tüm modüllerin özetini, satış performansını ve sistem sağlığını tek ekranda sunar.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "Stok, sipariş ve gelir verileri gerçek zamanlı veritabanı sorgularından gelir.",
          "Modül sağlık durumu her yüklemede yeniden hesaplanır.",
          "Dashboard 30 saniyede bir otomatik yenilenir.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Bugün / Bu Hafta / Bu Ay sekmeleri ilgili dönem istatistiklerini filtreler.",
          "Stok Alarmı bandı: tükenen ürün varsa kırmızı, kritik eşikte ise sarı görünür.",
          "Sipariş Alarmı bandı: iade veya askıdaki sipariş varsa çıkar.",
          "Hedefler bölümü: /hedefler sayfasındaki aylık hedeflerle karşılaştırılır.",
          "Modül özeti kartları: ilgili sayfaya hızlı geçiş sağlar.",
          "Sistem sağlık oranı: kritik, uyarı ve sağlıklı modül sayısına göre hesaplanır.",
        ],
      },
    ]
  ),
  "/urunler": guide(
    "Ürünler",
    "Ürün kataloğunu yönetir. Yeni ürün ekleyebilir, düzenleyebilir ve fiyat ile stok bilgilerini güncelleyebilirsiniz.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "GET /api/products ile listelenir; kategori ve marka filtreleri uygulanabilir.",
          "Varyantlar, görseller ve stok girişleri ayrı tablolarda saklanır.",
          "Ürünler silinmez; pasife alınır.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Yeni Ürün: zorunlu alanlar ad, SKU, kategori ve fiyattır.",
          "Düzenle: mevcut ürünü günceller; değişiklikler kayıt altına alınır.",
          "Aktif/Pasif: ürünü mağazada görünür veya görünmez yapar.",
          "Öne Çıkar: ürünü ana sayfada öne taşır.",
          "Görsel Yönetimi: bağlı görseller /imajlar sayfasından da yönetilir.",
          "Stok Güncelle: ürün stok miktarını ve eşik bilgisini günceller.",
        ],
      },
    ]
  ),
  "/kategoriler": guide(
    "Kategoriler",
    "Ürün kategori ağacını yönetir. Üst/alt kategori hiyerarşisi kurulabilir, görseller ve SEO bilgileri girilebilir.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "GET /api/categories ile listelenir; ağaç yapısı parentId ile kurulur.",
          "Kategori görselleri /api/upload/categories endpoint'i üzerinden yüklenir.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Üst kategori seçimi: alt kategori oluşturmak için parent seçilir.",
          "Slug alanı: URL'de kullanılır, boşsa isimden otomatik üretilir.",
          "Aktif/Pasif: pasif kategorideki ürünler mağazada görünmez.",
          "Canlı Önizleme: kategori kartının müşteri tarafındaki görünümünü gösterir.",
        ],
      },
    ]
  ),
  "/markalar": guide(
    "Markalar",
    "Marka listesini yönetir. Markalar ürünlere atanır ve mağazada filtreleme seçeneği olarak gösterilir.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "GET /api/brands ile listelenir.",
          "Marka logoları /api/upload/brands endpoint'i üzerinden yüklenir.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Yeni Marka / Düzenle: ad, slug, logo, açıklama ve aktif durum içerir.",
          "Aktif/Pasif: pasif markaya ait ürünler filtrelenebilir ama mağazada görünür kalır.",
        ],
      },
    ]
  ),
  "/stok": guide(
    "Stok",
    "Ürün bazında stok miktarlarını ve hareketlerini gösterir. Kritik eşik altına düşen ürünler için uyarı üretir.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "Stok tablosundan çekilir; sipariş oluşunca rezerve, ödeme onaylanınca kesin düşüm yapılır.",
          "Kritik eşik altındaki ürünler için admin e-postası gönderilir.",
          "Stok Hareketleri sekmesi tüm giriş/çıkış geçmişini listeler.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Stok Güncelle: manuel düzeltme yapar; neden notu girilebilir.",
          "Kritik Eşik: bu değerin altına düşünce alarm devreye girer.",
          "Hareketler: hangi sipariş veya işlem nedeniyle değiştiğini gösterir.",
        ],
      },
    ]
  ),
  "/yorumlar": guide(
    "Yorumlar",
    "Müşteri ürün yorumlarını yönetir. Onay bekleyen yorumlar incelenerek onaylanır veya reddedilir.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "ProductReview tablosundan çekilir.",
          "Yalnızca verified purchase kullanıcıları yorum yazabilir.",
          "Onaylanmamış yorumlar mağazada görünmez.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Onayla: yorumu mağazada yayınlar.",
          "Reddet / Sil: yorumu kaldırır.",
          "Filtreler: bekleyen, onaylı ve reddedilen arasında geçiş yapılabilir.",
        ],
      },
    ]
  ),
  "/duyurular": guide(
    "Duyurular",
    "Mağaza genelinde gösterilecek duyuru banner'larını yönetir. Tarih aralığı ve öncelik belirlenebilir.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "Announcement tablosundan çekilir.",
          "Aktif ve geçerli tarih aralığındaki duyurular müşteri sitesinde gösterilir.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Başlangıç / Bitiş Tarihi: tarih dışı duyurular otomatik gizlenir.",
          "Öncelik: yüksek öncelikli duyuru üste gösterilir.",
          "Stil editörü: arka plan rengi, yazı rengi ve ikon seçilebilir.",
          "Canlı Önizleme: duyurunun mağazadaki görünümünü gösterir.",
        ],
      },
    ]
  ),
  "/kampanyalar": guide(
    "Kampanyalar",
    "İndirim kampanyaları oluşturur. Belirli ürün, kategori veya tüm ürünlere yüzde ya da sabit indirim uygulanabilir.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "Campaign tablosundan çekilir.",
          "Kampanya aktifken ilgili ürünlerde indirimli fiyat gösterilir.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "İndirim tipi: yüzde veya sabit tutar seçilebilir.",
          "Hedef: ürün ID listesi, kategori veya tüm ürünler.",
          "Aktif/Pasif: kampanyayı anında açıp kapatır.",
          "Seed ile test verisi: /test sayfasından örnek kampanya eklenebilir.",
        ],
      },
    ]
  ),
  "/imajlar": guide(
    "İmaj Yönetimi",
    "Sisteme yüklenen tüm görselleri merkezi olarak listeler ve yönetir. Kullanılmayan görseller temizlenebilir.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "MediaFile tablosundan çekilir.",
          "Ürün, kategori, marka, duyuru, kampanya ve kullanıcı görselleri burada görünür.",
          "Görseller sunucunun wwwroot/uploads dizinine kaydedilir.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Sil: görseli siler; ilişkili kayıtların görselleri de temizlenir.",
          "Filtreler: entity tipine göre ürün, kategori veya marka filtrelenebilir.",
        ],
      },
    ]
  ),
  "/belgeler": guide(
    "Dosya Yönetimi",
    "PDF veya diğer belge türlerini yönetir. Dokümanlar müşteri tarafında indirilebilir bağlantı olarak sunulabilir.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "Dosyalar sunucu wwwroot/docs dizinine kaydedilir.",
          "Document tablosunda ad, açıklama ve kategori bilgisi saklanır.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Yükle: dosya seçilir ve ad/açıklama girilir.",
          "Sil: dosyayı ve DB kaydını kaldırır.",
        ],
      },
    ]
  ),
  "/siparisler": guide(
    "Siparişler",
    "Tüm müşteri siparişlerini listeler. Durum güncelleme, kargo atama ve sipariş iptali bu sayfadan yapılır.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "Order tablosundan çekilir; müşteri adı, sipariş no, toplam ve durum gösterilir.",
          "Sipariş detayında ürün snapshot'ı, adres snapshot'ı ve ödeme bilgisi yer alır.",
          "Sipariş numarası formatı: SIP-YYYYMMDD-XXXXXX.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Durum Güncelle: sipariş durumunu değiştirir; tarihçe OrderStatusHistory'e kaydedilir.",
          "Kargo Ata: kargo firması, takip no ve URL girilir.",
          "İptal Et: siparişi iptal eder; stok rezervasyonu serbest bırakılır.",
          "CSV İndir: filtrelenen siparişleri Excel veya CSV olarak dışa aktarır.",
          "Filtreler: durum, tarih aralığı ve müşteri adı/e-postası ile filtreler.",
        ],
      },
    ]
  ),
  "/odemeler": guide(
    "Ödemeler",
    "Tüm ödeme işlemlerini listeler. Başarılı, bekleyen ve başarısız ödemeler görüntülenebilir.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "Payment tablosundan çekilir.",
          "İyzico aktifse gerçek kayıtlar, değilse mock veriler gösterilir.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Detay: ödeme sağlayıcısından gelen yanıt ve hata kodları görüntülenir.",
          "Filtreler: durum ve tarih aralığı.",
        ],
      },
    ]
  ),
  "/iade": guide(
    "İadeler",
    "Müşteri iade ve değişim taleplerini yönetir. Talep onaylanırsa sipariş durumu güncellenir.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "RefundRequest tablosundan çekilir.",
          "Müşteri /hesabım/siparisler üzerinden iade talebi oluşturur.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Onayla: talebi onaylar, sipariş durumu 'İade Edildi' olur.",
          "Reddet: talebi reddeder, müşteriye bildirim gönderilir.",
          "Notlar: inceleme notları girilebilir.",
        ],
      },
    ]
  ),
  "/kuponlar": guide(
    "Kuponlar",
    "İndirim kupon kodları oluşturur ve yönetir. Yüzde veya sabit indirim, kullanım limiti ve tarih aralığı tanımlanabilir.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "Coupon tablosundan çekilir.",
          "Müşteri kuponu sepetinde girince /api/coupons/validate ile doğrulanır.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Yeni Kupon: kod, indirim tipi, değer, minimum sipariş tutarı ve geçerlilik tarihi.",
          "Kullanım Limiti: tek kullanımlık veya sınırsız olabilir.",
          "Aktif/Pasif: kuponu anında devre dışı bırakır.",
          "Kullanım Geçmişi: hangi müşteri hangi siparişte kullandı gösterilir.",
        ],
      },
    ]
  ),
  "/kargo": guide(
    "Kargo",
    "Kargo gönderimleri ve takiplerini yönetir. Kargo bilgileri girildiğinde müşteriye bildirim e-postası gönderilir.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "Shipment tablosundan çekilir.",
          "Siparişe bağlıdır; kargo oluşturmadan önce sipariş 'Hazırlandı' durumunda olmalıdır.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Kargo firması: Yurtiçi, Aras, MNG vb. seçilebilir.",
          "Takip No / Takip URL: müşteriye gönderilen takip linki.",
          "Durum güncelle: 'Kargoda', 'Teslim Edildi', 'Teslim Edilemedi'.",
          "Teslim edilince sipariş otomatik olarak 'Tamamlandı' olur.",
        ],
      },
    ]
  ),
  "/faturalar": guide(
    "Faturalar",
    "E-fatura ve fatura kayıtlarını listeler. Gerçek GİB entegrasyonu yoksa mock fatura oluşturulur.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "Invoice tablosundan çekilir.",
          "Sipariş tamamlanınca otomatik fatura oluşturulur.",
          "Gerçek e-fatura için GİB onaylı provider entegrasyonu gerekir.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "PDF İndir: fatura PDF'i üretilir ve indirilir.",
          "İptal Et: faturayı iptal eder.",
          "Taslak: henüz kesilmemiş faturaları gösterir.",
        ],
      },
    ]
  ),
  "/kullanicilar": guide(
    "Kullanıcılar",
    "Müşteri hesaplarını yönetir. Hesap detayları, sipariş geçmişi ve rol atamaları bu sayfadan yapılır.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "User tablosundan çekilir; müşteri kaydı /api/auth/register ile oluşur.",
          "Multi-tenant: her Admin sadece kendi oluşturduğu kullanıcıları görür.",
          "SuperAdmin tüm kullanıcıları görür.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Düzenle: ad, soyad, rol ve avatar güncellenebilir.",
          "Aktif/Pasif toggle: pasife alınan kullanıcı giriş yapamaz.",
          "Sil: soft delete uygular; kullanıcı verisi korunur.",
          "Detay sayfası: sipariş geçmişi, adresler ve audit log görünür.",
          "Excel içe/dışa aktar: toplu kullanıcı yönetimi için.",
        ],
      },
    ]
  ),
  "/ziyaretciler": guide(
    "Ziyaretçiler",
    "Mağazayı ziyaret eden kullanıcıların IP, konum ve sayfa bilgilerini gösterir.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "VisitorLog tablosundan çekilir.",
          "IP'den coğrafi konum çözülür.",
          "Müşteri tarafında konum izni verilirse hassas konum da kaydedilir.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Harita görünümü: ziyaretçi konumlarını noktalar halinde gösterir.",
          "Filtreler: tarih, ülke ve sayfa URL'si.",
        ],
      },
    ]
  ),
  "/hareketler": guide(
    "Hareketler",
    "Sistemdeki önemli işlemlerin denetim kaydını gösterir. Kim, ne zaman, ne yaptı bilgisi tutulur.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "AuditLog tablosundan çekilir.",
          "İşlem yapan admin, entity türü, eski/yeni değer ve zaman damgası saklanır.",
          "Sipariş, ürün, kullanıcı, stok ve lisans gibi kritik işlemler loglanır.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Filtreler: kullanıcı e-postası ve tarih aralığı.",
          "Excel export: filtrelenmiş hareketleri dışa aktarır.",
          "Aksiyon tipi: CreateProduct, DeleteUser, LicenseRevoked gibi etiketler.",
        ],
      },
    ]
  ),
  "/takip": guide(
    "Takip (Hata Günlüğü)",
    "Uygulamada oluşan frontend ve backend hatalarını listeler. Kaynak, hata mesajı ve stack trace görüntülenebilir.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "ErrorLog tablosundan çekilir.",
          "Backend hataları ErrorLoggingMiddleware tarafından otomatik kaydedilir.",
          "Frontend hataları error.tsx üzerinden gönderilir.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Stack trace: hata detayını genişlet/daralt ile gösterir.",
          "Filtreler: kaynak, seviye, tarih ve arama.",
          "Temizle: eski kayıtları siler.",
        ],
      },
    ]
  ),
  "/dis-kaynaklar": guide(
    "Dış Kaynaklar",
    "Excel veya REST API'den toplu ürün, kategori ve marka aktarımı yapar.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "Excel yüklemesi: .xlsx veya .csv dosyası sunucuya yüklenir, önizleme gösterilir.",
          "REST import: harici API URL'i girilir, JSON/XML yanıtı işlenir.",
          "Alan eşleme: kaynak alanlar entity alanlarına eşlenir.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Önizleme: aktarılacak veri tablo halinde gösterilir.",
          "Alan eşleme: kaynak sütun → hedef alan seçilir.",
          "İçe aktar: onaylanan kayıtlar DB'ye yazılır.",
        ],
      },
    ]
  ),
  "/servisler": guide(
    "Servisler",
    "Sistemde kullanılan harici servis entegrasyonlarını gösterir ve test etmeye yarar.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "Servis durumları /api/admin/services endpoint'inden çekilir.",
          "SMTP, İyzico, IP Geolocation ve benzeri entegrasyonlar listelenir.",
          "Her servisin hangi admin ekranından çağrıldığı doğrulama sayfasında görülebilir.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Test Et: seçili servise test isteği gönderir.",
          "Durum: aktif, pasif veya yapılandırılmamış durumunu gösterir.",
          "Yapılandırma: servis ayarları /yonetim sayfasından değiştirilir.",
        ],
      },
    ]
  ),
  "/kuyruklar": guide(
    "Kuyruklar",
    "RabbitMQ mesaj kuyruklarının durumunu gösterir. Bekleyen ve işlenen mesaj sayıları takip edilebilir.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "RabbitMQ management API veya MassTransit monitor kullanılır.",
          "Sipariş oluşturma ve bildirim gönderme işlemleri kuyruk üzerinden çalışır.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Yenile: kuyruk durumunu anlık günceller.",
          "Mesaj sayısı: bekleyen, işlenen ve hatalı mesaj adetlerini gösterir.",
        ],
      },
    ]
  ),
  "/joblar": guide(
    "Joblar",
    "Arka planda çalışan zamanlanmış görevleri listeler ve manuel tetiklemenizi sağlar.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "JobLog tablosundan çekilir; her job çalışmasında log oluşur.",
          "Kayıtlı joblar arasında doğrulama, sağlık kontrolü ve temizleme görevleri bulunur.",
          "Periyot ayarları appsettings veya environment değişkenlerinden gelir.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Çalıştır: seçilen job'u anında tetikler.",
          "Log detayı: son çalışmanın çıktısını gösterir.",
          "Durum: son çalışmanın zamanı ve başarı durumu.",
        ],
      },
    ]
  ),
  "/dogrulama": guide(
    "Doğrulama",
    "Sistemde tamamlandı olarak işaretlenen özelliklerin gerçekten uygulanıp uygulanmadığını otomatik denetler.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "Doğrulama job'ı düzenli çalışır; sonuçlar cache'e yazılır.",
          "VERIFICATION_LOG.md dosyasına her çalışmanın özeti eklenir.",
          "API, kod, DB ve migration kontrolleri bu sayfada görünür.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Manuel çalıştır: doğrulamayı anında tetikler.",
          "İlgili ekran rozetleri: her kontrolün hangi admin sayfasıyla ilişkili olduğunu gösterir.",
          "Kategori grupları: API, Frontend, Jobs, SEO ve DB.",
        ],
      },
    ]
  ),
  "/dokuman": guide(
    "Dokümanlar",
    "Proje dokümantasyonunu, API referanslarını, iş akışlarını ve değişiklik günlüğünü görüntüler.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "dotnet-ecom-docs klasöründeki Markdown dosyaları gösterilir.",
          "CHANGELOG, architecture ve roadmap dosyaları dinamik yüklenir.",
        ],
      },
      {
        title: "Sekmeler",
        items: [
          "İş akışları: sipariş, stok ve ödeme akışları.",
          "Teknik: mimari kararlar ve migration geçmişi.",
          "Değişiklik günlüğü: son güncelleme notları.",
          "Markdown viewer: istenen .md dosyası okunabilir.",
        ],
      },
    ]
  ),
  "/deploy": guide(
    "Deploy",
    "Sunucu dağıtım yönetimini sağlar. SSH ile bağlanarak Docker container'larını günceller.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "DeployServer ve DeployLog tablosundan çekilir.",
          "Deployment işlemi SSH.NET üzerinden çalışır.",
          "Gerçek zamanlı log akışı SSE ile aktarılır.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Deploy Et: git fetch/reset, docker build, up -d ve health check adımlarını çalıştırır.",
          "Bağlantı Test: SSH bağlantısını doğrular.",
          "Container Durumu: çalışan servisleri listeler.",
          "Prod sunucu deploy'u kırmızı onay ekranıyla korunur.",
        ],
      },
    ]
  ),
  "/yonetim": guide(
    "Yönetim",
    "Admin panel genelindeki sistem ayarlarını ve yapılandırmaları yönetir.",
    [
      {
        title: "Sekmeler",
        items: [
          "Genel: site adı, logo ve iletişim bilgileri.",
          "Tema & UI: logo şablonu, renk teması ve font.",
          "SMTP: e-posta gönderim ayarları; test e-postası gönderilebilir.",
          "Ödeme: İyzico API key/secret ve sandbox modu.",
          "Lisans: SuperAdmin için lisans üretme ve atama.",
          "RBAC: modül bazında rol kısıtlamaları.",
          "Navigasyon: sidebar sırası ve grup etiketleri.",
          "Sistem: veritabanı bilgileri, cache temizle ve test verisi yönetimi.",
        ],
      },
      {
        title: "Önemli Notlar",
        items: [
          "Lisans sekmesi yalnızca SuperAdmin tarafından görülebilir.",
          "SMTP ayarları kaydedildikten sonra test e-postası ile doğrulanmalıdır.",
          "RBAC değişiklikleri sidebar yenilenmeden etkili olmaz.",
        ],
      },
    ]
  ),
  "/hedefler": guide(
    "Hedefler",
    "Aylık gelir ve sipariş hedeflerini girer ve gerçekleşen değerlerle karşılaştırır.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "SalesGoal tablosundan çekilir; yıl ve ay ile eşleştirilir.",
          "Gerçekleşen değerler sipariş tablosundan hesaplanır.",
          "Dashboard hedefler bölümü bu verilerle dolar.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Ay seçimi: geçmiş ve gelecek aylar için hedef girilebilir.",
          "Gelir hedefi: aylık ciro hedefi.",
          "Sipariş hedefi: aylık sipariş sayısı hedefi.",
          "Progress ring: tamamlanma yüzdesini gösterir.",
        ],
      },
    ]
  ),
  "/raporlar": guide(
    "Analiz & Raporlar",
    "Satış, ürün performansı ve müşteri segmentasyon raporlarını görüntüler.",
    [
      {
        title: "Veri Kaynakları",
        items: [
          "GetProductSalesReportQuery ile hesaplanır; tenant filtrelidir.",
          "Tarih aralığı, kategori ve ürün bazında filtreleme yapılabilir.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Tarih aralığı: rapor dönemi seçilir.",
          "Ürün bazlı satış: hangi ürün ne kadar sattı, gelir ve adet.",
          "Export: raporu Excel olarak indirir.",
        ],
      },
    ]
  ),
  "/test": guide(
    "Test",
    "Geliştirme ve test amaçlı yapay veri üretir ve sistemi sıfırlar. Sadece geliştirme ortamında kullanılmalıdır.",
    [
      {
        title: "Dikkat",
        items: [
          "Bu sayfa production ortamında kullanılmamalıdır.",
          "Seed işlemleri gerçek verilerin üzerine yazabilir.",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Ürün/Kullanıcı/Sipariş seed: toplu test verisi oluşturur.",
          "Kampanya seed: örnek kampanya verileri ekler.",
          "Cache temizle: Redis veya memory cache'i sıfırlar.",
          "Veritabanı sıfırla: tüm verileri siler.",
        ],
      },
    ]
  ),
};

const EN_GUIDES: GuideMap = {
  "/dashboard": guide(
    "Dashboard",
    "A live snapshot of the platform. It shows module summaries, sales performance, and system health in one place.",
    [
      {
        title: "Data Sources",
        items: [
          "Stock, order, and revenue data come from real-time database queries.",
          "Module health is recalculated on every load.",
          "The dashboard auto-refreshes every 30 seconds.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Today / This Week / This Month tabs filter the reporting period.",
          "Stock alert band: red for out-of-stock, yellow for critical stock.",
          "Order alert band: shows returned or on-hold orders.",
          "Goals section: compares against monthly targets from /hedefler.",
          "Module summary cards provide quick navigation.",
          "System health score is based on critical, warning, and healthy modules.",
        ],
      },
    ]
  ),
  "/urunler": guide(
    "Products",
    "Manages the product catalog. You can add, edit, and update price and stock data.",
    [
      {
        title: "Data Sources",
        items: [
          "Listed via GET /api/products; category and brand filters can be applied.",
          "Variants, images, and stock movements are stored in separate tables.",
          "Products are not deleted; they are marked inactive.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "New Product: required fields are name, SKU, category, and price.",
          "Edit: updates an existing product and records the change.",
          "Active/Inactive: toggles visibility in the storefront.",
          "Feature: promotes the product on the homepage.",
          "Image management is also available from /imajlar.",
          "Stock update: updates quantity and threshold values.",
        ],
      },
    ]
  ),
  "/kategoriler": guide(
    "Categories",
    "Manages the product category tree. Parent/child hierarchies, images, and SEO metadata are supported.",
    [
      {
        title: "Data Sources",
        items: [
          "Listed via GET /api/categories; tree structure is built with parentId.",
          "Category images are uploaded through /api/upload/categories.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Parent category selection: choose a parent to create a child category.",
          "Slug field: used in URLs, generated from the name if empty.",
          "Active/Inactive: inactive category products are hidden in the store.",
          "Live preview shows the customer-facing category card.",
        ],
      },
    ]
  ),
  "/markalar": guide(
    "Brands",
    "Manages the brand list. Brands are assigned to products and shown as a storefront filter.",
    [
      {
        title: "Data Sources",
        items: [
          "Listed via GET /api/brands.",
          "Brand logos are uploaded through /api/upload/brands.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "New/Edit: name, slug, logo, description, and active state.",
          "Active/Inactive: products from inactive brands can still be filtered but remain visible.",
        ],
      },
    ]
  ),
  "/stok": guide(
    "Stock",
    "Shows stock quantities and movements per product. Alerts are generated when stock falls below the critical threshold.",
    [
      {
        title: "Data Sources",
        items: [
          "Read from the stock table; orders reserve stock, payments confirm the final deduction.",
          "Admin email alerts are sent for critical stock levels.",
          "The Stock Movements tab lists the full in/out history.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Update stock: manual correction with an optional reason note.",
          "Critical threshold: triggers alerts below the configured level.",
          "Movements show which order or process changed the value.",
        ],
      },
    ]
  ),
  "/yorumlar": guide(
    "Reviews",
    "Manages customer product reviews. Pending reviews can be approved or rejected.",
    [
      {
        title: "Data Sources",
        items: [
          "Loaded from the ProductReview table.",
          "Only verified purchase users can submit reviews.",
          "Unapproved reviews are hidden from the store.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Approve publishes the review.",
          "Reject / Delete removes it.",
          "Filters switch between pending, approved, and rejected.",
        ],
      },
    ]
  ),
  "/duyurular": guide(
    "Announcements",
    "Manages storefront-wide announcement banners. Date range and priority can be configured.",
    [
      {
        title: "Data Sources",
        items: [
          "Loaded from the Announcement table.",
          "Active announcements inside the valid date window are shown in the customer site.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Start / End date hides items outside the range automatically.",
          "Priority pushes a banner to the top.",
          "Style editor lets you choose background color, text color, and icon.",
          "Live preview shows the storefront appearance.",
        ],
      },
    ]
  ),
  "/kampanyalar": guide(
    "Campaigns",
    "Creates discount campaigns. Percentage or fixed discounts can be applied to products, categories, or the entire catalog.",
    [
      {
        title: "Data Sources",
        items: [
          "Loaded from the Campaign table.",
          "When active, discounted prices are shown on the related products.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Discount type: percentage or fixed amount.",
          "Target: product IDs, category, or all products.",
          "Active/Inactive toggles the campaign immediately.",
          "Test data can be seeded from /test.",
        ],
      },
    ]
  ),
  "/imajlar": guide(
    "Media Management",
    "Central list of all uploaded images. Unused media can be cleaned up.",
    [
      {
        title: "Data Sources",
        items: [
          "Loaded from the MediaFile table.",
          "Shows images for products, categories, brands, announcements, campaigns, and users.",
          "Files are stored under wwwroot/uploads on the server.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Delete removes the image and clears related references.",
          "Filters can narrow by entity type, such as product, category, or brand.",
        ],
      },
    ]
  ),
  "/belgeler": guide(
    "Documents",
    "Manages PDFs and other file types. Documents can be exposed to customers as downloadable links.",
    [
      {
        title: "Data Sources",
        items: [
          "Files are stored under wwwroot/docs.",
          "Document metadata such as name, description, and category is kept in the database.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Upload: choose a file and enter name/description.",
          "Delete removes both the file and the database row.",
        ],
      },
    ]
  ),
  "/siparisler": guide(
    "Orders",
    "Lists all customer orders. Status updates, shipping assignment, and cancellation happen here.",
    [
      {
        title: "Data Sources",
        items: [
          "Loaded from the Order table with customer name, order number, total, and status.",
          "Order details include product snapshot, address snapshot, and payment info.",
          "Order number format: SIP-YYYYMMDD-XXXXXX.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Update status records history in OrderStatusHistory.",
          "Assign shipping company, tracking number, and URL.",
          "Cancel releases stock reservations.",
          "CSV export downloads filtered orders.",
          "Filters support status, date range, and customer name/email.",
        ],
      },
    ]
  ),
  "/odemeler": guide(
    "Payments",
    "Lists all payment transactions. Successful, pending, and failed payments can be inspected.",
    [
      {
        title: "Data Sources",
        items: [
          "Loaded from the Payment table.",
          "If Iyzico is enabled, real records are shown; otherwise mock data is displayed.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Detail view shows provider response and error codes.",
          "Filters support status and date range.",
        ],
      },
    ]
  ),
  "/iade": guide(
    "Returns",
    "Manages customer return and exchange requests. Approved requests update the order status.",
    [
      {
        title: "Data Sources",
        items: [
          "Loaded from the RefundRequest table.",
          "Customers create requests from /hesabım/siparisler.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Approve marks the order as returned.",
          "Reject notifies the customer.",
          "Notes field stores review comments.",
        ],
      },
    ]
  ),
  "/kuponlar": guide(
    "Coupons",
    "Creates and manages discount codes. Percentage or fixed discounts, usage limits, and date ranges are supported.",
    [
      {
        title: "Data Sources",
        items: [
          "Loaded from the Coupon table.",
          "Validated through /api/coupons/validate when used at checkout.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "New coupon: code, discount type, value, minimum order amount, and validity dates.",
          "Usage limit can be single-use or unlimited.",
          "Active/Inactive disables the coupon immediately.",
          "Usage history shows who used it and on which order.",
        ],
      },
    ]
  ),
  "/kargo": guide(
    "Shipping",
    "Manages shipping assignments and tracking. A notification email is sent when shipping data is added.",
    [
      {
        title: "Data Sources",
        items: [
          "Loaded from the Shipment table.",
          "The order must be in Ready status before shipping can be created.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Carrier selection: Yurtiçi, Aras, MNG, and others.",
          "Tracking number / URL: link sent to the customer.",
          "Status updates: shipped, delivered, failed delivery.",
          "Delivery automatically marks the order as completed.",
        ],
      },
    ]
  ),
  "/faturalar": guide(
    "Invoices",
    "Lists e-invoice and invoice records. Mock invoices are generated when no live GIB integration exists.",
    [
      {
        title: "Data Sources",
        items: [
          "Loaded from the Invoice table.",
          "An invoice is created automatically when an order is completed.",
          "Real e-invoicing requires a GIB-approved provider integration.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "PDF download generates and downloads the invoice file.",
          "Cancel voids the invoice.",
          "Draft shows invoices that are not finalized yet.",
        ],
      },
    ]
  ),
  "/kullanicilar": guide(
    "Users",
    "Manages customer accounts. Account details, order history, and role assignment are handled here.",
    [
      {
        title: "Data Sources",
        items: [
          "Loaded from the User table; registrations happen through /api/auth/register.",
          "Multi-tenant: each Admin only sees users they created.",
          "SuperAdmin sees all users.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Edit updates name, surname, role, and avatar.",
          "Active/Inactive prevents login when disabled.",
          "Delete performs soft delete and preserves data.",
          "Detail page shows order history, addresses, and audit log.",
          "Excel import/export supports bulk operations.",
        ],
      },
    ]
  ),
  "/ziyaretciler": guide(
    "Visitors",
    "Shows IP, location, and page data for visitors of the storefront.",
    [
      {
        title: "Data Sources",
        items: [
          "Loaded from the VisitorLog table.",
          "IP-based geolocation is resolved automatically.",
          "Precise location is stored if the customer grants location permission.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Map view shows visitor locations as pins.",
          "Filters support date, country, and page URL.",
        ],
      },
    ]
  ),
  "/hareketler": guide(
    "Audit Trail",
    "Shows the audit log for important system actions. Who did what and when is tracked here.",
    [
      {
        title: "Data Sources",
        items: [
          "Loaded from the AuditLog table.",
          "Actor admin, entity type, old/new value, and timestamp are stored.",
          "Critical actions such as orders, products, users, stock, and licenses are logged.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Filters by user email and date range.",
          "Excel export downloads the filtered audit trail.",
          "Action tags like CreateProduct, DeleteUser, and LicenseRevoked are shown.",
        ],
      },
    ]
  ),
  "/takip": guide(
    "Error Tracking",
    "Lists frontend and backend errors produced by the app. Source, message, and stack trace are visible.",
    [
      {
        title: "Data Sources",
        items: [
          "Loaded from the ErrorLog table.",
          "Backend errors are written by ErrorLoggingMiddleware.",
          "Frontend errors are sent from error.tsx.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Stack trace expands and collapses for details.",
          "Filters support source, severity, date, and search.",
          "Clear removes old records.",
        ],
      },
    ]
  ),
  "/dis-kaynaklar": guide(
    "External Sources",
    "Imports products, categories, and brands in bulk from Excel files or REST APIs.",
    [
      {
        title: "Data Sources",
        items: [
          "Excel upload: .xlsx or .csv files are uploaded and previewed.",
          "REST import: an external API URL is entered and the JSON/XML response is processed.",
          "Field mapping aligns source columns with entity fields.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Preview shows the data before import.",
          "Field mapping selects source column to target field.",
          "Import writes the approved records to the database.",
        ],
      },
    ]
  ),
  "/servisler": guide(
    "Services",
    "Displays external service integrations used by the platform and lets you test them.",
    [
      {
        title: "Data Sources",
        items: [
          "Service states are loaded from /api/admin/services.",
          "Integrations such as SMTP, Iyzico, and IP Geolocation are listed.",
          "The verification page shows which admin screen calls each service.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Test sends a request to the selected service.",
          "Status shows active, inactive, or unconfigured state.",
          "Configuration is changed from /yonetim.",
        ],
      },
    ]
  ),
  "/kuyruklar": guide(
    "Queues",
    "Shows RabbitMQ queue status. Pending and processed message counts are visible.",
    [
      {
        title: "Data Sources",
        items: [
          "Uses the RabbitMQ management API or MassTransit monitor.",
          "Order creation and notification delivery go through the queue layer.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Refresh updates the queue state instantly.",
          "Message count shows pending, processed, and failed messages.",
        ],
      },
    ]
  ),
  "/joblar": guide(
    "Jobs",
    "Lists scheduled background jobs and lets you trigger them manually.",
    [
      {
        title: "Data Sources",
        items: [
          "Loaded from the JobLog table; every job execution writes a log entry.",
          "Registered jobs include verification, health checks, and cleanup tasks.",
          "Schedules come from appsettings or environment variables.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Run triggers the selected job immediately.",
          "Log detail shows the latest execution output.",
          "Status shows the last run time and success state.",
        ],
      },
    ]
  ),
  "/dogrulama": guide(
    "Verification",
    "Automatically verifies that features marked as completed are actually implemented.",
    [
      {
        title: "Data Sources",
        items: [
          "The verification job runs regularly and writes results to cache.",
          "Each run is summarized in VERIFICATION_LOG.md.",
          "API, code, DB, and migration checks are shown here.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Manual run triggers verification immediately.",
          "Related screen badges show which admin page each check belongs to.",
          "Category groups include API, Frontend, Jobs, SEO, and DB.",
        ],
      },
    ]
  ),
  "/dokuman": guide(
    "Documents",
    "Shows project documentation, API references, workflows, and the change log.",
    [
      {
        title: "Data Sources",
        items: [
          "Markdown files from dotnet-ecom-docs are listed.",
          "CHANGELOG, architecture, and roadmap files are loaded dynamically.",
        ],
      },
      {
        title: "Tabs",
        items: [
          "Workflows: order, stock, and payment flows.",
          "Technical: architectural decisions and migration history.",
          "Change log: recent update notes.",
          "Markdown viewer: open any .md file.",
        ],
      },
    ]
  ),
  "/deploy": guide(
    "Deploy",
    "Handles server deployment management. It connects through SSH and updates Docker containers.",
    [
      {
        title: "Data Sources",
        items: [
          "Loaded from DeployServer and DeployLog tables.",
          "The deployment flow runs over SSH.NET.",
          "Real-time logs are streamed with SSE.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Deploy runs git fetch/reset, docker build, up -d, and health checks.",
          "Connection Test validates the SSH connection.",
          "Container Status lists the running services.",
          "Production deployment is protected by a red confirmation screen.",
        ],
      },
    ]
  ),
  "/yonetim": guide(
    "Management",
    "Manages the system settings and configuration used by the admin panel.",
    [
      {
        title: "Tabs",
        items: [
          "General: site title, logo, and contact details.",
          "Theme & UI: logo template, color theme, and font.",
          "SMTP: email settings; a test email can be sent.",
          "Payment: Iyzico API key/secret and sandbox mode.",
          "License: generate and assign licenses for SuperAdmin.",
          "RBAC: module-level role restrictions.",
          "Navigation: sidebar order and group labels.",
          "System: database info, cache clear, and test data management.",
        ],
      },
      {
        title: "Important Notes",
        items: [
          "The License tab is visible only to SuperAdmin.",
          "SMTP settings should be validated with a test email after saving.",
          "RBAC changes take effect after the sidebar refreshes.",
        ],
      },
    ]
  ),
  "/hedefler": guide(
    "Goals",
    "Enter monthly revenue and order targets and compare them with actual values.",
    [
      {
        title: "Data Sources",
        items: [
          "Loaded from SalesGoal and matched by year and month.",
          "Actual values are calculated from the order table.",
          "The dashboard goals section uses this data.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Month selection allows past and future targets.",
          "Revenue target: monthly turnover goal.",
          "Order target: monthly order count goal.",
          "Progress ring shows the completion percentage.",
        ],
      },
    ]
  ),
  "/raporlar": guide(
    "Analytics & Reports",
    "Shows sales, product performance, and customer segmentation reports.",
    [
      {
        title: "Data Sources",
        items: [
          "Calculated with GetProductSalesReportQuery and tenant-filtered.",
          "Filtering works by date range, category, and product.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Date range selects the reporting period.",
          "Product sales shows revenue and quantity per product.",
          "Export downloads the report as Excel.",
        ],
      },
    ]
  ),
  "/test": guide(
    "Test",
    "Generates dummy data for development and resets the system. It should be used only in development.",
    [
      {
        title: "Warning",
        items: [
          "This page should not be used in production.",
          "Seed operations can overwrite real data.",
        ],
      },
      {
        title: "Fields & Actions",
        items: [
          "Product/User/Order seed creates bulk test data.",
          "Campaign seed adds sample campaign records.",
          "Clear cache resets Redis or memory cache.",
          "Reset database deletes all data.",
        ],
      },
    ]
  ),
};

export function getPageGuides(lang: Lang): GuideMap {
  return lang === "tr" ? TR_GUIDES : EN_GUIDES;
}
