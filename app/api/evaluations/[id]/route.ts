import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

// GET /api/evaluations/[id] — single evaluation detail
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)   // RLS + application-layer ownership
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Evaluation not found.' }, { status: 404 })
  }

  // Reshape DB row into the camelCase response shape
  return NextResponse.json({
    data: {
      id: data.id,
      jobUrl: data.job_url,
      jobTitle: data.job_title,
      companyName: data.company_name,
      location: data.location,
      scores: {
        role_match: data.score_role_match,
        skills_alignment: data.score_skills_alignment,
        experience_level: data.score_experience_level,
        growth_trajectory: data.score_growth_trajectory,
        culture_fit: data.score_culture_fit,
        compensation: data.score_compensation,
        location_fit: data.score_location_fit,
        company_stage: data.score_company_stage,
        role_impact: data.score_role_impact,
        long_term_value: data.score_long_term_value,
        ...(data.score_visa_feasibility !== null && {
          visa_feasibility: data.score_visa_feasibility,
        }),
      },
      overallScore: data.overall_score,
      grade: data.grade,
      recommendation: data.recommendation,
      evaluationSummary: data.evaluation_summary,
      gapReport: data.gap_report,
      growthRoadmap: data.growth_roadmap,
      requiresVisaSponsorship: data.requires_visa_sponsorship_at_eval,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  })
}

// DELETE /api/evaluations/[id] — remove an evaluation
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('evaluations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[evaluations] delete error:', error.message)
    return NextResponse.json({ error: 'Failed to delete evaluation.' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
