export type ArcaRegisterResponse = {
  errorCode?: string | number;
  errorMessage?: string;
  orderId?: string;
  formUrl?: string;
};

export type ArcaOrderStatusResponse = {
  errorCode?: string | number;
  errorMessage?: string;
  orderNumber?: string;
  orderStatus?: number;
  actionCode?: number;
  paymentAmountInfo?: {
    paymentState?: string;
    approvedAmount?: number;
    depositedAmount?: number;
  };
};

export type ArcaRegisterParams = {
  orderNumber: string;
  amountMinorUnits: number;
  currencyCode: string;
  returnUrl: string;
  description: string;
  language: string;
};

export type ArcaRegisterResult = {
  arcaOrderId: string;
  formUrl: string;
};

export type ArcaStatusResult = {
  isPaid: boolean;
  response: ArcaOrderStatusResponse;
};
