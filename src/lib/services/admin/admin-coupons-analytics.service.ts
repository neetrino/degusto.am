import { db } from "@white-shop/db";
import { COUPON_CODE_REGEX } from "@/lib/coupon-code-format";

type AnalyticsPeriod = "day" | "week" | "month";

interface CouponCatalogItem {
  code?: unknown;
  isActive?: unknown;
}

interface CouponStatsItem {
  code: string;
  uses: number;
  totalDiscount: number;
  uniqueUsers: number;
  isActive: boolean;
}

interface TimelineItem {
  date: string;
  uses: number;
  discount: number;
}

interface TopCouponItem {
  code: string;
  uses: number;
  totalDiscount: number;
}

interface CouponsAnalyticsResponse {
  period: AnalyticsPeriod;
  range: { start: string; end: string };
  selectedCouponCode: string | null;
  summary: {
    totalUses: number;
    totalDiscount: number;
    uniqueUsers: number;
    couponsUsed: number;
  };
  timeline: TimelineItem[];
  topCoupons: TopCouponItem[];
  coupons: CouponStatsItem[];
}

function getRangeStart(period: AnalyticsPeriod): Date {
  const now = new Date();
  if (period === "day") {
    return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  if (period === "week") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
}

function normalizePeriod(period: string): AnalyticsPeriod {
  if (period === "day" || period === "week" || period === "month") {
    return period;
  }
  throw {
    status: 400,
    type: "https://api.shop.am/problems/validation-error",
    title: "Validation Error",
    detail: "period must be one of: day, week, month",
  };
}

function normalizeCouponCode(code: string | null): string | null {
  if (!code) {
    return null;
  }
  const normalized = code.trim();
  return normalized || null;
}

function extractCouponCode(notes: string | null): string | null {
  if (!notes) {
    return null;
  }
  const match = notes.match(new RegExp(`Coupon code:\\s*(${COUPON_CODE_REGEX.source.slice(1, -1)})`));
  return match ? match[1] : null;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function userKey(userId: string | null, customerEmail: string | null): string {
  if (userId) {
    return `user:${userId}`;
  }
  if (customerEmail) {
    return `email:${customerEmail.trim().toLowerCase()}`;
  }
  return "anonymous";
}

export class AdminCouponsAnalyticsService {
  async getCouponsAnalytics(
    periodInput: string,
    couponCodeInput: string | null
  ): Promise<CouponsAnalyticsResponse> {
    const period = normalizePeriod(periodInput);
    const selectedCouponCode = normalizeCouponCode(couponCodeInput);
    const start = getRangeStart(period);
    const end = new Date();

    const [orders, couponsSetting] = await Promise.all([
      db.order.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: {
          createdAt: true,
          discountAmount: true,
          notes: true,
          userId: true,
          customerEmail: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      db.settings.findUnique({
        where: { key: "couponsCatalog" },
        select: { value: true },
      }),
    ]);

    const catalogItems = Array.isArray(couponsSetting?.value)
      ? (couponsSetting.value as CouponCatalogItem[])
      : [];
    const catalogMap = new Map<string, boolean>();
    for (const item of catalogItems) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const code = typeof item.code === "string" ? item.code.trim() : "";
      if (!code) {
        continue;
      }
      catalogMap.set(code, Boolean(item.isActive ?? true));
    }

    const statsMap = new Map<
      string,
      { uses: number; discount: number; users: Set<string> }
    >();
    const timelineMap = new Map<string, { uses: number; discount: number }>();

    for (const order of orders) {
      const code = extractCouponCode(order.notes);
      if (!code) {
        continue;
      }
      if (selectedCouponCode && code !== selectedCouponCode) {
        continue;
      }

      const discount = Number(order.discountAmount) || 0;
      const key = dateKey(order.createdAt);
      const stats =
        statsMap.get(code) ?? { uses: 0, discount: 0, users: new Set<string>() };
      stats.uses += 1;
      stats.discount += discount;
      stats.users.add(userKey(order.userId, order.customerEmail));
      statsMap.set(code, stats);

      const timeline = timelineMap.get(key) ?? { uses: 0, discount: 0 };
      timeline.uses += 1;
      timeline.discount += discount;
      timelineMap.set(key, timeline);

      if (!catalogMap.has(code)) {
        catalogMap.set(code, true);
      }
    }

    const coupons: CouponStatsItem[] = Array.from(catalogMap.entries()).map(
      ([code, isActive]) => {
        const stats = statsMap.get(code);
        return {
          code,
          uses: stats?.uses ?? 0,
          totalDiscount: Math.round((stats?.discount ?? 0) * 100) / 100,
          uniqueUsers: stats?.users.size ?? 0,
          isActive,
        };
      }
    );

    coupons.sort((a, b) => b.uses - a.uses || a.code.localeCompare(b.code));

    const timeline: TimelineItem[] = Array.from(timelineMap.entries())
      .map(([date, data]) => ({
        date,
        uses: data.uses,
        discount: Math.round(data.discount * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const summary = coupons.reduce(
      (acc, coupon) => {
        acc.totalUses += coupon.uses;
        acc.totalDiscount += coupon.totalDiscount;
        acc.uniqueUsers += coupon.uniqueUsers;
        if (coupon.uses > 0) {
          acc.couponsUsed += 1;
        }
        return acc;
      },
      { totalUses: 0, totalDiscount: 0, uniqueUsers: 0, couponsUsed: 0 }
    );

    return {
      period,
      range: { start: start.toISOString(), end: end.toISOString() },
      selectedCouponCode,
      summary: {
        totalUses: summary.totalUses,
        totalDiscount: Math.round(summary.totalDiscount * 100) / 100,
        uniqueUsers: summary.uniqueUsers,
        couponsUsed: summary.couponsUsed,
      },
      timeline,
      topCoupons: coupons.slice(0, 8).map((coupon) => ({
        code: coupon.code,
        uses: coupon.uses,
        totalDiscount: coupon.totalDiscount,
      })),
      coupons,
    };
  }
}

export const adminCouponsAnalyticsService = new AdminCouponsAnalyticsService();
