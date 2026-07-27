import ProductsPage from "@/app/[locale]/(storefront)/products/page";

type ComboPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    category?: string;
    min?: string;
    max?: string;
    q?: string;
    diet?: string;
  }>;
};

/**
 * Combos catalog — same shop design as /products, separate route for nav active state.
 * Forces the combo category filter.
 */
export default async function ComboPage({
  params,
  searchParams,
}: ComboPageProps) {
  const sp = await searchParams;

  return (
    <ProductsPage
      params={params}
      searchParams={Promise.resolve({
        ...sp,
        category: "combo",
      })}
    />
  );
}
