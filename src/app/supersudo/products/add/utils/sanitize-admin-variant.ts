/** Normalize variant payload before admin product create/update API. */
export function sanitizeVariantForCreate(
  variant: Record<string, unknown>,
): Record<string, unknown> {
  const priceRaw = variant.price;
  const price =
    typeof priceRaw === 'number' ? priceRaw : Number.parseFloat(String(priceRaw ?? ''));
  if (!Number.isFinite(price) || price < 0) {
    throw new Error('INVALID_VARIANT_PRICE');
  }

  const sanitized: Record<string, unknown> = { ...variant, price };

  const compareRaw = variant.compareAtPrice;
  if (compareRaw !== undefined && compareRaw !== null && String(compareRaw).trim() !== '') {
    const compare =
      typeof compareRaw === 'number' ? compareRaw : Number.parseFloat(String(compareRaw));
    if (Number.isFinite(compare) && compare >= 0) {
      sanitized.compareAtPrice = compare;
    } else {
      delete sanitized.compareAtPrice;
    }
  } else {
    delete sanitized.compareAtPrice;
  }

  return sanitized;
}
