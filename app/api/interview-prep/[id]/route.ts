import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

// GET /api/interview-prep/[id]
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('interview_prep')
    .select(`
      id,
      evaluation_id,
      pipeline_item_id,
      star_stories,
      likely_questions,
      company_research_notes,
      created_at,
      updated_at,
      evaluations ( job_title, company_name, location, overall_score, grade )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Interview prep not found.' }, { status: 404 })
  }

  const eval_ = (data as any).evaluations ?? {}

  return NextResponse.json({
    data: {
      id:                   data.id,
      evaluationId:         data.evaluation_id,
      pipelineItemId:       data.pipeline_item_id,
      starStories:          data.star_stories ?? [],
      likelyQuestions:      data.likely_questions ?? [],
      companyResearchNotes: data.company_research_notes ?? '',
      createdAt:            data.created_at,
      updatedAt:            data.updated_at,
      jobTitle:             eval_.job_title ?? null,
      companyName:          eval_.company_name ?? null,
      location:             eval_.location ?? null,
      overallScore:         eval_.overall_score ?? null,
      grade:                eval_.grade ?? null,
    },
  })
}

// DELETE /api/interview-prep/[id]
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('interview_prep')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[interview-prep] delete error:', error.message)
    return NextResponse.json({ error: 'Failed to delete interview prep.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
