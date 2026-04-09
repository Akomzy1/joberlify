'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, ExternalLink, Eye } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { PipelineCardItem } from './PipelineCard'
import type { PipelineStatus } from '@/types/pipeline'

// ─── Config ───────────────────────────────────────────────────────────────────

const ALL_STATUSES: PipelineStatus[] = [
  'evaluated', 'applying', 'applied', 'interviewing', 'offer', 'hired', 'rejected', 'withdrawn',
]

const STATUS_LABELS: Record<PipelineStatus, string> = {
  evaluated:    'Evaluated',
  applying:     'Applying',
  applied:      'Applied',
  interviewing: 'Interviewing',
  offer:        'Offer',
  hired:        'Hired',
  rejected:     'Rejected',
  withdrawn:    'Withdrawn',
}

const STATUS_DOT: Record<PipelineStatus, string> = {
  evaluated:    '#94A3B8',
  applying:     '#0EA5E9',
  applied:      '#0EA5E9',
  interviewing: '#F59E0B',
  offer:        '#22C55E',
  hired:        '#22C55E',
  rejected:     '#EF4444',
  withdrawn:    '#94A3B8',
}

const GRADE_COLORS: Record<string, string> = {
  A: '#22C55E', B: '#0EA5E9', C: '#F59E0B', D: '#F97316', F: '#EF4444',
}

type SortKey = 'company' | 'status' | 'grade' | 'date'
type SortDir = 'asc' | 'desc'

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PipelineListProps {
  items: PipelineCardItem[]
  onStatusChange: (id: string, status: PipelineStatus) => void
  onDelete: (id: string) => void
}

// ─── Sortable header cell ─────────────────────────────────────────────────────

function SortHeader({
  label, sortKey, current, dir, onSort,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onSort: (k: SortKey) => void
}) {
  const active = current === sortKey
  return (
    <th
      className="px-4 py-2.5 text-left cursor-pointer select-none whitespace-nowrap group"
      onClick={() => onSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        <span className={cn('text-xs font-bold uppercase tracking-wider transition-colors', active ? 'text-[#FAFAF8]' : 'text-[#FAFAF8]/55 group-hover:text-[#FAFAF8]/80')}>
          {label}
        </span>
        <span className="flex flex-col gap-px opacity-60">
          <ChevronUp size={9} className={cn(active && dir === 'asc' ? 'opacity-100' : 'opacity-30')} />
          <ChevronDown size={9} className={cn(active && dir === 'desc' ? 'opacity-100' : 'opacity-30')} />
        </span>
      </span>
    </th>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PipelineList({ items, onStatusChange, onDelete }: PipelineListProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...items].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'company') cmp = a.company.localeCompare(b.company)
    else if (sortKey === 'status') cmp = a.status.localeCompare(b.status)
    else if (sortKey === 'grade') {
      const gOrder = ['A','B','C','D','F','']
      cmp = (gOrder.indexOf(a.evaluationGrade ?? '')) - (gOrder.indexOf(b.evaluationGrade ?? ''))
    }
    else cmp = (a.createdAt > b.createdAt ? 1 : -1)
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="overflow-x-auto rounded-[8px] border border-[#E8E4DD]">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        {/* Header */}
        <thead>
          <tr className="bg-[#1E3A5F]" style={{ fontFamily: 'var(--font-family-display)' }}>
            {/* Sticky first col */}
            <SortHeader label="Company / Role" sortKey="company" current={sortKey} dir={sortDir} onSort={handleSort} />
            <SortHeader label="Status"   sortKey="status" current={sortKey} dir={sortDir} onSort={handleSort} />
            <SortHeader label="Grade"    sortKey="grade"  current={sortKey} dir={sortDir} onSort={handleSort} />
            <SortHeader label="Added"    sortKey="date"   current={sortKey} dir={sortDir} onSort={handleSort} />
            <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[#FAFAF8]/55 whitespace-nowrap">Notes</th>
            <th className="px-4 py-2.5 w-16" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, idx) => {
            const isEven = idx % 2 === 0
            const dotColor = STATUS_DOT[item.status]
            const gradeColor = item.evaluationGrade ? GRADE_COLORS[item.evaluationGrade] : null

            return (
              <tr
                key={item.id}
                className={cn(
                  'group h-12 transition-colors',
                  isEven ? 'bg-[#FAFAF8]' : 'bg-white',
                  'hover:bg-[#E0F2FE]/30',
                )}
              >
                {/* Company / role — sticky on mobile via overflow-x */}
                <td className="px-4 py-0 min-w-[180px]">
                  <div>
                    <p className="text-sm font-semibold text-[#0A1628] truncate leading-tight">
                      {item.company}
                    </p>
                    <p className="text-xs text-[#0A1628]/50 truncate leading-tight">
                      {item.jobTitle}
                    </p>
                  </div>
                </td>

                {/* Status — inline select */}
                <td className="px-4 py-0">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: dotColor }}
                    />
                    <select
                      value={item.status}
                      onChange={(e) => onStatusChange(item.id, e.target.value as PipelineStatus)}
                      className="text-xs font-medium text-[#0A1628] bg-transparent border-none outline-none cursor-pointer pr-1 py-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                </td>

                {/* Grade */}
                <td className="px-4 py-0">
                  {gradeColor ? (
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white font-mono"
                        style={{ background: gradeColor }}
                      >
                        {item.evaluationGrade}
                      </span>
                      {item.evaluationScore !== null && (
                        <span className="text-xs text-[#0A1628]/40 font-mono tabular-nums">
                          {item.evaluationScore?.toFixed(1)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-[#0A1628]/25">—</span>
                  )}
                </td>

                {/* Date added */}
                <td className="px-4 py-0">
                  <span className="text-xs text-[#0A1628]/45 font-mono tabular-nums whitespace-nowrap">
                    {fmtDate(item.appliedAt ?? item.createdAt)}
                  </span>
                </td>

                {/* Notes preview */}
                <td className="px-4 py-0 max-w-[200px]">
                  {item.notes ? (
                    <p className="text-xs text-[#0A1628]/40 italic truncate">{item.notes}</p>
                  ) : (
                    <span className="text-xs text-[#0A1628]/20">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-3 py-0">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.evaluationId && (
                      <a
                        href={`/evaluations/${item.evaluationId}`}
                        title="View evaluation"
                        className="w-6 h-6 rounded flex items-center justify-center text-[#0A1628]/35 hover:text-[#0EA5E9] hover:bg-[#0EA5E9]/10 transition-colors"
                      >
                        <Eye size={13} />
                      </a>
                    )}
                    {item.jobUrl && (
                      <a
                        href={item.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View posting"
                        className="w-6 h-6 rounded flex items-center justify-center text-[#0A1628]/35 hover:text-[#0EA5E9] hover:bg-[#0EA5E9]/10 transition-colors"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                    <button
                      type="button"
                      title="Remove from pipeline"
                      onClick={() => onDelete(item.id)}
                      className="w-6 h-6 rounded flex items-center justify-center text-[#0A1628]/25 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors text-xs font-bold"
                    >
                      ×
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}

          {sorted.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#0A1628]/35">
                No items match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
