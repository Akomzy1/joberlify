import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Briefcase, Building2, MapPin, Calendar, ExternalLink, Plus, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvaluationRow {
  id: string
  job_title: string
  company_name: string
  location: string | null
  job_url: string | null
  overall_score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  recommendation: 'apply' | 'consider' | 'not_yet' | 'dont_apply'
  evaluation_summary: string
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GRADE_CONFIG = {
  A: { color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10', border: 'border-[#22C55E]/20' },
  B: { color: 'text-[#0EA5E9]', bg: 'bg-[#0EA5E9]/10', border: 'border-[#0EA5E9]/20' },
  C: { color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20' },
  D: { color: 'text-[#F97316]', bg: 'bg-[#F97316]/10', border: 'border-[#F97316]/20' },
  F: { color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/20' },
}

const RECOMMENDATION_LABELS = {
  apply: 'Apply',
  consider: 'Consider',
  not_yet: 'Not yet',
  dont_apply: "Don't apply",
}

const RECOMMENDATION_COLORS = {
  apply: 'bg-[#22C55E]/10 text-[#22C55E]',
  consider: 'bg-[#F59E0B]/10 text-[#F59E0B]',
  not_yet: 'bg-[#F97316]/10 text-[#F97316]',
  dont_apply: 'bg-[#EF4444]/10 text-[#EF4444]',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function EvaluationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: evaluations, error } = await supabase
    .from('evaluations')
    .select(
      'id, job_title, company_name, location, job_url, overall_score, grade, recommendation, evaluation_summary, created_at',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const rows = (evaluations ?? []) as EvaluationRow[]

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-10 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-[#0A1628] tracking-tight mb-1">
              Evaluations
            </h1>
            <p className="text-[#0A1628]/55 text-base">
              {rows.length > 0
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

        {/* Empty state */}
        {rows.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#E8E4DD] flex items-center justify-center mb-5">
              <Briefcase size={24} className="text-[#0A1628]/30" />
            </div>
            <h2 className="text-lg font-semibold text-[#0A1628] mb-2">No evaluations yet</h2>
            <p className="text-sm text-[#0A1628]/50 max-w-xs mb-8">
              Paste a job description and get an honest 10-dimension AI match score against your profile.
            </p>
            <Link
              href="/evaluate"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0A1628] text-white px-5 py-3 text-sm font-semibold hover:bg-[#0EA5E9] transition-colors"
            >
              <Plus size={15} />
              Evaluate your first role
            </Link>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/5 px-5 py-4 text-sm text-[#EF4444]">
            Failed to load evaluations. Please refresh the page.
          </div>
        )}

        {/* List */}
        {rows.length > 0 && (
          <div className="space-y-3">
            {rows.map((row) => {
              const grade = GRADE_CONFIG[row.grade]
              const date = new Date(row.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })

              return (
                <div
                  key={row.id}
                  className="group bg-white rounded-2xl border border-[#E8E4DD] hover:border-[#0EA5E9]/30 hover:shadow-sm transition-all duration-200 overflow-hidden"
                >
                  <div className="flex items-stretch">
                    {/* Grade sidebar */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-14 flex flex-col items-center justify-center border-r border-[#E8E4DD]',
                        grade.bg,
                      )}
                    >
                      <span className={cn('text-2xl font-bold font-mono', grade.color)}>
                        {row.grade}
                      </span>
                      <span className={cn('text-xs font-mono font-semibold', grade.color)}>
                        {row.overall_score.toFixed(1)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 px-5 py-4 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-[#0A1628] truncate">
                            {row.job_title}
                          </h3>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-[#0A1628]/50">
                              <Building2 size={11} />
                              {row.company_name}
                            </span>
                            {row.location && (
                              <span className="flex items-center gap-1 text-xs text-[#0A1628]/50">
                                <MapPin size={11} />
                                {row.location}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={cn(
                              'text-xs font-semibold px-2.5 py-1 rounded-full',
                              RECOMMENDATION_COLORS[row.recommendation],
                            )}
                          >
                            {RECOMMENDATION_LABELS[row.recommendation]}
                          </span>
                          {row.job_url && (
                            <a
                              href={row.job_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#0A1628]/30 hover:text-[#0EA5E9] transition-colors"
                              title="View original job posting"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-[#0A1628]/50 line-clamp-2 mt-2 leading-relaxed">
                        {row.evaluation_summary}
                      </p>

                      <div className="flex items-center justify-between mt-3">
                        <span className="flex items-center gap-1.5 text-xs text-[#0A1628]/35">
                          <Calendar size={11} />
                          {date}
                        </span>
                        <ChevronRight
                          size={14}
                          className="text-[#0A1628]/25 group-hover:text-[#0EA5E9] transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
