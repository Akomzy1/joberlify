import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * GET /api/visa/soc-codes
 *
 * Public endpoint — no auth required.
 *
 * Query params:
 *   q        — search by occupation title or 4-digit code (min 2 chars)
 *   eligible — 'true' to return only eligible codes
 *   limit    — max 30 (default 15)
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const q        = searchParams.get('q')?.trim()
  const eligible = searchParams.get('eligible') === 'true'
  const limit    = Math.min(30, Math.max(1, parseInt(searchParams.get('limit') ?? '15', 10)))

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: 'Query (q) must be at least 2 characters' },
      { status: 400 },
    )
  }

  const safeQ = q.replace(/[%_]/g, '\\$&')

  // If query is purely numeric, match on soc_code; otherwise match on title
  const isCode = /^\d+$/.test(q)

  let query = supabase
    .from('uk_soc_codes')
    .select(
      'soc_code, occupation_title, rqf_level, eligibility_table, is_eligible, going_rate_annual, going_rate_new_entrant, on_immigration_salary_list, on_temporary_shortage_list, tsl_expiry_date, conditions, last_verified_at',
    )

  if (isCode) {
    query = query.ilike('soc_code', `${safeQ}%`)
  } else {
    query = query.ilike('occupation_title', `%${safeQ}%`)
  }

  if (eligible) {
    query = query.eq('is_eligible', true)
  }

  const { data, error } = await query
    .order('soc_code', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[visa/soc-codes] DB error:', error.message)
    return NextResponse.json({ error: 'Failed to search SOC codes' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}
