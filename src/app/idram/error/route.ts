import { paymentCallbackNotWired } from "@/lib/payments/callback-not-wired";

export const dynamic = "force-dynamic";

/** Live Idram FAIL_URL: https://degusto.am/idram/error */
export function GET(): Response {
  return paymentCallbackNotWired();
}

export function POST(): Response {
  return paymentCallbackNotWired();
}
