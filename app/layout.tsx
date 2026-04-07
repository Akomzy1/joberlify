import type { Metadata, Viewport } from 'next'
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
    description: 'AI-powered job search intelligence. Evaluate fit, generate CVs, navigate visa sponsorship.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1E3A5F',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Satoshi — distinctive display font via CDN */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&display=swap"
        />
        {/* JetBrains Mono — scores, code, mono data */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  )
}
