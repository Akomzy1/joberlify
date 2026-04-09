'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, TrendingUp, Clock, Ban, Globe } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { EvaluationGrade, EvaluationRecommendation } from '@/types/evaluation'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ScoreCardProps {
  grade: EvaluationGrade
  overallScore: number
  recommendation: EvaluationRecommendation
  requiresVisaSponsorship: boolean
  visaFeasibilityScore?: number | null
}

// ─── Config ───────────────────────────────────────────────────────────────────

const GRADE_CFG: Record<EvaluationGrade, { hex: string; label: string }> = {
  A: { hex: '#22C55E', label: 'Excellent match' },
  B: { hex: '#0EA5E9', label: 'Strong match' },
  C: { hex: '#F59E0B', label: 'Moderate match' },
  D: { hex: '#F97316', label: 'Weak match' },
  F: { hex: '#EF4444', label: 'Poor match' },
}

const REC_CFG: Record<
  EvaluationRecommendation,
  { label: string; Icon: typeof CheckCircle2 }
> = {
  apply:      { label: 'Apply now',        Icon: CheckCircle2 },
  consider:   { label: 'Worth considering', Icon: TrendingUp   },
  not_yet:    { label: 'Not yet ready',     Icon: Clock        },
  dont_apply: { label: "Don't apply",       Icon: Ban          },
}

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 800, enabled = true) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
      setValue(Math.round(eased * target * 10) / 10)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration, enabled])

  return value
}

// ─── Recommendation pill ──────────────────────────────────────────────────────

function RecPill({
  recommendation,
}: {
  recommendation: EvaluationRecommendation
}) {
  const { label, Icon } = REC_CFG[recommendation]

  if (recommendation === 'apply') {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 border-l-4 border-[#22C55E] bg-[#0A1628] text-[#22C55E] text-sm font-semibold">
        <Icon size={15} />
        {label}
      </div>
    )
  }

  if (recommendation === 'consider') {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 border border-[#F59E0B]/25 border-l-4 border-l-[#F59E0B] bg-[#FAFAF8] text-[#F59E0B] text-sm font-semibold">
        <Icon size={15} />
        {label}
      </div>
    )
  }

  if (recommendation === 'not_yet') {
    return (
      <div
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 border-l-4 border-[#F97316] text-[#F97316] text-sm font-semibold"
        style={{
          background:
            'repeating-linear-gradient(45deg, #FAFAF8, #FAFAF8 6px, rgba(249,115,22,0.06) 6px, rgba(249,115,22,0.06) 12px)',
          borderTopWidth: '1px',
          borderRightWidth: '1px',
          borderBottomWidth: '1px',
          borderTopColor: 'rgba(249,115,22,0.2)',
          borderRightColor: 'rgba(249,115,22,0.2)',
          borderBottomColor: 'rgba(249,115,22,0.2)',
        }}
      >
        <Icon size={15} />
        {label}
      </div>
    )
  }

  // dont_apply
  return (
    <div className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 border border-[#EF4444]/20 bg-[#EF4444]/10 text-[#EF4444] text-sm font-semibold">
      <Icon size={15} />
      {label}
    </div>
  )
}

// ─── Visa badge ───────────────────────────────────────────────────────────────

function VisaBadge({ score }: { score: number | null | undefined }) {
  const feasible = score !== null && score !== undefined && score >= 3.0
  const color = feasible ? '#0EA5E9' : '#EF4444'
  const text = feasible ? 'Visa feasible' : 'Visa unlikely'

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold"
      style={{ background: `${color}14`, color }}
    >
      <Globe size={11} />
      {text}
      {score !== null && score !== undefined && (
        <span className="font-mono opacity-70 ml-0.5">{score.toFixed(1)}</span>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScoreCard({
  grade,
  overallScore,
  recommendation,
  requiresVisaSponsorship,
  visaFeasibilityScore,
}: ScoreCardProps) {
  const [mounted, setMounted] = useState(false)
  const cfg = GRADE_CFG[grade]
  const displayScore = useCountUp(overallScore, 800, mounted)

  useEffect(() => {
    // Tiny delay so the browser paints the initial (scaled-down) state first
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DD] p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">

        {/* ── Circular grade badge ── */}
        <div
          className="flex-shrink-0"
          style={{
            transform: mounted ? 'scale(1)' : 'scale(0.8)',
            opacity: mounted ? 1 : 0,
            transition: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease-out',
          }}
        >
          <div
            className="relative flex items-center justify-center rounded-full"
            style={{
              width: 80,
              height: 80,
              background: `${cfg.hex}14`,
              boxShadow: `0 0 0 3px ${cfg.hex}30, inset 0 0 0 2px ${cfg.hex}20`,
            }}
          >
            {/* Inner ring */}
            <div
              className="absolute inset-2 rounded-full"
              style={{ border: `2px solid ${cfg.hex}40` }}
            />
            <span
              className="text-3xl font-bold font-mono relative"
              style={{ color: cfg.hex }}
            >
              {grade}
            </span>
          </div>
        </div>

        {/* ── Score + label ── */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0A1628]/40 mb-1">
            {cfg.label}
          </p>
          <div className="flex items-baseline gap-1.5 mb-3">
            <span
              className="text-5xl font-bold font-mono leading-none"
              style={{ color: cfg.hex }}
            >
              {displayScore.toFixed(1)}
            </span>
            <span className="text-lg text-[#0A1628]/30 font-mono">/ 5.0</span>
          </div>

          {/* Recommendation + visa */}
          <div className="flex flex-wrap items-center gap-2">
            <RecPill recommendation={recommendation} />
            {requiresVisaSponsorship && (
              <VisaBadge score={visaFeasibilityScore} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
