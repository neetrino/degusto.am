import { paymentCallbackNotWired } from "@/lib/payments/callback-not-wired";

export const dynamic = "force-dynamic";

/** Live Ineco returnUrl: https://degusto.am/inecobank/result */
export function GET(): Response {
  return paymentCallbackNotWired();
}

export function POST(): Response {
  return paymentCallbackNotWired();
}
