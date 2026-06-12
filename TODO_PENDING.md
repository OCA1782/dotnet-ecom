# TODO Pending

> Son güncelleme: 12.06.2026 17:00 UTC (AdminLintAuditJob)

## Özet

| Alan | Değer |
| --- | ---: |
| Toplam uyarı | 0 |
| Toplam hata | 1 |
| Etkilenen dosya | 1 |
| Komut | `frontend/admin/node_modules/.bin/eslint src --format json` |

## Öncelikli Aksiyonlar

1. `src/components/NotificationsPanel.tsx`
   - [ ] `src/components/NotificationsPanel.tsx` içinde lint uyarısını gider: Error: Cannot call impure function during render

`Date.now` is an impure function. Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

C:\PROJECTS\DOTNET\Ecom\frontend\admin\src\components\NotificationsPanel.tsx:111:29
  109 |               const Icon = TYPE_ICON[item.type];
  110 |               const color = TYPE_COLOR[item.type];
> 111 |               const diff = (Date.now() - new Date(item.createdAt).getTime()) / 1000;
      |                             ^^^^^^^^^^ Cannot call impure function
  112 |               const ago = diff < 60
  113 |                 ? t("timeAgo.justNow", "az önce")
  114 |                 : diff < 3600

## İlk Çalışma Sırası

- [ ] `src/components/NotificationsPanel.tsx`

## Not

- Bu dosya `AdminLintAuditJob` tarafından güncellenir.
- İlerleme, her dosya düzeltildikten sonra yeni lint koşusuyla yeniden değerlendirilmelidir.
