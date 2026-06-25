import { db } from "@white-shop/db";
import { bumpSessionEpoch, invalidateCachedUserRoles } from "@/lib/auth/auth-session-store";
import { writeAdminAuditLog } from "@/lib/admin/admin-audit-log.service";
import { problemTypes } from "@/lib/http/problem-details";
import {
  USER_ROLE_ADMIN,
  userHasAdminRole,
} from "@/lib/auth/user-roles.constants";
import type { AdminUserUpdateInput } from "@/lib/schemas/admin.schema";

class AdminUsersService {
  /**
   * Get users
   */
  async getUsers(_filters: unknown) {
    const users = await db.user.findMany({
      where: {
        deletedAt: null,
      },
      take: 100,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        roles: true,
        blocked: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    return {
      data: users.map((user: { id: string; email: string | null; phone: string | null; firstName: string | null; lastName: string | null; roles: string[] | null; blocked: boolean; createdAt: Date; _count?: { orders?: number } }) => ({
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        blocked: user.blocked,
        createdAt: user.createdAt,
        ordersCount: user._count?.orders ?? 0,
      })),
    };
  }

  private async countActiveAdmins(): Promise<number> {
    return db.user.count({
      where: {
        deletedAt: null,
        blocked: false,
        roles: { has: USER_ROLE_ADMIN },
      },
    });
  }

  private async assertLastAdminSafety(
    targetUserId: string,
    data: AdminUserUpdateInput,
  ): Promise<void> {
    const target = await db.user.findUnique({
      where: { id: targetUserId },
      select: { roles: true, blocked: true },
    });
    if (!target) {
      return;
    }

    const targetIsAdmin = userHasAdminRole(target.roles);
    const nextRoles = data.roles ?? target.roles;
    const nextBlocked = data.blocked ?? target.blocked;
    const removesAdmin =
      targetIsAdmin &&
      (!userHasAdminRole(nextRoles) || nextBlocked === true);

    if (!removesAdmin) {
      return;
    }

    const activeAdmins = await this.countActiveAdmins();
    if (activeAdmins <= 1) {
      throw {
        status: 409,
        type: problemTypes.conflict,
        title: "Conflict",
        detail: "Cannot remove or block the last active admin account",
      };
    }
  }

  /**
   * Update user
   */
  async updateUser(
    targetUserId: string,
    data: AdminUserUpdateInput,
    actorId: string,
  ) {
    await this.assertLastAdminSafety(targetUserId, data);

    const updated = await db.user.update({
      where: { id: targetUserId },
      data: {
        blocked: data.blocked,
        roles: data.roles,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        roles: true,
        blocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await invalidateCachedUserRoles(targetUserId);
    if (data.roles !== undefined || data.blocked !== undefined) {
      await bumpSessionEpoch(targetUserId);
    }
    await writeAdminAuditLog({
      actorId,
      action: 'user.update',
      targetType: 'user',
      targetId: targetUserId,
      metadata: {
        blocked: data.blocked,
        roles: data.roles,
      },
    });
    return updated;
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string, actorId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, roles: true, blocked: true },
    });

    if (!user) {
      throw {
        status: 404,
        type: problemTypes.notFound,
        title: "User not found",
        detail: `User with id '${userId}' does not exist`,
      };
    }

    if (userHasAdminRole(user.roles) && !user.blocked) {
      const activeAdmins = await this.countActiveAdmins();
      if (activeAdmins <= 1) {
        throw {
          status: 409,
          type: problemTypes.conflict,
          title: "Conflict",
          detail: "Cannot delete the last active admin account",
        };
      }
    }

    await db.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        blocked: true,
      },
      select: { id: true },
    });

    await invalidateCachedUserRoles(userId);
    await bumpSessionEpoch(userId);
    await writeAdminAuditLog({
      actorId,
      action: 'user.delete',
      targetType: 'user',
      targetId: userId,
    });
    return { success: true };
  }
}

export const adminUsersService = new AdminUsersService();
