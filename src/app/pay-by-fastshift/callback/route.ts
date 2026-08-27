import { paymentCallbackNotWired } from "@/lib/payments/callback-not-wired";

export const dynamic = "force-dynamic";

/** Live FastShift callback: https://degusto.am/pay-by-fastshift/callback */
export function GET(): Response {
  return paymentCallbackNotWired();
}

export function POST(): Response {
  return paymentCallbackNotWired();
}
