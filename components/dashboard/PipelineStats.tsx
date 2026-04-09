import Link from 'next/link'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PipelineStatCounts {
  total: number
  applying: number
  applied: number
  interviewing: number
  offer: number
  hired: number
  rejected: number
  withdrawn: number
}

// ─── Stat config ──────────────────────────────────────────────────────────────

interface StatItem {
  key: keyof PipelineStatCounts
  label: string
  color: string
}

const STAT_ITEMS: StatItem[] = [
  { key: 'total',        label: 'Total',        color: '#1E4976' },  // navy-800
  { key: 'applying',     label: 'In Progress',  color: '#0EA5E9' },  // teal-500 (applying + applied)
  { key: 'interviewing', label: 'Interviewing', color: '#0EA5E9' },  // teal-500
  { key: 'offer',        label: 'Offers',       color: '#22C55E' },  // grade-a
  { key: 'hired',        label: 'Hired',        color: '#22C55E' },  // grade-a
]

// ─── Single stat pill ─────────────────────────────────────────────────────────

function StatPill({
  count,
  label,
  color,
  isLast,
}: {
  count: number
  label: string
  color: string
  isLast: boolean
}) {
  return (
    <div className="flex items-stretch">
      <div className="flex flex-col items-center justify-center px-4 py-3 min-w-[72px]">
        <span
          className="text-xl font-bold tabular-nums leading-tight"
          style={{ fontFamily: 'var(--font-family-display)', color }}
        >
          {count}
        </span>
        <span className="text-[10px] text-[#0A1628]/40 mt-0.5 whitespace-nowrap">
          {label}
        </span>
      </div>
      {!isLast && (
        <div
          className="self-stretch my-3"
          style={{ width: 1, background: '#E8E4DD' }}
        />
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PipelineStats({ counts }: { counts: PipelineStatCounts }) {
  // "In Progress" merges applying + applied
  const inProgress = counts.applying + counts.applied

  const resolvedCounts: Record<string, number> = {
    total:        counts.total,
    applying:     inProgress,
    interviewing: counts.interviewing,
    offer:        counts.offer,
    hired:        counts.hired,
  }

  // Hide stat if 0 and not "total"
  const visibleItems = STAT_ITEMS.filter(
    (s) => s.key === 'total' || resolvedCounts[s.key] > 0,
  )

  if (counts.total === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2
            className="text-xs font-bold uppercase tracking-[0.08em] text-[#0A1628]/40"
            style={{ fontFamily: 'var(--font-family-display)' }}
          >
            Pipeline
          </h2>
        </div>
        <div
          className="rounded-[10px] border border-[#E8E4DD] bg-white px-4 py-6 text-center"
        >
          <p className="text-sm text-[#0A1628]/35 mb-2">Your pipeline is empty.</p>
          <Link
            href="/pipeline"
            className="text-xs font-semibold text-[#0EA5E9] hover:underline"
          >
            Add your first application →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-2">
        <h2
          className="text-xs font-bold uppercase tracking-[0.08em] text-[#0A1628]/40"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Pipeline
        </h2>
        <Link
          href="/pipeline"
          className="text-xs font-semibold text-[#0EA5E9] hover:underline"
        >
          Open →
        </Link>
      </div>

      {/* Desktop: horizontal row of pills */}
      <div className="hidden sm:block rounded-[10px] border border-[#E8E4DD] bg-white overflow-hidden">
        <div className="flex items-stretch">
          {visibleItems.map((item, i) => (
            <StatPill
              key={item.key}
              count={resolvedCounts[item.key]}
              label={item.label}
              color={item.color}
              isLast={i === visibleItems.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Mobile: 2×2 grid */}
      <div
        className="sm:hidden grid grid-cols-2 rounded-[10px] border border-[#E8E4DD] bg-white overflow-hidden"
      >
        {visibleItems.map((item, i) => (
          <div
            key={item.key}
            className="flex flex-col items-center justify-center py-4"
            style={{
              borderRight: i % 2 === 0 ? '1px solid #E8E4DD' : 'none',
              borderBottom: i < visibleItems.length - 2 ? '1px solid #E8E4DD' : 'none',
            }}
          >
            <span
              className="text-xl font-bold tabular-nums"
              style={{ fontFamily: 'var(--font-family-display)', color: item.color }}
            >
              {resolvedCounts[item.key]}
            </span>
            <span className="text-[10px] text-[#0A1628]/40 mt-0.5">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
