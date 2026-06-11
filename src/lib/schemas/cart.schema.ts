import { z } from "zod";

import type { ProductCustomizations } from "@/lib/cart/customizations";

const cartItemRequestSchema = z.object({
  variantId: z.string().trim().min(1, "variantId is required"),
  productId: z.string().trim().min(1, "productId is required"),
  quantity: z.number().int().min(1).max(999).optional(),
  customizations: z.custom<ProductCustomizations>().optional(),
});

export type CartItemRequestInput = z.infer<typeof cartItemRequestSchema>;

export function safeParseCartItemRequest(
  body: unknown
): ReturnType<typeof cartItemRequestSchema.safeParse> {
  return cartItemRequestSchema.safeParse(body);
}
