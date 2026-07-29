import { NextResponse } from "next/server";
import { z } from "zod";

import { searchCatalogSuggestions } from "@/features/products/application/search-catalog-suggestions";
import { isLocale } from "@/lib/i18n/config";

const searchParamsSchema = z.object({
  q: z.string().trim().min(1).max(100),
  locale: z.string().trim().min(2).max(5),
});

/** Public catalog search suggestions for the header dropdown. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const parsed = searchParamsSchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    locale: url.searchParams.get("locale") ?? "",
  });

  if (!parsed.success || !isLocale(parsed.data.locale)) {
    return NextResponse.json({ error: "Invalid search params" }, { status: 400 });
  }

  const items = await searchCatalogSuggestions(
    parsed.data.locale,
    parsed.data.q,
  );

  return NextResponse.json(
    { items },
    {
      headers: {
        "Cache-Control": "private, max-age=30",
      },
    },
  );
}
