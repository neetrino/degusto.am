import { paymentCallbackNotWired } from "@/lib/payments/callback-not-wired";

export const dynamic = "force-dynamic";

/** Live FastShift webhook: https://degusto.am/pay-by-fastshift/webhook */
export function GET(): Response {
  return paymentCallbackNotWired();
}

export function POST(): Response {
  return paymentCallbackNotWired();
}
