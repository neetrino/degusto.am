import { db } from "@white-shop/db";
import * as bcrypt from "bcryptjs";

interface AddressMutationInput {
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  countryCode?: string;
  phone?: string | null;
  isDefault?: boolean;
}

interface ProfileMutationInput {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  locale?: string;
}

interface StoredCoupon {
  code: string;
  description?: string;
  discountType?: "percent" | "fixed";
  discountValue?: number;
  isActive?: boolean;
  startsAt?: string;
  expiresAt?: string;
  minOrderAmount?: number;
}

interface UserCouponListItem {
  code: string;
  description: string | null;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderAmount: number | null;
  expiresAt: string | null;
  isActive: boolean;
}

interface UserCouponHistoryItem {
  orderNumber: string;
  usedAt: string;
  discountAmount: number;
  code: string | null;
}

const MAX_WISHLIST_ITEMS = 200;

function normalizeOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isSimpleValidEmail(value: string): boolean {
  if (!value || value.includes(" ")) {
    return false;
  }

  const atIndex = value.indexOf("@");
  if (atIndex <= 0 || atIndex !== value.lastIndexOf("@") || atIndex >= value.length - 1) {
    return false;
  }

  const local = value.slice(0, atIndex);
  const domain = value.slice(atIndex + 1);
  if (!local || !domain || domain.startsWith(".") || domain.endsWith(".")) {
    return false;
  }

  const dotIndex = domain.indexOf(".");
  if (dotIndex <= 0 || dotIndex === domain.length - 1) {
    return false;
  }

  return true;
}

function normalizeAddressInput(data: unknown): AddressMutationInput {
  if (!data || typeof data !== "object") {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Address payload must be an object",
    };
  }

  const input = data as Record<string, unknown>;
  const addressLine1 = normalizeOptionalString(input.addressLine1);
  const city = normalizeOptionalString(input.city);
  const countryCodeRaw = normalizeOptionalString(input.countryCode);

  if (!addressLine1) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "addressLine1 is required",
    };
  }

  if (!city) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "city is required",
    };
  }

  const countryCode = (countryCodeRaw ?? "AM").toUpperCase();
  if (!/^[A-Z]{2,3}$/.test(countryCode)) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "countryCode must be a valid 2-3 letter code",
    };
  }

  return {
    firstName: normalizeOptionalString(input.firstName),
    lastName: normalizeOptionalString(input.lastName),
    company: normalizeOptionalString(input.company),
    addressLine1,
    addressLine2: normalizeOptionalString(input.addressLine2),
    city,
    state: normalizeOptionalString(input.state),
    postalCode: normalizeOptionalString(input.postalCode),
    countryCode,
    phone: normalizeOptionalString(input.phone),
    isDefault: input.isDefault === true,
  };
}

function normalizeProfileInput(data: unknown): ProfileMutationInput {
  if (!data || typeof data !== "object") {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Profile payload must be an object",
    };
  }

  const input = data as Record<string, unknown>;
  const emailRaw = normalizeOptionalString(input.email);
  const phoneRaw = normalizeOptionalString(input.phone);
  const localeRaw = normalizeOptionalString(input.locale);
  const email = typeof emailRaw === "string" ? emailRaw.toLowerCase() : emailRaw;

  if (email && !isSimpleValidEmail(email)) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Email format is invalid",
    };
  }

  if (typeof phoneRaw === "string") {
    const digits = phoneRaw.replace(/\D/g, "");
    if (digits.length < 6) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: "Phone format is invalid",
      };
    }
  }

  if (localeRaw && !/^[a-z]{2}(?:-[A-Z]{2})?$/.test(localeRaw)) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Locale format is invalid",
    };
  }

  return {
    firstName: normalizeOptionalString(input.firstName),
    lastName: normalizeOptionalString(input.lastName),
    email,
    phone: phoneRaw,
    locale: localeRaw ?? undefined,
  };
}

function toDateOrNull(input: string | undefined): Date | null {
  if (!input) {
    return null;
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function extractCouponCodeFromNotes(notes: string | null): string | null {
  if (!notes) {
    return null;
  }
  const match = notes.match(/(?:coupon|promo)\s*(?:code)?\s*[:=-]\s*([A-Za-z0-9_-]{3,32})/i);
  return match?.[1] ?? null;
}

function normalizeWishlistIds(input: unknown): string[] {
  if (!Array.isArray(input)) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "ids must be an array of product ids",
    };
  }

  const unique = new Set<string>();
  for (const raw of input) {
    if (typeof raw !== "string") {
      continue;
    }
    const id = raw.trim();
    if (!id) {
      continue;
    }
    unique.add(id);
    if (unique.size >= MAX_WISHLIST_ITEMS) {
      break;
    }
  }

  return Array.from(unique);
}

class UsersService {
  async getWishlistIds(userId: string): Promise<{ ids: string[] }> {
    const items = await db.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        productId: true,
        product: {
          select: {
            published: true,
            deletedAt: true,
          },
        },
      },
    });

    const staleProductIds = items
      .filter((item) => !item.product.published || item.product.deletedAt)
      .map((item) => item.productId);

    if (staleProductIds.length > 0) {
      await db.wishlistItem.deleteMany({
        where: {
          userId,
          productId: { in: staleProductIds },
        },
      });
    }

    const ids = items
      .filter((item) => item.product.published && !item.product.deletedAt)
      .map((item) => item.productId);

    return { ids };
  }

  async replaceWishlistIds(userId: string, input: unknown): Promise<{ ids: string[] }> {
    const ids = normalizeWishlistIds(input);
    if (ids.length === 0) {
      await db.wishlistItem.deleteMany({ where: { userId } });
      return { ids: [] };
    }

    const allowedProducts = await db.product.findMany({
      where: {
        id: { in: ids },
        published: true,
        deletedAt: null,
      },
      select: { id: true },
    });
    const allowedIdSet = new Set(allowedProducts.map((product) => product.id));
    const sanitizedIds = ids.filter((id) => allowedIdSet.has(id));

    await db.$transaction(async (tx) => {
      await tx.wishlistItem.deleteMany({ where: { userId } });

      if (sanitizedIds.length > 0) {
        await tx.wishlistItem.createMany({
          data: sanitizedIds.map((productId) => ({ userId, productId })),
          skipDuplicates: true,
        });
      }
    });

    return { ids: sanitizedIds };
  }

  async syncWishlist(userId: string, localIdsInput: unknown): Promise<{ ids: string[] }> {
    const localIds = normalizeWishlistIds(localIdsInput);
    const server = await this.getWishlistIds(userId);
    const merged = Array.from(new Set([...localIds, ...server.ids])).slice(0, MAX_WISHLIST_ITEMS);
    return this.replaceWishlistIds(userId, merged);
  }

  async addWishlistItem(userId: string, productId: string): Promise<{ ids: string[] }> {
    const normalizedProductId = typeof productId === "string" ? productId.trim() : "";
    if (!normalizedProductId) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: "productId is required",
      };
    }

    const product = await db.product.findFirst({
      where: {
        id: normalizedProductId,
        published: true,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!product) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Product not found",
      };
    }

    await db.wishlistItem.createMany({
      data: [{ userId, productId: normalizedProductId }],
      skipDuplicates: true,
    });

    return this.getWishlistIds(userId);
  }

  async removeWishlistItem(userId: string, productId: string): Promise<{ ids: string[] }> {
    const normalizedProductId = typeof productId === "string" ? productId.trim() : "";
    if (!normalizedProductId) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: "productId is required",
      };
    }

    await db.wishlistItem.deleteMany({
      where: { userId, productId: normalizedProductId },
    });

    return this.getWishlistIds(userId);
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        locale: true,
        roles: true,
        addresses: true,
        passwordHash: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "User not found",
      };
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      locale: user.locale,
      roles: user.roles,
      addresses: user.addresses,
      hasPassword: Boolean(user.passwordHash),
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: unknown) {
    const payload = normalizeProfileInput(data);
    const current = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phone: true, deletedAt: true },
    });

    if (!current || current.deletedAt) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "User not found",
      };
    }

    const conflictWhere = [];
    if (payload.email && payload.email !== current.email) {
      conflictWhere.push({ email: payload.email });
    }
    if (payload.phone && payload.phone !== current.phone) {
      conflictWhere.push({ phone: payload.phone });
    }
    if (conflictWhere.length > 0) {
      const existing = await db.user.findFirst({
        where: {
          id: { not: userId },
          deletedAt: null,
          OR: conflictWhere,
        },
        select: { id: true },
      });
      if (existing) {
        throw {
          status: 409,
          type: "https://api.shop.am/problems/conflict",
          title: "Conflict",
          detail: "User with this email or phone already exists",
        };
      }
    }

    const user = await db.user.update({
      where: { id: userId },
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        locale: payload.locale,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        locale: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      locale: user.locale,
    };
  }

  /**
   * Change password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    // Validate input parameters
    if (!oldPassword || typeof oldPassword !== 'string' || oldPassword.trim() === '') {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: "Old password is required and must be a non-empty string",
      };
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: "New password is required and must be a non-empty string",
      };
    }

    if (oldPassword.trim() === newPassword.trim()) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: "New password must be different from current password",
      };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw {
        status: 401,
        type: "https://api.shop.am/problems/unauthorized",
        title: "Invalid credentials",
        detail: "User not found or password not set",
      };
    }

    // Validate that passwordHash is a valid string
    if (typeof user.passwordHash !== 'string' || user.passwordHash.trim() === '') {
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: "User password hash is invalid",
      };
    }

    try {
      const isValid = await bcrypt.compare(oldPassword.trim(), user.passwordHash);
      if (!isValid) {
        throw {
          status: 401,
          type: "https://api.shop.am/problems/unauthorized",
          title: "Invalid password",
          detail: "The old password is incorrect",
        };
      }
    } catch (bcryptError: any) {
      // Handle bcrypt errors
      console.error("❌ [USERS SERVICE] bcrypt.compare error:", {
        error: bcryptError,
        message: bcryptError?.message,
        userId,
        hasOldPassword: !!oldPassword,
        hasPasswordHash: !!user.passwordHash,
      });
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: "Failed to verify password",
      };
    }

    try {
      const newPasswordHash = await bcrypt.hash(newPassword.trim(), 10);
      await db.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
        select: { id: true },
      });

      return { success: true };
    } catch (hashError: any) {
      console.error("❌ [USERS SERVICE] bcrypt.hash error:", {
        error: hashError,
        message: hashError?.message,
        userId,
      });
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: "Failed to hash new password",
      };
    }
  }

  /**
   * Remove user row and unlink orders (same as self-service delete).
   */
  async permanentlyDeleteUserById(userId: string): Promise<void> {
    await db.$transaction(async (tx) => {
      await tx.order.updateMany({
        where: { userId },
        data: { userId: null },
      });
      await tx.user.delete({
        where: { id: userId },
      });
    });
  }

  /**
   * Permanently remove the authenticated user's row so email/phone can be registered again.
   * Orders stay with userId cleared. Requires password or email/phone confirmation.
   */
  async deleteMyAccount(
    userId: string,
    credentials: { password?: string; confirmation?: string }
  ) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        passwordHash: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "User not found",
      };
    }

    const digitsOnly = (value: string) => value.replace(/\D/g, "");

    if (user.passwordHash) {
      const password = credentials.password?.trim() ?? "";
      if (!password) {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          detail: "Current password is required to delete your account",
        };
      }
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        throw {
          status: 401,
          type: "https://api.shop.am/problems/unauthorized",
          title: "Invalid password",
          detail: "The password you entered is incorrect",
        };
      }
    } else {
      const email = user.email?.trim().toLowerCase() ?? "";
      const phone = user.phone?.trim() ?? "";
      if (!email && !phone) {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          detail: "This account cannot be deleted automatically. Please contact support.",
        };
      }
      const confirmation = credentials.confirmation?.trim() ?? "";
      if (!confirmation) {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          detail: "Confirmation is required: enter the email or phone on this account",
        };
      }
      const confLower = confirmation.toLowerCase();
      const emailMatch = email.length > 0 && confLower === email;
      const phoneMatch =
        phone.length > 0 &&
        (confirmation === phone || digitsOnly(confirmation) === digitsOnly(phone));
      if (!emailMatch && !phoneMatch) {
        throw {
          status: 401,
          type: "https://api.shop.am/problems/unauthorized",
          title: "Confirmation does not match",
          detail: "The value you entered does not match your email or phone",
        };
      }
    }

    await this.permanentlyDeleteUserById(userId);

    return { success: true };
  }

  /**
   * Get addresses
   */
  async getAddresses(userId: string) {
    const addresses = await db.address.findMany({
      where: { userId },
      orderBy: { isDefault: "desc" },
    });

    return { data: addresses };
  }

  /**
   * Add address
   */
  async addAddress(userId: string, data: unknown) {
    const payload = normalizeAddressInput(data);
    const existingCount = await db.address.count({ where: { userId } });
    const shouldBeDefault = payload.isDefault || existingCount === 0;

    return await db.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          firstName: payload.firstName,
          lastName: payload.lastName,
          company: payload.company,
          addressLine1: payload.addressLine1,
          addressLine2: payload.addressLine2,
          city: payload.city,
          state: payload.state,
          postalCode: payload.postalCode,
          countryCode: payload.countryCode || "AM",
          phone: payload.phone,
          isDefault: shouldBeDefault,
        },
      });
    });
  }

  /**
   * Update address
   */
  async updateAddress(userId: string, addressId: string, data: unknown) {
    const address = await db.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Address not found",
      };
    }

    const payload = normalizeAddressInput(data);
    const shouldBeDefault = payload.isDefault === true;

    return await db.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true, id: { not: addressId } },
          data: { isDefault: false },
        });
      }

      const updated = await tx.address.update({
        where: { id: addressId },
        data: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          company: payload.company,
          addressLine1: payload.addressLine1,
          addressLine2: payload.addressLine2,
          city: payload.city,
          state: payload.state,
          postalCode: payload.postalCode,
          countryCode: payload.countryCode || "AM",
          phone: payload.phone,
          isDefault: shouldBeDefault ? true : address.isDefault,
        },
      });

      if (!updated.isDefault) {
        const defaultCount = await tx.address.count({
          where: { userId, isDefault: true },
        });
        if (defaultCount === 0) {
          await tx.address.update({
            where: { id: updated.id },
            data: { isDefault: true },
          });
          return { ...updated, isDefault: true };
        }
      }

      return updated;
    });
  }

  /**
   * Delete address
   */
  async deleteAddress(userId: string, addressId: string) {
    const address = await db.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Address not found",
      };
    }

    await db.$transaction(async (tx) => {
      await tx.address.delete({
        where: { id: addressId },
      });

      if (address.isDefault) {
        const nextAddress = await tx.address.findFirst({
          where: { userId },
          orderBy: { id: "asc" },
        });
        if (nextAddress) {
          await tx.address.update({
            where: { id: nextAddress.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return null;
  }

  /**
   * Set default address
   */
  async setDefaultAddress(userId: string, addressId: string) {
    const target = await db.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!target) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Address not found",
      };
    }

    return await db.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });
  }

  /**
   * Get user dashboard statistics
   */
  async getDashboard(userId: string) {
    // Get all orders for the user
    const orders = await db.order.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate statistics
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o: { status: string }) => o.status === "pending").length;
    const completedOrders = orders.filter((o: { status: string }) => o.status === "completed").length;
    const totalSpent = orders
      .filter((o: { status: string; paymentStatus: string }) => o.status === "completed" || o.paymentStatus === "paid")
      .reduce((sum: number, o: { total: number }) => sum + o.total, 0);

    // Count addresses
    const addressesCount = await db.address.count({
      where: { userId },
    });

    // Count orders by status
    const ordersByStatus: Record<string, number> = {};
    orders.forEach((order: { status: string }) => {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });

    // Get recent orders (last 5)
    const recentOrders = orders.slice(0, 5).map((order: { id: string; number: string; status: string; paymentStatus: string; fulfillmentStatus: string; total: number; subtotal: number; discountAmount: number; shippingAmount: number; taxAmount: number; currency: string | null; createdAt: Date; items: Array<unknown> }) => ({
      id: order.id,
      number: order.number,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      total: order.total,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      shippingAmount: order.shippingAmount,
      taxAmount: order.taxAmount,
      currency: order.currency,
      itemsCount: order.items.length,
      createdAt: order.createdAt.toISOString(),
    }));

    return {
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalSpent,
        addressesCount,
        ordersByStatus,
      },
      recentOrders,
    };
  }

  /**
   * Get available coupons and coupon usage history for profile page.
   */
  async getCoupons(userId: string): Promise<{
    availableCoupons: UserCouponListItem[];
    history: UserCouponHistoryItem[];
  }> {
    const [couponSettings, discountedOrders] = await Promise.all([
      db.settings.findUnique({
        where: { key: "couponsCatalog" },
        select: { value: true },
      }),
      db.order.findMany({
        where: {
          userId,
          discountAmount: { gt: 0 },
        },
        select: {
          number: true,
          discountAmount: true,
          createdAt: true,
          notes: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    const now = new Date();
    const rawCoupons = Array.isArray(couponSettings?.value)
      ? (couponSettings?.value as unknown[])
      : [];
    const availableCoupons = rawCoupons
      .map((item): UserCouponListItem | null => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const raw = item as StoredCoupon;
        const code = (raw.code ?? "").trim();
        if (!code) {
          return null;
        }
        const startsAt = toDateOrNull(raw.startsAt);
        const expiresAt = toDateOrNull(raw.expiresAt);
        const enabledByWindow =
          (!startsAt || startsAt <= now) && (!expiresAt || expiresAt >= now);
        const isActive = (raw.isActive ?? true) && enabledByWindow;
        return {
          code,
          description: raw.description?.trim() || null,
          discountType: raw.discountType === "fixed" ? "fixed" : "percent",
          discountValue:
            typeof raw.discountValue === "number" && Number.isFinite(raw.discountValue)
              ? raw.discountValue
              : 0,
          minOrderAmount:
            typeof raw.minOrderAmount === "number" && Number.isFinite(raw.minOrderAmount)
              ? raw.minOrderAmount
              : null,
          expiresAt: expiresAt ? expiresAt.toISOString() : null,
          isActive,
        };
      })
      .filter((coupon): coupon is UserCouponListItem => Boolean(coupon))
      .sort((a, b) => Number(b.isActive) - Number(a.isActive));

    const history = discountedOrders.map((order) => ({
      orderNumber: order.number,
      usedAt: order.createdAt.toISOString(),
      discountAmount: Number(order.discountAmount),
      code: extractCouponCodeFromNotes(order.notes),
    }));

    return { availableCoupons, history };
  }
}

export const usersService = new UsersService();

