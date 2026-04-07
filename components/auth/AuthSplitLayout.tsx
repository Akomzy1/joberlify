import Link from 'next/link'

interface AuthSplitLayoutProps {
  children: React.ReactNode
  /** Short headline shown below the wordmark on the left panel */
  headline?: string
  /** Supporting text on the left panel */
  subtext?: string
}

export function AuthSplitLayout({
  children,
  headline = 'Find the right job.\nAnywhere in the world.',
  subtext = 'Honest intelligence. No hype. No spray-and-pray.',
}: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: navy brand surface ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#0A1628] flex-col justify-between p-12 xl:p-16 relative overflow-hidden">
        {/* Subtle radial glow — top-right */}
        <div
          aria-hidden
          className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full"
          style={{
            background:
              'radial-gradient(circle at 80% 20%, rgba(14,165,233,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Wordmark */}
        <Link href="/" className="relative z-10">
          <span
            className="text-[#FAFAF8] text-4xl xl:text-5xl font-bold tracking-wide"
            style={{ fontFamily: "'Satoshi', 'DM Sans', sans-serif", letterSpacing: '0.04em' }}
          >
            Joberlify
          </span>
        </Link>

        {/* Headline block */}
        <div className="relative z-10 space-y-6">
          <h1
            className="text-[#FAFAF8] text-3xl xl:text-4xl font-bold leading-tight"
            style={{ fontFamily: "'Satoshi', 'DM Sans', sans-serif" }}
          >
            {headline.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < headline.split('\n').length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="text-[#FAFAF8]/60 text-base leading-relaxed max-w-xs">
            {subtext}
          </p>

          {/* Value props */}
          <ul className="space-y-3 pt-2">
            {[
              'Evaluate job fit across 10 dimensions',
              'Generate ATS-optimised CVs instantly',
              'Navigate visa sponsorship with clarity',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-[#FAFAF8]/70">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer text */}
        <p className="relative z-10 text-[#FAFAF8]/30 text-xs">
          © {new Date().getFullYear()} Joberlify
        </p>
      </div>

      {/* ── Right panel: form surface ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#FAFAF8]">
        {/* Mobile-only brand header */}
        <div className="lg:hidden bg-[#0A1628] px-6 py-5 flex items-center">
          <Link href="/">
            <span
              className="text-[#FAFAF8] text-2xl font-bold"
              style={{ fontFamily: "'Satoshi', 'DM Sans', sans-serif", letterSpacing: '0.04em' }}
            >
              Joberlify
            </span>
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  )
}
