# TODO Pending

> Son güncelleme: 11.07.2026 04:00 UTC

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

### ✅ Dış Kaynaklar — Fetch Düzeltmeleri & Sayfalı Çek (2026-07-11 — TAMAMLANDI)

| Görev | Durum |
|---|---|
| "Tümünü Çek" butonu (eski Veri Çek) — tüm sayfaları sırayla çeker | ✅ |
| "Sayfalı Çek" butonu + sayfa sayısı input (default 5) — N sayfa ile sınırlı çekim | ✅ |
| `handleFetch(pageLimit?)` — opsiyonel limit parametresi | ✅ |
| Ardışık hata sayacı: 3 peş peşe hata → çekim durdurulur, kullanıcı uyarılır | ✅ |
| İlerleme göstergesi: `loaded / total` sayımı Tümünü Çek butonunda görünür | ✅ |
| `save-preview` backend: `LastFetchedAt` + `LastFetchedCount` güncellenir (metadata artık doğru) | ✅ |
| Fetch tamamlanınca `load()` çağrılır → kaynak kartı lastFetchedAt'ı yeniler | ✅ |

### ✅ Dış Kaynaklar — Yapısal Mimari Revizyonu / PDF Analizi (2026-07-11 — TAMAMLANDI)

**Analiz:** `Yuksek_Hacimli_Veri_Onizleme_ve_Ice_Aktarma_Mimarisi.pdf` (16 sayfa) ile mevcut implementasyon kıyaslandı.

**Tespit edilen anti-pattern:** 100K+ satır tüm olarak browser React state'inde tutulmaktaydı (`previewMap.rows`). PDF'in Bölüm 7.1 anti-pattern listesinde: "1M kaydı tek API response veya browser state'inde taşımak."

| Yapısal Değişiklik | Durum |
|---|---|
| `GET /preview-page?page=N&pageSize=100` — sunucu taraflı sayfalı önizleme (preview.json okur) | ✅ |
| `GET /preview-identifiers?field=SKU` — büyük kaynak için tek sütun değerleri (aktarım durumu kontrolü) | ✅ |
| `LARGE_SOURCE_THRESHOLD = 2000` sabiti — bu üstü kaynaklarda sunucu sayfalama devreye girer | ✅ |
| `ServerPreviewPage` interface + `serverPreviewPage` state — görüntüleme için sunucu sayfası | ✅ |
| `handleFetch`: büyük kaynak → save-preview await eder, ardından rows'u React state'ten temizler | ✅ |
| `loadServerPreview`: büyük REST kaynaklar `preview-page?page=1` ile yüklenir (tam `/preview` yok) | ✅ |
| `handleCheckImported`: büyük kaynaklar `/preview-identifiers` endpoint'i kullanır | ✅ |
| `refreshImportedForSource`: aynı — sunucu endpoint ile identifier listesi alır | ✅ |
| `pendingAutoCheck` useEffect: serverPaginated için `/preview-identifiers` tetikler | ✅ |
| Tablo: büyük kaynaklarda satır seçim checkbox'ları gizlenir | ✅ |
| Tablo navigation: büyük kaynaklarda `loadServerPreviewPage(page)` çağrır | ✅ |
| Import buttons: büyük kaynaklar için "Seçili Aktar" / "Tümünü Aktar" yerine bilgi mesajı + Çek & Aktar | ✅ |
| Tab badge + filtre sayaçları: `previewTotalCount` kullanır (serverPaginated aware) | ✅ |

**Kapsam dışı bırakılanlar (büyük mimari değişiklikler):**
- Cursor/keyset pagination (offset yeterli mevcut yapı için)
- RabbitMQ quorum queue / publisher confirms

### ✅ Dış Kaynaklar — Durable PreviewJob + Kooperatif İptal + İdempotency İndeksi (2026-07-11 — TAMAMLANDI)

| Görev | Durum |
|---|---|
| `PreviewJob` domain entity (Status, TotalPages, ProcessedPages, TotalRows, StartedAt, CompletedAt) | ✅ |
| `PreviewJobQueuedMessage` event — RabbitMQ üzerinden MassTransit'e iletilir | ✅ |
| `PreviewJobConsumer` — sunucu tarafında tüm REST sayfaları çeker, preview.json yazar | ✅ |
| `POST /{id}/start-preview` — PreviewJob oluşturur ve kuyruğa ekler, jobId döner | ✅ |
| `GET /{id}/preview-job` — en son PreviewJob durumunu döner (frontend polling) | ✅ |
| `POST /preview-jobs/{jobId}/cancel` — çalışan işi iptal eder | ✅ |
| Migration: `PreviewJobs` tablosu + `IX_PreviewJobs_ExternalSourceId/Status` indeksleri | ✅ |
| `IApplicationDbContext.PreviewJobs` arayüze eklendi | ✅ |
| Frontend: "Arka Planda" butonu — REST API kaynaklarda görünür, sunucu tarafı çekim başlatır | ✅ |
| Frontend: polling — 2 saniyede bir `preview-job` sorgulanır, ilerleme göstergesi güncellenir | ✅ |
| Frontend: sayfa yenileme sonrası — `toggleExpand`'de aktif job kontrol edilir, polling yeniden başlar | ✅ |
| `ImportBatchProcessor`: 4 foreach döngüsüne `ct.ThrowIfCancellationRequested()` eklendi | ✅ |
| DB idempotency: `UX_Products_SourceId_SKU` — partial unique index (ImportedFromSourceId + SKU WHERE NOT NULL) | ✅ |
| DB covering: `IX_Products_IsDeleted_CategoryId_Price` — kategori + fiyat sorguları | ✅ |

### ✅ Dış Kaynaklar — Tümünü Çek Sayfa Yenileme Sonrası Devam (2026-07-11 — TAMAMLANDI)

| Görev | Durum |
|---|---|
| "Tümünü Çek" (REST) → `handleStartServerPreview` yönlendirmesi (durable PreviewJob) | ✅ |
| Sayfa yenileme sonrası `toggleExpand` aktif job'ı tespit eder, polling devam eder | ✅ |
| "Tümünü Çek" butonu job aktifken progress + iptal gösterir (`previewJobMap` state) | ✅ |
| "Arka Planda" ayrı butonu kaldırıldı (artık "Tümünü Çek" ile aynı mekanizma) | ✅ |
| "Sayfalı Çek" disabled guard'ına server job kontrolü eklendi | ✅ |
| Preview panelinde server job progress banner eklendi ("Sayfayı kapatabilirsiniz") | ✅ |

**Analiz:** `C:\PROJECTS\DOTNET\DOCUMENTS\ECOM\ANALIZ\Yuksek_Hacimli_Veri_Onizleme_ve_Ice_Aktarma_Mimarisi.pdf` dokümanı ile mevcut yapı kıyaslandı. PDF Bölüm 8.2: "JobId URL'de taşınmalı, reload sonrası DB'den durum restore edilmeli." Mevcut `toggleExpand` zaten `GET /{id}/preview-job` ile aktif job'ı DB'den restore ediyor — eksik olan yalnızca "Tümünü Çek"in server-side mekanizmayı kullanmasıydı.

### 📋 Kalan Görevler

- [ ] SlowQueryInterceptor log analizi — 500ms+ sorgular tespit ve optimize
- [ ] `GetProductsQuery` — search COUNT büyük sonuç setlerinde (~9K) yaklaşık sayım seçeneği

## Not

- Bu dosya `AdminLintAuditJob` tarafından güncellenir.
- İlerleme, her dosya düzeltildikten sonra yeni lint koşusuyla yeniden değerlendirilmelidir.
