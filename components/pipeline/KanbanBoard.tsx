'use client'

import { useState, useRef, useCallback } from 'react'
import { Monitor } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { PipelineCard, type PipelineCardItem } from './PipelineCard'
import type { PipelineStatus } from '@/types/pipeline'

// ─── Column config ────────────────────────────────────────────────────────────

interface ColumnDef {
  status: PipelineStatus
  label: string
}

const ACTIVE_COLUMNS: ColumnDef[] = [
  { status: 'evaluated',    label: 'Evaluated'    },
  { status: 'applying',     label: 'Applying'     },
  { status: 'applied',      label: 'Applied'      },
  { status: 'interviewing', label: 'Interviewing' },
  { status: 'offer',        label: 'Offer'        },
  { status: 'hired',        label: 'Hired'        },
]

const TERMINAL_STATUSES: PipelineStatus[] = ['rejected', 'withdrawn']

// ─── Props ────────────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  items: PipelineCardItem[]
  onStatusChange: (id: string, status: PipelineStatus) => void
  onDelete: (id: string) => void
}

// ─── Drag state ───────────────────────────────────────────────────────────────

interface DragState {
  itemId: string
  fromStatus: PipelineStatus
}

// ─── Column component ─────────────────────────────────────────────────────────

function KanbanColumn({
  col,
  cards,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onStatusChange,
  onDelete,
  dragItemId,
}: {
  col: ColumnDef
  cards: PipelineCardItem[]
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, targetStatus: PipelineStatus) => void
  onStatusChange: (id: string, status: PipelineStatus) => void
  onDelete: (id: string) => void
  dragItemId: string | null
}) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-[8px] border min-h-[120px] transition-all duration-150',
        isDragOver
          ? 'border-dashed border-[#0EA5E9] bg-[#0EA5E9]/5'
          : 'border-[#E8E4DD] bg-[#F5F3EF]',
      )}
      style={{ minWidth: 220 }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, col.status)}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#E8E4DD]">
        <h3
          className="text-xs font-bold text-[#1E3A5F] uppercase tracking-[0.06em]"
          style={{ fontFamily: 'var(--font-family-display)', fontVariant: 'small-caps' }}
        >
          {col.label}
        </h3>
        {cards.length > 0 && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0EA5E9] text-white text-[10px] font-bold tabular-nums">
            {cards.length}
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 p-2 flex-1">
        {cards.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', item.id)
              e.dataTransfer.effectAllowed = 'move'
            }}
            className="cursor-grab active:cursor-grabbing"
            style={{
              opacity: dragItemId === item.id ? 0.4 : 1,
              transition: 'opacity 150ms ease',
            }}
          >
            <PipelineCard
              item={item}
              compact
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          </div>
        ))}

        {/* Drop target hint */}
        {isDragOver && (
          <div className="h-16 rounded-[8px] border-2 border-dashed border-[#0EA5E9]/40 bg-[#0EA5E9]/5 flex items-center justify-center">
            <span className="text-xs text-[#0EA5E9]/60 font-medium">Drop here</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main board ───────────────────────────────────────────────────────────────

export function KanbanBoard({ items, onStatusChange, onDelete }: KanbanBoardProps) {
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<PipelineStatus | null>(null)
  const [terminalExpanded, setTerminalExpanded] = useState(false)

  const dragItemId = dragState?.itemId ?? null

  const byStatus = useCallback(
    (status: PipelineStatus) => items.filter((i) => i.status === status),
    [items],
  )

  const terminalItems = items.filter((i) => TERMINAL_STATUSES.includes(i.status))

  function handleDragOver(e: React.DragEvent, status: PipelineStatus) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStatus(status)
  }

  function handleDrop(e: React.DragEvent, targetStatus: PipelineStatus) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id && dragState?.fromStatus !== targetStatus) {
      onStatusChange(id, targetStatus)
    }
    setDragState(null)
    setDragOverStatus(null)
  }

  // Mobile guard
  return (
    <>
      {/* Mobile message */}
      <div className="sm:hidden flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
        <Monitor size={32} className="text-[#0A1628]/20" />
        <p className="text-sm font-semibold text-[#0A1628]">Kanban view is desktop only</p>
        <p className="text-xs text-[#0A1628]/45 max-w-xs">
          Switch to List view on mobile to manage your pipeline.
        </p>
      </div>

      {/* Desktop board */}
      <div className="hidden sm:flex flex-col gap-5">
        {/* Active columns — horizontal scroll */}
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          onDragEnd={() => { setDragState(null); setDragOverStatus(null) }}
        >
          {ACTIVE_COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              col={col}
              cards={byStatus(col.status)}
              isDragOver={dragOverStatus === col.status}
              dragItemId={dragItemId}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={() => setDragOverStatus(null)}
              onDrop={handleDrop}
              onStatusChange={(id, status) => {
                onStatusChange(id, status)
                setDragState(null)
              }}
              onDelete={onDelete}
            />
          ))}
        </div>

        {/* Terminal: Rejected / Withdrawn — collapsible */}
        {terminalItems.length > 0 && (
          <div
            className="rounded-[8px] border border-[#E8E4DD] overflow-hidden"
            style={{ background: '#F5F3EF' }}
          >
            <button
              type="button"
              onClick={() => setTerminalExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[#E8E4DD]/50 transition-colors"
            >
              <span className="text-xs font-bold text-[#0A1628]/40 uppercase tracking-[0.06em]" style={{ fontFamily: 'var(--font-family-display)' }}>
                Rejected &amp; Withdrawn · {terminalItems.length}
              </span>
              <svg
                width="14" height="14" viewBox="0 0 14 14" fill="none"
                className="text-[#0A1628]/30 transition-transform duration-200"
                style={{ transform: terminalExpanded ? 'rotate(180deg)' : undefined }}
              >
                <path d="M2 4.5L7 9.5L12 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {terminalExpanded && (
              <div className="px-3 pb-3 opacity-60">
                <div className="flex flex-wrap gap-2 mt-1">
                  {terminalItems.map((item) => (
                    <div key={item.id} style={{ width: 220 }}>
                      <PipelineCard item={item} compact onDelete={onDelete} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
