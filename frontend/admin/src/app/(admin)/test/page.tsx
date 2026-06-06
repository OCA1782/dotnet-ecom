"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  CheckCircle2, XCircle, Circle, ChevronDown, ChevronRight, RefreshCw,
  FlaskConical, ExternalLink, Play, Zap, Shield, Eye, Activity,
  Gauge, Code2, GitMerge, Wind, Layers, AlertTriangle, Search,
  RotateCcw, Database, User, Package, Tag, ChevronUp, Server,
  Factory, Hash, Loader2, ShoppingBag, Star, Ticket, UserPlus,
  CheckCircle, XCircle as XCircleIcon, Minus,
  Megaphone, FileText, Truck, CreditCard, Gift, KeyRound,
} from "lucide-react";
import { api } from "@/lib/api";

type Status = "pending" | "pass" | "fail" | "skip";
type FilterTab = "all" | "pending" | "pass" | "fail";

interface TestCase {
  id: string;
  label: string;
  description: string;
  steps?: string[];
  url?: string;
  apiEndpoint?: string;
  apiMethod?: "GET" | "POST" | "PUT" | "PATCH";
  apiBody?: unknown;
  priority?: "critical" | "high" | "medium" | "low";
}

interface TestGroup {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  badge: string;
  description: string;
  execution: "auto" | "manual" | "mixed";
  cases: TestCase[];
}

interface ApiResponse { ok: boolean; status?: number; data?: unknown; ms: number; error?: string; }

const CUSTOMER_BASE = process.env.NEXT_PUBLIC_CUSTOMER_URL ?? "http://localhost:3000";

const TEST_GROUPS: TestGroup[] = [
  {
    id: "smoke",
    title: "Temel Erişilebilirlik",
    icon: Wind,
    color: "amber",
    badge: "Smoke",
    description: "Deploy sonrası sistemin ayakta olduğunu doğrular. Tüm API testleri otomatik çalışır.",
    execution: "mixed",
    cases: [
      { id: "sm_health",        label: "API Sağlık Kontrolü",      description: "Backend API'nin çalışıp çalışmadığını kontrol eder.",              apiEndpoint: "/health",                                    apiMethod: "GET",  priority: "critical" },
      { id: "sm_products",      label: "Ürün Listesi",             description: "Ürünler endpoint'i cevap veriyor mu?",                             apiEndpoint: "/api/products?page=1&pageSize=3",            apiMethod: "GET",  priority: "critical" },
      { id: "sm_categories",    label: "Kategori Listesi",         description: "Kategoriler endpoint'i dizi döndürüyor mu?",                       apiEndpoint: "/api/categories",                            apiMethod: "GET",  priority: "critical" },
      { id: "sm_settings",      label: "Genel Ayarlar",            description: "SiteSettings okunabiliyor mu?",                                    apiEndpoint: "/api/admin/settings",                        apiMethod: "GET",  priority: "critical" },
      { id: "sm_admin_login",   label: "Admin Giriş Sayfası",      description: "Admin giriş sayfası açılıyor mu?",                                 url: "/giris",                                             priority: "critical" },
      { id: "sm_customer_home", label: "Müşteri Ana Sayfa",        description: "Müşteri sitesi yanıt veriyor mu?",                                 url: `${CUSTOMER_BASE}/`,                                  priority: "critical" },
    ],
  },
  {
    id: "api",
    title: "API Endpoint Testleri",
    icon: GitMerge,
    color: "teal",
    badge: "Integration",
    description: "Tüm backend endpoint gruplarını otomatik test eder. Buton ile çalıştırın, sonuçları inline görün.",
    execution: "auto",
    cases: [
      // Auth
      { id: "api_login_fail",     label: "Giriş — Yanlış Şifre",          description: "POST /api/auth/login yanlış şifreyle 401 dönmeli.",              apiEndpoint: "/api/auth/login", apiMethod: "POST", apiBody: { email: "test@test.com", password: "wrongpassword123" }, priority: "high" },
      { id: "api_refresh",        label: "Token Yenileme",                 description: "POST /api/auth/refresh — geçersiz token 400/401 dönmeli.",       apiEndpoint: "/api/auth/refresh", apiMethod: "POST", apiBody: { refreshToken: "invalid-token" } },
      // Dashboard & Raporlar
      { id: "api_dashboard",      label: "Dashboard Özeti",                description: "GET /api/admin/dashboard — KPI verileri döner mi?",              apiEndpoint: "/api/admin/dashboard",                       apiMethod: "GET",  priority: "high" },
      { id: "api_visitor_stats",  label: "Ziyaretçi İstatistikleri",       description: "GET /api/admin/reports/visitor-stats",                           apiEndpoint: "/api/admin/reports/visitor-stats?days=30",   apiMethod: "GET" },
      { id: "api_product_sales",  label: "Ürün Satış Raporu",              description: "GET /api/admin/reports/product-sales",                           apiEndpoint: "/api/admin/reports/product-sales?days=30&topN=10", apiMethod: "GET" },
      { id: "api_queue_stats",    label: "Kuyruk İstatistikleri",          description: "GET /api/admin/reports/queue-stats",                             apiEndpoint: "/api/admin/reports/queue-stats",             apiMethod: "GET" },
      // Health
      { id: "api_health",         label: "Servis Sağlık Detayı",           description: "GET /api/admin/health — tüm servisler döner mi?",                apiEndpoint: "/api/admin/health",                          apiMethod: "GET",  priority: "high" },
      { id: "api_system_info",    label: "Sistem Bilgisi",                 description: "GET /api/admin/system-info — ortam ve versiyon bilgisi",          apiEndpoint: "/api/admin/system-info",                     apiMethod: "GET" },
      // Ürünler & Katalog
      { id: "api_products",       label: "Ürün Arama",                     description: "GET /api/products?search=a — sonuç döner mi?",                   apiEndpoint: "/api/products?search=a&page=1&pageSize=5",   apiMethod: "GET" },
      { id: "api_attributes",     label: "Ürün Nitelikleri",               description: "GET /api/products/attributes — nitelik haritası döner mi?",       apiEndpoint: "/api/products/attributes",                   apiMethod: "GET" },
      { id: "api_brands",         label: "Marka Listesi",                  description: "GET /api/brands — dizi döner mi?",                               apiEndpoint: "/api/brands",                                apiMethod: "GET" },
      // Sipariş & Ödeme
      { id: "api_orders_admin",   label: "Sipariş Listesi (Admin)",        description: "GET /api/orders/admin/list — sayfalı liste döner mi? (TC-ORD-01)",  apiEndpoint: "/api/orders/admin/list?page=1&pageSize=10",   apiMethod: "GET",  priority: "high" },
      { id: "api_payments",       label: "Ödeme Listesi",                  description: "GET /api/admin/payments — ödeme kayıtları döner mi?",             apiEndpoint: "/api/admin/payments?page=1",                 apiMethod: "GET" },
      // Kullanıcılar
      { id: "api_users",          label: "Kullanıcı Listesi",              description: "GET /api/admin/users — kullanıcı listesi döner mi?",              apiEndpoint: "/api/admin/users",                           apiMethod: "GET",  priority: "high" },
      { id: "api_visitor_log",    label: "Ziyaretçi Log Kaydı",            description: "POST /api/visitor/log — 200 OK dönmeli.",                        apiEndpoint: "/api/visitor/log", apiMethod: "POST", apiBody: { page: "/test", referrer: null, latitude: null, longitude: null } },
      { id: "api_contact",        label: "İletişim Formu (TC-INFO-01)",    description: "POST /api/contact — ad/e-posta/mesaj ile 200 dönmeli.",           apiEndpoint: "/api/contact", apiMethod: "POST", apiBody: { name: "Test Kullanıcı", email: "test@test.com", message: "API test mesajı - otomatik test" }, priority: "high" },
      // Diğer
      { id: "api_chatbot_config", label: "Chatbot Yapılandırması",         description: "GET /api/chatbot/config — widget config döner mi?",               apiEndpoint: "/api/chatbot/config",                        apiMethod: "GET" },
      { id: "api_error_logs",     label: "Hata Logları",                   description: "GET /api/admin/error-logs — hata log listesi döner mi?",          apiEndpoint: "/api/admin/error-logs?page=1",               apiMethod: "GET" },
      { id: "api_external_src",   label: "Dış Kaynaklar",                  description: "GET /api/admin/external-sources — kaynak listesi döner mi?",      apiEndpoint: "/api/admin/external-sources",                apiMethod: "GET" },
      // Fatura & Seed
      { id: "api_seed_returns",   label: "Seed — İade Talepleri",          description: "POST /api/admin/seed/returns — RefundRequested(9) statüsünde 3 test sipariş oluşturur (SuperAdmin).", apiEndpoint: "/api/admin/seed/returns", apiMethod: "POST", apiBody: {} },
      { id: "api_seed_invoices",  label: "Seed — Test Faturalar",          description: "POST /api/admin/seed/invoices — 3 test fatura oluşturur: eArchive/eInvoice, Draft/Pending/Sent (TC-INV-01).", apiEndpoint: "/api/admin/seed/invoices", apiMethod: "POST", apiBody: {} },
      { id: "api_invoices",       label: "Fatura Listesi (TC-INV-02)",     description: "GET /api/admin/invoices — fatura listesi döner mi?",              apiEndpoint: "/api/admin/invoices?page=1",                 apiMethod: "GET" },
      { id: "api_invoices_filter",label: "Fatura Tür Filtresi (TC-INV-04)","description": "GET /api/admin/invoices?docType=eArchive — tür filtresi çalışıyor mu?", apiEndpoint: "/api/admin/invoices?docType=eArchive", apiMethod: "GET" },
      { id: "api_seed_guest",     label: "Seed — Misafir Sipariş",         description: "POST /api/admin/seed/guest-orders — guestEmail + sipariş oluşturur; TC-QUERY-01 için gerekli (SuperAdmin).", apiEndpoint: "/api/admin/seed/guest-orders", apiMethod: "POST", apiBody: {} },
      // Lisans
      { id: "api_dev_key",        label: "Lisans — Anahtar Listesi",       description: "GET /api/admin/dev-key — RSA anahtar çifti listesi döner mi?",                apiEndpoint: "/api/admin/dev-key",             apiMethod: "GET" },
      { id: "api_license_assign", label: "Lisans — Atama Listesi",         description: "GET /api/admin/license-assignments — atama listesi döner mi? (SuperAdmin)", apiEndpoint: "/api/admin/license-assignments", apiMethod: "GET" },
    ],
  },
  {
    id: "admin_screens",
    title: "Admin Panel Sayfaları",
    icon: Layers,
    color: "indigo",
    badge: "UI Test",
    description: "Admin panelin tüm sayfalarını açarak temel işlevlerin çalıştığını doğrulayın.",
    execution: "manual",
    cases: [
      { id: "adm_dashboard",      label: "Dashboard",                      description: "KPI kartları, grafik, stok/sipariş uyarıları yükleniyor mu?",    url: "/dashboard",         priority: "critical" },
      { id: "adm_raporlar",       label: "Analiz / Raporlar",              description: "Günlük ziyaret trendi, ülke dağılımı, ürün performansı görünüyor mu?", url: "/raporlar" },
      { id: "adm_hedefler",       label: "Satış Hedefleri",                description: "Hedef oluşturma, ilerleme takibi, grafik çalışıyor mu?",          url: "/hedefler" },
      { id: "adm_orders",         label: "Siparişler",                     description: "Liste, arama, durum filtresi, sipariş detayı çalışıyor mu?",       url: "/siparisler",        priority: "high" },
      { id: "adm_order_detail",   label: "Sipariş Detayı",                 description: "Ürünler, tutar, durum değiştirme, kargo takip çalışıyor mu?",  url: "/siparisler",
        steps: ["Siparişler listesinden PaymentCompleted(3) statüsünde bir siparişe tıkla", "Durum → Hazırlanıyor(4) → Kaydet", "Durum → Kargoya Verildi(5) → kargo firması + takip no gir → Kaydet", "Müşteri: Hesabım → sipariş → kargo takip linki görünmeli"] },
      { id: "adm_odemeler",       label: "Ödemeler",                       description: "Ödeme listesi, filtreleme, ödeme onayı/iptali çalışıyor mu?",      url: "/odemeler" },
      { id: "adm_iade",           label: "İade Yönetimi",                  description: "İade talepleri listeleniyor, aksiyon alınabiliyor mu?",             url: "/iade" },
      { id: "adm_kuponlar",       label: "Kuponlar",                       description: "Kupon oluşturma, Excel import/export, aktif/pasif çalışıyor mu?",  url: "/kuponlar" },
      { id: "adm_products",       label: "Ürünler CRUD",                   description: "Ürün ekleme, düzenleme, görsel yükleme çalışıyor mu?",             url: "/urunler",           priority: "high" },
      { id: "adm_categories",     label: "Kategoriler",                    description: "Hiyerarşik liste, ekleme/düzenleme/silme çalışıyor mu?",           url: "/kategoriler" },
      { id: "adm_markalar",       label: "Markalar",                       description: "Marka listeleme, ekleme/silme çalışıyor mu?",                      url: "/markalar" },
      { id: "adm_stock",          label: "Stok Yönetimi",                  description: "Stok uyarıları, giriş modalı, kritik eşik alanı çalışıyor mu?",   url: "/stok" },
      { id: "adm_reviews",        label: "Yorumlar Moderasyonu",           description: "Onayla / Reddet / Bildir işlemleri çalışıyor mu?",                 url: "/yorumlar" },
      { id: "adm_kullanicilar",   label: "Kullanıcılar",                   description: "Liste, aktif/pasif toggle, rol atama modal'ı çalışıyor mu?",       url: "/kullanicilar" },
      { id: "adm_ziyaretciler",   label: "Ziyaretçiler",                   description: "IP listesi, tarayıcı/konum bilgisi, harita linki görünüyor mu?",   url: "/ziyaretciler" },
      { id: "adm_hareketler",     label: "Hareketler (Audit Log)",         description: "Log listesi, filtreler, LoginFailed kırmızı satır çalışıyor mu?", url: "/hareketler" },
      { id: "adm_takip",          label: "Hata Takip",                     description: "Hata logları, filtreler, detay görünüyor mu?",                     url: "/takip" },
      { id: "adm_dis_kaynaklar",  label: "Dış Kaynaklar",                  description: "Kaynak listesi, bağlantı durumu, import sayfası açılıyor mu?",     url: "/dis-kaynaklar" },
      { id: "adm_servisler",      label: "Servisler",                      description: "Servis durumu, latency grafikleri, otomatik yenileme çalışıyor mu?", url: "/servisler" },
      { id: "adm_kuyruklar",      label: "Kuyruklar",                      description: "Outbox istatistikleri, broker bilgisi görünüyor mu?",               url: "/kuyruklar" },
      { id: "adm_dokuman",        label: "Dokümanlar",                     description: "İş süreçleri, teknik, yenilikler sekmeleri açılıyor mu?",           url: "/dokuman" },
      { id: "adm_yonetim_genel",  label: "Yönetim — Genel",                description: "Site adı, logo, renk ayarları kaydediliyor mu?",                   url: "/yonetim",           priority: "high" },
      { id: "adm_yonetim_gorunum",label: "Yönetim — Görünüm",              description: "Tema önayarı, renk/font seçimi, canlı önizleme çalışıyor mu?",     url: "/yonetim",
        steps: ["Yönetim sayfasını aç", "Görünüm sekmesine geç", "Bir tema önayarı seç", "Font değiştir ve canlı önizlemeyi kontrol et"] },
      { id: "adm_yonetim_mesajlar",label: "Yönetim — Mesajlar",           description: "Mesaj grupları açılıp kapanıyor, düzenlenip kaydediliyor mu?",      url: "/yonetim",
        steps: ["Mesajlar sekmesine geç", "Bir grubu genişlet", "Bir mesajı düzenle", "Kaydet butonuna bas"] },
      { id: "adm_yonetim_yetkiler",label: "Yönetim — Yetkiler",           description: "RBAC matris hücreleri toggle edilip kaydediliyor mu?",              url: "/yonetim",
        steps: ["Yetkiler sekmesine geç", "Bir hücreye tıkla (SuperAdmin hariç)", "Değişti badge'ini kontrol et", "Kaydet'e bas"] },
      { id: "adm_yonetim_chatbot", label: "Yönetim — Chatbot",            description: "WhatsApp/Telegram ayarları, enabled toggle çalışıyor mu?",          url: "/yonetim" },
      { id: "adm_bildirimler",    label: "Bildirim Paneli",                description: "Zil ikonu tıklandığında dropdown açılıyor mu?",                     priority: "high",
        steps: ["Üst barda zil ikonuna tıkla", "Dropdown'ın açıldığını doğrula", "Bildirimlerin listelendiğini kontrol et"] },
    ],
  },
  {
    id: "customer_screens",
    title: "Müşteri Sitesi Sayfaları",
    icon: Eye,
    color: "orange",
    badge: "UI Test",
    description: "Müşteri mağazasının (port 3000) tüm sayfalarını test edin. Bağlantıya tıklayarak açın.",
    execution: "manual",
    cases: [
      { id: "cust_home",          label: "Ana Sayfa",                       description: "Hero bölümü, öne çıkan ürünler, kategoriler, chatbot widget görünüyor mu?", url: `${CUSTOMER_BASE}/`, priority: "critical" },
      { id: "cust_products",      label: "Ürün Listesi + Filtreler",        description: "Fiyat/marka/nitelik filtreleri, sıralama, sayfalama çalışıyor mu?",         url: `${CUSTOMER_BASE}/urunler` },
      { id: "cust_product_detail",label: "Ürün Detay",                     description: "Görseller, varyant seçimi, yorumlar bölümü, sepete ekle çalışıyor mu?",     url: `${CUSTOMER_BASE}/urunler`,
        steps: ["Ürün listesinden bir ürüne tıkla", "Varyant seç (varsa)", "Sepete Ekle butonuna bas", "Header'daki sepet ikonunun güncellediğini doğrula"] },
      { id: "cust_cart",          label: "Sepet",                          description: "Adet güncelleme, ürün silme, kupon alanı, seçili ürünler çalışıyor mu?",     url: `${CUSTOMER_BASE}/sepet` },
      { id: "cust_checkout",      label: "Ödeme Sayfası",                  description: "Adres formu, ödeme yöntemi seçimi, misafir checkout çalışıyor mu?",         url: `${CUSTOMER_BASE}/odeme` },
      { id: "cust_login",         label: "Giriş Sayfası",                  description: "Form validasyonu, 'Beni Hatırla' checkbox, hata mesajları çalışıyor mu?",   url: `${CUSTOMER_BASE}/giris` },
      { id: "cust_register",      label: "Kayıt Sayfası",                  description: "Form validasyonu, e-posta doğrulama akışı çalışıyor mu?",                  url: `${CUSTOMER_BASE}/kayit` },
      { id: "cust_account",       label: "Hesabım",                        description: "Sipariş geçmişi, adresler, profil güncelleme çalışıyor mu?",                url: `${CUSTOMER_BASE}/hesabim` },
      { id: "cust_favorites",     label: "Favoriler",                      description: "Ürün kartındaki kalp butonu favoriye ekliyor/çıkarıyor mu?",                 url: `${CUSTOMER_BASE}/favoriler`,
        steps: ["Giriş yap", "Ürün listesinden bir üründe kalp ikonuna tıkla", "/favoriler sayfasını aç ve ürünün listelendiğini doğrula"] },
      { id: "cust_order_track",   label: "Sipariş Takibi",                 description: "/siparis-sorgula sayfası çalışıyor mu?",                                    url: `${CUSTOMER_BASE}/siparis-sorgula` },
      { id: "cust_forgot_pw",     label: "Şifremi Unuttum",                description: "Kanal seçimi (E-posta/WA/TG), e-posta gönderimi çalışıyor mu?",            url: `${CUSTOMER_BASE}/sifre-sifirla` },
      { id: "cust_campaign",      label: "İndirimli Ürünler Filtresi",     description: "indirimli=true ile sadece kampanyalı ürünler geliyor mu?",                  url: `${CUSTOMER_BASE}/urunler?indirimli=true` },
      { id: "cust_konum_banner",  label: "Konum İzin Banner'ı",            description: "İlk ziyarette konum paylaşım banner'ı görünüyor mu?",                       url: `${CUSTOMER_BASE}/`,
        steps: ["Localhost'u ilk kez aç veya localStorage'dan konum izin kaydını sil", "Sayfanın sağ altında banner'ın göründüğünü doğrula"] },
      { id: "cust_iletisim",      label: "İletişim Sayfası + Form (TC-INFO-01)", description: "İletişim bilgileri görünüyor mu? 'Bize Yazın' formu çalışıyor mu?",           url: `${CUSTOMER_BASE}/iletisim`, priority: "high",
        steps: ["İletişim sayfasını aç — e-posta/telefon/adres/harita kartları görünmeli", "'Bize Yazın' bölümünde ad/e-posta/mesaj formu görünmeli", "Formu doldur → Mesaj Gönder'e bas", "Başarı mesajı: 'Mesajınız alındı!' görünmeli"] },
      { id: "cust_sss",           label: "SSS Accordion (TC-INFO-02)",     description: "SSS sayfasında soru-cevap accordion'ları açılıp kapanıyor mu?",                 url: `${CUSTOMER_BASE}/sss`,
        steps: ["Admin: Yönetim → Ayarlar → Page_SSS key'ine JSON dizi gir: [{\"q\":\"...\",\"a\":\"...\"}]", "/sss sayfasını aç — accordion öğeleri görünmeli", "Bir soruya tıkla → cevap açılmalı (native <details> davranışı)", "Tekrar tıkla → kapanmalı"] },
    ],
  },
  {
    id: "e2e",
    title: "Uçtan Uca Kullanıcı Akışları",
    icon: Activity,
    color: "sky",
    badge: "E2E",
    description: "Gerçek kullanıcı senaryolarını adım adım takip ederek test edin. Her adımı sırayla uygulayın.",
    execution: "manual",
    cases: [
      { id: "e2e_guest_order",    label: "Misafir Sipariş Akışı",          description: "Giriş yapmadan ürün ekle, checkout'ta adres doldur, siparişi tamamla.",     priority: "critical",
        steps: ["Müşteri sitesini aç (giriş yapma)", "Ürünlere gözat, sepete ekle", "Sepete git → Ödemeye Geç", "Misafir adres formunu doldur", "Siparişi Tamamla'ya bas", "Sipariş numarasının göründüğünü doğrula"] },
      { id: "e2e_register_login", label: "Kayıt + Giriş + Token Yenileme",  description: "Yeni kullanıcı kaydı, giriş yap, 'Beni Hatırla' ile token yenileme.",       priority: "high",
        steps: ["Yeni e-posta ile /kayit sayfasını aç", "Formu doldurup kayıt ol", "E-posta doğrulama kodunu gir", "/giris sayfasında 'Beni Hatırla' seçili giriş yap", "Admin > Hareketler'de Login kaydını doğrula"] },
      { id: "e2e_full_order",     label: "Tam Sipariş → Admin Onay → Kargo", description: "Müşteri sipariş oluşturur, admin durumu günceller, kargo takip no girer.",  priority: "critical",
        steps: ["Müşteri: giriş yap → sepete ekle → öde → sipariş no al", "Admin: Siparişler → siparişi bul", "Durum: Hazırlanıyor → Kargoya Verildi yap", "Kargo takip numarası gir", "Müşteri: Hesabım → sipariş takip kutusunu doğrula"] },
      { id: "e2e_coupon",         label: "Kupon Oluştur + Sepette Uygula",  description: "Admin kupon oluşturur, müşteri sepette uygular.",
        steps: ["Admin: Kuponlar → Yeni Kupon → %20 indirim, min. sepet 100₺ → kaydet", "Müşteri: 100₺ üzeri sepet oluştur", "Kupon kodu gir → indirim tutarını doğrula", "Checkout tamamla, siparişte indirim görünüyor mu?"] },
      { id: "e2e_review",         label: "Yorum Yaz + Admin Onayı",         description: "Müşteri ürün yorumu yazar, admin onaylar, müşteri sitesinde görünür.",
        steps: ["Müşteri: bir ürün sipariş et ve tamamla", "Ürün detay sayfasına git → Yorum yaz", "Admin: Yorumlar → yorumu bul → Onayla", "Müşteri: ürün sayfasını yenile → yorum görünmeli"] },
      { id: "e2e_refund",         label: "İade Talebi + Admin Onayı",       description: "Müşteri iade ister, admin onaylar.",
        steps: ["Müşteri: teslim edilmiş bir siparişi aç", "İade Talep Et butonuna bas", "Admin: /iade sayfasından talebi bul → Onayla", "Sipariş durumunun İade Onaylandı (10) olduğunu doğrula"] },
      { id: "e2e_forgot_pw",      label: "Şifremi Unuttum + Sıfırla",       description: "E-posta ile şifre sıfırlama akışını test eder.",
        steps: ["Müşteri: /sifre-sifirla → e-posta seç → gönder", "Maildeki bağlantıya tıkla", "Yeni şifreyi gir → kaydet", "Yeni şifreyle giriş yap ve başarıyı doğrula", "Admin: Hareketler → PasswordReset kaydı var mı?"] },
      { id: "e2e_stock_depletion", label: "Stok Tükenmesi + Dashboard Alarm (TC-E2E-04)", description: "Stok çıkışı yapıldığında kritik sayaç Dashboard'da güncelleniyor mu?",
        steps: [
          "GET /api/admin/dashboard → criticalStockCount değerini not al",
          "Stok sayfasından bir ürün seç → POST /api/admin/stocks/adjust {movementType:'StockOut', quantity: kritik eşiğin altına düşürecek miktar}",
          "GET /api/admin/dashboard → criticalStockCount arttı mı?",
          "Dashboard UI'da Stok Uyarıları bölümünü kontrol et — ürün listede görünmeli",
          "Stok → stoku eşiğin üstüne çıkar → Dashboard yenile → uyarı kaybolmalı",
        ] },
    ],
  },
  {
    id: "features",
    title: "Özellik & Entegrasyon Testleri",
    icon: Zap,
    color: "violet",
    badge: "Feature",
    description: "Platform özelliklerinin çalışıp çalışmadığını test eder. Otomatik ve manuel adımlar karışıktır.",
    execution: "mixed",
    cases: [
      { id: "feat_visitor_log",    label: "Ziyaretçi Log API",             description: "Ziyaretçi log endpoint'i 200 döndürüyor mu?",                apiEndpoint: "/api/visitor/log", apiMethod: "POST", apiBody: { page: "/test-feature", referrer: null, latitude: null, longitude: null } },
      { id: "feat_chatbot_config", label: "Chatbot Config API",            description: "Chatbot widget config endpoint çalışıyor mu?",               apiEndpoint: "/api/chatbot/config", apiMethod: "GET" },
      { id: "feat_notifications",  label: "Bildirim Zili Paneli",          description: "Admin üst bara zil ikonuna tıklayınca bildirimler yükleniyor mu?",
        steps: ["Admin panelde üst bardaki zil ikonuna tıkla", "Dropdown'ın açıldığını doğrula", "Sipariş/stok/yorum bildirimlerinin geldiğini kontrol et"] },
      { id: "feat_stock_alarm",    label: "Stok Alarm Uyarısı",            description: "Kritik eşiğin altındaki ürünler Dashboard'da gösteriliyor mu?",
        steps: ["Admin: Stok → bir ürünün kritik eşiğini mevcut miktarın üstüne çıkar", "Dashboard'a git → Stok Uyarıları bölümünü kontrol et"] },
      { id: "feat_email_test",     label: "Test E-postası",                description: "Yönetim > E-posta sekmesinden test maili gönderiliyor mu?",
        steps: ["Yönetim → E-posta sekmesine git", "Geçerli bir e-posta adresi gir", "Test Gönder butonuna bas", "E-postanın gelip gelmediğini kontrol et"] },
      { id: "feat_wishlist_api",   label: "Favori Ekle/Çıkar API",         description: "GET /api/wishlist endpoint'i çalışıyor mu?",                 apiEndpoint: "/api/wishlist", apiMethod: "GET" },
      { id: "feat_refresh_token",  label: "Token Yenileme (interceptor)",  description: "Token süresi dolunca otomatik yenileniyor mu?",
        steps: ["Giriş yap → DevTools → Application → Local Storage'dan token'ı geçersiz bir değerle değiştir", "API gerektiren bir sayfa aç", "Network sekmesinde /api/auth/refresh çağrısının yapıldığını doğrula", "Sayfa hatasız yüklendiyse interceptor çalışıyor"] },
      { id: "feat_session_warning", label: "Oturum Zaman Aşımı Uyarısı",  description: "Token sona yaklaşınca sağ altta uyarı balonunun çıkması",
        steps: ["JWT token süresini kısa tut (appsettings'te ExpiryMinutes=1)", "Admin panelde 1 dakika bekle", "Sağ altta uyarı balonunun çıkmasını bekle"] },
      { id: "feat_sidebar_search", label: "Sol Menü Arama",               description: "Sol menü arama kutusunda yazınca sonuçlar filtreleniyor mu?",
        steps: ["Admin panelde sol menü arama kutusuna 'sipariş' yaz", "Siparişler ve ilgili sonuçların çıktığını doğrula", "Escape tuşuna basınca temizlendiğini doğrula"] },
      { id: "feat_sidebar_accordion", label: "Sol Menü Grup Aç/Kapat",    description: "Sidebar'da grup başlığına tıklayınca grup kapanıp açılıyor mu?",
        steps: ["Bir grup başlığına (örn. Katalog) tıkla", "Alt menü öğelerinin kapandığını doğrula", "Tekrar tıkla → açılıyor mu?", "Sayfayı yenile → durum korunuyor mu?"] },
      { id: "feat_theme_apply",   label: "Tema Değişikliği Canlı Önizleme", description: "Görünüm sekmesindeki tema önayarı seçince canlı önizleme güncelleniyor mu?",
        steps: ["Yönetim → Görünüm → Tema Önayarları bölümüne git", "Farklı bir tema önayarı seç", "Canlı Önizleme kutusu renklerin değiştiğini gösteriyor mu?"] },
    ],
  },
  {
    id: "security",
    title: "Güvenlik Testleri",
    icon: Shield,
    color: "red",
    badge: "Security",
    description: "Kimlik doğrulama, yetkilendirme ve veri güvenliği denetimi. Kritik — release öncesi yapılmalı.",
    execution: "manual",
    cases: [
      { id: "sec_auth_bypass",    label: "Admin Endpoint Koruması",        description: "Token olmadan /api/admin/* endpoint'i 401 dönmeli.",          priority: "critical",
        steps: ["Chrome DevTools → Network → bir admin API isteğini kopyala", "Authorization header'ını çıkar ya da geçersiz bir token gir", "İsteği tekrar gönder → 401 Unauthorized bekleniyor"] },
      { id: "sec_role_check",     label: "Rol Yetki Kontrolü",             description: "Düşük yetkili rol, SuperAdmin endpoint'ine erişememeli.",     priority: "high",
        steps: ["ContentManager rolüyle giriş yap", "DevTools ile /api/admin/users endpoint'ine istek gönder", "403 Forbidden bekleniyor"] },
      { id: "sec_rate_limit",     label: "Rate Limiting",                  description: "Kısa sürede çok sayıda istek → 429 Too Many Requests?",
        steps: ["cURL ile 15 saniyede /api/auth/login'e 10+ istek gönder", "Yanıtın 429 olduğunu kontrol et"] },
      { id: "sec_account_lockout", label: "Hesap Kilitleme (5 Hata)",      description: "5 yanlış şifre → hesap 15 dakika kilitlenir.",               priority: "critical",
        steps: ["Aynı hesaba art arda 5 yanlış şifre gir", "6. denemede 'Hesabınız kilitlendi' mesajını doğrula", "Admin: Hareketler → AccountLocked kaydının var olduğunu kontrol et"] },
      { id: "sec_xss",            label: "XSS Koruması",                   description: "Form alanlarına script tag girilince sanitize ediliyor mu?",
        steps: ["Ürün adı alanına şunu gir: <script>alert('xss')</script>", "Kaydet → sayfada alert çıkmamali", "Kaydedilen değerin HTML entity'ye dönüştüğünü doğrula"] },
      { id: "sec_headers",        label: "Güvenlik Header'ları",           description: "Yanıt headerlarında CSP, HSTS, X-Frame-Options var mı?",
        steps: ["DevTools → Network → herhangi bir API yanıtını aç → Response Headers", "X-Frame-Options, X-Content-Type-Options, CSP başlıklarını kontrol et"] },
      { id: "sec_password_reset", label: "Şifre Sıfırlama Audit Log",      description: "Şifre sıfırlanınca PasswordReset audit kaydı yazılıyor mu?",
        steps: ["Şifremi unuttum akışından şifreyi sıfırla", "Admin: Hareketler → PasswordReset kayıt var mı?"] },
      { id: "sec_token_refresh_log", label: "Token Yenileme Audit Log",    description: "Refresh token kullanınca TokenRefreshed audit kaydı yazılıyor mu?",
        steps: ["'Beni Hatırla' ile giriş yap", "Token sona erince otomatik yenilemeyi bekle veya interceptor'ı tetikle", "Admin: Hareketler → TokenRefreshed kaydı var mı?"] },
      { id: "sec_license_mw",      label: "Lisans Middleware Koruması",    description: "ECOM_LICENSE geçersizse tüm API istekleri reddediliyor mu?",               priority: "critical",
        steps: [".env dosyasında ECOM_LICENSE değerini geçersiz yap → docker compose up -d --force-recreate api", "Herhangi bir endpoint'e istek gönder → 503 Service Unavailable bekleniyor", ".env'i geri al → docker compose up -d --force-recreate api → normal çalışmayı doğrula"] },
      { id: "sec_license_role",    label: "Lisans Endpoint Yetki Kontrolü", description: "Lisans atama/listeleme endpointleri yalnızca SuperAdmin'e açık mı?",       priority: "high",
        steps: ["Admin rolüyle giriş yap (SuperAdmin değil)", "DevTools Network → GET /api/admin/license-assignments isteği gönder", "403 Forbidden bekleniyor"] },
    ],
  },
  {
    id: "performance",
    title: "Performans Testleri",
    icon: Gauge,
    color: "emerald",
    badge: "Perf",
    description: "Sayfa yüklenme süreleri, API yanıt hızları ve önbellek etkinliği. Chrome DevTools kullanın.",
    execution: "manual",
    cases: [
      { id: "perf_api_response",  label: "API Yanıt Süresi < 200ms",       description: "Ürün listesi endpoint'i 200ms'nin altında yanıt veriyor mu?",
        steps: ["Chrome DevTools → Network sekmesi aç", "/api/products?page=1&pageSize=10 isteğini tetikle", "Time sütununda 200ms'nin altında olduğunu doğrula"] },
      { id: "perf_cache_hit",     label: "Redis Cache Etkinliği",           description: "Aynı endpoint'e 2. istek, 1. istekten belirgin şekilde daha hızlı mı?",
        steps: ["DevTools Network'te /api/products isteğini not al (süre)", "Sayfayı yenile → aynı endpoint'e 2. istek süresine bak", "2. istek en az %50 daha hızlı olmalı"] },
      { id: "perf_lighthouse",    label: "Lighthouse Performance > 70",     description: "Müşteri ana sayfası Lighthouse skoru 70+ mı?",
        steps: ["Chrome DevTools → Lighthouse sekmesi", "Performance kategorisini seç → Analyze page load", "Performance skorunun 70'in üzerinde olduğunu doğrula"] },
      { id: "perf_large_list",    label: "Büyük Liste Sayfalaması",         description: "100 kayıt döndüren sayfalı liste < 500ms yanıt veriyor mu?",
        steps: ["DevTools Network: /api/products?pageSize=100 isteğini gönder", "Yanıt süresinin 500ms altında olduğunu doğrula"] },
    ],
  },
  {
    id: "unit",
    title: "Unit & Kod Testleri",
    icon: Code2,
    color: "slate",
    badge: "Unit",
    description: "Tekil fonksiyon ve backend servis testleri. xUnit (backend) veya Jest/Vitest (frontend).",
    execution: "manual",
    cases: [
      { id: "unit_price_format",  label: "Fiyat Formatlama",               description: "formatPrice() TRY sembolü ve virgül kullanıyor mu?",
        steps: ["Browser Console: new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(149.90)", "Sonucun '₺149,90' olduğunu doğrula"] },
      { id: "unit_password_hash", label: "Şifre Hash Doğrulama",           description: "IPasswordService.Verify() doğru → true, yanlış → false",
        steps: ["Backend: PasswordServiceTests projesini xUnit ile çalıştır", "Hash/Verify round-trip test geçti mi?"] },
      { id: "unit_jwt",           label: "JWT Token Üretimi",              description: "GenerateToken() doğru claim'leri içeriyor mu?",
        steps: ["Üretilen tokeni jwt.io'ya yapıştır", "email, role, exp claim'lerinin doğru olduğunu kontrol et"] },
      { id: "unit_coupon_rules",  label: "Kupon Geçerlilik Kuralları",     description: "Süresi dolmuş / limiti aşılmış kupon reddediliyor mu?",
        steps: ["Süresi dolmuş kupon kodu oluştur → sepette uygula → hata mesajı bekleniyor", "Kullanım limiti dolmuş kupon dene → hata mesajı bekleniyor"] },
      { id: "unit_order_status",  label: "Sipariş Durumu Renkleri",        description: "Tüm sipariş statüsleri (1-12) için renk sınıfı döndürüyor mu?",
        steps: ["src/types/index.ts veya types dosyasını aç", "ORDER_STATUS_COLORS'da 1-12 tüm değerlerin tanımlı olduğunu kontrol et"] },
    ],
  },
  {
    id: "license",
    title: "Lisans Sistemi",
    icon: KeyRound,
    color: "teal",
    badge: "License",
    description: "Lisans üretimi, atama, görüntüleme ve online aktivasyon süreçlerini test eder. Kritik — canlı ortam öncesi yapılmalı.",
    execution: "mixed",
    cases: [
      // Otomatik API testleri
      { id: "lic_api_dev_key",      label: "Anahtar Çifti Listesi API",      description: "GET /api/admin/dev-key — RSA anahtar listesi döner mi?",                  apiEndpoint: "/api/admin/dev-key",             apiMethod: "GET",  priority: "high" },
      { id: "lic_api_assignments",  label: "Lisans Atamaları API",           description: "GET /api/admin/license-assignments — atama listesi döner mi?",            apiEndpoint: "/api/admin/license-assignments", apiMethod: "GET",  priority: "high" },
      // Ortam değişkenleri
      { id: "lic_env_vars",         label: "Ortam Değişkenleri Kontrolü",    description: "ECOM_LICENSE, ECOM_PUBLIC_KEY, LICENSE_ACTIVATION_URL tanımlı mı?",       priority: "critical",
        steps: ["docker exec ecom-api-1 printenv | grep -E 'ECOM|LICENSE' komutunu çalıştır", "3 değişkenin de mevcut olduğunu doğrula", "ECOM_PUBLIC_KEY eksikse API lisans doğrulaması başarısız olur"] },
      // Anahtar çifti ve token üretimi
      { id: "lic_key_generate",     label: "Yeni RSA Anahtar Çifti Üret",   description: "Yönetim → Lisans → 'Yeni RSA-2048 Anahtar Çifti Üret' butonu çalışıyor mu?", priority: "critical",
        steps: ["Yönetim → Lisans sekmesine git", "Lisans Üretici bölümüne in", "'Yeni RSA-2048 Anahtar Çifti Üret' butonuna tıkla", "Public key'in textarea'ya yapıştırıldığını doğrula"] },
      { id: "lic_token_generate",   label: "Lisans Token Üret",             description: "Mevcut key pair ile yeni lisans token'ı üretiliyor mu?",                  priority: "critical",
        steps: ["Yönetim → Lisans → Lisans Üretici bölümü", "Issuer ve tarihleri doldur (opsiyonel: Host IP)", "'Lisans Token Üret' butonuna tıkla", "Token'ın header.signature formatıyla göründüğünü doğrula", "Kopyala butonu çalışıyor mu?"] },
      // Token aktivasyon
      { id: "lic_activate",         label: "Platform Lisansını Aktive Et",  description: "Yönetim → Lisans → token yapıştır → aktive et akışı çalışıyor mu?",
        steps: ["Yönetim → Lisans → 'Platform Lisansını Aktive Et' bölümüne git", "Geçerli bir token yapıştır", "Aktive Et butonuna bas", "Başarı mesajı göründüğünü doğrula"] },
      // Atama işlemleri
      { id: "lic_assign_email",     label: "E-posta ile Lisans Atama",      description: "E-posta adresi ile admin kullanıcıya lisans atanıyor mu?",               priority: "critical",
        steps: ["Yönetim → Lisans → Lisans Atama bölümüne git", "Geçerli bir admin e-posta adresi gir", "Mevcut platform token'ını yapıştır", "Ata butonuna bas", "Başarı mesajı ve görüntüleme şifresinin göründüğünü doğrula", "Atama listesinde yeni kayıt var mı?"] },
      { id: "lic_assign_name",      label: "Ad-Soyad ile Lisans Atama",     description: "Ad-Soyad ile admin kullanıcıya lisans atanıyor mu?",
        steps: ["Yönetim → Lisans → Atama bölümü", "E-posta yerine 'Ad Soyad' formatında gir", "Token yapıştır → Ata", "Başarı mesajı geldi mi? Kullanıcı listeye eklendi mi?"] },
      { id: "lic_assign_invalid",   label: "Geçersiz Kullanıcı Atama Hatası", description: "Olmayan kullanıcıya atamada hata mesajı geliyor mu?",
        steps: ["Yönetim → Lisans → Atama bölümü", "Olmayan bir e-posta gir", "Ata butonuna bas", "Hata: 'kullanıcı bulunamadı' mesajı bekleniyor"] },
      // Görüntüleme
      { id: "lic_reveal",           label: "Lisans Görüntüleme (Admin)",    description: "Admin kullanıcı görüntüleme şifresiyle kendi lisansını görebiliyor mu?",  priority: "high",
        steps: ["Admin hesabıyla giriş yap (lisans atanmış olmalı)", "Yönetim → Lisans → 'Lisansımı Görüntüle' bölümüne git", "E-posta ile gönderilen görüntüleme şifresini gir", "Token'ın maskesiz göründüğünü doğrula", "Yanlış şifre girilince hata mesajı geliyor mu?"] },
      { id: "lic_dev_reveal",       label: "DevReveal ile Platform Token",  description: "DevRevealPassword ile platform token görüntüleniyor mu?",
        steps: ["Yönetim → Lisans → 'Platform Lisansını Görüntüle' bölümünü bul", "appsettings'teki DevRevealPassword değerini gir", "Platform token'ının görüntülendiğini doğrula", "Yanlış şifre → 'Yanlış şifre' hatası bekleniyor"] },
      // İptal
      { id: "lic_revoke",           label: "Lisans Atama İptal (Revoke)",   description: "Atanmış lisans iptal edilebiliyor mu?",
        steps: ["Yönetim → Lisans → Atama listesinden bir kaydı bul", "İptal (trash) butonuna tıkla", "Kaydın 'İptal Edildi' olarak işaretlendiğini doğrula"] },
      // Güvenlik & altyapı
      { id: "lic_online_activation", label: "Online Aktivasyon Durumu",     description: "LICENSE_ACTIVATION_URL tanımlıysa Cloudflare'e ulaşılıyor mu?",
        steps: ["docker exec ecom-api-1 printenv | grep LICENSE_ACTIVATION_URL komutunu çalıştır", "API'ye istek gönder → docker logs ecom-api-1 --tail=20 ile hata var mı kontrol et", "Hata yoksa online aktivasyon çalışıyor"] },
      { id: "lic_host_binding",     label: "Host Binding Doğrulaması",      description: "Token'da host alanı varsa, yanlış IP'de çalışmıyor mu?",
        steps: ["Yönetim → Lisans → Lisans Üretici → Host alanına farklı bir IP gir", "Token üret, .env'e yükle, API'yi yeniden başlat", "docker logs ecom-api-1 | grep -i 'host\\|binding\\|lisans' → hata bekleniyor"] },
      { id: "lic_invalid_token",    label: "Geçersiz Token Reddi",          description: "Bozuk/imzasız token girilince API hata veriyor mu?",
        steps: ["Yönetim → Lisans → 'Platform Lisansını Aktive Et' bölümü", "Token alanına geçersiz bir string yapıştır (örn: 'abc.xyz')", "Aktive Et → 'Geçersiz lisans' hata mesajı bekleniyor"] },
    ],
  },
];

const COLOR_HEADER: Record<string, string> = {
  amber:   "bg-amber-50 border-amber-200",
  teal:    "bg-teal-50 border-teal-200",
  indigo:  "bg-indigo-50 border-indigo-200",
  orange:  "bg-orange-50 border-orange-200",
  sky:     "bg-sky-50 border-sky-200",
  violet:  "bg-violet-50 border-violet-200",
  red:     "bg-red-50 border-red-200",
  emerald: "bg-emerald-50 border-emerald-200",
  slate:   "bg-slate-50 border-slate-200",
  pink:    "bg-pink-50 border-pink-200",
};
const COLOR_ICON: Record<string, string> = {
  amber: "text-amber-600", teal: "text-teal-600", indigo: "text-indigo-600",
  orange: "text-orange-600", sky: "text-sky-600", violet: "text-violet-600",
  red: "text-red-600", emerald: "text-emerald-600", slate: "text-slate-500", pink: "text-pink-600",
};
const COLOR_BADGE: Record<string, string> = {
  amber: "bg-amber-100 text-amber-700", teal: "bg-teal-100 text-teal-700", indigo: "bg-indigo-100 text-indigo-700",
  orange: "bg-orange-100 text-orange-700", sky: "bg-sky-100 text-sky-700", violet: "bg-violet-100 text-violet-700",
  red: "bg-red-100 text-red-700", emerald: "bg-emerald-100 text-emerald-700", slate: "bg-slate-100 text-slate-600", pink: "bg-pink-100 text-pink-700",
};
const COLOR_PROGRESS: Record<string, string> = {
  amber: "bg-amber-400", teal: "bg-teal-500", indigo: "bg-indigo-500",
  orange: "bg-orange-500", sky: "bg-sky-500", violet: "bg-violet-500",
  red: "bg-red-500", emerald: "bg-emerald-500", slate: "bg-slate-400", pink: "bg-pink-500",
};

const PRIORITY_LABEL: Record<string, { label: string; cls: string }> = {
  critical: { label: "Kritik",   cls: "bg-red-100 text-red-700 border border-red-200" },
  high:     { label: "Yüksek",  cls: "bg-orange-100 text-orange-700 border border-orange-200" },
  medium:   { label: "Orta",    cls: "bg-amber-100 text-amber-700" },
  low:      { label: "Düşük",   cls: "bg-slate-100 text-slate-500" },
};

const STORAGE_KEY = "admin_test_results_v3";

function loadResults(): Record<string, { status: Status; note: string }> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
  catch { return {}; }
}
function saveResults(r: Record<string, { status: Status; note: string }>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
}

function ProgressRing({ pct, size = 40, stroke = 4, color }: { pct: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
    </svg>
  );
}

const TEST_MODELS = [
  {
    id: "users",
    label: "Kullanıcılar",
    icon: User,
    color: "teal",
    items: [
      {
        name: "Müşteri (Yeni)",
        fields: {
          Email: "testmusteri@test.com", Şifre: "Test1234!",
          Ad: "Test", Soyad: "Müşteri", Rol: "Customer",
          Durum: "Aktif", Sepet: "Boş", Favori: "0 ürün",
        },
      },
      {
        name: "Müşteri (Onaylı Alış)",
        fields: {
          Email: "onaylimüşteri@test.com", Şifre: "Test1234!",
          Ad: "Onaylı", Soyad: "Alıcı", Rol: "Customer",
          "Geçmiş Siparişi": "En az 1 teslim edilmiş sipariş (yorum yazabilmek için)",
        },
      },
      {
        name: "Admin",
        fields: {
          Email: "admin@test.com", Şifre: "••••••••",
          Ad: "Test", Soyad: "Admin", Rol: "Admin",
          Erişim: "Tüm admin sayfaları (/api/admin/*)",
        },
      },
      {
        name: "ContentManager",
        fields: {
          Email: "icerik@test.com", Şifre: "Test1234!",
          Ad: "İçerik", Soyad: "Yöneticisi", Rol: "ContentManager",
          Erişim: "Kısıtlı (kullanıcılar sayfasına erişemez)",
        },
      },
      {
        name: "SuperAdmin (seed)",
        fields: {
          Email: "appsettings → Seed:AdminEmail", Şifre: "appsettings → Seed:AdminPassword",
          Rol: "SuperAdmin", Not: "Silinemez, tüm yetkilere sahip",
        },
      },
      {
        name: "Kilitli Hesap",
        fields: {
          Email: "kilitli@test.com", Şifre: "Yanlis1234! × 5 giriş",
          Durum: "LockoutUntil = 15 dk sonra",
          Test: "6. hatadan sonra kilitleniyor mu?",
        },
      },
    ],
  },
  {
    id: "products",
    label: "Ürünler",
    icon: Package,
    color: "indigo",
    items: [
      {
        name: "Basit Ürün",
        fields: {
          İsim: "Test Ürünü A", SKU: "TST-A-001",
          Fiyat: "149.90₺", Stok: "50", KritikEşik: "10",
          Kategori: "Herhangi", Marka: "Test Marka", Aktif: "Evet",
        },
      },
      {
        name: "İndirimli Ürün",
        fields: {
          İsim: "Test Ürünü B (İndirimli)", SKU: "TST-B-001",
          Fiyat: "199.90₺", İndirimFiyatı: "149.90₺",
          İndirimOranı: "%25", Stok: "20", Aktif: "Evet",
          "onSale filtresi": "indirimli=true ile listede görünür",
        },
      },
      {
        name: "Varyantlı Ürün",
        fields: {
          İsim: "Test Varyantlı Ürün", SKU: "TST-V",
          "Varyant 1": "Renk:Kırmızı / Beden:S — Stok:10",
          "Varyant 2": "Renk:Mavi / Beden:M — Stok:5",
          "Varyant 3": "Renk:Siyah / Beden:L — Stok:0 (tükendi)",
          Test: "Tükenmiş varyant sepete eklenememeli",
        },
      },
      {
        name: "Kritik Stok",
        fields: {
          İsim: "Kritik Stok Ürünü", SKU: "TST-K-001",
          Fiyat: "50₺", Stok: "2", KritikEşik: "5",
          Beklenen: "Dashboard stok uyarısında görünmeli",
          Test: "Eşik üstüne çıkarınca uyarı kaybolmalı",
        },
      },
      {
        name: "Tükenmiş Ürün",
        fields: {
          İsim: "Tükenmiş Ürün", SKU: "TST-T-001",
          Fiyat: "100₺", Stok: "0", KritikEşik: "5",
          Test: "'Sepete Ekle' butonu devre dışı olmalı",
        },
      },
      {
        name: "Öne Çıkan Ürün",
        fields: {
          İsim: "Öne Çıkan Test Ürünü", SKU: "TST-F-001",
          IsFeatured: "true", Fiyat: "299₺",
          Test: "Ana sayfada 'Öne Çıkan Ürünler' bölümünde görünmeli",
        },
      },
    ],
  },
  {
    id: "orders",
    label: "Siparişler",
    icon: Database,
    color: "amber",
    items: [
      {
        name: "Bekleyen Sipariş",
        fields: {
          Durum: "1 — Created (Oluşturuldu)", "Sipariş No": "SIP-YYYYMMDD-000001",
          Müşteri: "testmusteri@test.com", Ürün: "Test Ürünü A × 2",
          Toplam: "299.80₺", Test: "Admin sipariş listesinde görünmeli",
        },
      },
      {
        name: "Onaylı → Kargoda",
        fields: {
          "Başlangıç": "PaymentCompleted (3) statüsünde sipariş",
          "Adım 1": "Admin: Durum → Preparing/Hazırlanıyor (4)",
          "Adım 2": "Admin: Durum → Shipped/Kargoya Verildi (5)",
          "Kargo Takip": "Kargo firması + YK-123456789TR",
          Test: "Müşteri hesabım → sipariş takip linki görünmeli",
        },
      },
      {
        name: "İptal Edilmiş",
        fields: {
          Durum: "8 — Cancelled (İptal Edildi)", Neden: "Stok yetersiz",
          Test: "İptal sonrası stok iade edildi mi? (rezerv kaldırıldı mı?)",
        },
      },
      {
        name: "İade Edilmiş",
        fields: {
          Durum: "10 — İade Onaylandı",
          "Adım 1": "Müşteri: Hesabım → İade Talep Et",
          "Adım 2": "Admin: /iade → Talebi Onayla",
          Test: "Sipariş durumu 10'a güncellendi mi?",
        },
      },
      {
        name: "Misafir Siparişi",
        fields: {
          Giriş: "Giriş yapılmadan checkout",
          Adres: "Inline form (ad, soyad, adres, telefon)",
          Test: "/siparis-sorgula ile sipariş no + e-posta ile sorgulanabilmeli",
        },
      },
    ],
  },
  {
    id: "coupons",
    label: "Kuponlar",
    icon: Tag,
    color: "violet",
    items: [
      {
        name: "Yüzdelik İndirim",
        fields: {
          Kod: "TEST20", Tip: "Yüzde (%)", Değer: "20",
          MinSepet: "100₺", Kullanım: "Sınırsız", Durum: "Aktif",
          Test: "200₺ sepete uygulanırsa 40₺ düşmeli",
        },
      },
      {
        name: "Sabit İndirim",
        fields: {
          Kod: "SABIT50", Tip: "Sabit Tutar", Değer: "50₺",
          MinSepet: "200₺", Kullanım: "Sınırsız", Durum: "Aktif",
          Test: "300₺ sepette 250₺ ödemeli",
        },
      },
      {
        name: "Tek Kullanım",
        fields: {
          Kod: "TEKKULLANIM", Tip: "Yüzde", Değer: "30",
          MinSepet: "0₺", Kullanım: "1 kez", Durum: "Aktif",
          Test: "2. kullanımda 'zaten kullanıldı' hatası alınmalı",
        },
      },
      {
        name: "Süresi Dolmuş",
        fields: {
          Kod: "SURELI2024", Tip: "Yüzde", Değer: "15",
          BitisTarihi: "2024-01-01 (geçmiş)", Durum: "Aktif (ama süresi dolmuş)",
          Test: "Uygulamaya çalışınca 'süresi dolmuş' hatası vermeli",
        },
      },
    ],
  },
  {
    id: "seed",
    label: "Seed Endpoint'leri",
    icon: Server,
    color: "amber",
    items: [
      {
        name: "İade Test Verisi",
        fields: {
          Endpoint: "POST /api/admin/seed/returns",
          Yetki: "SuperAdmin",
          Sonuç: "3 adet RefundRequested(9) statüsünde sipariş",
          Kullanım: "TC-RET-01..03 testleri için",
        },
      },
      {
        name: "Fatura Test Verisi",
        fields: {
          Endpoint: "POST /api/admin/seed/invoices",
          Yetki: "SuperAdmin",
          Sonuç: "3 fatura: eArchive+eInvoice, Draft/Pending/Sent statüslerinde",
          Kullanım: "TC-INV-01..04 testleri için",
        },
      },
      {
        name: "Misafir Sipariş Test Verisi",
        fields: {
          Endpoint: "POST /api/admin/seed/guest-orders",
          Yetki: "SuperAdmin",
          Sonuç: "{orderNumber, guestEmail} döndürür",
          "Not": "Session cookie bypass — TC-QUERY-01 API testi için",
          Kullanım: "GET /api/orders/track?orderNumber=...&email=... ile takip et",
        },
      },
    ],
  },
  {
    id: "order_status",
    label: "OrderStatus Enum",
    icon: Database,
    color: "indigo",
    items: [
      {
        name: "Tam Enum Listesi",
        fields: {
          "1 — Created": "Oluşturuldu",
          "2 — PaymentPending": "Ödeme Bekleniyor",
          "3 — PaymentCompleted": "Ödeme Tamamlandı",
          "4 — Preparing": "Hazırlanıyor",
          "5 — Shipped": "Kargoya Verildi",
          "6 — Delivered": "Teslim Edildi",
          "7 — Completed": "Tamamlandı",
          "8 — Cancelled": "İptal Edildi",
          "9 — RefundRequested": "İade Talep Edildi",
          "10 — Refunded": "İade Onaylandı",
          "11 — Failed": "Başarısız",
          "12 — OnHold": "Beklemede (Hold)",
        },
      },
      {
        name: "Geçiş Kuralları",
        fields: {
          "RefundRequested(9) →": "Refunded(10) veya Completed(7)",
          "Reddetme =": "Completed(7)'e geçiş (Cancelled geçişi kapalı — bilinçli tasarım)",
          "İade onaylama =": "Refunded(10)'a geçiş",
          "Ödeme başarısız =": "Failed(11) statüsü",
          "Kargo =": "PaymentCompleted(3) veya Preparing(4) → Shipment oluşturulabilir",
        },
      },
    ],
  },
  {
    id: "scenarios",
    label: "Akış Senaryoları",
    icon: Activity,
    color: "sky",
    items: [
      {
        name: "Tam Sipariş Akışı",
        fields: {
          "1. Kayıt": "Yeni müşteri → /kayit → e-posta doğrula",
          "2. Giriş": "'Beni Hatırla' seçili → token yenileme aktif",
          "3. Katalog": "Ürün ara → filtrele → ürün detayına gir",
          "4. Sepet": "Sepete ekle → kupon uygula (TEST20)",
          "5. Ödeme": "Adres seç/gir → ödeme yöntemini seç → onayla",
          "6. Admin": "Siparişler → bul → Onaylandı → Kargoya Verildi → takip no gir",
          "7. Müşteri": "Hesabım → sipariş detayı → kargo takip linkini doğrula",
        },
      },
      {
        name: "Yorum Moderasyonu",
        fields: {
          "1. Ön koşul": "Müşteri en az 1 teslim edilmiş siparişe sahip",
          "2. Yorum": "Ürün sayfası → Yorum Yaz → puan seç → gönder",
          "3. Admin": "Yorumlar → 'Bekliyor' filtresi → Onayla / Reddet",
          "4. Red": "Red Notu gir → 'Bildir' seçili → Reddet",
          "5. Müşteri": "Ürün sayfasını yenile → yorum görünmeli (onaylı)",
          "6. Yanıt": "Başka kullanıcı 'Yanıtla' → admin yorumlar → yanıt sayısını doğrula",
        },
      },
      {
        name: "Güvenlik: Hesap Kilit",
        fields: {
          "1.": "kilitli@test.com ile art arda 5 yanlış şifre gir",
          "2.": "6. denemede 'Hesabınız kilitlendi' mesajı çıkmalı",
          "3.": "Admin: Hareketler → LoginFailed + AccountLocked kayıtları var mı?",
          "4.": "15 dakika sonra tekrar giriş dene → başarılı olmalı",
        },
      },
      {
        name: "Token Yenileme",
        fields: {
          "1.": "'Beni Hatırla' ile giriş yap",
          "2.": "DevTools → Local Storage → admin_refresh_token kopyala",
          "3.": "jwt.io → token süresini kontrol et (30 gün olmalı)",
          "4.": "Erişim tokeni DevTools'ta geçersiz değerle değiştir",
          "5.": "Admin sayfasını yenile → Network: /api/auth/refresh çağrısı görünmeli",
          "6.": "Hata yoksa interceptor çalışıyor",
        },
      },
      {
        name: "Stok Alarm Akışı",
        fields: {
          "1.": "Stok sayfasından bir ürünün kritik eşiğini mevcut stoktan YÜKSEK yap",
          "2.": "Dashboard → Stok Uyarıları bölümünde ürün görünmeli",
          "3.": "Stok → Güncelle → stoku eşiğin üstüne çıkar",
          "4.": "Dashboard yenile → uyarı kaybolmalı",
          "5.": "Stok → Hareketler sekmesi → hareket kaydı var mı?",
        },
      },
      {
        name: "Misafir + Hesap Açma",
        fields: {
          "1.": "Giriş yapmadan /sepet → ürün ekle",
          "2.": "/odeme → misafir formu doldur → siparişi tamamla",
          "3.": "Başarı sayfasında 'Hesap Oluştur' CTA'ya tıkla",
          "4.": "E-posta + şifre belirle → hesap oluştur",
          "5.": "Giriş yap → Hesabım → sipariş listesinde misafir siparişi görünmeli",
        },
      },
    ],
  },
];

const MODEL_COLOR_HEADER: Record<string, string> = {
  teal:   "bg-teal-50 border-teal-200 text-teal-700",
  indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
  violet: "bg-violet-50 border-violet-200 text-violet-700",
  sky:    "bg-sky-50 border-sky-200 text-sky-700",
  amber:  "bg-amber-50 border-amber-200 text-amber-700",
  slate:  "bg-slate-50 border-slate-200 text-slate-700",
};

// ── Seed Data Tab ─────────────────────────────────────────────────────────

type SeedEntity = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  description: string;
  hint?: string;
  requires?: string;
};

const SEED_ENTITIES: SeedEntity[] = [
  { id: "category",     label: "Kategoriler",  icon: Layers,      color: "teal",   description: "Türkçe rastgele kategori adları ile kök kategoriler oluşturur. Görsel eklenir." },
  { id: "brand",        label: "Markalar",     icon: Tag,         color: "violet", description: "Türkçe marka adları ile yeni marka kayıtları oluşturur. Logo eklenir." },
  { id: "product",      label: "Ürünler",      icon: Package,     color: "blue",   description: "Rastgele fiyat, stok ve SKU ile ürün + stok + görsel oluşturur.", requires: "Kategori", hint: "Önce en az 1 kategori gerekli" },
  { id: "user",         label: "Kullanıcılar", icon: UserPlus,    color: "emerald",description: "Customer rolünde Türkçe ad/soyadlı kullanıcılar oluşturur. Avatar eklenir. Şifre: Test1234!" },
  { id: "order",        label: "Siparişler",   icon: ShoppingBag, color: "orange", description: "Mevcut ürün/kullanıcıları kullanarak farklı statülerde sipariş oluşturur.", requires: "Ürün + Kullanıcı", hint: "Önce ürün ve kullanıcı gerekli" },
  { id: "review",       label: "Yorumlar",     icon: Star,        color: "amber",  description: "Mevcut ürün ve kullanıcılara Türkçe yorumlar ekler.", requires: "Ürün + Kullanıcı", hint: "Önce ürün ve kullanıcı gerekli" },
  { id: "coupon",       label: "Kuponlar",     icon: Ticket,      color: "pink",   description: "Rastgele kod ve indirim değerleriyle test kuponları oluşturur." },
  { id: "announcement", label: "Duyurular",    icon: Megaphone,   color: "sky",    description: "Türkçe duyuru başlıkları, açıklamalar ve medya (görsel/video) ile duyurular oluşturur." },
  { id: "invoice",      label: "Faturalar",    icon: FileText,    color: "indigo", description: "eArchive/eInvoice tipinde test faturaları ve ilişkili sipariş kaydı oluşturur." },
  { id: "return",       label: "İadeler",      icon: RotateCcw,   color: "red",    description: "RefundRequested statüsünde test iade siparişleri oluşturur." },
  { id: "shipment",     label: "Kargolar",     icon: Truck,       color: "teal",   description: "Mevcut siparişler için kargo takip kaydı oluşturur.", requires: "Sipariş", hint: "Önce sipariş gerekli" },
  { id: "payment",      label: "Ödemeler",     icon: CreditCard,  color: "emerald",description: "Mevcut siparişler için ödeme kaydı oluşturur.", requires: "Sipariş", hint: "Önce sipariş gerekli" },
  { id: "campaign",     label: "Kampanyalar",  icon: Gift,        color: "orange", description: "Rastgele başlık, renk şeması ve görsel ile aktif kampanya banner'ları oluşturur." },
  { id: "license",      label: "Lisans Atamaları", icon: KeyRound, color: "indigo", description: "Platform lisans token'ını mevcut admin kullanıcılara atar. Görüntüleme şifresi log'da görünür.", requires: "Admin Kullanıcı", hint: "Önce en az 1 admin kullanıcı ve ECOM_LICENSE gerekli" },
];

const SEED_COLOR: Record<string, { card: string; btn: string; badge: string }> = {
  teal:    { card: "border-teal-200 bg-teal-50/40",    btn: "bg-teal-600 hover:bg-teal-700",    badge: "bg-teal-100 text-teal-700" },
  violet:  { card: "border-violet-200 bg-violet-50/40", btn: "bg-violet-600 hover:bg-violet-700", badge: "bg-violet-100 text-violet-700" },
  blue:    { card: "border-blue-200 bg-blue-50/40",    btn: "bg-blue-600 hover:bg-blue-700",    badge: "bg-blue-100 text-blue-700" },
  emerald: { card: "border-emerald-200 bg-emerald-50/40", btn: "bg-emerald-600 hover:bg-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  orange:  { card: "border-orange-200 bg-orange-50/40", btn: "bg-orange-600 hover:bg-orange-700", badge: "bg-orange-100 text-orange-700" },
  amber:   { card: "border-amber-200 bg-amber-50/40",  btn: "bg-amber-600 hover:bg-amber-700",  badge: "bg-amber-100 text-amber-700" },
  pink:    { card: "border-pink-200 bg-pink-50/40",    btn: "bg-pink-600 hover:bg-pink-700",    badge: "bg-pink-100 text-pink-700" },
  sky:     { card: "border-sky-200 bg-sky-50/40",      btn: "bg-sky-600 hover:bg-sky-700",      badge: "bg-sky-100 text-sky-700" },
  indigo:  { card: "border-indigo-200 bg-indigo-50/40", btn: "bg-indigo-600 hover:bg-indigo-700", badge: "bg-indigo-100 text-indigo-700" },
  red:     { card: "border-red-200 bg-red-50/40",      btn: "bg-red-600 hover:bg-red-700",      badge: "bg-red-100 text-red-700" },
};

type LogEntry = { text: string; type: "info" | "ok" | "error" | "warn" };

function SeedDataTab() {
  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(SEED_ENTITIES.map(e => [e.id, 10]))
  );
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState<Record<string, { done: number; total: number } | null>>({});
  const logRef = useRef<HTMLDivElement>(null);

  function addLog(text: string, type: LogEntry["type"] = "info") {
    setLogs(prev => {
      const next = [...prev, { text, type }];
      return next.slice(-200); // max 200 lines
    });
    setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }), 50);
  }

  async function generate(entity: SeedEntity) {
    const count = counts[entity.id] ?? 10;
    if (count < 1 || count > 500) { addLog(`Geçersiz adet: ${count} (1–500 arası olmalı)`, "warn"); return; }

    setLoading(l => ({ ...l, [entity.id]: true }));
    setProgress(p => ({ ...p, [entity.id]: { done: 0, total: count } }));
    addLog(`▶ ${entity.label} — ${count} kayıt oluşturuluyor...`, "info");

    try {
      const res = await api.post<{ entity: string; created: number; items: { id: string }[] }>(
        "/api/admin/seed/bulk",
        { entity: entity.id, count }
      );
      setProgress(p => ({ ...p, [entity.id]: { done: res.created, total: count } }));
      addLog(`✓ ${entity.label}: ${res.created} kayıt oluşturuldu.`, "ok");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`✗ ${entity.label}: ${msg}`, "error");
      setProgress(p => ({ ...p, [entity.id]: null }));
    } finally {
      setLoading(l => ({ ...l, [entity.id]: false }));
    }
  }

  async function generateAll() {
    for (const entity of SEED_ENTITIES) {
      if (!loading[entity.id]) await generate(entity);
    }
  }

  function clearLogs() { setLogs([]); setProgress({}); }

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3.5 flex items-start gap-3">
        <Factory size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <span className="font-bold">Test Verisi Üretici</span>
          {" — "}Seçtiğiniz varlık türü için belirlediğiniz sayıda <strong>kalıcı</strong> test kaydı oluşturur.
          Oluşturulan veriler silinmez; tüm ekranlarda (Ürünler, Siparişler vb.) görünür ve kullanılabilir.
          <span className="ml-1 text-blue-600 font-medium">Şifre: Test1234!</span>
        </div>
      </div>

      {/* Entity grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {SEED_ENTITIES.map(entity => {
          const colors = SEED_COLOR[entity.color] ?? SEED_COLOR.teal;
          const isLoading = loading[entity.id];
          const prog = progress[entity.id];

          return (
            <div key={entity.id} className={`rounded-2xl border p-4 flex flex-col gap-3 ${colors.card}`}>
              {/* Header */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colors.badge}`}>
                  <entity.icon size={15} />
                </div>
                <span className="font-bold text-sm text-slate-800">{entity.label}</span>
                {entity.requires && (
                  <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {entity.requires}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 leading-relaxed">{entity.description}</p>
              {entity.hint && <p className="text-[11px] text-amber-600 font-medium">⚠ {entity.hint}</p>}

              {/* Count input */}
              <div className="flex items-center gap-2">
                <Hash size={12} className="text-slate-400 shrink-0" />
                <span className="text-xs text-slate-500 shrink-0">Adet:</span>
                <div className="flex items-center gap-1 flex-1">
                  <button
                    onClick={() => setCounts(c => ({ ...c, [entity.id]: Math.max(1, (c[entity.id] ?? 10) - 5) }))}
                    className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center text-xs transition"
                  ><Minus size={10} /></button>
                  <input
                    type="number" min={1} max={500}
                    value={counts[entity.id] ?? 10}
                    onChange={e => setCounts(c => ({ ...c, [entity.id]: Math.max(1, Math.min(500, parseInt(e.target.value) || 1)) }))}
                    className="flex-1 min-w-0 text-center text-sm font-bold border border-slate-200 rounded-lg py-1 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
                  />
                  <button
                    onClick={() => setCounts(c => ({ ...c, [entity.id]: Math.min(500, (c[entity.id] ?? 10) + 5) }))}
                    className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center text-xs transition"
                  >+</button>
                </div>
              </div>

              {/* Progress bar */}
              {prog && (
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${prog.total > 0 ? (prog.done / prog.total) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 text-right">{prog.done}/{prog.total}</p>
                </div>
              )}

              {/* Button */}
              <button
                onClick={() => generate(entity)}
                disabled={isLoading}
                className={`flex items-center justify-center gap-1.5 text-white text-sm font-bold py-2 px-3 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed ${colors.btn}`}
              >
                {isLoading
                  ? <><Loader2 size={14} className="animate-spin" /> Oluşturuluyor...</>
                  : <><Factory size={14} /> {counts[entity.id] ?? 10} Kayıt Oluştur</>
                }
              </button>
            </div>
          );
        })}
      </div>

      {/* All at once */}
      <div className="flex items-center gap-3">
        <button
          onClick={generateAll}
          disabled={Object.values(loading).some(Boolean)}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50 shadow"
        >
          <Factory size={15} />
          Tüm Varlıkları Oluştur
        </button>
        <button onClick={clearLogs} className="text-xs text-slate-400 hover:text-slate-600 transition px-2 py-1.5">
          Logları Temizle
        </button>
      </div>

      {/* Log output */}
      {logs.length > 0 && (
        <div
          ref={logRef}
          className="bg-slate-900 rounded-2xl p-4 font-mono text-xs space-y-1 max-h-64 overflow-y-auto"
        >
          {logs.map((log, i) => (
            <div key={i} className={`flex items-start gap-2 ${
              log.type === "ok" ? "text-emerald-400" :
              log.type === "error" ? "text-red-400" :
              log.type === "warn" ? "text-amber-400" :
              "text-slate-300"
            }`}>
              {log.type === "ok"    && <CheckCircle size={12} className="shrink-0 mt-0.5" />}
              {log.type === "error" && <XCircleIcon size={12} className="shrink-0 mt-0.5" />}
              {log.type === "warn"  && <AlertTriangle size={12} className="shrink-0 mt-0.5" />}
              {log.type === "info"  && <span className="w-3 shrink-0" />}
              <span>{log.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TestModelPanel() {
  const [open, setOpen] = useState(false);
  const [activeModel, setActiveModel] = useState("users");

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-2">
          <Database size={15} className="text-slate-500" />
          <span className="font-semibold text-sm text-slate-800">Test Veri Modeli Referansı</span>
          <span className="text-xs text-slate-400 ml-1">— testlere başlamadan önce bu verileri oluşturun</span>
        </div>
        {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100">
          {/* Sub-tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/60 px-4 gap-1 overflow-x-auto">
            {TEST_MODELS.map(m => (
              <button key={m.id} onClick={() => setActiveModel(m.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap -mb-px ${
                  activeModel === m.id ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}>
                <m.icon size={12} /> {m.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {TEST_MODELS.filter(m => m.id === activeModel).map(model => (
              <div key={model.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {model.items.map((item, i) => (
                  <div key={i} className={`rounded-xl border p-3 text-xs ${MODEL_COLOR_HEADER[model.color] ?? "bg-slate-50 border-slate-200 text-slate-700"}`}>
                    <p className="font-bold mb-2 text-[11px] uppercase tracking-wide opacity-70">{item.name}</p>
                    <dl className="space-y-1">
                      {Object.entries(item.fields).map(([k, v]) => (
                        <div key={k} className="flex items-start gap-1.5">
                          <dt className="font-semibold opacity-60 whitespace-nowrap shrink-0">{k}:</dt>
                          <dd className="font-mono opacity-90 break-all">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type MainTab = "scenarios" | "seed";

export default function TestPage() {
  const [mainTab, setMainTab] = useState<MainTab>("scenarios");
  const [results, setResults] = useState<Record<string, { status: Status; note: string }>>(loadResults);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TEST_GROUPS.map(g => [g.id, g.id === "smoke"]))
  );
  const [running, setRunning] = useState<Set<string>>(new Set());
  const [runningGroup, setRunningGroup] = useState<string | null>(null);
  const [apiResponses, setApiResponses] = useState<Record<string, ApiResponse>>({});
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [runningAll, setRunningAll] = useState(false);

  function setStatus(id: string, status: Status) {
    setResults(prev => {
      const next = { ...prev, [id]: { status, note: prev[id]?.note ?? "" } };
      saveResults(next);
      return next;
    });
  }

  function setNote(id: string, note: string) {
    setResults(prev => {
      const next = { ...prev, [id]: { status: prev[id]?.status ?? "pending", note } };
      saveResults(next);
      return next;
    });
  }

  const runApiTest = useCallback(async (tc: TestCase): Promise<"pass" | "fail"> => {
    if (!tc.apiEndpoint) return "fail";
    setRunning(prev => new Set(prev).add(tc.id));
    const start = Date.now();
    try {
      let data: unknown;
      if (tc.apiMethod === "POST") data = await api.post(tc.apiEndpoint, tc.apiBody);
      else data = await api.get(tc.apiEndpoint);
      const ms = Date.now() - start;
      setApiResponses(prev => ({ ...prev, [tc.id]: { ok: true, data, ms } }));
      setStatus(tc.id, "pass");
      return "pass";
    } catch (e) {
      const ms = Date.now() - start;
      const msg = e instanceof Error ? e.message : String(e);
      // 401/403 for security tests where we expect failure = still "pass"
      const isExpectedFail = tc.id === "api_login_fail" || tc.id === "api_refresh";
      setApiResponses(prev => ({ ...prev, [tc.id]: { ok: isExpectedFail, error: msg, ms } }));
      setStatus(tc.id, isExpectedFail ? "pass" : "fail");
      if (!isExpectedFail) setNote(tc.id, msg);
      return isExpectedFail ? "pass" : "fail";
    } finally {
      setRunning(prev => { const n = new Set(prev); n.delete(tc.id); return n; });
    }
  }, []);

  const runGroupApiTests = useCallback(async (group: TestGroup) => {
    const apiCases = group.cases.filter(c => c.apiEndpoint);
    if (apiCases.length === 0) return;
    setRunningGroup(group.id);
    setExpanded(prev => ({ ...prev, [group.id]: true }));
    for (const tc of apiCases) { await runApiTest(tc); }
    setRunningGroup(null);
  }, [runApiTest]);

  const runAllApiTests = useCallback(async () => {
    setRunningAll(true);
    for (const group of TEST_GROUPS) { await runGroupApiTests(group); }
    setRunningAll(false);
  }, [runGroupApiTests]);

  function resetAll() { setResults({}); setApiResponses({}); saveResults({}); }
  function resetGroup(groupId: string) {
    const ids = TEST_GROUPS.find(g => g.id === groupId)?.cases.map(c => c.id) ?? [];
    setResults(prev => {
      const next = { ...prev };
      ids.forEach(id => delete next[id]);
      saveResults(next);
      return next;
    });
  }

  const allCases = TEST_GROUPS.flatMap(g => g.cases);
  const passCount  = allCases.filter(c => results[c.id]?.status === "pass").length;
  const failCount  = allCases.filter(c => results[c.id]?.status === "fail").length;
  const skipCount  = allCases.filter(c => results[c.id]?.status === "skip").length;
  const pendCount  = allCases.length - passCount - failCount - skipCount;
  const total      = allCases.length;
  const pct        = total > 0 ? Math.round((passCount / total) * 100) : 0;

  const allApiCases = allCases.filter(c => c.apiEndpoint);
  const isAnyRunning = running.size > 0 || runningGroup !== null || runningAll;

  const filteredGroups = useMemo(() => {
    return TEST_GROUPS.map(group => {
      let cases = group.cases;
      if (search.trim()) {
        const q = search.toLowerCase();
        cases = cases.filter(c => c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
      }
      if (filter === "pass")    cases = cases.filter(c => results[c.id]?.status === "pass");
      if (filter === "fail")    cases = cases.filter(c => results[c.id]?.status === "fail");
      if (filter === "pending") cases = cases.filter(c => !results[c.id] || results[c.id]?.status === "pending");
      return { ...group, cases };
    }).filter(g => g.cases.length > 0);
  }, [filter, search, results]);

  return (
    <div className="space-y-5 max-w-5xl">

      {/* ── Header ── */}
      <div className="rounded-2xl overflow-hidden shadow-sm bg-gradient-to-br from-violet-900 via-violet-800 to-indigo-800">
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <FlaskConical className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white">Test Merkezi</h1>
                <p className="text-violet-300 text-xs mt-0.5">
                  {total} test · {TEST_GROUPS.length} grup · Backend, Frontend ve Güvenlik
                </p>
              </div>
            </div>
            {/* Progress ring */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="relative">
                <ProgressRing pct={pct} size={52} stroke={5} color={pct >= 80 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171"} />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-white">{pct}%</span>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-white text-sm font-bold">{passCount} / {total}</p>
                <p className="text-violet-300 text-xs">test geçti</p>
              </div>
            </div>
          </div>

          {/* Stat pills */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {[
              { label: `${passCount} Geçti`,      cls: "bg-emerald-500/20 text-emerald-200" },
              { label: `${failCount} Başarısız`,   cls: "bg-red-500/20 text-red-200" },
              { label: `${skipCount} Atlandı`,     cls: "bg-slate-500/20 text-slate-300" },
              { label: `${pendCount} Bekliyor`,    cls: "bg-white/10 text-white/60" },
            ].map(s => (
              <span key={s.label} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              onClick={runAllApiTests}
              disabled={isAnyRunning}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold px-4 py-2 rounded-xl transition disabled:opacity-50 shadow"
            >
              {runningAll
                ? <><RefreshCw size={14} className="animate-spin" /> Çalışıyor...</>
                : <><Play size={14} /> Tüm API Testlerini Çalıştır ({allApiCases.length})</>
              }
            </button>
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-3 py-2 rounded-xl transition"
            >
              <RotateCcw size={13} /> Tümünü Sıfırla
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Tab Switcher ── */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1 self-start w-fit shadow-sm">
        <button
          onClick={() => setMainTab("scenarios")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            mainTab === "scenarios" ? "bg-violet-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <FlaskConical size={14} /> Test Senaryoları
        </button>
        <button
          onClick={() => setMainTab("seed")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            mainTab === "seed" ? "bg-teal-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Factory size={14} /> Test Verisi Üret
        </button>
      </div>

      {/* ── Seed Data Tab ── */}
      {mainTab === "seed" && <SeedDataTab />}

      {/* ── Scenarios Tab ── */}
      {mainTab === "scenarios" && <>

      {/* ── Test Model Reference ── */}
      <TestModelPanel />

      {/* ── Filter & Search ── */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden text-sm shrink-0">
          {([
            { key: "all",     label: `Tümü (${total})` },
            { key: "pending", label: `Bekliyor (${pendCount})` },
            { key: "fail",    label: `Başarısız (${failCount})` },
            { key: "pass",    label: `Geçti (${passCount})` },
          ] as { key: FilterTab; label: string }[]).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3.5 py-2 font-medium transition ${
                filter === f.key
                  ? f.key === "fail" ? "bg-red-500 text-white" : f.key === "pass" ? "bg-emerald-500 text-white" : "bg-violet-600 text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Test ara..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 transition">
              <XCircle size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Test Groups ── */}
      {filteredGroups.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <Search size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sonuç bulunamadı</p>
        </div>
      )}

      {/* filteredGroups rendered below — inside scenarios tab */}
      {filteredGroups.map(group => {
        const allGroupCases = TEST_GROUPS.find(g => g.id === group.id)!.cases;
        const gPass     = allGroupCases.filter(c => results[c.id]?.status === "pass").length;
        const gFail     = allGroupCases.filter(c => results[c.id]?.status === "fail").length;
        const gTotal    = allGroupCases.length;
        const gPct      = gTotal > 0 ? Math.round((gPass / gTotal) * 100) : 0;
        const hasApi    = group.cases.some(c => c.apiEndpoint);
        const isRunning = runningGroup === group.id;
        const progressColor = gFail > 0 ? "#ef4444" : gPct >= 80 ? "#10b981" : "#f59e0b";

        return (
          <div key={group.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Group header */}
            <div className={`flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 ${COLOR_HEADER[group.color]}`}>
              <button
                onClick={() => setExpanded(e => ({ ...e, [group.id]: !e[group.id] }))}
                className="flex items-center gap-2.5 flex-1 text-left min-w-0"
              >
                {expanded[group.id]
                  ? <ChevronDown size={16} className={`shrink-0 ${COLOR_ICON[group.color]}`} />
                  : <ChevronRight size={16} className={`shrink-0 ${COLOR_ICON[group.color]}`} />}
                <group.icon size={16} className={`shrink-0 ${COLOR_ICON[group.color]}`} />
                <span className={`font-bold text-sm ${COLOR_ICON[group.color]} truncate`}>{group.title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${COLOR_BADGE[group.color]}`}>{group.badge}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                  group.execution === "auto" ? "bg-emerald-100 text-emerald-700" :
                  group.execution === "mixed" ? "bg-blue-100 text-blue-700" :
                  "bg-slate-100 text-slate-500"
                }`}>
                  {group.execution === "auto" ? "🤖 Oto" : group.execution === "mixed" ? "🔀 Karma" : "👁 Manuel"}
                </span>
              </button>

              {/* Progress + actions */}
              <div className="flex items-center gap-2.5 shrink-0">
                {/* Mini progress bar */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${gPct}%`, backgroundColor: progressColor }} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 tabular-nums w-8 text-right">{gPass}/{gTotal}</span>
                </div>
                {gFail > 0 && (
                  <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">{gFail} ✗</span>
                )}
                {hasApi && (
                  <button
                    onClick={() => runGroupApiTests(group)}
                    disabled={isAnyRunning}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    {isRunning
                      ? <><RefreshCw size={10} className="animate-spin" /> Çalışıyor</>
                      : <><Play size={10} /> API Çalıştır</>}
                  </button>
                )}
                <button onClick={() => resetGroup(group.id)} title="Grubu Sıfırla"
                  className={`text-sm hover:opacity-80 transition px-1.5 ${COLOR_ICON[group.color]} opacity-50`}>
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>

            {expanded[group.id] && (
              <>
                {/* Group description */}
                <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100">
                  <p className="text-xs text-slate-600 leading-relaxed">{group.description}</p>
                </div>

                {/* Test cases */}
                <div className="divide-y divide-slate-100">
                  {group.cases.map(tc => {
                    const res = results[tc.id];
                    const status = res?.status ?? "pending";
                    const isTcRunning = running.has(tc.id);
                    const apiRes = apiResponses[tc.id];
                    const p = tc.priority ? PRIORITY_LABEL[tc.priority] : null;

                    return (
                      <div key={tc.id} className={`px-5 py-3.5 transition-colors ${
                        status === "fail" ? "bg-red-50/60" :
                        status === "pass" ? "bg-emerald-50/30" : ""
                      }`}>
                        <div className="flex items-start gap-3">
                          {/* Status icon */}
                          <div className="mt-0.5 shrink-0">
                            {isTcRunning
                              ? <RefreshCw size={18} className="text-sky-500 animate-spin" />
                              : status === "pass"    ? <CheckCircle2 size={18} className="text-emerald-500" />
                              : status === "fail"    ? <XCircle size={18} className="text-red-500" />
                              : status === "skip"    ? <AlertTriangle size={18} className="text-slate-400" />
                              : <Circle size={18} className="text-slate-300" />}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-slate-800">{tc.label}</span>
                              {p && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.cls}`}>{p.label}</span>
                              )}
                              {tc.url && (
                                <a href={tc.url} target="_blank" rel="noreferrer"
                                  className="flex items-center gap-0.5 text-xs text-teal-600 hover:text-teal-700 hover:underline font-medium">
                                  <ExternalLink size={11} /> Aç
                                </a>
                              )}
                              {tc.apiEndpoint && (
                                <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                                  {tc.apiMethod} {tc.apiEndpoint}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{tc.description}</p>

                            {/* Steps */}
                            {tc.steps && tc.steps.length > 0 && (
                              <ol className="mt-2 space-y-1">
                                {tc.steps.map((step, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs text-indigo-700">
                                    <span className="shrink-0 w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold mt-0.5">{i + 1}</span>
                                    <span className="leading-relaxed">{step}</span>
                                  </li>
                                ))}
                              </ol>
                            )}

                            {/* API response */}
                            {apiRes && (
                              <div className={`mt-2 rounded-xl px-3 py-2 text-xs font-mono border ${
                                apiRes.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-700"
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`font-bold ${apiRes.ok ? "text-emerald-700" : "text-red-600"}`}>
                                    {apiRes.ok ? "✓ Başarılı" : "✗ Hata"}
                                  </span>
                                  <span className="text-slate-400">{apiRes.ms}ms</span>
                                </div>
                                {apiRes.error && <p className="break-all text-red-600">{apiRes.error}</p>}
                                {apiRes.data !== undefined && (
                                  <p className="text-slate-600 truncate">
                                    {(() => {
                                      const s = JSON.stringify(apiRes.data);
                                      return s.slice(0, 120) + (s.length > 120 ? "…" : "");
                                    })()}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Note */}
                            <input
                              type="text"
                              placeholder="Not ekle (opsiyonel)..."
                              value={res?.note ?? ""}
                              onChange={e => setNote(tc.id, e.target.value)}
                              className="mt-2 w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-300 placeholder-slate-300"
                            />
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-col gap-1.5 shrink-0">
                            {tc.apiEndpoint && (
                              <button
                                onClick={() => runApiTest(tc)}
                                disabled={isTcRunning || isAnyRunning}
                                className="flex items-center justify-center gap-1 text-xs bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-2.5 py-1.5 rounded-lg font-medium transition disabled:opacity-50 whitespace-nowrap"
                              >
                                {isTcRunning ? <RefreshCw size={10} className="animate-spin" /> : <Play size={10} />}
                                {isTcRunning ? "..." : "Test Et"}
                              </button>
                            )}
                            <button
                              onClick={() => setStatus(tc.id, status === "pass" ? "pending" : "pass")}
                              className={`flex items-center justify-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${
                                status === "pass"
                                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                              }`}>
                              <CheckCircle2 size={10} /> Geçti
                            </button>
                            <button
                              onClick={() => setStatus(tc.id, status === "fail" ? "pending" : "fail")}
                              className={`flex items-center justify-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${
                                status === "fail"
                                  ? "bg-red-500 text-white hover:bg-red-600"
                                  : "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                              }`}>
                              <XCircle size={10} /> Başarısız
                            </button>
                            <button
                              onClick={() => setStatus(tc.id, status === "skip" ? "pending" : "skip")}
                              className={`flex items-center justify-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${
                                status === "skip"
                                  ? "bg-slate-400 text-white"
                                  : "bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200"
                              }`}>
                              <AlertTriangle size={10} /> Atla
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })}

      </> /* end scenarios tab */}
    </div>
  );
}
