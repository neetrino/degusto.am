import { db } from "@white-shop/db";
import type { Prisma } from "@prisma/client";
import type { UserDashboardResponse } from "./dashboard.types";

export async function getUserDashboard(userId: string): Promise<UserDashboardResponse> {
  const paidOrCompletedWhere: Prisma.OrderWhereInput = {
    userId,
    OR: [{ status: "completed" }, { paymentStatus: "paid" }],
  };

  const [
    totalOrders,
    pendingOrders,
    completedOrders,
    totalSpentAggregate,
    addressesCount,
    ordersGroupedByStatus,
    recentOrdersRows,
  ] = await Promise.all([
    db.order.count({ where: { userId } }),
    db.order.count({ where: { userId, status: "pending" } }),
    db.order.count({ where: { userId, status: "completed" } }),
    db.order.aggregate({
      where: paidOrCompletedWhere,
      _sum: { total: true },
    }),
    db.address.count({ where: { userId } }),
    db.order.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
    }),
    db.order.findMany({
      where: { userId },
      select: {
        id: true,
        number: true,
        status: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        total: true,
        subtotal: true,
        discountAmount: true,
        shippingAmount: true,
        taxAmount: true,
        currency: true,
        createdAt: true,
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalSpent = totalSpentAggregate._sum?.total ?? 0;

  const ordersByStatus: Record<string, number> = {};
  for (const group of ordersGroupedByStatus) {
    ordersByStatus[group.status] = group._count._all;
  }

  return {
    stats: {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalSpent,
      addressesCount,
      ordersByStatus,
    },
    recentOrders: recentOrdersRows.map((order) => ({
      id: order.id,
      number: order.number,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      total: order.total,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      shippingAmount: order.shippingAmount,
      taxAmount: order.taxAmount,
      currency: order.currency,
      itemsCount: order._count.items,
      createdAt: order.createdAt.toISOString(),
    })),
  };
}

