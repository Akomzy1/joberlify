'use client'

import { useState, useRef } from 'react'
import { Briefcase, Building2, MapPin, DollarSign, Link2, ChevronDown, ChevronUp, Loader2, AlertCircle, CheckCircle2, TrendingUp, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { GapReport } from '@/components/evaluation/GapReport'
import type { GapReport as GapReportType, GrowthRoadmapItem } from '@/types/evaluation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvaluationResult {
  id: string | null
  scores: Record<string, number>
  overallScore: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  recommendation: 'apply' | 'consider' | 'not_yet' | 'dont_apply'
  evaluationSummary: string
  locationMatch: {
    jobLocation: string
    userTargets: string
    isMatch: boolean
    detail: string
  } | null
  gapReport: GapReportType | null
  requiresVisaSponsorship: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

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
  visa_feasibility: 'Visa Feasibility',
}

const DIMENSION_ORDER = [
  'role_match',
  'skills_alignment',
  'experience_level',
  'growth_trajectory',
  'culture_fit',
  'compensation',
  'location_fit',
  'company_stage',
  'role_impact',
  'long_term_value',
]

const GRADE_CONFIG = {
  A: { color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10', border: 'border-[#22C55E]/20', label: 'Excellent match' },
  B: { color: 'text-[#0EA5E9]', bg: 'bg-[#0EA5E9]/10', border: 'border-[#0EA5E9]/20', label: 'Strong match' },
  C: { color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20', label: 'Moderate match' },
  D: { color: 'text-[#F97316]', bg: 'bg-[#F97316]/10', border: 'border-[#F97316]/20', label: 'Weak match' },
  F: { color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/20', label: 'Poor match' },
}

const RECOMMENDATION_CONFIG = {
  apply: { label: 'Apply now', color: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20' },
  consider: { label: 'Worth considering', color: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20' },
  not_yet: { label: 'Not yet ready', color: 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20' },
  dont_apply: { label: "Don't apply", color: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20' },
}

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
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono font-semibold text-[#0A1628] w-7 text-right">
        {score.toFixed(1)}
      </span>
    </div>
  )
}

function FormField({
  label,
  icon: Icon,
  required,
  children,
}: {
  label: string
  icon: React.ElementType
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-[#0A1628]">
        <Icon size={13} className="text-[#0A1628]/40" />
        {label}
        {required && <span className="text-[#EF4444] text-xs">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-[#E8E4DD] bg-white px-3.5 py-2.5 text-sm text-[#0A1628] placeholder:text-[#0A1628]/30 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/40 focus:border-[#0EA5E9] transition-colors'

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EvaluatePage() {
  // Form state
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [location, setLocation] = useState('')
  const [salary, setSalary] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [showOptional, setShowOptional] = useState(false)

  // Evaluation state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EvaluationResult | null>(null)

  const resultsRef = useRef<HTMLDivElement>(null)

  const canSubmit = jobTitle.trim() && company.trim() && jobDescription.trim().length >= 100

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || loading) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: jobTitle.trim(),
          company: company.trim(),
          jobDescription: jobDescription.trim(),
          location: location.trim() || undefined,
          salary: salary.trim() || undefined,
          jobUrl: jobUrl.trim() || undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Evaluation failed. Please try again.')
        return
      }

      setResult(json.data)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const grade = result ? GRADE_CONFIG[result.grade] : null
  const rec = result ? RECOMMENDATION_CONFIG[result.recommendation] : null

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6">

        {/* ── Header ── */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-[#0EA5E9]/5 border border-[#0EA5E9]/15 text-[#0EA5E9] text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wide">
            <Sparkles size={11} />
            AI Evaluation Engine
          </div>
          <h1 className="text-3xl font-bold text-[#0A1628] tracking-tight mb-2">
            Evaluate a Job
          </h1>
          <p className="text-[#0A1628]/55 text-base">
            Paste the job description and get a 10-dimension honest match score against your profile.
          </p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl border border-[#E8E4DD] p-6 space-y-5">
            <h2 className="text-sm font-semibold text-[#0A1628] uppercase tracking-wide">Job details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="Job title" icon={Briefcase} required>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Product Manager"
                  className={inputCls}
                  required
                />
              </FormField>

              <FormField label="Company" icon={Building2} required>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripe"
                  className={inputCls}
                  required
                />
              </FormField>
            </div>

            <FormField label="Job description" icon={Briefcase} required>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here. Include responsibilities, requirements, and any details about the role and company..."
                rows={10}
                className={cn(inputCls, 'resize-y min-h-[220px]')}
                required
              />
              <div className="flex justify-between text-xs text-[#0A1628]/35 mt-1">
                <span>{jobDescription.length < 100 ? `${100 - jobDescription.length} more characters needed` : 'Ready to evaluate'}</span>
                <span>{jobDescription.length.toLocaleString()} / 15,000</span>
              </div>
            </FormField>
          </div>

          {/* Optional fields */}
          <div className="bg-white rounded-2xl border border-[#E8E4DD] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowOptional((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-[#0A1628]/60 hover:text-[#0A1628] hover:bg-[#FAFAF8] transition-colors"
            >
              <span>Optional details (location, salary, job URL)</span>
              {showOptional ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {showOptional && (
              <div className="px-6 pb-6 space-y-5 border-t border-[#E8E4DD] pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Location" icon={MapPin}>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. London, UK / Remote"
                      className={inputCls}
                    />
                  </FormField>

                  <FormField label="Salary / compensation" icon={DollarSign}>
                    <input
                      type="text"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="e.g. £65,000–£80,000"
                      className={inputCls}
                    />
                  </FormField>
                </div>

                <FormField label="Job URL" icon={Link2}>
                  <input
                    type="url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://..."
                    className={inputCls}
                  />
                </FormField>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/5 px-4 py-3">
              <AlertCircle size={16} className="text-[#EF4444] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#EF4444]">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className={cn(
              'w-full flex items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-200',
              canSubmit && !loading
                ? 'bg-[#0A1628] text-white hover:bg-[#0EA5E9] shadow-sm hover:shadow-md'
                : 'bg-[#E8E4DD] text-[#0A1628]/30 cursor-not-allowed',
            )}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Evaluating with AI…
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Evaluate this role
              </>
            )}
          </button>
        </form>

        {/* ── Loading state ── */}
        {loading && (
          <div className="mt-10 space-y-4">
            <div className="bg-white rounded-2xl border border-[#E8E4DD] p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-[#E8E4DD] animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#E8E4DD] rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-[#E8E4DD] rounded animate-pulse w-1/2" />
                </div>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-3 bg-[#E8E4DD] rounded animate-pulse w-28" />
                    <div className="flex-1 h-1.5 bg-[#E8E4DD] rounded animate-pulse" />
                    <div className="h-3 bg-[#E8E4DD] rounded animate-pulse w-8" />
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-xs text-[#0A1628]/40">
              Running 10-dimension AI analysis…
            </p>
          </div>
        )}

        {/* ── Results ── */}
        {result && !loading && (
          <div ref={resultsRef} className="mt-10 space-y-6">

            {/* Header card */}
            <div className={cn(
              'bg-white rounded-2xl border p-6',
              grade?.border ?? 'border-[#E8E4DD]',
            )}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  {/* Grade badge */}
                  <div className={cn(
                    'w-16 h-16 rounded-2xl border-2 flex items-center justify-center flex-shrink-0',
                    grade?.bg,
                    grade?.border,
                  )}>
                    <span className={cn('text-3xl font-bold font-mono', grade?.color)}>
                      {result.grade}
                    </span>
                  </div>
                  <div>
                    <p className={cn('text-sm font-semibold mb-0.5', grade?.color)}>
                      {grade?.label}
                    </p>
                    <p className="text-2xl font-bold text-[#0A1628] font-mono">
                      {result.overallScore.toFixed(1)}
                      <span className="text-sm font-normal text-[#0A1628]/40 ml-1">/ 5.0</span>
                    </p>
                  </div>
                </div>

                {/* Recommendation pill */}
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border',
                  rec?.color,
                )}>
                  {result.recommendation === 'apply' && <CheckCircle2 size={14} />}
                  {result.recommendation === 'consider' && <TrendingUp size={14} />}
                  {result.recommendation === 'not_yet' && <ArrowRight size={14} />}
                  {result.recommendation === 'dont_apply' && <AlertCircle size={14} />}
                  {rec?.label}
                </span>
              </div>

              {/* Summary */}
              <p className="mt-5 text-sm text-[#0A1628]/70 leading-relaxed border-t border-[#E8E4DD] pt-4">
                {result.evaluationSummary}
              </p>
            </div>

            {/* Dimension scores */}
            <div className="bg-white rounded-2xl border border-[#E8E4DD] p-6">
              <h2 className="text-sm font-semibold text-[#0A1628] uppercase tracking-wide mb-5">
                Score breakdown
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
                {DIMENSION_ORDER.map((key) => {
                  const score = result.scores[key]
                  if (score === undefined) return null
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#0A1628]/60">
                          {DIMENSION_LABELS[key]}
                        </span>
                      </div>
                      <ScoreBar score={score} />
                    </div>
                  )
                })}
                {result.requiresVisaSponsorship && result.scores.visa_feasibility !== undefined && (
                  <div className="sm:col-span-2">
                    <div className="h-px bg-[#E8E4DD] my-1" />
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#0A1628]/60">
                          {DIMENSION_LABELS['visa_feasibility']}
                        </span>
                      </div>
                      <ScoreBar score={result.scores.visa_feasibility} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location match */}
            {result.locationMatch && (
              <div className={cn(
                'rounded-2xl border p-5 space-y-1',
                result.locationMatch.isMatch
                  ? 'bg-[#22C55E]/5 border-[#22C55E]/20'
                  : 'bg-[#F97316]/5 border-[#F97316]/20',
              )}>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className={result.locationMatch.isMatch ? 'text-[#22C55E]' : 'text-[#F97316]'} />
                  <span className="text-sm font-semibold text-[#0A1628]">Location</span>
                  <span className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                    result.locationMatch.isMatch ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#F97316]/10 text-[#F97316]',
                  )}>
                    {result.locationMatch.isMatch ? 'Match' : 'Mismatch'}
                  </span>
                </div>
                <p className="text-xs text-[#0A1628]/60 pl-5">{result.locationMatch.detail}</p>
              </div>
            )}

            {/* Gap report */}
            {result.gapReport && (
              <div className="bg-white rounded-2xl border border-[#E8E4DD] p-6">
                <h2 className="text-sm font-semibold text-[#0A1628] uppercase tracking-wide mb-5">
                  Gap analysis &amp; guidance
                </h2>
                <GapReport
                  gapReport={result.gapReport}
                  locationMatch={result.locationMatch ? {
                    jobLocation: result.locationMatch.jobLocation,
                    userTargets: result.locationMatch.userTargets,
                    isMatch: result.locationMatch.isMatch,
                    detail: result.locationMatch.detail,
                  } : null}
                  locationFitScore={result.scores['location_fit']}
                />
              </div>
            )}

            {/* Re-evaluate button */}
            <button
              type="button"
              onClick={() => {
                setResult(null)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="w-full rounded-xl border border-[#E8E4DD] bg-white px-6 py-3 text-sm font-medium text-[#0A1628]/60 hover:text-[#0A1628] hover:border-[#0EA5E9]/40 transition-colors"
            >
              Evaluate another role
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
