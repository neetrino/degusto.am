import { NextResponse } from "next/server";
import {
  STOREFRONT_CACHE_KEYS,
  STOREFRONT_CACHE_TTL,
  readJsonCache,
  writeJsonCache,
} from "@/lib/cache/storefront-cache";
import { adminService } from "@/lib/services/admin.service";
import { logger } from "@/lib/utils/logger";

const DEFAULT_RATES = {
  USD: 1,
  AMD: 400,
  EUR: 0.92,
  RUB: 90,
  GEL: 2.7,
} as const;

/**
 * Get currency exchange rates (public endpoint, cached).
 */
export async function GET() {
  const cacheKey = STOREFRONT_CACHE_KEYS.currencyRates();

  try {
    const cached = await readJsonCache<Record<string, number>>(cacheKey);
    if (cached !== null) {
      return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
    }

    const settings = await adminService.getSettings();
    const rates = settings.currencyRates || { ...DEFAULT_RATES };

    await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.currencyRates, rates);

    return NextResponse.json(rates, { headers: { "X-Cache": "MISS" } });
  } catch (error: unknown) {
    logger.error("[CURRENCY RATES] Error", error);
    return NextResponse.json({ ...DEFAULT_RATES });
  }
}
