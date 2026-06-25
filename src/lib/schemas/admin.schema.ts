import { z } from "zod";
import { ALLOWED_USER_ROLES } from "@/lib/auth/user-roles.constants";

const orderStatusSchema = z.enum(["pending", "processing", "completed", "cancelled"]);
const paymentStatusSchema = z.enum(["pending", "paid", "failed", "refunded"]);
const fulfillmentStatusSchema = z.enum(["unfulfilled", "fulfilled", "shipped", "delivered"]);
const allowedRoleSchema = z.enum(ALLOWED_USER_ROLES);

export const adminOrderUpdateSchema = z
  .object({
    status: orderStatusSchema.optional(),
    paymentStatus: paymentStatusSchema.optional(),
    fulfillmentStatus: fulfillmentStatusSchema.optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.status !== undefined ||
      data.paymentStatus !== undefined ||
      data.fulfillmentStatus !== undefined,
    {
      message: "At least one updatable field is required",
      path: ["status"],
    }
  );

export const adminUserUpdateSchema = z
  .object({
    blocked: z.boolean().optional(),
    roles: z.array(allowedRoleSchema).min(1).max(10).optional(),
  })
  .strict()
  .refine((data) => data.blocked !== undefined || data.roles !== undefined, {
    message: "At least one updatable field is required",
    path: ["blocked"],
  });

export type AdminOrderUpdateInput = z.infer<typeof adminOrderUpdateSchema>;
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;

export function safeParseAdminOrderUpdate(
  body: unknown
): ReturnType<typeof adminOrderUpdateSchema.safeParse> {
  return adminOrderUpdateSchema.safeParse(body);
}

export function safeParseAdminUserUpdate(
  body: unknown
): ReturnType<typeof adminUserUpdateSchema.safeParse> {
  return adminUserUpdateSchema.safeParse(body);
}
