'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import type { EvaluationDimensions } from '@/types/evaluation'

// ─── Dimension config ─────────────────────────────────────────────────────────

const DIMS = [
  { key: 'role_match',        label: 'Role',     shortLabel: 'Role'     },
  { key: 'skills_alignment',  label: 'Skills',   shortLabel: 'Skills'   },
  { key: 'experience_level',  label: 'Exp.',     shortLabel: 'Exp.'     },
  { key: 'growth_trajectory', label: 'Growth',   shortLabel: 'Growth'   },
  { key: 'culture_fit',       label: 'Culture',  shortLabel: 'Culture'  },
  { key: 'compensation',      label: 'Comp.',    shortLabel: 'Comp.'    },
  { key: 'location_fit',      label: 'Location', shortLabel: 'Loc.'     },
  { key: 'company_stage',     label: 'Stage',    shortLabel: 'Stage'    },
  { key: 'role_impact',       label: 'Impact',   shortLabel: 'Impact'   },
  { key: 'long_term_value',   label: 'LT Value', shortLabel: 'LTV'      },
] as const

const SCORE_COLORS: Record<string, string> = {
  high:   '#22C55E',
  mid:    '#F59E0B',
  low:    '#EF4444',
}

function scoreColor(s: number) {
  if (s >= 4.0) return SCORE_COLORS.high
  if (s >= 3.0) return SCORE_COLORS.mid
  return SCORE_COLORS.low
}

// ─── Geometry ─────────────────────────────────────────────────────────────────

const CX = 200
const CY = 200
const MAX_R = 140
const LABEL_R = MAX_R + 24
const N = DIMS.length

function polarToXY(i: number, r: number) {
  const angle = (i * 2 * Math.PI) / N - Math.PI / 2
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) }
}

function buildPolygonPoints(scores: Record<string, number>, scale = 1): string {
  return DIMS.map((d, i) => {
    const s = scores[d.key] ?? 3
    const r = (s / 5) * MAX_R * scale
    const { x, y } = polarToXY(i, r)
    return `${x},${y}`
  }).join(' ')
}

function buildRingPoints(score: number): string {
  const r = (score / 5) * MAX_R
  return Array.from({ length: N }, (_, i) => {
    const { x, y } = polarToXY(i, r)
    return `${x},${y}`
  }).join(' ')
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipInfo {
  label: string
  score: number
  x: number
  y: number
}

// ─── Mobile bar chart ─────────────────────────────────────────────────────────

function BarChart({ scores }: { scores: Record<string, number> }) {
  return (
    <div className="space-y-2.5">
      {DIMS.map((d) => {
        const s = scores[d.key] ?? 3
        const pct = ((s - 1) / 4) * 100
        const color = scoreColor(s)
        return (
          <div key={d.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#0A1628]/60">{d.label}</span>
              <span
                className="text-xs font-mono font-semibold"
                style={{ color }}
              >
                {s.toFixed(1)}
              </span>
            </div>
            <div className="h-1.5 bg-[#E8E4DD] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RadarChartProps {
  scores: EvaluationDimensions
  visaFeasibilityScore?: number | null
}

export function RadarChart({ scores, visaFeasibilityScore }: RadarChartProps) {
  const [animated, setAnimated] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const scoreMap = scores as unknown as Record<string, number>

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const polygonPoints = buildPolygonPoints(scoreMap)

  // Label text-anchor based on position
  function getAnchor(i: number): 'start' | 'middle' | 'end' {
    const { x } = polarToXY(i, 1)
    const dx = x - CX
    if (dx > 5) return 'start'
    if (dx < -5) return 'end'
    return 'middle'
  }

  function getBaselineShift(i: number): 'auto' | 'middle' | 'hanging' {
    const { y } = polarToXY(i, 1)
    const dy = y - CY
    if (dy < -5) return 'auto'
    if (dy > 5) return 'hanging'
    return 'middle'
  }

  function handlePointEnter(i: number) {
    const d = DIMS[i]
    const s = scoreMap[d.key] ?? 3
    const r = (s / 5) * MAX_R
    const { x, y } = polarToXY(i, r)
    setTooltip({ label: d.label, score: s, x, y })
  }

  return (
    <div>
      {/* ── Desktop: SVG radar ── */}
      <div className="hidden sm:block relative">
        <svg
          ref={svgRef}
          viewBox="0 0 400 400"
          className="w-full max-w-sm mx-auto"
          aria-label="Radar chart of evaluation scores"
        >
          {/* Axis lines */}
          {DIMS.map((_, i) => {
            const { x, y } = polarToXY(i, MAX_R)
            return (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={x}
                y2={y}
                stroke="#E8E4DD"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )
          })}

          {/* Concentric rings at scores 1–5 */}
          {[1, 2, 3, 4, 5].map((ring) => (
            <polygon
              key={ring}
              points={buildRingPoints(ring)}
              fill="none"
              stroke="#E8E4DD"
              strokeWidth={ring === 5 ? 1.5 : 1}
              strokeDasharray={ring < 5 ? '4 4' : undefined}
            />
          ))}

          {/* Score ring labels (1–5 on top axis) */}
          {[1, 2, 3, 4, 5].map((ring) => {
            const { y: ry } = polarToXY(0, (ring / 5) * MAX_R)
            return (
              <text
                key={ring}
                x={CX + 4}
                y={ry}
                fontSize={9}
                fill="#0A162840"
                textAnchor="start"
                dominantBaseline="middle"
              >
                {ring}
              </text>
            )
          })}

          {/* Data polygon — animated scale from center */}
          <polygon
            points={polygonPoints}
            fill="#0EA5E9"
            fillOpacity={0.12}
            stroke="#0EA5E9"
            strokeWidth={2}
            strokeLinejoin="round"
            style={{
              transformOrigin: `${CX}px ${CY}px`,
              transform: animated ? 'scale(1)' : 'scale(0)',
              transition: 'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />

          {/* Data points */}
          {DIMS.map((d, i) => {
            const s = scoreMap[d.key] ?? 3
            const r = (s / 5) * MAX_R
            const { x, y } = polarToXY(i, r)
            const color = scoreColor(s)
            return (
              <circle
                key={d.key}
                cx={x}
                cy={y}
                r={5}
                fill={color}
                stroke="white"
                strokeWidth={1.5}
                style={{
                  transformOrigin: `${CX}px ${CY}px`,
                  transform: animated ? 'scale(1)' : 'scale(0)',
                  transition: `transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 40}ms`,
                  cursor: 'pointer',
                }}
                onMouseEnter={() => handlePointEnter(i)}
                onMouseLeave={() => setTooltip(null)}
              />
            )
          })}

          {/* Axis labels */}
          {DIMS.map((d, i) => {
            const { x, y } = polarToXY(i, LABEL_R)
            return (
              <text
                key={d.key}
                x={x}
                y={y}
                fontSize={11}
                fontWeight={500}
                fill="#0A162880"
                textAnchor={getAnchor(i)}
                dominantBaseline={getBaselineShift(i)}
              >
                {d.shortLabel}
              </text>
            )
          })}
        </svg>

        {/* Floating tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 px-3 py-2 rounded-lg text-xs font-semibold shadow-lg"
            style={{
              background: '#0A1628',
              color: '#FAFAF8',
              // Convert SVG coords to percentage-based position
              // SVG viewBox is 400x400, container is square
              left: `calc(${(tooltip.x / 400) * 100}% - 56px)`,
              top: `calc(${(tooltip.y / 400) * 100}% - 44px)`,
              minWidth: 112,
              textAlign: 'center',
            }}
          >
            <p className="text-[#FAFAF8]/60 font-normal">{tooltip.label}</p>
            <p style={{ color: scoreColor(tooltip.score) }}>
              {tooltip.score.toFixed(1)} / 5.0
            </p>
          </div>
        )}
      </div>

      {/* ── Mobile: bar chart ── */}
      <div className="block sm:hidden">
        <BarChart scores={scoreMap} />
      </div>

      {/* Visa score note */}
      {visaFeasibilityScore !== null && visaFeasibilityScore !== undefined && (
        <div className="mt-4 pt-4 border-t border-[#E8E4DD]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#0A1628]/50">Visa Feasibility</span>
            <span
              className="font-mono font-semibold"
              style={{ color: scoreColor(visaFeasibilityScore) }}
            >
              {visaFeasibilityScore.toFixed(1)}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 bg-[#E8E4DD] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${((visaFeasibilityScore - 1) / 4) * 100}%`,
                background: scoreColor(visaFeasibilityScore),
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
