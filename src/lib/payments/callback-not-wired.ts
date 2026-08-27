/** Reserved bank callback until the payment adapter is implemented. */
export function paymentCallbackNotWired(): Response {
  return new Response("Payment callback reserved. Handler not wired yet.", {
    status: 503,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
