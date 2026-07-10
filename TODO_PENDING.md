# TODO Pending

> Son güncelleme: 10.07.2026 20:05 UTC

## Özet

| Alan | Değer |
| --- | ---: |
| Toplam uyarı | 0 |
| Toplam hata | 0 |
| Etkilenen dosya | 0 |
| Komut | `frontend/admin/node_modules/.bin/eslint src --format json` |

## Öncelikli Aksiyonlar

### ✅ PostgreSQL Performans İyileştirmeleri (2026-07-10 — TAMAMLANDI)

**Karar:** PostgreSQL birincil DB. SQL Server yedek konumda kalır.

| Görev | Durum | Sonuç |
|---|---|---|
| `pg_trgm` extension + GIN partial index on Name | ✅ | ILIKE araması çalışıyor (case-insensitive) |
| Covering sort index `(IsDeleted, IsActive, IsPublished, CreatedDate DESC)` | ✅ | No-filter liste: 4s → 26ms |
| Partial index `Products(VehicleModel) WHERE VehicleModel IS NOT NULL` | ✅ | VehicleModel sorgusu: 0.46s → 79ms |
| `IX_Products_ImportedFromSourceId` index | ✅ | Admin kaynak filtresi |
| EF Core `AsNoTracking()` — GET sorgulara eklendi | ✅ | GetProductsQuery, GetSearchSuggestionsQuery, GetVehicleCategoriesQuery |
| `Turkish_CI_AS` Collate → `ILike` (PostgreSQL uyumu) | ✅ | GetVehicleCategoriesQuery, GetSearchSuggestionsQuery |
| `EF.Functions.Like` → `ILike` — tüm arama sorgularında | ✅ | GetProductsQuery (search + vehicleModel tier1+tier2) |
| PostgreSQL `work_mem=64MB` + `shared_buffers=1GB` Docker config | ✅ | Warm query: 997ms → 35ms |
| `random_page_cost=1.1` + `effective_io_concurrency=200` (SSD ayarı) | ✅ | Bitmap scan tercihi iyileşti |
| Brand search JOIN → pre-fetch + IN clause | ✅ | GIN index aktif, OR join kaldırıldı |

**Performans Özeti (126K ürün, PostgreSQL):**

| Sorgu | Öncesi | Sonrası |
|---|---|---|
| No-filter liste (warm) | 4.01s | 26ms (154x) |
| Arama 'mercedes' (BOZUKTU) | 0 sonuç | 9100 sonuç, 123ms |
| VehicleModel 'C Serisi W204' | 460ms | 79ms (6x) |
| Öne çıkan ürünler | 180ms | 25ms (7x) |
| Arama önerileri | — | 70ms |

### ✅ Mükerrer Ürün Temizliği (2026-07-10 — TAMAMLANDI)

**Kriter:** Aynı `Name` + `DataSource` kombinasyonu → en eski kayıt korundu, geri kalanlar soft-delete

| DB | Öncesi | Sonrası | Silinen |
|---|---|---|---|
| PostgreSQL | 111,866 | 68,361 | 43,505 |
| SQL Server (LocalDB) | 111,866 | 68,361 | 43,505 |

- `POST /api/products/deduplicate?dryRun=true|false` endpoint eklendi (SuperAdmin)
- ROW_NUMBER() OVER PARTITION BY Name, DataSource — en eski `CreatedDate ASC` korunuyor
- Her iki DB'de IDENTICAL temizlik (aynı import dataseti)

### 📋 Kalan Görevler

- [ ] Composite index: `Products(IsDeleted, CategoryId, Price)` — filtreli ürün listesi (henüz bekleniyor)
- [ ] SlowQueryInterceptor log analizi — 500ms+ sorgular tespit ve optimize
- [ ] `GetProductsQuery` — search COUNT büyük sonuç setlerinde (~9K) yaklaşık sayım seçeneği

## Not

- Bu dosya `AdminLintAuditJob` tarafından güncellenir.
- İlerleme, her dosya düzeltildikten sonra yeni lint koşusuyla yeniden değerlendirilmelidir.
