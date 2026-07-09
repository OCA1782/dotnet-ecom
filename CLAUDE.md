# CLAUDE.md — Ecom Proje Kuralları

Bu dosya her session başında otomatik yüklenir. Tüm maddeler ZORUNLUDUR.

---

## 1. Çalışma Başında Protokol

Her session başında şunları yap:

1. `git status` ile mevcut değişiklikleri gör
2. `scripts/smoke-test.sh` çalıştır — baseline'ı belirle (PASS sayısını not et)
3. Hafızayı oku: `C:\Users\fpen\.claude\projects\C--PROJECTS-DOTNET-ECOM\memory\MEMORY.md`
4. TODO_PENDING.md varsa oku

Her değişiklik sonrası `scripts/smoke-test.sh` çalıştır. Commit öncesi tüm testler PASS olmalı.

---

## 2. Korunacak Davranışlar — ASLA BOZMA

Aşağıdaki davranışlar önceki sessiyonlarda kasıtlı olarak eklendi. Değiştirme veya silme.

### A. SparePartsBrandNav (`frontend/customer/src/components/templates/SparePartsBrandNav.tsx`)

| Davranış | Neden |
|---|---|
| `handleModelClick`: `?arac={modelName}&marka={label}` — kategoriler GÖNDERİLMEZ | Araç nav brand UUID'si ürün kategorisi değil (ürünler "Otomotiv > Parça" ağacında); VehicleModel index yeterli |
| `useEffect([isPending])`: isPending=false → `setNavigatingTo(null)` sıfırlanır | Sonsuz overlay hatası önlenir |
| İptal butonu: 2 tıklama onay akışı (İptal Et → Evet, aramayı iptal et) | Yanlışlıkla iptal önlenir |
| Yükleniyor modalı: `${brand.label} ${model.name}` metni | "Mercedes C Serisi W206" formatı |
| `SparePartsBrandNav` layout.tsx'te sticky header içinde | Tüm sayfalarda sabit nav |

### B. urunler/page.tsx (`frontend/customer/src/app/urunler/page.tsx`)

| Davranış | Neden |
|---|---|
| `if (params.arac) qs.set("vehicleModel", ...)` | arac varsa her zaman vehicleModel LIKE gönderilir |
| `params.arac ? getVehicleCategories(...) : []` | arac varsa her zaman araç-özgü kategoriler yüklenir (sidebar) |
| Breadcrumb: `Anasayfa / {marka} / {arac}` | params.marka varsa marka segmenti |
| `marka?: string` SearchParams tipinde | URL'den marka etiketi taşınır |
| `export const dynamic = "force-dynamic"` | Settings her render'da fresh gelir |

### C. GetProductsQuery (`backend/src/Ecom.Application/Features/Products/Queries/GetProductsQuery.cs`)

| Davranış | Neden |
|---|---|
| VehicleModel arama — SEQUENTIAL iki aşamalı: önce `CountAsync` (index seek), eğer > 0 → sadece `VehicleModel LIKE` kullan, aksi halde Name LIKE fallback | OR birleştirme yerine sıralı → 74K satır taramasından kaçınır |
| `StripGenerationCode`: "A Serisi W176" → "A Serisi" | "A Serisi W176%" ve "A Serisi%" her iki prefix de aranır |
| CategoryId BFS traverse | Alt kategorileri de kapsar |

### D. layout.tsx (`frontend/customer/src/app/layout.tsx`)

| Davranış | Neden |
|---|---|
| `SparePartsBrandNav initialBrands={[]}` sticky header içinde | SSR'da brand fetch yok (client-side lazy) |
| `getVehicleNavBrands()` layout SSR'da YOK | Her sayfa yükünde blok istek önlenir |

### E. DB State

| Davranış | Neden |
|---|---|
| 8 ürün `IsFeatured=1` | Homepage "Öne Çıkan Ürünler" bölümü |
| `IX_Products_Name` index (SQL Server) | Name prefix LIKE hızı |
| `IX_Products_VehicleModel` index (migration: AddProductVehicleModel) | VehicleModel LIKE hızı — 25K+ ürün indexed |
| SKU nullable | `IsRequired(false)` — import uyumluluğu |
| ~25K ürün VehicleModel doldurulmuş (Phase 1: prefix match, Phase 2: chassis code) | `scripts/backfill-vehicle-model.ps1` ile yeni ürünler için çalıştırılabilir |

---

## 3. Değişiklik Kuralları

- Bir dosyayı düzenlemeden önce **mutlaka oku** (Read tool)
- Mevcut import'ları, state'leri veya JSX bloklarını kaldırmadan önce başka bir yerde kullanılıp kullanılmadığını kontrol et
- `page.tsx` dosyalarına `force-dynamic` eklemeyi unutma (özellikle `getSettings()` çağrısı olanlar)
- EF Core: `ProductConfiguration`'a `HasIndex()` ekleme — migration gerektirir, başlatma hatasına yol açar
- TypeScript: her değişiklik sonrası `npx tsc --noEmit` temiz çıktı vermeli

---

## 4. Session Sonu Protokol

1. `scripts/smoke-test.sh` — tüm PASS
2. `npx tsc --noEmit` (frontend/customer ve frontend/admin)
3. `dotnet build` (backend)
4. Commit (conventional format, Claude referansı yasak)
5. `C:/PROJECTS/DOTNET/dotnet-ecom-docs` güncelle ve push
6. `git push origin main` (ecom repo)

---

## 5. Port & Servis Bilgileri

| Servis | Port |
|---|---|
| Customer frontend | 3000 |
| Admin frontend | 3001 |
| Backend API | 5124 |
| DB | SQL Server local |

Backend başlatma: `dotnet run --project backend/src/Ecom.API/Ecom.API.csproj`
