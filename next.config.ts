import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildLegacyNextRedirects } from "./src/lib/legacy-urls/legacy-path-map";
import { isR2PublicBaseUrlUsable } from "./src/lib/r2/public-base-url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function resolveR2PublicBaseUrl(): string | undefined {
  const raw = (process.env.R2_PUBLIC_BASE_URL || "").trim();
  if (!raw || !isR2PublicBaseUrlUsable(raw)) {
    return undefined;
  }
  return raw.replace(/\/$/, "");
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-src 'self' https://www.google.com https://maps.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://money.idram.am https://banking.idram.am",
    ].join("; "),
  },
];

function buildImageRemotePatterns(): NonNullable<
  NextConfig["images"]
>["remotePatterns"] {
  // `remotePatterns` is evaluated at build time. Always allow R2 public hosts so
  // Vercel builds work even when R2_PUBLIC_BASE_URL is only set at runtime.
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    {
      protocol: "https",
      hostname: "images.pexels.com",
    },
    {
      protocol: "https",
      hostname: "**.r2.dev",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "**.r2.cloudflarestorage.com",
      pathname: "/**",
    },
  ];

  const r2Base = process.env.R2_PUBLIC_BASE_URL;
  if (r2Base) {
    try {
      const url = new URL(r2Base);
      if (url.protocol === "https:" || url.protocol === "http:") {
        patterns.push({
          protocol: url.protocol.replace(":", "") as "http" | "https",
          hostname: url.hostname,
          pathname: "/**",
        });
      }
    } catch {
      // Invalid R2 public base — wildcard *.r2.dev still covers default public URLs.
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  // Must be under `experimental` for Next 16; string form is what the action
  // handler passes through `bytes.parse`. Covers admin multi-image FormData
  // (up to 12 × 5MB) plus multipart overhead.
  experimental: {
    serverActions: {
      bodySizeLimit: "64mb",
    },
    // Proxy (src/proxy.ts) clones request bodies; keep in sync with uploads.
    proxyClientMaxBodySize: "64mb",
  },
  images: {
    remotePatterns: buildImageRemotePatterns(),
  },
  async redirects() {
    return [
      ...buildLegacyNextRedirects(),
      {
        source: "/:locale/admin-mobile",
        destination: "/:locale/admin",
        permanent: true,
      },
      {
        source: "/:locale/admin-mobile/:path*",
        destination: "/:locale/admin",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const base = resolveR2PublicBaseUrl();
    if (!base) {
      return [];
    }
    return [
      { source: "/assets/:path*", destination: `${base}/assets/:path*` },
      { source: "/images/:path*", destination: `${base}/images/:path*` },
      { source: "/uploads/:path*", destination: `${base}/uploads/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
