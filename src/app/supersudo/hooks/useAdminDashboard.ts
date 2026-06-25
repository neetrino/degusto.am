import { logger } from "@/lib/utils/logger";
/**
 * Hook for admin dashboard data fetching
 */

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';
import { createInflightGetCache } from '@/lib/admin/inflight-get-cache';

interface Stats {
  users: { total: number };
  products: { total: number; lowStock: number };
  orders: { total: number; recent: number; pending: number };
  revenue: { total: number; currency: string };
}

export interface RecentOrder {
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

interface AdminDashboardResponse {
  stats: Stats;
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
}

interface UseAdminDashboardProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

const DASHBOARD_CACHE_TTL_MS = 10_000;
const dashboardCache = createInflightGetCache<AdminDashboardResponse>(DASHBOARD_CACHE_TTL_MS);
const recentOrdersCache = createInflightGetCache<RecentOrder[]>(DASHBOARD_CACHE_TTL_MS);

function isAdminDashboardHomePath(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const { pathname } = window.location;
  return pathname === '/supersudo' || pathname === '/supersudo/';
}

export function invalidateRecentOrdersCache(): void {
  dashboardCache.invalidate();
  recentOrdersCache.invalidate();
}

export async function fetchAdminDashboardShared(): Promise<AdminDashboardResponse> {
  const data = await dashboardCache.fetch(async () => {
    const response = await apiClient.get<{ data: AdminDashboardResponse }>('/api/v1/admin/dashboard');
    if (!response?.data || typeof response.data !== 'object') {
      throw new Error('Invalid dashboard response');
    }
    return response.data;
  });
  recentOrdersCache.seed(data.recentOrders);
  return data;
}

export async function fetchRecentOrdersShared(limit = 8): Promise<RecentOrder[]> {
  const cachedDashboard = dashboardCache.peek();
  if (cachedDashboard) {
    return cachedDashboard.recentOrders.slice(0, limit);
  }

  const cachedRecent = recentOrdersCache.peek();
  if (cachedRecent) {
    return cachedRecent.slice(0, limit);
  }

  if (isAdminDashboardHomePath()) {
    const data = await fetchAdminDashboardShared();
    return data.recentOrders.slice(0, limit);
  }

  const dashboardInflight = dashboardCache.getInflight();
  if (dashboardInflight) {
    const data = await dashboardInflight;
    recentOrdersCache.seed(data.recentOrders);
    return data.recentOrders.slice(0, limit);
  }

  const data = await recentOrdersCache.fetch(async () => {
    const response = await apiClient.get<{ data: RecentOrder[] }>('/api/v1/admin/dashboard/recent-orders', {
      params: { limit: String(Math.max(limit, 8)) },
    });
    return Array.isArray(response?.data) ? response.data : [];
  });

  return data.slice(0, limit);
}

export function useAdminDashboard({ isLoggedIn, isAdmin, isLoading }: UseAdminDashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
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
      console.error('❌ [ADMIN] Error fetching dashboard:', err);
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
