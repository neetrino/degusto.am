import { z } from "zod";
import { normalizeProductCustomizations } from "@/lib/cart/customizations";

export const checkoutSchema = z.object({
  cartId: z.string().trim().min(1).optional(),
  items: z
    .array(
      z.object({
        variantId: z.string().trim().min(1),
        productId: z.string().trim().min(1),
        quantity: z.number().int().min(1).max(999),
        customizations: z.unknown().optional().transform((value) =>
          normalizeProductCustomizations(value)
        ),
      })
    )
    .max(100)
    .optional(),
  email: z.string().trim().email("Invalid email"),
  phone: z.string().trim().min(1),
  shippingAddress: z
    .object({
      city: z.string().trim().max(100).optional(),
      addressLine1: z.string().trim().max(200).optional(),
      addressLine2: z.string().trim().max(200).optional(),
      firstName: z.string().trim().max(80).optional(),
      lastName: z.string().trim().max(80).optional(),
      postalCode: z.string().trim().max(40).optional(),
      countryCode: z.string().trim().max(10).optional(),
      phone: z.string().trim().max(30).optional(),
      state: z.string().trim().max(80).optional(),
    })
    .optional(),
  paymentMethod: z.string().trim().min(1),
  shippingMethod: z.string().trim().min(1),
  couponCode: z.string().trim().max(64).optional(),
  notes: z.string().trim().max(2000).optional(),
  cashChangeFrom: z.number().nonnegative().optional(),
});

export type CheckoutRequestInput = z.infer<typeof checkoutSchema>;

export function safeParseCheckout(
  body: unknown
): ReturnType<typeof checkoutSchema.safeParse> {
  return checkoutSchema.safeParse(body);
}
