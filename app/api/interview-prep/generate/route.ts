import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import anthropic, { CLAUDE_MODELS, CLAUDE_TIMEOUTS } from '@/lib/claude/client'
import {
  INTERVIEW_PREP_SYSTEM_PROMPT,
  buildInterviewPrepPrompt,
  type InterviewPrepAI,
} from '@/lib/claude/prompts/interview-prep'
import { SUBSCRIPTION_LIMITS, SubscriptionTier } from '@/types/subscription'
import type { UserProfile } from '@/types'
import type { JobListing } from '@/types/JobListing'
import type { GapReport } from '@/types/evaluation'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { evaluationId: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { evaluationId } = body
  if (!evaluationId) {
    return NextResponse.json({ error: 'evaluationId is required' }, { status: 400 })
  }

  // ── Load user tier + profile + evaluation in parallel ──
  const [userRow, profileRow, evalRow] = await Promise.all([
    supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single(),
    supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('evaluations')
      .select('*')
      .eq('id', evaluationId)
      .eq('user_id', user.id)
      .single(),
  ])

  if (userRow.error || !userRow.data) {
    return NextResponse.json({ error: 'User account not found.' }, { status: 404 })
  }
  if (profileRow.error || !profileRow.data) {
    return NextResponse.json(
      { error: 'Profile not found. Please complete onboarding first.' },
      { status: 404 },
    )
  }
  if (evalRow.error || !evalRow.data) {
    return NextResponse.json(
      { error: 'Evaluation not found or does not belong to this account.' },
      { status: 404 },
    )
  }

  // ── Tier gate: Pro+ only ──
  const tier = (userRow.data.subscription_tier ?? 'free') as SubscriptionTier
  const limits = SUBSCRIPTION_LIMITS[tier]

  if (!limits.interviewPrep) {
    return NextResponse.json(
      {
        error:
          tier === 'free'
            ? 'Interview preparation requires a Pro subscription. Upgrade to access personalised STAR stories and question coaching.'
            : 'Interview preparation is not available on your current plan.',
        code: 'UPGRADE_REQUIRED',
        tier,
      },
      { status: 403 },
    )
  }

  const pd = profileRow.data
  if (!pd.cv_parsed_data) {
    return NextResponse.json(
      { error: 'Upload your CV first for personalised interview prep.', code: 'CV_REQUIRED' },
      { status: 400 },
    )
  }

  // ── Build user profile ──
  const userProfile: UserProfile = {
    id:                      pd.id,
    userId:                  pd.user_id,
    fullName:                pd.full_name,
    nationality:             pd.nationality,
    currentCountry:          pd.current_country,
    currentCity:             pd.current_city,
    targetCountries:         pd.target_countries ?? [],
    targetLocations:         pd.target_locations ?? [],
    remotePreference:        pd.remote_preference ?? 'open',
    willingnessToRelocate:   pd.willingness_to_relocate ?? true,
    maxCommuteMiles:         pd.max_commute_miles ?? null,
    requiresVisaSponsorship: pd.requires_visa_sponsorship ?? false,
    currentVisaStatus:       pd.current_visa_status ?? null,
    preferredJobTypes:       pd.preferred_job_types ?? [],
    preferredSalaryMin:      pd.preferred_salary_min ?? null,
    preferredSalaryCurrency: pd.preferred_salary_currency ?? null,
    cvParsedData:            pd.cv_parsed_data,
    cvUploadedAt:            pd.cv_uploaded_at ?? null,
    cvFileUrl:               pd.raw_cv_url ?? null,
    skills:                  pd.skills ?? [],
    qualifications:          pd.qualifications ?? [],
    linkedinUrl:             pd.linkedin_url ?? null,
    createdAt:               pd.created_at,
    updatedAt:               pd.updated_at,
  }

  const eval_ = evalRow.data

  const listing: JobListing = {
    jobUrl:              eval_.job_url,
    jobTitle:            eval_.job_title,
    companyName:         eval_.company_name,
    location:            eval_.location,
    salaryText:          null,
    salaryMin:           null,
    salaryMax:           null,
    salaryCurrency:      null,
    description:         eval_.job_description ?? '',
    requirements:        [],
    niceToHaves:         [],
    applicationDeadline: null,
    scrapedAt:           eval_.created_at,
    sourceType:          'pasted',
  }

  // ── Build prompt and call Claude ──
  const userPrompt = buildInterviewPrepPrompt({
    listing,
    userProfile,
    gapReport:    eval_.gap_report as GapReport | null,
    overallScore: eval_.overall_score,
  })

  let aiText = ''
  try {
    const msg = await anthropic.messages.create(
      {
        model:      CLAUDE_MODELS.sonnet,
        max_tokens: 4096,
        system:     INTERVIEW_PREP_SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: userPrompt }],
      },
      { timeout: CLAUDE_TIMEOUTS.evaluation },
    )
    const block = msg.content[0]
    if (block.type !== 'text') throw new Error('Unexpected response type')
    aiText = block.text.trim()
  } catch (err) {
    console.error('[interview-prep/generate] Claude error:', err)
    return NextResponse.json(
      { error: 'Interview prep generation failed. Please try again.' },
      { status: 502 },
    )
  }

  // ── Parse JSON ──
  let ai: InterviewPrepAI
  try {
    const cleaned = aiText
      .replace(/^```(?:json)?\n?/m, '')
      .replace(/\n?```$/m, '')
      .trim()
    ai = JSON.parse(cleaned)
  } catch {
    console.error('[interview-prep/generate] Invalid JSON:', aiText.slice(0, 400))
    return NextResponse.json(
      { error: 'AI returned an invalid response. Please try again.' },
      { status: 502 },
    )
  }

  // ── Normalise to DB/type shape ──
  const starStories = (ai.star_stories ?? []).map((s) => ({
    competency:       s.target_competency,
    situation:        s.situation,
    task:             s.task,
    action:           s.action,
    result:           s.result,
    reflection:       s.reflection,
    quantifiedImpact: s.quantified_impact ?? null,
  }))

  const likelyQuestions = (ai.likely_questions ?? []).map((q) => ({
    question:        q.question,
    rationale:       q.rationale,
    suggestedAnswer: q.suggested_answer,
    difficulty:      q.difficulty,
  }))

  const companyResearchNotes: string = ai.company_research_notes ?? ''

  // ── Persist to DB ──
  const { data: prepRow, error: dbError } = await supabase
    .from('interview_prep')
    .insert({
      user_id:                user.id,
      evaluation_id:          evaluationId,
      pipeline_item_id:       null,
      star_stories:           starStories,
      likely_questions:       likelyQuestions,
      company_research_notes: companyResearchNotes,
    })
    .select('id, created_at')
    .single()

  if (dbError || !prepRow) {
    console.error('[interview-prep/generate] DB insert error:', dbError?.message)
    return NextResponse.json(
      { error: 'Failed to save interview prep. Please try again.' },
      { status: 500 },
    )
  }

  return NextResponse.json(
    {
      data: {
        id:                   prepRow.id,
        evaluationId,
        starStories,
        likelyQuestions,
        companyResearchNotes,
        createdAt:            prepRow.created_at,
        jobTitle:             eval_.job_title,
        companyName:          eval_.company_name,
      },
    },
    { status: 200 },
  )
}
