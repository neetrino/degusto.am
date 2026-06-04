import { db } from "@white-shop/db";
import { problemTypes } from "@/lib/http/problem-details";

import { MAX_COMPARE_ITEMS } from "@/lib/compare/constants";

function buildOwnerKey(userId: string | null, guestToken: string | null): string {
  if (userId) {
    return `user:${userId}`;
  }
  if (guestToken) {
    return `guest:${guestToken}`;
  }
  throw {
    status: 400,
    type: problemTypes.validationError,
    title: "Validation failed",
    detail: "A guest session or authenticated user is required",
  };
}

function buildGuestOwnerKey(guestToken: string): string {
  return `guest:${guestToken}`;
}

class CompareService {
  async getCompareIds(
    userId: string | null,
    guestToken: string | null
  ): Promise<{ ids: string[] }> {
    if (!userId && !guestToken) {
      return { ids: [] };
    }

    const ownerKey = buildOwnerKey(userId, guestToken);
    const items = await db.compareItem.findMany({
      where: { ownerKey },
      orderBy: { createdAt: "asc" },
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
      await db.compareItem.deleteMany({
        where: {
          ownerKey,
          productId: { in: staleProductIds },
        },
      });
    }

    const ids = items
      .filter((item) => item.product.published && !item.product.deletedAt)
      .map((item) => item.productId);

    return { ids };
  }

  async addCompareItem(
    userId: string | null,
    guestToken: string | null,
    productIdInput: unknown
  ): Promise<{ ids: string[] }> {
    const productId = typeof productIdInput === "string" ? productIdInput.trim() : "";
    if (!productId) {
      throw {
        status: 400,
        type: problemTypes.validationError,
        title: "Validation Error",
        detail: "productId is required",
      };
    }

    const ownerKey = buildOwnerKey(userId, guestToken);

    const product = await db.product.findFirst({
      where: {
        id: productId,
        published: true,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!product) {
      throw {
        status: 404,
        type: problemTypes.notFound,
        title: "Product not found",
      };
    }

    const current = await this.getCompareIds(userId, guestToken);
    if (current.ids.includes(productId)) {
      return current;
    }

    if (current.ids.length >= MAX_COMPARE_ITEMS) {
      throw {
        status: 422,
        type: problemTypes.validationError,
        title: "Compare limit reached",
        detail: `Maximum ${MAX_COMPARE_ITEMS} products can be compared`,
      };
    }

    await db.compareItem.create({
      data: {
        ownerKey,
        userId: userId ?? null,
        productId,
      },
    });

    return this.getCompareIds(userId, guestToken);
  }

  async removeCompareItem(
    userId: string | null,
    guestToken: string | null,
    productIdInput: unknown
  ): Promise<{ ids: string[] }> {
    const productId = typeof productIdInput === "string" ? productIdInput.trim() : "";
    if (!productId) {
      throw {
        status: 400,
        type: problemTypes.validationError,
        title: "Validation Error",
        detail: "productId is required",
      };
    }

    if (!userId && !guestToken) {
      return { ids: [] };
    }

    const ownerKey = buildOwnerKey(userId, guestToken);
    await db.compareItem.deleteMany({
      where: { ownerKey, productId },
    });

    return this.getCompareIds(userId, guestToken);
  }

  /** Move guest compare rows into the authenticated user's list after login. */
  async mergeGuestCompareIntoUser(guestToken: string, userId: string): Promise<void> {
    const guestOwnerKey = buildGuestOwnerKey(guestToken);
    const userOwnerKey = buildOwnerKey(userId, null);

    const guestItems = await db.compareItem.findMany({
      where: { ownerKey: guestOwnerKey },
      orderBy: { createdAt: "asc" },
      select: { productId: true },
    });

    if (guestItems.length === 0) {
      return;
    }

    const userItems = await db.compareItem.findMany({
      where: { ownerKey: userOwnerKey },
      select: { productId: true },
    });

    const existing = new Set(userItems.map((item) => item.productId));
    const slotsLeft = MAX_COMPARE_ITEMS - existing.size;
    if (slotsLeft <= 0) {
      await db.compareItem.deleteMany({ where: { ownerKey: guestOwnerKey } });
      return;
    }

    const toMerge = guestItems
      .map((item) => item.productId)
      .filter((productId) => !existing.has(productId))
      .slice(0, slotsLeft);

    if (toMerge.length > 0) {
      await db.compareItem.createMany({
        data: toMerge.map((productId) => ({
          ownerKey: userOwnerKey,
          userId,
          productId,
        })),
        skipDuplicates: true,
      });
    }

    await db.compareItem.deleteMany({ where: { ownerKey: guestOwnerKey } });
  }
}

export const compareService = new CompareService();
