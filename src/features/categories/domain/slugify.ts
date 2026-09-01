import { slugifyToAscii } from "@/lib/seo/url-slug";

/** Builds an English/ASCII category slug for storefront URLs. */
export function slugifyCategoryTitle(title: string): string {
  return slugifyToAscii(title, "category");
}
