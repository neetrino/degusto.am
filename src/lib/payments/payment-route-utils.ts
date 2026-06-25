import { NextResponse } from "next/server";
import { buildAppUrl } from "./app-url";

export function redirectToCheckoutSuccess(orderNumber: string): NextResponse {
  const url = buildAppUrl(
    `/checkout/success?order=${encodeURIComponent(orderNumber)}`
  );
  return NextResponse.redirect(url, { status: 302 });
}

export function redirectToCheckoutError(orderNumber: string): NextResponse {
  const url = buildAppUrl(
    `/checkout/error?order=${encodeURIComponent(orderNumber)}`
  );
  return NextResponse.redirect(url, { status: 302 });
}

export function plainTextResponse(body: string, status = 200): NextResponse {
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
