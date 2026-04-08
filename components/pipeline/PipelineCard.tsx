'use client'

import { MapPin, Circle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { PipelineItem } from '@/types/pipeline'
import type { TargetLocation } from '@/types/user'

interface PipelineCardProps {
  item: PipelineItem & {
    jobLocation?: string | null
    evaluationGrade?: string | null
    evaluationScore?: number | null
  }
  userTargetLocations?: TargetLocation[]
  onClick?: () => void
}

const STATUS_STYLES: Record<string, string> = {
  evaluated:    'bg-[#E8E4DD] text-[#0A1628]/60',
  applying:     'bg-[#E0F2FE] text-[#0EA5E9]',
  applied:      'bg-[#E0F2FE] text-[#0EA5E9]',
  interviewing: 'bg-[#F59E0B]/10 text-[#F59E0B]',
  offer:        'bg-[#22C55E]/10 text-[#22C55E]',
  hired:        'bg-[#22C55E]/15 text-[#22C55E]',
  rejected:     'bg-[#EF4444]/10 text-[#EF4444]',
  withdrawn:    'bg-[#E8E4DD] text-[#0A1628]/40',
}

const STATUS_LABELS: Record<string, string> = {
  evaluated:    'Evaluated',
  applying:     'Applying',
  applied:      'Applied',
  interviewing: 'Interviewing',
  offer:        'Offer',
  hired:        'Hired',
  rejected:     'Rejected',
  withdrawn:    'Withdrawn',
}

const GRADE_COLOURS: Record<string, string> = {
  A: 'text-[#22C55E]',
  B: 'text-[#0EA5E9]',
  C: 'text-[#F59E0B]',
  D: 'text-[#F97316]',
  F: 'text-[#EF4444]',
}

function isLocationMatch(jobLocation: string | null | undefined, targets: TargetLocation[]): boolean {
  if (!jobLocation || targets.length === 0) return false
  const loc = jobLocation.toLowerCase()
  return targets.some((t) => {
    if (t.anywhere && loc.includes(t.country.toLowerCase())) return true
    return t.cities.some((city) => loc.includes(city.toLowerCase()))
  })
}

export function PipelineCard({ item, userTargetLocations = [], onClick }: PipelineCardProps) {
  const matched = isLocationMatch(item.jobLocation, userTargetLocations)
  const hasLocation = Boolean(item.jobLocation)

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-[#E8E4DD] p-4 space-y-3',
        'transition-all duration-150',
        'hover:border-[#1E3A5F]/20 hover:shadow-sm',
        onClick && 'cursor-pointer',
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* Top row: title + grade */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#0A1628] truncate">{item.jobTitle}</p>

          {/* Company + location indicator */}
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <p className="text-xs text-[#0A1628]/60">{item.company}</p>

            {hasLocation && (
              <>
                <span className="text-[#0A1628]/20 text-xs">·</span>
                <div className="flex items-center gap-1">
                  <Circle
                    size={6}
                    className={cn('fill-current flex-shrink-0', matched ? 'text-[#22C55E]' : 'text-[#0A1628]/30')}
                  />
                  <span className={cn('text-xs', matched ? 'text-[#22C55E]' : 'text-[#0A1628]/50')}>
                    {matched ? 'In your area' : item.jobLocation}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Grade badge */}
        {item.evaluationGrade && (
          <div className="flex-shrink-0 text-right">
            <span className={cn('text-lg font-bold font-mono', GRADE_COLOURS[item.evaluationGrade] ?? 'text-[#0A1628]/40')}>
              {item.evaluationGrade}
            </span>
            {item.evaluationScore !== undefined && item.evaluationScore !== null && (
              <p className="text-xs text-[#0A1628]/40 font-mono">{item.evaluationScore.toFixed(1)}</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom row: status + date */}
      <div className="flex items-center justify-between gap-2">
        <span className={cn('inline-block text-xs font-medium px-2.5 py-0.5 rounded-full', STATUS_STYLES[item.status] ?? STATUS_STYLES.evaluated)}>
          {STATUS_LABELS[item.status] ?? item.status}
        </span>

        {item.appliedAt && (
          <span className="text-xs text-[#0A1628]/40">
            Applied {new Date(item.appliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  )
}
