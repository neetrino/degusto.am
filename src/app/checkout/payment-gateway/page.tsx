'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BodyBackground } from '../../../components/BodyBackground';
import { CHECKOUT_TEXT_INK_MUTED } from '../checkout-ui';

const REDIRECT_DELAY_MS = 1500;

export default function CheckoutPaymentGatewayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');
  const provider = searchParams.get('provider');
  const isGuest = searchParams.get('guest') === '1';

  useEffect(() => {
    if (!orderNumber) {
      router.replace('/orders');
      return;
    }
    const timeoutId = window.setTimeout(() => {
      if (isGuest) {
        router.replace(
          `/checkout/success?order=${encodeURIComponent(orderNumber)}&payment=initiated&provider=${encodeURIComponent(
            provider || 'unknown'
          )}`
        );
        return;
      }
      router.replace(`/orders/${encodeURIComponent(orderNumber)}?payment=initiated&provider=${encodeURIComponent(provider || 'unknown')}`);
    }, REDIRECT_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [orderNumber, provider, isGuest, router]);

  return (
    <>
      <BodyBackground color="#ffffff" />
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mb-6 h-11 w-11 animate-spin rounded-full border-2 border-[#F66812]/25 border-t-[#F66812]" />
        <h1 className="text-2xl font-bold text-[#1F2E1F]">Redirecting to payment...</h1>
        <p className={`mt-3 text-sm ${CHECKOUT_TEXT_INK_MUTED}`}>
          Please wait while we prepare your secure {provider ? provider.toUpperCase() : 'card'} payment session.
        </p>
      </div>
    </>
  );
}
