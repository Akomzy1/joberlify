'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    })
  }, [error])

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-4 py-20">
      <div className="w-full max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#EF4444]/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={24} className="text-[#EF4444]" />
        </div>

        <h1
          className="text-2xl font-bold text-[#0A1628] mb-3"
          style={{ fontFamily: 'Satoshi, DM Sans, sans-serif' }}
        >
          Something went wrong
        </h1>

        <p className="text-sm text-[#0A1628]/60 leading-relaxed mb-8 max-w-sm mx-auto">
          An unexpected error occurred. It's been logged and we'll look into it.
          Try again — most errors resolve on retry.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A1628] text-white px-5 py-3 text-sm font-semibold hover:bg-[#0EA5E9] transition-colors"
          >
            <RefreshCw size={15} />
            Try again
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8E4DD] bg-white px-5 py-3 text-sm font-medium text-[#0A1628]/60 hover:text-[#0A1628] hover:border-[#0EA5E9]/30 transition-colors"
          >
            <Home size={15} />
            Go to dashboard
          </a>
        </div>

        {error.digest && (
          <p className="mt-10 text-xs text-[#0A1628]/25 font-mono">
            Ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
