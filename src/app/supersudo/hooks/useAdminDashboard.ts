import { logger } from '@/lib/utils/logger';
/**
 * Hook for admin dashboard data fetching
 */

import { useState, useCallback, useEffect } from 'react';
import {
  fetchAdminDashboardShared,
  type AdminDashboardStats,
  type AdminRecentOrder,
  type AdminTopProduct,
} from '@/lib/admin/admin-dashboard-client';

export type { AdminRecentOrder };

export {
  fetchAdminDashboardShared,
  fetchRecentOrdersShared,
  fetchRecentOrdersForPoll,
  invalidateAdminDashboardCaches,
  invalidateRecentOrdersCache,
} from '@/lib/admin/admin-dashboard-client';

interface UseAdminDashboardProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

export function useAdminDashboard({ isLoggedIn, isAdmin, isLoading }: UseAdminDashboardProps) {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminRecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<AdminTopProduct[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentOrdersLoading, setRecentOrdersLoading] = useState(true);
  const [topProductsLoading, setTopProductsLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setStatsLoading(true);
    setRecentOrdersLoading(true);
    setTopProductsLoading(true);

    try {
      logger.debug('📊 [ADMIN] Fetching dashboard...');
      const data = await fetchAdminDashboardShared();
      logger.debug('✅ [ADMIN] Dashboard fetched:', data);
      setStats(data.stats);
      setRecentOrders(data.recentOrders.slice(0, 5));
      setTopProducts(data.topProducts);
    } catch (err: unknown) {
      logger.error('❌ [ADMIN] Error fetching dashboard', err);
      setStats(null);
      setRecentOrders([]);
      setTopProducts([]);
    } finally {
      setStatsLoading(false);
      setRecentOrdersLoading(false);
      setTopProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isLoggedIn && isAdmin) {
      void fetchDashboard();
    }
  }, [isLoading, isLoggedIn, isAdmin, fetchDashboard]);

  return {
    stats,
    recentOrders,
    topProducts,
    statsLoading,
    recentOrdersLoading,
    topProductsLoading,
  };
}
