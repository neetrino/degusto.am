import { logger } from "@/lib/utils/logger";
/**
 * Hook for admin dashboard data fetching
 */

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';

interface Stats {
  users: { total: number };
  products: { total: number; lowStock: number };
  orders: { total: number; recent: number; pending: number };
  revenue: { total: number; currency: string };
}

interface ActivityItem {
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

interface RecentOrder {
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
}

interface TopProduct {
  variantId: string;
  productId: string;
  title: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  image?: string | null;
}

interface UserActivity {
  recentRegistrations: Array<{
    id: string;
    email?: string;
    phone?: string;
    name: string;
    registeredAt: string;
    lastLoginAt?: string;
  }>;
  activeUsers: Array<{
    id: string;
    email?: string;
    phone?: string;
    name: string;
    orderCount: number;
    totalSpent: number;
    lastOrderDate: string;
    lastLoginAt?: string;
  }>;
}

interface UseAdminDashboardProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

let recentOrdersCache: RecentOrder[] | null = null;
let recentOrdersCacheUpdatedAt = 0;
let inflightRecentOrdersRequest: Promise<RecentOrder[]> | null = null;
const RECENT_ORDERS_CACHE_TTL_MS = 10_000;

function hasFreshRecentOrdersCache(now: number): boolean {
  return now - recentOrdersCacheUpdatedAt <= RECENT_ORDERS_CACHE_TTL_MS;
}

export function invalidateRecentOrdersCache(): void {
  recentOrdersCache = null;
  recentOrdersCacheUpdatedAt = 0;
}

export async function fetchRecentOrdersShared(limit = 8): Promise<RecentOrder[]> {
  const now = Date.now();
  if (recentOrdersCache && hasFreshRecentOrdersCache(now)) {
    return recentOrdersCache.slice(0, limit);
  }

  if (inflightRecentOrdersRequest) {
    const cached = await inflightRecentOrdersRequest;
    return cached.slice(0, limit);
  }

  inflightRecentOrdersRequest = (async () => {
    const response = await apiClient.get<{ data: RecentOrder[] }>('/api/v1/admin/dashboard/recent-orders', {
      params: { limit: String(Math.max(limit, 8)) },
    });
    const data = Array.isArray(response?.data) ? response.data : [];
    recentOrdersCache = data;
    recentOrdersCacheUpdatedAt = Date.now();
    return data;
  })();

  try {
    const data = await inflightRecentOrdersRequest;
    return data.slice(0, limit);
  } finally {
    inflightRecentOrdersRequest = null;
  }
}

export function useAdminDashboard({ isLoggedIn, isAdmin, isLoading }: UseAdminDashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [recentOrdersLoading, setRecentOrdersLoading] = useState(true);
  const [topProductsLoading, setTopProductsLoading] = useState(true);
  const [userActivityLoading, setUserActivityLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      logger.debug('📊 [ADMIN] Fetching statistics...');
      setStatsLoading(true);

      const data = await apiClient.get<Stats>('/api/v1/admin/stats');
      logger.debug('✅ [ADMIN] Statistics fetched:', data);

      if (data && typeof data === 'object') {
        setStats(data);
      } else {
        console.warn('⚠️ [ADMIN] Invalid response format from server');
        setStats(null);
      }
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error fetching stats:', err);
      if (err && typeof err === 'object' && 'message' in err) {
        console.error('❌ [ADMIN] Error details:', {
          message: (err as { message?: string }).message,
          stack: (err as { stack?: string }).stack,
          status: (err as { status?: number }).status,
        });
      }
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    try {
      logger.debug('📋 [ADMIN] Fetching recent activity...');
      setActivityLoading(true);

      const response = await apiClient.get<{ data: ActivityItem[] }>('/api/v1/admin/activity', {
        params: { limit: '10' },
      });
      logger.debug('✅ [ADMIN] Activity fetched:', response);

      if (response && response.data && Array.isArray(response.data)) {
        setActivity(response.data);
      } else {
        console.warn('⚠️ [ADMIN] Invalid activity response format:', response);
        setActivity([]);
      }
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error fetching activity:', err);
      if (err && typeof err === 'object' && 'message' in err) {
        console.error('❌ [ADMIN] Activity error details:', {
          message: (err as { message?: string }).message,
          status: (err as { status?: number }).status,
        });
      }
      setActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const fetchRecentOrders = useCallback(async () => {
    try {
      logger.debug('📋 [ADMIN] Fetching recent orders...');
      setRecentOrdersLoading(true);
      const data = await fetchRecentOrdersShared(5);
      setRecentOrders(data);
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error fetching recent orders:', err);
      setRecentOrders([]);
    } finally {
      setRecentOrdersLoading(false);
    }
  }, []);

  const fetchTopProducts = useCallback(async () => {
    try {
      logger.debug('📊 [ADMIN] Fetching top products...');
      setTopProductsLoading(true);
      const response = await apiClient.get<{ data: TopProduct[] }>('/api/v1/admin/dashboard/top-products', {
        params: { limit: '5' },
      });
      if (response?.data && Array.isArray(response.data)) {
        setTopProducts(response.data);
      } else {
        setTopProducts([]);
      }
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error fetching top products:', err);
      setTopProducts([]);
    } finally {
      setTopProductsLoading(false);
    }
  }, []);

  const fetchUserActivity = useCallback(async () => {
    try {
      logger.debug('👥 [ADMIN] Fetching user activity...');
      setUserActivityLoading(true);
      const response = await apiClient.get<{ data: UserActivity }>('/api/v1/admin/dashboard/user-activity', {
        params: { limit: '10' },
      });
      if (response?.data) {
        setUserActivity(response.data);
      } else {
        setUserActivity(null);
      }
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error fetching user activity:', err);
      setUserActivity(null);
    } finally {
      setUserActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isLoggedIn && isAdmin) {
      fetchStats();
      fetchActivity();
      fetchRecentOrders();
      fetchTopProducts();
      fetchUserActivity();
    }
  }, [isLoading, isLoggedIn, isAdmin, fetchStats, fetchActivity, fetchRecentOrders, fetchTopProducts, fetchUserActivity]);

  return {
    stats,
    activity,
    recentOrders,
    topProducts,
    userActivity,
    statsLoading,
    activityLoading,
    recentOrdersLoading,
    topProductsLoading,
    userActivityLoading,
  };
}

