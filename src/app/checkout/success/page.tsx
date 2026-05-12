'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Order placed successfully</h1>
      <p className="mt-4 text-gray-600">
        {orderNumber
          ? `Your order number is ${orderNumber}.`
          : 'Your order has been created successfully.'}
      </p>
      <p className="mt-2 text-sm text-gray-500">
        Our team will contact you shortly to confirm the order details.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/products"
          className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white"
        >
          Continue shopping
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
