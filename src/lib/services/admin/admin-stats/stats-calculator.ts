import { db } from "@white-shop/db";
import type { Prisma } from "@prisma/client";

/**
 * Get dashboard stats
 */
export async function getStats() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const revenueWhere: Prisma.OrderWhereInput = {
    OR: [{ status: "completed" }, { paymentStatus: "paid" }],
  };

  const [
    totalUsers,
    totalProducts,
    lowStockProducts,
    totalOrders,
    recentOrders,
    pendingOrders,
    revenueAggregate,
    revenueCurrencySample,
  ] = await Promise.all([
    db.user.count({ where: { deletedAt: null } }),
    db.product.count({ where: { deletedAt: null } }),
    db.productVariant.count({
      where: {
        stock: { lt: 10 },
        published: true,
      },
    }),
    db.order.count(),
    db.order.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    db.order.count({
      where: { status: "pending" },
    }),
    db.order.aggregate({
      where: revenueWhere,
      _sum: { total: true },
    }),
    db.order.findFirst({
      where: revenueWhere,
      select: { currency: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalRevenue = revenueAggregate._sum?.total ?? 0;
  const currency = revenueCurrencySample?.currency || "AMD";

  return {
    users: {
      total: totalUsers,
    },
    products: {
      total: totalProducts,
      lowStock: lowStockProducts,
    },
    orders: {
      total: totalOrders,
      recent: recentOrders,
      pending: pendingOrders,
    },
    revenue: {
      total: totalRevenue,
      currency,
    },
  };
}




