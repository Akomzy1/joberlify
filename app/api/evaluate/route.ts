import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import anthropic, { CLAUDE_MODELS, CLAUDE_TIMEOUTS } from '@/lib/claude/client'
import { buildEvaluateJobPrompt } from '@/lib/claude/prompts/evaluate-job'
import type { UserProfile } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Parse body ────────────────────────────────────────────────────────────────
  let body: {
    jobTitle: string
    company: string
    jobDescription: string
    salary?: string
    location?: string
    jobUrl?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { jobTitle, company, jobDescription, salary, location, jobUrl } = body

  if (!jobTitle?.trim()) return NextResponse.json({ error: 'jobTitle is required' }, { status: 400 })
  if (!company?.trim()) return NextResponse.json({ error: 'company is required' }, { status: 400 })
  if (!jobDescription?.trim()) return NextResponse.json({ error: 'jobDescription is required' }, { status: 400 })
  if (jobDescription.length > 15_000) {
    return NextResponse.json({ error: 'Job description exceeds 15,000 character limit' }, { status: 400 })
  }

  // ── Load user profile ─────────────────────────────────────────────────────────
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profileData) {
    return NextResponse.json(
      { error: 'Profile not found. Please complete onboarding first.' },
      { status: 404 },
    )
  }

  const userProfile: UserProfile = {
    id: profileData.id,
    userId: profileData.user_id,
    fullName: profileData.full_name,
    nationality: profileData.nationality,
    currentCountry: profileData.current_country,
    currentCity: profileData.current_city,
    targetCountries: profileData.target_countries ?? [],
    targetLocations: profileData.target_locations ?? [],
    remotePreference: profileData.remote_preference ?? 'open',
    willingnessToRelocate: profileData.willingness_to_relocate ?? true,
    maxCommuteMiles: profileData.max_commute_miles ?? null,
    requiresVisaSponsorship: profileData.requires_visa_sponsorship ?? false,
    currentVisaStatus: profileData.current_visa_status ?? null,
    preferredJobTypes: profileData.preferred_job_types ?? [],
    preferredSalaryMin: profileData.preferred_salary_min ?? null,
    preferredSalaryCurrency: profileData.preferred_salary_currency ?? null,
    cvParsedData: profileData.cv_parsed_data ?? null,
    cvUploadedAt: profileData.cv_uploaded_at ?? null,
    cvFileUrl: profileData.raw_cv_url ?? null,
    skills: profileData.skills ?? [],
    qualifications: profileData.qualifications ?? [],
    linkedinUrl: profileData.linkedin_url ?? null,
    createdAt: profileData.created_at,
    updatedAt: profileData.updated_at,
  }

  // Enrich skills from parsed CV if top-level skills are sparse
  if (userProfile.skills.length === 0 && userProfile.cvParsedData?.skills?.length) {
    userProfile.skills = userProfile.cvParsedData.skills.slice(0, 20)
  }

  const includeVisa = userProfile.requiresVisaSponsorship

  // ── Build prompt + call Claude ────────────────────────────────────────────────
  const prompt = buildEvaluateJobPrompt({
    jobTitle: jobTitle.trim(),
    company: company.trim(),
    jobDescription: jobDescription.trim(),
    salary: salary?.trim() || null,
    location: location?.trim() || null,
    userProfile,
    includeVisa,
  })

  let aiResponseText = ''
  try {
    const message = await anthropic.messages.create(
      {
        model: CLAUDE_MODELS.sonnet,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      },
      { timeout: CLAUDE_TIMEOUTS.evaluation },
    )
    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type from Claude')
    aiResponseText = content.text.trim()
  } catch (err) {
    console.error('[evaluate] Claude error:', err)
    return NextResponse.json({ error: 'AI evaluation failed. Please try again.' }, { status: 502 })
  }

  // ── Parse AI JSON ─────────────────────────────────────────────────────────────
  const cleaned = aiResponseText
    .replace(/^```(?:json)?\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    console.error('[evaluate] Invalid JSON from Claude:', cleaned.slice(0, 500))
    return NextResponse.json({ error: 'AI returned an invalid response. Please try again.' }, { status: 502 })
  }

  if (!parsed.scores || !parsed.overall_score || !parsed.grade || !parsed.recommendation || !parsed.evaluation_summary) {
    return NextResponse.json({ error: 'AI evaluation incomplete. Please try again.' }, { status: 502 })
  }

  // ── Map gap_report: snake_case → camelCase ────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let gapReport: any = null
  if (parsed.gap_report) {
    const gr = parsed.gap_report
    gapReport = {
      gaps: (gr.gaps ?? []).map((g: any) => ({
        dimension: g.dimension,
        score: g.score,
        issue: g.issue,
        actionableGuidance: g.actionable_guidance,
        estimatedTimeToClose: g.estimated_time_to_close ?? null,
      })),
      similarRoles: (gr.similar_roles ?? []).map((r: any) => ({
        title: r.title,
        reason: r.reason,
        suggestedSocCode: r.suggested_soc_code ?? undefined,
      })),
      visaAlternatives:
        gr.visa_alternatives && gr.visa_alternatives.length > 0
          ? gr.visa_alternatives.map((va: any) => ({
              socCode: va.soc_code,
              socTitle: va.soc_title,
              reason: va.reason,
              visaRoute: va.visa_route,
            }))
          : undefined,
    }
  }

  const locationMatchRaw = parsed.location_match
  const locationMatch = locationMatchRaw
    ? {
        jobLocation: locationMatchRaw.job_location,
        userTargets: locationMatchRaw.user_targets,
        isMatch: locationMatchRaw.is_match,
        detail: locationMatchRaw.detail,
      }
    : null

  // ── Persist to DB ─────────────────────────────────────────────────────────────
  const { data: evalData, error: evalError } = await supabase
    .from('evaluations')
    .insert({
      user_id: user.id,
      job_url: jobUrl?.trim() || null,
      job_title: jobTitle.trim(),
      company_name: company.trim(),
      location: location?.trim() || null,
      job_description: jobDescription.trim(),
      score_role_match: parsed.scores.role_match,
      score_skills_alignment: parsed.scores.skills_alignment,
      score_experience_level: parsed.scores.experience_level,
      score_growth_trajectory: parsed.scores.growth_trajectory,
      score_culture_fit: parsed.scores.culture_fit,
      score_compensation: parsed.scores.compensation,
      score_location_fit: parsed.scores.location_fit,
      score_company_stage: parsed.scores.company_stage,
      score_role_impact: parsed.scores.role_impact,
      score_long_term_value: parsed.scores.long_term_value,
      score_visa_feasibility: includeVisa ? (parsed.scores.visa_feasibility ?? null) : null,
      overall_score: parsed.overall_score,
      grade: parsed.grade,
      recommendation: parsed.recommendation,
      evaluation_summary: parsed.evaluation_summary,
      gap_report: gapReport,
      growth_roadmap: null,
      requires_visa_sponsorship_at_eval: includeVisa,
    })
    .select('id')
    .single()

  if (evalError) {
    console.error('[evaluate] DB insert error:', evalError.message)
    // Return the result even if we couldn't save — user gets value, we lose persistence
    return NextResponse.json(
      {
        warning: 'Evaluation completed but could not be saved to history.',
        data: buildResponsePayload(null, parsed, gapReport, locationMatch, includeVisa),
      },
      { status: 200 },
    )
  }

  return NextResponse.json(
    { data: buildResponsePayload(evalData.id, parsed, gapReport, locationMatch, includeVisa) },
    { status: 200 },
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildResponsePayload(id: string | null, parsed: any, gapReport: any, locationMatch: any, includeVisa: boolean) {
  return {
    id,
    scores: parsed.scores,
    overallScore: parsed.overall_score,
    grade: parsed.grade,
    recommendation: parsed.recommendation,
    evaluationSummary: parsed.evaluation_summary,
    locationMatch,
    gapReport,
    requiresVisaSponsorship: includeVisa,
  }
}
