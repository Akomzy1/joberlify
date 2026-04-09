import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * GET /api/pipeline
 * Query params: status, grade, visa_status (comma-separated for multi), limit, offset
 *
 * Returns pipeline items joined with evaluation data (grade, score, location).
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const statusFilter  = searchParams.get('status')?.split(',').filter(Boolean) ?? []
  const gradeFilter   = searchParams.get('grade')?.split(',').filter(Boolean) ?? []
  const limit         = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') ?? '100', 10)))
  const offset        = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10))

  let query = supabase
    .from('pipeline_items')
    .select(`
      id,
      user_id,
      evaluation_id,
      job_title,
      company,
      job_url,
      status,
      applied_at,
      notes,
      salary_offered,
      salary_currency,
      next_action_at,
      next_action_note,
      sponsor_watch_opt_in,
      created_at,
      updated_at,
      evaluations (
        overall_score,
        grade,
        location,
        recommendation
      )
    `, { count: 'exact' })
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (statusFilter.length > 0) {
    query = query.in('status', statusFilter)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[pipeline] list error:', error.message)
    return NextResponse.json({ error: 'Failed to load pipeline.' }, { status: 500 })
  }

  // Shape + optional grade filter (done client-side since it comes from joined table)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let items: any[] = (data ?? []).map((row: any) => ({
    id:                 row.id,
    userId:             row.user_id,
    evaluationId:       row.evaluation_id,
    jobTitle:           row.job_title,
    company:            row.company,
    jobUrl:             row.job_url,
    status:             row.status,
    appliedAt:          row.applied_at,
    notes:              row.notes,
    salaryOffered:      row.salary_offered,
    salaryCurrency:     row.salary_currency,
    nextActionAt:       row.next_action_at,
    nextActionNote:     row.next_action_note,
    sponsorWatchOptIn:  row.sponsor_watch_opt_in,
    createdAt:          row.created_at,
    updatedAt:          row.updated_at,
    // from join
    jobLocation:        row.evaluations?.location ?? null,
    evaluationGrade:    row.evaluations?.grade ?? null,
    evaluationScore:    row.evaluations?.overall_score ?? null,
    recommendation:     row.evaluations?.recommendation ?? null,
  }))

  if (gradeFilter.length > 0) {
    items = items.filter((i) => i.evaluationGrade && gradeFilter.includes(i.evaluationGrade))
  }

  return NextResponse.json({ data: items, total: count ?? items.length })
}

/**
 * POST /api/pipeline
 * Body: { evaluationId?, jobTitle, company, jobUrl?, status?, notes? }
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    evaluationId?: string | null
    jobTitle: string
    company: string
    jobUrl?: string | null
    status?: string
    notes?: string | null
  }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.jobTitle?.trim()) return NextResponse.json({ error: 'jobTitle is required' }, { status: 400 })
  if (!body.company?.trim())  return NextResponse.json({ error: 'company is required' }, { status: 400 })

  // Check pipeline item limit for free tier
  const { data: userRow } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const tier = userRow?.subscription_tier ?? 'free'
  if (tier === 'free') {
    const { count } = await supabase
      .from('pipeline_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if ((count ?? 0) >= 10) {
      return NextResponse.json(
        { error: 'Free plan is limited to 10 pipeline items. Upgrade to Pro for unlimited tracking.', code: 'LIMIT_EXCEEDED' },
        { status: 403 },
      )
    }
  }

  const { data, error } = await supabase
    .from('pipeline_items')
    .insert({
      user_id:       user.id,
      evaluation_id: body.evaluationId ?? null,
      job_title:     body.jobTitle.trim(),
      company:       body.company.trim(),
      job_url:       body.jobUrl ?? null,
      status:        body.status ?? 'evaluated',
      notes:         body.notes ?? null,
    })
    .select('id, status, created_at')
    .single()

  if (error) {
    console.error('[pipeline] insert error:', error.message)
    return NextResponse.json({ error: 'Failed to add pipeline item.' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
