import { apiClient } from '@/lib/api-client';
import { createInflightGetCache } from '@/lib/admin/inflight-get-cache';
import {
  ADMIN_DASHBOARD_CACHE_TTL_MS,
  ADMIN_RECENT_ORDERS_POLL_LIMIT,
  INFLIGHT_DEDUPE_ONLY_TTL_MS,
} from '@/lib/admin/admin-dashboard-cache.constants';

const ADMIN_DASHBOARD_API_PATH = '/api/v1/admin/dashboard';
const ADMIN_RECENT_ORDERS_API_PATH = '/api/v1/admin/dashboard/recent-orders';

export type AdminDashboardStats = {
  users: { total: number };
  products: { total: number; lowStock: number };
  orders: { total: number; recent: number; pending: number };
  revenue: { total: number; currency: string };
};

export type AdminRecentOrder = {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  customerEmail?: string;
  customerPhone?: string;
  itemsCount: number;
  createdAt: string;
};

export type AdminTopProduct = {
  variantId: string;
  productId: string;
  title: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  image?: string | null;
};

export type AdminDashboardResponse = {
  stats: AdminDashboardStats;
  recentOrders: AdminRecentOrder[];
  topProducts: AdminTopProduct[];
};

const dashboardCache = createInflightGetCache<AdminDashboardResponse>(ADMIN_DASHBOARD_CACHE_TTL_MS);
const recentOrdersUiCache = createInflightGetCache<AdminRecentOrder[]>(ADMIN_DASHBOARD_CACHE_TTL_MS);
const recentOrdersPollCache = createInflightGetCache<AdminRecentOrder[]>(INFLIGHT_DEDUPE_ONLY_TTL_MS);

async function loadRecentOrdersFromApi(limit: number): Promise<AdminRecentOrder[]> {
  const response = await apiClient.get<{ data: AdminRecentOrder[] }>(ADMIN_RECENT_ORDERS_API_PATH, {
    params: { limit: String(limit) },
  });
  return Array.isArray(response?.data) ? response.data : [];
}

function readWarmRecentOrders(limit: number): AdminRecentOrder[] | null {
  const fromDashboard = dashboardCache.peek();
  if (fromDashboard) {
    return fromDashboard.recentOrders.slice(0, limit);
  }

  const cachedUi = recentOrdersUiCache.peek();
  if (cachedUi) {
    return cachedUi.slice(0, limit);
  }

  return null;
}

/** Clears dashboard UI cache and in-flight poll dedupe state. */
export function invalidateAdminDashboardCaches(): void {
  dashboardCache.invalidate();
  recentOrdersUiCache.invalidate();
  recentOrdersPollCache.invalidate();
}

/** @deprecated Use {@link invalidateAdminDashboardCaches}. */
export const invalidateRecentOrdersCache = invalidateAdminDashboardCaches;

export async function fetchAdminDashboardShared(): Promise<AdminDashboardResponse> {
  const data = await dashboardCache.fetch(async () => {
    const response = await apiClient.get<{ data: AdminDashboardResponse }>(ADMIN_DASHBOARD_API_PATH);
    if (!response?.data || typeof response.data !== 'object') {
      throw new Error('Invalid dashboard response');
    }
    return response.data;
  });
  recentOrdersUiCache.seed(data.recentOrders);
  return data;
}

/**
 * Recent orders for admin UI widgets — prefers warm dashboard cache, otherwise lightweight endpoint.
 */
export async function fetchRecentOrdersShared(
  limit = ADMIN_RECENT_ORDERS_POLL_LIMIT,
): Promise<AdminRecentOrder[]> {
  const warm = readWarmRecentOrders(limit);
  if (warm) {
    return warm;
  }

  const dashboardInflight = dashboardCache.getInflight();
  if (dashboardInflight) {
    const data = await dashboardInflight;
    recentOrdersUiCache.seed(data.recentOrders);
    return data.recentOrders.slice(0, limit);
  }

  const resolvedLimit = Math.max(limit, ADMIN_RECENT_ORDERS_POLL_LIMIT);
  const data = await recentOrdersUiCache.fetch(() => loadRecentOrdersFromApi(resolvedLimit));
  return data.slice(0, limit);
}

type FetchRecentOrdersForPollOptions = {
  /** When false, reuse warm dashboard/UI cache (first poll seed only). Default: true. */
  requireFresh?: boolean;
};

/**
 * Background new-order poll — uses `/recent-orders`; skips network when warm cache is enough for seeding.
 */
export async function fetchRecentOrdersForPoll(
  limit = ADMIN_RECENT_ORDERS_POLL_LIMIT,
  options?: FetchRecentOrdersForPollOptions,
): Promise<AdminRecentOrder[]> {
  const requireFresh = options?.requireFresh ?? true;
  if (!requireFresh) {
    const warm = readWarmRecentOrders(limit);
    if (warm) {
      return warm;
    }
  }

  const data = await recentOrdersPollCache.fetch(() => loadRecentOrdersFromApi(limit));
  return data.slice(0, limit);
}
