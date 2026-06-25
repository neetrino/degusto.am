import { db } from "@white-shop/db";

export type PendingPaymentOrder = {
  id: string;
  number: string;
  userId: string | null;
  paymentStatus: string;
  total: number;
  currency: string;
  customerEmail: string | null;
  customerLocale: string;
  payment: {
    id: string;
    provider: string;
    status: string;
    providerTransactionId: string | null;
    providerResponse: unknown;
  };
};

/** Load order + latest pending payment for init/callback handlers. */
export async function loadPendingPaymentOrder(
  orderNumber: string,
  provider: string
): Promise<PendingPaymentOrder | null> {
  const order = await db.order.findUnique({
    where: { number: orderNumber },
    include: {
      payments: {
        where: { provider },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!order || order.payments.length === 0) {
    return null;
  }

  const payment = order.payments[0];
  return {
    id: order.id,
    number: order.number,
    userId: order.userId,
    paymentStatus: order.paymentStatus,
    total: order.total,
    currency: order.currency,
    customerEmail: order.customerEmail,
    customerLocale: order.customerLocale,
    payment: {
      id: payment.id,
      provider: payment.provider,
      status: payment.status,
      providerTransactionId: payment.providerTransactionId,
      providerResponse: payment.providerResponse,
    },
  };
}
