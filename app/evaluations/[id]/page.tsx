import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { MapPin, ArrowLeft, CheckCircle2, TrendingUp, ArrowRight, AlertCircle, Calendar, Building2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { GapReport } from '@/components/evaluation/GapReport'
import type { GapReport as GapReportType, GrowthRoadmapItem } from '@/types/evaluation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvaluationRow {
  id: string
  job_title: string
  company_name: string
  location: string | null
  job_url: string | null
  salary_advertised: number | null
  overall_score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  recommendation: 'apply' | 'consider' | 'not_yet' | 'dont_apply'
  evaluation_summary: string
  score_role_match: number
  score_skills_alignment: number
  score_experience_level: number
  score_growth_trajectory: number
  score_culture_fit: number
  score_compensation: number
  score_location_fit: number
  score_company_stage: number
  score_role_impact: number
  score_long_term_value: number
  score_visa_feasibility: number | null
  gap_report: GapReportType | null
  growth_roadmap: GrowthRoadmapItem[] | null
  requires_visa_sponsorship_at_eval: boolean
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GRADE_CONFIG = {
  A: { color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10', border: 'border-[#22C55E]/20', label: 'Excellent match' },
  B: { color: 'text-[#0EA5E9]', bg: 'bg-[#0EA5E9]/10', border: 'border-[#0EA5E9]/20', label: 'Strong match' },
  C: { color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20', label: 'Moderate match' },
  D: { color: 'text-[#F97316]', bg: 'bg-[#F97316]/10', border: 'border-[#F97316]/20', label: 'Weak match' },
  F: { color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/20', label: 'Poor match' },
}

const RECOMMENDATION_CONFIG = {
  apply: { label: 'Apply now', color: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20', icon: CheckCircle2 },
  consider: { label: 'Worth considering', color: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20', icon: TrendingUp },
  not_yet: { label: 'Not yet ready', color: 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20', icon: ArrowRight },
  dont_apply: { label: "Don't apply", color: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20', icon: AlertCircle },
}

const DIMENSION_LABELS: Record<string, string> = {
  role_match: 'Role Match',
  skills_alignment: 'Skills Alignment',
  experience_level: 'Experience Level',
  growth_trajectory: 'Growth Trajectory',
  culture_fit: 'Culture Fit',
  compensation: 'Compensation',
  location_fit: 'Location Fit',
  company_stage: 'Company Stage',
  role_impact: 'Role Impact',
  long_term_value: 'Long-term Value',
}

const DIMENSION_KEYS = [
  'role_match', 'skills_alignment', 'experience_level', 'growth_trajectory',
  'culture_fit', 'compensation', 'location_fit', 'company_stage',
  'role_impact', 'long_term_value',
] as const

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const pct = ((score - 1) / 4) * 100
  const color =
    score >= 4.0 ? 'bg-[#22C55E]'
    : score >= 3.0 ? 'bg-[#F59E0B]'
    : 'bg-[#EF4444]'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-[#E8E4DD] rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono font-semibold text-[#0A1628] w-7 text-right">
        {score.toFixed(1)}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function EvaluationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) notFound()

  const row = data as EvaluationRow
  const grade = GRADE_CONFIG[row.grade]
  const rec = RECOMMENDATION_CONFIG[row.recommendation]
  const RecIcon = rec.icon

  const scores: Record<string, number> = {
    role_match: row.score_role_match,
    skills_alignment: row.score_skills_alignment,
    experience_level: row.score_experience_level,
    growth_trajectory: row.score_growth_trajectory,
    culture_fit: row.score_culture_fit,
    compensation: row.score_compensation,
    location_fit: row.score_location_fit,
    company_stage: row.score_company_stage,
    role_impact: row.score_role_impact,
    long_term_value: row.score_long_term_value,
  }

  const date = new Date(row.created_at).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:px-6">

        {/* ── Back nav ── */}
        <Link
          href="/evaluations"
          className="inline-flex items-center gap-1.5 text-sm text-[#0A1628]/50 hover:text-[#0A1628] transition-colors mb-8 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          All evaluations
        </Link>

        {/* ── Job identity ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0A1628] tracking-tight mb-1">
            {row.job_title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-[#0A1628]/50 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Building2 size={13} />
              {row.company_name}
            </span>
            {row.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={13} />
                {row.location}
              </span>
            )}
            {row.job_url && (
              <a
                href={row.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-[#0EA5E9] transition-colors"
              >
                <ExternalLink size={13} />
                View posting
              </a>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar size={13} />
              {date}
            </span>
          </div>
        </div>

        {/* ── Grade + summary card ── */}
        <div className={cn('bg-white rounded-2xl border p-6 mb-5', grade.border)}>
          <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
            <div className="flex items-center gap-4">
              <div className={cn('w-16 h-16 rounded-2xl border-2 flex items-center justify-center flex-shrink-0', grade.bg, grade.border)}>
                <span className={cn('text-3xl font-bold font-mono', grade.color)}>{row.grade}</span>
              </div>
              <div>
                <p className={cn('text-sm font-semibold mb-0.5', grade.color)}>{grade.label}</p>
                <p className="text-2xl font-bold text-[#0A1628] font-mono">
                  {row.overall_score.toFixed(1)}
                  <span className="text-sm font-normal text-[#0A1628]/40 ml-1">/ 5.0</span>
                </p>
              </div>
            </div>

            <span className={cn('inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border', rec.color)}>
              <RecIcon size={14} />
              {rec.label}
            </span>
          </div>

          <p className="text-sm text-[#0A1628]/70 leading-relaxed border-t border-[#E8E4DD] pt-4">
            {row.evaluation_summary}
          </p>
        </div>

        {/* ── Score breakdown ── */}
        <div className="bg-white rounded-2xl border border-[#E8E4DD] p-6 mb-5">
          <h2 className="text-xs font-semibold text-[#0A1628]/40 uppercase tracking-widest mb-5">
            Score breakdown
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
            {DIMENSION_KEYS.map((key) => (
              <div key={key}>
                <p className="text-xs text-[#0A1628]/50 mb-1">{DIMENSION_LABELS[key]}</p>
                <ScoreBar score={scores[key]} />
              </div>
            ))}
          </div>

          {/* Visa dimension */}
          {row.requires_visa_sponsorship_at_eval && row.score_visa_feasibility !== null && (
            <div className="mt-4 pt-4 border-t border-[#E8E4DD]">
              <p className="text-xs text-[#0A1628]/50 mb-1">Visa Feasibility</p>
              <ScoreBar score={row.score_visa_feasibility} />
            </div>
          )}
        </div>

        {/* ── Gap report ── */}
        {row.gap_report && (
          <div className="bg-white rounded-2xl border border-[#E8E4DD] p-6 mb-5">
            <h2 className="text-xs font-semibold text-[#0A1628]/40 uppercase tracking-widest mb-5">
              Gap analysis &amp; guidance
            </h2>
            <GapReport
              gapReport={row.gap_report}
              locationFitScore={row.score_location_fit}
              growthRoadmap={row.growth_roadmap ?? null}
            />
          </div>
        )}

        {/* ── CTA ── */}
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/evaluate"
            className="flex-1 min-w-[160px] flex items-center justify-center gap-2 rounded-xl border border-[#E8E4DD] bg-white px-5 py-3 text-sm font-medium text-[#0A1628]/60 hover:text-[#0A1628] hover:border-[#0EA5E9]/40 transition-colors"
          >
            Evaluate another role
          </Link>
          <Link
            href="/evaluations"
            className="flex-1 min-w-[160px] flex items-center justify-center gap-2 rounded-xl bg-[#0A1628] text-white px-5 py-3 text-sm font-semibold hover:bg-[#0EA5E9] transition-colors"
          >
            All evaluations
          </Link>
        </div>
      </div>
    </div>
  )
}
