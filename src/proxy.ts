import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { defaultLocale, isLocale } from "@/lib/i18n/config";

function nextWithPathname(request: NextRequest, pathname: string): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

function resolveR2PublicBase(): string {
  return (
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL ||
    process.env.R2_PUBLIC_URL ||
    process.env.R2_PUBLIC_BASE_URL ||
    ""
  ).replace(/\/$/, "");
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Static assets live on R2 — rewrite before Next looks on disk / Image opt.
  if (pathname.startsWith("/assets/") || pathname.startsWith("/images/")) {
    const base = resolveR2PublicBase();
    if (base) {
      return NextResponse.rewrite(new URL(`${base}${pathname}`));
    }
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
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
