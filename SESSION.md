# Session Log

## 2026-06-12 — Adım 89 (Tamamlandı)

Tamamlanan çalışmalar → `TODO_DONE.md`

---

## 2026-06-12 — Adım 90 (Aktif)

### Görevler

1. **Keyvora temizliği** — Logo, isim, detay bilgi vs. ne varsa tamamen kaldır.
2. **Kaynak kodu tam audit** — Baştan sona tara; hata, eksik, tutarsızlık varsa gider.

### Keyvora Tarama

- [ ] Backend (C#) — tüm .cs dosyaları
- [ ] Frontend Admin — .tsx/.ts/.json
- [ ] Frontend Customer — .tsx/.ts/.json
- [ ] Config dosyaları — appsettings, docker-compose, .env örnek
- [ ] Docs — Ecom repo içindeki markdown'lar

### Kaynak Kodu Audit

- [ ] Backend build — warning/error
- [ ] Frontend Admin lint + build
- [ ] Frontend Customer lint + build
- [ ] Backend — eksik null check, unused import vs.
- [ ] Frontend — konsol hataları, dead code, tip uyumsuzluğu

### Bulgular & Yapılanlar

**Keyvora:** Temiz — SESSION.md dışında hiçbir yerde referans yok.

**Backend:**
- `PaymentCallbackCommand.cs` — `paymentService` unused param, `#pragma warning disable CS9113` ile işaretlendi (Iyzico için reserved)
- `DeployService.cs:241,268` — `.Result` SSH.NET property, Task değil — gerçek bug yok
- `CS9113/NU1510` — tek gerçek uyarılar, biri çözüldü

**Frontend Admin:**
- `dokuman/page.tsx:1509` — `setSelected` useEffect içinde senkron çağrı → `window.setTimeout(..., 0)` ile sarıldı (lint fix)
- `NotificationsPanel.tsx` — `useI18n` hook'u eklendi, hardcoded Türkçe metinler i18n'e bağlandı
- `SessionTimeoutWarning.tsx` — `useI18n` hook'u eklendi, session timeout metinleri i18n'e bağlandı
- `i18n.ts TR` — `notifications.*`, `session.*`, `timeAgo.*` + 300+ `auto.*` TR key'leri eklendi
- `auto.*` EN/DE/ES key'leri: job'lara bırakıldı (kullanıcı talebi)

### i18n Job İzolasyon Mimarisi (KRİTİK KURAL)

**Karar:** i18n job'ları hiçbir zaman doğrudan kaynak dosyalara yazamaz.

**Neden:** `i18n.ts` veya `.tsx` dosyalarında anlık değişiklik → Turbopack HMR tetiklenir → stale module state → login ekranı dahil tüm sayfalar sürekli refresh döngüsüne girer. Bu, aktif geliştirmeyi tamamen engeller.

**Mimari:**
```
Job çalışır
  → Değişikler DB'ye / pending JSON'a yazılır (AllowSourceMutation=false)
  → Hiçbir .ts/.tsx dosyasına dokunulmaz
  → Zamanlanmış iş saatinde (geceleri / off-hours) → değişikler uygulanır
  → Veya kullanıcı admin panelinden manuel tetikler
```

**HMR Kontrolü:**
- Geliştirme sırasında `next.config.ts` içinde `watchOptions.ignored` ile i18n output dosyaları HMR'dan dışlanabilir
- `AllowSourceMutation=false` (mevcut) bu güvenceyi sağlar — DEĞİŞTİRME
- Büyük toplu i18n yazımları → dev sunucu kapatılarak yapılmalı, sonra yeniden başlatılmalı

**İlgili Ayarlar (SiteSettings):**
- `I18nJob:AllowSourceMutation` → her zaman `false` kalacak (dev ortamında)
- `I18nJob:EnableAutoRun` → `false`
- `I18nJob:TriggerBuilderFromScanner` → `false`

---

### Admin Panel Infinite Refresh — Kök Neden & Çözüm

**Kök neden:** `i18n.ts`'e 600+ satır tek seferde eklendi → Turbopack HMR stale module state → `AdminLoginForm.tsx` module factory bulunamadı → sonsuz reload.

**Çözüm:** Dev sunucular (PID 16508 ve 24936) kapatıldı, temiz yeniden başlatma yapıldı.

---

### Doğrulama

- `npm run lint` → 0 error, 0 warning ✅
- `dotnet build -c Release --no-restore` → Build succeeded (NU1510 + CS9113 uyarıları mevcut) ✅
- `http://localhost:5124/health` → Healthy ✅
- Admin frontend → http://localhost:3001 ✅ (port sabitlendi: `--port 3001`)
- Customer frontend → http://localhost:3000 ✅ (port sabitlendi: `--port 3000`)
- API → http://localhost:5124 ✅ (PID 3408)

**Not:** `package.json` dev scriptlerine `--port` eklendi — artık portlar deterministik.
