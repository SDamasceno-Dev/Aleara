import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseHost = (() => {
      try {
        return new URL(supabaseUrl).host;
      } catch {
        return '';
      }
    })();
    const csp = [
      `default-src 'self'`,
      `base-uri 'self'`,
      `frame-ancestors 'none'`,
      // images (local + google avatars + data/blob)
      `img-src 'self' data: blob: https: lh3.googleusercontent.com`,
      // scripts (in dev allow unsafe-eval for HMR)
      `script-src 'self'${isProd ? '' : ` 'unsafe-eval'`}`,
      // styles (Tailwind inline)
      `style-src 'self' 'unsafe-inline'`,
      `font-src 'self' data:`,
      // supabase APIs/ws + same-origin
      supabaseHost
        ? `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`
        : `connect-src 'self'`,
      `form-action 'self'`,
      isProd ? `upgrade-insecure-requests` : ``,
    ]
      .filter(Boolean)
      .join('; ');

    return [
      // Global security headers
      {
        source: '/:path*',
        headers: [
          ...(isProd ? [{ key: 'Content-Security-Policy', value: csp }] : []),
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          ...(isProd
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]
            : []),
        ],
      },
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Next static assets
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Dev UX
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
