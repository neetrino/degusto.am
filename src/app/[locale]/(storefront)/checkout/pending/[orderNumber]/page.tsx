import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { orders } from "@/db/schema";
import { CheckoutPendingView } from "@/features/checkout/ui/CheckoutPendingView";
import { getCurrentUser } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type PendingPageProps = {
  params: Promise<{ locale: string; orderNumber: string }>;
};

export default async function CheckoutPendingPage({
  params,
}: PendingPageProps) {
  const { locale, orderNumber } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const user = await getCurrentUser();
  const [order] = await getDb()
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  if (!order) {
    notFound();
  }

  if (order.userId && user && order.userId !== user.id && user.role !== "ADMIN") {
    notFound();
  }

  if (order.paymentStatus === "CAPTURED") {
    redirect(`/${locale}/checkout/success/${order.orderNumber}`);
  }

  if (order.paymentStatus !== "PENDING") {
    redirect(`/${locale}/checkout?payment=failed`);
  }

  const copy = dictionary.checkout.pending;

  return (
    <CheckoutPendingView
      locale={locale}
      title={copy.title}
      body={copy.body}
      orderNumber={order.orderNumber}
      continueShoppingLabel={copy.continueShopping}
    />
  );
}
