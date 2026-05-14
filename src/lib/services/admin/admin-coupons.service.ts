import { db } from "@white-shop/db";
import { Prisma } from "@prisma/client";

export type CouponDiscountType = "percent" | "fixed";

export interface CouponCatalogItem {
  code: string;
  description: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  minOrderAmount: number | null;
  maxUsesPerUser: number | null;
}

interface CouponMutationInput {
  code?: string;
  description?: string | null;
  discountType?: CouponDiscountType;
  discountValue?: number;
  isActive?: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  minOrderAmount?: number | null;
  maxUsesPerUser?: number | null;
}

function toIsoOrNull(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Invalid date format in startsAt/expiresAt",
    };
  }

  return date.toISOString();
}

function normalizeCode(code: unknown): string {
  if (typeof code !== "string") {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Field 'code' must be a string",
    };
  }

  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(normalized)) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Field 'code' must match /^[A-Z0-9_-]{3,32}$/",
    };
  }

  return normalized;
}

function normalizeMutationInput(
  input: CouponMutationInput,
  options: { requireCode: boolean }
): CouponCatalogItem {
  const code = options.requireCode ? normalizeCode(input.code) : normalizeCode(input.code ?? "");
  const discountType = input.discountType ?? "percent";
  if (discountType !== "percent" && discountType !== "fixed") {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Field 'discountType' must be either 'percent' or 'fixed'",
    };
  }

  const rawDiscountValue = Number(input.discountValue);
  if (!Number.isFinite(rawDiscountValue) || rawDiscountValue < 0) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Field 'discountValue' must be a non-negative number",
    };
  }

  if (discountType === "percent" && rawDiscountValue > 100) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Percent coupon cannot be greater than 100",
    };
  }

  const minOrderAmount =
    input.minOrderAmount === null || input.minOrderAmount === undefined
      ? null
      : Number(input.minOrderAmount);
  if (minOrderAmount !== null && (!Number.isFinite(minOrderAmount) || minOrderAmount < 0)) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Field 'minOrderAmount' must be a non-negative number when provided",
    };
  }

  const startsAt = toIsoOrNull(input.startsAt);
  const expiresAt = toIsoOrNull(input.expiresAt);
  if (startsAt && expiresAt && new Date(startsAt) > new Date(expiresAt)) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "startsAt cannot be greater than expiresAt",
    };
  }

  const description =
    typeof input.description === "string" ? input.description.trim() || null : null;

  const maxUsesPerUser =
    input.maxUsesPerUser === null || input.maxUsesPerUser === undefined
      ? null
      : Number(input.maxUsesPerUser);
  if (
    maxUsesPerUser !== null &&
    (!Number.isFinite(maxUsesPerUser) ||
      maxUsesPerUser < 1 ||
      !Number.isInteger(maxUsesPerUser))
  ) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail:
        "Field 'maxUsesPerUser' must be a positive integer when provided",
    };
  }

  return {
    code,
    description,
    discountType,
    discountValue: Math.round(rawDiscountValue * 100) / 100,
    isActive: input.isActive ?? true,
    startsAt,
    expiresAt,
    minOrderAmount,
    maxUsesPerUser,
  };
}

class AdminCouponsService {
  private async getRawCatalog(): Promise<CouponCatalogItem[]> {
    const settings = await db.settings.findUnique({
      where: { key: "couponsCatalog" },
      select: { value: true },
    });

    if (!Array.isArray(settings?.value)) {
      return [];
    }

    const rawItems = settings.value as unknown[];
    return rawItems
      .filter((item) => Boolean(item && typeof item === "object"))
      .map((item) => {
        const raw = item as Record<string, unknown>;
        return {
          code: normalizeCode(raw.code),
          description: typeof raw.description === "string" ? raw.description : null,
          discountType: raw.discountType === "fixed" ? "fixed" : "percent",
          discountValue: Number(raw.discountValue) || 0,
          isActive: Boolean(raw.isActive ?? true),
          startsAt: toIsoOrNull(typeof raw.startsAt === "string" ? raw.startsAt : undefined),
          expiresAt: toIsoOrNull(typeof raw.expiresAt === "string" ? raw.expiresAt : undefined),
          minOrderAmount:
            typeof raw.minOrderAmount === "number" ? raw.minOrderAmount : null,
          maxUsesPerUser:
            typeof raw.maxUsesPerUser === "number" &&
            Number.isInteger(raw.maxUsesPerUser) &&
            raw.maxUsesPerUser > 0
              ? raw.maxUsesPerUser
              : null,
        };
      });
  }

  private async saveCatalog(catalog: CouponCatalogItem[]) {
    const jsonCatalog = catalog as unknown as Prisma.InputJsonValue;
    await db.settings.upsert({
      where: { key: "couponsCatalog" },
      update: {
        value: jsonCatalog,
        updatedAt: new Date(),
      },
      create: {
        key: "couponsCatalog",
        value: jsonCatalog,
        description: "Coupon catalog used for checkout discounts",
      },
    });
  }

  async listCoupons() {
    const coupons = await this.getRawCatalog();
    return {
      data: coupons.sort((a, b) => a.code.localeCompare(b.code)),
    };
  }

  async createCoupon(data: CouponMutationInput) {
    const payload = normalizeMutationInput(data, { requireCode: true });
    const coupons = await this.getRawCatalog();
    if (coupons.some((coupon) => coupon.code === payload.code)) {
      throw {
        status: 409,
        type: "https://api.shop.am/problems/conflict",
        title: "Conflict",
        detail: `Coupon '${payload.code}' already exists`,
      };
    }

    const nextCatalog = [...coupons, payload];
    await this.saveCatalog(nextCatalog);
    return { data: payload };
  }

  async updateCoupon(code: string, data: CouponMutationInput) {
    const couponCode = normalizeCode(code);
    const coupons = await this.getRawCatalog();
    const index = coupons.findIndex((coupon) => coupon.code === couponCode);
    if (index < 0) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Coupon not found",
        detail: `Coupon '${couponCode}' does not exist`,
      };
    }

    const current = coupons[index];
    const merged: CouponMutationInput = {
      code: couponCode,
      description: data.description ?? current.description,
      discountType: data.discountType ?? current.discountType,
      discountValue: data.discountValue ?? current.discountValue,
      isActive: data.isActive ?? current.isActive,
      startsAt: data.startsAt !== undefined ? data.startsAt : current.startsAt,
      expiresAt: data.expiresAt !== undefined ? data.expiresAt : current.expiresAt,
      minOrderAmount:
        data.minOrderAmount !== undefined ? data.minOrderAmount : current.minOrderAmount,
      maxUsesPerUser:
        data.maxUsesPerUser !== undefined
          ? data.maxUsesPerUser
          : current.maxUsesPerUser,
    };
    const updated = normalizeMutationInput(merged, { requireCode: true });

    const nextCatalog = [...coupons];
    nextCatalog[index] = updated;
    await this.saveCatalog(nextCatalog);
    return { data: updated };
  }

  async deleteCoupon(code: string) {
    const couponCode = normalizeCode(code);
    const coupons = await this.getRawCatalog();
    const nextCatalog = coupons.filter((coupon) => coupon.code !== couponCode);
    if (nextCatalog.length === coupons.length) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Coupon not found",
        detail: `Coupon '${couponCode}' does not exist`,
      };
    }

    await this.saveCatalog(nextCatalog);
    return { success: true };
  }
}

export const adminCouponsService = new AdminCouponsService();
