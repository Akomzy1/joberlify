import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

/** PUT /api/pipeline/[id] — update status, notes, dates, sponsor watch */
export async function PUT(request: Request, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    status?: string
    notes?: string | null
    appliedAt?: string | null
    nextActionAt?: string | null
    nextActionNote?: string | null
    salaryOffered?: number | null
    salaryCurrency?: string | null
    sponsorWatchOptIn?: boolean
  }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.status             !== undefined) updatePayload.status               = body.status
  if (body.notes              !== undefined) updatePayload.notes                 = body.notes
  if (body.appliedAt          !== undefined) updatePayload.applied_at            = body.appliedAt
  if (body.nextActionAt       !== undefined) updatePayload.next_action_at        = body.nextActionAt
  if (body.nextActionNote     !== undefined) updatePayload.next_action_note      = body.nextActionNote
  if (body.salaryOffered      !== undefined) updatePayload.salary_offered        = body.salaryOffered
  if (body.salaryCurrency     !== undefined) updatePayload.salary_currency       = body.salaryCurrency
  if (body.sponsorWatchOptIn  !== undefined) updatePayload.sponsor_watch_opt_in  = body.sponsorWatchOptIn

  const { data, error } = await supabase
    .from('pipeline_items')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, status, updated_at')
    .single()

  if (error || !data) {
    console.error('[pipeline] update error:', error?.message)
    return NextResponse.json({ error: 'Failed to update pipeline item.' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

/** DELETE /api/pipeline/[id] */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('pipeline_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[pipeline] delete error:', error.message)
    return NextResponse.json({ error: 'Failed to delete pipeline item.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
