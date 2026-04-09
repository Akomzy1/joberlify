import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
} from 'lucide-react'
import { ScoreCard } from '@/components/evaluation/ScoreCard'
import { EvaluationSummary } from '@/components/evaluation/EvaluationSummary'
import { GapReport } from '@/components/evaluation/GapReport'

// Lazy-load the SVG radar chart — canvas-based, no value in SSR
const RadarChart = dynamic(
  () => import('@/components/evaluation/RadarChart').then((m) => m.RadarChart),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-square max-w-[320px] mx-auto rounded-2xl bg-[#E8E4DD]/30 animate-pulse" />
    ),
  },
)
import type { GapReport as GapReportType, EvaluationDimensions, GrowthRoadmapItem } from '@/types/evaluation'

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

// ─── Fade-in-up wrapper (CSS-only, no JS needed) ──────────────────────────────

function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        animation: `fadeInUp 400ms ease-out ${delay}ms both`,
      }}
    >
      {children}
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) notFound()

  const row = data as EvaluationRow

  const scores: EvaluationDimensions = {
    role_match:        row.score_role_match,
    skills_alignment:  row.score_skills_alignment,
    experience_level:  row.score_experience_level,
    growth_trajectory: row.score_growth_trajectory,
    culture_fit:       row.score_culture_fit,
    compensation:      row.score_compensation,
    location_fit:      row.score_location_fit,
    company_stage:     row.score_company_stage,
    role_impact:       row.score_role_impact,
    long_term_value:   row.score_long_term_value,
    ...(row.requires_visa_sponsorship_at_eval && row.score_visa_feasibility !== null
      ? { visa_feasibility: row.score_visa_feasibility }
      : {}),
  }

  const date = new Date(row.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // gap_report.location_match is stored at evaluation time via AI
  // We surface it from gap_report if present, falling back to null
  const locationMatch =
    (row.gap_report as any)?.locationMatch ??
    (row.gap_report as any)?.location_match ??
    null

  return (
    <>
      {/* CSS animations (inline so they work without a global stylesheet change) */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="min-h-screen bg-[#FAFAF8]">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6">

          {/* ── Back nav ── */}
          <FadeUp delay={0}>
            <Link
              href="/evaluations"
              className="inline-flex items-center gap-1.5 text-sm text-[#0A1628]/45 hover:text-[#0A1628] transition-colors mb-8 group"
            >
              <ArrowLeft
                size={14}
                className="group-hover:-translate-x-0.5 transition-transform"
              />
              All evaluations
            </Link>
          </FadeUp>

          {/* ── Job identity ── */}
          <FadeUp delay={50}>
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0A1628] tracking-tight mb-2">
                {row.job_title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-[#0A1628]/45 flex-wrap">
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
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {date}
                </span>
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
              </div>
            </div>
          </FadeUp>

          {/* ── Score card (hero) ── */}
          <FadeUp delay={100} className="mb-5">
            <ScoreCard
              grade={row.grade}
              overallScore={row.overall_score}
              recommendation={row.recommendation}
              requiresVisaSponsorship={row.requires_visa_sponsorship_at_eval}
              visaFeasibilityScore={row.score_visa_feasibility}
            />
          </FadeUp>

          {/* ── Two-column: radar + summary ── */}
          <FadeUp delay={200} className="mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-[55%_1fr] gap-5">

              {/* Radar chart */}
              <div className="bg-white rounded-2xl border border-[#E8E4DD] p-6">
                <h2 className="text-xs font-semibold text-[#0A1628]/40 uppercase tracking-widest mb-5">
                  Score breakdown
                </h2>
                <RadarChart
                  scores={scores}
                  visaFeasibilityScore={
                    row.requires_visa_sponsorship_at_eval
                      ? row.score_visa_feasibility
                      : null
                  }
                />
              </div>

              {/* Summary */}
              <div className="bg-white rounded-2xl border border-[#E8E4DD] p-6">
                <h2 className="text-xs font-semibold text-[#0A1628]/40 uppercase tracking-widest mb-5">
                  Analysis
                </h2>
                <EvaluationSummary summary={row.evaluation_summary} />
              </div>
            </div>
          </FadeUp>

          {/* ── Gap report ── */}
          {row.gap_report && (
            <FadeUp delay={300} className="mb-5">
              <div className="bg-white rounded-2xl border border-[#E8E4DD] p-6">
                <h2 className="text-xs font-semibold text-[#0A1628]/40 uppercase tracking-widest mb-5">
                  Gap analysis &amp; guidance
                </h2>
                <GapReport
                  gapReport={row.gap_report}
                  locationMatch={locationMatch}
                  locationFitScore={row.score_location_fit}
                  growthRoadmap={row.growth_roadmap ?? null}
                />
              </div>
            </FadeUp>
          )}

          {/* ── CTAs ── */}
          <FadeUp delay={350}>
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
          </FadeUp>

        </div>

        {/* ── Sticky mobile action bar ── */}
        <div className="fixed bottom-0 left-0 right-0 z-20 sm:hidden border-t border-[#E8E4DD] bg-white/95 backdrop-blur-sm px-4 py-3 flex gap-2">
          <Link
            href="/evaluate"
            className="flex-1 text-center rounded-lg border border-[#E8E4DD] px-4 py-2.5 text-sm font-medium text-[#0A1628]/60 hover:text-[#0A1628] transition-colors"
          >
            New evaluation
          </Link>
          <Link
            href="/evaluations"
            className="flex-1 text-center rounded-lg bg-[#0A1628] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#0EA5E9] transition-colors"
          >
            All evaluations
          </Link>
        </div>

        {/* Bottom padding for mobile sticky bar */}
        <div className="h-20 sm:hidden" />
      </div>
    </>
  )
}
