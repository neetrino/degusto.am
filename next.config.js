/** @type {import('next').NextConfig} */
const { PrismaPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin');
const projectRoot = __dirname;

// Vercel Toolbar / Live inject scripts and WebSockets from vercel.live (preview & prod tooling).
const VERCEL_LIVE_SCRIPT = 'https://vercel.live';
const VERCEL_LIVE_CONNECT = `${VERCEL_LIVE_SCRIPT} wss://*.vercel.live`;

if (
  process.env.VERCEL === '1' &&
  typeof process.env.NEXT_PUBLIC_API_URL === 'string' &&
  process.env.NEXT_PUBLIC_API_URL.includes('localhost')
) {
  console.warn(
    '\n[Vercel] NEXT_PUBLIC_API_URL points to localhost. Set it to your real API base (https://...) in Vercel → Settings → Environment Variables. Browser CSP blocks http://localhost from the deployed origin.\n'
  );
}

function buildR2CdnRemotePatterns() {
  const candidates = [process.env.NEXT_PUBLIC_R2_PUBLIC_URL, process.env.R2_PUBLIC_URL].filter(
    Boolean
  );
  const patterns = [];

  for (const raw of candidates) {
    try {
      const parsed = new URL(String(raw).trim());
      if (/\.r2\.cloudflarestorage\.com$/i.test(parsed.hostname)) {
        continue;
      }
      patterns.push({
        protocol: parsed.protocol.replace(':', ''),
        hostname: parsed.hostname,
        pathname: '/**',
      });
    } catch {
      // ignore invalid URL
    }
  }

  return patterns;
}

const nextConfig = {
  reactStrictMode: true,
  // Скрыть индикатор "Compiling..." в углу в dev — не мешает на экране
  devIndicators: false,
  // Bundle Prisma + Neon adapter into serverless functions (externalizing breaks engine/adapter on Vercel).
  serverExternalPackages: ['ws'],
  transpilePackages: ['@shop/ui', '@shop/design-tokens'],
  // Monorepo root for workspace package tracing.
  outputFileTracingRoot: __dirname,
  /** Full cart page removed; drawer-only cart — old URLs go to shop. */
  async redirects() {
    return [
      { source: '/cart', destination: '/shop', permanent: false },
      /** Mobile nav historically linked `/favorites`; wishlist lives at `/wishlist`. */
      { source: '/favorites', destination: '/wishlist', permanent: true },
    ];
  },
  // Security headers (P1-SEC-07)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${VERCEL_LIVE_SCRIPT}`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              `connect-src 'self' https: ${VERCEL_LIVE_CONNECT}`,
              `frame-src 'self' ${VERCEL_LIVE_SCRIPT}`,
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  // typescript.ignoreBuildErrors removed - build will fail on TypeScript errors
  // This ensures type safety in production builds
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com',
        pathname: '/**',
      },
      ...buildR2CdnRemotePatterns(),
    ],
    // Allow unoptimized images for development (images will use unoptimized prop)
    // Ensure image optimization is enabled for production
    formats: ['image/avif', 'image/webp'],
    // In development, disable image optimization globally to allow any local IP
    // Components can still use unoptimized prop, but this ensures all images work
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Fix for HMR issues in Next.js 15
  webpack: (config, { dev, isServer }) => {
    if (isServer) {
      config.plugins = [...(config.plugins ?? []), new PrismaPlugin()];
    }
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    // Resolve workspace packages and path aliases (no path.resolve — avoids Turbopack NFT over-tracing)
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": `${projectRoot}/src`,
      "@shop/ui": `${projectRoot}/shared/ui`,
      "@shop/design-tokens": `${projectRoot}/shared/design-tokens`,
    };
    
    return config;
  },
  // Turbopack configuration for monorepo
  // Required when webpack config is present - Next.js 16 requires explicit turbopack config
  // Use `__dirname` (not `path.resolve`) so Turbopack NFT does not trace the whole tree via `path.*`.
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;

