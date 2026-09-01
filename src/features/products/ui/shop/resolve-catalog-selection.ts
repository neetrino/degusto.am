import {
  resolveStorefrontCategory,
  shouldCanonicalizeCategoryParam,
  type StorefrontCategoryMatch,
} from "@/features/categories/domain/resolve-storefront-category";
import {
  buildCatalogHref,
  type CatalogHrefInput,
} from "@/features/products/ui/shop/build-catalog-href";
import { isComboSlug } from "@/features/products/ui/shop/combo-slug";

export type CatalogSelection = {
  selectedSlug: string;
  categoryId: string | null;
  canonicalHref: string | null;
};

/** Resolves `?category=` to a catalog filter and optional 308 target. */
export function resolveCatalogSelection(
  locale: string,
  requestedCategory: string,
  categories: readonly StorefrontCategoryMatch[],
  hrefInput: Omit<CatalogHrefInput, "category">,
): CatalogSelection {
  const matched = resolveStorefrontCategory(categories, requestedCategory);
  const selectedSlug = matched?.slug ?? requestedCategory;
  const comboHref =
    isComboSlug(requestedCategory) && requestedCategory !== "combo"
      ? buildCatalogHref(locale, { ...hrefInput, category: "combo" })
      : null;
  const shouldRedirect =
    Boolean(matched) &&
    shouldCanonicalizeCategoryParam(requestedCategory, selectedSlug);

  return {
    selectedSlug,
    categoryId: matched?.id ?? null,
    canonicalHref:
      comboHref ??
      (shouldRedirect
        ? buildCatalogHref(locale, {
            ...hrefInput,
            category: selectedSlug,
          })
        : null),
  };
}
