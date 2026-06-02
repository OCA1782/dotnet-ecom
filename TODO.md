# Ecom Platform — TODO

Son güncelleme: 2026-05-22 (v3)

---

## ✅ Tamamlananlar (Bu Session)

- [x] **BUG FIX** — Satır bazlı geçmiş: EntityName filtresi `Contains` → `==` (tam eşleşme)
- [x] **BUG FIX** — Admin > Stok satır geçmişi: client-side filtre kaldırıldı, `productId` backend'e parametre olarak gönderildi
- [x] **BUG FIX** — EntityName tutarsızlığı düzeltildi: command handler'lar artık AuditFilter ile aynı Türkçe isimleri kullanıyor (Kategori/Marka/Kullanıcı)

- [x] Admin > Yorumlar > Hareketler tab (ApproveReview + DeleteReview audit log)
- [x] Admin > Kullanıcılar > Hareketler tab (CreateUser/UpdateUser/DeleteUser/Activate/Deactivate audit log)
- [x] Admin > Siparişler > Hareketler tab (DurumGüncellendi + AdresGüncellendi audit log)
- [x] Backend: UpdateOrderStatusCommand → IAuditService LogAsync
- [x] Backend: UpdateOrderAddressCommand → IAuditService LogAsync
- [x] Backend: GetAuditLogsQuery → EntityId filtre parametresi
- [x] Customer > Ödeme sayfası tam yeniden yazım (fatura adresi, ödeme yöntemleri)
- [x] Customer > Sipariş detay → adres bölümü, iptal modal
- [x] Admin > Sipariş detay → adres bölümü düzeltme

- [x] Admin > Kullanıcılar: Hareketler tab kaldırıldı (zaten yok), satır bazlı Geçmiş butonu eklendi
- [x] Admin > Kullanıcılar: Düzenleme modalında e-posta ve cep telefonu alanları mevcut
- [x] Admin > Yorumlar: Hareketler tab kaldırıldı (zaten yok), satır bazlı Geçmiş butonu eklendi
- [x] Admin > Kategoriler: Satır bazlı Geçmiş butonu + backend audit log (entityName=Kategori)
- [x] Admin > Markalar: Satır bazlı Geçmiş butonu + backend audit log (entityName=Marka)
- [x] Admin > Stok: Satır bazlı Geçmiş butonu (productId server-side filtre)
- [x] Admin > Kuponlar: Satır bazlı kullanım geçmişi + Tüm Hareketler sekmesi

---

## 🔴 Öncelikli (Aktif)

### 16 — Adım 47 ✅ (2026-06-02)
- [x] Admin > Dashboard: 13 modül için yeni istatistik kartları (GET /api/admin/dashboard/modules)
- [x] Admin > Jobs: ModuleHealthCheckJob — saatlik çalışır, sorun varsa uyarı maili gönderir
- [x] Admin > Yönetim > Bildirimler sekmesi — yetkili mail adresleri yönetimi, test butonu
- [x] Admin > Yönetim > Şablon: kontrast önizlemesi — bg/text renk çakışmasında uyarı
- [x] Admin > Deploy > Geçmiş: pagination bar her zaman görünür (logTotal > 0 koşulu)
- [x] IEmailService.SendAlertAsync — çoklu alıcıya uyarı maili
- [x] DbInitializer.EnsureAlertSettings — Alert:Enabled + Alert:Emails seed

### 9 — Admin > Stok
- [ ] Satır bazlı audit log geçmişi (stok hareketine ek olarak audit log da göster)

### 10 — Admin > İadeler ✅ (Adım 46)
- [x] Örnek iade kayıtları oluştur (seed: DataSource=test, benzersiz sipariş no)
- [x] İade onay / ret akışının tam çalıştığını doğrula (approve→Refunded, reject→Completed)
- [x] Silme işlemi korunacak (DeleteOrderCommand: RefundRequested silinemez)
- [x] Red modalına not alanı eklendi (UX iyileştirme)

### 11 — Admin > Dış Kaynaklar
- [ ] Test: REST servisten veri çek ve listede göster
- [ ] Test: Excel dosyasından veri çek ve listede göster
- [ ] İçe al butonu: alınan veriyi Marka / Kategori / Ürün / Stok olarak import et

### 12 — Admin > Faturalar ✅ (Adım 46)
- [x] Örnek fatura oluştur (sipariş bazlı mock: seed + manuel oluşturma)
- [x] Fatura listeleme, detay, durum güncelleme akışını doğrula (Draft/Pending/Sent/Cancelled)
- [x] Silme korunacak (fatura delete endpoint yok; iptal edimiş fatura güncellenemez)
- [x] "Fatura Oluştur" modalı: UUID yerine sipariş numarası ile arama
- [x] Sort: Tutar / Tarih / Kaynak sütun sıralaması

### 13 — Admin > Kuponlar
- [x] Tüm kupon hareketlerini gösteren genel görünüm
- [x] Satır bazlı kupon geçmiş modalı

### 14 — Tüm Ekranlar Listesi (ALL_PAGES.md)
- [x] Customer ve Admin tüm ekranları eksiksiz listele
- [x] DOCS repo'suna (dotnet-ecom-docs) ALL_PAGES.md olarak kaydet

### 15 — Test Senaryoları (TEST_SCENARIO.md)
- [x] ALL_PAGES.md baz alınarak kapsamlı test senaryoları çıkar
- [x] DOCS repo'suna TEST_SCENARIO.md olarak kaydet

---

## 🟡 Orta Öncelik

- [ ] İyzico sandbox test (ngrok + ApiKey/SecretKey credentials gerektirir)
- [ ] Admin > Siparişler > Hareketler tabı — DurumGüncellendi/AdresGüncellendi şu an boş çünkü geçmiş veri yok; yeni işlemlerden sonra dolacak
