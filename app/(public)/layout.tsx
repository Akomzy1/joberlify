/**
 * Public layout — wraps /, /pricing, /sponsors.
 * Loads Clash Display (landing page headlines) alongside the root layout's Satoshi.
 * No additional wrapper element so the root layout's <main> is unaffected.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Clash Display — editorial headline font for the landing page */}
      <link rel="preconnect" href="https://api.fontshare.com" />
      <link
        rel="stylesheet"
        href="https://api.fontshare.com/v2/css?f[]=clash-display@400,600,700&display=swap"
      />
      {children}
    </>
  )
}
