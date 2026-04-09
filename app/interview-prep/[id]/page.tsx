'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ChevronDown,
  BookOpen,
  HelpCircle,
  Building2,
  Printer,
  AlertCircle,
  Zap,
  Star,
  BarChart2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StarStory {
  competency: string
  situation: string
  task: string
  action: string
  result: string
  reflection: string
  quantifiedImpact: string | null
}

interface LikelyQuestion {
  question: string
  rationale: string
  suggestedAnswer: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface PrepRecord {
  id: string
  evaluationId: string
  starStories: StarStory[]
  likelyQuestions: LikelyQuestion[]
  companyResearchNotes: string
  createdAt: string
  jobTitle: string | null
  companyName: string | null
  location: string | null
  overallScore: number | null
  grade: string | null
}

// ─── Config ───────────────────────────────────────────────────────────────────

const DIFFICULTY_CFG = {
  easy:   { label: 'Easy',   bg: '#22C55E14', text: '#22C55E' },
  medium: { label: 'Medium', bg: '#F59E0B14', text: '#F59E0B' },
  hard:   { label: 'Hard',   bg: '#EF444414', text: '#EF4444' },
}

const STAR_SECTIONS = [
  { key: 'situation',  label: 'Situation',  color: '#0EA5E9' },
  { key: 'task',       label: 'Task',       color: '#8B5CF6' },
  { key: 'action',     label: 'Action',     color: '#F59E0B' },
  { key: 'result',     label: 'Result',     color: '#22C55E' },
  { key: 'reflection', label: 'Reflection', color: '#F97316' },
] as const

// ─── STAR story card ──────────────────────────────────────────────────────────

function StarCard({ story, index }: { story: StarStory; index: number }) {
  const [open, setOpen] = useState(index === 0)

  return (
    <div className="rounded-2xl border border-[#E8E4DD] overflow-hidden bg-white">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-[#FAFAF8] transition-colors"
        aria-expanded={open}
      >
        {/* Index circle */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0A1628] text-white text-xs font-bold font-mono flex items-center justify-center mt-0.5">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0EA5E9] mb-1">
            {story.competency}
          </p>
          {/* Preview: first sentence of situation */}
          {!open && (
            <p className="text-sm text-[#0A1628]/55 leading-relaxed line-clamp-2">
              {story.situation}
            </p>
          )}
          {/* Quantified impact pill */}
          {story.quantifiedImpact && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-md bg-[#22C55E]/10 text-[#22C55E]">
              <Zap size={10} />
              {story.quantifiedImpact}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className="flex-shrink-0 text-[#0A1628]/30 mt-1"
          style={{
            transform:  open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
          }}
        />
      </button>

      {/* Body — expanded */}
      <div
        style={{
          maxHeight:  open ? 2000 : 0,
          opacity:    open ? 1 : 0,
          overflow:   'hidden',
          transition: 'max-height 350ms ease, opacity 200ms ease',
        }}
      >
        <div className="px-5 pb-5 border-t border-[#E8E4DD] pt-4 space-y-4">
          {STAR_SECTIONS.map(({ key, label, color }) => (
            <div key={key} className="flex gap-3">
              {/* Colour pip */}
              <div
                className="flex-shrink-0 w-1 rounded-full mt-1"
                style={{ background: color, minHeight: 16 }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-1"
                  style={{ color }}
                >
                  {label}
                </p>
                <p className="text-sm text-[#0A1628]/80 leading-relaxed">
                  {story[key as keyof StarStory] as string}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Question card ────────────────────────────────────────────────────────────

function QuestionCard({ q, index }: { q: LikelyQuestion; index: number }) {
  const [open, setOpen] = useState(false)
  const diff = DIFFICULTY_CFG[q.difficulty] ?? DIFFICULTY_CFG.medium

  return (
    <div className="rounded-xl border border-[#E8E4DD] overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-[#FAFAF8] transition-colors"
        aria-expanded={open}
      >
        <span className="flex-shrink-0 text-xs font-mono font-semibold text-[#0A1628]/30 mt-0.5 w-5">
          {String(index + 1).padStart(2, '0')}
        </span>
        <p className="flex-1 text-sm font-medium text-[#0A1628] leading-snug">
          {q.question}
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs font-semibold px-1.5 py-0.5 rounded"
            style={{ background: diff.bg, color: diff.text }}
          >
            {diff.label}
          </span>
          <ChevronDown
            size={14}
            className="text-[#0A1628]/25"
            style={{
              transform:  open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease',
            }}
          />
        </div>
      </button>

      <div
        style={{
          maxHeight:  open ? 600 : 0,
          opacity:    open ? 1 : 0,
          overflow:   'hidden',
          transition: 'max-height 300ms ease, opacity 200ms ease',
        }}
      >
        <div className="px-4 pb-4 pt-1 border-t border-[#E8E4DD] space-y-3">
          {/* Rationale */}
          <div className="pt-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#0A1628]/35 mb-1">
              Why they ask this
            </p>
            <p className="text-sm text-[#0A1628]/60 leading-relaxed">{q.rationale}</p>
          </div>
          {/* Answer framework */}
          <div
            className="rounded-lg px-3.5 py-3"
            style={{ background: '#F0F9FF', borderLeft: '3px solid #0EA5E9' }}
          >
            <p className="text-xs font-semibold text-[#0EA5E9] mb-1.5">Answer framework</p>
            <p className="text-sm text-[#0A1628] leading-relaxed">{q.suggestedAnswer}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Print CSS injection ──────────────────────────────────────────────────────

const PRINT_CSS = `
@media print {
  nav, .no-print { display: none !important; }
  body { font-size: 11pt; color: #000; }
  .print-break { page-break-before: always; }
  .star-body { max-height: none !important; opacity: 1 !important; }
}
`

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InterviewPrepPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [prep, setPrep] = useState<PrepRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'stories' | 'questions' | 'research'>('stories')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/interview-prep/${id}`)
        if (res.status === 401) { router.replace('/login'); return }
        if (!res.ok) throw new Error('Not found')
        const json = await res.json()
        setPrep(json.data)
      } catch {
        setError('Could not load interview prep. It may have been deleted.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <p className="text-sm text-[#0A1628]/40">Loading interview prep…</p>
      </div>
    )
  }

  if (error || !prep) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center gap-4">
        <AlertCircle size={32} className="text-[#EF4444]/60" />
        <p className="text-sm text-[#0A1628]/60">{error ?? 'Interview prep not found.'}</p>
        <Link href="/evaluations" className="text-sm text-[#0EA5E9] hover:underline">
          Back to evaluations
        </Link>
      </div>
    )
  }

  const TABS = [
    { key: 'stories',   label: `STAR Stories`,    icon: Star,       count: prep.starStories.length },
    { key: 'questions', label: 'Likely Questions', icon: HelpCircle, count: prep.likelyQuestions.length },
    { key: 'research',  label: 'Company Brief',    icon: Building2,  count: null },
  ] as const

  return (
    <>
      <style>{PRINT_CSS}</style>

      <div className="min-h-screen bg-[#FAFAF8]">
        <div className="max-w-3xl mx-auto px-4 py-10 sm:px-6">

          {/* ── Back nav ── */}
          <Link
            href={`/evaluations/${prep.evaluationId}`}
            className="no-print inline-flex items-center gap-1.5 text-sm text-[#0A1628]/45 hover:text-[#0A1628] transition-colors mb-8 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to evaluation
          </Link>

          {/* ── Header ── */}
          <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={16} className="text-[#0EA5E9]" />
                <span className="text-xs font-semibold uppercase tracking-widest text-[#0EA5E9]">
                  Interview Preparation
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0A1628] tracking-tight">
                {prep.jobTitle ?? 'Interview Prep'}
              </h1>
              {prep.companyName && (
                <p className="text-[#0A1628]/45 text-sm mt-1 flex items-center gap-1.5">
                  <Building2 size={13} />
                  {prep.companyName}
                  {prep.location ? ` · ${prep.location}` : ''}
                </p>
              )}
            </div>

            {/* Print button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="no-print flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[#E8E4DD] bg-white text-sm font-medium text-[#0A1628]/55 hover:text-[#0A1628] hover:border-[#0EA5E9]/30 transition-colors"
            >
              <Printer size={14} />
              Print / Export
            </button>
          </div>

          {/* ── Match score strip ── */}
          {prep.overallScore !== null && (
            <div className="mb-6 bg-white rounded-xl border border-[#E8E4DD] px-4 py-3 flex items-center gap-4">
              <BarChart2 size={14} className="text-[#0A1628]/35" />
              <p className="text-sm text-[#0A1628]/55">
                Evaluated match score:{' '}
                <span className="font-semibold text-[#0A1628]">
                  {prep.overallScore.toFixed(1)} / 5.0
                </span>
                {prep.grade && (
                  <span className="ml-2 text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-[#0A1628]/8 text-[#0A1628]">
                    Grade {prep.grade}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* ── Tabs ── */}
          <div className="no-print flex gap-1 bg-white rounded-xl border border-[#E8E4DD] p-1 mb-6">
            {TABS.map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                  activeTab === key
                    ? 'bg-[#0A1628] text-white shadow-sm'
                    : 'text-[#0A1628]/45 hover:text-[#0A1628]/70',
                )}
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{label}</span>
                {count !== null && (
                  <span
                    className={cn(
                      'text-xs font-mono rounded px-1',
                      activeTab === key ? 'bg-white/20' : 'bg-[#E8E4DD]',
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── STAR Stories ── */}
          {activeTab === 'stories' && (
            <div className="space-y-3">
              <p className="text-xs text-[#0A1628]/40 mb-4 leading-relaxed">
                Each story is grounded in your actual experience, mapped to a competency this employer is likely to probe.
                Expand each card to see the full STAR+Reflection narrative.
              </p>
              {prep.starStories.map((story, i) => (
                <StarCard key={i} story={story} index={i} />
              ))}
            </div>
          )}

          {/* ── Likely Questions ── */}
          {activeTab === 'questions' && (
            <div className="space-y-2">
              <p className="text-xs text-[#0A1628]/40 mb-4 leading-relaxed">
                10 questions predicted for this specific role and company. Expand each for the rationale and a brief answer framework.
              </p>
              {prep.likelyQuestions.map((q, i) => (
                <QuestionCard key={i} q={q} index={i} />
              ))}
            </div>
          )}

          {/* ── Company Research ── */}
          {activeTab === 'research' && (
            <div className="bg-white rounded-2xl border border-[#E8E4DD] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={16} className="text-[#0EA5E9]" />
                <h2 className="text-sm font-semibold text-[#0A1628]">
                  {prep.companyName ?? 'Company'} — Research Brief
                </h2>
              </div>
              {prep.companyResearchNotes ? (
                <div className="prose prose-sm max-w-none">
                  {prep.companyResearchNotes
                    .split('\n')
                    .filter(Boolean)
                    .map((para, i) => (
                      <p key={i} className="text-sm text-[#0A1628]/75 leading-[1.7] mb-3">
                        {para}
                      </p>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-[#0A1628]/40 italic">
                  No company research notes were generated.
                </p>
              )}
              <p className="mt-5 pt-4 border-t border-[#E8E4DD] text-xs text-[#0A1628]/30 leading-relaxed">
                This brief is derived from the job description text only. Verify details on the company website and LinkedIn before your interview.
              </p>
            </div>
          )}

          {/* ── Print: render all sections ── */}
          <div className="hidden print:block space-y-10 mt-8">
            <div>
              <h2 className="text-lg font-bold mb-4">STAR Stories</h2>
              <div className="space-y-6">
                {prep.starStories.map((story, i) => (
                  <div key={i} className="border border-gray-200 rounded p-4 break-inside-avoid">
                    <p className="font-bold text-sm mb-2">{i + 1}. {story.competency}</p>
                    {story.quantifiedImpact && (
                      <p className="text-xs font-semibold text-green-700 mb-2">{story.quantifiedImpact}</p>
                    )}
                    {STAR_SECTIONS.map(({ key, label }) => (
                      <div key={key} className="mb-2">
                        <p className="text-xs font-bold uppercase">{label}</p>
                        <p className="text-sm">{story[key as keyof StarStory] as string}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="print-break">
              <h2 className="text-lg font-bold mb-4">Likely Questions</h2>
              <div className="space-y-4">
                {prep.likelyQuestions.map((q, i) => (
                  <div key={i} className="border border-gray-200 rounded p-3 break-inside-avoid">
                    <p className="font-bold text-sm mb-1">{i + 1}. {q.question}</p>
                    <p className="text-xs text-gray-500 mb-1">Why asked: {q.rationale}</p>
                    <p className="text-xs"><span className="font-semibold">Framework: </span>{q.suggestedAnswer}</p>
                  </div>
                ))}
              </div>
            </div>

            {prep.companyResearchNotes && (
              <div className="print-break">
                <h2 className="text-lg font-bold mb-3">Company Brief</h2>
                <p className="text-sm whitespace-pre-line">{prep.companyResearchNotes}</p>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="no-print mt-10 pt-6 border-t border-[#E8E4DD] flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-[#0A1628]/30">
              Generated {new Date(prep.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
            <Link
              href={`/evaluations/${prep.evaluationId}`}
              className="text-xs text-[#0EA5E9] hover:underline"
            >
              View full evaluation →
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}
