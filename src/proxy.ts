import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { defaultLocale, isLocale } from "@/lib/i18n/config";
import {
  isUnprefixedLegacyProductIdPath,
  resolveLegacyRedirect,
} from "@/lib/legacy-urls/legacy-path-map";
import { isLegacyPaymentPath } from "@/lib/payments/legacy-callback-paths";

function nextWithPathname(request: NextRequest, pathname: string): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

function redirectPermanent(
  request: NextRequest,
  destination: string,
): NextResponse {
  const url = request.nextUrl.clone();
  const parsed = new URL(destination, request.nextUrl.origin);
  url.pathname = parsed.pathname;
  url.search = parsed.search;
  return NextResponse.redirect(url, 308);
}

function resolveR2PublicBase(): string {
  return (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, "");
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Static assets live on R2 — rewrite before Next looks on disk / Image opt.
  if (
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/uploads/")
  ) {
    const base = resolveR2PublicBase();
    if (base) {
      return NextResponse.rewrite(new URL(`${base}${pathname}`));
    }
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    isLegacyPaymentPath(pathname) ||
    pathname.includes(".")
  ) {
    return nextWithPathname(request, pathname);
  }

  const legacyDestination = resolveLegacyRedirect(
    pathname,
    request.nextUrl.searchParams,
  );
  if (legacyDestination) {
    return redirectPermanent(request, legacyDestination);
  }

  if (isUnprefixedLegacyProductIdPath(pathname)) {
    return nextWithPathname(request, pathname);
  }

  const pathLocale = pathname.split("/")[1];

  if (pathLocale && isLocale(pathLocale)) {
    return nextWithPathname(request, pathname);
  }

  const url = request.nextUrl.clone();
  url.pathname =
    pathname === "/"
      ? `/${defaultLocale}`
      : `/${defaultLocale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
