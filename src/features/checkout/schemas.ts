import { z } from "zod";

import {
  CHECKOUT_PAYMENT_METHODS,
  isOnlinePaymentAllowed,
} from "@/features/checkout/domain/payment-methods";
import { PICKUP_BRANCH_IDS } from "@/features/checkout/domain/pickup-branches";

export const checkoutSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    contactEmail: z.string().trim().email().max(254),
    contactPhone: z.string().trim().min(5).max(40),
    shippingMethod: z.enum(["pickup", "delivery"]),
    paymentMethod: z.enum(CHECKOUT_PAYMENT_METHODS),
    deliveryRuleId: z.string().uuid().optional(),
    pickupBranchId: z.enum(PICKUP_BRANCH_IDS).optional(),
    city: z.string().trim().max(80).optional(),
    line1: z.string().trim().max(160).optional(),
    line2: z.string().trim().max(160).optional(),
    region: z.string().trim().max(80).optional(),
    postalCode: z.string().trim().max(32).optional(),
    idempotencyKey: z.string().trim().min(8).max(128),
    locale: z.enum(["hy", "en", "ru"]),
    couponCode: z.string().trim().max(64).optional(),
    /** Optional order note from the customer (shown on order details). */
    customerComment: z.string().trim().max(1000).optional(),
    /** Bill the customer will pay with for cash orders; `none` = no change needed. */
    cashChangePreference: z
      .union([
        z.literal("none"),
        z.literal(1000),
        z.literal(5000),
        z.literal(10_000),
        z.literal(20_000),
      ])
      .optional(),
    /** Delivery timing — ignored for pickup. */
    deliveryTimingMode: z.enum(["asap", "scheduled"]).optional(),
    deliverySlotDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    deliverySlotStart: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .optional(),
    deliverySlotEnd: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.shippingMethod === "delivery") {
      if (!value.deliveryRuleId) {
        ctx.addIssue({
          code: "custom",
          path: ["deliveryRuleId"],
          message: "Delivery location is required.",
        });
      }
      if (!value.line1?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["line1"],
          message: "Address is required for delivery.",
        });
      }
      if (!value.deliveryTimingMode) {
        ctx.addIssue({
          code: "custom",
          path: ["deliveryTimingMode"],
          message: "Delivery time is required.",
        });
      }
      if (value.deliveryTimingMode === "scheduled") {
        if (
          !value.deliverySlotDate ||
          !value.deliverySlotStart ||
          !value.deliverySlotEnd
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["deliverySlotDate"],
            message: "Delivery slot is required.",
          });
        }
      }
    }
    if (value.shippingMethod === "pickup" && !value.pickupBranchId) {
      ctx.addIssue({
        code: "custom",
        path: ["pickupBranchId"],
        message: "Pickup branch is required.",
      });
    }
    if (
      value.paymentMethod !== "cash_on_delivery" &&
      !isOnlinePaymentAllowed({
        shippingMethod: value.shippingMethod,
        pickupBranchId: value.pickupBranchId,
      })
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["paymentMethod"],
        message: "Only cash payment is available for this pickup branch.",
      });
    }
    if (
      value.paymentMethod === "cash_on_delivery" &&
      value.cashChangePreference == null
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["cashChangePreference"],
        message: "Cash change preference is required for cash payment.",
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
