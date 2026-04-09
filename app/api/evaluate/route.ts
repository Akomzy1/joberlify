import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import anthropic, { CLAUDE_MODELS, CLAUDE_TIMEOUTS } from '@/lib/claude/client'
import { EVALUATE_SYSTEM_PROMPT, buildEvaluateJobPrompt } from '@/lib/claude/prompts/evaluate-job'
import { calculateOverallScore, mapGrade, mapRecommendation, validateScores } from '@/lib/evaluation/calculate'
import { SUBSCRIPTION_LIMITS } from '@/types/subscription'
import type { UserProfile } from '@/types'
import type { JobListing } from '@/types/JobListing'
import type { EvaluationDimensions, GapReport } from '@/types/evaluation'

export const runtime = 'nodejs'
export const maxDuration = 60

// ─── Subscription limits ──────────────────────────────────────────────────────

const TIER_UPGRADE_MESSAGES: Record<string, string> = {
  free: 'You have used all 3 free evaluations this month. Upgrade to Pro for 30 evaluations/month.',
  pro: 'You have used all 30 Pro evaluations this month. Upgrade to Global for unlimited evaluations.',
  global: 'Monthly evaluation limit reached. Contact support if you believe this is an error.',
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: {
    jobTitle: string
    company: string
    jobDescription: string
    salary?: string
    location?: string
    jobUrl?: string
    // Full listing can be passed directly from the scraper
    listing?: JobListing
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Accept either a pre-structured JobListing or raw fields
  const listing: JobListing = body.listing ?? {
    jobUrl: body.jobUrl?.trim() || null,
    jobTitle: body.jobTitle?.trim() ?? '',
    companyName: body.company?.trim() ?? '',
    location: body.location?.trim() || null,
    salaryText: body.salary?.trim() || null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    description: body.jobDescription?.trim() ?? '',
    requirements: [],
    niceToHaves: [],
    applicationDeadline: null,
    scrapedAt: new Date().toISOString(),
    sourceType: 'pasted',
  }

  if (!listing.jobTitle) return NextResponse.json({ error: 'jobTitle is required' }, { status: 400 })
  if (!listing.companyName) return NextResponse.json({ error: 'company is required' }, { status: 400 })
  if (!listing.description) return NextResponse.json({ error: 'jobDescription is required' }, { status: 400 })
  if (listing.description.length > 15_000) {
    return NextResponse.json({ error: 'Job description exceeds 15,000 character limit' }, { status: 400 })
  }

  // ── Load user + profile in parallel ──────────────────────────────────────
  const [userRow, profileRow] = await Promise.all([
    supabase.from('users').select('subscription_tier, evaluations_used_this_month').eq('id', user.id).single(),
    supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
  ])

  if (userRow.error || !userRow.data) {
    return NextResponse.json({ error: 'User account not found.' }, { status: 404 })
  }
  if (profileRow.error || !profileRow.data) {
    return NextResponse.json({ error: 'Profile not found. Please complete onboarding first.' }, { status: 404 })
  }

  const tier = (userRow.data.subscription_tier ?? 'free') as 'free' | 'pro' | 'global'
  const limits = SUBSCRIPTION_LIMITS[tier as keyof typeof SUBSCRIPTION_LIMITS]

  // ── Subscription limit check ──────────────────────────────────────────────
  if (limits.evaluationsPerMonth !== 'unlimited') {
    // Count evaluations created this calendar month (more reliable than stored counter)
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('evaluations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString())

    if ((count ?? 0) >= limits.evaluationsPerMonth) {
      return NextResponse.json(
        {
          error: TIER_UPGRADE_MESSAGES[tier] ?? 'Monthly evaluation limit reached.',
          code: 'LIMIT_EXCEEDED',
          tier,
          limit: limits.evaluationsPerMonth,
        },
        { status: 403 },
      )
    }
  }

  // ── Per-minute rate limit (max 10 evaluations/min) ────────────────────────
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString()
  const { count: recentCount } = await supabase
    .from('evaluations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneMinuteAgo)

  if ((recentCount ?? 0) >= 10) {
    return NextResponse.json(
      {
        error: 'Too many requests. You can run up to 10 evaluations per minute — wait a moment and try again.',
        code: 'RATE_LIMITED',
        retryAfter: 60,
      },
      { status: 429 },
    )
  }

  // ── Build user profile ────────────────────────────────────────────────────
  const pd = profileRow.data

  // ── CV check — require CV for personalised scoring ────────────────────────
  if (!pd.cv_parsed_data) {
    return NextResponse.json(
      {
        error: 'Upload your CV first for personalised scoring.',
        code: 'CV_REQUIRED',
      },
      { status: 400 },
    )
  }

  const userProfile: UserProfile = {
    id: pd.id,
    userId: pd.user_id,
    fullName: pd.full_name,
    nationality: pd.nationality,
    currentCountry: pd.current_country,
    currentCity: pd.current_city,
    targetCountries: pd.target_countries ?? [],
    targetLocations: pd.target_locations ?? [],
    remotePreference: pd.remote_preference ?? 'open',
    willingnessToRelocate: pd.willingness_to_relocate ?? true,
    maxCommuteMiles: pd.max_commute_miles ?? null,
    requiresVisaSponsorship: pd.requires_visa_sponsorship ?? false,
    currentVisaStatus: pd.current_visa_status ?? null,
    preferredJobTypes: pd.preferred_job_types ?? [],
    preferredSalaryMin: pd.preferred_salary_min ?? null,
    preferredSalaryCurrency: pd.preferred_salary_currency ?? null,
    cvParsedData: pd.cv_parsed_data,
    cvUploadedAt: pd.cv_uploaded_at ?? null,
    cvFileUrl: pd.raw_cv_url ?? null,
    skills: pd.skills ?? [],
    qualifications: pd.qualifications ?? [],
    linkedinUrl: pd.linkedin_url ?? null,
    createdAt: pd.created_at,
    updatedAt: pd.updated_at,
  }

  // Enrich top-level skills from CV if sparse
  if (userProfile.skills.length === 0) {
    userProfile.skills = userProfile.cvParsedData?.skills?.slice(0, 25) ?? []
  }

  const includeVisa = userProfile.requiresVisaSponsorship

  // ── Build prompt and call Claude ──────────────────────────────────────────
  const userPrompt = buildEvaluateJobPrompt({ listing, userProfile, includeVisa })

  let aiResponseText = ''
  try {
    const message = await anthropic.messages.create(
      {
        model: CLAUDE_MODELS.sonnet,
        max_tokens: 4096,
        system: EVALUATE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      },
      { timeout: CLAUDE_TIMEOUTS.evaluation },
    )
    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type from Claude')
    aiResponseText = content.text.trim()
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.name === 'APITimeoutError' ||
        err.name === 'AbortError' ||
        err.message.toLowerCase().includes('timeout'))
    console.error('[evaluate] Claude error:', {
      name: err instanceof Error ? err.name : 'unknown',
      message: err instanceof Error ? err.message : String(err),
    })
    if (isTimeout) {
      return NextResponse.json(
        {
          error: 'The evaluation is taking longer than usual. Please try again.',
          code: 'TIMEOUT',
        },
        { status: 504 },
      )
    }
    return NextResponse.json(
      { error: 'AI evaluation temporarily unavailable. Please try again in a moment.' },
      { status: 502 },
    )
  }

  // ── Parse AI JSON ─────────────────────────────────────────────────────────
  const cleaned = aiResponseText
    .replace(/^```(?:json)?\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ai: any
  try {
    ai = JSON.parse(cleaned)
  } catch {
    console.error('[evaluate] Invalid JSON from Claude:', cleaned.slice(0, 500))
    return NextResponse.json({ error: 'AI returned an invalid response. Please try again.' }, { status: 502 })
  }

  // ── Validate scores ───────────────────────────────────────────────────────
  if (!ai.scores) {
    return NextResponse.json({ error: 'AI evaluation incomplete (missing scores). Please try again.' }, { status: 502 })
  }

  const scoreError = validateScores(ai.scores)
  if (scoreError) {
    console.error('[evaluate] Score validation failed:', scoreError)
    return NextResponse.json({ error: 'AI evaluation incomplete. Please try again.' }, { status: 502 })
  }

  // ── Recalculate server-side (don't blindly trust AI arithmetic) ────────────
  const scores = ai.scores as EvaluationDimensions
  const overallScore = calculateOverallScore(scores)
  const grade = mapGrade(overallScore)
  const gatePassFailed = scores.role_match < 2.0 || scores.skills_alignment < 2.0
  const recommendation = mapRecommendation(overallScore, {
    visaFeasibility: includeVisa ? scores.visa_feasibility : null,
    gatePassFailed,
  })

  // ── Build gap report (store in camelCase for TypeScript consumers) ─────────
  const gapReport: GapReport = {
    gaps: (ai.gaps ?? []).map((g: any) => ({
      dimension: g.dimension,
      score: scores[g.dimension as keyof EvaluationDimensions] ?? g.score,
      gap: g.gap ?? g.issue ?? '',
      guidance: g.guidance ?? g.actionable_guidance ?? '',
      estimatedTimeToClose: g.estimated_time_to_close ?? null,
    })),
    strengths: Array.isArray(ai.strengths) ? ai.strengths.map(String) : [],
    similarRolesToSearch: Array.isArray(ai.similar_roles_to_search)
      ? ai.similar_roles_to_search.map(String)
      : [],
    visaAlternatives:
      includeVisa && Array.isArray(ai.visa_alternatives) && ai.visa_alternatives.length > 0
        ? ai.visa_alternatives.map((va: any) => ({
            socCode: va.soc_code,
            socTitle: va.soc_title,
            reason: va.reason,
            visaRoute: va.visa_route,
          }))
        : undefined,
  }

  const locationMatch = ai.location_match
    ? {
        jobLocation: String(ai.location_match.job_location ?? ''),
        userTargets: String(ai.location_match.user_targets ?? ''),
        isMatch: Boolean(ai.location_match.is_match),
        detail: String(ai.location_match.detail ?? ''),
      }
    : null

  const evaluationSummary: string = ai.summary ?? ai.evaluation_summary ?? ''

  // ── Persist to DB ─────────────────────────────────────────────────────────
  const { data: evalRow, error: evalError } = await supabase
    .from('evaluations')
    .insert({
      user_id: user.id,
      job_url: listing.jobUrl,
      job_title: listing.jobTitle,
      company_name: listing.companyName,
      location: listing.location,
      job_description: listing.description,
      score_role_match: scores.role_match,
      score_skills_alignment: scores.skills_alignment,
      score_experience_level: scores.experience_level,
      score_growth_trajectory: scores.growth_trajectory,
      score_culture_fit: scores.culture_fit,
      score_compensation: scores.compensation,
      score_location_fit: scores.location_fit,
      score_company_stage: scores.company_stage,
      score_role_impact: scores.role_impact,
      score_long_term_value: scores.long_term_value,
      score_visa_feasibility: includeVisa ? (scores.visa_feasibility ?? null) : null,
      overall_score: overallScore,
      grade,
      recommendation,
      evaluation_summary: evaluationSummary,
      gap_report: gapReport,
      growth_roadmap: null,
      requires_visa_sponsorship_at_eval: includeVisa,
    })
    .select('id')
    .single()

  // Increment usage counter (non-blocking — fire and forget)
  supabase
    .from('users')
    .update({ evaluations_used_this_month: (userRow.data.evaluations_used_this_month ?? 0) + 1 })
    .eq('id', user.id)
    .then(() => {})

  if (evalError) {
    console.error('[evaluate] DB insert error:', evalError.message)
    return NextResponse.json(
      {
        warning: 'Evaluation completed but could not be saved to history.',
        data: buildPayload(null, scores, overallScore, grade, recommendation, evaluationSummary, gapReport, locationMatch, includeVisa),
      },
      { status: 200 },
    )
  }

  return NextResponse.json(
    { data: buildPayload(evalRow.id, scores, overallScore, grade, recommendation, evaluationSummary, gapReport, locationMatch, includeVisa) },
    { status: 200 },
  )
}

// ─── Response payload ─────────────────────────────────────────────────────────

function buildPayload(
  id: string | null,
  scores: EvaluationDimensions,
  overallScore: number,
  grade: string,
  recommendation: string,
  evaluationSummary: string,
  gapReport: GapReport,
  locationMatch: { jobLocation: string; userTargets: string; isMatch: boolean; detail: string } | null,
  requiresVisaSponsorship: boolean,
) {
  return {
    id,
    scores,
    overallScore,
    grade,
    recommendation,
    evaluationSummary,
    gapReport,
    locationMatch,
    requiresVisaSponsorship,
  }
}
