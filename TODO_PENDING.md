# TODO Pending

> Son güncelleme: 06.07.2026 17:56 UTC (AdminLintAuditJob)

## Özet

| Alan | Değer |
| --- | ---: |
| Toplam uyarı | 2 |
| Toplam hata | 1 |
| Etkilenen dosya | 2 |
| Komut | `frontend/admin/node_modules/.bin/eslint src --format json` |

## Öncelikli Aksiyonlar

1. `src/app/(admin)/kategoriler/page.tsx`
   - [ ] `src/app/(admin)/kategoriler/page.tsx` içinde `<img>` kullanımını `next/image` ile değiştir veya gerekçeyi açıkla

2. `src/app/(admin)/versiyonlar/page.tsx`
   - [ ] `src/app/(admin)/versiyonlar/page.tsx` içinde lint uyarısını gider: Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

C:\PROJECTS\DOTNET\Ecom\frontend\admin\src\app\(admin)\versiyonlar\page.tsx:75:21
  73 |   }, []);
  74 |
> 75 |   useEffect(() => { load(); }, [load]);
     |                     ^^^^ Avoid calling setState() directly within an effect
  76 |
  77 |   async function saveVersionSettings() {
  78 |     setSaving(true);
   - [ ] `src/app/(admin)/versiyonlar/page.tsx` içindeki kullanılmayan import/değişkeni kaldır

## İlk Çalışma Sırası

- [ ] `src/app/(admin)/kategoriler/page.tsx`
- [ ] `src/app/(admin)/versiyonlar/page.tsx`

## Not

- Bu dosya `AdminLintAuditJob` tarafından güncellenir.
- İlerleme, her dosya düzeltildikten sonra yeni lint koşusuyla yeniden değerlendirilmelidir.
