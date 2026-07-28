import { isComboSlug } from "@/features/products/ui/shop/combo-slug";

export type CatalogHrefInput = {
  category?: string;
  page?: number;
  min?: string;
  max?: string;
  q?: string;
  diet?: string;
};

/** Pure catalog URL builder — safe for server and client components. */
export function buildCatalogHref(
  locale: string,
  input: CatalogHrefInput,
): string {
  if (input.category && isComboSlug(input.category)) {
    const params = new URLSearchParams();
    if (input.page && input.page > 1) params.set("page", String(input.page));
    if (input.min) params.set("min", input.min);
    if (input.max) params.set("max", input.max);
    if (input.q) params.set("q", input.q);
    if (input.diet && input.diet !== "none") params.set("diet", input.diet);
    const query = params.toString();
    return query ? `/${locale}/combo?${query}` : `/${locale}/combo`;
  }

  const params = new URLSearchParams();
  if (input.category && input.category !== "all") {
    params.set("category", input.category);
  } else if (input.category === "all") {
    params.set("category", "all");
  }
  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.min) params.set("min", input.min);
  if (input.max) params.set("max", input.max);
  if (input.q) params.set("q", input.q);
  if (input.diet && input.diet !== "none") params.set("diet", input.diet);
  const query = params.toString();
  return query ? `/${locale}/products?${query}` : `/${locale}/products`;
}
