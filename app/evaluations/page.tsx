'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvalRow {
  id: string
  job_title: string
  company_name: string
  location: string | null
  job_url: string | null
  overall_score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  recommendation: 'apply' | 'consider' | 'not_yet' | 'dont_apply'
  evaluation_summary: string
  requires_visa_sponsorship_at_eval: boolean
  created_at: string
}

// ─── Config ───────────────────────────────────────────────────────────────────

const GRADE_CFG = {
  A: { hex: '#22C55E', label: 'Excellent' },
  B: { hex: '#0EA5E9', label: 'Strong'    },
  C: { hex: '#F59E0B', label: 'Moderate'  },
  D: { hex: '#F97316', label: 'Weak'      },
  F: { hex: '#EF4444', label: 'Poor'      },
} as const

const REC_LABELS = {
  apply:      'Apply',
  consider:   'Consider',
  not_yet:    'Not yet',
  dont_apply: "Don't apply",
}

const REC_COLORS = {
  apply:      { bg: '#22C55E14', text: '#22C55E' },
  consider:   { bg: '#F59E0B14', text: '#F59E0B' },
  not_yet:    { bg: '#F9731614', text: '#F97316' },
  dont_apply: { bg: '#EF444414', text: '#EF4444' },
}

type Grade = 'A' | 'B' | 'C' | 'D' | 'F'
type SortKey = 'date' | 'score'

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {/* Compass SVG */}
      <svg
        width={64}
        height={64}
        viewBox="0 0 64 64"
        fill="none"
        className="mb-6 opacity-30"
        aria-hidden="true"
      >
        <circle cx={32} cy={32} r={28} stroke="#0A1628" strokeWidth={2} />
        <circle cx={32} cy={32} r={3} fill="#0A1628" />
        <polygon points="32,12 28,32 32,30 36,32" fill="#0EA5E9" />
        <polygon points="32,52 28,32 32,34 36,32" fill="#0A162860" />
        <line x1={32} y1={8} x2={32} y2={14} stroke="#0A162840" strokeWidth={1.5} />
        <line x1={32} y1={50} x2={32} y2={56} stroke="#0A162440" strokeWidth={1.5} />
        <line x1={8} y1={32} x2={14} y2={32} stroke="#0A162440" strokeWidth={1.5} />
        <line x1={50} y1={32} x2={56} y2={32} stroke="#0A162440" strokeWidth={1.5} />
      </svg>
      <h2 className="text-lg font-semibold text-[#0A1628] mb-2">No evaluations yet</h2>
      <p className="text-sm text-[#0A1628]/50 max-w-xs mb-8 leading-relaxed">
        Paste a job description and get an honest 10-dimension AI match score tailored to your profile.
      </p>
      <Link
        href="/evaluate"
        className="inline-flex items-center gap-2 rounded-xl bg-[#0A1628] text-white px-5 py-3 text-sm font-semibold hover:bg-[#0EA5E9] transition-colors"
      >
        <Plus size={15} />
        Evaluate your first role
      </Link>
    </div>
  )
}

// ─── Evaluation card ──────────────────────────────────────────────────────────

function EvalCard({ row }: { row: EvalRow }) {
  const router = useRouter()
  const gc = GRADE_CFG[row.grade]
  const rec = REC_COLORS[row.recommendation]
  const date = new Date(row.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div
      className="relative bg-[#FAFAF8] rounded-2xl border border-[#E8E4DD] hover:border-[#0EA5E9]/40 hover:shadow-[0_2px_12px_0_rgba(14,165,233,0.08)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden group"
      style={{ borderBottom: `2px solid ${gc.hex}` }}
      onClick={() => router.push(`/evaluations/${row.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') router.push(`/evaluations/${row.id}`)
      }}
    >
      {/* Grade circle — top right */}
      <div
        className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono"
        style={{ background: `${gc.hex}18`, color: gc.hex }}
      >
        {row.grade}
      </div>

      <div className="p-5 pr-14">
        {/* Title + company */}
        <h3 className="text-sm font-semibold text-[#0A1628] leading-snug mb-1 pr-2">
          {row.job_title}
        </h3>
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <span className="flex items-center gap-1 text-xs text-[#0A1628]/45">
            <Building2 size={11} />
            {row.company_name}
          </span>
          {row.location && (
            <span className="flex items-center gap-1 text-xs text-[#0A1628]/45">
              <MapPin size={11} />
              {row.location}
            </span>
          )}
        </div>

        {/* Summary snippet */}
        <p className="text-xs text-[#0A1628]/55 line-clamp-2 leading-relaxed mb-3">
          {row.evaluation_summary}
        </p>

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Recommendation pill */}
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-md"
              style={{ background: rec.bg, color: rec.text }}
            >
              {REC_LABELS[row.recommendation]}
            </span>

            {/* Score */}
            <span
              className="text-xs font-mono font-semibold"
              style={{ color: gc.hex }}
            >
              {row.overall_score.toFixed(1)}
            </span>

            {/* Visa badge */}
            {row.requires_visa_sponsorship_at_eval && (
              <span className="text-xs text-[#0EA5E9] bg-[#0EA5E9]/10 px-1.5 py-0.5 rounded font-medium">
                Visa
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-[#0A1628]/30">
              <Calendar size={10} />
              {date}
            </span>
            {row.job_url && (
              <a
                href={row.job_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[#0A1628]/25 hover:text-[#0EA5E9] transition-colors"
                title="View original posting"
              >
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EvaluationsPage() {
  const [rows, setRows] = useState<EvalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [activeGrades, setActiveGrades] = useState<Grade[]>([])
  const [sort, setSort] = useState<SortKey>('date')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/evaluations?limit=50&sort=date&order=desc')
        if (!res.ok) throw new Error('Failed')
        const json = await res.json()
        setRows(json.data ?? [])
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Filter + sort
  const filtered = rows
    .filter((r) => activeGrades.length === 0 || activeGrades.includes(r.grade))
    .sort((a, b) => {
      if (sort === 'score') return b.overall_score - a.overall_score
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  function toggleGrade(g: Grade) {
    setActiveGrades((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-[#0A1628] tracking-tight mb-1">
              Evaluations
            </h1>
            <p className="text-[#0A1628]/45 text-sm">
              {loading
                ? 'Loading…'
                : rows.length > 0
                ? `${rows.length} role${rows.length !== 1 ? 's' : ''} evaluated`
                : 'No evaluations yet'}
            </p>
          </div>
          <Link
            href="/evaluate"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0A1628] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#0EA5E9] transition-colors shadow-sm"
          >
            <Plus size={15} />
            New evaluation
          </Link>
        </div>

        {/* ── Controls ── */}
        {rows.length > 0 && (
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            {/* Grade filter pills */}
            <div className="flex items-center gap-1.5 bg-white rounded-xl border border-[#E8E4DD] p-1">
              {(Object.keys(GRADE_CFG) as Grade[]).map((g) => {
                const active = activeGrades.includes(g)
                const cfg = GRADE_CFG[g]
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGrade(g)}
                    className="w-8 h-8 rounded-lg text-xs font-bold font-mono transition-all duration-150"
                    style={
                      active
                        ? { background: `${cfg.hex}20`, color: cfg.hex }
                        : { color: '#0A162840' }
                    }
                    title={`Filter grade ${g}`}
                  >
                    {g}
                  </button>
                )
              })}
              {activeGrades.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveGrades([])}
                  className="text-xs text-[#0A1628]/40 hover:text-[#0A1628] px-2 transition-colors"
                  title="Clear filter"
                >
                  ×
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5 ml-auto">
              <SlidersHorizontal size={13} className="text-[#0A1628]/35" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="text-xs text-[#0A1628]/60 bg-transparent border-none outline-none cursor-pointer"
              >
                <option value="date">Newest first</option>
                <option value="score">Highest score</option>
              </select>
            </div>
          </div>
        )}

        {/* ── States ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#E8E4DD] h-44 animate-pulse"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/5 px-5 py-4 text-sm text-[#EF4444]">
            Failed to load evaluations. Please refresh the page.
          </div>
        )}

        {!loading && !error && rows.length === 0 && <EmptyState />}

        {/* ── Card grid ── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((row) => (
              <EvalCard key={row.id} row={row} />
            ))}
          </div>
        )}

        {/* No results after filter */}
        {!loading && !error && rows.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-[#0A1628]/45 mb-3">
              No evaluations match the selected grades.
            </p>
            <button
              type="button"
              onClick={() => setActiveGrades([])}
              className="text-sm text-[#0EA5E9] hover:underline"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
