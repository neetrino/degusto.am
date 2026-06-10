export type UserDashboardRecentOrder = {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: number;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  currency: string | null;
  itemsCount: number;
  createdAt: string;
};

export type UserDashboardResponse = {
  stats: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalSpent: number;
    addressesCount: number;
    ordersByStatus: Record<string, number>;
  };
  recentOrders: UserDashboardRecentOrder[];
};

