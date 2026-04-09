'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface UsageMeterProps {
  used: number
  limit: number | 'unlimited'
  noun: string          // e.g. "evaluation", "CV"
  tier: string
  upgradeHref?: string
}

// ─── Colour logic ─────────────────────────────────────────────────────────────

function barColor(pct: number): string {
  if (pct >= 1)    return '#EF4444' // grade-f red
  if (pct >= 0.8)  return '#F59E0B' // grade-c amber
  return '#0EA5E9'                  // teal-500
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UsageMeter({ used, limit, noun, tier, upgradeHref = '/pricing' }: UsageMeterProps) {
  const [fillPct, setFillPct] = useState(0)
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isUnlimited = limit === 'unlimited'
  const pct = isUnlimited ? 0 : Math.min(1, used / (limit as number))
  const atLimit = !isUnlimited && used >= (limit as number)
  const nearLimit = !isUnlimited && pct >= 0.8

  // Animate fill on mount
  useEffect(() => {
    animRef.current = setTimeout(() => setFillPct(pct), 80)
    return () => { if (animRef.current) clearTimeout(animRef.current) }
  }, [pct])

  if (isUnlimited) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-medium"
          style={{ fontFamily: 'var(--font-family-mono)', color: '#0EA5E9' }}
        >
          ∞
        </span>
        <span className="text-xs text-[#0A1628]/50">
          Unlimited {noun}s — {tier} plan
        </span>
      </div>
    )
  }

  const color = barColor(fillPct)

  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#0A1628]/60">
          <span
            className={cn('font-semibold', atLimit ? 'text-[#EF4444]' : nearLimit ? 'text-[#F59E0B]' : 'text-[#0A1628]')}
            style={{ fontFamily: 'var(--font-family-mono)' }}
          >
            {used} of {limit}
          </span>
          {' '}{noun}s used this month
        </span>
        <span
          className="text-[10px] font-medium uppercase tracking-wider"
          style={{ color: '#0A1628', opacity: 0.35, fontFamily: 'var(--font-family-display)' }}
        >
          {tier}
        </span>
      </div>

      {/* Track */}
      <div
        className="relative w-full rounded-full overflow-hidden"
        style={{ height: 8, background: '#E8E4DD' }}
        role="progressbar"
        aria-valuenow={used}
        aria-valuemax={limit as number}
        aria-label={`${used} of ${limit} ${noun}s used`}
      >
        <div
          style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: `${fillPct * 100}%`,
            background: color,
            borderRadius: 'inherit',
            transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1), background 300ms ease',
          }}
        />
      </div>

      {/* At-limit upgrade banner */}
      {atLimit && (
        <div
          className="flex items-center justify-between gap-3 rounded-[8px] px-3.5 py-2.5 mt-1"
          style={{ background: '#F5F3EF', border: '1px solid #E8E4DD' }}
        >
          <p className="text-xs text-[#0A1628]/70 leading-snug">
            You&apos;ve used all your {noun}s this month.
          </p>
          <Link
            href={upgradeHref}
            className="flex-shrink-0 text-xs font-semibold text-white px-3 py-1.5 rounded-[6px] whitespace-nowrap upgrade-pulse"
            style={{ background: '#0EA5E9' }}
          >
            Upgrade →
          </Link>
        </div>
      )}

      {/* Near-limit nudge */}
      {nearLimit && !atLimit && (
        <p className="text-[11px] text-[#F59E0B]/80">
          Running low — <Link href={upgradeHref} className="underline underline-offset-2 hover:text-[#F59E0B]">upgrade your plan</Link> before you hit your limit.
        </p>
      )}

      {/* Pulse keyframes injected once */}
      <style>{`
        @keyframes upgradePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4); }
          50%       { box-shadow: 0 0 0 6px rgba(14, 165, 233, 0); }
        }
        .upgrade-pulse { animation: upgradePulse 2s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
