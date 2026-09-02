export type NewOrderAlertItem = {
  id: string;
  orderNumber: string;
  contactName: string;
  totalAmount: number;
  baseCurrency: string;
  paymentMethod: string | null;
  placedAt: string;
};

export type NewOrderAlertCopy = {
  badge: string;
  orderTitle: string;
  customer: string;
  total: string;
  payment: string;
  time: string;
  acknowledge: string;
};

export type NewOrderAlertPollResponse = {
  orders: NewOrderAlertItem[];
  waitingCount: number;
};
