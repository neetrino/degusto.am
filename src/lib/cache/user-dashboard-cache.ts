import { cacheService } from "@/lib/services/cache.service";

const USER_DASHBOARD_CACHE_PREFIX = "user:dashboard:v1:";
const USER_DASHBOARD_CACHE_TTL_SECONDS = 30;

function getUserDashboardCacheKey(userId: string): string {
  return `${USER_DASHBOARD_CACHE_PREFIX}${userId}`;
}

export async function readUserDashboardCache<T>(userId: string): Promise<T | null> {
  const raw = await cacheService.get(getUserDashboardCacheKey(userId));
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeUserDashboardCache(userId: string, payload: unknown): Promise<void> {
  await cacheService.setex(
    getUserDashboardCacheKey(userId),
    USER_DASHBOARD_CACHE_TTL_SECONDS,
    JSON.stringify(payload)
  );
}

export async function invalidateUserDashboardCache(userId: string): Promise<void> {
  await cacheService.del(getUserDashboardCacheKey(userId));
}

