'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, LayoutGrid, List, X, Shield, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { PipelineList } from '@/components/pipeline/PipelineList'

// Lazy-load the kanban board — it pulls in drag-and-drop logic not needed on mobile
const KanbanBoard = dynamic(
  () => import('@/components/pipeline/KanbanBoard').then((m) => m.KanbanBoard),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-[#E8E4DD]/40 animate-pulse" />
        ))}
      </div>
    ),
  },
)
import type { PipelineCardItem } from '@/components/pipeline/PipelineCard'
import type { PipelineStatus } from '@/types/pipeline'

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'kanban' | 'list'

interface ActiveFilter {
  type: 'status' | 'grade'
  value: string
  label: string
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

interface Particle {
  id: number
  x: number
  vx: number
  vy: number
  color: string
  size: number
  rot: number
  rotV: number
  life: number
}

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ['#0EA5E9', '#0A1628', '#22C55E', '#38BDF8', '#E8E4DD', '#F5F3EF']
    particlesRef.current = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x:   Math.random() * canvas.width,
      vx:  (Math.random() - 0.5) * 4,
      vy:  -(Math.random() * 6 + 4),
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 7 + 4,
      rot:  Math.random() * 360,
      rotV: (Math.random() - 0.5) * 8,
      life: 1,
    }))

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particlesRef.current = particlesRef.current
        .map((p) => ({ ...p, x: p.x + p.vx, vy: p.vy + 0.25, y: 0, vx: p.vx * 0.99, rot: p.rot + p.rotV, life: p.life - 0.012 }))
        .filter((p) => p.life > 0)

      for (const p of particlesRef.current) {
        ctx.save()
        // compute y from cumulative vy — we use a simplified approach
        const elapsed = (1 - p.life) / 0.012
        const y = p.vy * elapsed - 0.125 * elapsed * elapsed + canvas.height * 0.15
        ctx.globalAlpha = Math.min(p.life * 2, 1)
        ctx.translate(p.x, y)
        ctx.rotate((p.rot * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5)
        ctx.restore()
      }

      if (particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  )
}

// ─── Sponsor watch modal ──────────────────────────────────────────────────────

function SponsorWatchModal({ company, onClose, onOptIn }: {
  company: string
  onClose: () => void
  onOptIn: () => void
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0A1628]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-[#E8E4DD] shadow-lg max-w-sm w-full p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-[#0EA5E9]" />
            <h2 className="text-base font-bold text-[#0A1628]">Sponsor Watch</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#0A1628]/35 hover:text-[#0A1628] hover:bg-[#E8E4DD] transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-sm text-[#0A1628]/70 leading-relaxed mb-5">
          Congratulations on your offer at <strong>{company}</strong>!
          {' '}Would you like to monitor their sponsor licence status?
          We'll alert you if their rating changes.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onOptIn}
            className="flex-1 rounded-xl bg-[#0A1628] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#0EA5E9] transition-colors"
          >
            Enable Sponsor Watch
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E8E4DD] px-4 py-2.5 text-sm font-medium text-[#0A1628]/55 hover:text-[#0A1628] transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {/* Rocket SVG */}
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="mb-6 opacity-25" aria-hidden="true">
        <path d="M36 8C36 8 22 20 22 40C22 48.837 28.163 56 36 56C43.837 56 50 48.837 50 40C50 20 36 8 36 8Z" stroke="#0A1628" strokeWidth="2" strokeLinejoin="round"/>
        <ellipse cx="36" cy="40" rx="6" ry="7" fill="#0EA5E9" opacity="0.4"/>
        <path d="M22 46L14 54M50 46L58 54" stroke="#0A1628" strokeWidth="2" strokeLinecap="round"/>
        <path d="M30 56L28 64M42 56L44 64" stroke="#0A1628" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="36" cy="27" r="3" fill="#0EA5E9"/>
      </svg>

      <h2
        className="text-xl font-bold text-[#0A1628] mb-2"
        style={{ fontFamily: 'var(--font-family-display)' }}
      >
        Your pipeline is empty
      </h2>
      <p className="text-sm text-[#0A1628]/45 max-w-xs mb-8 leading-relaxed">
        Evaluate a job to get started. Every role you assess can be tracked from here through to offer.
      </p>

      <Link
        href="/evaluate"
        className="inline-flex items-center gap-2 rounded-xl bg-[#0EA5E9] text-white px-5 py-3 text-sm font-semibold hover:bg-[#0A1628] transition-colors"
      >
        <Rocket size={15} />
        Evaluate a job to get started →
      </Link>

      <Link
        href="/pipeline/add"
        className="mt-4 text-sm text-[#0A1628]/40 hover:text-[#0EA5E9] transition-colors"
      >
        Or add manually
      </Link>
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, label, accent }: { value: number; label: string; accent?: string }) {
  return (
    <div className="bg-[#FAFAF8] rounded-xl border border-[#E8E4DD] px-4 py-3 flex flex-col gap-0.5 min-w-[80px]">
      <span
        className="text-2xl font-bold tabular-nums leading-none"
        style={{ fontFamily: 'var(--font-family-display)', color: accent ?? '#0A1628' }}
      >
        {value}
      </span>
      <span className="text-[10px] text-[#0A1628]/40 uppercase tracking-wide font-medium whitespace-nowrap">
        {label}
      </span>
    </div>
  )
}

// ─── Filter pill ──────────────────────────────────────────────────────────────

function FilterPill({ filter, onRemove }: { filter: ActiveFilter; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#0EA5E9] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
      {filter.label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:opacity-70 transition-opacity"
        aria-label={`Remove ${filter.label} filter`}
      >
        <X size={10} />
      </button>
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const STATUS_FILTERS: { value: PipelineStatus; label: string }[] = [
  { value: 'applying',     label: 'Applying'     },
  { value: 'applied',      label: 'Applied'      },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer',        label: 'Offer'        },
  { value: 'hired',        label: 'Hired'        },
  { value: 'rejected',     label: 'Rejected'     },
]

const GRADE_FILTERS = ['A', 'B', 'C', 'D', 'F']

export default function PipelinePage() {
  const router = useRouter()
  const [view, setView] = useState<ViewMode>('kanban')
  const [items, setItems] = useState<PipelineCardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [sponsorModal, setSponsorModal] = useState<{ itemId: string; company: string } | null>(null)

  // ── Default to list view on mobile ──
  useEffect(() => {
    if (window.innerWidth < 768) setView('list')
  }, [])

  // ── Load pipeline ──
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/pipeline?limit=200')
        if (res.status === 401) { router.replace('/login'); return }
        if (!res.ok) throw new Error('Failed')
        const json = await res.json()
        setItems(json.data ?? [])
      } catch {
        // silent — empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  // ── Status change (kanban drag / list select) ──
  const handleStatusChange = useCallback(async (id: string, status: PipelineStatus) => {
    // Optimistic update
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i))

    // Hired celebration
    if (status === 'hired') {
      setConfetti(true)
      const item = items.find((i) => i.id === id)
      if (item) {
        setTimeout(() => setSponsorModal({ itemId: id, company: item.company }), 600)
      }
      setTimeout(() => setConfetti(false), 1200)
    }

    await fetch(`/api/pipeline/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }, [items])

  // ── Delete ──
  const handleDelete = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    await fetch(`/api/pipeline/${id}`, { method: 'DELETE' })
  }, [])

  // ── Sponsor watch opt-in ──
  async function handleSponsorOptIn() {
    if (!sponsorModal) return
    await fetch(`/api/pipeline/${sponsorModal.itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sponsorWatchOptIn: true }),
    })
    setSponsorModal(null)
  }

  // ── Filter helpers ──
  function toggleFilter(type: 'status' | 'grade', value: string, label: string) {
    setActiveFilters((prev) => {
      const exists = prev.find((f) => f.type === type && f.value === value)
      return exists ? prev.filter((f) => !(f.type === type && f.value === value)) : [...prev, { type, value, label }]
    })
  }

  function removeFilter(f: ActiveFilter) {
    setActiveFilters((prev) => prev.filter((x) => !(x.type === f.type && x.value === f.value)))
  }

  // ── Apply filters ──
  const statusFilters = activeFilters.filter((f) => f.type === 'status').map((f) => f.value)
  const gradeFilters  = activeFilters.filter((f) => f.type === 'grade').map((f) => f.value)

  const visibleItems = items.filter((item) => {
    if (statusFilters.length > 0 && !statusFilters.includes(item.status)) return false
    if (gradeFilters.length > 0 && !(item.evaluationGrade && gradeFilters.includes(item.evaluationGrade))) return false
    return true
  })

  // ── Stats ──
  const total       = items.length
  const applying    = items.filter((i) => i.status === 'applying' || i.status === 'applied').length
  const interviewing = items.filter((i) => i.status === 'interviewing').length
  const offers      = items.filter((i) => i.status === 'offer' || i.status === 'hired').length

  return (
    <>
      {confetti && <ConfettiCanvas />}
      {sponsorModal && (
        <SponsorWatchModal
          company={sponsorModal.company}
          onClose={() => setSponsorModal(null)}
          onOptIn={handleSponsorOptIn}
        />
      )}

      <div className="min-h-screen bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6">

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1
                className="text-3xl font-bold text-[#0A1628] tracking-tight mb-1"
                style={{ fontFamily: 'var(--font-family-display)' }}
              >
                Pipeline
              </h1>
              <p className="text-[#0A1628]/45 text-sm">
                {loading ? 'Loading…' : `${total} role${total !== 1 ? 's' : ''} tracked`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center bg-[#F5F3EF] rounded-lg border border-[#E8E4DD] p-1 gap-0.5">
                {(['kanban', 'list'] as ViewMode[]).map((v) => {
                  const Icon = v === 'kanban' ? LayoutGrid : List
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200',
                        view === v
                          ? 'bg-[#0A1628] text-white shadow-sm'
                          : 'text-[#0A1628]/40 hover:text-[#0A1628]/70',
                      )}
                    >
                      <Icon size={13} />
                      <span className="capitalize">{v}</span>
                    </button>
                  )
                })}
              </div>

              <Link
                href="/evaluate"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A1628] text-white px-4 py-2 text-sm font-semibold hover:bg-[#0EA5E9] transition-colors"
              >
                <Plus size={14} />
                New evaluation
              </Link>
            </div>
          </div>

          {/* ── Stats strip ── */}
          {!loading && total > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-1 mb-6">
              <StatCard value={total}        label="Total"        />
              <StatCard value={applying}     label="Applied"      accent="#0EA5E9" />
              <StatCard value={interviewing} label="Interviewing" accent="#F59E0B" />
              <StatCard value={offers}       label="Offers"       accent="#22C55E" />
            </div>
          )}

          {/* ── Filters ── */}
          {!loading && total > 0 && (
            <div className="mb-5">
              <div className="flex flex-wrap items-center gap-2">
                {/* Active filter pills */}
                {activeFilters.map((f) => (
                  <FilterPill key={`${f.type}-${f.value}`} filter={f} onRemove={() => removeFilter(f)} />
                ))}

                {/* Filter trigger */}
                <button
                  type="button"
                  onClick={() => setShowFilters((v) => !v)}
                  className={cn(
                    'inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full border text-xs font-medium transition-colors',
                    showFilters
                      ? 'border-[#0EA5E9] bg-[#0EA5E9]/10 text-[#0EA5E9]'
                      : 'border-[#E8E4DD] bg-white text-[#0A1628]/45 hover:text-[#0A1628]',
                  )}
                >
                  Filter
                  {activeFilters.length > 0 && (
                    <span className="bg-[#0EA5E9] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                      {activeFilters.length}
                    </span>
                  )}
                </button>

                {activeFilters.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilters([])}
                    className="text-xs text-[#0A1628]/35 hover:text-[#0A1628] transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Filter panel */}
              {showFilters && (
                <div className="mt-3 p-4 bg-white rounded-xl border border-[#E8E4DD] space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#0A1628]/35 mb-2">Status</p>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_FILTERS.map(({ value, label }) => {
                        const active = activeFilters.some((f) => f.type === 'status' && f.value === value)
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => toggleFilter('status', value, label)}
                            className={cn(
                              'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                              active
                                ? 'bg-[#0EA5E9] text-white border-[#0EA5E9]'
                                : 'bg-white text-[#0A1628]/55 border-[#E8E4DD] hover:border-[#0EA5E9]/40',
                            )}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#0A1628]/35 mb-2">Grade</p>
                    <div className="flex gap-1.5">
                      {GRADE_FILTERS.map((g) => {
                        const active = activeFilters.some((f) => f.type === 'grade' && f.value === g)
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => toggleFilter('grade', g, `Grade ${g}`)}
                            className={cn(
                              'w-8 h-8 rounded-full text-xs font-bold font-mono border transition-all',
                              active
                                ? 'bg-[#0A1628] text-white border-[#0A1628]'
                                : 'bg-white text-[#0A1628]/50 border-[#E8E4DD] hover:border-[#0A1628]/30',
                            )}
                          >
                            {g}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Content ── */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 rounded-[8px] bg-[#E8E4DD]/50 animate-pulse" />
              ))}
            </div>
          ) : total === 0 ? (
            <EmptyState />
          ) : view === 'kanban' ? (
            <KanbanBoard
              items={visibleItems}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ) : (
            <PipelineList
              items={visibleItems}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          )}

        </div>
      </div>
    </>
  )
}
