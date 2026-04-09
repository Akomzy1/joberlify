import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import anthropic, { CLAUDE_MODELS, CLAUDE_TIMEOUTS } from '@/lib/claude/client'
import {
  GENERATE_CV_SYSTEM_PROMPT,
  buildGenerateCvPrompt,
  type CvTargetFormat,
  type GeneratedCvData,
} from '@/lib/claude/prompts/generate-cv'
import { renderCvHtml } from '@/lib/pdf/cv-templates'
import { generateAndStoreCvPdf } from '@/lib/pdf/generate-cv-pdf'
import { SUBSCRIPTION_LIMITS, SubscriptionTier } from '@/types/subscription'
import type { UserProfile } from '@/types'
import type { JobListing } from '@/types/JobListing'
import type { GapReport } from '@/types/evaluation'

export const runtime = 'nodejs'
export const maxDuration = 60

// ─── Tier limits ──────────────────────────────────────────────────────────────

const TIER_UPGRADE_MESSAGES: Record<string, string> = {
  free: 'CV generation requires a Pro subscription. Upgrade to generate tailored CVs.',
  pro:  'You have used all 10 CV generations this month. Upgrade to Global for unlimited CVs.',
  global: 'Monthly CV generation limit reached. Contact support if this is an error.',
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Parse body ──
  let body: {
    evaluationId: string
    format?: CvTargetFormat
    emphasis?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { evaluationId, format = 'uk', emphasis } = body

  if (!evaluationId) {
    return NextResponse.json({ error: 'evaluationId is required' }, { status: 400 })
  }
  if (!['uk', 'us', 'generic'].includes(format)) {
    return NextResponse.json({ error: 'format must be uk, us, or generic' }, { status: 400 })
  }

  // ── Load user tier + profile in parallel ──
  const [userRow, profileRow, evalRow] = await Promise.all([
    supabase
      .from('users')
      .select('subscription_tier, cvs_generated_this_month')
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

  const tier = (userRow.data.subscription_tier ?? 'free') as SubscriptionTier
  const limits = SUBSCRIPTION_LIMITS[tier]

  // ── Tier gate ──
  if (limits.tailoredCvsPerMonth === 0) {
    return NextResponse.json(
      { error: TIER_UPGRADE_MESSAGES[tier], code: 'UPGRADE_REQUIRED', tier },
      { status: 403 },
    )
  }

  // ── Monthly limit check ──
  if (limits.tailoredCvsPerMonth !== 'unlimited') {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('generated_cvs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString())

    if ((count ?? 0) >= limits.tailoredCvsPerMonth) {
      return NextResponse.json(
        {
          error:  TIER_UPGRADE_MESSAGES[tier],
          code:   'LIMIT_EXCEEDED',
          tier,
          limit:  limits.tailoredCvsPerMonth,
        },
        { status: 403 },
      )
    }
  }

  // ── CV check ──
  const pd = profileRow.data
  if (!pd.cv_parsed_data) {
    return NextResponse.json(
      { error: 'Upload your CV first before generating a tailored version.', code: 'CV_REQUIRED' },
      { status: 400 },
    )
  }

  // ── Build user profile object ──
  const userProfile: UserProfile = {
    id:                     pd.id,
    userId:                 pd.user_id,
    fullName:               pd.full_name,
    nationality:            pd.nationality,
    currentCountry:         pd.current_country,
    currentCity:            pd.current_city,
    targetCountries:        pd.target_countries ?? [],
    targetLocations:        pd.target_locations ?? [],
    remotePreference:       pd.remote_preference ?? 'open',
    willingnessToRelocate:  pd.willingness_to_relocate ?? true,
    maxCommuteMiles:        pd.max_commute_miles ?? null,
    requiresVisaSponsorship: pd.requires_visa_sponsorship ?? false,
    currentVisaStatus:      pd.current_visa_status ?? null,
    preferredJobTypes:      pd.preferred_job_types ?? [],
    preferredSalaryMin:     pd.preferred_salary_min ?? null,
    preferredSalaryCurrency: pd.preferred_salary_currency ?? null,
    cvParsedData:           pd.cv_parsed_data,
    cvUploadedAt:           pd.cv_uploaded_at ?? null,
    cvFileUrl:              pd.raw_cv_url ?? null,
    skills:                 pd.skills ?? [],
    qualifications:         pd.qualifications ?? [],
    linkedinUrl:            pd.linkedin_url ?? null,
    createdAt:              pd.created_at,
    updatedAt:              pd.updated_at,
  }

  const eval_ = evalRow.data

  // Reconstruct a minimal JobListing from the stored evaluation
  const listing: JobListing = {
    jobUrl:       eval_.job_url,
    jobTitle:     eval_.job_title,
    companyName:  eval_.company_name,
    location:     eval_.location,
    salaryText:   null,
    salaryMin:    null,
    salaryMax:    null,
    salaryCurrency: null,
    description:  eval_.job_description ?? '',
    requirements: [],
    niceToHaves:  [],
    applicationDeadline: null,
    scrapedAt:    eval_.created_at,
    sourceType:   'pasted',
  }

  const gapReport = eval_.gap_report as GapReport | null

  // ── Build prompt and call Claude Sonnet ──
  const userPrompt = buildGenerateCvPrompt({
    listing,
    userProfile,
    format,
    gapReport,
    overallScore: eval_.overall_score,
    emphasis,
  })

  let aiText = ''
  try {
    const msg = await anthropic.messages.create(
      {
        model:      CLAUDE_MODELS.sonnet,
        max_tokens: 4096,
        system:     GENERATE_CV_SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: userPrompt }],
      },
      { timeout: CLAUDE_TIMEOUTS.cvGeneration },
    )
    const block = msg.content[0]
    if (block.type !== 'text') throw new Error('Unexpected response type')
    aiText = block.text.trim()
  } catch (err) {
    console.error('[cv/generate] Claude error:', err)
    return NextResponse.json(
      { error: 'CV generation failed. Please try again.' },
      { status: 502 },
    )
  }

  // ── Parse Claude JSON ──
  let cvData: GeneratedCvData
  try {
    const cleaned = aiText
      .replace(/^```(?:json)?\n?/m, '')
      .replace(/\n?```$/m, '')
      .trim()
    cvData = JSON.parse(cleaned)
    cvData.format = format // ensure format matches request
  } catch {
    console.error('[cv/generate] Invalid JSON from Claude:', aiText.slice(0, 500))
    return NextResponse.json(
      { error: 'CV generation returned invalid data. Please try again.' },
      { status: 502 },
    )
  }

  // ── Render HTML ──
  const htmlContent = renderCvHtml(cvData, format)

  // ── Insert DB record first (to get ID) ──
  const { data: cvRow, error: dbError } = await supabase
    .from('generated_cvs')
    .insert({
      user_id:        user.id,
      evaluation_id:  evaluationId,
      format,
      cv_data:        cvData,
      html_content:   htmlContent,
      pdf_url:        null,
      pdf_path:       null,
      pdf_generated_at: null,
    })
    .select('id')
    .single()

  if (dbError || !cvRow) {
    console.error('[cv/generate] DB insert error:', dbError?.message)
    return NextResponse.json(
      { error: 'Failed to save CV. Please try again.' },
      { status: 500 },
    )
  }

  // ── Generate PDF (non-blocking — update DB after) ──
  let pdfUrl: string | null = null
  let pdfPath: string | null = null

  try {
    const pdf = await generateAndStoreCvPdf(htmlContent, user.id, cvRow.id)
    pdfUrl  = pdf.publicUrl
    pdfPath = pdf.storagePath

    // Update record with PDF URL
    await supabase
      .from('generated_cvs')
      .update({ pdf_url: pdfUrl, pdf_path: pdfPath, pdf_generated_at: new Date().toISOString() })
      .eq('id', cvRow.id)
  } catch (pdfErr) {
    console.error('[cv/generate] PDF generation failed (non-fatal):', pdfErr)
    // Return CV without PDF — user can regenerate PDF from the preview page
  }

  // Fire-and-forget usage counter
  supabase
    .from('users')
    .update({ cvs_generated_this_month: (userRow.data.cvs_generated_this_month ?? 0) + 1 })
    .eq('id', user.id)
    .then(() => {})

  return NextResponse.json(
    {
      data: {
        id:          cvRow.id,
        evaluationId,
        format,
        cvData,
        htmlContent,
        pdfUrl,
        tailoringNotes: cvData.tailoringNotes,
      },
    },
    { status: 200 },
  )
}
