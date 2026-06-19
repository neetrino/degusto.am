'use client';

import { apiClient } from '../api-client';
import type {
  CouponHistoryItem,
  DashboardData,
  OrderDetails,
  OrderListItem,
  UserCoupon,
} from '@/app/profile/types';

const PROFILE_TAB_CACHE_TTL_MS = 30_000;
const ORDER_DETAILS_CACHE_TTL_MS = 60_000;

export interface OrdersListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface OrdersListResponse {
  data: OrderListItem[];
  meta: OrdersListMeta;
}

interface CouponsResponse {
  availableCoupons: UserCoupon[];
  history: CouponHistoryItem[];
}

let cachedDashboard: DashboardData | null = null;
let cachedDashboardAt = 0;
let inflightDashboard: Promise<DashboardData> | null = null;

const ordersCacheByPage = new Map<number, { data: OrdersListResponse; updatedAt: number }>();
const inflightOrdersByPage = new Map<number, Promise<OrdersListResponse>>();

let cachedCoupons: CouponsResponse | null = null;
let cachedCouponsAt = 0;
let inflightCoupons: Promise<CouponsResponse> | null = null;

const orderDetailsCache = new Map<string, { data: OrderDetails; updatedAt: number }>();
const inflightOrderDetails = new Map<string, Promise<OrderDetails>>();

function isFresh(updatedAt: number, ttlMs: number): boolean {
  return updatedAt > 0 && Date.now() - updatedAt <= ttlMs;
}

export function getCachedDashboardSync(): DashboardData | null {
  if (cachedDashboard && isFresh(cachedDashboardAt, PROFILE_TAB_CACHE_TTL_MS)) {
    return cachedDashboard;
  }
  return null;
}

export function invalidateDashboardCache(): void {
  cachedDashboard = null;
  cachedDashboardAt = 0;
}

export async function fetchDashboardCached(): Promise<DashboardData> {
  const cached = getCachedDashboardSync();
  if (cached) {
    return cached;
  }

  if (inflightDashboard) {
    return inflightDashboard;
  }

  inflightDashboard = (async () => {
    const data = await apiClient.get<DashboardData>('/api/v1/users/dashboard');
    cachedDashboard = data;
    cachedDashboardAt = Date.now();
    return data;
  })();

  try {
    return await inflightDashboard;
  } finally {
    inflightDashboard = null;
  }
}

export function getCachedOrdersSync(page: number): OrdersListResponse | null {
  const entry = ordersCacheByPage.get(page);
  if (entry && isFresh(entry.updatedAt, PROFILE_TAB_CACHE_TTL_MS)) {
    return entry.data;
  }
  return null;
}

export function invalidateOrdersCache(): void {
  ordersCacheByPage.clear();
}

export async function fetchOrdersCached(page: number, limit = 20): Promise<OrdersListResponse> {
  const cached = getCachedOrdersSync(page);
  if (cached) {
    return cached;
  }

  const inflight = inflightOrdersByPage.get(page);
  if (inflight) {
    return inflight;
  }

  const request = (async () => {
    const response = await apiClient.get<OrdersListResponse>('/api/v1/orders', {
      params: {
        page: page.toString(),
        limit: limit.toString(),
      },
    });
    const data: OrdersListResponse = {
      data: response.data ?? [],
      meta: response.meta,
    };
    ordersCacheByPage.set(page, { data, updatedAt: Date.now() });
    return data;
  })();

  inflightOrdersByPage.set(page, request);

  try {
    return await request;
  } finally {
    inflightOrdersByPage.delete(page);
  }
}

export function getCachedCouponsSync(): CouponsResponse | null {
  if (cachedCoupons && isFresh(cachedCouponsAt, PROFILE_TAB_CACHE_TTL_MS)) {
    return cachedCoupons;
  }
  return null;
}

export function invalidateCouponsCache(): void {
  cachedCoupons = null;
  cachedCouponsAt = 0;
}

export async function fetchCouponsCached(): Promise<CouponsResponse> {
  const cached = getCachedCouponsSync();
  if (cached) {
    return cached;
  }

  if (inflightCoupons) {
    return inflightCoupons;
  }

  inflightCoupons = (async () => {
    const response = await apiClient.get<CouponsResponse>('/api/v1/users/coupons');
    const data: CouponsResponse = {
      availableCoupons: response.availableCoupons ?? [],
      history: response.history ?? [],
    };
    cachedCoupons = data;
    cachedCouponsAt = Date.now();
    return data;
  })();

  try {
    return await inflightCoupons;
  } finally {
    inflightCoupons = null;
  }
}

export function getCachedOrderDetailsSync(orderNumber: string): OrderDetails | null {
  const entry = orderDetailsCache.get(orderNumber);
  if (entry && isFresh(entry.updatedAt, ORDER_DETAILS_CACHE_TTL_MS)) {
    return entry.data;
  }
  return null;
}

export function invalidateOrderDetailsCache(orderNumber?: string): void {
  if (orderNumber) {
    orderDetailsCache.delete(orderNumber);
    return;
  }
  orderDetailsCache.clear();
}

export async function fetchOrderDetailsCached(orderNumber: string): Promise<OrderDetails> {
  const cached = getCachedOrderDetailsSync(orderNumber);
  if (cached) {
    return cached;
  }

  const inflight = inflightOrderDetails.get(orderNumber);
  if (inflight) {
    return inflight;
  }

  const request = (async () => {
    const data = await apiClient.get<OrderDetails>(`/api/v1/orders/${orderNumber}`);
    orderDetailsCache.set(orderNumber, { data, updatedAt: Date.now() });
    return data;
  })();

  inflightOrderDetails.set(orderNumber, request);

  try {
    return await request;
  } finally {
    inflightOrderDetails.delete(orderNumber);
  }
}

export function invalidateProfileTabCaches(): void {
  invalidateDashboardCache();
  invalidateOrdersCache();
  invalidateCouponsCache();
  invalidateOrderDetailsCache();
}
