# Degusto Migration Implementation

## Post-Migration Category Duplication Incident

### Symptom

Storefront category navigation showed near-duplicate entries (e.g. Salads / Salads, Pizza / Pizza, Burgers & sandwiches / Burgers and sandwiches).

### Root cause

Classification: **A. SEED_AND_DEGUSTO_BOTH_VISIBLE**

| Source | Count | Storefront status |
|---|---:|---|
| Degusto imported | 27 | ACTIVE |
| Demo/figma seed | 26 | ACTIVE |
| Other | 0 | — |

`listStorefrontCategories` loaded **all** ACTIVE top-level categories with no seed vs Degusto distinction.

Identity rule (not title matching): demo seed entity IDs use prefix `01900000-` (`src/db/seed/seed-uuid.ts`). Degusto migration category IDs do not.

### Fix

Filter demo seed categories out of customer-facing category lists only:

- `src/features/categories/application/list-storefront-categories.ts`
- helper `isDemoSeedEntityId()` in `src/db/seed/seed-uuid.ts`

Seed rows remain in DB (admin/dev). No category deletes or merges.

Visible after fix: **27** Degusto categories.

---

## Post-Migration PDP 404 Incident

### Symptom

Some product PDP URLs returned 404 after migration, especially around locale changes.

### Root cause

Classification: **B. WRONG_LOCALE_SLUG**

| Check | Result |
|---|---|
| ACTIVE Degusto products | 734 |
| Distinct hy≠en slugs | 707 |
| Distinct ru≠en slugs | 712 |
| Listing eligibility | `status = ACTIVE` + `deleted_at IS NULL` |
| PDP eligibility | same |
| ARCHIVED listed on storefront | no |
| Within-Degusto slug dupes | 0 |
| Cross collisions with seed | 0 |

Canonical card href uses `product.translation.slug` for the **current** locale (correct).

`LocaleSwitcher` / `LocaleCurrencySwitcher` only rewrite `/{locale}/…` and **keep the previous slug**:

```text
/en/products/pesto-pizza  → switch HY → /hy/products/pesto-pizza
```

PDP previously queried only `translations->{locale}->>'slug'`, so the English slug under `/hy/...` did not match `hy` slug (`պեստո-պիցցա`) → `notFound()`.

Not caused by ARCHIVED-in-listing mismatch (listing and PDP both require ACTIVE).

### Fixes

1. `getProductBySlug` matches slug in **any** locale (`hy` / `en` / `ru`).
2. PDP page redirects to the canonical slug for the active locale when the route slug differs.

Files:

- `src/features/products/queries.ts`
- `src/app/[locale]/(storefront)/products/[slug]/page.tsx`

ARCHIVED products remain hidden from storefront listing and PDP (unchanged policy).

---

## Post-Migration Demo Seed Products on Storefront

### Symptom

Home «նորույթներ» / featured strip and `/products/[slug]` resolved Figma demo catalog rows (e.g. `DG-MEXICAN-001`, slug `mexican-01-hy`) instead of Degusto-imported products.

### Root cause

Classification: **A. SEED_AND_DEGUSTO_BOTH_VISIBLE** (products)

Demo/figma seed products use ID prefix `01900000-` (same rule as categories). Storefront product queries loaded all ACTIVE products with no seed filter. Categories had already been filtered; products had not.

### Fix

Exclude demo seed product IDs from storefront catalog eligibility:

- `activeCatalogWhere` in `src/features/products/queries.ts` (featured, catalog page, PDP, related)
- cart `addToCart` rejects demo seed IDs
- category product counts exclude seed products

Seed rows remain in DB (admin/dev). No product deletes. Cache keys bumped with `degusto-only-v1`.

---

### Full Storefront Verification

Diagnostic: `scripts/degusto-import/verify-storefront-pdp.ts` → `scripts/degusto-import/state/storefront-pdp-verify.json`

```text
ACTIVE products tested: 734
HY resolvable: 734/734
EN resolvable: 734/734
RU resolvable: 734/734
Cross-locale switch recovery (EN slug under HY): 707/707 (0 fail)
Storefront categories after seed filter: 27 (26 seed hidden)
```

Regression: `src/db/seed/seed-uuid.test.ts`

---

## Data safety (this incident)

```text
Products deleted: 0
Categories deleted: 0
Degusto media changed: 0
R2 changed: 0
Migration state changed: 0
```
