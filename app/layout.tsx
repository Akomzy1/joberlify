import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/server'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ConditionalNavbar } from '@/components/layout/ConditionalNavbar'
import './globals.css'

const BASE_URL = 'https://joberlify.com'

export const metadata: Metadata = {
  // ── Title ──────────────────────────────────────────────────────────────────
  title: {
    default:  'Joberlify — AI-Powered Job Search Intelligence',
    template: '%s | Joberlify — AI Job Search Intelligence',
  },

  // ── Core meta ─────────────────────────────────────────────────────────────
  description:
    'Joberlify evaluates job fit across 10 dimensions, generates tailored ATS-optimised CVs, and checks visa sponsorship eligibility across 120,000+ UK sponsors. Find the right job, anywhere in the world.',
  keywords: [
    'AI job search tool',
    'job fit scoring',
    'visa sponsorship jobs UK',
    'ATS-optimised CV generator',
    'job application tracker',
    'UK visa sponsor checker',
    'skilled worker visa',
    'job evaluation AI',
    'career intelligence tool',
  ],
  authors:  [{ name: 'Joberlify', url: BASE_URL }],

  // ── Canonical base (resolves all relative metadata URLs) ──────────────────
  metadataBase: new URL(BASE_URL),

  // ── Icons & manifest ──────────────────────────────────────────────────────
  icons: {
    icon:             [
      { url: '/favicon.ico',   sizes: 'any'   },
      { url: '/icon.svg',      type: 'image/svg+xml' },
    ],
    apple:            '/apple-touch-icon.png',
    shortcut:         '/favicon.ico',
  },
  manifest: '/manifest.json',

  // ── Open Graph ────────────────────────────────────────────────────────────
  // og:image is auto-populated by app/opengraph-image.tsx (Next.js convention)
  openGraph: {
    type:        'website',
    locale:      'en_GB',
    siteName:    'Joberlify',
    title:       'Joberlify — AI-Powered Job Search Intelligence',
    description: 'Score job fit across 10 dimensions, generate tailored CVs, and navigate UK visa sponsorship — with honesty, not hype.',
    url:         BASE_URL,
  },

  // ── Twitter / X ───────────────────────────────────────────────────────────
  // twitter:image is auto-populated by app/opengraph-image.tsx
  twitter: {
    card:        'summary_large_image',
    site:        '@joberlify',
    creator:     '@joberlify',
    title:       'Joberlify — AI-Powered Job Search Intelligence',
    description: 'Score job fit across 10 dimensions. Generate tailored CVs. Navigate UK visa sponsorship.',
  },

  // ── Default robots — override per-page for private routes ─────────────────
  robots: {
    index:   true,
    follow:  true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },

  // ── Verification placeholders (fill in after Search Console setup) ─────────
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? '',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1E3A5F',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Fetch initial user server-side to avoid auth flash
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="en" className="h-full">
      <head>
        {/* Satoshi — distinctive display font (headings, wordmark) */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&display=swap"
        />
        {/* JetBrains Mono — scores, data, code */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {/* Noise texture overlay — 2.5% opacity for tactile depth */}
        <div
          aria-hidden
          className="noise-overlay"
        />

        <AuthProvider initialUser={user}>
          <ConditionalNavbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </AuthProvider>

        {/* Vercel Web Analytics — no package required, auto-injected on Vercel deployments */}
        <Script
          src="/_vercel/insights/script.js"
          strategy="afterInteractive"
          data-endpoint="/_vercel/insights"
        />
        {/* Vercel Speed Insights */}
        <Script
          src="/_vercel/speed-insights/script.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
