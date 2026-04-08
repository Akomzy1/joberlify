'use client'

import { MapPin, ArrowRight, Compass, Zap } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { GapReport as GapReportType, GrowthRoadmapItem } from '@/types/evaluation'

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

const DIMENSION_LABELS: Record<string, string> = {
  role_match: 'Role Match',
  skills_alignment: 'Skills Alignment',
  experience_level: 'Experience Level',
  growth_trajectory: 'Growth Trajectory',
  culture_fit: 'Culture Fit',
  compensation: 'Compensation',
  location_fit: 'Location Fit',
  company_stage: 'Company Stage',
  role_impact: 'Role Impact',
  long_term_value: 'Long-term Value',
  visa_feasibility: 'Visa Feasibility',
}

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 4.0 ? 'bg-[#22C55E]/10 text-[#22C55E]'
    : score >= 3.0 ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
    : 'bg-[#EF4444]/10 text-[#EF4444]'

  return (
    <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold', color)}>
      {score.toFixed(1)}
    </span>
  )
}

export function GapReport({ gapReport, locationMatch, growthRoadmap, locationFitScore }: GapReportProps) {
  const hasLocationGap = locationFitScore !== undefined && locationFitScore !== null && locationFitScore < 3.0

  return (
    <div className="space-y-6">
      {/* ── Location gap banner ── */}
      {hasLocationGap && locationMatch && !locationMatch.isMatch && (
        <div className="rounded-lg border border-[#F97316]/20 bg-[#F97316]/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-[#F97316] flex-shrink-0" />
            <p className="text-sm font-semibold text-[#0A1628]">Location mismatch</p>
            <ScorePill score={locationFitScore} />
          </div>
          <p className="text-sm text-[#0A1628]/70 pl-5">
            This role is in <strong>{locationMatch.jobLocation}</strong>.
            Your target locations are <strong>{locationMatch.userTargets}</strong>.
          </p>
          <p className="text-sm text-[#0A1628]/60 pl-5">
            Consider expanding your target locations, searching for remote versions of this role,
            or exploring similar roles in your preferred cities.
          </p>
        </div>
      )}

      {/* ── Strengths ── */}
      {gapReport.strengths && gapReport.strengths.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#0A1628] mb-3 uppercase tracking-wide flex items-center gap-2">
            <Zap size={13} className="text-[#22C55E]" />
            Strengths
          </h3>
          <div className="space-y-2">
            {gapReport.strengths.map((strength, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-[#E8E4DD] bg-white p-3.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] flex-shrink-0 mt-1.5" />
                <p className="text-sm text-[#0A1628]/80">{strength}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Gaps ── */}
      {gapReport.gaps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#0A1628] mb-3 uppercase tracking-wide">
            Gaps to address
          </h3>
          <div className="space-y-3">
            {gapReport.gaps.map((gap, i) => (
              <div key={i} className="rounded-lg border border-[#E8E4DD] bg-white p-4 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#0A1628]">
                    {DIMENSION_LABELS[gap.dimension] ?? gap.dimension}
                  </span>
                  <ScorePill score={gap.score} />
                </div>
                <p className="text-sm text-[#0A1628]/70">{gap.gap}</p>
                <div className="flex gap-2 pt-1">
                  <ArrowRight size={14} className="text-[#0EA5E9] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#0A1628]">{gap.guidance}</p>
                </div>
                {gap.estimatedTimeToClose && (
                  <p className="text-xs text-[#0A1628]/40 pl-5">
                    Estimated time: {gap.estimatedTimeToClose}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Similar roles to search ── */}
      {gapReport.similarRolesToSearch && gapReport.similarRolesToSearch.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#0A1628] mb-3 uppercase tracking-wide">
            Roles to search instead
          </h3>
          <div className="space-y-2">
            {gapReport.similarRolesToSearch.map((role, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-[#E8E4DD] bg-white p-3.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] flex-shrink-0" />
                <p className="text-sm font-medium text-[#0A1628]">{role}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Visa alternatives ── */}
      {gapReport.visaAlternatives && gapReport.visaAlternatives.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#0A1628] mb-3 uppercase tracking-wide">
            Visa route alternatives
          </h3>
          <div className="space-y-2">
            {gapReport.visaAlternatives.map((alt, i) => (
              <div key={i} className="rounded-lg border border-[#E8E4DD] bg-white p-3.5 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono bg-[#E0F2FE] text-[#0EA5E9] px-2 py-0.5 rounded">
                    SOC {alt.socCode}
                  </span>
                  <span className="text-sm font-medium text-[#0A1628]">{alt.socTitle}</span>
                </div>
                <p className="text-xs text-[#0A1628]/60">{alt.reason}</p>
                <p className="text-xs text-[#0A1628]/50">Route: {alt.visaRoute}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Growth roadmap (Pro / Global only) ── */}
      {growthRoadmap && growthRoadmap.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#0A1628] mb-3 uppercase tracking-wide flex items-center gap-2">
            <Compass size={14} className="text-[#0EA5E9]" />
            Growth roadmap
          </h3>
          <div className="space-y-3">
            {growthRoadmap.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-[#0EA5E9] flex-shrink-0 mt-1.5" />
                  {i < growthRoadmap.length - 1 && <div className="w-px flex-1 bg-[#E8E4DD] mt-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-xs font-semibold text-[#0EA5E9] uppercase tracking-wide mb-1">
                    {item.timeframe}
                  </p>
                  <p className="text-sm font-medium text-[#0A1628] mb-1">{item.milestone}</p>
                  <ul className="space-y-0.5">
                    {item.actions.map((action, j) => (
                      <li key={j} className="text-xs text-[#0A1628]/60 flex items-start gap-1.5">
                        <span className="text-[#0EA5E9] mt-0.5">·</span>
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
