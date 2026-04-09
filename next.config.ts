import type { NextConfig } from 'next'

// ─── Security Headers ─────────────────────────────────────────────────────────
// Applied to all routes. Strict-Transport-Security only applies over HTTPS
// so it is safe to set in production.

const SECURITY_HEADERS = [
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Reflected XSS filter (legacy browsers)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Referrer leakage — only send origin on cross-origin requests
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restrict browser features we don't use
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // HSTS — 2 years, include subdomains, ready for preload list
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const nextConfig: NextConfig = {
  // ── Remove "X-Powered-By: Next.js" header ───────────────────────────────
  poweredByHeader: false,

  // ── Compression ──────────────────────────────────────────────────────────
  compress: true,

  // ── React strict mode ────────────────────────────────────────────────────
  reactStrictMode: true,

  // ── Image optimization ───────────────────────────────────────────────────
  // Add your Supabase project hostname once you know it.
  // Format: { protocol: 'https', hostname: 'xxx.supabase.co' }
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Supabase storage (replace with your actual project ref)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // ── Security headers ─────────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
      {
        // Public API routes: allow CDN caching for sponsor searches
        source: '/api/visa/sponsors',
        headers: [
          ...SECURITY_HEADERS,
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },

  // ── Redirects ─────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Legacy routes — add as needed
      // { source: '/old-path', destination: '/new-path', permanent: true },
    ]
  },
}

export default nextConfig
