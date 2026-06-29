# Backend Architecture & Performance Audit

Date: 2026-06-11  
Scope: `D:/Degusto` backend architecture, API/data-fetch flow, DB access patterns, and request lifecycle.

## Architecture Snapshot

- API boundary is Next.js route handlers under `src/app/api`.
- Business logic is mostly in `src/lib/services`.
- Data access is Prisma via `@white-shop/db` (`shared/db/client.ts`).
- Cross-cutting auth/security is split between `middleware.ts` and `src/lib/middleware/auth.ts`.
- Frontend data fetching uses custom hooks and `apiClient` (no centralized query manager).

## Request/Response Lifecycle (Current)

1. Browser action triggers page SSR/RSC and/or client hook fetch.
2. Route handler parses input and often delegates to service.
3. Service executes Prisma queries (sometimes deep includes).
4. Response is returned with mixed cache/error handling strategy depending on route.
5. Client global providers/hooks may trigger additional requests (`cart`, `profile`, `wishlist`, `compare`, header prefetch/fetch).

---

## A) Current Problems

### 1) Runtime schema patching in request path
- **Where:** `src/lib/utils/db-ensure.ts`, invoked from:
  - `src/lib/services/products-find-query/query-executor.ts`
  - `src/lib/services/products-slug/product-query-builder.ts`
  - `src/lib/services/reviews.service.ts`
- **Why problem:** request path can attempt schema mutation (`CREATE/ALTER`) during runtime.
- **Performance impact:** latency spikes, lock contention risk, noisy retries.
- **Future risk:** migration drift is hidden; failures become production-time incidents.
- **Priority:** **Critical**

### 2) Checkout pricing logic inconsistency
- **Where:** `src/lib/services/orders.checkout.ts`
  - DB cart path prefers `priceSnapshot`.
  - Guest path recomputes from variant base + customization adjustments.
- **Why problem:** two different pricing sources for equivalent business flow.
- **Performance impact:** debugging and reconciliation overhead; inconsistent totals.
- **Future risk:** correctness drift between cart states and order totals.
- **Priority:** **Critical**

### 3) Cart read path is DB-heavy and query-amplified
- **Where:** `src/lib/services/cart.service.ts`
- **Why problem:** deep relation load + per-item customization adjustment queries.
- **Performance impact:** high p95 on `/api/v1/cart` under larger carts.
- **Future risk:** scaling pain with catalog/customization growth.
- **Priority:** **High**

### 4) Duplicate/frequent requests from frontend orchestration
- **Where:** 
  - `src/app/checkout/useCheckout.ts`
  - `src/app/checkout/hooks/useCart.ts`
  - `src/lib/auth/AuthContext.tsx`
  - `src/components/routing/HomeVisibleRoutesWarmup.tsx`
  - `src/components/mobile/MobileRoutePrefetcher.tsx`
  - `src/components/Header.tsx`
- **Why problem:** overlapping refetch/prefetch and repeated hydration fetches.
- **Performance impact:** extra API traffic and backend load.
- **Future risk:** request storms as more global widgets/hooks are added.
- **Priority:** **High**

### 5) Unbounded admin top-products aggregation
- **Where:** `src/lib/services/admin/admin-stats/top-products.ts`
- **Why problem:** `orderItem.findMany` reads all rows, aggregate in JS.
- **Performance impact:** heavy memory and slow admin dashboard at scale.
- **Future risk:** O(n) growth with order history.
- **Priority:** **High**

### 6) Search and filters over-fetch/duplication
- **Where:**
  - `src/app/api/search/instant/route.ts`
  - `src/lib/services/products-find-query/query-executor.ts`
  - `src/lib/services/products-filters.service.ts`
- **Why problem:** duplicated search builder logic, broad include payloads, in-memory filtering.
- **Performance impact:** expensive query plans and payload volume.
- **Future risk:** poor search/filter responsiveness on larger catalogs.
- **Priority:** **High**

### 7) Security and reliability inconsistency
- **Where:** `src/app/api/v1/**`, `src/lib/middleware/auth.ts`, `middleware.ts`
- **Why problem:** uneven DTO/validation coverage, mixed error contracts, narrow rate-limiting scope.
- **Performance impact:** avoidable bad traffic and unstable endpoint behavior.
- **Future risk:** abuse surface and hard-to-debug incidents.
- **Priority:** **Medium**

---

## B) Root Cause Analysis

- **Architecture root cause:** query/business responsibilities are split inconsistently between routes/services/helpers; no strict read-model boundary for hot paths.
- **Frontend root cause:** no single ownership for shared data fetch (cart/profile/categories/currency/prefetch budget).
- **Backend root cause:** legacy defensive fallbacks (`db-ensure`) and duplicated logic evolved in parallel.
- **DB root cause:** some indexes were added, but high-traffic text and join patterns still rely on expensive scans/over-fetch.
- **Why repeated across pages:** global providers and shared components independently trigger fetches on mount/navigation/events.

---

## C) Recommended Solution

### Backend architecture
- Disable runtime schema mutation by default; enforce migration-only schema evolution.
- Move duplicated query logic (search/product retrieval) to shared service/query modules.
- Continue splitting oversized services (`orders.checkout`, `cart.service`, `users.service`) by responsibility.

### API-level
- Standardize endpoint response shapes and selective fields.
- Enforce consistent pagination/limit contracts for list endpoints.
- Introduce unified route telemetry for hot endpoints.

### Database-level
- Replace per-line query multiplication with batched adjustment lookup patterns.
- Convert unbounded admin aggregations to DB-side `groupBy/aggregate`.
- Add text-search indexes (`pg_trgm`) and relation helper indexes where missing.

### Frontend data-fetch
- Remove duplicate checkout cart sync triggers.
- Consolidate profile-role hydration into one inflight path.
- Reduce prefetch fan-out to intent-driven warmups.

### Caching/invalidation
- Keep Redis + Next cache for read-heavy storefront.
- Add deterministic invalidation on relevant mutations.
- Do not blindly cache auth/cart/checkout/stock-sensitive computations.

---

## D) Priority Matrix

- **Critical**
  1. Runtime schema patch behavior in request path.
  2. Checkout pricing consistency between guest and DB cart.
- **High**
  1. Cart read query amplification.
  2. Duplicate frontend fetch/refetch/prefetch load.
  3. Unbounded admin top-products aggregation.
  4. Search/filter over-fetch and duplicated logic.
- **Medium**
  1. Validation/rate-limit/error standardization.
  2. Cross-module coupling cleanup.
- **Low**
  1. Facade/organization hygiene without direct latency effect.

---

## E) Implementation Plan (Phased)

### Phase 1 (Critical first)
1. Disable runtime DDL behavior by default in `db-ensure` call paths; fail fast with clear logs.
2. Unify checkout unit price calculation contract for both guest and DB-cart items.
3. Add endpoint latency telemetry for `/api/v1/cart`, `/api/v1/orders/checkout`, `/api/search/instant`.

### Phase 2 (High quick wins)
1. Remove duplicate checkout cart refetch triggers.
2. Deduplicate `AuthContext` role/profile hydration fetches.
3. Reduce prefetch fan-out from home/mobile/header.
4. Refactor `top-products` to DB-side aggregation.

### Phase 3 (High structural)
1. Extract shared search query builder and selective projection.
2. Batch customization price adjustments in cart/checkout flows.
3. Reduce deep include usage in filters/listing.

### Phase 4 (Stability/Security)
1. Standardize DTO/Zod validation for critical write endpoints.
2. Extend rate limiting to abuse-prone endpoints.
3. Normalize route error mapping.

### Phase 5 (Verification)
1. Compare pre/post request counts and p95 latency.
2. Validate payload size reductions and query-plan improvements.

---

## F) Long-Term Prevention Standards

- Define fetch ownership per shared domain (cart/profile/categories/currency).
- Add API checklist in PRs: pagination, selective fields, cache policy, invalidation policy.
- No route-level business/query duplication when equivalent service exists.
- No runtime schema mutation in request lifecycle.
- Require performance baseline for hot-path changes (`before/after` request count + latency evidence).
