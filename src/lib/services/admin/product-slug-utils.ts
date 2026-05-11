import { Prisma } from "@prisma/client";

const FALLBACK_PRODUCT_SLUG = "product";
const MAX_SLUG_ATTEMPTS = 1000;

interface EnsureUniqueProductSlugParams {
  tx: Prisma.TransactionClient;
  slug: string;
  locale: string;
  excludeProductId?: string;
}

function buildSlugCandidate(baseSlug: string, attempt: number): string {
  return attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
}

export async function ensureUniqueProductSlug({
  tx,
  slug,
  locale,
  excludeProductId,
}: EnsureUniqueProductSlugParams): Promise<string> {
  const baseSlug = slug.trim() || FALLBACK_PRODUCT_SLUG;

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
    const candidate = buildSlugCandidate(baseSlug, attempt);
    const existingTranslation = await tx.productTranslation.findFirst({
      where: {
        slug: candidate,
        locale,
        ...(excludeProductId ? { productId: { not: excludeProductId } } : {}),
      },
      select: { id: true },
    });

    if (!existingTranslation) {
      return candidate;
    }
  }

  throw new Error(
    `Unable to generate unique product slug for '${baseSlug}' in locale '${locale}'`
  );
}
