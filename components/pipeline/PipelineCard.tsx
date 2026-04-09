'use client'

import { useState } from 'react'
import { Eye, FileText, MessageSquare, ChevronDown, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { PipelineStatus } from '@/types/pipeline'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PipelineCardItem {
  id: string
  jobTitle: string
  company: string
  jobUrl: string | null
  status: PipelineStatus
  appliedAt: string | null
  notes: string | null
  evaluationId: string | null
  evaluationGrade: string | null
  evaluationScore: number | null
  jobLocation: string | null
  nextActionAt: string | null
  nextActionNote: string | null
  createdAt: string
}

interface PipelineCardProps {
  item: PipelineCardItem
  onStatusChange?: (id: string, status: PipelineStatus) => void
  onDelete?: (id: string) => void // reserved for future delete affordance
  /** Supplied when used inside kanban — omit border, handle click externally */
  compact?: boolean
  dragging?: boolean
}

// ─── Config ───────────────────────────────────────────────────────────────────

const GRADE_CFG: Record<string, { bg: string; text: string }> = {
  A: { bg: '#22C55E', text: '#fff' },
  B: { bg: '#0EA5E9', text: '#fff' },
  C: { bg: '#F59E0B', text: '#fff' },
  D: { bg: '#F97316', text: '#fff' },
  F: { bg: '#EF4444', text: '#fff' },
}

const STATUS_CFG: Record<PipelineStatus, { label: string; dot: string; pill: string }> = {
  evaluated:    { label: 'Evaluated',    dot: '#94A3B8', pill: 'bg-[#E8E4DD] text-[#0A1628]/60' },
  applying:     { label: 'Applying',     dot: '#0EA5E9', pill: 'bg-[#0EA5E9]/12 text-[#0EA5E9]' },
  applied:      { label: 'Applied',      dot: '#0EA5E9', pill: 'bg-[#1E3A5F] text-white' },
  interviewing: { label: 'Interviewing', dot: '#F59E0B', pill: 'bg-[#1E3A5F] text-white' },
  offer:        { label: 'Offer',        dot: '#22C55E', pill: 'bg-[#1E3A5F] text-white' },
  hired:        { label: 'Hired',        dot: '#22C55E', pill: 'bg-[#22C55E] text-white' },
  rejected:     { label: 'Rejected',     dot: '#EF4444', pill: 'bg-[#E8E4DD] text-[#0A1628]/45' },
  withdrawn:    { label: 'Withdrawn',    dot: '#94A3B8', pill: 'bg-[#E8E4DD] text-[#0A1628]/40' },
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PipelineCard({ item, onStatusChange, onDelete: _onDelete, compact, dragging }: PipelineCardProps) {
  const [hovered, setHovered] = useState(false)

  const grade  = item.evaluationGrade ? GRADE_CFG[item.evaluationGrade] : null
  const status = STATUS_CFG[item.status] ?? STATUS_CFG.evaluated

  const NEXT_STATUS: Partial<Record<PipelineStatus, PipelineStatus>> = {
    evaluated:    'applying',
    applying:     'applied',
    applied:      'interviewing',
    interviewing: 'offer',
    offer:        'hired',
  }

  return (
    <div
      className={cn(
        'relative bg-[#FAFAF8] rounded-[8px] select-none',
        'border border-[#E8E4DD]',
        'transition-all duration-150',
        dragging
          ? 'shadow-[0_12px_32px_rgba(10,22,40,0.18)] scale-[1.02] rotate-[0.5deg] border-[#0EA5E9]/40'
          : hovered
          ? 'shadow-[0_4px_16px_rgba(10,22,40,0.10)] -translate-y-px border-[#E8E4DD]'
          : 'shadow-[0_1px_2px_rgba(10,22,40,0.05)]',
      )}
      style={{
        borderBottom: `${hovered && !dragging ? 3 : 2}px solid #0EA5E9`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false) }}
    >
      <div className={cn('px-3.5 pt-3.5', compact ? 'pb-3' : 'pb-3.5')}>

        {/* ── Top row ── */}
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">

            {/* Company + visa dot */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: status.dot }}
                title={status.label}
              />
              <p className="text-xs font-semibold text-[#0A1628] truncate" style={{ fontFamily: 'var(--font-family-display)' }}>
                {item.company}
              </p>
            </div>

            {/* Job title */}
            <p className="text-sm text-[#0A1628]/70 leading-snug truncate">
              {item.jobTitle}
            </p>
          </div>

          {/* Grade circle */}
          {grade && (
            <div
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold font-mono"
              style={{ background: grade.bg, color: grade.text }}
              title={`Grade ${item.evaluationGrade} · ${item.evaluationScore?.toFixed(1)}`}
            >
              {item.evaluationGrade}
            </div>
          )}
        </div>

        {/* ── Notes preview ── */}
        {item.notes && (
          <p className="text-xs text-[#0A1628]/40 italic truncate mb-2 leading-tight">
            {item.notes}
          </p>
        )}

        {/* ── Next action ── */}
        {item.nextActionAt && (
          <div className="text-xs text-[#F59E0B] font-medium mb-2 flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-[#F59E0B]" />
            {item.nextActionNote ?? 'Action'} · {fmtDate(item.nextActionAt)}
          </div>
        )}

        {/* ── Bottom row: status pill + date ── */}
        <div className="flex items-center justify-between gap-2">
          <span className={cn('inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide uppercase', status.pill)}>
            {status.label}
          </span>
          <span className="text-[10px] text-[#0A1628]/30 font-mono tabular-nums">
            {fmtDate(item.appliedAt ?? item.createdAt)}
          </span>
        </div>
      </div>

      {/* ── Quick actions — fade in on hover ── */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2',
          'bg-gradient-to-t from-[#FAFAF8] to-transparent rounded-b-[8px]',
          'transition-opacity duration-150',
          hovered ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      >
        <div className="flex items-center gap-1">
          {item.evaluationId && (
            <a
              href={`/evaluations/${item.evaluationId}`}
              title="View evaluation"
              onClick={(e) => e.stopPropagation()}
              className="w-6 h-6 rounded flex items-center justify-center text-[#0A1628]/40 hover:text-[#0EA5E9] hover:bg-[#0EA5E9]/10 transition-colors"
            >
              <Eye size={12} />
            </a>
          )}
          {item.evaluationId && (
            <a
              href={`/cv/new?evaluationId=${item.evaluationId}`}
              title="Generate tailored CV"
              onClick={(e) => e.stopPropagation()}
              className="w-6 h-6 rounded flex items-center justify-center text-[#0A1628]/40 hover:text-[#0EA5E9] hover:bg-[#0EA5E9]/10 transition-colors"
            >
              <FileText size={12} />
            </a>
          )}
          {item.evaluationId && (
            <a
              href={`/interview-prep/new?evaluationId=${item.evaluationId}`}
              title="Interview prep"
              onClick={(e) => e.stopPropagation()}
              className="w-6 h-6 rounded flex items-center justify-center text-[#0A1628]/40 hover:text-[#0EA5E9] hover:bg-[#0EA5E9]/10 transition-colors"
            >
              <MessageSquare size={12} />
            </a>
          )}
          {item.jobUrl && (
            <a
              href={item.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="View job posting"
              onClick={(e) => e.stopPropagation()}
              className="w-6 h-6 rounded flex items-center justify-center text-[#0A1628]/40 hover:text-[#0EA5E9] hover:bg-[#0EA5E9]/10 transition-colors"
            >
              <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Advance status */}
        {NEXT_STATUS[item.status] && onStatusChange && (
          <button
            type="button"
            title={`Move to ${STATUS_CFG[NEXT_STATUS[item.status]!].label}`}
            onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, NEXT_STATUS[item.status]!) }}
            className="flex items-center gap-0.5 text-[10px] font-semibold text-[#0EA5E9] hover:underline"
          >
            {STATUS_CFG[NEXT_STATUS[item.status]!].label}
            <ChevronDown size={10} className="-rotate-90" />
          </button>
        )}
      </div>
    </div>
  )
}
