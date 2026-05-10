# Yeni Session Başlangıç Kılavuzu

Bu projeye yeni bir session başladığında yapılacaklar:

## 1. Durumu Oku
```
C:\PROJECTS\DOTNET\Ecom\PROGRESS.md dosyasını oku
```
Bu dosya son tamamlanan adımı, sıradaki adımı ve tüm bağlamı içerir.

## 2. Kodu Kontrol Et (Opsiyonel)
```bash
# Backend dizini
C:\PROJECTS\DOTNET\Ecom\backend\

# Solution build testi
dotnet build Ecom.slnx
```

## 3. Devam Et
PROGRESS.md'deki "SIRADAKI" bölümünden devam et.

---

## Her Adım Tamamlandığında

1. `PROGRESS.md` dosyasını güncelle:
   - Tamamlanan adımı `✅` yap
   - "SIRADAKI" bölümünü bir sonraki adıma çevir
   - Yeni endpoint'leri veya dosyaları "Önemli Dosya Konumları" tablosuna ekle

2. Build al: `dotnet build Ecom.slnx`

3. Varsa test çalıştır.

---

## Proje Bağlamı (Özet)

- Backend: .NET 10, Clean Architecture (Domain/Application/Infrastructure/API)
- Frontend: Next.js 15 + TypeScript (customer + admin)
- DB: SQL Server LocalDB, `EcomDb`
- Auth: JWT Bearer
- Pattern: MediatR (CQRS) + FluentValidation

Detay için: `PROGRESS.md`
