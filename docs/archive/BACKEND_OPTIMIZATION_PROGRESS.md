# BACKEND Optimization Progress

## Task 1 — Duplicate and unnecessary request reduction (Critical/High)

- **What problem existed**
  - Multiple components independently requested the same wishlist and recent-orders data.
  - Checkout triggered extra cart refetches even though global cart live-sync already existed.
  - Compare IDs had no inflight deduplication.

- **Where it was located**
  - `src/components/Header.tsx`
  - `src/components/UniversalHeader.tsx`
  - `src/components/hooks/useMobileNavBadgeCounts.ts`
  - `src/lib/wishlist/WishlistIdsProvider.tsx`
  - `src/lib/compare-api.ts`
  - `src/app/checkout/hooks/useCart.ts`
  - `src/app/supersudo/hooks/useAdminDashboard.ts`
  - `src/app/supersudo/hooks/useAdminNewOrderAlerts.ts`

- **What solution was implemented**
  - Extended `WishlistIdsProvider` with shared `wishlistCount` and switched header/mobile consumers to provider-based count instead of re-fetching.
  - Kept compare count fetching but added inflight dedup in `fetchCompareIds`.
  - Updated checkout cart hook to reuse cart drawer live-sync state/reload path, avoiding standalone duplicate fetch loops.
  - Added shared recent-orders fetch cache + inflight dedup (`fetchRecentOrdersShared`) and reused it in both admin dashboard and new-order polling.
  - Added cache invalidation hook for admin new-order alert events.

- **Which files changed**
  - `src/lib/wishlist/WishlistIdsProvider.tsx`
  - `src/components/hooks/useMobileNavBadgeCounts.ts`
  - `src/components/UniversalHeader.tsx`
  - `src/components/Header.tsx`
  - `src/lib/compare-api.ts`
  - `src/app/checkout/hooks/useCart.ts`
  - `src/app/supersudo/hooks/useAdminDashboard.ts`
  - `src/app/supersudo/hooks/useAdminNewOrderAlerts.ts`

- **How to test**
  - Log in and open pages containing `Header`, `UniversalHeader`, and mobile navigation; verify wishlist count is correct and no duplicate wishlist count requests are fired in quick succession.
  - Perform wishlist add/remove and confirm badge updates without extra manual count fetch loops.
  - Open checkout and cart drawer, trigger cart mutations, and verify one synchronized cart refresh path is used.
  - Open admin dashboard and keep it active with new-order alerts enabled; verify `recent-orders` endpoint requests are deduplicated and dashboard still updates correctly.

- **Expected performance improvement**
  - Fewer duplicate client API calls for shared header/cart/admin polling data.
  - Lower request burst during auth/wishlist/cart update events.
  - Reduced backend load for frequently hit `wishlist`, `cart`, and `admin/dashboard/recent-orders` endpoints.

- **Task status**
  - `DONE`

## Task 2 — DB-heavy API optimization (Critical/High)

- **What problem existed**
  - Admin stats computed revenue by loading all matching orders into memory and reducing in JavaScript.
  - User dashboard loaded all user orders with all line items, then computed stats in Node.
  - Product reviews endpoint returned unbounded published review lists (risk of large payload/query time growth).
  - Admin analytics order query selected a larger object graph than needed for calculations.

- **Where it was located**
  - `src/lib/services/admin/admin-stats/stats-calculator.ts`
  - `src/lib/services/users.service.ts`
  - `src/lib/services/reviews.service.ts`
  - `src/app/api/v1/products/[slug]/reviews/route.ts`
  - `src/lib/services/admin/admin-stats/analytics.ts`

- **What solution was implemented**
  - Replaced admin revenue JS reduction with DB aggregate (`db.order.aggregate`) and parallelized dashboard stat queries with `Promise.all`.
  - Refactored user dashboard to use DB-side count/aggregate/groupBy queries and limited recent orders to `take: 5` with `_count.items`, removing full-history + full-items scan.
  - Added server-side pagination for reviews endpoint (`page`, `limit`, defaults 20, max 50) and threaded pagination into review service fast/normal paths.
  - Reduced analytics query payload by switching to explicit `select` tree while preserving existing business calculations.

- **Which files changed**
  - `src/lib/services/admin/admin-stats/stats-calculator.ts`
  - `src/lib/services/users.service.ts`
  - `src/lib/services/reviews.service.ts`
  - `src/app/api/v1/products/[slug]/reviews/route.ts`
  - `src/lib/services/admin/admin-stats/analytics.ts`

- **How to test**
  - Admin dashboard: open `/supersudo`, verify stats render correctly and numbers remain consistent with previous behavior.
  - Profile dashboard: open `/profile` dashboard tab, verify total orders/spent/pending/recent orders still render correctly.
  - Product reviews: call `/api/v1/products/{slug}/reviews` with and without `page`/`limit`, verify default paging and capped limit behavior.
  - Analytics: open admin analytics view and verify charts/top products/top categories still render.

- **Expected performance improvement**
  - Lower DB-to-app payload volume and memory pressure for admin/profile statistics endpoints.
  - Lower response times for dashboard-related endpoints under larger order history.
  - Controlled response sizes for reviews API and reduced risk of request-time spikes on products with many reviews.

- **Task status**
  - `DONE`

## Task 3 — Indexing and query-path hardening (Critical/High)

- **What problem existed**
  - Hot query paths relied on filters/sorts/joins without full index coverage.
  - Shop/category/product paths and variant/attribute joins risked slower execution as data volume grows.

- **Where it was located**
  - `shared/db/prisma/schema.prisma`
  - `shared/db/prisma/migrations/*`
  - Query paths in:
    - `src/lib/services/products-find-query/query-builder.ts`
    - `src/lib/services/shop-page/shop-page-data.service.ts`
    - `src/lib/services/shop-page/shop-page-category-counts.ts`

- **What solution was implemented**
  - Added Prisma model indexes:
    - `Product`: `primaryCategoryId`, `updatedAt(desc)`, `discountPercent`
    - `ProductVariant`: `(published, price)`, `(published, stock)`
    - `AttributeValue`: `attributeId`
    - `ProductVariantOption`: `variantId`
  - Added SQL migration `20260610173000_add_hot_path_indexes` with explicit `CREATE INDEX IF NOT EXISTS` for the above plus `_ProductCategories("A")` helper index.

- **Which files changed**
  - `shared/db/prisma/schema.prisma`
  - `shared/db/prisma/migrations/20260610173000_add_hot_path_indexes/migration.sql`

- **How to test**
  - Run Prisma migration apply in target env.
  - Execute representative shop/category/admin product queries and compare execution plans (`EXPLAIN ANALYZE`) before/after.
  - Validate no regression in product listing/category filtering/variant filtering endpoints.

- **Expected performance improvement**
  - Faster filtered scans and joins on product/category/variant/attribute paths.
  - Lower DB CPU/time for frequently hit storefront queries and admin filtering paths.

- **Task status**
  - `DONE`

## Task 4 — Caching and invalidation normalization (High)

- **What problem existed**
  - User dashboard endpoint always recomputed heavy stats and recent orders.
  - No explicit short-lived cache/invalidation strategy for user dashboard reads after checkout/address mutations.

- **Where it was located**
  - `src/app/api/v1/users/dashboard/route.ts`
  - `src/app/api/v1/orders/checkout/route.ts`
  - `src/app/api/v1/users/addresses/route.ts`
  - `src/app/api/v1/users/addresses/[addressId]/route.ts`
  - `src/app/api/v1/users/addresses/[addressId]/default/route.ts`

- **What solution was implemented**
  - Added dedicated user dashboard cache helper with TTL:
    - `src/lib/cache/user-dashboard-cache.ts`
    - Keyed by user id, TTL 30s (`user:dashboard:v1:{userId}`)
  - Integrated read-through caching into `/api/v1/users/dashboard` with `X-Cache: HIT|MISS` response header.
  - Added targeted invalidation after mutating flows that affect dashboard stats:
    - checkout success
    - address create/update/delete/default changes

- **Which files changed**
  - `src/lib/cache/user-dashboard-cache.ts`
  - `src/app/api/v1/users/dashboard/route.ts`
  - `src/app/api/v1/orders/checkout/route.ts`
  - `src/app/api/v1/users/addresses/route.ts`
  - `src/app/api/v1/users/addresses/[addressId]/route.ts`
  - `src/app/api/v1/users/addresses/[addressId]/default/route.ts`

- **How to test**
  - Call `/api/v1/users/dashboard` twice and confirm first response `X-Cache: MISS`, second `X-Cache: HIT`.
  - Complete checkout or mutate address and verify subsequent dashboard call returns `MISS` (cache invalidated), then `HIT`.
  - Confirm dashboard payload remains functionally identical.

- **Expected performance improvement**
  - Reduced repeated expensive dashboard recomputation for bursty profile tab visits.
  - Lower backend/DB load from repeated user dashboard calls within short windows.

- **Task status**
  - `DONE`

## Task 5 — Architecture hygiene for touched optimized endpoints (High)

- **What problem existed**
  - Optimized reviews endpoint still had ad-hoc inline validation blocks.
  - Validation style inconsistencies increase maintenance risk and response-shape drift.

- **Where it was located**
  - `src/app/api/v1/products/[slug]/reviews/route.ts`

- **What solution was implemented**
  - Extracted and centralized review create payload validation into `validateReviewCreatePayload`.
  - Enforced consistent validation error payload using existing problem type (`validationError`) and shared route error handling path.
  - Kept endpoint contract unchanged while reducing repeated inline validation branches.

- **Which files changed**
  - `src/app/api/v1/products/[slug]/reviews/route.ts`

- **How to test**
  - Send invalid review create payloads (missing rating, non-number rating, out-of-range rating, non-string comment) and verify deterministic 400 responses.
  - Send valid payload and verify review is created as before.

- **Expected performance improvement**
  - Small direct performance gain; primary benefit is maintainability and reduced validation drift risk in optimized paths.

- **Task status**
  - `DONE`

## Task 6 — Migration apply and runtime verification (Critical)

- **What problem existed**
  - New indexing migration had to be applied in a non-interactive environment, and the existing migration chain had an order/compatibility mismatch around `order_number_sequence`.

- **Where it was located**
  - `shared/db/prisma/migrations/20260605120000_order_number_sequence/migration.sql`
  - `shared/db/prisma/migrations/20260605130000_order_number_sequence/migration.sql`
  - `shared/db/prisma/migrations/20260610173000_add_hot_path_indexes/migration.sql`
  - Migration execution path via `@white-shop/db` scripts.

- **What solution was implemented**
  - Switched migration apply to non-interactive compatible command (`prisma migrate deploy`) in this execution context.
  - Added missing migration file for expected historical folder (`20260605120000_order_number_sequence`) to reconcile migration history.
  - Made both `order_number_sequence` migration SQL files idempotent:
    - `CREATE TABLE IF NOT EXISTS ...`
    - `INSERT ... ON CONFLICT ("id") DO UPDATE`
  - Applied migrations successfully; `20260610173000_add_hot_path_indexes` was applied.
  - Ran TypeScript full check after apply and fixed resulting strict typing regressions in optimized files.

- **Which files changed**
  - `shared/db/prisma/migrations/20260605120000_order_number_sequence/migration.sql`
  - `shared/db/prisma/migrations/20260605130000_order_number_sequence/migration.sql`
  - `src/lib/services/admin/admin-stats/stats-calculator.ts`
  - `src/lib/services/users.service.ts`
  - `src/app/api/v1/products/[slug]/reviews/route.ts`

- **How to test**
  - Run `pnpm --filter @white-shop/db db:migrate:deploy` and verify no pending errors.
  - Run `pnpm exec tsc --noEmit` and verify success.
  - Smoke API checks:
    - `GET /api/v1/users/dashboard` (expect `X-Cache` header behavior)
    - `GET /api/v1/products/{slug}/reviews?page=1&limit=20`
    - Admin dashboard stats endpoints.

- **Expected performance improvement**
  - Indexes are now physically applied in DB, enabling real query-speedup benefits on hot paths.
  - Migration chain reliability improved for subsequent deploys.

- **Task status**
  - `DONE`

## Task 7 — Targeted API smoke validation after rollout (Critical)

- **What problem existed**
  - Needed runtime proof that optimized endpoints behave correctly after migration and code changes.

- **Where it was located**
  - `src/app/api/v1/products/[slug]/reviews/route.ts`
  - `src/app/api/v1/users/dashboard/route.ts`
  - `src/app/api/v1/users/addresses/route.ts`

- **What solution was implemented**
  - Ran live smoke checks against local dev server using real API flows:
    - Auto-discovered valid product slug from `/api/v1/products`
    - Verified reviews pagination endpoint with `limit=1` and `limit=50`
    - Registered a fresh test user and validated dashboard cache behavior:
      - first call: `X-Cache=MISS`
      - second call: `X-Cache=HIT`
    - Created address to trigger invalidation and validated next dashboard call returns `X-Cache=MISS`

- **Which files changed**
  - `BACKEND_OPTIMIZATION_PROGRESS.md` (this verification record)

- **How to test**
  - Start app: `pnpm dev`
  - Reviews pagination:
    - `GET /api/v1/products/{validSlug}/reviews?page=1&limit=1&lang=en`
    - `GET /api/v1/products/{validSlug}/reviews?page=1&limit=50&lang=en`
  - Dashboard cache/invalidation:
    - Create/login user
    - Call `/api/v1/users/dashboard` twice (expect MISS then HIT)
    - Create/update address
    - Call dashboard again (expect MISS)

- **Expected performance improvement**
  - Verified cache hit path works and invalidation is targeted, reducing repeated heavy dashboard reads while preserving freshness on user mutations.

- **Task status**
  - `DONE`

## Task 8 — Critical architecture safety and pricing consistency hardening

- **What problem existed**
  - Runtime DB schema patching (`CREATE/ALTER`) could run inside request paths via `db-ensure`, masking migration drift and creating production latency/lock risk.
  - Checkout pricing had inconsistent logic: DB-cart flow could use `priceSnapshot`, while guest flow recomputed from variant + customizations.
  - There was no unified baseline telemetry for key hot endpoints to compare improvements across phases.

- **Where it was located**
  - `src/lib/utils/db-ensure.ts`
  - `src/lib/services/orders.checkout.ts`
  - `src/app/api/v1/cart/route.ts`
  - `src/app/api/v1/orders/checkout/route.ts`
  - `src/app/api/search/instant/route.ts`

- **What solution was implemented**
  - Added fail-safe guard in `db-ensure`: runtime schema patching is now disabled by default and only allowed when `ENABLE_RUNTIME_SCHEMA_PATCH=1`.
  - Normalized checkout unit-price calculation so DB cart line pricing also recomputes from variant base + customization adjustments (same contract as guest flow).
  - Added explicit endpoint-level performance logs (`durationMs`, payload metadata) for:
    - `GET /api/v1/cart`
    - `POST /api/v1/orders/checkout`
    - `GET /api/search/instant`

- **Which files changed**
  - `src/lib/utils/db-ensure.ts`
  - `src/lib/services/orders.checkout.ts`
  - `src/app/api/v1/cart/route.ts`
  - `src/app/api/v1/orders/checkout/route.ts`
  - `src/app/api/search/instant/route.ts`

- **How to test**
  - Start app and call hot endpoints; verify perf logs appear:
    - `[perf] GET /api/v1/cart`
    - `[perf] POST /api/v1/orders/checkout`
    - `[perf] GET /api/search/instant`
  - Validate checkout totals for both authenticated cart checkout and guest checkout with identical customizations; totals should be consistent.
  - In a migration-drift simulation, confirm runtime DDL is not attempted unless `ENABLE_RUNTIME_SCHEMA_PATCH=1` is explicitly set.

- **Expected performance improvement**
  - Prevents runtime schema mutation overhead in production request flow (stability and tail-latency improvement).
  - Reduces pricing drift/debug complexity by enforcing a single pricing contract.
  - Establishes measurable latency baseline for subsequent High-priority optimizations.

- **Task status**
  - `DONE`

## Task 9 — High-priority duplicate-request and hotspot query optimizations

- **What problem existed**
  - Checkout still triggered redundant cart reload logic despite global cart synchronization and optimistic events.
  - Currency rates API calls had cache but no inflight dedup guard, allowing concurrent duplicate requests.
  - Auth role hydration could issue duplicate `/api/v1/users/profile` calls from two separate paths.
  - Home/mobile route warmups prefetch fan-out was too aggressive for initial page load.
  - Admin top-products endpoint loaded all order items in memory and aggregated in Node.js.

- **Where it was located**
  - `src/app/checkout/useCheckout.ts`
  - `src/app/checkout/hooks/useCart.ts`
  - `src/lib/currency.ts`
  - `src/lib/auth/AuthContext.tsx`
  - `src/components/mobile/MobileRoutePrefetcher.tsx`
  - `src/components/routing/HomeVisibleRoutesWarmup.tsx`
  - `src/lib/services/admin/admin-stats/top-products.ts`

- **What solution was implemented**
  - Removed eager checkout `fetchCart()` call and unused fetch binding in checkout hook usage.
  - Updated checkout cart event handler to skip reload when `skipReconcile` flag is present.
  - Added `currencyRatesInFlight` dedup promise to prevent parallel `/api/v1/currency-rates` calls.
  - Consolidated auth role hydration to a single async path (`hydrateRolesIfMissing`) and removed second duplicate fetch effect.
  - Reduced warmup prefetch budget:
    - Mobile prefetch routes limited to top core routes.
    - Home warmup caps category/product prefetch counts.
  - Rewrote top-products data path to DB-side aggregation using `groupBy` + targeted variant/product lookup (no full order_items scan).

- **Which files changed**
  - `src/app/checkout/useCheckout.ts`
  - `src/app/checkout/hooks/useCart.ts`
  - `src/lib/currency.ts`
  - `src/lib/auth/AuthContext.tsx`
  - `src/components/mobile/MobileRoutePrefetcher.tsx`
  - `src/components/routing/HomeVisibleRoutesWarmup.tsx`
  - `src/lib/services/admin/admin-stats/top-products.ts`

- **How to test**
  - Checkout flow: mutate cart and verify `cart-updated` events with `skipReconcile` do not trigger extra `/api/v1/cart` fetches.
  - Currency: trigger multiple components calling `initializeCurrencyRates()` on mount; verify one active network request path.
  - Auth: login with missing roles in cookie payload and verify single profile hydration call.
  - Home/mobile navigation: inspect network activity on first load; prefetch requests should be reduced compared to previous behavior.
  - Admin dashboard: open top-products widget and verify values still render correctly while DB load profile is reduced.

- **Expected performance improvement**
  - Lower duplicate request volume on checkout/auth/currency hot paths.
  - Reduced background prefetch bandwidth and API pressure during first paint.
  - Significant memory and latency improvement for admin top-products as order history grows.

- **Task status**
  - `DONE`

## Task 10 — Verification and baseline metrics capture (Critical/High rollout validation)

- **What problem existed**
  - Needed measurable post-change evidence (type/lint correctness + endpoint latency samples) to validate optimization impact and identify remaining hotspots.

- **Where it was located**
  - Verification targets:
    - `src/app/api/search/instant/route.ts`
    - `src/app/api/v1/cart/route.ts`
    - `src/app/api/v1/orders/checkout/route.ts`
    - `src/lib/services/orders.checkout.ts`
    - `src/lib/services/admin/admin-stats/top-products.ts`
    - `src/lib/auth/AuthContext.tsx`
    - `src/lib/currency.ts`
    - `src/app/checkout/*`
    - `src/lib/utils/db-ensure.ts`

- **What solution was implemented**
  - Ran strict static verification on changed files:
    - `pnpm exec tsc --noEmit` ✅
    - targeted `eslint` for all touched files ✅
  - Captured runtime sample latency (local dev) for key endpoints:
    - `/api/search/instant?q=chicken&limit=8` avg ~1190ms (3 samples)
    - `/api/search/instant?q=taco&limit=8` avg ~922ms (3 samples)
    - `/api/v1/cart` avg ~19ms (3 samples)
  - Confirmed cart endpoint now logs perf telemetry and remains fast on warm path.
  - Confirmed search endpoint remains main latency hotspot (as expected from text-search strategy); this is now measurable for next optimization phase (shared search query/indexing).

- **Which files changed**
  - `BACKEND_OPTIMIZATION_PROGRESS.md` (verification record only)

- **How to test**
  - Run:
    - `pnpm exec tsc --noEmit`
    - `pnpm exec eslint <changed-files...>`
  - With dev server running, sample latencies:
    - `GET /api/search/instant?q=<term>&limit=8`
    - `GET /api/v1/cart`
  - Verify server logs contain:
    - `[perf] GET /api/search/instant`
    - `[perf] GET /api/v1/cart`
    - `[perf] POST /api/v1/orders/checkout` (trigger via checkout flow)

- **Expected performance improvement**
  - Provides stable baseline to quantify next phases.
  - Confirms applied changes did not regress cart hot path and highlights remaining search bottleneck for focused follow-up.

- **Task status**
  - `DONE`

## Task 11 — Phase 3 structural optimization: shared search logic + batched customization pricing

- **What problem existed**
  - Instant search and catalog search duplicated the same query predicate logic, which caused maintenance drift risk and inconsistent optimization evolution.
  - Cart and checkout pricing flows recalculated customization adjustments with per-line DB calls (`N+1`-like multiplication) for both DB-cart and guest-cart paths.

- **Where it was located**
  - `src/app/api/search/instant/route.ts`
  - `src/lib/services/products-find-query/query-builder.ts`
  - `src/lib/cart/attribute-price-adjustment.ts`
  - `src/lib/services/cart.service.ts`
  - `src/lib/services/orders.checkout.ts`

- **What solution was implemented**
  - Introduced shared search filter module:
    - `src/lib/services/products-find-query/search-filter.ts`
  - Rewired both instant search and catalog query builder to use the same `buildProductSearchWhere(...)`.
  - Added batched pricing adjustment API:
    - `sumLineCustomizationPriceAdjustmentsByVariant(...)` in `attribute-price-adjustment.ts`
  - Replaced per-item adjustment calls with batched variant-level adjustment resolution in:
    - cart read path (`cart.service.ts`)
    - checkout DB cart resolution (`orders.checkout.ts`)
    - checkout guest cart resolution (`orders.checkout.ts`)
  - Kept existing single-item helper for backward compatibility by internally delegating to the batched function.

- **Which files changed**
  - `src/lib/services/products-find-query/search-filter.ts` (new)
  - `src/lib/services/products-find-query/query-builder.ts`
  - `src/app/api/search/instant/route.ts`
  - `src/lib/cart/attribute-price-adjustment.ts`
  - `src/lib/services/cart.service.ts`
  - `src/lib/services/orders.checkout.ts`

- **How to test**
  - Search parity:
    - Call instant search (`/api/search/instant?q=...`) and catalog search/listing with same term; verify matching relevance behavior and no regressions.
  - Cart pricing:
    - Build cart with multiple customized lines; verify totals and per-line prices match expected values before/after changes.
  - Checkout parity:
    - Run both authenticated cart checkout and guest checkout with equivalent customizations; verify consistent unit price/total behavior.
  - Static checks:
    - `pnpm exec tsc --noEmit`
    - targeted `eslint` on touched files.

- **Expected performance improvement**
  - Reduced query count and lower tail latency for cart/checkout flows with multiple customized items.
  - Lower maintenance risk and easier future optimization from a single shared search predicate source.

- **Task status**
  - `DONE`

## Task 12 — Phase 4 stability/security hardening (validation + rate limit + unified errors)

- **What problem existed**
  - Critical write/public endpoints still had ad-hoc validation and inconsistent error response shaping.
  - Abuse-prone endpoints (`contact`, `checkout`, `cart/items`) had weak/no explicit public rate limiting coverage.
  - Error handling across these endpoints did not consistently use shared API error mapping.

- **Where it was located**
  - `src/app/api/v1/contact/route.ts`
  - `src/app/api/v1/orders/checkout/route.ts`
  - `src/app/api/v1/cart/items/route.ts`
  - `middleware.ts`
  - Schema layer under `src/lib/schemas/*`

- **What solution was implemented**
  - Added dedicated Zod schemas:
    - `src/lib/schemas/contact.schema.ts`
    - `src/lib/schemas/cart.schema.ts`
    - `src/lib/schemas/checkout.schema.ts`
  - Added shared per-route rate limit helper:
    - `src/lib/http/route-rate-limit.ts`
  - Updated contact endpoint to:
    - apply route-level rate limiting
    - validate via `safeParseContact`
    - return RFC7807 problem payloads for validation failures
    - use `apiRouteCatchErrorResponse` in catch path
  - Updated cart items endpoint to:
    - apply route-level rate limiting
    - validate request body via `safeParseCartItemRequest`
    - return standardized validation problem responses
  - Updated checkout endpoint to:
    - apply route-level rate limiting
    - validate input shape via `safeParseCheckout`
    - route catch errors through `apiRouteCatchErrorResponse`
  - Extended middleware with a focused public POST endpoint limiter for:
    - `/api/v1/contact`
    - `/api/v1/orders/checkout`
    - `/api/v1/cart/items`

- **Which files changed**
  - `src/lib/http/route-rate-limit.ts` (new)
  - `src/lib/schemas/contact.schema.ts` (new)
  - `src/lib/schemas/cart.schema.ts` (new)
  - `src/lib/schemas/checkout.schema.ts` (new)
  - `src/app/api/v1/contact/route.ts`
  - `src/app/api/v1/cart/items/route.ts`
  - `src/app/api/v1/orders/checkout/route.ts`
  - `middleware.ts`

- **How to test**
  - Validation:
    - send invalid payloads to contact/cart items/checkout and confirm 400 Problem Details payloads.
  - Rate limits:
    - burst POST requests to the three endpoints and confirm 429 with `Retry-After`.
  - Error shaping:
    - force service/database errors and confirm standardized API error mapping via shared route error handler.

- **Expected performance improvement**
  - Indirect performance gain by rejecting invalid and abusive traffic earlier.
  - Improved reliability/operational consistency due to shared error and validation handling.

- **Task status**
  - `DONE`

## Task 13 — Final end-to-end verification after ideal hardening

- **What problem existed**
  - Needed full confidence that post-hardening code remains type-safe, lint-clean, and behaviorally correct for validation and rate-limit paths.

- **Where it was located**
  - Verification scope included:
    - `src/app/api/v1/contact/route.ts`
    - `src/app/api/v1/cart/items/route.ts`
    - `src/app/api/v1/orders/checkout/route.ts`
    - `src/lib/http/route-rate-limit.ts`
    - `src/lib/schemas/contact.schema.ts`
    - `src/lib/schemas/cart.schema.ts`
    - `src/lib/schemas/checkout.schema.ts`
    - `middleware.ts`

- **What solution was implemented**
  - Ran strict checks and fixed one type mismatch (`customizations` typing) in cart schema.
  - Re-ran checks successfully:
    - `pnpm exec tsc --noEmit` ✅
    - targeted `eslint` on phase-4 files ✅
  - Executed runtime smoke tests against dev server:
    - invalid contact payload → 400 Problem Details ✅
    - invalid cart item payload → 400 Problem Details ✅
    - invalid checkout payload → 400 Problem Details ✅
  - Verified endpoint rate limiting behavior:
    - repeated POST `/api/v1/contact` hit first `429` on request #8 (configured behavior) ✅

- **Which files changed**
  - `src/lib/schemas/cart.schema.ts` (typing fix)
  - `BACKEND_OPTIMIZATION_PROGRESS.md` (verification record)

- **How to test**
  - Static checks:
    - `pnpm exec tsc --noEmit`
    - `pnpm exec eslint <phase-4 files>`
  - Runtime:
    - send invalid bodies to contact/cart-items/checkout and verify 400 Problem Details payload.
    - send burst contact POST requests and verify 429 with retry behavior.

- **Expected performance improvement**
  - Confirms stability and correctness of the hardened request gate paths.
  - Ensures invalid/abusive requests are rejected early without regressions in API contracts.

- **Task status**
  - `DONE`

## Task 14 — Full-project re-audit and high-impact hardening pass (v2)

- **What problem existed**
  - Re-audit surfaced systemic risk patterns still present in live paths:
    - production error-detail leakage from multiple endpoints
    - checkout validation was parsed but raw body still passed to service
    - route rate limiter failed open when Upstash config was missing
    - R2 proxy exposed unrestricted key paths

- **Where it was located**
  - `src/app/api/search/instant/route.ts`
  - `src/app/api/v1/delivery/price/route.ts`
  - `src/app/api/v1/products/[slug]/details/route.ts`
  - `src/app/api/v1/products/filters/route.ts`
  - `src/app/api/v1/products/price-range/route.ts`
  - `src/app/api/v1/orders/checkout/route.ts`
  - `src/lib/schemas/checkout.schema.ts`
  - `src/lib/http/route-rate-limit.ts`
  - `src/app/api/r2/[...key]/route.ts`
  - `src/lib/http/error-detail.ts` (new)

- **What solution was implemented**
  - Added shared production-safe error detail utility:
    - `publicErrorDetailFromUnknown(...)` in `src/lib/http/error-detail.ts`
  - Switched high-traffic routes to masked error detail behavior via shared utility.
  - Strengthened checkout boundary validation:
    - expanded `checkoutSchema` to structured nested fields and bounded arrays/strings
    - route now passes `parsed.data` into `ordersService.checkout(...)`
  - Hardened rate-limit fallback:
    - `enforceRouteRateLimit` now fails closed with 503 in production when Upstash config is absent.
  - Restricted R2 proxy surface:
    - added explicit public key prefix allowlist in `/api/r2/[...key]` route; disallowed prefixes return 403.

- **Which files changed**
  - `src/lib/http/error-detail.ts` (new)
  - `src/lib/http/route-rate-limit.ts`
  - `src/lib/schemas/checkout.schema.ts`
  - `src/app/api/v1/orders/checkout/route.ts`
  - `src/app/api/search/instant/route.ts`
  - `src/app/api/v1/delivery/price/route.ts`
  - `src/app/api/v1/products/[slug]/details/route.ts`
  - `src/app/api/v1/products/filters/route.ts`
  - `src/app/api/v1/products/price-range/route.ts`
  - `src/app/api/r2/[...key]/route.ts`

- **How to test**
  - Error masking:
    - force internal error in the updated routes and verify production-safe generic detail in response.
  - Checkout validation:
    - send malformed checkout payload (invalid `items`, long `notes`, missing required fields) and verify deterministic validation errors.
  - Rate limit fail-closed:
    - in production-like env with missing Upstash vars, route limiter should return 503 (not silently bypass).
  - R2 allowlist:
    - request allowed key prefixes (e.g. `products/...`) should work.
    - request non-allowed prefix should return 403.

- **Expected performance improvement**
  - Reduced risk of abusive traffic impact from fail-open rate limiting behavior.
  - Better request filtering at boundary level for checkout (less wasted deep-service processing).
  - Smaller information disclosure surface from standardized internal error masking.

- **Task status**
  - `DONE`
