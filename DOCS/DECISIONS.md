# Architectural & Technical Decisions

<!-- Date | Area | Decision | Rationale -->

---

## 2026-05-10 | Architecture | Clean Architecture with 4 layers
**Decision:** Domain → Application → Infrastructure → API
**Rationale:** Separation of concerns; Application layer depends on no infrastructure. Makes swapping ORM or DB possible without touching business logic.

---

## 2026-05-10 | Backend | MediatR CQRS pattern
**Decision:** All use cases implemented as `IRequest` / `IRequestHandler` via MediatR.
**Rationale:** Keeps controllers thin, each use case isolated, easy to test. Avoids fat service classes.

---

## 2026-05-10 | Backend | EF Core with SQL Server
**Decision:** EF Core 10 as ORM, SQL Server as primary database.
**Rationale:** Native .NET integration, strong migration tooling. LocalDB used for development.

---

## 2026-05-10 | Backend | Migrations NOT committed to git
**Decision:** `Migrations/` folder is in `.gitignore`.
**Rationale:** Avoids migration conflicts in team environments. Each developer runs `dotnet ef migrations add` locally.
**Risk:** Team members must coordinate migration names to avoid duplicates.

---

## 2026-05-10 | Backend | StockService called AFTER SaveChanges in CancelOrder/PaymentCallback
**Decision:** Always `await _context.SaveChangesAsync()` before calling `StockService`.
**Rationale:** Prevents EF Core batch-conflict when both operations try to update the same tracked entity set. Discovered empirically.

---

## 2026-05-10 | Backend | PaymentStatus enum values
**Decision:** Pending=1, Paid=2, Failed=3 (1-based, not 0-based)
**Rationale:** Avoids accidental default-value bugs (0 would mean "Pending" unintentionally on uninitialized entities).

---

## 2026-05-10 | Backend | OrderStatus enum values
**Decision:** Created=1, Processing=2, PaymentPending=3(?), PaymentCompleted=3, Preparing=4, Shipped=5, Delivered=6, Returned=7, Cancelled=8, PartiallyRefunded=9, Refunded=10, Failed=11, OnHold=12
**Rationale:** Extensible numeric enum; OnHold added later as 12 without breaking existing data.

---

## 2026-05-10 | Backend | İyzico HMAC-SHA256 authentication
**Decision:** Request signing via HMAC-SHA256 with ApiKey+SecretKey; conditional DI (MockPaymentService if keys not configured).
**Rationale:** Allows development without real İyzico credentials; just leave keys empty in appsettings.

---

## 2026-05-10 | Backend | File uploads to wwwroot/uploads
**Decision:** Product images stored at `wwwroot/uploads/products/{filename}`, served as static files.
**Rationale:** Simple for MVP. Production should use blob storage (Azure/S3).
**Future:** Replace UploadController with cloud storage adapter behind IStorageService.

---

## 2026-05-10 | Backend | E-posta dev-mode log
**Decision:** EmailService writes to logger instead of sending real mail when SMTP not configured.
**Rationale:** Zero-config development experience; no mock SMTP server required.

---

## 2026-05-10 | Frontend | Next.js 15 + TypeScript + TailwindCSS
**Decision:** Admin on port 3001, Customer on port 3000; both Next.js 15 App Router.
**Rationale:** Shared stack, independent deployable apps. App Router enables server components for SEO.

---

## 2026-05-10 | Frontend | Custom SVG chart components (no chart library)
**Decision:** DonutChart, SatisfactionGauge, WeeklyBars, RingMeter, SegmentBar implemented as inline SVG React components.
**Rationale:** Zero additional dependency, full visual control, small bundle size. Tradeoff: more code to maintain.

---

## 2026-05-10 | Frontend | ConfirmModal reusable component
**Decision:** Single `ConfirmModal` component with `danger`, `icon`, `children` props covers all confirmation dialogs.
**Rationale:** Consistent UX; avoids `window.confirm()` which can't be styled or tested.

---

## 2026-05-10 | Frontend | Billing address shown only when different from shipping
**Decision:** `billingAddressSnapshot !== shippingAddressSnapshot` string comparison before rendering billing card.
**Rationale:** Most orders use same address; avoids redundant display. Simple string equality suffices since both are JSON snapshots.

---

## 2026-05-10 | Frontend | Discount amount derived client-side
**Decision:** `discount = (totalProductAmount + shippingAmount + taxAmount) - grandTotal`
**Rationale:** API doesn't return a dedicated discountAmount field; derivation is accurate and avoids a backend change.
