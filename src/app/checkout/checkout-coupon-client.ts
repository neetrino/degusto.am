export const CHECKOUT_COUPON_CODE_STORAGE_KEY = 'checkout_coupon_code';

export type CheckoutCouponValidationData = {
  code: string;
  discountAmount: number;
  totalAfterDiscount?: number;
};

interface CouponValidationResponse {
  data: CheckoutCouponValidationData;
}

interface ProblemDetailsResponse {
  detail?: string;
}

/**
 * Validates a coupon against cart subtotal (USD). Persists code in localStorage only from UI callers.
 */
export async function requestCheckoutCouponValidation(
  couponCode: string,
  cartSubtotalUsd: number
): Promise<CheckoutCouponValidationData> {
  const response = await fetch('/api/v1/cart/coupon/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      couponCode,
      subtotal: cartSubtotalUsd,
    }),
  });

  const responseBody = (await response.json()) as CouponValidationResponse | ProblemDetailsResponse;

  if (!response.ok) {
    const detail =
      typeof (responseBody as ProblemDetailsResponse).detail === 'string'
        ? (responseBody as ProblemDetailsResponse).detail
        : 'Coupon is invalid';
    throw new Error(detail);
  }

  return (responseBody as CouponValidationResponse).data;
}
