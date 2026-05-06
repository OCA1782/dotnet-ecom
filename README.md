# dotnet-ecom

Full-stack e-commerce platform built with **.NET 10** (Clean Architecture) on the backend and **Next.js 15** on the frontend. Developed as a production-ready reference implementation covering catalog management, cart & checkout, order lifecycle, payments, coupon system, product reviews, and an admin panel.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | .NET 10, ASP.NET Core Web API |
| Architecture | Clean Architecture (Domain / Application / Infrastructure / API) |
| ORM | Entity Framework Core 9 + SQL Server |
| CQRS | MediatR 12 |
| Validation | FluentValidation 11 |
| Auth | JWT Bearer |
| Password | BCrypt.Net |
| Email | MailKit |
| Payment | İyzico Checkout Form / Mock fallback |
| Customer UI | Next.js 15, TypeScript, Tailwind CSS |
| Admin Panel | Next.js 15, TypeScript, Tailwind CSS |

---

## Features

### Backend
- **Auth** — Register, login, forgot/reset password (JWT, BCrypt, email token)
- **Catalog** — Categories (tree), brands, products (variants, images, slug, soft-delete)
- **Stock** — Reserve-on-order, confirm-on-payment, release-on-cancel, stock adjustment, movement history
- **Cart** — Guest cart (cookie-based), authenticated cart, merge on login, coupon application
- **Coupons** — Fixed amount, percentage, free shipping; per-user & global usage limits, date ranges
- **Orders** — Address snapshot, order number (`SIP-YYYYMMDD-000001`), status transitions, cancellation
- **Payments** — İyzico Checkout Form (hosted page redirect) with automatic fallback to `MockPaymentService` when no API key is configured
- **Reviews** — One review per user per product, verified purchase detection, admin approval workflow, rating distribution
- **Email** — Order confirmation, payment success, shipping notification, password reset (dev-mode log when SMTP not configured)
- **Admin** — Dashboard metrics, order management, shipments, stock adjust, user list, coupon CRUD, review moderation

### Frontend (Customer — port 3000)
- Home page with category grid and featured products (SSR)
- Product listing with sidebar filters (category, price, search) — SSR + `searchParams`
- Product detail with variant selection, add to cart, review section with star ratings
- Cart page with coupon input and order summary
- Checkout — address selection → İyzico redirect or mock callback → success/failure pages
- Account pages: order history, order detail with cancellation, address management
- SEO: `generateMetadata` per page, OpenGraph, Twitter Card, `robots` config
- Password reset flow

### Frontend (Admin — port 3001)
- Dark sidebar layout with auth guard
- Dashboard: today's sales, pending orders, critical stock, monthly summary
- Orders: list with status/search filter, detail view, status update, shipment creation
- Products: list, deactivate
- Stock: critical stock filter, adjustment modal
- Users: list with role badges
- Coupons: full CRUD with create/edit modal
- Reviews: approval / deletion with status filter

---

## Project Structure

```
dotnet-ecom/
├── backend/
│   ├── Ecom.slnx
│   └── src/
│       ├── Ecom.Domain/          # Entities, enums, BaseEntity
│       ├── Ecom.Application/     # Interfaces, MediatR commands/queries, validators
│       ├── Ecom.Infrastructure/  # EF Core, JWT, BCrypt, MailKit, İyzico, MockPayment
│       └── Ecom.API/             # Controllers, middleware, Program.cs
├── frontend/
│   ├── customer/                 # Next.js — customer-facing storefront
│   └── admin/                   # Next.js — back-office panel
├── .gitignore
├── PROGRESS.md
└── README.md
```

---

## Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [SQL Server LocalDB](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb) (included with Visual Studio)
- [Node.js 20+](https://nodejs.org/)

### Backend

```bash
cd backend

# Restore packages and build
dotnet build

# Apply migrations (creates EcomDb on LocalDB)
dotnet ef database update --project src/Ecom.Infrastructure --startup-project src/Ecom.API

# Run the API
dotnet run --project src/Ecom.API
```

The API starts on `http://localhost:5124` by default. A seed admin account is created automatically on first run:

| Field | Value |
|---|---|
| Email | admin@ecom.com |
| Password | Admin1234! |

### Customer Frontend

```bash
cd frontend/customer
npm install

# Create env file
echo "NEXT_PUBLIC_API_URL=http://localhost:5124" > .env.local

npm run dev
# → http://localhost:3000
```

### Admin Frontend

```bash
cd frontend/admin
npm install

# Create env file
echo "NEXT_PUBLIC_API_URL=http://localhost:5124" > .env.local

npm run dev -- --port 3001
# → http://localhost:3001
```

---

## Configuration

All configuration lives in `backend/src/Ecom.API/appsettings.json`.

### JWT

```json
"Jwt": {
  "Key": "CHANGE_THIS_TO_A_STRONG_SECRET_KEY_AT_LEAST_32_CHARS",
  "Issuer": "EcomAPI",
  "Audience": "EcomClient",
  "ExpireMinutes": "1440"
}
```

### Email (SMTP)

Leave `SmtpHost` at its default value to use dev-mode logging (emails are printed to the console instead of being sent).

```json
"Email": {
  "SmtpHost": "smtp.yourprovider.com",
  "SmtpPort": "587",
  "Username": "your@email.com",
  "Password": "yourpassword",
  "FromAddress": "noreply@yourdomain.com",
  "EnableSsl": "true"
}
```

### İyzico Payment

Leave `ApiKey` empty to use the built-in `MockPaymentService` (no redirect, instant success simulation). Fill in your sandbox or production credentials to activate the real İyzico Checkout Form flow.

```json
"Iyzico": {
  "ApiKey": "",
  "SecretKey": "",
  "BaseUrl": "https://sandbox-api.iyzipay.com",
  "CallbackBaseUrl": "http://localhost:5124"
}
```

When `ApiKey` is set, the checkout flow redirects the user to İyzico's hosted payment page. After payment, İyzico posts back to `/api/payments/iyzico-callback`, which verifies the result and redirects to `/odeme/basarili` or `/odeme/basarisiz`.

---

## Key Business Rules

- Stock is **reserved** when an order is created, **decremented** only when payment succeeds, and **released** on cancellation or failed payment.
- Order lines capture a **snapshot** of product name, SKU, unit price, and tax rate at the time of purchase.
- Shipping addresses are stored as a **snapshot** on the order.
- Products are never hard-deleted — they are deactivated.
- Order numbers follow the format `SIP-YYYYMMDD-000001`.
- Card data is never stored; İyzico handles the PCI scope.

---

## Database Migrations

```bash
# From the backend/ directory

# Add a new migration
dotnet ef migrations add <MigrationName> \
  --project src/Ecom.Infrastructure \
  --startup-project src/Ecom.API \
  --output-dir Persistence/Migrations

# Apply pending migrations
dotnet ef database update \
  --project src/Ecom.Infrastructure \
  --startup-project src/Ecom.API
```

---

## API Overview

| Group | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `/login`, `/forgot-password`, `/reset-password` |
| Catalog | `GET/POST/PUT/DELETE /api/categories`, `/brands`, `/products` |
| Cart | `GET/POST/PUT/DELETE /api/cart`, `/apply-coupon`, `/remove-coupon`, `/merge` |
| Orders | `POST /api/orders`, `GET /api/orders/my`, `GET/POST /api/orders/{id}/cancel` |
| Payments | `POST /api/payments/initiate`, `/callback`, `/iyzico-callback` |
| Addresses | `GET/POST/PUT/DELETE /api/addresses` |
| Reviews | `GET/POST /api/products/{id}/reviews` |
| Stock | `GET /api/admin/stocks`, `POST /api/admin/stocks/adjust` |
| Admin Orders | `GET /api/orders/admin/list`, `PUT /api/orders/admin/{id}/status` |
| Admin Coupons | `GET/POST/PUT/DELETE /api/admin/coupons` |
| Admin Reviews | `PATCH /api/admin/reviews/{id}/approve`, `DELETE /api/admin/reviews/{id}` |
| Admin Shipments | `POST /api/admin/shipments` |
| Admin Dashboard | `GET /api/admin/dashboard` |
| Admin Users | `GET /api/admin/users` |

---

## License

MIT
