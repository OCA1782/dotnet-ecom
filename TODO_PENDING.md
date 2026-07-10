# TODO Pending

> Son güncelleme: 11.07.2026 03:00 UTC

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

### ✅ Admin Ürünler Ekranı — Toplu İşlemler (2026-07-11 — TAMAMLANDI)

| Görev | Durum |
|---|---|
| Mükerrer ürünler paneli — "Tümünü Seç" butonu | ✅ |
| Mükerrer ürünler paneli — "Tüm Kopyaları Sil" (onay modalı + dry-run) | ✅ |
| Toplu stok güncelle — "% Oran" modu eklendi | ✅ |
| `POST /api/admin/stocks/bulk-adjust-by-percentage` endpoint | ✅ |
| Arama textbox: kategori adı + kaynak (DataSource) alanı eklendi | ✅ |
| Kaynak (DataSource) combobox kaldırıldı — search'e entegre edildi | ✅ |

### ✅ Dış Kaynaklar — Fetch Limiti & Kod Badge (2026-07-11 — TAMAMLANDI)

| Görev | Durum |
|---|---|
| Kaynak kodu badge: `code=NULL` olunca `REST-N` / `XLS-N` fallback gösteriliyor | ✅ |
| REST/Excel fetch — 200-sayfa (~20K satır) limiti kaldırıldı, tüm sayfa döngüsü geçerli | ✅ |
| "Tümünü Aktar" — fetch limiti kalktığından tüm veri preview'dan aktarılıyor | ✅ |

### ✅ Admin Ürünler — Tüm Listeyi Kalıcı Sil (2026-07-11 — TAMAMLANDI)

| Görev | Durum |
|---|---|
| `DELETE /api/products/purge-all?dryRun=true\|false` endpoint (SuperAdmin) | ✅ |
| 3 adımlı onay akışı: ön uyarı → ikinci onay → "SİL" yazma doğrulaması | ✅ |
| UI: "Tümünü Temizle" butonu üst action bar'da | ✅ |

### ✅ Dış Kaynaklar — Aktarılmış/Aktarılmamış Canlı Takip (2026-07-11 — TAMAMLANDI)

| Görev | Durum |
|---|---|
| 15 saniyede bir otomatik importedSet yenileme (expanded kaynak için) | ✅ |
| BroadcastChannel `ecom-product-changed` — dis-kaynaklar dinler, anında yeniler | ✅ |
| Import (chunked + async job) tamamlandığında importedSet otomatik güncellenir | ✅ |
| Ürünler toplu sil/dedup/purge → broadcast tetikler, dis-kaynaklar eş zamanlı yenilenir | ✅ |
| save-preview limit 50MB → 200MB artırıldı (büyük REST kaynaklar için) | ✅ |

### ✅ Admin Ürünler — Tüm Sütunlara Göre Arama (2026-07-11 — TAMAMLANDI)

| Görev | Durum |
|---|---|
| "Oluşturan" (createdByAdminEmail) — pre-fetch user IDs + IN clause | ✅ |
| "Kaynak" ImportedFromSourceName — pre-fetch ExternalSource IDs + IN clause | ✅ |
| Tüm sütunlar aranabilir: Ad, SKU, Kategori, Marka, Kaynak, DataSource, Oluşturan | ✅ |

### 📋 Kalan Görevler

- [ ] Composite index: `Products(IsDeleted, CategoryId, Price)` — filtreli ürün listesi (henüz bekleniyor)
- [ ] SlowQueryInterceptor log analizi — 500ms+ sorgular tespit ve optimize
- [ ] `GetProductsQuery` — search COUNT büyük sonuç setlerinde (~9K) yaklaşık sayım seçeneği

## Not

- Bu dosya `AdminLintAuditJob` tarafından güncellenir.
- İlerleme, her dosya düzeltildikten sonra yeni lint koşusuyla yeniden değerlendirilmelidir.
