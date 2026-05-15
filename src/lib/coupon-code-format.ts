/**
 * Promo codes keep admin-entered casing (case-sensitive lookup at checkout).
 * Allowed after trim: ASCII letters, digits, underscore, hyphen; length 3–32.
 */
export const COUPON_CODE_REGEX = /^[a-zA-Z0-9_-]{3,32}$/;
