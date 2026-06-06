export interface GuideSection {
  title: string;
  items: string[];
}

export interface PageGuide {
  title: string;
  description: string;
  sections: GuideSection[];
}

export const PAGE_GUIDES: Record<string, PageGuide> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Platformun anlık genel görünümüdür. Tüm modüllerin özetini, satış performansını ve sistem sağlığını tek ekranda sunar.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "Stok, sipariş, gelir verileri gerçek zamanlı DB sorgularından beslenir",
          "Modül sağlık durumu GetModuleStatsQuery ile her yüklenmede hesaplanır",
          "Dashboard 30 saniyede bir otomatik yenilenir",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Bugün / Bu Hafta / Bu Ay sekmeleri: ilgili dönem istatistiklerini filtreler",
          "Stok Alarmı bandı: tükenen ürün varsa kırmızı, kritik eşikte ise sarı görünür",
          "Sipariş Alarmı bandı: iade/askıdaki sipariş varsa çıkar",
          "Hedefler bölümü: /hedefler sayfasından girilen aylık hedeflerle karşılaştırılır",
          "Modül Özeti kartları: her modülü tıklayarak ilgili sayfaya gidebilirsiniz",
          "Sistem Sağlık Oranı: kritik/uyarı/sağlıklı modül sayısına göre hesaplanır",
        ],
      },
    ],
  },

  "/urunler": {
    title: "Ürünler",
    description: "Ürün kataloğunu yönetir. Yeni ürün ekleyebilir, düzenleyebilir, fiyat ve stok bilgilerini güncelleyebilirsiniz.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "GET /api/products ile listelenir; kategori/marka filtreleriyle daraltılabilir",
          "Her ürünün varyantları, görselleri ve stok girişleri ayrı tablolarda saklanır",
          "Ürünler hiçbir zaman silinmez — pasif yapılır (soft delete)",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Yeni Ürün: modal açar, zorunlu alanlar ad, SKU, kategori, fiyattır",
          "Düzenle: mevcut ürünü günceller; değişiklikler AuditLog'a kaydedilir",
          "Aktif/Pasif toggle: ürünü mağazada görünür/görünmez yapar",
          "Öne Çıkar: ürünü mağaza anasayfasında öne çıkarır",
          "Görsel Yönetimi: ürüne bağlı görseller /imajlar sayfasından da yönetilir",
          "Stok Güncelle: ürün stok miktarını ve eşiğini günceller",
        ],
      },
    ],
  },

  "/kategoriler": {
    title: "Kategoriler",
    description: "Ürün kategori ağacını yönetir. Üst/alt kategori hiyerarşisi kurulabilir, görseller ve SEO meta bilgileri girilebilir.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "GET /api/categories ile listelenir; ağaç yapısı parentId ile kurulur",
          "Kategori görselleri /api/upload/categories endpoint'i üzerinden yüklenir",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Üst Kategori seçimi: alt kategori oluşturmak için parent seçilir",
          "Slug alanı: URL'de kullanılır, boş bırakılırsa isimden otomatik üretilir",
          "Aktif/Pasif: pasif kategorideki ürünler mağazada görünmez",
          "Canlı Önizleme: kategori kartının müşteri tarafındaki görünümünü gösterir",
        ],
      },
    ],
  },

  "/markalar": {
    title: "Markalar",
    description: "Marka listesini yönetir. Markalar ürünlere atanır ve mağazada filtreleme seçeneği olarak gösterilir.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: ["GET /api/brands ile listelenir", "Marka logoları /api/upload/brands endpoint'i üzerinden yüklenir"],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Yeni Marka / Düzenle: ad, slug, logo, açıklama ve aktif durumu içerir",
          "Aktif/Pasif: pasif markaya ait ürünler aramada filtrelenebilir ama görünür kalır",
        ],
      },
    ],
  },

  "/stok": {
    title: "Stok",
    description: "Ürün bazında stok miktarlarını ve hareketlerini görüntüler. Kritik eşik altına düşen ürünler otomatik uyarı gönderir.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "Stock tablosundan çekilir; sipariş oluşunca rezerve, ödeme onaylanınca kesin düşüm yapılır",
          "Kritik eşik altındaki ürünler için admin e-posta bildirimi gönderilir",
          "Stok Hareketleri sekmesi: tüm giriş/çıkış geçmişini listeler",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Stok Güncelle: manuel düzeltme yapar; neden notu girilebilir",
          "Kritik Eşik: bu değerin altına düşünce alarm devreye girer",
          "Hareketler: hangi sipariş/işlem nedeniyle değiştiğini gösterir",
        ],
      },
    ],
  },

  "/yorumlar": {
    title: "Yorumlar",
    description: "Müşteri ürün yorumlarını yönetir. Onay bekleyen yorumlar burada incelenerek onaylanır veya reddedilir.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "ProductReview tablosundan çekilir",
          "Sadece verified purchase (satın alınmış ürün) kullanıcıları yorum yapabilir",
          "Onaylanmamış yorumlar mağazada görünmez",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Onayla: yorumu mağazada yayınlar",
          "Reddet/Sil: yorumu kaldırır",
          "Filtreler: bekleyen/onaylı/reddedilen arasında geçiş yapılabilir",
        ],
      },
    ],
  },

  "/duyurular": {
    title: "Duyurular",
    description: "Mağaza genelinde gösterilecek duyuru banner'larını yönetir. Tarih aralığı ve öncelik sırası belirlenebilir.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: ["Announcement tablosundan çekilir", "Aktif ve geçerli tarih aralığındaki duyurular müşteri sitesinde gösterilir"],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Başlangıç/Bitiş Tarihi: tarih dışı duyurular otomatik gizlenir",
          "Öncelik: yüksek öncelikli duyuru üstte gösterilir",
          "Stil Editörü: arka plan rengi, yazı rengi, ikon seçilebilir",
          "Canlı Önizleme: duyurunun mağazadaki görünümünü gösterir",
        ],
      },
    ],
  },

  "/kampanyalar": {
    title: "Kampanyalar",
    description: "İndirim kampanyaları oluşturur. Belirli ürün/kategori gruplarına uygulanan yüzde veya sabit indirimler tanımlanabilir.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: ["Campaign tablosundan çekilir", "Kampanya aktifken ilgili ürünlerde indirimli fiyat gösterilir"],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "İndirim Tipi: yüzde (%) veya sabit tutar (₺) seçilebilir",
          "Hedef: ürün ID listesi, kategori veya tüm ürünler",
          "Aktif/Pasif toggle: kampanyayı anında açar/kapatır",
          "Seed ile Test Verisi: /test sayfasından kampanya test verisi eklenebilir",
        ],
      },
    ],
  },

  "/imajlar": {
    title: "İmaj Yönetimi",
    description: "Sisteme yüklenen tüm görselleri merkezi olarak listeler ve yönetir. Kullanılmayan görseller temizlenebilir.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "MediaFile tablosundan çekilir",
          "Ürün, kategori, marka, duyuru, kampanya, kullanıcı görselleri burada görünür",
          "Görsel yüklendiğinde sunucunun wwwroot/uploads dizinine kaydedilir",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Sil: görseli siler; ilişkili entity'nin görseli de temizlenir (cascade)",
          "Filtreler: entity tipine göre (ürün/kategori/marka) filtreleme yapılabilir",
        ],
      },
    ],
  },

  "/belgeler": {
    title: "Dosya Yönetimi",
    description: "PDF veya diğer belge türlerini yönetir. Dokümanlar müşteri tarafında indirilebilir link olarak sunulabilir.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: ["Dosyalar sunucu wwwroot/docs dizinine kaydedilir", "Document tablosunda metadata (ad, açıklama, kategori) saklanır"],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Yükle: dosya seçilir ve ad/açıklama girilir",
          "Sil: dosyayı ve DB kaydını kaldırır",
        ],
      },
    ],
  },

  "/siparisler": {
    title: "Siparişler",
    description: "Tüm müşteri siparişlerini listeler. Durum güncellemesi, kargo ataması ve sipariş iptali bu sayfadan yapılır.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "Order tablosundan çekilir; müşteri adı, sipariş no, toplam, durum gösterilir",
          "Sipariş detayında ürün snapshot'ı, adres snapshot'ı ve ödeme bilgisi yer alır",
          "Sipariş numarası formatı: SIP-YYYYMMDD-XXXXXX",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Durum Güncelle: sipariş durumunu değiştirir; tarihçe OrderStatusHistory'e kaydedilir",
          "Kargo Ata: kargo firması, takip no ve URL girilir",
          "İptal Et: sipariş iptal edilir; stok rezervasyonu serbest bırakılır",
          "CSV İndir: filtrelenen siparişleri Excel/CSV olarak dışa aktarır",
          "Filtreler: durum, tarih aralığı, müşteri adı/e-postası ile filtrele",
        ],
      },
    ],
  },

  "/odemeler": {
    title: "Ödemeler",
    description: "Tüm ödeme işlemlerini listeler. Başarılı, bekleyen ve başarısız ödemeler görüntülenebilir.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "Payment tablosundan çekilir",
          "İyzico entegrasyonu aktifse gerçek ödeme kayıtları, değilse mock veriler görünür",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Detay: ödeme sağlayıcısından gelen yanıt ve hata kodları görüntülenebilir",
          "Filtreler: durum (başarılı/bekleyen/başarısız), tarih aralığı",
        ],
      },
    ],
  },

  "/iade": {
    title: "İadeler",
    description: "Müşteri iade ve değişim taleplerini yönetir. Talep onaylanırsa sipariş durumu güncellenir.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "RefundRequest tablosundan çekilir",
          "Müşteri /hesabım/siparisler üzerinden iade talebi oluşturur",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Onayla: talebi onaylar, sipariş durumu 'İade Edildi' olur",
          "Reddet: talebi reddeder, müşteriye bildirim gönderilir",
          "Notlar: inceleme notları girilebilir",
        ],
      },
    ],
  },

  "/kuponlar": {
    title: "Kuponlar",
    description: "İndirim kupon kodları oluşturur ve yönetir. Yüzde veya sabit indirim, kullanım limiti, tarih aralığı tanımlanabilir.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "Coupon tablosundan çekilir",
          "Müşteri sepette kupon kodu girince /api/coupons/validate ile doğrulanır",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Yeni Kupon: kod, indirim tipi, değer, minimum sipariş tutarı, geçerlilik tarihi",
          "Kullanım Limiti: tek kullanımlık veya sınırsız seçilebilir",
          "Aktif/Pasif: kuponu anında devre dışı bırakır",
          "Kullanım Geçmişi: hangi müşteri hangi siparişte kullandı görüntülenebilir",
        ],
      },
    ],
  },

  "/kargo": {
    title: "Kargo",
    description: "Kargo gönderimleri ve takiplerini yönetir. Kargo bilgileri girilince müşteriye bildirim e-postası gönderilir.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: ["Shipment tablosundan çekilir", "Siparişe bağlıdır; kargo oluşturmadan önce sipariş 'Hazırlandı' durumunda olmalıdır"],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Kargo Firması: Yurtiçi, Aras, MNG vb. seçilebilir",
          "Takip No / Takip URL: müşteriye gönderilen takip linki",
          "Durum Güncelle: 'Kargoda', 'Teslim Edildi', 'Teslim Edilemedi' gibi durumlar",
          "Teslim edilince sipariş otomatik olarak 'Tamamlandı' durumuna geçer",
        ],
      },
    ],
  },

  "/faturalar": {
    title: "Faturalar",
    description: "E-fatura/fatura kayıtlarını listeler. Gerçek GIB entegrasyonu yokken mock fatura oluşturulur.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "Invoice tablosundan çekilir",
          "Sipariş tamamlanınca otomatik fatura oluşturulur",
          "Gerçek e-fatura için GIB onaylı provider entegrasyonu gerekir (TODO_PENDING.md)",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "PDF İndir: fatura PDF'i oluşturularak indirilir",
          "İptal Et: faturayı iptal eder (iade durumunda)",
          "Taslak: henüz kesilmemiş faturalar; 'Kesildi' durumuna alınabilir",
        ],
      },
    ],
  },

  "/kullanicilar": {
    title: "Kullanıcılar",
    description: "Müşteri hesaplarını yönetir. Hesap detayları, sipariş geçmişi ve rol atamaları bu sayfadan yapılır.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "User tablosundan çekilir; müşteri kaydı /api/auth/register ile oluşur",
          "Multi-tenant: her Admin sadece kendi oluşturduğu kullanıcıları görür",
          "SuperAdmin tüm kullanıcıları görür",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Düzenle: ad, soyad, rol, avatar güncellenebilir",
          "Aktif/Pasif toggle: pasife alınan kullanıcı giriş yapamaz; lisansı otomatik iptal edilir",
          "Sil: soft delete yapar; kullanıcı verisi korunur, giriş engellenur",
          "Detay sayfası: sipariş geçmişi, adresler, audit log görüntülenebilir",
          "Excel İçe/Dışa Aktar: toplu kullanıcı yönetimi için",
        ],
      },
    ],
  },

  "/ziyaretciler": {
    title: "Ziyaretçiler",
    description: "Mağazayı ziyaret eden kullanıcıların IP, konum ve sayfa bilgilerini gösterir.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "VisitorLog tablosundan çekilir",
          "IP'den coğrafi konum ip-api.com üzerinden çözümlenir",
          "Müşteri tarafında kullanıcının konum izni verirse hassas konum da kaydedilir",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Harita görünümü: ziyaretçi konumları haritada nokta olarak gösterilir",
          "Filtreler: tarih, ülke, sayfa URL'si ile filtrele",
        ],
      },
    ],
  },

  "/hareketler": {
    title: "Hareketler",
    description: "Sistemdeki tüm önemli işlemlerin denetim kaydını (audit log) gösterir. Kim ne zaman ne yaptı bilgisi tutulur.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "AuditLog tablosundan çekilir",
          "İşlem yapan admin, entity türü, eski/yeni değer ve zaman damgası kaydedilir",
          "Sipariş, ürün, kullanıcı, stok, lisans gibi tüm kritik işlemler loglanır",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Filtreler: kullanıcı e-postası ve tarih aralığı ile daraltılabilir",
          "Excel Export: filtrelenmiş hareketleri dışa aktarır",
          "Aksiyon tipi: CreateProduct, DeleteUser, LicenseRevoked gibi anlaşılır etiketler",
        ],
      },
    ],
  },

  "/takip": {
    title: "Takip (Hata Günlüğü)",
    description: "Uygulamada oluşan frontend ve backend hatalarını listeler. Kaynak, hata mesajı ve stack trace görüntülenebilir.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "ErrorLog tablosundan çekilir",
          "Backend hataları ErrorLoggingMiddleware tarafından otomatik kaydedilir",
          "Frontend hataları error.tsx bileşenleri tarafından POST /api/admin/error-logs ile gönderilir",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Stack Trace: hata detayını genişlet/daralt butonu ile görüntüle",
          "Filtreler: kaynak (frontend/backend), seviye (Error/Warning), tarih, arama",
          "Temizle: eski hata kayıtlarını sil",
        ],
      },
    ],
  },

  "/dis-kaynaklar": {
    title: "Dış Kaynaklar",
    description: "Excel veya REST API'den toplu ürün/kategori/marka aktarımı yapar.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "Excel yüklemesi: .xlsx/.csv dosyası sunucuya yüklenir, önizleme gösterilir",
          "REST import: harici API URL'i girilir, JSON/XML yanıtı işlenir",
          "Alan eşleme (mapping): kaynak alanlar entity alanlarına eşlenir",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Önizleme: aktarılacak veri import edilmeden önce tablo görünümünde gösterilir",
          "Alan Eşleme: kaynak sütun → hedef alan seçimi yapılır",
          "İçe Aktar: onaylanan kayıtlar DB'ye yazılır",
        ],
      },
    ],
  },

  "/servisler": {
    title: "Servisler",
    description: "Sistemde kullanılan harici servis entegrasyonlarını (SMTP, ödeme, SMS vb.) gösterir ve test etmeye yarar.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "Servis durumları /api/admin/services endpoint'inden çekilir",
          "SMTP, İyzico, IP Geolocation, Telegram gibi entegrasyonlar listelenir",
          "Her servisin hangi admin ekranından çağrıldığı Doğrulama sayfasında görülebilir",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Test Et: seçili servise test isteği gönderilir (örn. test e-postası)",
          "Durum: servisin aktif/pasif/yapılandırılmamış durumu gösterilir",
          "Yapılandırma: servis ayarları /yonetim sayfasından değiştirilir",
        ],
      },
    ],
  },

  "/kuyruklar": {
    title: "Kuyruklar",
    description: "RabbitMQ mesaj kuyruklarının durumunu gösterir. Bekleyen ve işlenen mesaj sayıları takip edilebilir.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "RabbitMQ management API'sinden veya MassTransit monitor'dan çekilir",
          "Sipariş oluşturma ve bildirim gönderme işlemleri kuyruk üzerinden çalışır",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Yenile: kuyruk durumunu anlık günceller",
          "Mesaj Sayısı: bekleyen, işlenen, hatalı mesaj adetleri gösterilir",
        ],
      },
    ],
  },

  "/joblar": {
    title: "Joblar",
    description: "Arka planda çalışan zamanlanmış görevleri listeler ve manuel tetikleyebilirsiniz.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "JobLog tablosundan çekilir; her job çalışmasında log kaydı oluşturulur",
          "Kayıtlı joblar: TodoVerificationJob, ModuleHealthCheckJob, CleanupJob vb.",
          "Periyot ayarları appsettings.json veya environment variable ile belirlenir",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Çalıştır: seçilen job'u anında tetikler",
          "Log Detayı: son çalışmanın çıktısını görüntüler",
          "Durum: son çalışma zamanı ve başarı/başarısızlık durumu",
        ],
      },
    ],
  },

  "/dogrulama": {
    title: "Doğrulama",
    description: "Sistemde 'tamamlandı' olarak işaretlenen özelliklerin gerçekten implemente edildiğini otomatik denetler.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "TodoVerificationJob her 12 saatte bir çalışır; sonuçlar cache'e kaydedilir",
          "VERIFICATION_LOG.md dosyasına her çalışma yazılır",
          "42 kontrol: API endpoint (10), kod pattern (25), DB tablo (6), migration (1)",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Manuel Çalıştır: doğrulamayı anında tetikler",
          "İlgili Ekranlar rozetleri: her kontrolün hangi admin sayfasıyla ilişkili olduğunu gösterir",
          "Kategori grupları: API / Multi-tenant / Lisans / Frontend / Jobs / SEO / DB",
        ],
      },
    ],
  },

  "/dokuman": {
    title: "Dokümanlar",
    description: "Proje dokümantasyonunu, API referanslarını, iş akışlarını ve değişiklik günlüğünü görüntüler.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "dotnet-ecom-docs klasöründeki Markdown dosyaları /api/admin/docs endpoint'i üzerinden sunulur",
          "CHANGELOG.md, architecture.md, mvp-plan.md gibi dosyalar dinamik yüklenir",
        ],
      },
      {
        title: "Sekmeler",
        items: [
          "İş Akışları: sipariş, stok, ödeme akışları",
          "Teknik: mimari kararlar, migration geçmişi",
          "Değişiklik Günlüğü: son güncelleme notları",
          "Markdown Viewer: istediğiniz .md dosyasını okuyabilirsiniz",
        ],
      },
    ],
  },

  "/deploy": {
    title: "Deploy",
    description: "Sunucu dağıtım yönetimini sağlar. SSH ile bağlantı kurarak Docker container'larını günceller.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "DeployServer ve DeployLog tablosundan çekilir",
          "Deployment işlemi SSH.NET üzerinden sunucuya bağlanır",
          "Gerçek zamanlı log akışı SSE (Server-Sent Events) ile aktarılır",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Deploy Et: git fetch/reset → docker build → up -d → health check adımlarını çalıştırır",
          "Bağlantı Test: SSH bağlantısını doğrular",
          "Container Durumu: çalışan servisleri listeler",
          "Prod sunucu deploy'u kırmızı onay ekranıyla korunur",
        ],
      },
    ],
  },

  "/yonetim": {
    title: "Yönetim",
    description: "Admin panel genelindeki tüm sistem ayarlarını ve yapılandırmalarını yönetir.",
    sections: [
      {
        title: "Sekmeler",
        items: [
          "Genel: site adı, logo, iletişim bilgileri",
          "Tema & UI: logo şablonu, renk teması, font",
          "SMTP: e-posta gönderim ayarları; test e-postası gönderilebilir",
          "Ödeme: İyzico API key/secret, sandbox modu",
          "Lisans: SuperAdmin'e lisans üretme ve atama; Admin'e lisans görüntüleme şifresi",
          "RBAC: modül bazında rol kısıtlamaları",
          "Navigasyon: sidebar menü sırası ve grup etiketleri",
          "Sistem: veritabanı bilgileri, cache temizle, test verisi yönetimi",
        ],
      },
      {
        title: "Önemli Notlar",
        items: [
          "Lisans sekmesi yalnızca SuperAdmin tarafından görülebilir",
          "SMTP ayarları kaydedildikten sonra test e-postası gönderilerek doğrulanmalıdır",
          "RBAC değişiklikleri sidebar yenilenmeden etkili olmaz",
        ],
      },
    ],
  },

  "/hedefler": {
    title: "Hedefler",
    description: "Aylık gelir ve sipariş hedeflerini girer ve gerçekleşen değerlerle karşılaştırır.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "SalesGoal tablosundan çekilir; yıl+ay kombinasyonu ile eşleştirilir",
          "Gerçekleşen değerler sipariş tablosundan hesaplanır",
          "Dashboard Hedefler bölümü bu verilerle dolar",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Ay seçimi: geçmiş ve gelecek aylar için hedef girilebilir",
          "Gelir Hedefi (₺): aylık ciro hedefi",
          "Sipariş Hedefi (adet): aylık sipariş sayısı hedefi",
          "Progress ring: tamamlanma yüzdesini animasyonlu olarak gösterir",
        ],
      },
    ],
  },

  "/raporlar": {
    title: "Analiz & Raporlar",
    description: "Satış, ürün performansı ve müşteri segmentasyon raporlarını görüntüler.",
    sections: [
      {
        title: "Veri Kaynakları",
        items: [
          "GetProductSalesReportQuery (Dapper SQL) ile hesaplanır; tenant filtreli",
          "Tarih aralığı, kategori ve ürün bazında filtreleme yapılabilir",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Tarih Aralığı: rapor dönemi seçilir",
          "Ürün Bazlı Satış: hangi ürün ne kadar sattı, gelir ve adet",
          "Export: raporu Excel olarak indir",
        ],
      },
    ],
  },

  "/test": {
    title: "Test",
    description: "Geliştirme ve test amaçlı yapay veri üretir ve sistemi sıfırlar. Sadece geliştirme ortamında kullanılmalıdır.",
    sections: [
      {
        title: "Dikkat",
        items: [
          "Bu sayfa production ortamında kullanılmamalıdır",
          "Seed işlemleri gerçek verilerin üzerine yazabilir",
        ],
      },
      {
        title: "Alanlar & Butonlar",
        items: [
          "Ürün/Kullanıcı/Sipariş Seed: toplu test verisi oluşturur",
          "Kampanya Seed: örnek kampanya verileri ekler",
          "Cache Temizle: Redis/memory cache'i sıfırlar",
          "Veritabanı Sıfırla: tüm verileri siler (dikkat!)",
        ],
      },
    ],
  },
};
