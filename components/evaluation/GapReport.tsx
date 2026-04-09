'use client'

import { useState } from 'react'
import {
  ChevronDown,
  MapPin,
  Zap,
  Compass,
  CheckCircle2,
  Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { GapReport as GapReportType, GrowthRoadmapItem } from '@/types/evaluation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationMatch {
  jobLocation: string
  userTargets: string
  isMatch: boolean
  detail: string
}

interface GapReportProps {
  gapReport: GapReportType
  locationMatch?: LocationMatch | null
  growthRoadmap?: GrowthRoadmapItem[] | null
  locationFitScore?: number | null
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const DIMENSION_LABELS: Record<string, string> = {
  role_match:        'Role Match',
  skills_alignment:  'Skills Alignment',
  experience_level:  'Experience Level',
  growth_trajectory: 'Growth Trajectory',
  culture_fit:       'Culture Fit',
  compensation:      'Compensation',
  location_fit:      'Location Fit',
  company_stage:     'Company Stage',
  role_impact:       'Role Impact',
  long_term_value:   'Long-term Value',
  visa_feasibility:  'Visa Feasibility',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScorePill({ score }: { score: number }) {
  const [bg, text] =
    score >= 4.0 ? ['#22C55E14', '#22C55E']
    : score >= 3.0 ? ['#F59E0B14', '#F59E0B']
    : ['#EF444414', '#EF4444']

  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold"
      style={{ background: bg, color: text }}
    >
      {score.toFixed(1)}
    </span>
  )
}

// ─── Accordion gap item ───────────────────────────────────────────────────────

function GapAccordionItem({
  dimension,
  score,
  gap,
  guidance,
  estimatedTimeToClose,
  isVisa,
}: {
  dimension: string
  score: number
  gap: string
  guidance: string
  estimatedTimeToClose: string | null
  isVisa: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={
        isVisa
          ? { borderColor: 'rgba(30,58,95,0.25)', borderLeftWidth: 4, borderLeftColor: '#1E3A5F' }
          : { borderColor: '#E8E4DD' }
      }
    >
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left bg-white hover:bg-[#FAFAF8] transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <ScorePill score={score} />
          <span className="text-sm font-semibold text-[#0A1628] truncate">
            {DIMENSION_LABELS[dimension] ?? dimension}
          </span>
        </div>
        <ChevronDown
          size={15}
          className="flex-shrink-0 text-[#0A1628]/35"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
          }}
        />
      </button>

      <div
        className="overflow-hidden"
        style={{
          maxHeight: open ? 400 : 0,
          opacity: open ? 1 : 0,
          transition: 'max-height 300ms ease, opacity 200ms ease',
        }}
      >
        <div className="px-4 pb-4 pt-1 bg-white space-y-3 border-t border-[#E8E4DD]">
          <p className="text-sm text-[#0A1628]/70 leading-relaxed pt-2">{gap}</p>
          <div
            className="flex gap-2 rounded-md px-3 py-2.5"
            style={{ background: '#F0F9FF', borderLeft: '3px solid #0EA5E9' }}
          >
            <p className="text-sm text-[#0A1628] leading-relaxed">{guidance}</p>
          </div>
          {estimatedTimeToClose && (
            <p className="text-xs text-[#0A1628]/40 pl-0.5">
              Estimated time to close: {estimatedTimeToClose}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GapReport({
  gapReport,
  locationMatch,
  growthRoadmap,
  locationFitScore,
}: GapReportProps) {
  const hasLocationGap =
    locationFitScore !== undefined &&
    locationFitScore !== null &&
    locationFitScore < 3.0

  const visaGaps = gapReport.gaps.filter((g) => g.dimension === 'visa_feasibility')
  const regularGaps = gapReport.gaps.filter((g) => g.dimension !== 'visa_feasibility')
  const hasStrengths = Array.isArray(gapReport.strengths) && gapReport.strengths.length > 0

  return (
    <div className="space-y-6">

      {/* ── Location banner ── */}
      {hasLocationGap && locationMatch && !locationMatch.isMatch && (
        <div
          className="rounded-lg p-4 space-y-2"
          style={{
            border: '1px solid rgba(249,115,22,0.25)',
            background: 'rgba(249,115,22,0.05)',
          }}
        >
          <div className="flex items-center gap-2">
            <MapPin size={14} className="flex-shrink-0" style={{ color: '#F97316' }} />
            <p className="text-sm font-semibold text-[#0A1628]">Location mismatch</p>
            <ScorePill score={locationFitScore!} />
          </div>
          <p className="text-sm text-[#0A1628]/70 pl-5">
            This role is in <strong>{locationMatch.jobLocation}</strong>. Your target
            locations: <strong>{locationMatch.userTargets}</strong>.
          </p>
          <p className="text-sm text-[#0A1628]/55 pl-5">
            Consider expanding your target locations, searching for remote versions, or
            exploring similar roles in your preferred cities.
          </p>
        </div>
      )}

      {/* ── Strengths ── */}
      {hasStrengths && (
        <div>
          <h3 className="text-xs font-semibold text-[#0A1628]/40 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Zap size={12} style={{ color: '#22C55E' }} />
            Strengths
          </h3>
          <div className="space-y-2">
            {gapReport.strengths.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-lg border border-[#E8E4DD] bg-white px-3.5 py-3"
              >
                <CheckCircle2
                  size={14}
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: '#22C55E' }}
                />
                <p className="text-sm text-[#0A1628]/80 leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Regular gaps (accordion) ── */}
      {regularGaps.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[#0A1628]/40 uppercase tracking-widest mb-3">
            Gaps to address
          </h3>
          <div className="space-y-2">
            {regularGaps.map((g, i) => (
              <GapAccordionItem
                key={i}
                dimension={g.dimension}
                score={g.score}
                gap={g.gap}
                guidance={g.guidance}
                estimatedTimeToClose={g.estimatedTimeToClose}
                isVisa={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Visa gaps ── */}
      {visaGaps.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[#0A1628]/40 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Globe size={12} style={{ color: '#0EA5E9' }} />
            Visa &amp; sponsorship
          </h3>
          <div className="space-y-2">
            {visaGaps.map((g, i) => (
              <GapAccordionItem
                key={i}
                dimension={g.dimension}
                score={g.score}
                gap={g.gap}
                guidance={g.guidance}
                estimatedTimeToClose={g.estimatedTimeToClose}
                isVisa={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Visa alternatives ── */}
      {gapReport.visaAlternatives && gapReport.visaAlternatives.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[#0A1628]/40 uppercase tracking-widest mb-3">
            Visa route alternatives
          </h3>
          <div className="space-y-2">
            {gapReport.visaAlternatives.map((alt, i) => (
              <div
                key={i}
                className="rounded-lg border border-[#E8E4DD] bg-white px-3.5 py-3 space-y-1"
                style={{ borderLeftWidth: 4, borderLeftColor: '#1E3A5F' }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs font-mono rounded px-2 py-0.5"
                    style={{ background: '#E0F2FE', color: '#0EA5E9' }}
                  >
                    SOC {alt.socCode}
                  </span>
                  <span className="text-sm font-semibold text-[#0A1628]">
                    {alt.socTitle}
                  </span>
                </div>
                <p className="text-xs text-[#0A1628]/60">{alt.reason}</p>
                <p className="text-xs text-[#0A1628]/45">Route: {alt.visaRoute}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Similar roles (horizontally scrollable chips) ── */}
      {gapReport.similarRolesToSearch && gapReport.similarRolesToSearch.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[#0A1628]/40 uppercase tracking-widest mb-3">
            Roles to search instead
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {gapReport.similarRolesToSearch.map((role, i) => (
              <div
                key={i}
                className="flex-shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium text-[#0A1628] transition-transform duration-150 hover:-translate-y-0.5 cursor-default select-none"
                style={{
                  background: '#FAFAF8',
                  border: '1px solid #E8E4DD',
                  borderLeft: '3px solid #0EA5E9',
                }}
              >
                {role}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Growth roadmap ── */}
      {growthRoadmap && growthRoadmap.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[#0A1628]/40 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Compass size={12} style={{ color: '#0EA5E9' }} />
            Growth roadmap
          </h3>
          <div className="space-y-4">
            {growthRoadmap.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                    style={{ background: '#0EA5E9' }}
                  />
                  {i < growthRoadmap.length - 1 && (
                    <div className="w-px flex-1 mt-1" style={{ background: '#E8E4DD' }} />
                  )}
                </div>
                <div className="pb-4">
                  <p
                    className="text-xs font-semibold uppercase tracking-wide mb-1"
                    style={{ color: '#0EA5E9' }}
                  >
                    {item.timeframe}
                  </p>
                  <p className="text-sm font-semibold text-[#0A1628] mb-1.5">
                    {item.milestone}
                  </p>
                  <ul className="space-y-1">
                    {item.actions.map((action, j) => (
                      <li
                        key={j}
                        className="text-xs text-[#0A1628]/60 flex items-start gap-1.5"
                      >
                        <span style={{ color: '#0EA5E9' }} className="mt-0.5 flex-shrink-0">
                          ·
                        </span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
