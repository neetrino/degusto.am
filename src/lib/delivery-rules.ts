export const FIXED_DELIVERY_PRICE_AMD = 1000;
export const FIXED_BAG_FEE_AMD = 50;

const YEREVAN_ALIASES = [
  'yerevan',
  'erevan',
  'ереван',
  'erewan',
  'erewan',
  'երևան',
  'երեվան',
] as const;

function normalizeCity(city: string): string {
  return city.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isYerevanCity(city: string): boolean {
  const normalized = normalizeCity(city);
  return YEREVAN_ALIASES.includes(normalized as (typeof YEREVAN_ALIASES)[number]);
}

export function resolveFixedDeliveryFees(shippingMethod: 'pickup' | 'delivery', city?: string) {
  if (shippingMethod === 'pickup') {
    return {
      deliveryPriceAmd: 0,
      bagFeeAmd: 0,
      totalShippingAmd: 0,
      isAllowed: true,
      normalizedCity: null as string | null,
    };
  }

  const normalizedCity = typeof city === 'string' ? normalizeCity(city) : '';
  const isAllowed = normalizedCity.length > 0 && isYerevanCity(normalizedCity);

  if (!isAllowed) {
    return {
      deliveryPriceAmd: 0,
      bagFeeAmd: 0,
      totalShippingAmd: 0,
      isAllowed: false,
      normalizedCity: normalizedCity || null,
    };
  }

  return {
    deliveryPriceAmd: FIXED_DELIVERY_PRICE_AMD,
    bagFeeAmd: FIXED_BAG_FEE_AMD,
    totalShippingAmd: FIXED_DELIVERY_PRICE_AMD + FIXED_BAG_FEE_AMD,
    isAllowed: true,
    normalizedCity,
  };
}
