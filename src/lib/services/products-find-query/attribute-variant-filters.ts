import type { Prisma } from "@prisma/client";
import type { ProductFilters } from "./types";
import { normalizeFilterList } from "./list-query-helpers";

type AttributeKey = "color" | "size";

/**
 * Matches a variant option against one filter token using the same resolution order as
 * legacy in-memory filtering: locale translation → fallback translation → value / legacy option.
 */
function buildOptionTokenMatchConditions(
  attributeKey: AttributeKey,
  token: string,
  lang: string
): Prisma.ProductVariantOptionWhereInput[] {
  return [
    {
      attributeKey,
      value: { equals: token, mode: "insensitive" },
    },
    {
      attributeValue: {
        attribute: { key: attributeKey },
        value: { equals: token, mode: "insensitive" },
      },
    },
    {
      attributeValue: {
        attribute: { key: attributeKey },
        translations: {
          some: {
            locale: lang,
            label: { equals: token, mode: "insensitive" },
          },
        },
      },
    },
    {
      attributeValue: {
        attribute: { key: attributeKey },
        NOT: {
          translations: {
            some: { locale: lang },
          },
        },
        translations: {
          some: {
            label: { equals: token, mode: "insensitive" },
          },
        },
      },
    },
  ];
}

function buildOptionListMatch(
  attributeKey: AttributeKey,
  tokens: string[],
  lang: string
): Prisma.ProductVariantOptionWhereInput {
  return {
    OR: tokens.flatMap((token) =>
      buildOptionTokenMatchConditions(attributeKey, token, lang)
    ),
  };
}

/**
 * Product must have a published variant whose options satisfy all active color/size filters
 * on the same variant (legacy semantics).
 */
export function buildColorSizeVariantWhere(
  filters: ProductFilters
): Prisma.ProductWhereInput | null {
  const colorList = normalizeFilterList(filters.colors, (v) => v.toLowerCase());
  const sizeList = normalizeFilterList(filters.sizes, (v) => v.toUpperCase());
  const lang = filters.lang || "en";

  if (colorList.length === 0 && sizeList.length === 0) {
    return null;
  }

  const variantConditions: Prisma.ProductVariantWhereInput[] = [{ published: true }];

  if (colorList.length > 0) {
    variantConditions.push({
      options: { some: buildOptionListMatch("color", colorList, lang) },
    });
  }

  if (sizeList.length > 0) {
    variantConditions.push({
      options: { some: buildOptionListMatch("size", sizeList, lang) },
    });
  }

  return {
    variants: {
      some: {
        AND: variantConditions,
      },
    },
  };
}

export function mergeColorSizeIntoWhere(
  where: Prisma.ProductWhereInput,
  filters: ProductFilters
): Prisma.ProductWhereInput {
  const colorSizeWhere = buildColorSizeVariantWhere(filters);
  if (!colorSizeWhere) {
    return where;
  }
  return { AND: [where, colorSizeWhere] };
}
