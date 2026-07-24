# CLAUDE.md — Ecom Proje Çalışma Kuralları

Bu dosya her Claude Code oturumunda otomatik yüklenir. Yalnızca sürekli geçerli, proje genelini ilgilendiren kuralları içerir.

---

## 1. Temel Çalışma İlkeleri

- Kullanıcının verdiği görev kapsamına bağlı kal.
- Görevle ilgisiz refactor, rename, formatlama, dependency upgrade veya cleanup yapma.
- Bir dosyanın mevcut içeriğini ve ilgili çağrı zincirini incelemeden değiştirme.
- Tüm repoyu kontrolsüz şekilde tarama. Önce hedefli arama yap ve yalnızca görevle ilişkili dosyaları oku.
- Mevcut davranışları gerekçesiz değiştirme.
- Kullanıcının mevcut commit edilmemiş çalışmalarını koru.
- Mevcut değişiklikleri resetleme, revert etme, stash etme, silme veya üzerine yazma.
- Kapsam dışı bir sorun tespit edilirse doğrudan değiştirme; final raporda ayrı bulgu olarak belirt.
- Çalıştırılmayan veya doğrulanamayan bir işlem için başarılı ya da çalışıyor ifadesini kullanma.

---

## 2. Oturum Başlangıcı

Kod değişikliği yapılacaksa önce ilgili repoda aşağıdaki kontrolleri yap:

```bash
git branch --show-current
git status --short
git diff --stat
git diff --cached --stat
```

Ardından:

1. Mevcut commit edilmemiş değişikliklerin görevle ilişkisini değerlendir.
2. Kullanıcı tarafından yapılan mevcut çalışmaları koru.
3. Yalnızca görevle ilişkili task, karar ve teknik dokümanları oku.
4. Kullanıcı bir görev kimliği verdiyse ilgili görev dosyasını bul ve incele.
5. Tüm `TODO`, `PENDING`, `SESSION` veya geçmiş dokümanlarını otomatik olarak bağlama yükleme.

Sadece analiz veya dokümantasyon görevi yapılıyorsa build, test veya smoke test çalıştırma.

Baseline testi yalnızca aşağıdaki durumlarda çalıştır:

- mevcut bir hata düzeltiliyorsa,
- regression riski yüksekse,
- ilgili alanda önceden commit edilmemiş değişiklik varsa,
- kullanıcı mevcut çalışma durumunun doğrulanmasını açıkça istediyse.

---

## 3. Görev Yönetimi

Karmaşık görevlerde aşağıdaki çalışma sırasını uygula:

1. **Intake**
   - Talebi ve kabul kriterlerini belirle.
   - İlgili kod ve doküman repolarını tespit et.
   - Görev kapsamını ve kapsam dışı alanları netleştir.

2. **Analysis**
   - İlgili dosyaları ve çağrı zincirini bul.
   - Mevcut davranışı incele.
   - Kök nedeni veya geliştirme ihtiyacını belirle.
   - Riskleri ve bağımlılıkları listele.

3. **Plan**
   - Değiştirilecek dosyaları belirle.
   - Teknik uygulama adımlarını oluştur.
   - Test ve doğrulama yöntemini belirle.
   - Dokümantasyon etkisini değerlendir.

4. **Implementation**
   - Yalnızca görev kapsamındaki değişiklikleri uygula.
   - İlgisiz alanlara dokunma.
   - Mevcut public sözleşmeleri açık talep olmadan bozma.

5. **Verification**
   - Etkilenen alanlar için hedefli build ve test işlemlerini çalıştır.
   - Sonucu kanıtlarıyla raporla.

6. **Documentation**
   - Görev davranış, mimari, API, veri modeli veya operasyon sürecini değiştiriyorsa ilgili dokümanları güncelle.
   - Dokümantasyon etkisi yoksa bunu final raporda belirt.

7. **Final Report**
   - Yapılan değişiklikleri, doğrulamaları, riskleri ve Git durumunu raporla.

Görev yönetimi için ayrı bir skill mevcutsa:

```text
.claude/skills/task-execution/SKILL.md
```

dosyasındaki protokolü kullan.

---

## 4. Korunan Davranışlar ve Mimari Kararlar

Projeye özgü davranışlar ve teknik kararlar `CLAUDE.md` içinde ayrıntılı olarak tutulmaz.

İlgili karar dokümanları:

```text
docs/decisions/vehicle-navigation.md
docs/decisions/product-search.md
docs/decisions/frontend-rendering.md
docs/decisions/database-indexing.md
```

Bir görev bu alanlardan birini etkiliyorsa ilgili karar dokümanını değişiklik öncesinde oku.

Korunan bir davranışı istemeden değiştirme.

Kullanıcı açıkça mevcut bir davranışın değiştirilmesini isterse:

1. Mevcut davranışın gerekçesini belirle.
2. Etkilenecek alanları analiz et.
3. Regression risklerini değerlendir.
4. İlgili testleri güncelle.
5. Karar dokümanını güncelle.
6. Eski davranışın artık geçerli olmadığını dokümana açıkça işle.

---

## 5. Backend Kuralları

- Harici I/O işlemlerinde uygun olduğunda `CancellationToken` kullan.
- Beklenen iş hatalarını mevcut proje hata yönetimi standardına göre işle.
- Mevcut public API sözleşmesini açık talep olmadan bozma.
- Yeni endpoint veya contract değişikliğinde geriye dönük uyumluluğu değerlendir.
- EF Core model veya schema değişikliklerinde migration gereksinimini değerlendir.
- Migration gerektiren bir değişikliği migration olmadan tamamlanmış sayma.
- Migration oluşturma veya uygulama işlemini yalnızca görev kapsamındaysa gerçekleştir.
- Migration dosyalarını manuel ve gerekçesiz şekilde düzenleme.
- Yeni NuGet paketi eklemeden önce mevcut bağımlılıklarla çözüm olup olmadığını kontrol et.
- Yeni dependency gerekiyorsa gerekçesini, lisansını ve operasyonel etkisini raporla.
- Veritabanı index kararlarını yalnızca performans ihtiyacı ve sorgu planına göre değerlendir.
- Index değişikliklerinde ilgili migration ve database etkisini birlikte ele al.

Backend başlatma komutu:

```bash
dotnet run --project backend/src/Ecom.API/Ecom.API.csproj
```

---

## 6. Frontend Kuralları

- Mevcut navigation, rendering ve caching davranışlarını gerekçesiz değiştirme.
- Tüm `page.tsx` dosyalarına otomatik olarak `force-dynamic` ekleme.
- Dinamik rendering kararını kullanılan veri kaynağı, cache politikası, cookies, headers, revalidation ve mevcut davranışa göre değerlendir.
- Mevcut `force-dynamic` deklarasyonlarını gerekçesiz kaldırma.
- Component, hook, state veya import silmeden önce başka bir yerde kullanılıp kullanılmadığını kontrol et.
- Yeni npm dependency eklemeden önce mevcut bağımlılıklarla çözüm olup olmadığını değerlendir.
- TypeScript değişikliklerinde yalnızca etkilenen frontend projesinin type-check işlemini çalıştır.
- Shared contract değişikliklerinde backend ve etkilenen frontend projelerini birlikte doğrula.

Tercih edilen type-check komutları:

```bash
npx tsc --noEmit -p frontend/customer/tsconfig.json
npx tsc --noEmit -p frontend/admin/tsconfig.json
```

Projede tanımlı `typecheck` script'i varsa doğrudan package script'ini kullan.

---

## 7. Doğrulama Stratejisi

Her dosya değişikliğinden sonra tam smoke test çalıştırma.

Doğrulamayı değişiklik kapsamına göre uygula.

### Backend değişikliği

- ilgili unit veya integration testleri
- backend build
- gerekiyorsa smoke test

### Customer frontend değişikliği

- customer type-check
- ilgili testler
- gerekiyorsa customer build

### Admin frontend değişikliği

- admin type-check
- ilgili testler
- gerekiyorsa admin build

### Shared contract değişikliği

- backend build ve ilgili testler
- etkilenen frontend projelerinin type-check veya build işlemleri

### Dokümantasyon değişikliği

- kod build veya test çalıştırma
- bağlantı, yol ve içerik tutarlılığını kontrol et

### Veritabanı değişikliği

- migration içeriğini incele
- backend build çalıştır
- uygun ortam varsa migration doğrulaması yap
- destructive değişiklikleri açıkça raporla

Doğrulama sırası:

1. Değişiklik sırasında hedefli testler
2. Mantıksal değişiklik grubu tamamlandığında ilgili kontroller
3. Görev sonunda etkilenen bileşen doğrulamaları
4. Gerekliyse commit öncesi smoke test

Başlangıçta mevcut başarısız testler varsa bunları kaydet.

Yeni değişiklik:

- mevcut failure sayısını artırmamalı,
- görevle ilgili testleri bozmamalı,
- yeni regression oluşturmamalı.

Doğrulama statülerinden birini kullan:

```text
VERIFIED
PARTIALLY_VERIFIED
NOT_VERIFIED
```

Örnek:

```text
Verification: PARTIALLY_VERIFIED

Passed:
- Backend build
- 12 related unit tests
- Customer type-check

Not verified:
- Docker end-to-end test
- External payment service integration
```

---

## 8. Smoke Test Kullanımı

Smoke test komutu:

```bash
scripts/smoke-test.sh
```

Smoke test şu durumlarda çalıştırılır:

- görev birden fazla bileşeni etkiliyorsa,
- kritik kullanıcı akışı değişmişse,
- regression riski yüksekse,
- görev sonunda bütünsel doğrulama gerekiyorsa,
- kullanıcı açıkça talep etmişse.

Her küçük değişiklikten sonra smoke test çalıştırma.

Smoke test çıktısında:

- PASS sayısını,
- FAIL sayısını,
- değişiklik öncesi ve sonrası farkı,
- başarısız kontrollerin görevle ilişkisini

raporla.

Uzun ve başarılı çıktıların tamamını context'e alma. Yalnızca özet, hata ve warning bilgilerini kullan.

---

## 9. Dokümantasyon Kuralları

Her görev sonunda dokümantasyon etki analizi yap.

Aşağıdaki değişikliklerde ilgili dokümanları güncelle:

- public API davranışı
- kullanıcıya görünen iş davranışı
- veri modeli veya migration
- mimari karar
- entegrasyon akışı
- background job davranışı
- deployment veya operasyon süreci
- güvenlik veya yetkilendirme davranışı
- kalıcı regression koruması
- yeni dependency veya altyapı bileşeni

Aşağıdaki durumlarda teknik doküman güncellemek zorunlu değildir:

- yalnızca typo düzeltmesi
- davranış değiştirmeyen formatlama
- lokal değişken adı değişikliği
- yalnızca test mock düzeltmesi
- davranış değiştirmeyen küçük internal refactor

Geçici veritabanı kayıt sayılarını kalıcı proje kuralı olarak kabul etme.

Aşağıdaki gibi değişken durumları gerektiğinde gerçek ortamdan sorgulayarak doğrula:

- featured ürün sayısı
- VehicleModel alanı dolu ürün sayısı
- aktif kullanıcı veya sipariş sayıları
- ortamda mevcut index veya migration durumu

Kod ve dokümantasyon repoları ayrı Git repolarıysa değişiklikleri ayrı ayrı raporla.

Dokümantasyon reposu:

```text
C:/PROJECTS/DOTNET/dotnet-ecom-docs
```

Bu yol yerel ortama özeldir. Yol mevcut değilse kullanıcıdan doğrulama almadan alternatif bir klasörde değişiklik yapma.

---

## 10. Git Güvenliği

Varsayılan davranış:

- değişiklikleri uygula,
- doğrulamaları çalıştır,
- diff özetini raporla,
- önerilen commit mesajlarını paylaş,
- commit veya push yapma.

Commit, push, merge, rebase, branch oluşturma veya pull request işlemlerini yalnızca kullanıcı açıkça talep ederse gerçekleştir.

Açık kullanıcı talebi olmadan:

- commit oluşturma,
- push yapma,
- branch oluşturma,
- pull request açma,
- merge yapma,
- rebase yapma.

`main` veya `master` branch'e doğrudan push yapma.

Kod ve dokümantasyon repoları için ayrı commit oluştur.

Mevcut commit edilmemiş değişiklikleri otomatik olarak commit kapsamına alma.

Commit öncesinde:

```bash
git status --short
git diff --stat
git diff --cached --stat
```

kontrollerini yap.

Commit mesajlarında:

- conventional commit formatı kullan,
- Claude, AI, generated by veya benzeri referanslar kullanma,
- görev kimliği varsa commit mesajına ekle.

Örnek:

```text
fix(orders): prevent concurrent scheduled execution

docs(tasks): document order scheduler verification
```

Açık kullanıcı onayı olmadan aşağıdaki işlemleri çalıştırma:

```text
git reset --hard
git clean
git push --force
git push --force-with-lease
git branch -D
git checkout -- .
git restore .
database drop
migration rollback
docker volume delete
```

---

## 11. Güvenlik Kuralları

- Secret, token, private key, certificate veya gerçek connection string değerlerini çıktıda gösterme.
- `.env`, production config veya hassas dosyaları commit etme.
- Loglarda hassas verileri maskele.
- Gerçek kullanıcı veya müşteri verilerini gereksiz yere context'e alma.
- Production veritabanında destructive işlem yapma.
- Yetkilendirme, authentication veya ödeme akışındaki değişikliklerde güvenlik etkisini ayrıca değerlendir.
- Şüpheli bir secret tespit edilirse değeri tekrar etmeden dosya ve satır seviyesinde uyar.

---

## 12. Servis ve Port Bilgileri

| Servis | Varsayılan Port |
|---|---:|
| Customer frontend | 3000 |
| Admin frontend | 3001 |
| Backend API | 5124 |
| SQL Server | Yerel ortam konfigürasyonuna bağlı |

Portların aktif ortamda farklı olabileceğini göz önünde bulundur.

Gerekli olduğunda aşağıdaki kaynaklardan doğrula:

- environment dosyaları
- `appsettings` dosyaları
- Docker Compose
- launch settings
- frontend environment config

Dokümanda yazan portu tek gerçek kaynak olarak kabul etme.

---

## 13. Session ve Hafıza Yönetimi

Kişisel Claude memory dosyalarını proje için tek gerçek kaynak olarak kabul etme.

Aşağıdaki mutlak kullanıcı yoluna bağımlı olma:

```text
C:\Users\fpen\.claude\projects\C--PROJECTS-DOTNET-ECOM\memory\MEMORY.md
```

Bu dosya mevcutsa yardımcı bağlam olarak kullanılabilir; ancak proje kararları repository içindeki dokümanlardan doğrulanmalıdır.

Kalıcı bilgiler şu alanlarda tutulmalıdır:

```text
docs/decisions/
docs/tasks/
docs/operations/
docs/architecture/
```

Session kayıtları görev kaydının yerine geçmez.

Session kaydında yalnızca:

- ele alınan görevler,
- yapılan işlemler,
- alınan kararlar,
- doğrulama sonuçları,
- açık kalan işler

bulunmalıdır.

Geçmiş session dosyalarının tamamını otomatik olarak okuma. Yalnızca mevcut görevle ilişkili olanları yükle.

---

## 14. Session Sonu Protokolü

Kod değişikliği yapıldıysa:

1. Değiştirilen dosyaları gözden geçir.
2. Görevle ilgisiz değişiklik bulunmadığını kontrol et.
3. Etkilenen bileşenler için hedefli test ve build işlemlerini çalıştır.
4. Gerekliyse smoke test çalıştır.
5. Dokümantasyon etki analizini yap.
6. İlgili görev ve teknik dokümanları güncelle.
7. Git durumunu kontrol et.
8. Final raporu oluştur.
9. Kullanıcı açıkça istemediyse commit veya push yapma.

Her durumda tüm frontend ve backend projelerini zorunlu olarak çalıştırma. Yalnızca etkilenen alanları doğrula.

---

## 15. Final Rapor Formatı

Her görev sonunda aşağıdaki formatı kullan:

```text
## Task Summary

## Implemented Changes

## Changed Files

## Verification
Status: VERIFIED | PARTIALLY_VERIFIED | NOT_VERIFIED

Commands:
- ...

Results:
- ...

Not Verified:
- ...

## Documentation Impact

## Open Risks

## Out-of-Scope Findings

## Git Status

## Suggested Commit Messages
```

Final raporda:

- çalıştırılan komutları,
- test ve build sonuçlarını,
- doğrulanamayan alanları,
- değiştirilen dokümanları,
- kapsam dışı bulguları,
- açık kalan riskleri

net şekilde belirt.
