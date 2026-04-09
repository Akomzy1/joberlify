'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

interface OnboardingBannerProps {
  hasProfile: boolean
  hasName: boolean
  hasCv: boolean
}

const DISMISS_KEY = 'joberlify_onboarding_banner_dismissed'

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDot({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2 h-2 rounded-full flex-shrink-0 transition-colors"
        style={{ background: done ? '#22C55E' : '#E8E4DD' }}
      />
      <span
        className="text-xs"
        style={{ color: done ? '#22C55E' : '#0A1628', opacity: done ? 0.7 : 0.5 }}
      >
        {label}
      </span>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OnboardingBanner({ hasProfile, hasName, hasCv }: OnboardingBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISS_KEY)
    if (!dismissed) setVisible(true)
  }, [])

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  const completedSteps = [hasProfile, hasName, hasCv].filter(Boolean).length
  const totalSteps = 3

  return (
    <div
      className="relative flex flex-col sm:flex-row sm:items-center gap-3 rounded-[10px] border px-4 py-3.5"
      style={{ background: '#F5F3EF', borderColor: '#E8E4DD' }}
      role="status"
      aria-label="Profile setup progress"
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold text-[#0A1628] mb-1"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Complete your profile for better results
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <ProgressDot done={hasProfile} label="Profile created" />
          <ProgressDot done={hasName}    label="Name added" />
          <ProgressDot done={hasCv}      label="CV uploaded" />
        </div>
        <p className="text-xs text-[#0A1628]/40 mt-1.5">
          {completedSteps} of {totalSteps} steps complete
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/settings"
        className="flex-shrink-0 self-start sm:self-center text-xs font-semibold text-white px-3 py-2 rounded-[7px] whitespace-nowrap transition-colors"
        style={{ background: '#1E3A5F' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#2563A0' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#1E3A5F' }}
      >
        Finish setup →
      </Link>

      {/* Dismiss */}
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 rounded text-[#0A1628]/30 hover:text-[#0A1628]/60 transition-colors"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  )
}
