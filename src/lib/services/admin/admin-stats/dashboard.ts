import { getStats } from "./stats-calculator";
import { getRecentOrders } from "./recent-orders";
import { getTopProducts } from "./top-products";

export const ADMIN_DASHBOARD_RECENT_ORDERS_LIMIT = 8;
export const ADMIN_DASHBOARD_TOP_PRODUCTS_LIMIT = 5;

export type AdminDashboardPayload = {
  stats: Awaited<ReturnType<typeof getStats>>;
  recentOrders: Awaited<ReturnType<typeof getRecentOrders>>;
  topProducts: Awaited<ReturnType<typeof getTopProducts>>;
};

/**
 * Single round-trip payload for the admin dashboard home screen.
 */
export async function getDashboard(options?: {
  recentOrdersLimit?: number;
  topProductsLimit?: number;
}): Promise<AdminDashboardPayload> {
  const recentOrdersLimit = options?.recentOrdersLimit ?? ADMIN_DASHBOARD_RECENT_ORDERS_LIMIT;
  const topProductsLimit = options?.topProductsLimit ?? ADMIN_DASHBOARD_TOP_PRODUCTS_LIMIT;

  const [stats, recentOrders, topProducts] = await Promise.all([
    getStats(),
    getRecentOrders(recentOrdersLimit),
    getTopProducts(topProductsLimit),
  ]);

  return { stats, recentOrders, topProducts };
}
