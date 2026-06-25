import { db } from "@white-shop/db";

/** Remove persisted cart for a user after confirmed payment. */
export async function clearUserCartAfterPayment(userId: string | null | undefined): Promise<void> {
  if (!userId) {
    return;
  }

  const cart = await db.cart.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!cart) {
    return;
  }

  await db.cart.delete({ where: { id: cart.id } });
}
