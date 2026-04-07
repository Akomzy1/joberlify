import type { Metadata, Viewport } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ConditionalNavbar } from '@/components/layout/ConditionalNavbar'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Joberlify — Find the right job. Anywhere in the world.',
    template: '%s | Joberlify',
  },
  description:
    'AI-powered job search intelligence. Evaluate fit across 10 dimensions, generate ATS-optimised CVs, and navigate visa sponsorship — with honesty, not hype.',
  keywords: ['job search', 'AI', 'visa sponsorship', 'skilled worker', 'CV', 'ATS'],
  authors: [{ name: 'Joberlify' }],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'Joberlify',
    title: 'Joberlify — Find the right job. Anywhere in the world.',
    description:
      'AI-powered job search intelligence. Evaluate fit, generate CVs, navigate visa sponsorship.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Joberlify — Find the right job. Anywhere in the world.',
    description:
      'AI-powered job search intelligence. Evaluate fit, generate CVs, navigate visa sponsorship.',
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
      </body>
    </html>
  )
}
