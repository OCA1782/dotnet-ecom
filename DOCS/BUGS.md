# Bug Tracker

Status: 🔴 Open  🟡 Workaround Applied  ✅ Fixed

---

## ✅ BUG-001 | React hook called inside JSX conditional
**Date found:** 2026-05-10
**File:** `frontend/admin/src/app/(admin)/dashboard/page.tsx`
**Symptom:** Fast Refresh error — "hooks cannot be called inside JSX or conditions"
**Root cause:** `useCountUp(stats.todayOrderCount ?? 0, 800)` called inline as a JSX prop value.
**Fix:** Hoisted both `useCountUp` calls to component top level as `const todayOrderCount` and `const monthOrderCount`.
**Status:** Fixed same session.

---

## 🟡 BUG-002 | EF Core batch conflict in CancelOrder + StockService
**Date found:** 2026-05-10 (historical, discovered during Adım 6 development)
**File:** `backend/src/Ecom.Application/Features/Orders/Commands/UpdateOrderStatusCommand.cs`
**Symptom:** DbUpdateConcurrencyException when cancelling an order that has stock reservations.
**Root cause:** StockService and order cancellation both modify tracked entities in same `SaveChanges` batch.
**Workaround:** Always call `await _context.SaveChangesAsync()` before invoking StockService methods.
**Status:** Workaround applied — no permanent fix needed unless architecture changes.

---

## 🔴 BUG-003 | Migrations/ not in git — new devs must regenerate
**Date found:** 2026-05-10
**Area:** DevOps / Onboarding
**Symptom:** New developer clones repo, no Migrations/ folder, `dotnet ef database update` fails.
**Root cause:** `Migrations/` is in `.gitignore` (deliberate decision — see decisions.md).
**Workaround:** Developer runs `dotnet ef migrations add InitialCreate` then `dotnet ef database update` locally.
**Status:** Open — document onboarding steps in README or SESSION_GUIDE.md.

---

## 🔴 BUG-004 | Sipariş detay — durum değiştirme hâlâ direkt API çağrısı
**Date found:** 2026-05-10
**File:** `frontend/admin/src/app/(admin)/siparisler/[orderNumber]/page.tsx`
**Symptom:** Durum değiştirme dropdown'ı ConfirmModal kullanmıyor; yanlışlıkla tıklama mümkün.
**Root cause:** ConfirmModal entegrasyonu sipariş listesi sayfasına yapıldı ama detay sayfasına yapılmadı.
**Status:** Open — todo.md'de 🟡 orta öncelikli kayıtlı.

---

## 🟡 BUG-005 | wwwroot/uploads — deployment'ta silinir
**Date found:** 2026-05-10
**Area:** Infrastructure / File Storage
**Symptom:** Deployment sırasında yüklenen ürün görselleri kaybolur (klasör git'te değil).
**Root cause:** `wwwroot/uploads/` gitignore'da, cloud storage yok.
**Workaround:** Manuel yedek veya server-side persistent volume.
**Status:** Workaround — uzun vadede IStorageService + blob storage ile çözülmeli (decisions.md BUG-005 notu).
