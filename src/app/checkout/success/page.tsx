'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BodyBackground } from '../../../components/BodyBackground';
import { CHECKOUT_OUTLINE_BUTTON, CHECKOUT_PRIMARY_BUTTON, CHECKOUT_TEXT_INK_MUTED, CHECKOUT_TEXT_INK_TERTIARY } from '../checkout-ui';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');

  return (
    <>
      <BodyBackground color="#ffffff" />
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-[#1F2E1F]">Order placed successfully</h1>
        <p className={`mt-4 ${CHECKOUT_TEXT_INK_MUTED}`}>
          {orderNumber
            ? `Your order number is ${orderNumber}.`
            : 'Your order has been created successfully.'}
        </p>
        <p className={`mt-2 ${CHECKOUT_TEXT_INK_TERTIARY}`}>
          Our team will contact you shortly to confirm the order details.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/shop"
            className={`rounded-xl px-5 py-2 text-sm font-medium text-white ${CHECKOUT_PRIMARY_BUTTON}`}
          >
            Continue shopping
          </Link>
          <Link
            href="/"
            className={`rounded-xl border bg-white px-5 py-2 text-sm font-medium ${CHECKOUT_OUTLINE_BUTTON}`}
          >
            Back to home
          </Link>
        </div>
      </div>
    </>
  );
}
