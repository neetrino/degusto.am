export const ARCA_PAYMENT_STATE = {
  deposited: "DEPOSITED",
} as const;

export const ARCA_ORDER_STATUS = {
  deposited: 2,
} as const;

export const ARCA_FORCE_3DS2_JSON = JSON.stringify({ FORCE_3DS2: "true" });
