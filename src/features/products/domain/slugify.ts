import { slugifyToAscii } from "@/lib/seo/url-slug";

/** Builds an English/ASCII product slug for storefront URLs. */
export function slugifyProductTitle(title: string): string {
  return slugifyToAscii(title, "product");
}
