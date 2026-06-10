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
