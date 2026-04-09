import Link from 'next/link'
import { ArrowRight, Zap, BarChart3, Shield } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RecentEvalItem {
  id: string
  jobTitle: string
  companyName: string
  grade: string | null
  overallScore: number | null
  createdAt: string
}

// ─── Grade config ─────────────────────────────────────────────────────────────

const GRADE_COLORS: Record<string, string> = {
  A: '#22C55E',
  B: '#0EA5E9',
  C: '#F59E0B',
  D: '#F97316',
  F: '#EF4444',
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function EvalRow({ item }: { item: RecentEvalItem }) {
  const dotColor = item.grade ? GRADE_COLORS[item.grade] : '#94A3B8'

  return (
    <Link
      href={`/evaluations/${item.id}`}
      className="group flex items-center gap-3 px-4 py-3 rounded-[8px] transition-colors duration-100"
      style={{ background: 'transparent' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F5F3EF' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {/* Grade dot */}
      <div
        className="flex-shrink-0 w-2 h-2 rounded-full"
        style={{ background: dotColor }}
        title={item.grade ? `Grade ${item.grade}` : 'Not graded'}
      />

      {/* Company + role */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#0A1628] truncate leading-tight">
          {item.companyName}
        </p>
        <p className="text-xs text-[#0A1628]/50 truncate leading-tight">
          {item.jobTitle}
        </p>
      </div>

      {/* Score + date */}
      <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
        {item.overallScore !== null && (
          <span
            className="text-xs font-medium tabular-nums"
            style={{ fontFamily: 'var(--font-family-mono)', color: dotColor }}
          >
            {item.overallScore.toFixed(1)}
          </span>
        )}
        <span
          className="text-[10px] text-[#0A1628]/30 tabular-nums whitespace-nowrap"
          style={{ fontFamily: 'var(--font-family-mono)' }}
        >
          {fmtDate(item.createdAt)}
        </span>
      </div>

      {/* Hover arrow */}
      <ArrowRight
        size={13}
        className="flex-shrink-0 text-[#0A1628]/20 group-hover:text-[#0EA5E9] transition-colors duration-100"
      />
    </Link>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const STEPS = [
  { icon: Zap,       label: 'Paste a job URL or description' },
  { icon: BarChart3, label: 'Get an instant 10-dimension fit score' },
  { icon: Shield,    label: 'Check visa eligibility in one click' },
]

function EmptyState() {
  return (
    <div className="px-5 py-7 text-center">
      <p className="text-sm font-semibold text-[#0A1628] mb-1">No evaluations yet</p>
      <p className="text-xs text-[#0A1628]/45 mb-5 leading-relaxed">
        Evaluate a job to get an honest AI fit score tailored to your profile.
      </p>

      {/* How it works — 3-step mini guide */}
      <div className="flex flex-col gap-2 mb-5 text-left">
        {STEPS.map(({ icon: Icon, label }, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="flex-shrink-0 w-6 h-6 rounded-md bg-[#0EA5E9]/10 flex items-center justify-center">
              <Icon size={12} className="text-[#0EA5E9]" />
            </div>
            <p className="text-xs text-[#0A1628]/60">{label}</p>
          </div>
        ))}
      </div>

      <Link
        href="/evaluate"
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A1628] text-white px-4 py-2.5 text-xs font-semibold hover:bg-[#0EA5E9] transition-colors"
      >
        Evaluate your first job
        <ArrowRight size={12} />
      </Link>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RecentEvaluations({ items }: { items: RecentEvalItem[] }) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-2">
        <h2
          className="text-xs font-bold uppercase tracking-[0.08em] text-[#0A1628]/40"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Recent Evaluations
        </h2>
        {items.length > 0 && (
          <Link
            href="/evaluations"
            className="text-xs font-semibold text-[#0EA5E9] hover:underline flex items-center gap-1"
          >
            View all
            <ArrowRight size={11} />
          </Link>
        )}
      </div>

      {/* List */}
      <div className="rounded-[10px] border border-[#E8E4DD] bg-white overflow-hidden divide-y divide-[#E8E4DD]/60">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          items.map((item) => <EvalRow key={item.id} item={item} />)
        )}
      </div>
    </div>
  )
}
