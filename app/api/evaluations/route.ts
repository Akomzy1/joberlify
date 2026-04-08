import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// GET /api/evaluations?page=1&limit=20&sort=date|grade&order=asc|desc
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const sort = searchParams.get('sort') ?? 'date'   // 'date' | 'grade' | 'score'
  const order = searchParams.get('order') === 'asc' ? true : false  // false = descending

  const offset = (page - 1) * limit

  // Column mapping for sort
  const sortColumn: Record<string, string> = {
    date: 'created_at',
    grade: 'overall_score',  // same ordering as grade
    score: 'overall_score',
  }
  const col = sortColumn[sort] ?? 'created_at'

  const { data, error, count } = await supabase
    .from('evaluations')
    .select(
      'id, job_title, company_name, location, job_url, overall_score, grade, recommendation, evaluation_summary, requires_visa_sponsorship_at_eval, created_at',
      { count: 'exact' },
    )
    .eq('user_id', user.id)
    .order(col, { ascending: order })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[evaluations] list error:', error.message)
    return NextResponse.json({ error: 'Failed to load evaluations.' }, { status: 500 })
  }

  const totalPages = Math.ceil((count ?? 0) / limit)

  return NextResponse.json({
    data: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages,
      hasMore: page < totalPages,
    },
  })
}
