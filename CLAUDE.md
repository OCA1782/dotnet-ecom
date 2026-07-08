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
| `handleModelClick`: model.id varsa `?kategoriler={uuid}&arac={name}&marka={label}` | 16s → 0.3s performans (48×) |
| `useEffect([isPending])`: isPending=false → `setNavigatingTo(null)` sıfırlanır | Sonsuz overlay hatası önlenir |
| 4-tıklama overlay iptali: `cancelClickCount >= 4` → "Aramadan çıkıldı" + router.push("/") | Kullanıcı isteği |
| Yükleniyor modalı: `${brand.label} ${model.name}` metni | "Mercedes C Serisi W206" formatı |
| `SparePartsBrandNav` layout.tsx'te sticky header içinde | Tüm sayfalarda sabit nav |

### B. urunler/page.tsx (`frontend/customer/src/app/urunler/page.tsx`)

| Davranış | Neden |
|---|---|
| `if (params.arac && !params.kategoriler) qs.set("vehicleModel", ...)` | kategoriler varsa LIKE skip edilir |
| `params.arac && !params.kategoriler ? getVehicleCategories(...) : []` | kategoriler varsa API çağrısı skip |
| Breadcrumb: `Anasayfa / {marka} / {arac}` | params.marka varsa marka segmenti |
| `marka?: string` SearchParams tipinde | URL'den marka etiketi taşınır |
| `export const dynamic = "force-dynamic"` | Settings her render'da fresh gelir |

### C. GetProductsQuery (`backend/src/Ecom.Application/Features/Products/Queries/GetProductsQuery.cs`)

| Davranış | Neden |
|---|---|
| VehicleModel: `p.Name.StartsWith(vm + " ")` vb. | Index kullanabilir LIKE pattern |
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
| `IX_Products_Name` index (SQL Server) | VehicleModel LIKE hızı |
| SKU nullable | `IsRequired(false)` — import uyumluluğu |

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
