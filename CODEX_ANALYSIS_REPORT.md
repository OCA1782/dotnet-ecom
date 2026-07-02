# Codex Analysis Report

## 1. Executive Summary

This report analyzes the local multi-repository workspace at `C:\PROJECTS\DOTNET`, combining the documentation repository (`dotnet-ecom-docs`) and implementation repository (`Ecom`).

`dotnet-ecom-docs` is the product, process, roadmap, decision and verification source of truth. It describes a broad B2C e-commerce platform with customer storefront, admin operations, licensing, deployment, verification, audit, messaging, imports, reporting and production-readiness workflows.

`Ecom` is the implementation source of truth. It contains a .NET 10 backend using Clean Architecture, CQRS/MediatR, EF Core, Dapper, MassTransit/RabbitMQ, Redis and background jobs, plus two Next.js 16 applications for admin and customer surfaces. Docker Compose includes SQL Server, Redis, RabbitMQ, API, admin, customer and a sibling `EcomLicence` service.

The high-level architecture mostly matches the documentation, but there are concrete gaps: Docker port mappings differ from documented ports, local docs lag the docs repo, the licence service split is only partially documented across all files, tests are not implemented as documented, and there is substantial uncommitted work in `Ecom` around i18n automation and admin page translation.

No source files were modified during analysis. This report is the only created file.

## 2. Workspace Scope

Analyzed workspace:

- `C:\PROJECTS\DOTNET`

Analyzed repositories:

- `C:\PROJECTS\DOTNET\Ecom`
  - Main application repository.
  - Implementation source of truth.
  - Contains backend, frontend, Docker, infrastructure, CI/CD, scripts and source code.
- `C:\PROJECTS\DOTNET\dotnet-ecom-docs`
  - Documentation repository.
  - Product/process/technical documentation source of truth.
  - User prompt refers to `dotnet_ecom_docs`; local workspace contains `dotnet-ecom-docs`.

Inspection boundaries:

- Read-only Git inspection was performed.
- Project-owned Markdown files were inspected.
- Ignored dependency Markdown under `node_modules` was excluded from the project documentation inventory because those are third-party package docs, not repository documentation.
- Some very large Markdown files produced truncated terminal output in the tool, especially `VERIFICATION_LOG.md`, `PROGRESS.md`, `CHANGELOG.md` and `mvp-plan.md`. They were opened and summarized by visible sections and repository context; full verbatim reproduction was not attempted.
- Secrets, token values, passwords, private keys and private repository URLs are intentionally not reproduced.

## 3. Git Working Tree Status

`dotnet-ecom-docs`:

- Branch: `main`
- Remote status: up to date with `origin/main`
- Uncommitted files: 2
- Staged files: none
- Untracked files: none
- Modified files:
  - `DAILY_PROGRESS.md`
  - `VERIFICATION_LOG.md`

`Ecom`:

- Branch: `main`
- Remote status: up to date with `origin/main`
- Uncommitted files: 38 total
- Staged files: none
- Modified tracked files: 35
- Untracked files: 3
- Deleted files: none
- Renamed files: none

Required read-only Git commands were used during analysis:

- `git status --short`
- `git status`
- `git diff --stat`
- `git diff`
- `git diff --staged --stat`
- `git diff --staged`
- `git ls-files`
- `git ls-files --others --exclude-standard`

## 4. Markdown Documentation Inventory

### dotnet-ecom-docs

- `ALL_PAGES.md`
- `architecture.md`
- `BUGS.md`
- `CHANGELOG.md`
- `DAILY_PROGRESS.md`
- `DECISIONS.md`
- `DEPLOYMENTS.md`
- `HOOK_TEST.md`
- `IMPORTANT_COMMANDS.md`
- `LICENSE_SYSTEM.md`
- `mvp-plan.md`
- `PRE_ANALYZE.md`
- `PROGRESS.md`
- `README.md`
- `SESSION_GUIDE.md`
- `TEST_SCENARIO.md`
- `TODO_DONE.md`
- `TODO_PENDING.md`
- `VERIFICATION_LOG.md`
- `project_files/images/README.md`

### Ecom

- `TODO.md`
- `docs/architecture.md`
- `docs/mvp-plan.md`
- `frontend/admin/AGENTS.md`
- `frontend/admin/CLAUDE.md`
- `frontend/admin/README.md`
- `frontend/customer/AGENTS.md`
- `frontend/customer/CLAUDE.md`
- `frontend/customer/README.md`

Total project-owned Markdown files inspected: 29.

## 5. dotnet_ecom_docs Summary

The documentation repository describes both initial product strategy and accumulated implementation history.

Key document roles:

- `README.md`: onboarding, project structure, feature overview, setup, Docker, API groups and operational rules.
- `architecture.md`: Clean Architecture, backend layers, CQRS, domain model, messaging, security, frontend split and infrastructure.
- `mvp-plan.md`: business analysis, module priorities, MVP/future phases, customer/admin workflows and strategic sequencing.
- `ALL_PAGES.md`: customer/admin screen catalog.
- `TEST_SCENARIO.md`: manual test scenarios by customer/admin area.
- `TODO_PENDING.md`: active backlog and blockers.
- `TODO_DONE.md`: completed work archive.
- `PROGRESS.md` and `DAILY_PROGRESS.md`: historical implementation notes.
- `CHANGELOG.md`: versioned technical/user-facing changes.
- `DECISIONS.md`: architecture and project decisions.
- `BUGS.md`: known issues, fixes and workarounds.
- `DEPLOYMENTS.md`: deployment state and operational notes.
- `LICENSE_SYSTEM.md`: licence generation, validation and operational details.
- `VERIFICATION_LOG.md`: repeated verification job results.
- `IMPORTANT_COMMANDS.md`, `SESSION_GUIDE.md`, `PRE_ANALYZE.md`: workflow and local execution guidance.
- `project_files/images/README.md`: shared image synchronization process.

Current documented product direction:

- Build a stable, production-capable e-commerce system.
- Start with reliable product, stock, cart, order, payment and admin operations.
- Expand with campaigns, coupons, returns, reviews, reporting, integrations and marketplace-style capabilities later.
- Preserve operational traceability through audit logs, error logs and verification checks.

## 6. Ecom Implementation Summary

Repository structure:

- `backend/`
  - `Ecom.slnx`
  - `src/Ecom.Domain`
  - `src/Ecom.Application`
  - `src/Ecom.Infrastructure`
  - `src/Ecom.API`
  - `src/Ecom.Worker`
  - `tools/Ecom.LicenseGenerator`
- `frontend/admin`
  - Next.js 16 App Router admin panel.
- `frontend/customer`
  - Next.js 16 customer storefront.
- `docker-compose.yml`
- `.github/workflows`
- `scripts`
- `deploy`
- `tools/activation-server`

Backend:

- Target framework: `net10.0`
- Main API project: `backend/src/Ecom.API/Ecom.API.csproj`
- Application project: CQRS/MediatR, Dapper, FluentValidation, EF abstractions.
- Infrastructure project: EF Core SQL Server/PostgreSQL providers, Redis cache, MassTransit/RabbitMQ, MailKit, ClosedXML, SSH.NET, Google auth, background jobs and services.
- Domain project: entities and enums.
- Worker project exists but is not included in `Ecom.slnx`.
- Licence generator CLI exists under `backend/tools/Ecom.LicenseGenerator`.

Frontend:

- Admin dependencies include `next@16.2.4`, `react@19.2.4`, `lucide-react`, `recharts`, `xlsx`, Tailwind 4.
- Customer dependencies include `next@16.2.4`, `react@19.2.4`, Radix UI packages, Google OAuth, QR code support, Tailwind 4.
- Both frontends use `output: "standalone"`.
- Both Docker builds run `npm ci` and `npm run build`.
- Both apps run `scripts/sync-images.js` via `predev` and `prebuild`.

Docker and infrastructure:

- `redis`: Redis 7 Alpine, internal network only, health check with `redis-cli ping`.
- `rabbitmq`: RabbitMQ management image, localhost ports `5672` and `15672`, health check with diagnostics ping.
- `db`: SQL Server 2022 Express, localhost port `1433`, persistent `sqldata` volume.
- `licence`: built from sibling `../EcomLicence`, exposed on localhost `15125`, waits for DB health.
- `api`: built from `./backend`, exposed on localhost `15124`, waits for DB, RabbitMQ and Redis health and licence service start.
- `customer`: exposed on localhost `13000`, depends on API container start.
- `admin`: exposed on localhost `13001`, depends on API container start.

Database:

- EF Core migrations are committed.
- 91 migration `.cs` files were found under `backend/src/Ecom.Infrastructure/Persistence/Migrations`.
- API startup calls `DbInitializer.SeedAsync`, which runs `MigrateAsync` and seeds admin/settings/test data.

Messaging/background jobs:

- MassTransit is configured with RabbitMQ when `RabbitMQ:Host` is present; otherwise it falls back to in-memory transport.
- Outbox pattern is implemented through `OutboxMessage` and `OutboxProcessor`.
- Saga state is persisted via EF Core.
- Background jobs include health checks, queue monitor, frontend health, stock alert, outbox retry, session cleanup, docs refresh, verification and i18n jobs in uncommitted work.

Tests:

- No backend test project was found.
- No explicit frontend test script was found in `package.json`.
- Verification is currently documented through custom verification jobs and manual/process logs, not conventional test projects.

CI/CD:

- `ci.yml`: backend build, admin/customer lint and build.
- `docker.yml`: Docker image build/push.
- `deploy.yml`: SSH deploy to server on relevant path changes.
- `deploy-activation-worker.yml`: deploys Cloudflare Worker for activation server.

## 7. Product Goals

Extracted product goals:

- Provide a full-stack e-commerce platform for B2C sales.
- Keep first production focus on stable stock, payment, order and admin operations.
- Provide a customer storefront with product discovery, cart, checkout, account, orders, returns, favourites and content pages.
- Provide an admin operations center for catalog, stock, users, orders, payments, invoices, shipping, campaigns, coupons, reviews, reports, logs, jobs, deploy and settings.
- Support auditability and troubleshooting through audit logs, error logs, verification logs and health dashboards.
- Support extensibility toward marketplace integrations, ERP, multi-seller, loyalty, B2B and mobile after core system stability.
- Enforce licensing and activation controls for application distribution.
- Maintain clear documentation and verification routines as product memory.

## 8. Business and Process Flows

Documented business/process flows include:

- Product purchase:
  - Product listing.
  - Product detail.
  - Add to cart.
  - Cart review.
  - Address selection.
  - Shipping selection.
  - Payment.
  - Order creation.
  - Stock reservation.
  - Payment confirmation.
  - Stock finalization.
  - Notification.

- Payment failure:
  - Order created.
  - Stock reserved.
  - Payment attempted.
  - Payment fails.
  - Order becomes failed/payment failed.
  - Stock reservation released.
  - Customer notified.

- Cancellation:
  - Customer/admin requests cancellation.
  - Order state is validated.
  - If not shipped, order is cancelled.
  - Stock is restored/released.
  - Refund process starts if payment exists.
  - Notification is sent.

- Return:
  - Customer creates return request.
  - Admin reviews.
  - Request approved or rejected.
  - If approved, product is returned.
  - Warehouse check is performed.
  - Refund is completed.
  - Stock is updated.

- External import:
  - Admin defines REST/Excel source.
  - Data is fetched/previewed.
  - Field mapping is applied.
  - Data is imported to product/category/brand/stock.
  - Import job/log is recorded.

- Licence process:
  - Generate RSA keypair/token.
  - Configure public key and token.
  - Validate on startup.
  - Validate per request.
  - Optionally validate online activation.
  - Delegate licence CRUD/assignment to external licence service.

## 9. Documented Technical Architecture

The documented architecture is:

- Backend:
  - .NET 10 ASP.NET Core API.
  - Clean Architecture layers: Domain, Application, Infrastructure, API.
  - CQRS/MediatR command/query handlers.
  - FluentValidation pipeline.
  - EF Core for persistence.
  - Dapper for optimized read queries.
  - SQL Server dev/default and PostgreSQL option.
  - Redis cache with memory fallback.
  - MassTransit + RabbitMQ for messaging.
  - Transactional outbox and order processing saga.
  - JWT auth with licence-derived signing key.
  - RSA-2048 licence validation and online activation.
  - Audit/error/visitor/job logging.

- Frontend:
  - Separate Next.js admin and customer applications.
  - Next.js 16, React 19, Tailwind 4.
  - Admin app for operations.
  - Customer app for shopping.
  - Shared image synchronization from docs image repository.

- Infrastructure:
  - Docker Compose for local/full-stack services.
  - CI/CD through GitHub Actions.
  - Hetzner deployment.
  - Cloudflare Worker for activation.

## 10. Actual Implementation Architecture

Actual implementation found:

- Backend solution includes four main projects in `Ecom.slnx`: API, Application, Domain, Infrastructure.
- `Ecom.Worker` exists but is not listed in the solution file.
- API registers controllers, OpenAPI, health checks, CORS, rate limiting, auth, authorization and custom middleware.
- API startup:
  - Derives JWT key from licence.
  - Builds services.
  - Runs DB migration/seed.
  - Validates licence.
  - Optionally validates online activation.
  - Maps `/health`.
- Infrastructure registers:
  - EF Core with SQL Server/PostgreSQL switch.
  - Redis distributed cache if connection string exists.
  - MassTransit RabbitMQ if configured, in-memory otherwise.
  - Outbox processor hosted service.
  - Many `IJobRunner` background jobs.
  - External licence service HTTP client.
- Docker Compose currently standardizes local/full-stack runtime on SQL Server, Redis, RabbitMQ and the sibling `EcomLicence` service.
- Frontends are standalone Next builds behind Node runtime containers.
- CI validates backend build and frontend lint/build only.

## 11. Documentation vs Implementation Gap Analysis

Concrete gaps:

- API port mismatch:
  - Documentation commonly says API is `http://localhost:5124`.
  - Compose exposes API on `127.0.0.1:15124`.
  - Frontend compose defaults still use `NEXT_PUBLIC_API_URL=http://localhost:5124`.

- Frontend port mismatch:
  - Documentation commonly says customer/admin are `3000` and `3001`.
  - Compose exposes customer/admin as `13000` and `13001`.
  - API CORS defaults still allow `3000` and `3001`, not compose host ports.

- Docker docs mismatch:
  - Ecom local architecture docs mention API port `5000`.
  - Current backend container exposes `8080`; host mapping is `15124`.

- Licence documentation drift:
  - Older docs describe hardcoded public key or in-process licence management.
  - Current implementation expects environment-provided public key and external licence service for admin licence CRUD/assignment.

- Migration documentation drift:
  - Some docs mention migrations not being in git or needing regeneration.
  - Implementation has committed migration files.

- Test documentation drift:
  - Docs mention xUnit/integration test plans.
  - No test project was found.

- Process policy conflict:
  - Documentation says some assistant/context files should not be committed.
  - Ecom contains tracked `frontend/admin/CLAUDE.md` and `frontend/customer/CLAUDE.md`.

- Worker solution gap:
  - `Ecom.Worker` exists but is not included in `Ecom.slnx`.
  - Not verified whether this is intentional.

## 12. Uncommitted Work Analysis - dotnet_ecom_docs

Modified files:

- `DAILY_PROGRESS.md`
- `VERIFICATION_LOG.md`

Staged files:

- None.

Untracked files:

- None.

Deleted files:

- None.

Renamed files:

- None.

Uncommitted Markdown changes:

- `DAILY_PROGRESS.md` adds Session 13 entries for steps 84-86:
  - Analysis page redesign.
  - Deleted-user session termination.
  - Header synchronization after profile updates.
- `VERIFICATION_LOG.md` adds a large block of verification runs from 2026-06-07 through 2026-06-09, with 42-check API/multi-tenant/licence/frontend/jobs/SEO/DB status entries.

Uncommitted source/configuration changes:

- None in this repo.

Safety assessment:

- Mostly safe as documentation-only changes.
- Risk: `VERIFICATION_LOG.md` is large and noisy; review for accidental sensitive operational details before commit.
- Risk: documentation mentions recent successes while implementation has uncommitted Ecom changes that may not yet be verified in this local state.

Conflicts:

- No direct source conflict.
- The new progress/verification docs imply recent work is completed, but corresponding Ecom work is not committed and contains risky untracked i18n/job automation.

## 13. Uncommitted Work Analysis - Ecom

Modified files:

- `backend/.dockerignore`
- `backend/src/Ecom.Infrastructure/DependencyInjection.cs`
- `backend/src/Ecom.Infrastructure/Jobs/JobScheduler.cs`
- `frontend/admin/src/app/(admin)/belgeler/page.tsx`
- `frontend/admin/src/app/(admin)/dashboard/page.tsx`
- `frontend/admin/src/app/(admin)/deploy/page.tsx`
- `frontend/admin/src/app/(admin)/dis-kaynaklar/page.tsx`
- `frontend/admin/src/app/(admin)/dogrulama/page.tsx`
- `frontend/admin/src/app/(admin)/dokuman/page.tsx`
- `frontend/admin/src/app/(admin)/duyurular/page.tsx`
- `frontend/admin/src/app/(admin)/faturalar/page.tsx`
- `frontend/admin/src/app/(admin)/hareketler/page.tsx`
- `frontend/admin/src/app/(admin)/hedefler/page.tsx`
- `frontend/admin/src/app/(admin)/iade/page.tsx`
- `frontend/admin/src/app/(admin)/imajlar/page.tsx`
- `frontend/admin/src/app/(admin)/joblar/page.tsx`
- `frontend/admin/src/app/(admin)/kampanyalar/page.tsx`
- `frontend/admin/src/app/(admin)/kargo/page.tsx`
- `frontend/admin/src/app/(admin)/kategoriler/page.tsx`
- `frontend/admin/src/app/(admin)/kullanicilar/page.tsx`
- `frontend/admin/src/app/(admin)/kuponlar/page.tsx`
- `frontend/admin/src/app/(admin)/kuyruklar/page.tsx`
- `frontend/admin/src/app/(admin)/markalar/page.tsx`
- `frontend/admin/src/app/(admin)/odemeler/page.tsx`
- `frontend/admin/src/app/(admin)/raporlar/page.tsx`
- `frontend/admin/src/app/(admin)/servisler/page.tsx`
- `frontend/admin/src/app/(admin)/siparisler/page.tsx`
- `frontend/admin/src/app/(admin)/stok/page.tsx`
- `frontend/admin/src/app/(admin)/takip/page.tsx`
- `frontend/admin/src/app/(admin)/test/page.tsx`
- `frontend/admin/src/app/(admin)/urunler/page.tsx`
- `frontend/admin/src/app/(admin)/yonetim/page.tsx`
- `frontend/admin/src/app/(admin)/yorumlar/page.tsx`
- `frontend/admin/src/app/(admin)/ziyaretciler/page.tsx`
- `frontend/admin/src/lib/i18n.ts`

Staged files:

- None.

Untracked files:

- `backend/src/Ecom.Infrastructure/Jobs/I18nDictionaryBuilderJob.cs`
- `backend/src/Ecom.Infrastructure/Jobs/I18nPageScannerJob.cs`
- `docker`

Deleted files:

- None.

Renamed files:

- None.

Uncommitted Markdown changes:

- None in Ecom.

Uncommitted source/configuration changes:

- Backend:
  - Registers two new i18n jobs.
  - Changes scheduler behavior to include a schedule window for `I18nDictionaryBuilderJob`.
  - Updates `.dockerignore`.
- Frontend/admin:
  - Widespread i18n refactoring across many admin pages.
  - Large expansion of `frontend/admin/src/lib/i18n.ts`.
- Untracked root `docker` file:
  - Zero-byte file observed earlier.
  - Looks accidental or incomplete.

Safety assessment:

- Risky/incomplete until verified.
- The new i18n jobs write to source/docs files automatically:
  - `frontend/admin/src/lib/i18n.ts`
  - docs repo i18n status/changelog/report files.
- This is unusual for a production background job because runtime code can mutate repository files.
- The scheduler change uses `Turkey Standard Time`; this may be platform-dependent in Linux containers.
- Many frontend files were changed mechanically; build/lint verification is required before commit.

Conflicts:

- Documentation does not yet clearly describe the new automatic i18n job behavior and its write targets.
- Documentation process says documentation updates should be controlled; automatic source/docs mutation may conflict with that process.
- If the i18n jobs run in production containers, they may try to write into paths that do not exist or should be immutable.

## 14. Risks and Inconsistencies

Technical risks:

- Compose API URL/CORS mismatch can break browser requests in local Docker.
- API startup can fail before `/health` due to migration, licence validation or online activation.
- `licence` service uses `condition: service_started`, not a health condition.
- Sibling `../EcomLicence` is required for compose build; onboarding fails if missing.
- The `/opt/ecom/.git:/app/.git:ro` bind mount is Linux/deploy-specific and may not exist in local Windows Docker environments.
- New i18n background jobs can mutate source/docs files at runtime.
- `Turkey Standard Time` may fail on non-Windows/Linux containers depending on timezone data and ID mapping.
- Licence client returns response bodies without checking HTTP success status; downstream callers may receive error JSON as success content. Not verified as a current bug.

Architecture risks:

- Documentation and implementation diverge around port conventions, licence architecture and testing.
- Worker project is present but not in solution.
- Docs describe PostgreSQL production direction but compose still centers SQL Server.

Process risks:

- Large uncommitted work in Ecom should not be mixed with unrelated documentation updates.
- Verification docs claim successful checks, but current uncommitted code was not verified in this analysis.
- Existing docs warn against committing certain assistant/context files, while such files are tracked.

Delivery risks:

- Production blockers remain: domain, SSL, production CORS, licence service production deploy, Iyzico sandbox, real e-invoice provider.
- Lack of automated tests leaves regression risk high for order, stock, licence, tenant and payment flows.

## 15. Missing or Outdated Documentation

Missing/stale docs:

- Docker local setup needs current port mapping:
  - API host `15124`.
  - Customer host `13000`.
  - Admin host `13001`.
- `.env.example` guidance should distinguish:
  - local dev-server mode: API `5124`, frontends `3000/3001`;
  - Docker mode: API `15124`, frontends `13000/13001`.
- CORS guidance should include compose host origins.
- Licence service setup should document:
  - required sibling repo;
  - local compose dependency;
  - `LICENCE_SERVICE_KEY`;
  - production deploy/Nginx path.
- Test documentation should reflect the actual absence of test projects.
- `Ecom/docs/architecture.md` and `Ecom/docs/mvp-plan.md` lag `dotnet-ecom-docs`.
- i18n automation docs are missing for the new uncommitted jobs.
- Worker project purpose and startup flow are not clearly documented.

## 16. Missing or Incomplete Implementation Areas

Known incomplete areas:

- Real Iyzico sandbox end-to-end verification.
- Real e-invoice/e-archive provider integration.
- Production domain/DNS/SSL/Nginx/CORS chain.
- PostgreSQL production migration.
- Automated backend unit/integration tests.
- Automated frontend/E2E tests.
- Compose health check for licence service.
- Stable local Docker browser URL/CORS defaults.
- Documentation-driven i18n automation hardening before production use.

Not verified:

- Whether `Ecom.Worker` is intentionally excluded from solution.
- Whether uncommitted i18n admin page changes compile.
- Whether current compose succeeds with the sibling `EcomLicence` repo and available `.env`.
- Whether current lock files are fully synchronized with `package.json`.

## 17. Recommended Development Roadmap

Short-term:

1. Verify current uncommitted Ecom work without editing:
   - backend build;
   - admin lint/build;
   - customer lint/build;
   - check whether build changes files.
2. Review i18n job design:
   - decide whether automatic file-writing jobs belong in API runtime;
   - restrict to development/manual mode if needed.
3. Resolve local Docker documentation/config mismatch:
   - API URL;
   - CORS origins;
   - frontend host ports.
4. Decide what to do with the untracked root `docker` file.
5. Split commits by concern after verification:
   - i18n infrastructure;
   - admin page i18n changes;
   - documentation updates.

Mid-term:

1. Add a minimal automated test suite:
   - backend build plus selected unit/integration tests;
   - frontend lint/build;
   - smoke checks for `/health`, public product/category/brand endpoints.
2. Add compose smoke verification docs and script.
3. Document licence service production deployment.
4. Add health/readiness handling for licence service.
5. Refresh Ecom local docs to point to `dotnet-ecom-docs` as source of truth or remove duplicated stale content.

Long-term:

1. Complete production readiness:
   - domain;
   - SSL;
   - Nginx;
   - production CORS;
   - production licence service;
   - backup/restore operations.
2. Complete Iyzico sandbox and production payment verification.
3. Complete real e-invoice provider integration.
4. Evaluate PostgreSQL migration path.
5. Add regression coverage for tenant isolation, order/stock/payment flows, licence validation and background jobs.

## 18. Safest First Task

Safest first executable task:

Run a read-only verification pass for the current uncommitted `Ecom` work, without editing files and without starting Docker Compose.

Reason:

- It directly addresses the highest-risk uncommitted implementation area.
- It avoids changing source, docs or infrastructure.
- It confirms whether backend and both frontends still compile/lint/build before any commit or refactor.
- It can reveal whether the i18n changes are mechanically safe.

Expected outcome:

- A pass/fail summary for backend build, admin lint/build and customer lint/build.
- A post-verification `git status --short` to confirm no unexpected file mutations occurred.

## 19. Verification Commands

Run from `C:\PROJECTS\DOTNET\Ecom`:

```powershell
git status --short
dotnet restore backend/src/Ecom.API/Ecom.API.csproj
dotnet build backend/src/Ecom.API/Ecom.API.csproj -c Release --no-restore
cd frontend/admin
npm run lint
npm run build
cd ..\customer
npm run lint
npm run build
cd ..\..
git status --short
git diff --stat
```

Do not run Docker Compose as the first verification task. Compose requires valid `.env` values and the sibling `EcomLicence` repository, and may fail for environment/setup reasons unrelated to the current code changes.

## 20. Next Codex Prompt

Recommended next prompt:

```text
Do not modify files yet.
Do not run destructive commands.
Verify the current Ecom uncommitted work only.

Run:
- git status --short
- dotnet restore backend/src/Ecom.API/Ecom.API.csproj
- dotnet build backend/src/Ecom.API/Ecom.API.csproj -c Release --no-restore
- npm run lint and npm run build in frontend/admin
- npm run lint and npm run build in frontend/customer
- git status --short
- git diff --stat

Report:
1. Which commands passed or failed.
2. Exact failure causes if any.
3. Whether any command unexpectedly changed files.
4. Whether the i18n/job uncommitted work looks safe to continue.
5. No code changes unless I explicitly approve.
```
